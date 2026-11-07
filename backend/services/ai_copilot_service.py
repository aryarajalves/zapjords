import os
from typing import Dict, Any, List, Optional, Tuple
import httpx
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from models import AppConfig, ChatConversation, ChatMessage, SalesDeal, SalesPipeline, SalesPipelineStage, AIUsageLog, AIPromptPreset
from core.encryption import encrypt_token, decrypt_token
from core.logger import setup_logger

logger = setup_logger("ai_copilot")

# Taxa de câmbio padrão USD -> BRL (pode ser sobrescrita nas configurações)
DEFAULT_USD_TO_BRL = 5.70

# Catálogo oficial dos modelos de IA e preços por 1 Milhão de Tokens (USD)
MODELS_CATALOG: Dict[str, Dict[str, Any]] = {
    # === Família GPT-6 (Fronteira e Raciocínio Profundo) ===
    "gpt-6-astra": {
        "id": "gpt-6-astra",
        "name": "GPT-6 Astra",
        "generation": "GPT-6",
        "badge": "Raciocínio Máximo",
        "description": "Modelo topo de linha para vendas consultivas de alta complexidade e análise profunda.",
        "input_per_million": 10.00,
        "output_per_million": 50.00,
        "context_window": "1M tokens"
    },
    "gpt-6.1-sol": {
        "id": "gpt-6.1-sol",
        "name": "GPT-6.1 Sol",
        "generation": "GPT-6",
        "badge": "Recomendado (Vendas)",
        "description": "Excelente equilíbrio de inteligência avançada, velocidade e custo otimizado para comercial.",
        "input_per_million": 2.00,
        "output_per_million": 10.00,
        "context_window": "500k tokens"
    },
    "gpt-6.1-terra": {
        "id": "gpt-6.1-terra",
        "name": "GPT-6.1 Terra",
        "generation": "GPT-6",
        "badge": "Equilibrado Geral",
        "description": "Modelo versátil para conversas cotidianas, ágil e eficiente.",
        "input_per_million": 1.00,
        "output_per_million": 5.00,
        "context_window": "250k tokens"
    },
    "gpt-6-luna": {
        "id": "gpt-6-luna",
        "name": "GPT-6 Luna",
        "generation": "GPT-6",
        "badge": "Ultra Econômico",
        "description": "Alta velocidade e custo ultra baixo, ideal para grande volume de mensagens.",
        "input_per_million": 0.10,
        "output_per_million": 0.50,
        "context_window": "128k tokens"
    },

    # === Família GPT-5.6 e GPT-5 ===
    "gpt-5.6-sol": {
        "id": "gpt-5.6-sol",
        "name": "GPT-5.6 Sol",
        "generation": "GPT-5.6",
        "badge": "Flagship 5.6",
        "description": "Alta performance em resolução de problemas e objeções estruturadas.",
        "input_per_million": 4.00,
        "output_per_million": 20.00,
        "context_window": "250k tokens"
    },
    "gpt-5.6-terra": {
        "id": "gpt-5.6-terra",
        "name": "GPT-5.6 Terra",
        "generation": "GPT-5.6",
        "badge": "Intermediário 5.6",
        "description": "Custo moderado para operações consolidadas de atendimento.",
        "input_per_million": 2.00,
        "output_per_million": 12.00,
        "context_window": "128k tokens"
    },
    "gpt-5.6-luna": {
        "id": "gpt-5.6-luna",
        "name": "GPT-5.6 Luna",
        "generation": "GPT-5.6",
        "badge": "Econômico 5.6",
        "description": "Respostas rápidas e sucintas com baixo consumo financeiro.",
        "input_per_million": 0.20,
        "output_per_million": 1.20,
        "context_window": "128k tokens"
    },
    "gpt-5": {
        "id": "gpt-5",
        "name": "GPT-5",
        "generation": "GPT-5",
        "badge": "Standard 5.0",
        "description": "Base sólida da geração GPT-5 para análise de contexto.",
        "input_per_million": 3.00,
        "output_per_million": 15.00,
        "context_window": "128k tokens"
    },

    # === Família GPT-4.1 e GPT-4o ===
    "gpt-4.1": {
        "id": "gpt-4.1",
        "name": "GPT-4.1",
        "generation": "GPT-4",
        "badge": "Refinado 4.1",
        "description": "Excelente precisão na redação de mensagens persuasivas.",
        "input_per_million": 2.00,
        "output_per_million": 8.00,
        "context_window": "128k tokens"
    },
    "gpt-4o": {
        "id": "gpt-4o",
        "name": "GPT-4o",
        "generation": "GPT-4",
        "badge": "Clássico Multimodal",
        "description": "Modelo consagrado de alta capacidade e respostas dinâmicas.",
        "input_per_million": 2.50,
        "output_per_million": 10.00,
        "context_window": "128k tokens"
    },
    "gpt-4o-mini": {
        "id": "gpt-4o-mini",
        "name": "GPT-4o Mini",
        "generation": "GPT-4",
        "badge": "Econômico Rápido",
        "description": "Respostas imediatas com custo reduzido por token.",
        "input_per_million": 0.15,
        "output_per_million": 0.60,
        "context_window": "128k tokens"
    }
}

DEFAULT_BASE_PROMPT = """Você é o Copiloto de Atendimento e Vendas do ZapVoice. Seu papel é auxiliar o atendente/vendedor comercial a responder clientes pelo WhatsApp com máxima persuasão, empatia e conversão.

DIRETRIZES FUNDAMENTAIS:
1. Respostas Humanas: Escreva como uma pessoa real no WhatsApp — use parágrafos curtos, linguagem acolhedora e evite termos engessados ou formais demais.
2. Análise do Lead: Utilize as informações fornecidas do contato (Nome, Pipeline de Vendas, Estágio no Kanban, Instagram, Histórico de Mensagens e Notas Internas) para dar respostas personalizadas.
3. Janela de 24h:
   - Se a Janela de 24h estiver ABERTA, sugira mensagens diretas, perguntas de engajamento ou quebra de objeções.
   - Se a Janela de 24h estiver FECHADA, lembre o atendente de que no WhatsApp Oficial apenas Templates HSM aprovados podem iniciar o contato.
4. Estrutura de Retorno:
   - Sempre forneça uma mensagem pronta entre aspas ou bloco para o vendedor apenas copiar e enviar.
   - Inclua uma dica rápida (1 a 2 linhas) explicando a psicologia da abordagem de venda adotada.
5. Foco em Fechamento: Conduza suavemente para o próximo passo (ex: tirar dúvidas, agendar reunião, enviar link de pagamento ou validar interesse)."""

def calculate_token_cost(model_id: str, prompt_tokens: int, completion_tokens: int, usd_to_brl: float = DEFAULT_USD_TO_BRL) -> Tuple[float, float]:
    """Calcula o custo financeiro em USD e BRL com base na tabela do modelo."""
    model_info = MODELS_CATALOG.get(model_id, MODELS_CATALOG["gpt-6.1-sol"])
    in_rate = model_info.get("input_per_million", 2.0) / 1_000_000.0
    out_rate = model_info.get("output_per_million", 10.0) / 1_000_000.0

    cost_usd = (prompt_tokens * in_rate) + (completion_tokens * out_rate)
    cost_brl = cost_usd * usd_to_brl
    return round(cost_usd, 6), round(cost_brl, 6)

def get_ai_settings(db: Session, client_id: int) -> Dict[str, Any]:
    """Recupera as configurações de IA ativas para o cliente."""
    configs = db.query(AppConfig).filter(AppConfig.client_id == client_id).all()
    cfg_map = {c.key: c.value for c in configs}

    raw_api_key = cfg_map.get("AI_API_KEY") or os.getenv("OPENAI_API_KEY") or ""
    decrypted_key = decrypt_token(raw_api_key) if raw_api_key else ""

    model = cfg_map.get("AI_MODEL", "gpt-6.1-sol")
    if model not in MODELS_CATALOG:
        model = "gpt-6.1-sol"

    system_prompt = cfg_map.get("AI_SYSTEM_PROMPT") or DEFAULT_BASE_PROMPT
    temperature = float(cfg_map.get("AI_TEMPERATURE", "0.7"))
    usd_to_brl = float(cfg_map.get("AI_USD_TO_BRL", str(DEFAULT_USD_TO_BRL)))

    is_env_key = not bool(cfg_map.get("AI_API_KEY")) and bool(os.getenv("OPENAI_API_KEY"))

    return {
        "model": model,
        "api_key": decrypted_key,
        "has_api_key": bool(decrypted_key),
        "is_env_key": is_env_key,
        "system_prompt": system_prompt,
        "temperature": temperature,
        "usd_to_brl": usd_to_brl,
        "default_prompt": DEFAULT_BASE_PROMPT
    }

def build_lead_context(db: Session, client_id: int, conversation_id: int) -> str:
    """Extrai todo o contexto rico do contato e conversa para enriquecer o prompt da IA."""
    convo = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id,
        ChatConversation.client_id == client_id
    ).first()

    if not convo:
        return "Nenhum contato selecionado no momento."

    # Status da janela de 24h
    window_open = False
    window_status_str = "Fechada (Apenas Templates permitidos)"
    if convo.last_contact_message_at:
        from datetime import datetime, timezone, timedelta
        now = datetime.now(timezone.utc)
        last_msg = convo.last_contact_message_at
        if last_msg.tzinfo is None:
            last_msg = last_msg.replace(tzinfo=timezone.utc)
        diff = now - last_msg
        if diff < timedelta(hours=24):
            remaining_mins = int((timedelta(hours=24) - diff).total_seconds() / 60)
            window_open = True
            window_status_str = f"Aberta (Restam aproximadamente {remaining_mins // 60}h {remaining_mins % 60}m)"

    # Buscar dados do CRM / Pipeline
    deals = db.query(SalesDeal).filter(
        SalesDeal.contact_phone == convo.phone,
        SalesDeal.client_id == client_id
    ).all()

    pipeline_info = []
    for deal in deals:
        stage_name = deal.stage.name if deal.stage else "Etapa Desconhecida"
        pipeline_name = deal.stage.pipeline.name if deal.stage and deal.stage.pipeline else "Pipeline"
        pipeline_info.append(f"- Pipeline '{pipeline_name}': Etapa '{stage_name}' | Valor: R$ {deal.value or 0.0}")

    # Últimas 15 mensagens e notas internas
    recent_msgs = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conversation_id
    ).order_by(desc(ChatMessage.timestamp)).limit(15).all()
    recent_msgs.reverse()

    history_lines = []
    for msg in recent_msgs:
        sender = "Cliente" if msg.sender_type == "customer" else ("Atendente/Comercial" if msg.sender_type == "user" else "Sistema/Nota")
        content = (msg.content or "").strip()
        if content:
            history_lines.append(f"[{sender}]: {content}")

    context_str = f"""--- DADOS DO LEAD ATUAL ---
Nome: {convo.contact_name or 'Sem nome informado'}
Telefone: {convo.phone or 'Não informado'}
Instagram: {convo.instagram or 'Não vinculado'}
ID Conversa: #{convo.id}
Janela 24h: {window_status_str}
Anotação Privada Geral: {convo.private_note or 'Nenhuma'}

--- POSIÇÃO NO KANBAN / CRM ---
{chr(10).join(pipeline_info) if pipeline_info else 'Contato não está em nenhuma pipeline de vendas no momento.'}

--- HISTÓRICO RECENTE DE MENSAGENS E NOTAS ---
{chr(10).join(history_lines) if history_lines else 'Nenhuma mensagem recente registrada.'}
---------------------------"""
    return context_str

async def execute_ai_completion(
    db: Session,
    client_id: int,
    user_id: Optional[int],
    message: str,
    conversation_id: Optional[int] = None,
    history: Optional[List[Dict[str, str]]] = None,
    override_model: Optional[str] = None,
    prompt_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Executa a chamada assíncrona ao provedor OpenAI com o modelo configurado,
    calcula tokens, custos e persiste no histórico de auditoria/financeiro.
    """
    config = get_ai_settings(db, client_id)
    api_key = config["api_key"]

    if not api_key:
        raise ValueError("Chave de API da OpenAI não configurada. Acesse as Configurações -> Inteligência Artificial e cadastre sua chave.")

    model = override_model or config["model"]
    system_prompt = config["system_prompt"]
    # Se prompt_id foi especificado, prioriza o prompt do produto selecionado
    if prompt_id:
        preset = db.query(AIPromptPreset).filter(
            AIPromptPreset.id == prompt_id,
            AIPromptPreset.client_id == client_id
        ).first()
        if preset and preset.prompt_text:
            system_prompt = preset.prompt_text
    else:
        # Se nenhum prompt_id foi passado, tenta usar o preset default do cliente se existir
        default_preset = db.query(AIPromptPreset).filter(
            AIPromptPreset.client_id == client_id,
            AIPromptPreset.is_default == True
        ).first()
        if default_preset and default_preset.prompt_text:
            system_prompt = default_preset.prompt_text
    temperature = config["temperature"]
    usd_to_brl = config["usd_to_brl"]

    # Se uma conversa estiver ativa, adiciona contexto do lead
    lead_name = None
    lead_phone = None
    if conversation_id:
        lead_context = build_lead_context(db, client_id, conversation_id)
        system_prompt += f"\n\n{lead_context}"
        convo = db.query(ChatConversation).filter(ChatConversation.id == conversation_id).first()
        if convo:
            lead_name = convo.contact_name
            lead_phone = convo.phone

    # Montar histórico de mensagens para a API
    messages_payload: List[Dict[str, str]] = [
        {"role": "system", "content": system_prompt}
    ]

    if history and isinstance(history, list):
        for h in history[-8:]:  # Limita aos últimos 8 turnos do chat para economizar tokens
            role = h.get("role")
            content = h.get("content", "")
            if role in ("user", "assistant") and content:
                messages_payload.append({"role": role, "content": content})

    messages_payload.append({"role": "user", "content": message})

    # Chamada HTTP assíncrona à API da OpenAI
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": messages_payload
    }

    # Modelos recentes das famílias GPT-5, GPT-6 e modelos de raciocínio (o1/o3) não aceitam temperature diferente do padrão (1)
    is_reasoning_model = any(gen in model.lower() for gen in ["gpt-5", "gpt-6", "o1", "o3"])
    if not is_reasoning_model and temperature is not None:
        payload["temperature"] = temperature

    async with httpx.AsyncClient(timeout=45.0) as client:
        try:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload
            )
            # Resiliência: se a OpenAI recusar devido a temperature, retenta imediatamente sem o parâmetro
            if response.status_code == 400 and "temperature" in response.text.lower() and "temperature" in payload:
                logger.warning(f"⚠️ [AI_COPILOT] Modelo {model} não suporta 'temperature'. Retentando requisição sem esse parâmetro...")
                payload.pop("temperature", None)
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    json=payload
                )
        except Exception as e:
            logger.error(f"❌ [AI_COPILOT] Falha de conexão com a OpenAI: {e}")
            raise RuntimeError(f"Erro de comunicação com a OpenAI: {e}")

    if response.status_code != 200:
        err_detail = response.text
        try:
            err_json = response.json()
            err_detail = err_json.get("error", {}).get("message", response.text)
        except Exception:
            pass
        logger.error(f"❌ [AI_COPILOT] Erro retornado pela OpenAI ({response.status_code}): {err_detail}")
        raise RuntimeError(f"OpenAI API ({response.status_code}): {err_detail}")

    data = response.json()
    choices = data.get("choices", [])
    if not choices:
        raise RuntimeError("A OpenAI não retornou nenhuma resposta válida.")

    reply_content = choices[0].get("message", {}).get("content", "").strip()
    usage = data.get("usage", {})
    prompt_tokens = usage.get("prompt_tokens", 0)
    completion_tokens = usage.get("completion_tokens", 0)
    total_tokens = usage.get("total_tokens", prompt_tokens + completion_tokens)

    cost_usd, cost_brl = calculate_token_cost(model, prompt_tokens, completion_tokens, usd_to_brl)

    # Persistir log de auditoria e financeiro
    usage_log = AIUsageLog(
        client_id=client_id,
        user_id=user_id,
        conversation_id=conversation_id,
        contact_phone=lead_phone,
        contact_name=lead_name,
        model=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
        cost_usd=cost_usd,
        cost_brl=cost_brl,
        question_preview=message[:500],
        response_preview=reply_content[:500]
    )
    db.add(usage_log)
    db.commit()
    db.refresh(usage_log)

    return {
        "reply": reply_content,
        "model": model,
        "usage": {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": total_tokens,
            "cost_usd": cost_usd,
            "cost_brl": cost_brl
        },
        "log_id": usage_log.id
    }

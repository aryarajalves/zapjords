from typing import List, Dict, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from pydantic import BaseModel, Field

from core.deps import get_db, get_current_user, get_validated_client_id
from models import User, AppConfig, AIUsageLog, AIPromptPreset
from core.encryption import encrypt_token, decrypt_token
from core.logger import setup_logger
from services.ai_copilot_service import (
    MODELS_CATALOG,
    DEFAULT_BASE_PROMPT,
    DEFAULT_USD_TO_BRL,
    get_ai_settings,
    execute_ai_completion
)

logger = setup_logger("ai_copilot_router")
router = APIRouter(tags=["AI Copilot"])

# --- Schemas ---
class AISettingsUpdateRequest(BaseModel):
    model: Optional[str] = Field(None, description="Identificador do modelo LLM")
    api_key: Optional[str] = Field(None, description="Chave de API OpenAI")
    system_prompt: Optional[str] = Field(None, description="Prompt customizável do sistema")
    temperature: Optional[float] = Field(None, ge=0.0, le=1.5, description="Temperatura do modelo")
    usd_to_brl: Optional[float] = Field(None, gt=0.0, description="Taxa de câmbio USD para BRL")

class AIChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Mensagem ou pergunta do atendente comercial")
    conversation_id: Optional[int] = Field(None, description="ID da conversa no WhatsApp para injetar contexto")
    history: Optional[List[Dict[str, str]]] = Field(None, description="Histórico prévio da conversa com a IA")
    model: Optional[str] = Field(None, description="Sobrescrever modelo temporariamente para o chat")
    prompt_id: Optional[int] = Field(None, description="ID do preset de prompt de produto a ser utilizado")

class AIPromptPresetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Nome identificador do produto ou preset")
    product_identifier: Optional[str] = Field(None, max_length=150, description="Identificador ou nome do produto")
    prompt_text: str = Field(..., min_length=1, description="Instruções de vendas e contexto do produto")
    is_default: Optional[bool] = Field(False, description="Se este é o prompt padrão para o comercial")

class AIPromptPresetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    product_identifier: Optional[str] = None
    prompt_text: Optional[str] = None
    is_default: Optional[bool] = None

# --- Rotas ---

@router.get("/models")
def list_available_models():
    """Retorna o catálogo completo de modelos disponíveis com metadados e preços."""
    return {
        "models": list(MODELS_CATALOG.values()),
        "default_model": "gpt-6.1-sol"
    }

@router.get("/settings")
def get_settings(
    client_id: int = Depends(get_validated_client_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retorna as configurações ativas de IA com chave de API mascarada."""
    cfg = get_ai_settings(db, client_id)
    raw_key = cfg["api_key"]
    masked_key = ""
    if raw_key:
        if len(raw_key) > 8:
            masked_key = f"{raw_key[:3]}...{raw_key[-4:]}"
        else:
            masked_key = "sk-***"

    return {
        "model": cfg["model"],
        "has_api_key": cfg["has_api_key"],
        "is_env_key": cfg.get("is_env_key", False),
        "masked_api_key": masked_key,
        "system_prompt": cfg["system_prompt"],
        "default_prompt": cfg["default_prompt"],
        "temperature": cfg["temperature"],
        "usd_to_brl": cfg["usd_to_brl"]
    }

@router.post("/settings")
def update_settings(
    payload: AISettingsUpdateRequest,
    client_id: int = Depends(get_validated_client_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Atualiza as configurações de IA do cliente."""
    # Mapeamento chave -> valor para persistir em AppConfig
    updates = {}
    if payload.model:
        if payload.model not in MODELS_CATALOG:
            raise HTTPException(status_code=400, detail="Modelo inválido ou não suportado.")
        updates["AI_MODEL"] = payload.model

    if payload.api_key is not None:
        clean_key = payload.api_key.strip()
        if clean_key:
            updates["AI_API_KEY"] = encrypt_token(clean_key)

    if payload.system_prompt is not None:
        updates["AI_SYSTEM_PROMPT"] = payload.system_prompt.strip()

    if payload.temperature is not None:
        updates["AI_TEMPERATURE"] = str(payload.temperature)

    if payload.usd_to_brl is not None:
        updates["AI_USD_TO_BRL"] = str(payload.usd_to_brl)

    for k, v in updates.items():
        cfg = db.query(AppConfig).filter(AppConfig.client_id == client_id, AppConfig.key == k).first()
        if cfg:
            cfg.value = v
        else:
            cfg = AppConfig(client_id=client_id, key=k, value=v)
            db.add(cfg)

    db.commit()
    logger.info(f"✅ [AI_SETTINGS] Configurações de IA atualizadas para client_id={client_id}")
    return {"status": "success", "message": "Configurações de IA salvas com sucesso!"}

@router.post("/chat")
async def chat_with_copilot(
    payload: AIChatRequest,
    client_id: int = Depends(get_validated_client_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Interage diretamente com o Copiloto de IA carregando contexto do lead e registrando consumo."""
    try:
        result = await execute_ai_completion(
            db=db,
            client_id=client_id,
            user_id=current_user.id if current_user else None,
            message=payload.message,
            conversation_id=payload.conversation_id,
            history=payload.history,
            override_model=payload.model,
            prompt_id=payload.prompt_id
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=502, detail=str(re))
    except Exception as e:
        logger.error(f"❌ [AI_COPILOT_CHAT] Erro inesperado: {e}")
        raise HTTPException(status_code=500, detail="Falha ao processar solicitação de IA.")

@router.get("/financial")
def get_financial_summary(
    client_id: int = Depends(get_validated_client_id),
    current_user: User = Depends(get_current_user),
    limit: int = Query(30, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Retorna métricas financeiras de consumo de tokens e custos em USD/BRL."""
    # Totais consolidados
    totals = db.query(
        func.count(AIUsageLog.id).label("total_calls"),
        func.sum(AIUsageLog.total_tokens).label("total_tokens"),
        func.sum(AIUsageLog.prompt_tokens).label("total_prompt_tokens"),
        func.sum(AIUsageLog.completion_tokens).label("total_completion_tokens"),
        func.sum(AIUsageLog.cost_usd).label("total_cost_usd"),
        func.sum(AIUsageLog.cost_brl).label("total_cost_brl")
    ).filter(AIUsageLog.client_id == client_id).first()

    total_calls = totals.total_calls or 0
    total_tokens = totals.total_tokens or 0
    total_cost_usd = float(totals.total_cost_usd or 0.0)
    total_cost_brl = float(totals.total_cost_brl or 0.0)

    avg_cost_usd = (total_cost_usd / total_calls) if total_calls > 0 else 0.0
    avg_cost_brl = (total_cost_brl / total_calls) if total_calls > 0 else 0.0

    # Agrupamento por modelo
    by_model_query = db.query(
        AIUsageLog.model,
        func.count(AIUsageLog.id).label("calls"),
        func.sum(AIUsageLog.total_tokens).label("tokens"),
        func.sum(AIUsageLog.cost_usd).label("cost_usd"),
        func.sum(AIUsageLog.cost_brl).label("cost_brl")
    ).filter(AIUsageLog.client_id == client_id).group_by(AIUsageLog.model).all()

    by_model = [
        {
            "model": r.model,
            "model_name": MODELS_CATALOG.get(r.model, {}).get("name", r.model),
            "calls": r.calls,
            "tokens": r.tokens or 0,
            "cost_usd": round(float(r.cost_usd or 0.0), 6),
            "cost_brl": round(float(r.cost_brl or 0.0), 6)
        }
        for r in by_model_query
    ]

    # Últimos registros individuais
    recent_logs_query = db.query(AIUsageLog).filter(
        AIUsageLog.client_id == client_id
    ).order_by(desc(AIUsageLog.created_at)).limit(limit).all()

    recent_logs = [
        {
            "id": log.id,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "model": log.model,
            "model_name": MODELS_CATALOG.get(log.model, {}).get("name", log.model),
            "contact_name": log.contact_name,
            "contact_phone": log.contact_phone,
            "prompt_tokens": log.prompt_tokens,
            "completion_tokens": log.completion_tokens,
            "total_tokens": log.total_tokens,
            "cost_usd": round(log.cost_usd, 6),
            "cost_brl": round(log.cost_brl, 6),
            "question_preview": log.question_preview,
            "response_preview": log.response_preview
        }
        for log in recent_logs_query
    ]

    return {
        "summary": {
            "total_calls": total_calls,
            "total_tokens": total_tokens,
            "total_cost_usd": round(total_cost_usd, 4),
            "total_cost_brl": round(total_cost_brl, 4),
            "avg_cost_usd": round(avg_cost_usd, 6),
            "avg_cost_brl": round(avg_cost_brl, 6)
        },
        "by_model": by_model,
        "recent_logs": recent_logs
    }


# --- Endpoints de Prompts por Produto / Presets ---

@router.get("/prompts")
def list_prompt_presets(
    client_id: int = Depends(get_validated_client_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lista todos os prompts presets de produtos configurados pelo cliente."""
    presets = db.query(AIPromptPreset).filter(
        AIPromptPreset.client_id == client_id
    ).order_by(AIPromptPreset.is_default.desc(), AIPromptPreset.id.asc()).all()

    # Se ainda não tiver nenhum preset, cria o preset inicial com o prompt padrão
    if not presets:
        cfg = get_ai_settings(db, client_id)
        default_p = AIPromptPreset(
            client_id=client_id,
            name="Geral (Vendas)",
            product_identifier="Geral",
            prompt_text=cfg.get("system_prompt") or DEFAULT_BASE_PROMPT,
            is_default=True
        )
        db.add(default_p)
        db.commit()
        db.refresh(default_p)
        presets = [default_p]

    return {
        "prompts": [
            {
                "id": p.id,
                "name": p.name,
                "product_identifier": p.product_identifier,
                "prompt_text": p.prompt_text,
                "is_default": p.is_default,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "updated_at": p.updated_at.isoformat() if p.updated_at else None
            }
            for p in presets
        ]
    }

@router.post("/prompts")
def create_prompt_preset(
    payload: AIPromptPresetCreate,
    client_id: int = Depends(get_validated_client_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cria um novo preset de prompt vinculado a um produto ou contexto."""
    if payload.is_default:
        db.query(AIPromptPreset).filter(
            AIPromptPreset.client_id == client_id
        ).update({"is_default": False})

    new_preset = AIPromptPreset(
        client_id=client_id,
        name=payload.name.strip(),
        product_identifier=payload.product_identifier.strip() if payload.product_identifier else None,
        prompt_text=payload.prompt_text.strip(),
        is_default=bool(payload.is_default)
    )
    db.add(new_preset)
    db.commit()
    db.refresh(new_preset)

    logger.info(f"✅ [AI_PROMPTS] Novo prompt preset criado: '{new_preset.name}' (id={new_preset.id}) para client_id={client_id}")
    return {
        "status": "success",
        "preset": {
            "id": new_preset.id,
            "name": new_preset.name,
            "product_identifier": new_preset.product_identifier,
            "prompt_text": new_preset.prompt_text,
            "is_default": new_preset.is_default
        }
    }

@router.put("/prompts/{prompt_id}")
def update_prompt_preset(
    prompt_id: int,
    payload: AIPromptPresetUpdate,
    client_id: int = Depends(get_validated_client_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Atualiza um preset de prompt existente."""
    preset = db.query(AIPromptPreset).filter(
        AIPromptPreset.id == prompt_id,
        AIPromptPreset.client_id == client_id
    ).first()

    if not preset:
        raise HTTPException(status_code=404, detail="Prompt preset não encontrado.")

    if payload.is_default:
        db.query(AIPromptPreset).filter(
            AIPromptPreset.client_id == client_id,
            AIPromptPreset.id != prompt_id
        ).update({"is_default": False})
        preset.is_default = True
    elif payload.is_default is False:
        preset.is_default = False

    if payload.name is not None:
        preset.name = payload.name.strip()
    if payload.product_identifier is not None:
        preset.product_identifier = payload.product_identifier.strip()
    if payload.prompt_text is not None:
        preset.prompt_text = payload.prompt_text.strip()

    db.commit()
    db.refresh(preset)

    logger.info(f"✅ [AI_PROMPTS] Prompt preset {prompt_id} atualizado para client_id={client_id}")
    return {
        "status": "success",
        "preset": {
            "id": preset.id,
            "name": preset.name,
            "product_identifier": preset.product_identifier,
            "prompt_text": preset.prompt_text,
            "is_default": preset.is_default
        }
    }

@router.delete("/prompts/{prompt_id}")
def delete_prompt_preset(
    prompt_id: int,
    client_id: int = Depends(get_validated_client_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deleta um preset de prompt (não permite excluir caso seja o único)."""
    count = db.query(AIPromptPreset).filter(AIPromptPreset.client_id == client_id).count()
    if count <= 1:
        raise HTTPException(status_code=400, detail="Você não pode excluir o único prompt cadastrado.")

    preset = db.query(AIPromptPreset).filter(
        AIPromptPreset.id == prompt_id,
        AIPromptPreset.client_id == client_id
    ).first()

    if not preset:
        raise HTTPException(status_code=404, detail="Prompt preset não encontrado.")

    was_default = preset.is_default
    db.delete(preset)
    db.commit()

    # Se apagou o padrão, elege o primeiro restante como default
    if was_default:
        first_remaining = db.query(AIPromptPreset).filter(
            AIPromptPreset.client_id == client_id
        ).order_by(AIPromptPreset.id.asc()).first()
        if first_remaining:
            first_remaining.is_default = True
            db.commit()

    logger.info(f"🗑️ [AI_PROMPTS] Prompt preset {prompt_id} deletado para client_id={client_id}")
    return {"status": "success", "message": "Prompt de produto removido com sucesso."}

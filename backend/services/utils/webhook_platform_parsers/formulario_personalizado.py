import re
import unicodedata
from typing import Dict, Any, Optional
from core.logger import logger


def _normalize_text(text: str) -> str:
    """Normaliza texto removendo acentos e convertendo para minúsculas para comparação semântica."""
    if not text:
        return ""
    nfkd = unicodedata.normalize('NFKD', str(text))
    ascii_text = ''.join([c for c in nfkd if not unicodedata.combining(c)])
    return ascii_text.strip().lower()


def _clean_slug(text: str) -> str:
    """Converte pergunta para chave/slug de variável amigável (ex: 'Qual é o seu WhatsApp?' -> 'qual_e_o_seu_whatsapp')."""
    if not text:
        return ""
    norm = _normalize_text(text)
    cleaned = re.sub(r'[^a-zA-Z0-9\s_]', '', norm)
    slug = re.sub(r'\s+', '_', cleaned.strip())
    return slug[:60].strip('_')


def _format_answer(content: Any) -> str:
    """Converte o conteúdo da resposta para string limpa."""
    if content is None:
        return ""
    if isinstance(content, list):
        return ", ".join(str(c).strip() for c in content if c is not None and str(c).strip())
    if isinstance(content, bool):
        return "Sim" if content else "Não"
    return str(content).strip()


def _is_valid_email(val: str) -> bool:
    """Verifica se o valor possui formato válido de e-mail."""
    if not val or "@" not in val or "." not in val:
        return False
    email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    return bool(re.match(email_regex, val.strip()))


def _is_phone_candidate(val: str) -> bool:
    """Verifica se a resposta possui formato provável de telefone/WhatsApp."""
    if not val:
        return False
    digits = re.sub(r'\D', '', str(val))
    # Telefones válidos BR/internacionais com DDD normalmente têm entre 10 e 15 dígitos
    if 10 <= len(digits) <= 15:
        # Se começar com +, tem fortíssimo indício de telefone
        if str(val).strip().startswith("+"):
            return True
        # Se for puramente dígitos e tamanho compatível
        if len(digits) in (10, 11, 12, 13):
            return True
    return False


def parse_formulario_personalizado(payload: dict, result: dict) -> None:
    """
    Parser para webhooks de Formulários Personalizados (custom forms).
    Detecta automaticamente campos de Nome, WhatsApp e E-mail por heurística semântica
    e validação de conteúdo (Opção 1), mapeando todas as demais perguntas como variáveis dinâmicas.
    """
    # 1. Metadados do formulário
    form_id = str(payload.get("form_id") or "").strip()
    form_slug = str(payload.get("form_slug") or "").strip()
    form_title = str(payload.get("form_title") or "").strip()
    is_test = payload.get("is_test")
    created_at = payload.get("created_at")

    if created_at:
        result["event_time"] = created_at

    # 2. Status e Tipo do Evento
    result["event_type"] = "formulario"
    result["raw_status"] = "Formulário"

    # 3. Nome do Produto (adota o título do formulário)
    product_name = form_title or (f"Formulário - {form_slug}" if form_slug else "Formulário Personalizado")
    result["product_name"] = product_name

    # 4. Processamento das respostas (answers)
    answers_raw = payload.get("answers")
    if isinstance(answers_raw, list):
        answers_list = answers_raw
    elif isinstance(answers_raw, dict):
        answers_list = list(answers_raw.values())
    else:
        answers_list = []

    extracted_name: Optional[str] = None
    extracted_phone: Optional[str] = None
    extracted_email: Optional[str] = None
    extracted_city: Optional[str] = None

    variables: Dict[str, str] = {}
    custom_fields: Dict[str, str] = {}

    # Injeta metadados nas variáveis
    if form_id:
        variables["form_id"] = form_id
        custom_fields["form_id"] = form_id
    if form_slug:
        variables["form_slug"] = form_slug
        custom_fields["form_slug"] = form_slug
    if form_title:
        variables["form_title"] = form_title
        custom_fields["form_title"] = form_title
    if is_test is not None:
        variables["is_test"] = "Sim" if is_test else "Não"

    # Palavras-chave semânticas
    PHONE_KEYWORDS = ["whatsapp", "whats", "zap", "celular", "telefone", "phone", "tel", "mobile", "contato"]
    NAME_STRONG_KEYWORDS = [
        "nome completo", "qual e o seu nome", "qual seu nome", "seu nome",
        "como prefere ser chamado", "como podemos te chamar", "nome e sobrenome",
        "primeiro nome", "seu nome completo"
    ]
    NAME_EXCLUDE_KEYWORDS = ["email", "whatsapp", "whats", "telefone", "celular", "empresa", "mae", "pai", "indicou", "arquivo"]

    for item in answers_list:
        if not isinstance(item, dict):
            continue

        # Extrai pergunta e resposta suportando variações de nomenclaturas comuns
        question = str(
            item.get("question") or
            item.get("title") or
            item.get("pergunta") or
            item.get("label") or
            item.get("fieldTitle") or
            ""
        ).strip()

        raw_answer = (
            item.get("answer") if "answer" in item else
            item.get("value") if "value" in item else
            item.get("resposta") if "resposta" in item else
            item.get("conteudo") if "conteudo" in item else
            item.get("content")
        )

        val_str = _format_answer(raw_answer)
        if not val_str:
            continue

        q_norm = _normalize_text(question)
        q_slug = _clean_slug(question)

        # Registra slug nas variáveis dinâmicas
        if q_slug:
            variables[q_slug] = val_str
            custom_fields[q_slug] = val_str
        if question:
            custom_fields[question] = val_str

        # --- A. DETECÇÃO DE E-MAIL ---
        if not extracted_email:
            # 1. Validação direta por formato/conteúdo (prioritária)
            if _is_valid_email(val_str):
                extracted_email = val_str.lower()
            # 2. Validação por palavra-chave da pergunta
            elif any(k in q_norm for k in ["email", "e-mail", "correio eletronico"]) and "@" in val_str:
                extracted_email = val_str.strip().lower()

        # --- B. DETECÇÃO DE WHATSAPP / TELEFONE ---
        if not extracted_phone:
            # 1. Pergunta contém palavra-chave de telefone/whatsapp
            if any(k in q_norm for k in PHONE_KEYWORDS) or "ddd" in q_norm:
                extracted_phone = val_str
            # 2. Pergunta não contém palavra de email/nome, mas valor tem formato evidente de telefone
            elif _is_phone_candidate(val_str) and not _is_valid_email(val_str) and not any(k in q_norm for k in ["nome", "name", "cpf", "cnpj"]):
                extracted_phone = val_str

        # --- C. DETECÇÃO DE NOME ---
        if not extracted_name:
            # 1. Pergunta com alta especificidade de nome
            if any(k in q_norm for k in NAME_STRONG_KEYWORDS) and not any(k in q_norm for k in NAME_EXCLUDE_KEYWORDS):
                # O valor não deve ser número nem e-mail
                if not val_str.isdigit() and "@" not in val_str and len(val_str) >= 2:
                    extracted_name = val_str
            # 2. Pergunta simples de nome ("nome", "name")
            elif (q_norm == "nome" or q_norm == "name" or q_norm.startswith("nome ") or q_norm.endswith(" nome")) and not any(k in q_norm for k in NAME_EXCLUDE_KEYWORDS):
                if not val_str.isdigit() and "@" not in val_str and len(val_str) >= 2:
                    extracted_name = val_str

        # --- D. DETECÇÃO DE CIDADE / LOCALIZAÇÃO ---
        if not extracted_city:
            if any(k in q_norm for k in ["onde voce mora", "onde mora", "cidade", "localizacao", "sua cidade"]):
                extracted_city = val_str

    # 5. Atribuição e normalização dos dados do Lead
    if extracted_name:
        result["name"] = extracted_name
        result["nome_completo"] = extracted_name
        parts = extracted_name.split()
        result["first_name"] = parts[0] if parts else ""
        variables["name"] = extracted_name
        variables["nome_completo"] = extracted_name
        variables["first_name"] = result["first_name"]
        custom_fields["nome_completo"] = extracted_name

    if extracted_phone:
        phone_digits = "".join(filter(str.isdigit, str(extracted_phone)))
        result["phone"] = phone_digits
        variables["whatsapp"] = phone_digits
        variables["phone"] = phone_digits
        custom_fields["whatsapp"] = phone_digits

    if extracted_email:
        result["email"] = extracted_email
        variables["email"] = extracted_email
        custom_fields["email"] = extracted_email

    if extracted_city:
        result["cidade"] = extracted_city
        variables["cidade"] = extracted_city
        custom_fields["cidade"] = extracted_city

    variables["product_name"] = result["product_name"]

    # 6. Mescla de variáveis e custom_fields
    result["variables"] = variables
    result["custom_fields"] = custom_fields

    logger.info(
        f"📋 [FORMULARIO_PERSONALIZADO_PARSER] Formulário processado: "
        f"lead='{result.get('name')}', phone='{result.get('phone')}', email='{result.get('email')}', product='{result.get('product_name')}'"
    )

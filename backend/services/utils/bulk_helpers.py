import copy
import re


def render_template_body(body: str, components: list, contact_name: str = None, var1: str = None, var2: str = None, var3: str = None, var4: str = None, var5: str = None) -> str:
    """Substitui {{1}}, {{2}}... e {{nome}}, {{telefone}} no corpo da mensagem."""
    if not body:
        return ""

    # Proteção: Se o nome for "1", tratamos como vazio
    real_name = contact_name if str(contact_name) != "1" else ""

    # 0. Prioridade absoluta: Variáveis persistidas (var1-var5)
    persist_vars = {
        "1": var1,
        "2": var2,
        "3": var3,
        "4": var4,
        "5": var5
    }

    for idx_s, val in persist_vars.items():
        if val:  # Só substitui se houver valor preenchido (não vazio e não None)
            body = body.replace(f"{{{{{idx_s}}}}}", str(val))

    # 1. Substituição de variáveis nomeadas (padrão amigável)
    body = body.replace("{{nome}}", real_name or "")
    body = body.replace("{{name}}", real_name or "")
    first_name = real_name.strip().split()[0] if real_name else ""
    body = body.replace("{{primeiro_nome}}", first_name)
    body = body.replace("{{first_name}}", first_name)

    body_comp = next(
        (c for c in (components or []) if isinstance(c, dict) and str(c.get("type", "")).lower() == "body"),
        None
    )

    # 2. Se houver componentes (Template Meta), processa variáveis numéricas {{1}}, {{2}}...
    # Apenas se as variáveis persistidas não tiverem preenchido tudo ou se preferirmos fallback
    if body_comp:
        for idx, param in enumerate(body_comp.get("parameters", []), 1):
            # Se já preenchemos via persist_vars, pulamos ou usamos o valor persistido
            if persist_vars.get(str(idx)) is not None:
                continue

            value = param.get("text", "") if isinstance(param, dict) else str(param)

            # Se o valor for "1" e for o primeiro parâmetro, tentamos usar o nome do contato
            if idx == 1 and str(value) == "1" and real_name:
                value = real_name
            elif str(value) == "1":
                value = ""

            body = body.replace(f"{{{{{idx}}}}}", str(value))

    # 3. Fallback final para {{1}} (comum em CRM) mesmo sem body_comp
    if "{{1}}" in body:
        # Se var1 não foi passado ou está vazio, usamos real_name
        fallback_val = persist_vars.get("1") or real_name or ""
        body = body.replace("{{1}}", fallback_val)

    return body


def extract_body_from_components(components: list) -> str | None:
    """
    Extrai o texto do corpo (BODY) diretamente dos components enviados para a Meta API.
    Os parâmetros já estão com os valores reais preenchidos (após sanitize_template_components),
    portanto não precisamos do template_body_cache para reconstruir o texto.

    Retorna o texto concatenado dos parâmetros do body, ou None se não for possível extrair.
    """
    if not components:
        return None

    for comp in components:
        if not isinstance(comp, dict):
            continue
        if str(comp.get("type", "")).upper() != "BODY":
            continue
        params = comp.get("parameters", [])
        if not params:
            return None
        # Extrai e une todos os textos dos parâmetros do body
        texts = []
        for param in params:
            if isinstance(param, dict):
                text = param.get("text", "")
                if text:
                    texts.append(str(text))
            elif isinstance(param, str) and param:
                texts.append(param)
        return " ".join(texts) if texts else None

    return None


def _resolve_dynamic_text_var(
    val: str,
    param_idx: int,
    contact_name: str = None,
    contact_phone: str = None,
    contact_vars: dict = None
) -> str:
    """Resolve variáveis dinâmicas ({{nome}}, {{primeiro_nome}}, etc.) e fallbacks para um parâmetro de texto."""
    c_vars = contact_vars if isinstance(contact_vars, dict) else {}
    raw_cname = str(contact_name or "").strip()
    raw_phone_digits = "".join(filter(str.isdigit, str(contact_phone or "")))
    cname_digits = "".join(filter(str.isdigit, raw_cname))
    is_placeholder_or_phone = (
        not raw_cname
        or raw_cname == "1"
        or (raw_cname.startswith("{{") and raw_cname.endswith("}}"))
        or (cname_digits and raw_phone_digits and cname_digits == raw_phone_digits)
    )
    clean_name = "" if is_placeholder_or_phone else raw_cname
    if not clean_name:
        clean_name = str(c_vars.get("nome") or c_vars.get("name") or "").strip()
    first_name = clean_name.split()[0] if clean_name else str(c_vars.get("primeiro_nome") or c_vars.get("first_name") or "").strip()
    clean_phone = str(contact_phone or c_vars.get("telefone") or c_vars.get("phone") or "").strip()
    clean_email = str(c_vars.get("email") or "").strip()
    clean_produto = str(c_vars.get("produto") or "").strip()
    clean_valor = str(c_vars.get("valor") or "").strip()

    val = str(val or "").strip()
    if val == "1":
        val = clean_name
    elif val:
        replacements = {
            "{{nome}}": clean_name,
            "{{name}}": clean_name,
            "{{primeiro_nome}}": first_name,
            "{{first_name}}": first_name,
            "{{telefone}}": clean_phone,
            "{{phone}}": clean_phone,
            "{{email}}": clean_email,
            "{{produto}}": clean_produto,
            "{{valor}}": clean_valor,
        }
        for token, replacement in replacements.items():
            if token in val:
                val = val.replace(token, replacement)
            if token.upper() in val:
                val = val.replace(token.upper(), replacement)
    else:
        # Se o parâmetro veio vazio (""), verifica se há valor em contact_vars (ex: BODY_0) ou usa primeiro_nome no {{1}}
        from_vars = c_vars.get(f"BODY_{param_idx}") or c_vars.get(str(param_idx + 1)) or c_vars.get(f"{{{{{param_idx + 1}}}}}")
        if from_vars and str(from_vars).strip():
            val = _resolve_dynamic_text_var(str(from_vars), param_idx, contact_name=clean_name, contact_phone=clean_phone, contact_vars=c_vars)
        elif param_idx == 0 and first_name:
            val = first_name

    # Proteção contra erro Meta 131009: parâmetros de texto nunca podem ser string vazia ("")
    if not val or not str(val).strip():
        val = " "
    return val


def sanitize_template_components(
    components: list,
    contact_name: str = None,
    contact_phone: str = None,
    contact_vars: dict = None,
    template_body: str = None
) -> list:
    """
    Remove ou substitui valores inválidos (como '1') nos componentes do template
    antes de enviar para a Meta API. Também realiza a substituição dinâmica
    de variáveis como {{nome}}, {{primeiro_nome}}, {{telefone}}, {{email}}, {{produto}} e {{valor}}.
    Se `template_body` for informado e exigir N parâmetros (ex: {{1}}), garante que o componente
    `body` possua exatamente a quantidade esperada de parâmetros para evitar o erro Meta #132000.
    """
    try:
        new_components = copy.deepcopy(components) if components else []

        # Se temos o texto do body do template no cache, calculamos quantos parâmetros {{N}} a Meta espera
        expected_body_vars = 0
        if template_body and isinstance(template_body, str):
            matches = re.findall(r"\{\{(\d+)\}\}", template_body)
            if matches:
                unique_nums = sorted({int(m) for m in matches if int(m) > 0})
                expected_body_vars = len(unique_nums)

        body_comp = None
        for comp in new_components:
            if not isinstance(comp, dict):
                continue
            comp_type = str(comp.get("type", "")).lower()
            if comp_type == "body":
                body_comp = comp
            if comp_type in ("body", "header"):
                params = comp.get("parameters", [])
                for idx, param in enumerate(params):
                    if isinstance(param, dict) and param.get("type") == "text":
                        param["text"] = _resolve_dynamic_text_var(
                            param.get("text", ""),
                            idx,
                            contact_name=contact_name,
                            contact_phone=contact_phone,
                            contact_vars=contact_vars
                        )

        # Garantir que o componente body exista e tenha todos os parâmetros exigidos pelo template_body (#132000)
        if expected_body_vars > 0:
            if body_comp is None:
                body_comp = {"type": "body", "parameters": []}
                new_components.append(body_comp)
            params = body_comp.setdefault("parameters", [])
            while len(params) < expected_body_vars:
                idx = len(params)
                resolved_val = _resolve_dynamic_text_var(
                    "",
                    idx,
                    contact_name=contact_name,
                    contact_phone=contact_phone,
                    contact_vars=contact_vars
                )
                params.append({"type": "text", "text": resolved_val})

        return new_components
    except Exception as e:
        print(f"Erro ao sanitizar componentes: {e}")
        return components or []


def extract_template_buttons(components: list) -> dict:
    """
    Extrai informações de botões dos componentes do template da Meta.
    Retorna: {
        "quick_replies": [str],
        "has_special_buttons": bool (URL/Phone)
    }
    """
    quick_replies = []
    has_special_buttons = False

    if not components:
        return {"quick_replies": [], "has_special_buttons": False}

    for comp in components:
        if isinstance(comp, dict) and comp.get("type", "").upper() == "BUTTONS":
            buttons = comp.get("buttons", [])
            for btn in buttons:
                b_type = str(btn.get("type", "")).upper()
                if b_type == "QUICK_REPLY":
                    text = btn.get("text")
                    if text:
                        quick_replies.append(text)
                elif b_type in ["URL", "PHONE_NUMBER"]:
                    has_special_buttons = True

    return {
        "quick_replies": quick_replies,
        "has_special_buttons": has_special_buttons
    }


async def resolve_template_body_with_sync(db, client_id: int, template_name: str) -> tuple:
    """
    Busca o corpo do template e botões no cache local.
    Se não encontrar, sincroniza da Meta API e tenta novamente.
    """
    import models
    from core.logger import setup_logger
    logger = setup_logger("TemplateSyncHelper")

    t_name = template_name.split('|')[0] if '|' in template_name else template_name
    tpl = db.query(models.WhatsAppTemplateCache).filter_by(client_id=client_id, name=t_name).first()

    if not tpl:
        logger.info(f"🔍 [TEMPLATE-SYNC] Template '{t_name}' não encontrado no cache. Sincronizando com a Meta...")
        try:
            from chatwoot_client import ChatwootClient
            chatwoot_cl = ChatwootClient(client_id=client_id)
            await chatwoot_cl.get_whatsapp_templates()
            # Recarrega do banco
            tpl = db.query(models.WhatsAppTemplateCache).filter_by(client_id=client_id, name=t_name).first()
        except Exception as e_sync:
            logger.error(f"❌ [TEMPLATE-SYNC] Falha ao sincronizar templates com a Meta: {e_sync}")

    body = None
    btn_info = {"quick_replies": [], "has_special_buttons": False}
    if tpl:
        body = tpl.body
        if tpl.components:
            btn_info = extract_template_buttons(tpl.components)

    return body, btn_info

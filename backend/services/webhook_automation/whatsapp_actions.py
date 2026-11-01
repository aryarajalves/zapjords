import json
import hashlib
from datetime import datetime, timedelta, timezone
import models
from core.logger import logger
from core.utils import robust_extract_labels
from services.webhooks_utils import extract_mapped_variables


def build_and_schedule_whatsapp_trigger(
    db,
    client_id: int,
    mapping,
    history,
    variables: dict,
    phone: str,
    template_name: str,
    funnel_id: int,
    payload: dict,
    total_delay_sec: int,
    scheduled_time: datetime,
    status: str,
    is_contact_blacklisted: bool,
    components: list,
    private_msg_text: str
):
    """
    Instancia e salva o ScheduledTrigger principal do WhatsApp no banco de dados.
    """
    payload_str = json.dumps(payload, sort_keys=True)
    idempotency_key = f"webhook_{mapping.id}_{hashlib.sha256(payload_str.encode()).hexdigest()[:16]}"

    # Extrai conversation_id do payload
    _raw_conv_id = (
        variables.get("chatwoot_conversation_id") or
        variables.get("conversation_id") or
        payload.get("conversation", {}).get("id") or
        payload.get("conversation_id")
    )
    webhook_conversation_id = int(_raw_conv_id) if _raw_conv_id and str(_raw_conv_id).isdigit() else None
    if webhook_conversation_id:
        logger.info(f"🗂️ [WEBHOOK] conversation_id={webhook_conversation_id} extraído do payload para {phone}")

    # Extrai contact_id, inbox_id e account_id
    _raw_contact_id = (
        variables.get("chatwoot_contact_id") or
        payload.get("contact", {}).get("id") or
        payload.get("contact_id")
    )
    webhook_contact_id = int(_raw_contact_id) if _raw_contact_id and str(_raw_contact_id).isdigit() else None

    _raw_inbox_id = (
        variables.get("chatwoot_inbox_id") or
        payload.get("inbox", {}).get("id") or
        payload.get("conversation", {}).get("inbox_id") or
        payload.get("inbox_id")
    )
    webhook_inbox_id = int(_raw_inbox_id) if _raw_inbox_id and str(_raw_inbox_id).isdigit() else None

    _raw_account_id = (
        variables.get("chatwoot_account_id") or
        payload.get("account", {}).get("id") or
        payload.get("account_id")
    )
    webhook_account_id = int(_raw_account_id) if _raw_account_id and str(_raw_account_id).isdigit() else None

    # Cria o Disparo
    st = models.ScheduledTrigger(
        scheduled_time=scheduled_time,
        status=status,
        failure_reason="Contato bloqueado na Blacklist (envios suspensos)" if is_contact_blacklisted else None,
        contact_name=variables.get("name"),
        contact_phone=phone,
        template_name=template_name,
        template_components=components,
        template_language=mapping.template_language or "pt_BR",
        client_id=client_id,
        product_name=variables.get("product_name"),
        private_message=private_msg_text,
        publish_external_event=True,
        chatwoot_label=robust_extract_labels(mapping.chatwoot_label),
        is_free_message=getattr(mapping, 'send_as_free_message', False),
        cost_per_unit=0.0 if getattr(mapping, 'send_as_free_message', False) else (getattr(mapping, 'cost_per_message', 0.0) or 0.35),
        sent_as="FREE_MESSAGE" if getattr(mapping, 'send_as_free_message', False) else "TEMPLATE",
        event_type=history.event_type,
        integration_id=mapping.integration_id,
        funnel_id=funnel_id,
        is_bulk=False,
        idempotency_key=idempotency_key,
        conversation_id=webhook_conversation_id,
        chatwoot_contact_id=webhook_contact_id,
        chatwoot_inbox_id=webhook_inbox_id,
        chatwoot_account_id=webhook_account_id,
        processed_data=variables,
        is_stress_test=bool((history.processed_data or {}).get("is_stress_test"))
    )
    db.add(st)
    db.commit()
    db.refresh(st)
    return st, webhook_conversation_id


def schedule_followup_trigger(
    db,
    client_id: int,
    mapping,
    st,
    payload: dict,
    variables: dict,
    total_delay_sec: int,
    is_contact_blacklisted: bool
):
    """
    Agenda o gatilho de follow-up vinculado ao ScheduledTrigger principal se configurado.
    """
    if is_contact_blacklisted or not getattr(mapping, "followup_active", False) or not mapping.followup_template_name:
        return

    from services.template_history_service import is_template_sent_in_last_24h
    if is_template_sent_in_last_24h(db, client_id, st.contact_phone, mapping.followup_template_name):
        logger.warning(f"🚫 [FOLLOW-UP-24H-BLOCK] Template de follow-up '{mapping.followup_template_name}' bloqueado para {st.contact_phone} nas últimas 24h. Agendamento ignorado.")
        return

    fu_value = getattr(mapping, "followup_delay_value", 0) or 0
    fu_unit = getattr(mapping, "followup_delay_unit", "minutes") or "minutes"

    fu_delay_sec = fu_value * 60
    if fu_unit == "hours":
        fu_delay_sec = fu_value * 3600

    total_fu_delay = total_delay_sec + fu_delay_sec
    fu_scheduled_time = datetime.now(timezone.utc) + timedelta(seconds=total_fu_delay)
    fu_header_format = None
    if mapping.followup_template_id:
        try:
            fu_tpl = db.query(models.WhatsAppTemplateCache).filter(
                models.WhatsAppTemplateCache.id == mapping.followup_template_id
            ).first()
            if fu_tpl and fu_tpl.components:
                fu_header_comp = next((c for c in fu_tpl.components if c.get("type") == "HEADER"), None)
                if fu_header_comp:
                    fu_header_format = fu_header_comp.get("format")
        except Exception as e:
            logger.error(f"Erro ao obter fu_header_format para mapping {mapping.id}: {e}")

    fu_components = extract_mapped_variables(payload, variables, mapping.followup_variables_mapping or {}, fu_header_format)

    payload_str = json.dumps(payload, sort_keys=True)
    fu_idempotency_key = f"fu_{mapping.id}_{hashlib.sha256(payload_str.encode()).hexdigest()[:16]}"

    # Validação de horário comercial do follow-up
    if getattr(mapping, "followup_business_hours_active", False):
        from core.engine.business_hours import is_within_business_hours_generic, get_next_business_hour_start_generic

        fu_days = getattr(mapping, "followup_business_hours_days", None) or [0, 1, 2, 3, 4]
        fu_start = getattr(mapping, "followup_business_hours_start", None) or "08:00"
        fu_end = getattr(mapping, "followup_business_hours_end", None) or "18:00"

        if not is_within_business_hours_generic(fu_scheduled_time, fu_days, fu_start, fu_end):
            old_time = fu_scheduled_time
            fu_scheduled_time = get_next_business_hour_start_generic(fu_scheduled_time, fu_days, fu_start)
            logger.info(f"🕒 [FOLLOW-UP-BUSINESS-HOURS] Ajustando horario de follow-up {fu_idempotency_key} de {old_time} para {fu_scheduled_time} (fora do comercial)")

    fu_st = models.ScheduledTrigger(
        scheduled_time=fu_scheduled_time,
        status="queued",
        contact_name=st.contact_name,
        contact_phone=st.contact_phone,
        template_name=mapping.followup_template_name,
        template_components=fu_components,
        template_language=mapping.template_language or "pt_BR",
        client_id=client_id,
        product_name=st.product_name,
        private_message="true",
        publish_external_event=True,
        chatwoot_label=robust_extract_labels(mapping.chatwoot_label),
        is_free_message=False,
        cost_per_unit=mapping.cost_per_message or 0.35,
        sent_as="TEMPLATE",
        event_type=st.event_type,
        integration_id=mapping.integration_id,
        funnel_id=None,
        is_bulk=False,
        is_followup=True,
        parent_id=st.id,
        idempotency_key=fu_idempotency_key,
        skip_block_check=True
    )
    db.add(fu_st)
    try:
        db.commit()
        logger.info(f"⏳ [FOLLOW-UP] Agendado follow-up #{fu_st.id} para #{st.id} as {fu_scheduled_time}")
    except Exception as fu_err:
        db.rollback()
        logger.error(f"⚠️ [FOLLOW-UP] Erro ao salvar follow-up para trigger #{st.id}: {fu_err}")

from datetime import datetime, timedelta, timezone
from sqlalchemy import cast, String, text
import models
from core.logger import logger


def check_idempotency(db, client_id: int, mapping, history, phone: str) -> bool:
    """
    Executa advisory lock no Postgres e verifica se já existe disparo recente (10s)
    para evitar concorrência e duplicidade extrema de webhooks.
    Retorna True se o webhook deve ser descartado (já processado recentemente).
    """
    if not phone:
        return False

    # Advisory Lock no PostgreSQL
    try:
        db.execute(
            text("SELECT pg_advisory_xact_lock(hashtext(:key))"),
            {"key": f"webhook_{phone}_{mapping.id}"}
        )
    except Exception as lock_err:
        logger.warning(f"Aviso advisory lock: {lock_err}")

    # Checagem de trigger recente (10s)
    last_st = db.query(models.ScheduledTrigger).filter(
        models.ScheduledTrigger.client_id == client_id,
        models.ScheduledTrigger.contact_phone == phone,
        cast(models.ScheduledTrigger.integration_id, String) == str(mapping.integration_id),
        models.ScheduledTrigger.event_type == history.event_type,
        models.ScheduledTrigger.created_at >= datetime.now(timezone.utc) - timedelta(seconds=10)
    ).first()

    if last_st:
        logger.warning(f"🚫 [AUTO_IDEMPOTENCY] Webhook #{history.id} ignorado. Trigger #{last_st.id} já criado recentemente para {phone}")
        orig_history = db.query(models.WebhookHistory).filter(
            models.WebhookHistory.integration_id == history.integration_id,
            models.WebhookHistory.event_type == history.event_type,
            models.WebhookHistory.id != history.id
        ).order_by(models.WebhookHistory.created_at.desc()).first()
        if orig_history:
            current_count = orig_history.duplicate_count or 0
            orig_history.duplicate_count = current_count + 1
        db.delete(history)
        db.commit()
        return True

    return False


def check_24h_and_duplicity(db, client_id: int, mapping, history, phone: str, template_name: str, funnel_id: int, variables: dict) -> bool:
    """
    Verifica se o template está em bloqueio de 24h ou se o lead já possui disparo ativo/enviado.
    Retorna True se o disparo deve ser ignorado.
    """
    if not phone:
        return False

    if template_name:
        from services.template_history_service import is_template_sent_in_last_24h
        if is_template_sent_in_last_24h(db, client_id, phone, template_name):
            logger.warning(f"🚫 [24H_BLOCK] Webhook #{history.id} ignorado. O template '{template_name}' está bloqueado nas últimas 24h para {phone}.")

            auto_tag_list = []
            if getattr(mapping, "internal_tags", None):
                auto_tag_list.extend([t.strip() for t in mapping.internal_tags.split(',') if t.strip()])
            if not auto_tag_list and history.event_type:
                auto_tag_list.append(history.event_type.replace("_", " ").title())
            auto_tag = ", ".join(list(dict.fromkeys(auto_tag_list))) if auto_tag_list else None

            integration = db.query(models.WebhookIntegration).filter_by(id=mapping.integration_id).first()
            if integration and getattr(mapping, "update_contact_on_trigger", True):
                from services.leads import upsert_webhook_lead
                try:
                    upsert_webhook_lead(
                        db,
                        client_id=client_id,
                        platform=integration.platform,
                        parsed_data=variables,
                        tag=auto_tag,
                        contact_save_fields=getattr(mapping, "contact_save_fields", None)
                    )
                except Exception as lead_err:
                    logger.error(f"Erro ao salvar lead no 24H_BLOCK: {lead_err}")

            if getattr(mapping, "chatwoot_label", None):
                try:
                    from services.chat_label_service import apply_webhook_labels
                    apply_webhook_labels(
                        db=db,
                        client_id=client_id,
                        phone=phone,
                        raw_labels=mapping.chatwoot_label,
                        source=f"Webhook ({integration.name if integration else 'Integrador'})",
                        contact_name=variables.get("name"),
                        create_if_missing=False
                    )
                except Exception as label_err:
                    logger.error(f"Erro ao aplicar etiquetas de chat no 24H_BLOCK: {label_err}")

            history.status = "skipped"
            history.error_message = f"Template '{template_name}' bloqueado pela regra de 24h (Interrupção Inteligente ou envio recente)."
            db.commit()
            return True

        existing_trigger = db.query(models.ScheduledTrigger).filter(
            models.ScheduledTrigger.client_id == client_id,
            models.ScheduledTrigger.contact_phone == phone,
            cast(models.ScheduledTrigger.integration_id, String) == str(mapping.integration_id),
            models.ScheduledTrigger.template_name == template_name,
            models.ScheduledTrigger.status.notin_(["failed", "cancelled"])
        ).first()

        if existing_trigger:
            logger.warning(f"🚫 [DUPLICITY_CHECK] Webhook #{history.id} ignorado. O lead {phone} já possui disparo ativo para '{template_name}' (Trigger #{existing_trigger.id}).")
            orig_history = db.query(models.WebhookHistory).filter(
                models.WebhookHistory.integration_id == history.integration_id,
                models.WebhookHistory.event_type == history.event_type,
                models.WebhookHistory.id != history.id
            ).order_by(models.WebhookHistory.created_at.desc()).first()
            if orig_history:
                current_count = orig_history.duplicate_count or 0
                orig_history.duplicate_count = current_count + 1
            db.delete(history)
            db.commit()
            return True

    elif funnel_id:
        existing_trigger = db.query(models.ScheduledTrigger).filter(
            models.ScheduledTrigger.client_id == client_id,
            models.ScheduledTrigger.contact_phone == phone,
            cast(models.ScheduledTrigger.integration_id, String) == str(mapping.integration_id),
            models.ScheduledTrigger.funnel_id == funnel_id,
            models.ScheduledTrigger.status.notin_(["failed", "cancelled"])
        ).first()

        if existing_trigger:
            logger.warning(f"🚫 [DUPLICITY_CHECK] Webhook #{history.id} ignorado. O lead {phone} já possui disparo ativo para o funil #{funnel_id} (Trigger #{existing_trigger.id}).")
            orig_history = db.query(models.WebhookHistory).filter(
                models.WebhookHistory.integration_id == history.integration_id,
                models.WebhookHistory.event_type == history.event_type,
                models.WebhookHistory.id != history.id
            ).order_by(models.WebhookHistory.created_at.desc()).first()
            if orig_history:
                current_count = orig_history.duplicate_count or 0
                orig_history.duplicate_count = current_count + 1
            db.delete(history)
            db.commit()
            return True

    return False


async def handle_smart_interruption(db, client_id: int, mapping, history, phone: str, variables: dict):
    """
    Executa a lógica de Interrupção Inteligente:
    - Cancela disparos pendentes/enfileirados para eventos configurados.
    - Bloqueia templates por 24h.
    - Cancela funis de e-mail marketing se for compra aprovada.
    """
    if getattr(mapping, "cancel_pending_on_trigger", False) and mapping.cancel_event_types and phone:
        event_types_to_cancel = mapping.cancel_event_types
        logger.info(f"🛡️ SMART_CANCEL | Iniciando interrupção inteligente para {phone} nos eventos: {event_types_to_cancel}")

        current_product = variables.get("product_name")

        query_triggers = db.query(models.ScheduledTrigger).filter(
            models.ScheduledTrigger.client_id == client_id,
            models.ScheduledTrigger.contact_phone == phone,
            models.ScheduledTrigger.status.in_(["pending", "queued"]),
            models.ScheduledTrigger.event_type.in_(event_types_to_cancel)
        )

        if current_product:
            query_triggers = query_triggers.filter(models.ScheduledTrigger.product_name == current_product)

        pending_triggers = query_triggers.all()
        templates_to_block = set()

        for pt in pending_triggers:
            logger.info(f"🚫 SMART_CANCEL | Cancelando trigger #{pt.id} (Evento: {pt.event_type}, Produto: {pt.product_name})")
            pt.status = "cancelled"
            pt.failure_reason = f"Interrompido pelo evento: {history.event_type}"
            if pt.template_name:
                templates_to_block.add(pt.template_name)

        sibling_mappings = db.query(models.WebhookEventMapping).filter(
            models.WebhookEventMapping.integration_id == mapping.integration_id,
            models.WebhookEventMapping.event_type.in_(event_types_to_cancel)
        ).all()

        for sm in sibling_mappings:
            if sm.product_name and current_product and sm.product_name.strip().lower() != current_product.strip().lower():
                continue
            if sm.template_name:
                templates_to_block.add(sm.template_name)
            elif sm.template_id:
                tpl_cache = db.query(models.WhatsAppTemplateCache).filter(
                    models.WhatsAppTemplateCache.id == sm.template_id
                ).first()
                if tpl_cache and tpl_cache.name:
                    templates_to_block.add(tpl_cache.name)

            if getattr(sm, "followup_active", False):
                if sm.followup_template_name:
                    templates_to_block.add(sm.followup_template_name)
                elif getattr(sm, "followup_template_id", None):
                    fu_tpl_cache = db.query(models.WhatsAppTemplateCache).filter(
                        models.WhatsAppTemplateCache.id == sm.followup_template_id
                    ).first()
                    if fu_tpl_cache and fu_tpl_cache.name:
                        templates_to_block.add(fu_tpl_cache.name)

        if templates_to_block:
            from services.template_history_service import record_template_dispatch
            for tpl_name in templates_to_block:
                logger.info(f"🔒 SMART_CANCEL | Bloqueando template '{tpl_name}' por 24h para {phone}")
                record_template_dispatch(db, client_id, phone, tpl_name)

        if pending_triggers or templates_to_block:
            db.commit()
            logger.info(f"✅ SMART_CANCEL | {len(pending_triggers)} disparos cancelados e {len(templates_to_block)} templates bloqueados por 24h.")

    contact_email = variables.get("email")
    if contact_email and history.event_type and "compra_aprovada" in str(history.event_type).lower():
        try:
            from services.email_funnel_service import check_and_cancel_funnels_on_purchase
            await check_and_cancel_funnels_on_purchase(db, client_id, contact_email)
        except Exception as e_ef:
            logger.error(f"Erro ao cancelar funis de e-mail por compra: {e_ef}")

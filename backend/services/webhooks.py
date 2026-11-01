"""
ZapVoice - Orquestrador de Automação de Webhooks.
Módulo modularizado para processamento de regras, integrações, disparos de WhatsApp e E-mail.
Sub-módulos especializados localizados em `services/webhook_automation/`.
"""

from datetime import datetime, timedelta, timezone
from core.logger import logger
from rabbitmq_client import rabbitmq

# Reexportação de utilitários compatíveis com versões anteriores
from services.webhooks_utils import (
    compute_dynamic_manychat_tag,
    extract_mapped_variables,
    extract_nested_custom_fields,
    get_brasilia_now,
    normalize_event_type,
    parse_webhook_payload,
    replace_variables_in_string,
)

# Sub-módulos especializados de automação
from services.webhook_automation import (
    check_idempotency,
    check_24h_and_duplicity,
    handle_smart_interruption,
    generate_platform_and_bussola_invites,
    process_crm_kanban,
    handle_auto_skip,
    process_webhook_email_actions,
    build_and_schedule_whatsapp_trigger,
    schedule_followup_trigger,
)


async def process_webhook_automation(client_id: int, mapping: any, variables: dict, history_id: int):
    """
    Processa a automação principal do webhook:
    - Validação de idempotência e advisory lock
    - Interrupção Inteligente e bloqueios de 24h
    - Geração de convites e CRM Kanban
    - Disparos de E-mail Marketing e WhatsApp com Follow-up
    """
    from database import SessionLocal
    import models

    db = SessionLocal()
    history = None
    try:
        history = db.query(models.WebhookHistory).filter(models.WebhookHistory.id == history_id).first()
        if not history:
            logger.error(f"AUTO_PROCESS | Webhook #{history_id} não encontrado no banco.")
            return

        integration = db.query(models.WebhookIntegration).filter_by(id=mapping.integration_id).first()
        payload = history.payload or {}
        phone = variables.get("phone")

        # 1. Idempotência e Advisory Lock
        if check_idempotency(db, client_id, mapping, history, phone):
            return

        # 2. Resolução do nome do template / funil
        template_name = getattr(mapping, 'template_name', None)
        funnel_id = getattr(mapping, 'funnel_id', None)
        if mapping.template_id:
            tpl_cache = db.query(models.WhatsAppTemplateCache).filter(
                models.WhatsAppTemplateCache.id == mapping.template_id
            ).first()
            if tpl_cache:
                template_name = tpl_cache.name

        # 3. Validação de Unicidade / 24h Block
        if check_24h_and_duplicity(db, client_id, mapping, history, phone, template_name, funnel_id, variables):
            return

        # 4. Interrupção Inteligente (Cancelamento de pendentes e bloqueio de funis)
        await handle_smart_interruption(db, client_id, mapping, history, phone, variables)

        # 5. Geração Automática de Convites (ZapVoice e Bússola Astrológica)
        await generate_platform_and_bussola_invites(mapping, variables, history_id, client_id)

        # 6. Ação no CRM / Kanban de Vendas
        process_crm_kanban(db, client_id, mapping, phone, variables, integration, history_id)

        # 7. Validação de ações ativas (WhatsApp e E-mail Marketing)
        has_whatsapp_action = bool(template_name or funnel_id)
        email_template_id = getattr(mapping, "email_template_id", None)
        email_funnel_id = getattr(mapping, "email_funnel_id", None)
        has_email_action = bool(email_template_id or email_funnel_id)

        if not has_whatsapp_action and not has_email_action:
            handle_auto_skip(db, client_id, mapping, history, phone, variables, integration)
            return

        # 8. Execução de E-mail Marketing (Template ou Funil)
        is_email_only = await process_webhook_email_actions(
            db=db,
            client_id=client_id,
            mapping=mapping,
            history=history,
            phone=phone,
            variables=variables,
            has_email_action=has_email_action,
            email_template_id=email_template_id,
            email_funnel_id=email_funnel_id,
            has_whatsapp_action=has_whatsapp_action
        )
        if is_email_only:
            return

        # 9. Extração de variáveis e Formato de Header do WhatsApp
        header_format = None
        if mapping.template_id:
            try:
                tpl = db.query(models.WhatsAppTemplateCache).filter(
                    models.WhatsAppTemplateCache.id == mapping.template_id
                ).first()
                if tpl and tpl.components:
                    header_comp = next((c for c in tpl.components if c.get("type") == "HEADER"), None)
                    if header_comp:
                        header_format = header_comp.get("format")
            except Exception as e:
                logger.error(f"Erro ao obter header_format para mapping {mapping.id}: {e}")

        # Geração automática de PDF para a Bússola Quiz se aplicável
        integration_platform = getattr(integration, "platform", "").lower() if integration else ""
        has_bussola_pdf = False
        v_map = mapping.variables_mapping or []
        if isinstance(v_map, list):
            for v in v_map:
                if v.get("value") in ["bussola_pdf_auto", "bussola_pdf_url"] or v.get("custom_value") == "bussola_pdf_auto":
                    has_bussola_pdf = True
                    break
        elif isinstance(v_map, dict):
            if any(str(val) in ["bussola_pdf_auto", "bussola_pdf_url"] for val in v_map.values()):
                has_bussola_pdf = True

        if has_bussola_pdf or (integration_platform in ["bussola_quiz", "quiz_bussola", "landing_page_bussola_quiz"] and header_format == "DOCUMENT"):
            bussola_msg = variables.get("mensagem") or payload.get("mensagem")
            if bussola_msg:
                try:
                    from services.bussola_pdf_service import generate_and_upload_bussola_pdf
                    lead_name = variables.get("name") or "Consulente"
                    birth_date = variables.get("nascimento_completo") or variables.get("nascimento_data") or ""
                    pdf_url, display_filename = generate_and_upload_bussola_pdf(
                        lead_name=lead_name,
                        birth_date=birth_date,
                        message_text=bussola_msg
                    )
                    variables["bussola_pdf_url"] = pdf_url
                    variables["bussola_pdf_filename"] = display_filename
                    variables["document_content"] = bussola_msg
                    variables["media_url"] = pdf_url
                    variables["filename"] = display_filename
                    logger.info(f"📄 [WEBHOOK_AUTO_PDF] PDF da Bússola gerado: {pdf_url} ({display_filename})")
                except Exception as pdf_err:
                    logger.error(f"❌ [WEBHOOK_AUTO_PDF] Erro ao gerar PDF da Bússola: {pdf_err}")

        components = extract_mapped_variables(payload, variables, mapping.variables_mapping or {}, header_format)

        private_msg_text = "true"
        mapping_note = getattr(mapping, "private_note", None)
        if mapping_note and mapping_note.lower() not in ("true", "false", ""):
            private_msg_text = mapping_note

        # Cálculo de Delay
        delay_min = mapping.delay_minutes or 0
        delay_seconds_map = mapping.delay_seconds or 0
        total_delay_sec = (delay_min * 60) + delay_seconds_map

        scheduled_time = datetime.now(timezone.utc)
        if total_delay_sec > 0:
            scheduled_time = scheduled_time + timedelta(seconds=total_delay_sec)
            status = "queued"
        else:
            status = "processing"

        # Checagem de Blacklist
        from services.blocked_contacts_service import is_contact_blocked
        is_contact_blacklisted = is_contact_blocked(db, client_id, phone)
        if is_contact_blacklisted:
            status = "cancelled"
            logger.info(f"🚫 [WEBHOOK_BLOCKED] Contato {phone} está na Blacklist. Disparo agendado como cancelado.")

        # 10. Criação do ScheduledTrigger principal de WhatsApp
        st, webhook_conversation_id = build_and_schedule_whatsapp_trigger(
            db=db,
            client_id=client_id,
            mapping=mapping,
            history=history,
            variables=variables,
            phone=phone,
            template_name=template_name,
            funnel_id=funnel_id,
            payload=payload,
            total_delay_sec=total_delay_sec,
            scheduled_time=scheduled_time,
            status=status,
            is_contact_blacklisted=is_contact_blacklisted,
            components=components,
            private_msg_text=private_msg_text
        )

        # 11. Agendamento do Gatilho de Follow-up
        schedule_followup_trigger(
            db=db,
            client_id=client_id,
            mapping=mapping,
            st=st,
            payload=payload,
            variables=variables,
            total_delay_sec=total_delay_sec,
            is_contact_blacklisted=is_contact_blacklisted
        )

        # 12. Execução Imediata via RabbitMQ (se sem delay e não bloqueado)
        if total_delay_sec <= 0 and not is_contact_blacklisted:
            await rabbitmq.publish("zapvoice_funnel_executions", {
                "trigger_id": st.id,
                "funnel_id": funnel_id,
                "conversation_id": webhook_conversation_id,
                "contact_phone": phone,
                "contact_name": variables.get("name")
            })

        history.status = "processed"
        db.commit()
        logger.info(f"✅ AUTO_SUCCESS | Webhook #{history_id} processado com sucesso. Trigger ID: {st.id}")

        try:
            await rabbitmq.publish_event("webhook_history_update", {
                "history_id": int(history.id),
                "integration_id": str(history.integration_id),
                "client_id": int(client_id),
                "event_type": history.event_type,
                "status": "processed",
                "processed_data": history.processed_data,
                "duplicate_count": history.duplicate_count or 0,
                "is_new": False
            })
        except Exception as ws_err:
            logger.warning(f"Erro ao emitir evento WS de webhook processed: {ws_err}")

    except Exception as e:
        logger.error(f"❌ AUTO_ERROR | Falha ao processar automação #{history_id}: {e}")
        import traceback
        logger.error(traceback.format_exc())
        if history:
            try:
                history.status = "failed"
                history.error_message = str(e)
                db.commit()
                await rabbitmq.publish_event("webhook_history_update", {
                    "history_id": int(history.id),
                    "integration_id": str(history.integration_id),
                    "client_id": int(client_id),
                    "event_type": history.event_type,
                    "status": "failed",
                    "error_message": str(e),
                    "processed_data": history.processed_data,
                    "duplicate_count": history.duplicate_count or 0,
                    "is_new": False
                })
            except Exception as ws_err:
                logger.warning(f"Erro ao emitir evento WS de webhook failed: {ws_err}")
    finally:
        db.close()

from datetime import datetime, timezone
import models
from core.logger import logger
from rabbitmq_client import rabbitmq


async def process_webhook_email_actions(
    db,
    client_id: int,
    mapping,
    history,
    phone: str,
    variables: dict,
    has_email_action: bool,
    email_template_id: int,
    email_funnel_id: int,
    has_whatsapp_action: bool
) -> bool:
    """
    Processa ações de envio de template único de e-mail e matrícula em funil de e-mail marketing.
    Grava o ScheduledTrigger no banco de dados para garantir visibilidade no histórico de disparos da integração.
    Retorna True se a automação é exclusivamente de e-mail e deve ser encerrada.
    """
    contact_email = variables.get("email")

    if contact_email and has_email_action:
        logger.info(f"📧 [EMAIL_WEBHOOK] Processando envio de e-mail marketing para {contact_email} (template={email_template_id}, funil={email_funnel_id})")

        # 1. Envio de Template de E-mail Único
        if email_template_id:
            try:
                email_tpl = db.query(models.EmailTemplate).filter(
                    models.EmailTemplate.id == email_template_id,
                    models.EmailTemplate.client_id == client_id,
                    models.EmailTemplate.is_active == True
                ).first()

                if email_tpl:
                    email_cfg = db.query(models.EmailConfig).filter(
                        models.EmailConfig.client_id == client_id
                    ).first()

                    if email_cfg:
                        subject = getattr(mapping, "email_subject", None) or email_tpl.subject
                        from services.email_service import send_single_email
                        email_res = await send_single_email(
                            config=email_cfg,
                            to_email=contact_email,
                            subject=subject,
                            body_html=email_tpl.body_html,
                            recipient_name=variables
                        )
                        is_success = bool(email_res.get("success"))
                        st_email = models.ScheduledTrigger(
                            scheduled_time=datetime.now(timezone.utc),
                            status="completed" if is_success else "failed",
                            failure_reason=None if is_success else str(email_res.get("error") or "Falha no envio de e-mail"),
                            contact_name=variables.get("name") or "Contato Webhook",
                            contact_phone=phone or contact_email,
                            template_name=f"E-mail: {email_tpl.name}",
                            template_components=[],
                            template_language="pt_BR",
                            client_id=client_id,
                            product_name=variables.get("product_name"),
                            is_free_message=True,
                            cost_per_unit=0.0,
                            sent_as="EMAIL",
                            total_sent=1 if is_success else 0,
                            total_delivered=1 if is_success else 0,
                            total_failed=0 if is_success else 1,
                            event_type=history.event_type,
                            integration_id=mapping.integration_id,
                            is_bulk=False,
                            processed_data=variables
                        )
                        db.add(st_email)
                        db.commit()
                        if is_success:
                            logger.info(f"✅ [EMAIL_WEBHOOK] E-mail '{subject}' enviado com sucesso para {contact_email} e registrado no histórico de disparos.")
                        else:
                            logger.error(f"❌ [EMAIL_WEBHOOK] Falha ao enviar e-mail para {contact_email}: {email_res.get('error')}")
                    else:
                        logger.warning(f"⚠️ [EMAIL_WEBHOOK] Nenhuma configuração de e-mail (EmailConfig) ativa para o cliente {client_id}")
                        st_email = models.ScheduledTrigger(
                            scheduled_time=datetime.now(timezone.utc),
                            status="failed",
                            failure_reason="Nenhuma configuração SMTP de e-mail ativa para o cliente",
                            contact_name=variables.get("name") or "Contato Webhook",
                            contact_phone=phone or contact_email,
                            template_name=f"E-mail: {email_tpl.name}",
                            template_components=[],
                            client_id=client_id,
                            is_free_message=True,
                            cost_per_unit=0.0,
                            sent_as="EMAIL",
                            total_sent=0,
                            total_failed=1,
                            event_type=history.event_type,
                            integration_id=mapping.integration_id,
                            is_bulk=False,
                            processed_data=variables
                        )
                        db.add(st_email)
                        db.commit()
                else:
                    logger.warning(f"⚠️ [EMAIL_WEBHOOK] Template de e-mail {email_template_id} não encontrado ou inativo")
                    st_email = models.ScheduledTrigger(
                        scheduled_time=datetime.now(timezone.utc),
                        status="failed",
                        failure_reason=f"Template de e-mail #{email_template_id} não encontrado ou inativo",
                        contact_name=variables.get("name") or "Contato Webhook",
                        contact_phone=phone or contact_email,
                        template_name=f"E-mail: #{email_template_id}",
                        template_components=[],
                        client_id=client_id,
                        is_free_message=True,
                        cost_per_unit=0.0,
                        sent_as="EMAIL",
                        total_sent=0,
                        total_failed=1,
                        event_type=history.event_type,
                        integration_id=mapping.integration_id,
                        is_bulk=False,
                        processed_data=variables
                    )
                    db.add(st_email)
                    db.commit()
            except Exception as e_mail:
                logger.error(f"❌ [EMAIL_WEBHOOK] Erro inesperado ao enviar template de e-mail: {e_mail}", exc_info=True)
                try:
                    st_err = models.ScheduledTrigger(
                        scheduled_time=datetime.now(timezone.utc),
                        status="failed",
                        failure_reason=f"Erro no envio de e-mail: {str(e_mail)}",
                        contact_name=variables.get("name") or "Contato Webhook",
                        contact_phone=phone or contact_email,
                        template_name="E-mail",
                        client_id=client_id,
                        is_free_message=True,
                        cost_per_unit=0.0,
                        sent_as="EMAIL",
                        total_sent=0,
                        total_failed=1,
                        event_type=history.event_type,
                        integration_id=mapping.integration_id,
                        is_bulk=False,
                        processed_data=variables
                    )
                    db.add(st_err)
                    db.commit()
                except Exception:
                    pass

        # 2. Inscrição em Funil de E-mail Marketing
        if email_funnel_id:
            try:
                from services.email_funnel_service import enroll_contact_in_funnel
                lead = db.query(models.WebhookLead).filter(
                    models.WebhookLead.client_id == client_id,
                    models.WebhookLead.email == contact_email
                ).first()

                email_funnel = db.query(models.EmailFunnel).filter(
                    models.EmailFunnel.id == email_funnel_id,
                    models.EmailFunnel.client_id == client_id
                ).first()
                funnel_title = email_funnel.name if email_funnel else f"#{email_funnel_id}"

                await enroll_contact_in_funnel(
                    db=db,
                    client_id=client_id,
                    funnel_id=email_funnel_id,
                    contact_email=contact_email,
                    contact_name=variables.get("name"),
                    lead_id=lead.id if lead else None,
                    start_immediately=True
                )
                logger.info(f"✅ [EMAIL_WEBHOOK] Lead {contact_email} matriculado no funil de e-mail #{email_funnel_id}")

                st_funnel = models.ScheduledTrigger(
                    scheduled_time=datetime.now(timezone.utc),
                    status="completed",
                    contact_name=variables.get("name") or "Contato Webhook",
                    contact_phone=phone or contact_email,
                    template_name=f"Funil E-mail: {funnel_title}",
                    template_components=[],
                    client_id=client_id,
                    product_name=variables.get("product_name"),
                    is_free_message=True,
                    cost_per_unit=0.0,
                    sent_as="EMAIL",
                    total_sent=1,
                    total_delivered=1,
                    event_type=history.event_type,
                    integration_id=mapping.integration_id,
                    is_bulk=False,
                    processed_data=variables
                )
                db.add(st_funnel)
                db.commit()
            except Exception as e_funnel:
                logger.error(f"❌ [EMAIL_WEBHOOK] Erro ao matricular lead no funil de e-mail: {e_funnel}", exc_info=True)
                try:
                    st_err = models.ScheduledTrigger(
                        scheduled_time=datetime.now(timezone.utc),
                        status="failed",
                        failure_reason=f"Erro ao matricular no funil de e-mail: {str(e_funnel)}",
                        contact_name=variables.get("name") or "Contato Webhook",
                        contact_phone=phone or contact_email,
                        template_name=f"Funil E-mail: #{email_funnel_id}",
                        client_id=client_id,
                        is_free_message=True,
                        cost_per_unit=0.0,
                        sent_as="EMAIL",
                        total_sent=0,
                        total_failed=1,
                        event_type=history.event_type,
                        integration_id=mapping.integration_id,
                        is_bulk=False,
                        processed_data=variables
                    )
                    db.add(st_err)
                    db.commit()
                except Exception:
                    pass
    elif not contact_email and has_email_action and not has_whatsapp_action:
        history.status = "failed"
        history.error_message = "Campo de e-mail não encontrado no payload do webhook"
        try:
            st_no_email = models.ScheduledTrigger(
                scheduled_time=datetime.now(timezone.utc),
                status="failed",
                failure_reason="Campo de e-mail não encontrado no payload do webhook",
                contact_name=variables.get("name") or "Contato Webhook",
                contact_phone=phone or "Sem e-mail",
                template_name="E-mail Marketing",
                client_id=client_id,
                is_free_message=True,
                cost_per_unit=0.0,
                sent_as="EMAIL",
                total_sent=0,
                total_failed=1,
                event_type=history.event_type,
                integration_id=mapping.integration_id,
                is_bulk=False,
                processed_data=variables
            )
            db.add(st_no_email)
            db.commit()
        except Exception:
            pass

    # Se houver apenas ação de E-mail Marketing (sem WhatsApp), encerra o webhook com sucesso
    if not has_whatsapp_action:
        history.status = "processed"
        db.commit()
        logger.info(f"✅ AUTO_SUCCESS | Webhook #{history.id} processado com sucesso para E-mail Marketing.")
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
            logger.warning(f"Erro ao emitir evento WS de webhook processed (email only): {ws_err}")
        return True

    return False

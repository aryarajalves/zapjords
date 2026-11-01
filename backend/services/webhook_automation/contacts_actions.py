import models
from core.logger import logger


async def generate_platform_and_bussola_invites(mapping, variables: dict, history_id: int, client_id: int):
    """
    Gera convite da plataforma ZapVoice e/ou do app Bússola Astrológica se configurado no mapping.
    Injeta as variáveis link_cadastro, invite_url e link_bussola no dicionário de variáveis.
    """
    # Convite da plataforma
    if getattr(mapping, "auto_create_invite", False):
        try:
            from services.platform_invite_service import generate_platform_invite
            invite_res = await generate_platform_invite(
                client_id=client_id,
                role=getattr(mapping, "invite_role", "aluno") or "aluno",
                duration_hours=getattr(mapping, "invite_duration_hours", 0) or 0,
                course_access=getattr(mapping, "invite_course_access", None)
            )
            if invite_res and invite_res.get("full_invite_url"):
                invite_link = invite_res["full_invite_url"]
                variables["link_cadastro"] = invite_link
                variables["invite_url"] = invite_link
                logger.info(f"🔗 [PLATFORM_INVITE] link_cadastro={invite_link} injetado nas variáveis do webhook #{history_id}")
        except Exception as invite_err:
            logger.error(f"❌ [PLATFORM_INVITE] Falha ao gerar convite automático no webhook #{history_id}: {invite_err}", exc_info=True)

    # Convite da Bússola Astrológica
    if getattr(mapping, "bussola_auto_create_invite", False):
        try:
            from services.bussola_invite_service import generate_bussola_invite
            bussola_res = await generate_bussola_invite(
                client_id=client_id,
                role=getattr(mapping, "bussola_invite_role", "client") or "client",
                validity_type=getattr(mapping, "bussola_validity_type", "never") or "never",
                custom_api_key=getattr(mapping, "bussola_custom_api_key", None)
            )
            if bussola_res and bussola_res.get("invite_url"):
                bussola_link = bussola_res["invite_url"]
                variables["link_bussola"] = bussola_link
                if "link_cadastro" not in variables:
                    variables["link_cadastro"] = bussola_link
                logger.info(f"🔮 [BUSSOLA_INVITE] link_bussola={bussola_link} gerado no webhook #{history_id}")
        except Exception as bussola_err:
            logger.error(f"❌ [BUSSOLA_INVITE] Falha ao gerar convite Bússola no webhook #{history_id}: {bussola_err}", exc_info=True)


def process_crm_kanban(db, client_id: int, mapping, phone: str, variables: dict, integration, history_id: int):
    """
    Processa a ação de movimentação ou criação no Kanban de Vendas (CRM).
    """
    if getattr(mapping, "kanban_active", False) and phone:
        try:
            from services.crm_service import process_webhook_kanban_trigger
            process_webhook_kanban_trigger(
                db=db,
                client_id=client_id,
                mapping=mapping,
                phone=phone,
                name=variables.get("name"),
                email=variables.get("email"),
                platform=integration.platform if integration else "webhook",
                payload_value=float(variables.get("price") or 0.0)
            )
        except Exception as crm_err:
            logger.error(f"❌ [CRM_WEBHOOK] Falha ao processar ação do Kanban no webhook #{history_id}: {crm_err}", exc_info=True)


def handle_auto_skip(db, client_id: int, mapping, history, phone: str, variables: dict, integration) -> None:
    """
    Executado quando o mapeamento não possui ação de WhatsApp nem de E-mail configurada.
    Aplica tags internas, salva o lead se configurado, aplica etiquetas de chat e marca o histórico como skipped.
    """
    logger.info(f"AUTO_SKIP | Mapeamento #{mapping.id} sem WhatsApp nem E-mail Marketing definidos — aplicando etiquetas e salvando lead...")

    auto_tag_list = []
    if getattr(mapping, "internal_tags", None):
        auto_tag_list.extend([t.strip() for t in mapping.internal_tags.split(',') if t.strip()])
    if not auto_tag_list and history.event_type:
        auto_tag_list.append(history.event_type.replace("_", " ").title())
    auto_tag = ", ".join(list(dict.fromkeys(auto_tag_list))) if auto_tag_list else None

    if integration:
        variables["created_by_webhook"] = True
        variables["webhook_name"] = integration.name

        if getattr(mapping, "update_contact_on_trigger", True):
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
                logger.error(f"Erro ao salvar lead no AUTO_SKIP: {lead_err}")

    if phone and getattr(mapping, "chatwoot_label", None):
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
            logger.error(f"Erro ao aplicar etiquetas de chat no AUTO_SKIP: {label_err}")

    history.status = "skipped"
    history.error_message = f"AUTO_SKIP: Mapeamento #{mapping.id} sem WhatsApp nem E-mail definidos — disparo não criado."
    db.commit()

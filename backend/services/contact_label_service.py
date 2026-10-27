import re
from typing import List, Optional, Union, Any
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from core.logger import setup_logger
from core.utils import robust_extract_labels
import models

logger = setup_logger("ContactLabelService")


def _clean_phone_digits(phone: str) -> str:
    if not phone:
        return ""
    return re.sub(r"\D", "", str(phone))


def apply_contact_labels_locally(
    db: Session,
    client_id: int,
    phone: str,
    raw_labels: Any,
    contact_name: Optional[str] = None
) -> List[str]:
    """
    Aplica etiquetas diretamente no cadastro do contato (WebhookLead / perfil do lead),
    preservando as etiquetas já existentes (modo append) e respeitando o limite de 25 chars.
    NÃO altera etiquetas de conversas do Chat.
    """
    clean_labels = robust_extract_labels(raw_labels) if raw_labels else []
    if not clean_labels:
        return []

    # Corta cada etiqueta para no máximo 25 caracteres conforme regra de negócio
    truncated_labels = [lbl.strip()[:25] for lbl in clean_labels if lbl and lbl.strip()]
    if not truncated_labels:
        return []

    digits = _clean_phone_digits(phone)
    if not digits or len(digits) < 8:
        logger.warning(f"⚠️ [CONTACT-LABEL] Telefone inválido para aplicar etiquetas de contato: '{phone}'")
        return []

    suffix = digits[-8:]

    try:
        lead = db.query(models.WebhookLead).filter(
            models.WebhookLead.client_id == client_id,
            models.WebhookLead.phone.like(f"%{suffix}")
        ).first()

        if lead:
            existing_tags = [t.strip() for t in (lead.tags or "").split(",") if t.strip()]
            tags_lower = [t.lower() for t in existing_tags]
            added = []
            for tag in truncated_labels:
                if tag.lower() not in tags_lower:
                    existing_tags.append(tag)
                    tags_lower.append(tag.lower())
                    added.append(tag)

            if added:
                lead.tags = ", ".join(existing_tags)
                flag_modified(lead, "tags")
                db.commit()
                logger.info(f"🏷️ [CONTACT-LABEL] Etiquetas do contato {added} adicionadas ao Lead #{lead.id} ({phone})")
            return existing_tags
        else:
            # Se o lead não existir, cria o cadastro com as etiquetas no perfil
            new_lead = models.WebhookLead(
                client_id=client_id,
                phone=digits,
                name=(contact_name or digits).strip()[:100],
                tags=", ".join(truncated_labels)
            )
            db.add(new_lead)
            db.commit()
            db.refresh(new_lead)
            logger.info(f"🏷️ [CONTACT-LABEL] Novo Lead #{new_lead.id} criado com etiquetas do contato {truncated_labels} ({phone})")
            return truncated_labels

    except Exception as e:
        logger.error(f"❌ [CONTACT-LABEL] Erro ao aplicar etiquetas no contato {phone}: {e}")
        db.rollback()
        return []


async def apply_contact_labels_to_chatwoot(
    chatwoot_client: Any,
    phone: str,
    raw_labels: Any
) -> bool:
    """
    Aplica etiquetas diretamente na entidade de contato do Chatwoot (contact_id),
    SEM alterar marcadores da conversa.
    """
    if not chatwoot_client:
        return False

    clean_labels = robust_extract_labels(raw_labels) if raw_labels else []
    if not clean_labels:
        return False

    if getattr(chatwoot_client, "simulate", False) is True:
        logger.info(f"🤖 [MOCK CONTACT-LABEL] Simulada aplicação de etiquetas {clean_labels} no contato {phone}")
        return True

    try:
        clean_digits = _clean_phone_digits(phone)
        search_res = await chatwoot_client.search_contact(clean_digits)
        cw_contact_id = None
        if search_res and isinstance(search_res, dict) and search_res.get("payload"):
            contacts = search_res["payload"]
            for c_item in contacts:
                c_phone = _clean_phone_digits(c_item.get("phone_number") or "")
                if c_phone.endswith(clean_digits[-8:]):
                    cw_contact_id = c_item.get("id")
                    break

        if cw_contact_id:
            await chatwoot_client.add_label_to_contact(cw_contact_id, clean_labels)
            logger.info(f"🏷️ [CHATWOOT-CONTACT-LABEL] Etiquetas {clean_labels} aplicadas no contato Chatwoot #{cw_contact_id} ({phone})")
            return True
        else:
            logger.warning(f"⚠️ [CHATWOOT-CONTACT-LABEL] Contato Chatwoot não encontrado para o telefone {phone}")
            return False

    except Exception as cw_err:
        logger.error(f"❌ [CHATWOOT-CONTACT-LABEL] Falha ao adicionar etiqueta no contato Chatwoot para {phone}: {cw_err}")
        return False


async def sync_contact_dispatch_labels(
    db: Session,
    client_id: int,
    phone: str,
    raw_contact_labels: Any,
    contact_name: Optional[str] = None,
    chatwoot_client: Optional[Any] = None
) -> bool:
    """
    Orquestra a aplicação de etiquetas do contato tanto localmente (WebhookLead)
    quanto no CRM remoto (Chatwoot), garantindo que nada seja aplicado à conversa.
    """
    if not raw_contact_labels:
        return False

    apply_contact_labels_locally(
        db=db,
        client_id=client_id,
        phone=phone,
        raw_labels=raw_contact_labels,
        contact_name=contact_name
    )

    if chatwoot_client:
        await apply_contact_labels_to_chatwoot(
            chatwoot_client=chatwoot_client,
            phone=phone,
            raw_labels=raw_contact_labels
        )

    return True

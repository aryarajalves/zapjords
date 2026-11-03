from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_

import models
from core.deps import get_db, get_current_user
from core.logger import setup_logger
from config_loader import get_setting
from ..common import get_client_id, mark_conversation_read_for_user, mark_conversation_unread_for_user

logger = setup_logger("ChatRouter.ConversationToggles")

router = APIRouter()


@router.post("/chat/conversations/{conversation_id}/assign")
async def assign_conversation(
    conversation_id: int,
    payload: dict,
    client_id: int = Depends(get_client_id),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    convo = db.query(models.ChatConversation).filter(
        models.ChatConversation.id == conversation_id
    ).first()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")

    if current_user.role != "super_admin" and convo.client_id != client_id:
        raise HTTPException(status_code=403, detail="Acesso não autorizado a esta conversa.")

    effective_client_id = convo.client_id

    user_id = payload.get("user_id")
    old_assigned = convo.assigned_user.full_name if convo.assigned_user else None

    if user_id is not None:
        target_user = db.query(models.User).filter(models.User.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=400, detail="Usuário não encontrado para atribuição.")
        convo.assigned_user_id = user_id
        new_assigned = target_user.full_name

        event_text = f"O atendente {current_user.full_name or current_user.email} atribuiu a conversa para {new_assigned}"
        system_msg = models.ChatMessage(
            conversation_id=conversation_id,
            sender_type="system",
            message_type="text",
            content=event_text,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(system_msg)
    else:
        convo.assigned_user_id = None
        if old_assigned:
            event_text = f"O atendente {current_user.full_name or current_user.email} removeu a atribuição de {old_assigned}"
            system_msg = models.ChatMessage(
                conversation_id=conversation_id,
                sender_type="system",
                message_type="text",
                content=event_text,
                timestamp=datetime.now(timezone.utc)
            )
            db.add(system_msg)

    db.commit()
    return {
        "status": "ok",
        "assigned_user_id": convo.assigned_user_id,
        "assigned_user_name": convo.assigned_user.full_name if convo.assigned_user else None
    }


@router.post("/chat/conversations/{conversation_id}/read")
async def mark_as_read(
    conversation_id: int,
    client_id: int = Depends(get_client_id),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    convo = db.query(models.ChatConversation).filter(
        models.ChatConversation.id == conversation_id
    ).first()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")

    if current_user.role != "super_admin" and convo.client_id != client_id:
        raise HTTPException(status_code=403, detail="Acesso não autorizado a esta conversa.")

    effective_client_id = convo.client_id

    mark_conversation_read_for_user(convo, getattr(current_user, "id", None))
    db.commit()
    logger.info(f"✅ [CHAT_READ] Conversa #{conversation_id} marcada como lida para o usuário #{getattr(current_user, 'id', None)}.")
    return {
        "status": "ok",
        "conversation_id": convo.id,
        "unread_count": 0
    }


@router.post("/chat/conversations/{conversation_id}/unread")
async def mark_as_unread(
    conversation_id: int,
    client_id: int = Depends(get_client_id),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    convo = db.query(models.ChatConversation).filter(
        models.ChatConversation.id == conversation_id
    ).first()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")

    if current_user.role != "super_admin" and convo.client_id != client_id:
        raise HTTPException(status_code=403, detail="Acesso não autorizado a esta conversa.")

    effective_client_id = convo.client_id

    restored_count = mark_conversation_unread_for_user(convo, getattr(current_user, "id", None))
    db.commit()
    logger.info(f"📬 [CHAT_UNREAD] Conversa #{conversation_id} marcada como não lida ({restored_count}) para o usuário #{getattr(current_user, 'id', None)}.")
    return {
        "status": "ok",
        "conversation_id": convo.id,
        "unread_count": restored_count
    }


@router.post("/chat/conversations/{conversation_id}/pin")
async def toggle_pin_conversation(
    conversation_id: int,
    payload: dict,
    client_id: int = Depends(get_client_id),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    convo = db.query(models.ChatConversation).filter(
        models.ChatConversation.id == conversation_id
    ).first()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")

    if current_user.role != "super_admin" and convo.client_id != client_id:
        raise HTTPException(status_code=403, detail="Acesso não autorizado a esta conversa.")

    effective_client_id = convo.client_id

    pinned = payload.get("pinned", False)
    convo.pinned = pinned
    db.commit()
    return {"status": "ok", "pinned": convo.pinned}


@router.post("/chat/conversations/{conversation_id}/urgent")
async def toggle_urgent_conversation(
    conversation_id: int,
    payload: dict,
    client_id: int = Depends(get_client_id),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    convo = db.query(models.ChatConversation).filter(
        models.ChatConversation.id == conversation_id
    ).first()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")

    if current_user.role != "super_admin" and convo.client_id != client_id:
        raise HTTPException(status_code=403, detail="Acesso não autorizado a esta conversa.")

    effective_client_id = convo.client_id

    urgent = payload.get("urgent", False)
    convo.urgent = urgent
    db.commit()
    return {"status": "ok", "urgent": convo.urgent}


@router.post("/chat/conversations/{conversation_id}/reset-24h-window")
async def reset_24h_window(
    conversation_id: int,
    client_id: int = Depends(get_client_id),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    convo = db.query(models.ChatConversation).filter(
        models.ChatConversation.id == conversation_id
    ).first()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")

    if current_user.role != "super_admin" and convo.client_id != client_id:
        raise HTTPException(status_code=403, detail="Acesso não autorizado a esta conversa.")

    effective_client_id = convo.client_id

    old_time = datetime.now(timezone.utc) - timedelta(hours=25)
    convo.last_contact_message_at = old_time

    target_phone = convo.phone or getattr(convo, 'contact_phone', None)
    if target_phone:
        clean_phone = ''.join(filter(str.isdigit, str(target_phone)))
        suffix = clean_phone[-8:] if len(clean_phone) >= 8 else clean_phone

        db.query(models.ContactWindow).filter(
            models.ContactWindow.client_id == client_id,
            or_(
                models.ContactWindow.phone == clean_phone,
                models.ContactWindow.phone.like(f"%{suffix}")
            )
        ).delete(synchronize_session=False)

        db.query(models.ContactTemplateHistory).filter(
            models.ContactTemplateHistory.client_id == client_id,
            or_(
                models.ContactTemplateHistory.phone == clean_phone,
                models.ContactTemplateHistory.phone.like(f"%{suffix}")
            )
        ).delete(synchronize_session=False)

        db.query(models.MessageStatus).filter(
            or_(
                models.MessageStatus.phone_number == clean_phone,
                models.MessageStatus.phone_number.like(f"%{suffix}")
            ),
            models.MessageStatus.trigger_id.is_(None)
        ).delete(synchronize_session=False)

    window_labels_setting = get_setting("AUTO_REMOVE_WINDOW_LABELS", "", client_id=client_id)
    if window_labels_setting and convo.labels:
        target_labels = [l.strip().lower() for l in window_labels_setting.split(",") if l.strip()]
        if target_labels:
            convo.labels = [lbl for lbl in convo.labels if lbl.lower() not in target_labels]

    db.commit()
    db.refresh(convo)

    logger.info(f"🧹 [RESET_24H_WINDOW] Janela de 24h e ContactWindow zeradas para conversa #{conversation_id} (Telefone: {convo.phone}) por Client {client_id}.")

    return {
        "status": "ok",
        "message": "Janela de 24h e histórico de interações zerados com sucesso.",
        "conversation": {
            "id": convo.id,
            "labels": convo.labels,
            "last_contact_message_at": convo.last_contact_message_at.isoformat() if convo.last_contact_message_at else None
        }
    }


class UpdateContactNamePayload(BaseModel):
    contact_name: str


@router.patch("/chat/conversations/{conversation_id}/contact-name")
async def update_conversation_contact_name(
    conversation_id: int,
    payload: UpdateContactNamePayload,
    client_id: int = Depends(get_client_id),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    convo = db.query(models.ChatConversation).filter(
        models.ChatConversation.id == conversation_id
    ).first()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")

    if current_user.role != "super_admin" and convo.client_id != client_id:
        raise HTTPException(status_code=403, detail="Acesso não autorizado a esta conversa.")

    effective_client_id = convo.client_id

    new_name = payload.contact_name.strip() if payload.contact_name else ""
    if not new_name:
        raise HTTPException(status_code=400, detail="O nome do contato não pode ser vazio.")

    # 1. Atualizar nome na conversa atual e conversas associadas ao mesmo telefone
    convo.contact_name = new_name
    db.query(models.ChatConversation).filter(
        models.ChatConversation.client_id == client_id,
        models.ChatConversation.phone == convo.phone
    ).update({"contact_name": new_name}, synchronize_session=False)

    # 2. Atualizar automaticamente na aba de Contatos (WebhookLead)
    target_phone = convo.phone
    leads_updated = 0
    if target_phone:
        clean_phone = ''.join(filter(str.isdigit, str(target_phone)))
        suffix = clean_phone[-8:] if len(clean_phone) >= 8 else clean_phone

        leads = db.query(models.WebhookLead).filter(
            models.WebhookLead.client_id == client_id,
            or_(
                models.WebhookLead.phone == target_phone,
                models.WebhookLead.phone == clean_phone,
                models.WebhookLead.phone.like(f"%{suffix}")
            )
        ).all()

        if leads:
            for lead in leads:
                lead.name = new_name
                lead.updated_at = datetime.now(timezone.utc)
                leads_updated += 1
        else:
            # Se ainda não existir lead cadastrado na aba de contatos, cria automaticamente
            new_lead = models.WebhookLead(
                client_id=client_id,
                name=new_name,
                phone=clean_phone or target_phone,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db.add(new_lead)
            leads_updated += 1

        # 3. Atualizar também oportunidades no Kanban (SalesDeal) caso existam
        deals = db.query(models.SalesDeal).filter(
            models.SalesDeal.client_id == client_id,
            or_(
                models.SalesDeal.contact_phone == target_phone,
                models.SalesDeal.contact_phone == clean_phone,
                models.SalesDeal.contact_phone.like(f"%{suffix}")
            )
        ).all()
        for deal in deals:
            deal.contact_name = new_name
            deal.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(convo)

    logger.info(f"👤 [UPDATE_CONTACT_NAME] Nome do contato atualizado para '{new_name}' na conversa #{conversation_id} (Leads sincronizados: {leads_updated}) por User {current_user.id}.")

    return {
        "status": "ok",
        "contact_name": convo.contact_name,
        "phone": convo.phone,
        "leads_updated": leads_updated
    }


class UpdateContactInstagramPayload(BaseModel):
    instagram: Optional[str] = None


@router.patch("/chat/conversations/{conversation_id}/instagram")
async def update_conversation_contact_instagram(
    conversation_id: int,
    payload: UpdateContactInstagramPayload,
    client_id: int = Depends(get_client_id),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    convo = db.query(models.ChatConversation).filter(
        models.ChatConversation.id == conversation_id
    ).first()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")

    if current_user.role != "super_admin" and convo.client_id != client_id:
        raise HTTPException(status_code=403, detail="Acesso não autorizado a esta conversa.")

    effective_client_id = convo.client_id

    raw_insta = (payload.instagram or "").strip()
    if raw_insta:
        # Sanitizar: remove @ inicial, URLs completas de instagram.com, espaços e barras
        raw_insta = raw_insta.replace("https://www.instagram.com/", "").replace("http://www.instagram.com/", "")
        raw_insta = raw_insta.replace("https://instagram.com/", "").replace("http://instagram.com/", "")
        raw_insta = raw_insta.replace("instagram.com/", "").strip("/")
        if raw_insta.startswith("@"):
            raw_insta = raw_insta[1:].strip()
        new_instagram = raw_insta[:100] if raw_insta else None
    else:
        new_instagram = None

    # 1. Atualizar instagram na conversa atual e em conversas com o mesmo telefone
    convo.instagram = new_instagram
    db.query(models.ChatConversation).filter(
        models.ChatConversation.client_id == convo.client_id,
        models.ChatConversation.phone == convo.phone
    ).update({"instagram": new_instagram}, synchronize_session=False)

    # 2. Atualizar em WebhookLead caso exista
    target_phone = convo.phone
    leads_updated = 0
    if target_phone:
        clean_phone = ''.join(filter(str.isdigit, str(target_phone)))
        suffix = clean_phone[-8:] if len(clean_phone) >= 8 else clean_phone

        leads = db.query(models.WebhookLead).filter(
            models.WebhookLead.client_id == convo.client_id,
            or_(
                models.WebhookLead.phone == target_phone,
                models.WebhookLead.phone == clean_phone,
                models.WebhookLead.phone.like(f"%{suffix}")
            )
        ).all()

        if leads:
            for lead in leads:
                lead.instagram = new_instagram
                lead.updated_at = datetime.now(timezone.utc)
                leads_updated += 1

    db.commit()
    db.refresh(convo)

    logger.info(f"📸 [UPDATE_CONTACT_INSTAGRAM] Instagram do contato atualizado para '{new_instagram}' na conversa #{conversation_id} (Leads: {leads_updated}) por User {current_user.id}.")

    return {
        "status": "ok",
        "instagram": convo.instagram,
        "phone": convo.phone,
        "leads_updated": leads_updated
    }


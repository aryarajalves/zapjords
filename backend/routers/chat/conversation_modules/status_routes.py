from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
from core.deps import get_db, get_current_user
from core.logger import setup_logger
from ..common import get_client_id
from .conversation_filter_helpers import (
    build_conversation_filter_query,
    get_blocked_and_resting_data,
    get_block_info
)

logger = setup_logger("ChatRouter.ConversationStatus")

router = APIRouter()


@router.post("/chat/conversations/{conversation_id}/status")
async def update_conversation_status(
    conversation_id: int,
    payload: dict,
    client_id: int = Depends(get_client_id),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    convo = db.query(models.ChatConversation).filter(
        models.ChatConversation.id == conversation_id,
        models.ChatConversation.client_id == client_id
    ).first()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")

    status = payload.get("status")
    if status not in ["open", "resolved", "archived"]:
        raise HTTPException(status_code=400, detail="Status inválido. Use 'open', 'resolved' ou 'archived'.")

    convo.status = status
    db.commit()
    return {"status": "ok", "conversation_status": convo.status}


@router.post("/chat/conversations/{conversation_id}/archive")
async def toggle_archive_conversation(
    conversation_id: int,
    payload: Optional[dict] = None,
    client_id: int = Depends(get_client_id),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    convo = db.query(models.ChatConversation).filter(
        models.ChatConversation.id == conversation_id,
        models.ChatConversation.client_id == client_id
    ).first()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")

    if payload and isinstance(payload, dict) and "archived" in payload:
        target_archived = bool(payload.get("archived"))
    else:
        target_archived = convo.status != "archived"

    convo.status = "archived" if target_archived else "open"
    db.commit()
    return {
        "status": "ok",
        "conversation_id": convo.id,
        "conversation_status": convo.status,
        "is_archived": convo.status == "archived"
    }


@router.post("/chat/conversations/bulk-archive")
async def bulk_archive_conversations(
    payload: dict,
    client_id: int = Depends(get_client_id),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not client_id:
        raise HTTPException(status_code=400, detail="Client ID não fornecido.")

    target_status = "archived" if payload.get("archived", True) else "open"
    select_all_pages = payload.get("select_all_pages", False)

    if select_all_pages:
        query = build_conversation_filter_query(
            db=db,
            client_id=client_id,
            current_user=current_user,
            tab=payload.get("tab", "todos"),
            status=payload.get("status", "open"),
            unread_only=payload.get("unread_only"),
            window_open_only=payload.get("window_open_only"),
            urgent_only=payload.get("urgent_only"),
            has_replied=payload.get("has_replied"),
            has_active_funnel=payload.get("has_active_funnel"),
            no_pipeline=payload.get("no_pipeline"),
            not_in_pipeline_id=payload.get("not_in_pipeline_id"),
            in_pipeline=payload.get("in_pipeline"),
            pipeline_id=payload.get("pipeline_id"),
            pipeline_stage_id=payload.get("pipeline_stage_id"),
            start_date=payload.get("start_date"),
            end_date=payload.get("end_date"),
            search=payload.get("search"),
            has_note=payload.get("has_note"),
            excluded_ids=payload.get("excluded_ids")
        )

        convos = query.all()

        from services.chat_label_service import filter_conversations_by_labels
        convos = filter_conversations_by_labels(
            conversations=convos,
            label=payload.get("label"),
            labels=payload.get("labels"),
            include_labels=payload.get("include_labels"),
            label_mode=payload.get("label_mode", "has"),
            label_op=payload.get("label_op", "or"),
            exclude_labels=payload.get("exclude_labels"),
            exclude_label_op=payload.get("exclude_label_op", "or")
        )
    else:
        ids = payload.get("ids", [])
        if not ids:
            raise HTTPException(status_code=400, detail="Nenhum ID fornecido.")
        convos = db.query(models.ChatConversation).filter(
            models.ChatConversation.id.in_(ids),
            models.ChatConversation.client_id == client_id
        ).all()

    updated_count = len(convos)
    for c in convos:
        c.status = target_status
    db.commit()

    return {
        "status": "ok",
        "updated_count": updated_count,
        "target_status": target_status
    }


@router.post("/chat/conversations/bulk-block", summary="Bloquear múltiplos contatos de conversas em massa")
async def bulk_block_conversations(
    payload: dict,
    client_id: int = Depends(get_client_id),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not client_id:
        raise HTTPException(status_code=400, detail="Client ID não fornecido.")

    block_type = payload.get("type", "permanent")
    hours = payload.get("hours", 24)
    select_all_pages = payload.get("select_all_pages", False)

    if select_all_pages:
        query = build_conversation_filter_query(
            db=db,
            client_id=client_id,
            current_user=current_user,
            tab=payload.get("tab", "todos"),
            status=payload.get("status", "open"),
            unread_only=payload.get("unread_only"),
            window_open_only=payload.get("window_open_only"),
            urgent_only=payload.get("urgent_only"),
            has_replied=payload.get("has_replied"),
            has_active_funnel=payload.get("has_active_funnel"),
            no_pipeline=payload.get("no_pipeline"),
            not_in_pipeline_id=payload.get("not_in_pipeline_id"),
            in_pipeline=payload.get("in_pipeline"),
            pipeline_id=payload.get("pipeline_id"),
            pipeline_stage_id=payload.get("pipeline_stage_id"),
            start_date=payload.get("start_date"),
            end_date=payload.get("end_date"),
            search=payload.get("search"),
            has_note=payload.get("has_note"),
            excluded_ids=payload.get("excluded_ids")
        )

        convos = query.all()

        from services.chat_label_service import filter_conversations_by_labels
        convos = filter_conversations_by_labels(
            conversations=convos,
            label=payload.get("label"),
            labels=payload.get("labels"),
            include_labels=payload.get("include_labels"),
            label_mode=payload.get("label_mode", "has"),
            label_op=payload.get("label_op", "or"),
            exclude_labels=payload.get("exclude_labels"),
            exclude_label_op=payload.get("exclude_label_op", "or")
        )

        block_status = payload.get("block_status")
        if block_status:
            blocked_suffixes, resting_map = get_blocked_and_resting_data(db, client_id)
            convos = [
                c for c in convos
                if get_block_info(c.phone, blocked_suffixes, resting_map)[0] == block_status
            ]
    else:
        ids = payload.get("ids", [])
        if not ids:
            raise HTTPException(status_code=400, detail="Nenhuma conversa selecionada para bloqueio.")
        convos = db.query(models.ChatConversation).filter(
            models.ChatConversation.id.in_(ids),
            models.ChatConversation.client_id == client_id
        ).all()

    if not convos:
        return {
            "status": "success",
            "blocked_count": 0,
            "already_blocked_count": 0,
            "message": "Nenhuma conversa encontrada para bloqueio."
        }

    client_obj = db.query(models.Client).filter(models.Client.id == client_id).first()
    client_ids = [client_id]
    if client_obj and client_obj.project_id:
        siblings = db.query(models.Client.id).filter(models.Client.project_id == client_obj.project_id).all()
        client_ids = [s.id for s in siblings]

    now = datetime.utcnow()
    blocked_count = 0
    already_count = 0
    seen_suffixes = set()

    if block_type == "resting":
        existing_resting = db.query(models.RestingContact.phone).filter(
            models.RestingContact.client_id.in_(client_ids),
            models.RestingContact.expires_at > now
        ).all()
        existing_suffixes = {
            "".join(filter(str.isdigit, r.phone))[-8:]
            for r in existing_resting
            if r.phone and len("".join(filter(str.isdigit, r.phone))) >= 8
        }

        try:
            effective_hours = int(hours) if hours else 24
        except (ValueError, TypeError):
            effective_hours = 24
        expires_at = now + timedelta(hours=effective_hours)

        new_entries = []
        for c in convos:
            clean_phone = "".join(filter(str.isdigit, c.phone or ""))
            if not clean_phone or len(clean_phone) < 8:
                continue
            suffix = clean_phone[-8:]
            if suffix in existing_suffixes or suffix in seen_suffixes:
                already_count += 1
                continue
            seen_suffixes.add(suffix)
            new_entries.append(models.RestingContact(
                client_id=client_id,
                phone=clean_phone,
                name=c.contact_name,
                reason="Repouso via Atendimento (Massa)",
                expires_at=expires_at
            ))
            blocked_count += 1

        if new_entries:
            db.bulk_save_objects(new_entries)
            db.commit()

        message = f"{blocked_count} contato(s) colocado(s) em repouso por {effective_hours}h."
    else:
        existing_blocks = db.query(models.BlockedContact.phone).filter(
            models.BlockedContact.client_id.in_(client_ids)
        ).all()
        existing_suffixes = {
            "".join(filter(str.isdigit, b.phone))[-8:]
            for b in existing_blocks
            if b.phone and len("".join(filter(str.isdigit, b.phone))) >= 8
        }

        new_entries = []
        for c in convos:
            clean_phone = "".join(filter(str.isdigit, c.phone or ""))
            if not clean_phone or len(clean_phone) < 8:
                continue
            suffix = clean_phone[-8:]
            if suffix in existing_suffixes or suffix in seen_suffixes:
                already_count += 1
                continue
            seen_suffixes.add(suffix)
            new_entries.append(models.BlockedContact(
                client_id=client_id,
                phone=clean_phone,
                name=c.contact_name,
                reason="Bloqueado via Atendimento (Massa)"
            ))
            blocked_count += 1

        if new_entries:
            db.bulk_save_objects(new_entries)

            from models.trigger import MessageStatus
            for entry in new_entries:
                suffix = entry.phone[-8:] if len(entry.phone) >= 8 else entry.phone
                db.query(MessageStatus).filter(
                    MessageStatus.status == 'failed',
                    MessageStatus.phone_number.like(f"%{suffix}")
                ).update({
                    MessageStatus.failure_resolution: 'blocked',
                    MessageStatus.failure_resolved_at: now
                }, synchronize_session=False)

            db.commit()

        message = f"{blocked_count} contato(s) bloqueado(s) permanentemente."

    logger.info(f"🔒 [BULK_BLOCK] Cliente {client_id}: {blocked_count} contatos bloqueados ({block_type})")

    return {
        "status": "success",
        "blocked_count": blocked_count,
        "already_blocked_count": already_count,
        "message": message
    }


@router.post("/chat/conversations/bulk-unblock", summary="Desbloquear múltiplos contatos de conversas em massa")
async def bulk_unblock_conversations(
    payload: dict,
    client_id: int = Depends(get_client_id),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not client_id:
        raise HTTPException(status_code=400, detail="Client ID não fornecido.")

    select_all_pages = payload.get("select_all_pages", False)

    if select_all_pages:
        query = build_conversation_filter_query(
            db=db,
            client_id=client_id,
            current_user=current_user,
            tab=payload.get("tab", "todos"),
            status=payload.get("status", "open"),
            unread_only=payload.get("unread_only"),
            window_open_only=payload.get("window_open_only"),
            urgent_only=payload.get("urgent_only"),
            has_replied=payload.get("has_replied"),
            has_active_funnel=payload.get("has_active_funnel"),
            no_pipeline=payload.get("no_pipeline"),
            not_in_pipeline_id=payload.get("not_in_pipeline_id"),
            in_pipeline=payload.get("in_pipeline"),
            pipeline_id=payload.get("pipeline_id"),
            pipeline_stage_id=payload.get("pipeline_stage_id"),
            start_date=payload.get("start_date"),
            end_date=payload.get("end_date"),
            search=payload.get("search"),
            has_note=payload.get("has_note"),
            excluded_ids=payload.get("excluded_ids")
        )

        convos = query.all()

        from services.chat_label_service import filter_conversations_by_labels
        convos = filter_conversations_by_labels(
            conversations=convos,
            label=payload.get("label"),
            labels=payload.get("labels"),
            include_labels=payload.get("include_labels"),
            label_mode=payload.get("label_mode", "has"),
            label_op=payload.get("label_op", "or"),
            exclude_labels=payload.get("exclude_labels"),
            exclude_label_op=payload.get("exclude_label_op", "or")
        )

        block_status = payload.get("block_status")
        if block_status:
            blocked_suffixes, resting_map = get_blocked_and_resting_data(db, client_id)
            convos = [
                c for c in convos
                if get_block_info(c.phone, blocked_suffixes, resting_map)[0] == block_status
            ]
    else:
        ids = payload.get("ids", [])
        if not ids:
            raise HTTPException(status_code=400, detail="Nenhuma conversa selecionada para desbloqueio.")
        convos = db.query(models.ChatConversation).filter(
            models.ChatConversation.id.in_(ids),
            models.ChatConversation.client_id == client_id
        ).all()

    if not convos:
        return {
            "status": "success",
            "unblocked_count": 0,
            "unrested_count": 0,
            "message": "Nenhuma conversa encontrada para desbloqueio."
        }

    client_obj = db.query(models.Client).filter(models.Client.id == client_id).first()
    client_ids = [client_id]
    if client_obj and client_obj.project_id:
        siblings = db.query(models.Client.id).filter(models.Client.project_id == client_obj.project_id).all()
        client_ids = [s.id for s in siblings]

    suffixes = set()
    for c in convos:
        clean = "".join(filter(str.isdigit, c.phone or ""))
        if clean and len(clean) >= 8:
            suffixes.add(clean[-8:])

    unblocked_count = 0
    unrested_count = 0

    if suffixes:
        blocked_entries = db.query(models.BlockedContact).filter(
            models.BlockedContact.client_id.in_(client_ids)
        ).all()
        for b in blocked_entries:
            b_clean = "".join(filter(str.isdigit, b.phone or ""))
            if b_clean and len(b_clean) >= 8 and b_clean[-8:] in suffixes:
                db.delete(b)
                unblocked_count += 1

        resting_entries = db.query(models.RestingContact).filter(
            models.RestingContact.client_id.in_(client_ids)
        ).all()
        for r in resting_entries:
            r_clean = "".join(filter(str.isdigit, r.phone or ""))
            if r_clean and len(r_clean) >= 8 and r_clean[-8:] in suffixes:
                db.delete(r)
                unrested_count += 1

        db.commit()

    total_removed = unblocked_count + unrested_count
    logger.info(f"🔓 [BULK_UNBLOCK] Cliente {client_id}: {total_removed} contatos desbloqueados ({unblocked_count} permanentes, {unrested_count} em repouso)")

    return {
        "status": "success",
        "unblocked_count": unblocked_count,
        "unrested_count": unrested_count,
        "message": f"{total_removed} contato(s) desbloqueado(s) com sucesso."
    }

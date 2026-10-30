from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Tuple
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import or_

import models
from core.deps import get_current_user, get_db
from core.logger import setup_logger
from .common import get_client_id
from .conversation_modules.conversation_filter_helpers import build_conversation_filter_query
from services.followup_service import create_followup_triggers
from services.utils.phone_utils import normalize_phone

logger = setup_logger("ChatRouter.BulkTemplate")
router = APIRouter()


def format_phone_display(phone: str) -> str:
    """Formata o número de telefone em um padrão amigável para exibição visual."""
    clean = "".join(filter(str.isdigit, str(phone or "")))
    if len(clean) == 13 and clean.startswith("55"):
        return f"+55 ({clean[2:4]}) {clean[4:9]}-{clean[9:]}"
    elif len(clean) == 12 and clean.startswith("55"):
        return f"+55 ({clean[2:4]}) {clean[4:8]}-{clean[8:]}"
    elif len(clean) == 11:
        return f"({clean[0:2]}) {clean[2:7]}-{clean[7:]}"
    elif len(clean) == 10:
        return f"({clean[0:2]}) {clean[2:6]}-{clean[6:]}"
    return f"+{clean}" if clean else ""


def resolve_target_conversations(
    payload: dict,
    client_id: int,
    current_user: models.User,
    db: Session
) -> Tuple[List[models.ChatConversation], List[dict]]:
    """
    Resolve as conversas filtradas ou selecionadas por ID e normaliza
    a lista de contatos únicos prontos para disparo ou pré-visualização.
    Suporta origem do Chat de Conversas e do Kanban de Vendas (SalesDeal).
    """
    source = payload.get("source", "chat")
    deal_ids = payload.get("deal_ids") or (payload.get("ids", []) if source == "kanban" else [])

    # Se a requisição veio do Kanban de Vendas
    if source == "kanban" or deal_ids:
        deals = db.query(models.SalesDeal).filter(
            models.SalesDeal.id.in_(deal_ids),
            models.SalesDeal.client_id == client_id
        ).all()

        convos = []
        contacts = []
        seen_phones = set()
        for deal in deals:
            if not deal.contact_phone:
                continue
            norm = normalize_phone(deal.contact_phone)
            if not norm or len(norm) < 8 or norm in seen_phones:
                continue
            seen_phones.add(norm)

            convo = db.query(models.ChatConversation).filter(
                models.ChatConversation.phone == norm,
                models.ChatConversation.client_id == client_id
            ).first()
            if convo:
                convos.append(convo)

            contact_name = (deal.contact_name or norm).strip()
            first_name = contact_name.split(" ")[0] if contact_name else "Cliente"
            val_formatted = f"R$ {deal.value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") if deal.value else ""

            contacts.append({
                "id": deal.id,
                "deal_id": deal.id,
                "conversation_id": convo.id if convo else None,
                "phone": norm,
                "name": contact_name,
                "vars": {
                    "nome": contact_name,
                    "primeiro_nome": first_name,
                    "telefone": norm,
                    "email": deal.contact_email or "",
                    "produto": deal.product_name or "",
                    "valor": val_formatted
                },
                "meta": {
                    "sender": {
                        "name": contact_name,
                        "phone_number": norm
                    }
                }
            })
        return convos, contacts

    # Origem Chat de Conversas
    select_all_pages = payload.get("select_all_pages", False)
    ids = payload.get("ids", [])
    excluded_ids = payload.get("excluded_ids", [])

    if not select_all_pages and not ids:
        return [], []

    if select_all_pages:
        query = build_conversation_filter_query(
            db=db,
            client_id=client_id,
            current_user=current_user,
            tab=payload.get("tab", "todos"),
            status=payload.get("status", "open"),
            unread_only=payload.get("unread_only"),
            window_open_only=payload.get("window_open_only"),
            template_sent_24h_only=payload.get("template_sent_24h_only"),
            urgent_only=payload.get("urgent_only"),
            has_replied=payload.get("has_replied"),
            has_active_funnel=payload.get("has_active_funnel"),
            last_message_read_only=payload.get("last_message_read_only"),
            last_message_unread_only=payload.get("last_message_unread_only"),
            no_pipeline=payload.get("no_pipeline"),
            not_in_pipeline_id=payload.get("not_in_pipeline_id"),
            in_pipeline=payload.get("in_pipeline"),
            pipeline_id=payload.get("pipeline_id"),
            pipeline_stage_id=payload.get("pipeline_stage_id"),
            start_date=payload.get("start_date"),
            end_date=payload.get("end_date"),
            search=payload.get("search"),
            has_note=payload.get("has_note"),
            excluded_ids=excluded_ids
        )

        label = payload.get("label")
        if label:
            query = query.filter(models.ChatConversation.labels.contains([label]))

        convos = query.all()
    else:
        convos = db.query(models.ChatConversation).filter(
            models.ChatConversation.id.in_(ids),
            models.ChatConversation.client_id == client_id
        ).all()

    contacts = []
    seen_phones = set()
    for c in convos:
        if not c.phone:
            continue
        norm = normalize_phone(c.phone)
        if not norm or len(norm) < 8 or norm in seen_phones:
            continue
        seen_phones.add(norm)

        contact_name = (c.contact_name or norm).strip()
        first_name = contact_name.split(" ")[0] if contact_name else "Cliente"

        contacts.append({
            "id": c.id,
            "conversation_id": c.id,
            "phone": norm,
            "name": contact_name,
            "vars": {
                "nome": contact_name,
                "primeiro_nome": first_name,
                "telefone": norm
            },
            "meta": {
                "sender": {
                    "name": contact_name,
                    "phone_number": norm
                }
            }
        })

    return convos, contacts


@router.post("/chat/conversations/bulk-template/recipients", summary="Listar destinatários calculados para o disparo em massa")
async def preview_bulk_template_recipients(
    payload: dict = Body(...),
    client_id: int = Depends(get_client_id),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retorna a lista detalhada de contatos que receberão o template
    para exibição na aba de Destinatários do modal.
    """
    if not client_id:
        raise HTTPException(status_code=400, detail="Client ID não fornecido.")

    convos, contacts = resolve_target_conversations(payload, client_id, current_user, db)

    convo_map = {c.id: c for c in convos}
    recipients = []
    for item in contacts:
        c = convo_map.get(item["conversation_id"])
        norm = item["phone"]
        recipients.append({
            "id": item["id"],
            "deal_id": item.get("deal_id"),
            "conversation_id": item["conversation_id"],
            "name": item["name"],
            "phone": norm,
            "formatted_phone": format_phone_display(norm),
            "vars": item.get("vars", {}),
            "labels": (c.labels if c and c.labels else []),
            "unread_count": (getattr(c, "unread_count", 0) or 0) if c else 0,
            "last_message": (getattr(c, "last_message_content", None) if c else None),
            "has_active_funnel": bool(getattr(c, "active_funnel_id", None)) if c else False,
            "is_blocked": bool(getattr(c, "is_blocked", False)) if c else False
        })

    return {
        "total": len(recipients),
        "recipients": recipients
    }


@router.post("/chat/conversations/bulk-template", summary="Disparar template da Meta em massa para conversas selecionadas")
async def trigger_bulk_template_for_conversations(
    payload: dict = Body(...),
    client_id: int = Depends(get_client_id),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Inicia o disparo em massa de um template aprovado da Meta para as conversas selecionadas.
    """
    if not client_id:
        raise HTTPException(status_code=400, detail="Client ID não fornecido.")

    template_name = payload.get("template_name")
    if not template_name or not str(template_name).strip():
        raise HTTPException(status_code=400, detail="Template não especificado.")

    template_name = str(template_name).strip()
    language = payload.get("language") or payload.get("template_language") or "pt_BR"

    select_all_pages = payload.get("select_all_pages", False)
    ids = payload.get("ids", [])
    deal_ids = payload.get("deal_ids", [])
    if not select_all_pages and not ids and not deal_ids:
        raise HTTPException(status_code=400, detail="Nenhuma conversa ou oportunidade selecionada para disparar template.")

    convos, contacts = resolve_target_conversations(payload, client_id, current_user, db)

    if not contacts:
        raise HTTPException(
            status_code=400,
            detail="Nenhum contato com telefone válido encontrado nas conversas selecionadas."
        )

    delay_seconds = int(payload.get("delay_seconds") or 5)
    concurrency_limit = int(payload.get("concurrency_limit") or 1)
    button_actions = payload.get("button_actions") or {}
    template_components = payload.get("components") or []
    contact_labels = payload.get("contact_labels") or []

    # 1. Configuração de Disparo Recorrente caso solicitado
    is_recurring = bool(payload.get("is_recurring", False))
    if is_recurring:
        frequency = payload.get("frequency") or payload.get("recurrence_frequency") or "weekly"
        days_of_week = payload.get("days_of_week") or payload.get("recurrence_days_of_week") or []
        day_of_month = payload.get("day_of_month") or payload.get("recurrence_day_of_month")
        recurrence_time = payload.get("recurrence_time") or payload.get("scheduled_time") or "09:00"

        try:
            h, m = map(int, str(recurrence_time).strip().split(":"))
            if h < 0 or h > 23 or m < 0 or m > 59:
                recurrence_time = "09:00"
        except Exception:
            recurrence_time = "09:00"

        from core.recurrent_logic import calculate_next_run
        now_utc = datetime.now(timezone.utc)
        next_run = calculate_next_run(
            base_date=now_utc,
            frequency=frequency,
            days_of_week=days_of_week,
            day_of_month=day_of_month,
            scheduled_time_str=recurrence_time
        )

        recurring = models.RecurringTrigger(
            client_id=client_id,
            template_name=template_name,
            template_language=language,
            template_components=template_components,
            contacts_list=contacts,
            delay_seconds=delay_seconds,
            concurrency_limit=concurrency_limit,
            button_actions=button_actions if button_actions else None,
            frequency=frequency,
            days_of_week=days_of_week if days_of_week else None,
            day_of_month=day_of_month if day_of_month else None,
            scheduled_time=recurrence_time,
            is_active=True,
            next_run_at=next_run
        )
        db.add(recurring)
        db.commit()
        db.refresh(recurring)

        logger.info(
            f"🔄 [BULK_TEMPLATE] Disparo recorrente criado #{recurring.id} ({frequency} às {recurrence_time}) "
            f"para {len(contacts)} contatos pelo usuário {current_user.email}"
        )

        return {
            "status": "ok",
            "mode": "recurring",
            "recurring_id": recurring.id,
            "template_name": template_name,
            "total_contacts": len(contacts),
            "frequency": frequency,
            "scheduled_time": recurrence_time,
            "next_run_at": recurring.next_run_at.isoformat() if recurring.next_run_at else None,
            "message": f"Disparo recorrente do template '{template_name}' configurado com sucesso para {len(contacts)} conversa(s)!"
        }

    # 2. Configuração de Agendamento Futuro Único vs Envio Imediato
    scheduled_time_raw = payload.get("scheduled_time")
    sched_dt = None
    is_scheduled_future = False

    if scheduled_time_raw and str(scheduled_time_raw).strip():
        try:
            s_clean = str(scheduled_time_raw).strip().replace("Z", "+00:00")
            parsed = datetime.fromisoformat(s_clean)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone(timedelta(hours=-3))).astimezone(timezone.utc)
            else:
                parsed = parsed.astimezone(timezone.utc)
            
            if parsed > datetime.now(timezone.utc) + timedelta(seconds=30):
                sched_dt = parsed
                is_scheduled_future = True
        except Exception as e_parse:
            logger.warning(f"⚠️ [BULK_TEMPLATE] Não foi possível parsear scheduled_time '{scheduled_time_raw}': {e_parse}")

    trigger_status = 'queued' if is_scheduled_future else 'processing'
    trigger_time = sched_dt if is_scheduled_future else datetime.now(timezone.utc)

    trigger = models.ScheduledTrigger(
        client_id=client_id,
        template_name=template_name,
        template_language=language,
        status=trigger_status,
        is_bulk=True,
        contacts_list=contacts,
        total_contacts=len(contacts),
        pending_contacts=[c["phone"] for c in contacts],
        processed_contacts=[],
        delay_seconds=delay_seconds,
        concurrency_limit=concurrency_limit,
        scheduled_time=trigger_time,
        template_components=template_components,
        button_actions=button_actions if button_actions else None,
        contact_labels=contact_labels if contact_labels else None
    )
    db.add(trigger)
    db.flush()

    # Processar Follow-ups caso ativado
    is_followup_enabled = payload.get("is_followup_enabled", False)
    followups_data = payload.get("followups") or []
    if is_followup_enabled and followups_data:
        try:
            create_followup_triggers(db, trigger, followups_data, client_id)
            logger.info(f"🔁 [BULK_TEMPLATE] {len(followups_data)} etapas de follow-up vinculadas ao Trigger #{trigger.id}.")
        except Exception as e_fu:
            logger.error(f"Erro ao criar etapas de follow-up para Trigger #{trigger.id}: {e_fu}")

    db.commit()
    db.refresh(trigger)

    if not is_scheduled_future:
        from rabbitmq_client import rabbitmq
        try:
            await rabbitmq.publish("zapvoice_bulk_sends", {
                "trigger_id": trigger.id,
                "template_name": template_name,
                "contacts": contacts,
                "delay": delay_seconds,
                "concurrency": concurrency_limit,
                "language": language,
                "components": template_components
            })
        except Exception as e:
            logger.error(f"Erro ao publicar disparo de template em massa no RabbitMQ: {e}")

        logger.info(
            f"📨 [BULK_TEMPLATE] Template '{template_name}' disparado imediatamente para {len(contacts)} contatos "
            f"(Trigger #{trigger.id}) pelo usuário {current_user.email}"
        )
        resp_msg = f"Disparo do template '{template_name}' iniciado com sucesso para {len(contacts)} conversa(s)!"
    else:
        logger.info(
            f"📅 [BULK_TEMPLATE] Template '{template_name}' agendado para {trigger.scheduled_time.isoformat()} "
            f"({len(contacts)} contatos, Trigger #{trigger.id}) pelo usuário {current_user.email}"
        )
        resp_msg = f"Disparo do template '{template_name}' agendado com sucesso para {len(contacts)} conversa(s)!"

    return {
        "status": "ok",
        "mode": "scheduled" if is_scheduled_future else "immediate",
        "trigger_id": trigger.id,
        "template_name": template_name,
        "total_contacts": len(contacts),
        "scheduled_time": trigger.scheduled_time.isoformat(),
        "message": resp_msg
    }

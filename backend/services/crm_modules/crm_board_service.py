from typing import Optional, Dict, Any, List
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from core.logger import setup_logger
from models.crm import SalesPipeline, SalesPipelineStage, SalesDeal
from models.chat import ChatConversation
from routers.chat.common import get_user_unread_count

logger = setup_logger("crm_board_service")


def _build_conversations_lookup(
    db: Session,
    client_id: int,
    deals: List[SalesDeal]
) -> Dict[str, Any]:
    """
    Realiza consulta ultra-rápida e otimizada na tabela ChatConversation filtrando
    estritamente pelos telefones e sufixos dos contatos do pipeline, evitando varredura global.
    """
    exact_map: Dict[str, Any] = {}
    suffix_map: Dict[str, Any] = {}

    if not deals:
        return {"exact": exact_map, "suffix": suffix_map}

    deal_phones = set()
    suffixes = set()
    for d in deals:
        raw = str(d.contact_phone or "").strip()
        if not raw:
            continue
        deal_phones.add(raw)
        digits = "".join(filter(str.isdigit, raw))
        if digits:
            deal_phones.add(digits)
            if digits.startswith("55") and len(digits) > 10:
                deal_phones.add(digits[2:])
            else:
                deal_phones.add(f"55{digits}")
            if len(digits) >= 8:
                suffixes.add(digits[-8:])

    if not deal_phones and not suffixes:
        return {"exact": exact_map, "suffix": suffix_map}

    # Busca em lotes com .in_ pelos telefones conhecidos
    phone_list = list(deal_phones)
    chunk_size = 200
    convos = []
    for i in range(0, max(1, len(phone_list)), chunk_size):
        chunk = phone_list[i:i + chunk_size]
        if chunk:
            batch = db.query(ChatConversation).filter(
                ChatConversation.client_id == client_id,
                ChatConversation.phone.in_(chunk)
            ).order_by(ChatConversation.last_message_at.desc().nullslast()).all()
            convos.extend(batch)

    # Identifica telefones já mapeados
    for c in convos:
        c_digits = "".join(filter(str.isdigit, str(c.phone or "")))
        if not c_digits:
            continue
        if c_digits not in exact_map:
            exact_map[c_digits] = c
        if len(c_digits) >= 8:
            suf = c_digits[-8:]
            if suf not in suffix_map:
                suffix_map[suf] = c

    # Se ainda houver sufixos de deals sem match direto, busca apenas os faltantes
    unmatched_suffixes = [s for s in suffixes if s not in suffix_map]
    if unmatched_suffixes:
        suf_chunk_size = 50
        for i in range(0, len(unmatched_suffixes), suf_chunk_size):
            suf_chunk = unmatched_suffixes[i:i + suf_chunk_size]
            like_conds = [ChatConversation.phone.like(f"%{suf}") for suf in suf_chunk]
            extra_convos = db.query(ChatConversation).filter(
                ChatConversation.client_id == client_id,
                or_(*like_conds)
            ).order_by(ChatConversation.last_message_at.desc().nullslast()).all()
            for c in extra_convos:
                c_digits = "".join(filter(str.isdigit, str(c.phone or "")))
                if not c_digits:
                    continue
                if c_digits not in exact_map:
                    exact_map[c_digits] = c
                if len(c_digits) >= 8:
                    suf = c_digits[-8:]
                    if suf not in suffix_map:
                        suffix_map[suf] = c

    return {"exact": exact_map, "suffix": suffix_map}


def resolve_deal_chat_metrics(
    deal_phone: str,
    lookup: Dict[str, Any],
    now_utc: datetime,
    current_user_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Calcula o status da janela de 24h e a contagem de mensagens não lidas (individual por usuário)
    para o contato do card do Kanban.
    """
    digits = "".join(filter(str.isdigit, str(deal_phone or "")))
    convo = None
    if digits:
        convo = lookup["exact"].get(digits)
        if not convo and len(digits) >= 8:
            convo = lookup["suffix"].get(digits[-8:])

    if not convo:
        return {
            "conversation_id": None,
            "window_open": False,
            "window_expires_at": None,
            "window_remaining_seconds": 0.0,
            "unread_count": 0
        }

    window_open = False
    window_expires_at = None
    window_remaining_seconds = 0.0

    last_contact_msg = getattr(convo, "last_contact_message_at", None)
    if last_contact_msg:
        last_utc = (
            last_contact_msg
            if last_contact_msg.tzinfo
            else last_contact_msg.replace(tzinfo=timezone.utc)
        )
        expires_utc = last_utc + timedelta(hours=24)
        rem_sec = (expires_utc - now_utc).total_seconds()
        if rem_sec > 0:
            window_open = True
            window_expires_at = expires_utc
            window_remaining_seconds = float(rem_sec)

    unread_count = get_user_unread_count(convo, current_user_id)

    return {
        "conversation_id": convo.id,
        "window_open": window_open,
        "window_expires_at": window_expires_at,
        "window_remaining_seconds": window_remaining_seconds,
        "unread_count": unread_count
    }


def build_pipeline_board_data(
    db: Session,
    client_id: int,
    pipeline_id: int,
    current_user: Any = None,
    create_default_stages_fn=None
) -> Dict[str, Any]:
    """
    Constrói o quadro Kanban completo enriquecido com:
    - Janela de 24h aberta por card (window_open, window_expires_at, window_remaining_seconds)
    - Mensagens não lidas individuais para o usuário autenticado (unread_count)
    - Porcentagem e contagem de janela 24h aberta por etapa e no pipeline geral
    """
    pipe = db.query(SalesPipeline).filter(
        SalesPipeline.id == pipeline_id,
        SalesPipeline.client_id == client_id
    ).first()

    if not pipe:
        raise HTTPException(status_code=404, detail="Pipeline não encontrado")

    stages = db.query(SalesPipelineStage).filter(
        SalesPipelineStage.pipeline_id == pipeline_id
    ).order_by(SalesPipelineStage.order_index.asc()).all()

    if not stages and create_default_stages_fn:
        stages = create_default_stages_fn(db, pipeline_id, client_id)

    # Buscar todos os deals do pipeline em 1 única query rápida e agrupar por estágio
    all_deals = db.query(SalesDeal).filter(
        SalesDeal.pipeline_id == pipeline_id,
        SalesDeal.client_id == client_id
    ).order_by(SalesDeal.updated_at.desc()).all()

    stage_deals_map: Dict[int, List[SalesDeal]] = {}
    for d in all_deals:
        if d.stage_id not in stage_deals_map:
            stage_deals_map[d.stage_id] = []
        stage_deals_map[d.stage_id].append(d)

    now_utc = datetime.now(timezone.utc)
    current_user_id = getattr(current_user, "id", None) if current_user else None
    convo_lookup = _build_conversations_lookup(db, client_id, all_deals)

    stages_data = []
    board_total_deals = 0
    board_total_val = 0.0
    board_won_val = 0.0
    board_won_deals = 0
    board_window_open_deals = 0
    board_unread_deals = 0

    for s in stages:
        deals = stage_deals_map.get(s.id, [])
        stage_deals_count = len(deals)
        stage_total_val = sum(float(d.value or 0.0) for d in deals)

        board_total_deals += stage_deals_count
        board_total_val += stage_total_val

        if s.stage_type == "won":
            board_won_deals += stage_deals_count
            board_won_val += stage_total_val

        is_fo = bool(getattr(s, "is_followup", False))
        fo_delay_val = getattr(s, "followup_delay_value", 3) or 3
        fo_delay_unit = getattr(s, "followup_delay_unit", "hours") or "hours"
        limit_sec = fo_delay_val * 3600
        if fo_delay_unit == "minutes":
            limit_sec = fo_delay_val * 60
        elif fo_delay_unit == "days":
            limit_sec = fo_delay_val * 86400

        deals_serialized = []
        overdue_cnt = 0
        stage_window_open_cnt = 0
        stage_unread_cnt = 0

        for d in deals:
            d_entered = d.stage_entered_at or d.updated_at or d.created_at
            chat_metrics = resolve_deal_chat_metrics(
                deal_phone=d.contact_phone,
                lookup=convo_lookup,
                now_utc=now_utc,
                current_user_id=current_user_id
            )

            if chat_metrics["window_open"]:
                stage_window_open_cnt += 1
                board_window_open_deals += 1
            if (chat_metrics["unread_count"] or 0) > 0:
                stage_unread_cnt += 1
                board_unread_deals += 1

            d_dict = {
                "id": d.id,
                "client_id": d.client_id,
                "pipeline_id": d.pipeline_id,
                "stage_id": d.stage_id,
                "lead_id": d.lead_id,
                "product_id": d.product_id,
                "contact_phone": d.contact_phone,
                "contact_name": d.contact_name,
                "contact_email": d.contact_email,
                "title": d.title,
                "product_name": d.product_name,
                "channel": d.channel,
                "original_value": float(d.original_value or 0.0),
                "value": float(d.value or 0.0),
                "status": d.status,
                "lost_reason": d.lost_reason,
                "notes": d.notes,
                "custom_followup_delay_value": getattr(d, "custom_followup_delay_value", None),
                "custom_followup_delay_unit": getattr(d, "custom_followup_delay_unit", "hours") or "hours",
                "last_interaction_at": d.last_interaction_at,
                "stage_entered_at": d_entered,
                "conversation_id": chat_metrics["conversation_id"],
                "window_open": chat_metrics["window_open"],
                "window_expires_at": chat_metrics["window_expires_at"],
                "window_remaining_seconds": chat_metrics["window_remaining_seconds"],
                "unread_count": chat_metrics["unread_count"],
                "created_at": d.created_at,
                "updated_at": d.updated_at
            }

            deal_custom_val = getattr(d, "custom_followup_delay_value", None)
            deal_custom_unit = getattr(d, "custom_followup_delay_unit", None) or "hours"
            has_custom_fo = deal_custom_val is not None and deal_custom_val > 0

            if (is_fo or has_custom_fo) and d_entered:
                eff_delay_val = deal_custom_val if has_custom_fo else fo_delay_val
                eff_delay_unit = deal_custom_unit if has_custom_fo else fo_delay_unit
                deal_limit_sec = eff_delay_val * 3600
                if eff_delay_unit == "minutes":
                    deal_limit_sec = eff_delay_val * 60
                elif eff_delay_unit == "days":
                    deal_limit_sec = eff_delay_val * 86400

                entered_utc = d_entered if d_entered.tzinfo else d_entered.replace(tzinfo=timezone.utc)
                elapsed = (now_utc - entered_utc).total_seconds()
                needs_fo = elapsed >= deal_limit_sec
                d_dict["needs_followup"] = needs_fo
                if needs_fo:
                    overdue_cnt += 1
                    d_dict["followup_overdue_seconds"] = elapsed - deal_limit_sec
                else:
                    d_dict["followup_remaining_seconds"] = deal_limit_sec - elapsed
            else:
                d_dict["needs_followup"] = False

            deals_serialized.append(d_dict)

        stage_window_pct = (
            round((stage_window_open_cnt / stage_deals_count) * 100, 1)
            if stage_deals_count > 0
            else 0.0
        )

        stages_data.append({
            "id": s.id,
            "pipeline_id": s.pipeline_id,
            "client_id": s.client_id,
            "name": s.name,
            "order_index": s.order_index,
            "color": s.color,
            "stage_type": s.stage_type,
            "webhook_event_trigger": s.webhook_event_trigger,
            "forward_to_pipeline_id": getattr(s, "forward_to_pipeline_id", None),
            "forward_to_stage_id": getattr(s, "forward_to_stage_id", None),
            "is_followup": is_fo,
            "followup_delay_value": fo_delay_val,
            "followup_delay_unit": fo_delay_unit,
            "followup_overdue_count": overdue_cnt,
            "window_open_deals": stage_window_open_cnt,
            "window_open_percentage": stage_window_pct,
            "unread_deals": stage_unread_cnt,
            "created_at": s.created_at,
            "updated_at": s.updated_at,
            "deals": deals_serialized,
            "total_deals": stage_deals_count,
            "total_value": stage_total_val
        })

    board_conversion_rate = round((board_won_deals / board_total_deals) * 100, 2) if board_total_deals > 0 else 0.0
    board_window_open_pct = (
        round((board_window_open_deals / board_total_deals) * 100, 1)
        if board_total_deals > 0
        else 0.0
    )

    for stg in stages_data:
        stg["percentage"] = round((stg["total_deals"] / board_total_deals) * 100, 1) if board_total_deals > 0 else 0.0

    pipe_response = {
        "id": pipe.id,
        "client_id": pipe.client_id,
        "name": pipe.name,
        "product_name": pipe.product_name,
        "associated_tags": pipe.associated_tags,
        "default_value": float(pipe.default_value or 0.0),
        "order_index": pipe.order_index,
        "is_default": pipe.is_default,
        "stages_count": len(stages),
        "deals_count": board_total_deals,
        "total_value": board_total_val,
        "created_at": pipe.created_at,
        "updated_at": pipe.updated_at
    }

    return {
        "pipeline": pipe_response,
        "stages": stages_data,
        "total_deals": board_total_deals,
        "total_value": board_total_val,
        "total_won_value": board_won_val,
        "total_won_deals": board_won_deals,
        "conversion_rate": board_conversion_rate,
        "total_window_open_deals": board_window_open_deals,
        "window_open_percentage": board_window_open_pct,
        "total_unread_deals": board_unread_deals
    }

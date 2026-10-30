from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from core.logger import setup_logger
from models.crm import SalesPipeline, SalesPipelineStage, SalesDeal, CRMProduct as CrmProduct
from models.chat import ChatConversation, ChatMessage

logger = setup_logger("crm_bulk_service")


def bulk_delete_deals(db: Session, client_id: int, deal_ids: List[int]) -> int:
    """Exclui múltiplos deals do cliente de forma atômica."""
    if not deal_ids:
        return 0
    deleted = db.query(SalesDeal).filter(
        SalesDeal.client_id == client_id,
        SalesDeal.id.in_(deal_ids)
    ).delete(synchronize_session=False)
    db.commit()
    logger.info(f"🗑️ [CRM] {deleted} oportunidades excluídas em massa para client_id {client_id}.")
    return deleted


def bulk_update_deals(
    db: Session,
    client_id: int,
    deal_ids: List[int],
    update_product: bool = False,
    product_id: Optional[int] = None,
    product_name: Optional[str] = None,
    update_value: bool = False,
    value: Optional[float] = None
) -> int:
    """Atualiza produto e/ou preço de múltiplos deals do cliente."""
    if not deal_ids:
        return 0

    deals = db.query(SalesDeal).filter(
        SalesDeal.client_id == client_id,
        SalesDeal.id.in_(deal_ids)
    ).all()

    if not deals:
        return 0

    catalog_product = None
    if update_product and product_id and product_id > 0:
        catalog_product = db.query(CrmProduct).filter(
            CrmProduct.id == product_id,
            CrmProduct.client_id == client_id
        ).first()

    prod_name_to_set = None
    if update_product:
        if catalog_product:
            prod_name_to_set = catalog_product.name
        elif product_name:
            prod_name_to_set = product_name.strip()
        else:
            prod_name_to_set = None

    now = datetime.now(timezone.utc)
    for deal in deals:
        if update_product:
            deal.product_id = catalog_product.id if catalog_product else (product_id if product_id and product_id > 0 else None)
            deal.product_name = prod_name_to_set
            if catalog_product and catalog_product.price is not None:
                deal.original_value = float(catalog_product.price)
        if update_value:
            deal.value = float(value or 0.0)
        deal.updated_at = now

    db.commit()
    logger.info(
        f"✏️ [CRM] {len(deals)} oportunidades atualizadas em massa para client_id {client_id} "
        f"(update_product={update_product}, update_value={update_value})."
    )
    return len(deals)


def add_pipeline_private_note(
    db: Session,
    client_id: int,
    convo_id: Optional[int] = None,
    phone: Optional[str] = None,
    pipeline_name: str = "",
    stage_name: str = "",
    user_id: Optional[int] = None,
    action_type: str = "added",
    commit: bool = True
):
    """Cria uma anotação privada na conversa informando a adição/movimentação na pipeline do Kanban."""
    convo = None
    if convo_id:
        convo = db.query(ChatConversation).filter(
            ChatConversation.id == convo_id,
            ChatConversation.client_id == client_id
        ).first()
    elif phone:
        digits = "".join(filter(str.isdigit, str(phone)))
        if len(digits) >= 8:
            convo = db.query(ChatConversation).filter(
                ChatConversation.client_id == client_id,
                ChatConversation.phone.like(f"%{digits[-8:]}")
            ).first()

    if not convo:
        return

    if action_type == "moved":
        note_text = f"Oportunidade movida para a etapa '{stage_name}' na pipeline '{pipeline_name}'."
    else:
        note_text = f"Contato adicionado à pipeline '{pipeline_name}' (Etapa: {stage_name})."

    full_content = f"🔒 Anotação Privada: {note_text}"

    msg = ChatMessage(
        conversation_id=convo.id,
        sender_type="system",
        user_id=user_id,
        message_type="text",
        content=full_content,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(msg)

    convo.private_note = note_text
    convo.last_message_content = f"🔒 Nota: {note_text}"
    convo.last_message_at = datetime.now(timezone.utc)
    if commit:
        db.commit()
    logger.info(f"📝 [CRM] Anotação privada registrada na conversa #{convo.id} para {convo.phone}: {note_text}")


def bulk_add_contacts_to_pipeline(
    db: Session,
    client_id: int,
    current_user: Any,
    payload: Dict[str, Any],
    create_default_stages_fn=None
) -> Dict[str, Any]:
    """
    Adiciona contatos em massa (selecionados por IDs ou por filtros/todas as páginas)
    a uma pipeline existente ou recém-criada no Kanban.
    """
    from fastapi import HTTPException
    from routers.chat.conversation_modules.conversation_filter_helpers import build_conversation_filter_query
    if create_default_stages_fn is None:
        from services.crm_service import create_default_stages as _default_stages_fn
        create_default_stages_fn = _default_stages_fn

    select_all_pages = payload.get("select_all_pages", False)
    ids = payload.get("ids", [])
    excluded_ids = payload.get("excluded_ids", [])

    if not select_all_pages and not ids:
        raise HTTPException(status_code=400, detail="Nenhum contato selecionado.")

    new_pipeline_name = payload.get("new_pipeline_name")
    pipeline_id = payload.get("pipeline_id")
    target_pipeline = None

    if new_pipeline_name and str(new_pipeline_name).strip():
        clean_name = str(new_pipeline_name).strip()
        prod_name = payload.get("product_name")
        def_val = float(payload.get("default_value") or payload.get("value") or 0.0)

        target_pipeline = SalesPipeline(
            client_id=client_id,
            name=clean_name,
            product_name=prod_name,
            default_value=def_val,
            is_default=False
        )
        db.add(target_pipeline)
        db.commit()
        db.refresh(target_pipeline)

        if create_default_stages_fn:
            create_default_stages_fn(db, target_pipeline.id, client_id)
        db.refresh(target_pipeline)
        pipeline_id = target_pipeline.id
        logger.info(f"✨ [CRM] Nova pipeline criada via ação em massa: '{clean_name}' (ID {pipeline_id}) para client_id {client_id}.")
    else:
        if not pipeline_id:
            raise HTTPException(status_code=400, detail="Pipeline de destino não informada.")
        target_pipeline = db.query(SalesPipeline).filter(
            SalesPipeline.id == pipeline_id,
            SalesPipeline.client_id == client_id
        ).first()
        if not target_pipeline:
            raise HTTPException(status_code=404, detail="Pipeline não encontrada.")

    stage_id = payload.get("stage_id")
    target_stage = None
    if stage_id:
        target_stage = db.query(SalesPipelineStage).filter(
            SalesPipelineStage.id == stage_id,
            SalesPipelineStage.pipeline_id == target_pipeline.id,
            SalesPipelineStage.client_id == client_id
        ).first()

    if not target_stage:
        target_stage = db.query(SalesPipelineStage).filter(
            SalesPipelineStage.pipeline_id == target_pipeline.id,
            SalesPipelineStage.client_id == client_id
        ).order_by(SalesPipelineStage.order_index.asc()).first()

    if not target_stage and create_default_stages_fn:
        stages = create_default_stages_fn(db, target_pipeline.id, client_id)
        target_stage = stages[0]

    if select_all_pages:
        q = build_conversation_filter_query(
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
            start_date=payload.get("start_date"),
            end_date=payload.get("end_date"),
            search=payload.get("search"),
            has_note=payload.get("has_note"),
            order_by=payload.get("order_by", "recent"),
            excluded_ids=excluded_ids
        )
        convos = q.with_entities(
            ChatConversation.id,
            ChatConversation.phone,
            ChatConversation.contact_name
        ).all()
    else:
        convos = db.query(
            ChatConversation.id,
            ChatConversation.phone,
            ChatConversation.contact_name
        ).filter(
            ChatConversation.client_id == client_id,
            ChatConversation.id.in_(ids)
        ).all()

    if not convos:
        return {
            "message": "Nenhum contato encontrado para os filtros selecionados.",
            "count": 0,
            "created": 0,
            "updated": 0,
            "pipeline_id": target_pipeline.id,
            "pipeline_name": target_pipeline.name
        }

    prod_id = payload.get("product_id")
    product_obj = db.query(CrmProduct).filter(CrmProduct.id == prod_id, CrmProduct.client_id == client_id).first() if prod_id else None
    deal_product = payload.get("product_name") or (product_obj.name if product_obj else None) or target_pipeline.product_name
    deal_value = float(payload.get("value") or (product_obj.price if product_obj and product_obj.price else None) or target_pipeline.default_value or 0.0)
    orig_val = float(product_obj.price) if product_obj and product_obj.price else deal_value
    stage_status = target_stage.stage_type if target_stage.stage_type in ["won", "lost"] else "open"

    created_count = 0
    updated_count = 0
    now = datetime.now(timezone.utc)

    for convo in convos:
        digits = "".join(filter(str.isdigit, str(convo.phone or "")))
        if len(digits) < 8:
            continue

        existing_deal = db.query(SalesDeal).filter(
            SalesDeal.client_id == client_id,
            SalesDeal.pipeline_id == target_pipeline.id,
            SalesDeal.contact_phone.like(f"%{digits[-8:]}")
        ).first()

        if existing_deal:
            existing_deal.stage_id = target_stage.id
            existing_deal.status = stage_status
            existing_deal.last_interaction_at = now
            existing_deal.updated_at = now
            if deal_value > 0.0:
                existing_deal.value = deal_value
            if orig_val > 0.0:
                existing_deal.original_value = orig_val
            if deal_product:
                existing_deal.product_name = deal_product
            if product_obj:
                existing_deal.product_id = product_obj.id
            updated_count += 1
        else:
            new_deal = SalesDeal(
                client_id=client_id,
                pipeline_id=target_pipeline.id,
                stage_id=target_stage.id,
                product_id=product_obj.id if product_obj else prod_id,
                contact_phone=digits,
                contact_name=convo.contact_name or "Sem Nome",
                title=f"Oportunidade - {convo.contact_name or digits}",
                channel="chat",
                value=deal_value,
                original_value=orig_val,
                product_name=deal_product,
                status=stage_status,
                last_interaction_at=now,
                created_at=now,
                updated_at=now
            )
            db.add(new_deal)
            created_count += 1

        add_pipeline_private_note(
            db=db,
            client_id=client_id,
            convo_id=convo.id,
            pipeline_name=target_pipeline.name,
            stage_name=target_stage.name,
            user_id=current_user.id if current_user and hasattr(current_user, "id") else None,
            action_type="moved" if existing_deal else "added",
            commit=False
        )

    db.commit()
    total_processed = created_count + updated_count
    logger.info(
        f"✅ [CRM] Ação em massa concluída: {total_processed} contatos adicionados/atualizados "
        f"na pipeline '{target_pipeline.name}' (estágio '{target_stage.name}') para client_id {client_id}."
    )

    return {
        "message": f"{total_processed} contatos processados na pipeline '{target_pipeline.name}' com sucesso.",
        "count": total_processed,
        "created": created_count,
        "updated": updated_count,
        "pipeline_id": target_pipeline.id,
        "pipeline_name": target_pipeline.name,
        "stage_id": target_stage.id,
        "stage_name": target_stage.name
    }

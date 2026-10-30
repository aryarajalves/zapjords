from typing import Any
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session

from core.logger import setup_logger
from models.crm import SalesPipeline, SalesPipelineStage, SalesDeal, CRMProduct
from models.trigger import WebhookLead

logger = setup_logger("crm_deal_ops_service")


def create_deal_entry(
    db: Session,
    client_id: int,
    payload: Any,
    current_user: Any,
    crm_service_module: Any
) -> SalesDeal:
    digits = "".join(filter(str.isdigit, str(payload.contact_phone)))
    if len(digits) < 8:
        raise HTTPException(status_code=400, detail="Número de telefone inválido")

    stg = db.query(SalesPipelineStage).filter(
        SalesPipelineStage.id == payload.stage_id,
        SalesPipelineStage.client_id == client_id
    ).first()
    if not stg:
        raise HTTPException(status_code=404, detail="Estágio não encontrado")

    product_obj = None
    if payload.product_id:
        product_obj = db.query(CRMProduct).filter(
            CRMProduct.id == payload.product_id,
            CRMProduct.client_id == client_id
        ).first()

    prod_name = payload.product_name or (product_obj.name if product_obj else None)
    orig_val = float(payload.original_value or 0.0)
    if orig_val <= 0.0 and product_obj:
        orig_val = float(product_obj.price or 0.0)

    val = float(payload.value or 0.0)
    if val <= 0.0:
        if orig_val > 0.0:
            val = orig_val
        else:
            pipe = db.query(SalesPipeline).filter(
                SalesPipeline.id == payload.pipeline_id,
                SalesPipeline.client_id == client_id
            ).first()
            if pipe and pipe.default_value and pipe.default_value > 0.0:
                val = float(pipe.default_value)
                if orig_val <= 0.0:
                    orig_val = val

    deal_channel = payload.channel.strip() if payload.channel else None
    if not deal_channel and payload.lead_id:
        lead = db.query(WebhookLead).filter(WebhookLead.id == payload.lead_id).first()
        if lead and lead.platform:
            deal_channel = lead.platform
    if not deal_channel:
        deal_channel = "whatsapp"

    deal = SalesDeal(
        client_id=client_id,
        pipeline_id=payload.pipeline_id,
        stage_id=payload.stage_id,
        lead_id=payload.lead_id,
        product_id=product_obj.id if product_obj else payload.product_id,
        product_name=prod_name,
        original_value=orig_val,
        contact_phone=digits,
        contact_name=payload.contact_name or "Sem Nome",
        contact_email=payload.contact_email,
        title=payload.title or f"Oportunidade - {payload.contact_name or digits}",
        channel=deal_channel,
        value=val,
        status=payload.status or "open",
        lost_reason=payload.lost_reason,
        notes=payload.notes,
        custom_followup_delay_value=payload.custom_followup_delay_value if getattr(payload, "custom_followup_delay_value", None) else None,
        custom_followup_delay_unit=getattr(payload, "custom_followup_delay_unit", "hours") or "hours",
        last_interaction_at=datetime.now(timezone.utc),
        stage_entered_at=datetime.now(timezone.utc)
    )
    db.add(deal)
    db.commit()
    db.refresh(deal)

    stg = db.query(SalesPipelineStage).filter(SalesPipelineStage.id == deal.stage_id).first()
    if stg:
        crm_service_module.check_and_forward_deal_if_configured(db, deal, stg)
    pipe_obj = db.query(SalesPipeline).filter(SalesPipeline.id == deal.pipeline_id).first()
    crm_service_module.add_pipeline_private_note(
        db=db,
        client_id=client_id,
        phone=digits,
        pipeline_name=pipe_obj.name if pipe_obj else "",
        stage_name=stg.name if stg else "",
        user_id=current_user.id if current_user and hasattr(current_user, "id") else None,
        action_type="added"
    )
    return deal


def move_deal_entry(
    db: Session,
    deal_id: int,
    client_id: int,
    payload: Any,
    current_user: Any,
    crm_service_module: Any
) -> SalesDeal:
    deal = db.query(SalesDeal).filter(
        SalesDeal.id == deal_id,
        SalesDeal.client_id == client_id
    ).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Oportunidade não encontrada")

    new_stg = db.query(SalesPipelineStage).filter(
        SalesPipelineStage.id == payload.stage_id,
        SalesPipelineStage.client_id == client_id
    ).first()
    if not new_stg:
        raise HTTPException(status_code=404, detail="Estágio destino não encontrado")

    # Se soltou na mesma coluna (mesmo estágio), não atualiza nada e não envia nota privada
    if deal.stage_id == new_stg.id:
        return deal

    if deal.stage_id != new_stg.id:
        deal.stage_entered_at = datetime.now(timezone.utc)
    deal.stage_id = new_stg.id
    if new_stg.stage_type == "won":
        deal.status = "won"
    elif new_stg.stage_type == "lost":
        deal.status = "lost"
    else:
        deal.status = "open"

    if payload.lost_reason is not None:
        deal.lost_reason = payload.lost_reason.strip() if payload.lost_reason else None

    deal.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(deal)
    crm_service_module.check_and_forward_deal_if_configured(db, deal, new_stg)
    pipe_obj = db.query(SalesPipeline).filter(SalesPipeline.id == deal.pipeline_id).first()
    crm_service_module.add_pipeline_private_note(
        db=db,
        client_id=client_id,
        phone=deal.contact_phone,
        pipeline_name=pipe_obj.name if pipe_obj else "",
        stage_name=new_stg.name,
        user_id=current_user.id if current_user and hasattr(current_user, "id") else None,
        action_type="moved",
        commit=True
    )
    return deal


def update_deal_entry(
    db: Session,
    deal_id: int,
    client_id: int,
    payload: Any,
    crm_service_module: Any
) -> SalesDeal:
    deal = db.query(SalesDeal).filter(
        SalesDeal.id == deal_id,
        SalesDeal.client_id == client_id
    ).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Oportunidade não encontrada")

    if payload.contact_name is not None:
        deal.contact_name = payload.contact_name
    if payload.contact_email is not None:
        deal.contact_email = payload.contact_email
    if payload.title is not None:
        deal.title = payload.title
    if payload.product_id is not None:
        deal.product_id = payload.product_id if payload.product_id > 0 else None
    if payload.product_name is not None:
        deal.product_name = payload.product_name.strip() if payload.product_name else None
    if payload.original_value is not None:
        deal.original_value = float(payload.original_value)
    if payload.value is not None:
        deal.value = float(payload.value)
    if payload.status is not None:
        deal.status = payload.status
    if payload.lost_reason is not None:
        deal.lost_reason = payload.lost_reason
    if payload.notes is not None:
        deal.notes = payload.notes
    if payload.channel is not None:
        deal.channel = payload.channel.strip() if payload.channel else None
    if getattr(payload, "clear_custom_followup", False):
        deal.custom_followup_delay_value = None
        deal.custom_followup_delay_unit = "hours"
    elif getattr(payload, "custom_followup_delay_value", None) is not None:
        deal.custom_followup_delay_value = int(payload.custom_followup_delay_value) if payload.custom_followup_delay_value > 0 else None
        if getattr(payload, "custom_followup_delay_unit", None):
            deal.custom_followup_delay_unit = payload.custom_followup_delay_unit
    if payload.stage_id is not None:
        if deal.stage_id != payload.stage_id:
            deal.stage_entered_at = datetime.now(timezone.utc)
        deal.stage_id = payload.stage_id

    deal.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(deal)
    if payload.stage_id is not None:
        target_stg = db.query(SalesPipelineStage).filter(SalesPipelineStage.id == deal.stage_id).first()
        if target_stg:
            crm_service_module.check_and_forward_deal_if_configured(db, deal, target_stg)
    return deal


def move_or_upsert_contact_deal_entry(
    db: Session,
    client_id: int,
    payload: Any,
    current_user: Any,
    crm_service_module: Any
) -> SalesDeal:
    digits = "".join(filter(str.isdigit, str(payload.contact_phone)))
    if len(digits) < 8:
        raise HTTPException(status_code=400, detail="Número de telefone inválido")

    stage = db.query(SalesPipelineStage).filter(
        SalesPipelineStage.id == payload.stage_id,
        SalesPipelineStage.client_id == client_id
    ).first()
    if not stage:
        raise HTTPException(status_code=404, detail="Estágio de destino não encontrado")

    pipeline_id = stage.pipeline_id

    status_val = "open"
    if stage.stage_type == "won":
        status_val = "won"
    elif stage.stage_type == "lost" or "desist" in stage.name.lower():
        status_val = "lost"

    product_obj = None
    if payload.product_id:
        product_obj = db.query(CRMProduct).filter(
            CRMProduct.id == payload.product_id,
            CRMProduct.client_id == client_id
        ).first()

    prod_name = payload.product_name or (product_obj.name if product_obj else None)
    val = float(payload.value or 0.0)
    orig_val = 0.0
    if product_obj and product_obj.price:
        orig_val = float(product_obj.price)
    if val <= 0.0 and orig_val > 0.0:
        val = orig_val

    deal = db.query(SalesDeal).filter(
        SalesDeal.client_id == client_id,
        SalesDeal.pipeline_id == pipeline_id,
        SalesDeal.contact_phone.like(f"%{digits[-8:]}")
    ).first()

    if deal:
        deal.stage_id = stage.id
        deal.status = status_val
        if payload.contact_name:
            deal.contact_name = payload.contact_name.strip()
        if payload.contact_email:
            deal.contact_email = payload.contact_email.strip()
        if prod_name:
            deal.product_name = prod_name
        if product_obj:
            deal.product_id = product_obj.id
        if orig_val > 0.0:
            deal.original_value = orig_val
        if val > 0.0:
            deal.value = val
        if status_val == "lost":
            deal.lost_reason = payload.lost_reason.strip() if payload.lost_reason else None
        else:
            deal.lost_reason = None
        if payload.notes:
            deal.notes = payload.notes.strip()
        deal.last_interaction_at = datetime.now(timezone.utc)
        deal.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(deal)
        logger.info(f"✅ [CRM] Lead {digits} movido para estágio '{stage.name}' no pipeline {pipeline_id}.")
        crm_service_module.check_and_forward_deal_if_configured(db, deal, stage)
        pipeline_obj = db.query(SalesPipeline).filter(SalesPipeline.id == pipeline_id).first()
        pipe_name = pipeline_obj.name if pipeline_obj else ""
        crm_service_module.add_pipeline_private_note(
            db=db,
            client_id=client_id,
            phone=digits,
            pipeline_name=pipe_name,
            stage_name=stage.name,
            user_id=current_user.id if current_user and hasattr(current_user, "id") else None,
            action_type="moved"
        )
        return deal
    else:
        new_deal = SalesDeal(
            client_id=client_id,
            pipeline_id=pipeline_id,
            stage_id=stage.id,
            product_id=product_obj.id if product_obj else payload.product_id,
            product_name=prod_name,
            original_value=orig_val,
            contact_phone=digits,
            contact_name=payload.contact_name or "Sem Nome",
            contact_email=payload.contact_email,
            title=f"Oportunidade - {payload.contact_name or digits}",
            channel="whatsapp",
            value=val,
            status=status_val,
            lost_reason=payload.lost_reason if status_val == "lost" else None,
            notes=payload.notes,
            last_interaction_at=datetime.now(timezone.utc)
        )
        db.add(new_deal)
        db.commit()
        db.refresh(new_deal)
        logger.info(f"✅ [CRM] Nova oportunidade criada para {digits} no estágio '{stage.name}' do pipeline {pipeline_id}.")
        crm_service_module.check_and_forward_deal_if_configured(db, new_deal, stage)
        pipeline_obj = db.query(SalesPipeline).filter(SalesPipeline.id == pipeline_id).first()
        pipe_name = pipeline_obj.name if pipeline_obj else ""
        crm_service_module.add_pipeline_private_note(
            db=db,
            client_id=client_id,
            phone=digits,
            pipeline_name=pipe_name,
            stage_name=stage.name,
            user_id=current_user.id if current_user and hasattr(current_user, "id") else None,
            action_type="added"
        )
        return new_deal

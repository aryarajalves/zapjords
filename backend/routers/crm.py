from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import func

from core.deps import get_db
from core.permissions import require_user
from models.auth import User
from models.crm import SalesPipeline, SalesPipelineStage, SalesDeal
from schemas_domain import crm as schemas_crm
from services import crm_service
from services.crm_modules.crm_deal_ops_service import (
    create_deal_entry,
    move_deal_entry,
    update_deal_entry,
    move_or_upsert_contact_deal_entry,
)
from core.logger import setup_logger

logger = setup_logger("router_crm")

router = APIRouter(prefix="/crm", tags=["CRM & Kanban de Vendas"])


def get_client_id(x_client_id: Optional[str] = Header(None)) -> int:
    if not x_client_id:
        raise HTTPException(status_code=400, detail="X-Client-ID header é obrigatório")
    try:
        return int(x_client_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="X-Client-ID inválido")


# --- PIPELINES ---

@router.get("/pipelines", response_model=List[schemas_crm.SalesPipelineResponse])
def list_pipelines(
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Lista todos os pipelines do cliente. Cria o pipeline padrão se não existir nenhum."""
    pipelines = db.query(SalesPipeline).filter(
        SalesPipeline.client_id == client_id
    ).order_by(SalesPipeline.order_index.asc(), SalesPipeline.id.asc()).all()

    if not pipelines:
        default_pipe = crm_service.get_or_create_default_pipeline(db, client_id)
        pipelines = [default_pipe]

    result = []
    for p in pipelines:
        stages_count = db.query(func.count(SalesPipelineStage.id)).filter(
            SalesPipelineStage.pipeline_id == p.id
        ).scalar() or 0

        deals_count = db.query(func.count(SalesDeal.id)).filter(
            SalesDeal.pipeline_id == p.id
        ).scalar() or 0

        total_value = db.query(func.coalesce(func.sum(SalesDeal.value), 0.0)).filter(
            SalesDeal.pipeline_id == p.id
        ).scalar() or 0.0

        p_dict = {
            "id": p.id,
            "client_id": p.client_id,
            "name": p.name,
            "product_name": p.product_name,
            "associated_tags": p.associated_tags,
            "default_value": float(p.default_value or 0.0),
            "order_index": p.order_index,
            "is_default": p.is_default,
            "stages_count": stages_count,
            "deals_count": deals_count,
            "total_value": float(total_value),
            "created_at": p.created_at,
            "updated_at": p.updated_at,
            "stages": [
                {
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
                    "is_followup": bool(getattr(s, "is_followup", False)),
                    "followup_delay_value": getattr(s, "followup_delay_value", 3) or 3,
                    "followup_delay_unit": getattr(s, "followup_delay_unit", "hours") or "hours",
                    "created_at": s.created_at,
                    "updated_at": s.updated_at
                }
                for s in p.stages
            ]
        }
        result.append(p_dict)

    return result


@router.post("/pipelines", response_model=schemas_crm.SalesPipelineResponse, status_code=status.HTTP_201_CREATED)
def create_pipeline(
    payload: schemas_crm.SalesPipelineCreate,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Cria um novo pipeline para um produto."""
    if payload.is_default:
        db.query(SalesPipeline).filter(
            SalesPipeline.client_id == client_id
        ).update({"is_default": False})

    new_pipe = SalesPipeline(
        client_id=client_id,
        name=payload.name.strip(),
        product_name=payload.product_name.strip() if payload.product_name else None,
        associated_tags=payload.associated_tags.strip() if payload.associated_tags else None,
        default_value=payload.default_value or 0.0,
        order_index=payload.order_index or 0,
        is_default=payload.is_default or False
    )
    db.add(new_pipe)
    db.commit()
    db.refresh(new_pipe)

    if payload.initial_stages and len(payload.initial_stages) > 0:
        for idx, stg in enumerate(payload.initial_stages):
            new_stg = SalesPipelineStage(
                pipeline_id=new_pipe.id,
                client_id=client_id,
                name=stg.name,
                color=stg.color or "blue",
                stage_type=stg.stage_type or "in_progress",
                webhook_event_trigger=stg.webhook_event_trigger,
                order_index=idx
            )
            db.add(new_stg)
        db.commit()
    else:
        crm_service.create_default_stages(db, new_pipe.id, client_id)

    stages_count = db.query(func.count(SalesPipelineStage.id)).filter(
        SalesPipelineStage.pipeline_id == new_pipe.id
    ).scalar() or 0

    return {
        "id": new_pipe.id,
        "client_id": new_pipe.client_id,
        "name": new_pipe.name,
        "product_name": new_pipe.product_name,
        "associated_tags": new_pipe.associated_tags,
        "default_value": float(new_pipe.default_value or 0.0),
        "order_index": new_pipe.order_index,
        "is_default": new_pipe.is_default,
        "stages_count": stages_count,
        "deals_count": 0,
        "total_value": 0.0,
        "created_at": new_pipe.created_at,
        "updated_at": new_pipe.updated_at
    }


@router.put("/pipelines/{pipeline_id}", response_model=schemas_crm.SalesPipelineResponse)
def update_pipeline(
    pipeline_id: int,
    payload: schemas_crm.SalesPipelineUpdate,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    pipe = db.query(SalesPipeline).filter(
        SalesPipeline.id == pipeline_id,
        SalesPipeline.client_id == client_id
    ).first()
    if not pipe:
        raise HTTPException(status_code=404, detail="Pipeline não encontrado")

    if payload.name is not None:
        pipe.name = payload.name.strip()
    if payload.product_name is not None:
        pipe.product_name = payload.product_name.strip() if payload.product_name else None
    if payload.associated_tags is not None:
        pipe.associated_tags = payload.associated_tags.strip() if payload.associated_tags else None
    if payload.default_value is not None:
        pipe.default_value = payload.default_value
    if payload.order_index is not None:
        pipe.order_index = payload.order_index
    if payload.is_default is not None:
        pipe.is_default = payload.is_default
        if payload.is_default:
            db.query(SalesPipeline).filter(
                SalesPipeline.client_id == client_id,
                SalesPipeline.id != pipe.id
            ).update({"is_default": False})
    db.commit()
    db.refresh(pipe)

    stages_count = db.query(func.count(SalesPipelineStage.id)).filter(
        SalesPipelineStage.pipeline_id == pipe.id
    ).scalar() or 0
    deals_count = db.query(func.count(SalesDeal.id)).filter(
        SalesDeal.pipeline_id == pipe.id
    ).scalar() or 0
    total_val = db.query(func.coalesce(func.sum(SalesDeal.value), 0.0)).filter(
        SalesDeal.pipeline_id == pipe.id
    ).scalar() or 0.0

    return {
        "id": pipe.id,
        "client_id": pipe.client_id,
        "name": pipe.name,
        "product_name": pipe.product_name,
        "associated_tags": pipe.associated_tags,
        "default_value": float(pipe.default_value or 0.0),
        "order_index": pipe.order_index,
        "is_default": pipe.is_default,
        "stages_count": stages_count,
        "deals_count": deals_count,
        "total_value": float(total_val),
        "created_at": pipe.created_at,
        "updated_at": pipe.updated_at
    }


@router.delete("/pipelines/{pipeline_id}")
def delete_pipeline(
    pipeline_id: int,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    pipe = db.query(SalesPipeline).filter(
        SalesPipeline.id == pipeline_id,
        SalesPipeline.client_id == client_id
    ).first()
    if not pipe:
        raise HTTPException(status_code=404, detail="Pipeline não encontrado")

    is_def = pipe.is_default
    db.delete(pipe)
    db.commit()

    if is_def:
        next_pipe = db.query(SalesPipeline).filter(
            SalesPipeline.client_id == client_id
        ).order_by(SalesPipeline.order_index.asc(), SalesPipeline.id.asc()).first()
        if next_pipe:
            next_pipe.is_default = True
            db.commit()

    return {"message": "Pipeline excluído com sucesso"}


@router.post("/pipelines/{pipeline_id}/sync-history", response_model=schemas_crm.CrmSyncHistoryResult)
def sync_pipeline_history_endpoint(
    pipeline_id: int,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Puxa retroativamente os leads de WebhookLead para as colunas deste pipeline."""
    return crm_service.sync_pipeline_history(db, client_id, pipeline_id)


# --- BOARD / KANBAN VIEW ---

@router.get("/pipelines/{pipeline_id}/board", response_model=schemas_crm.SalesPipelineBoardResponse)
def get_pipeline_board(
    pipeline_id: int,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Retorna o quadro Kanban completo com estágios, oportunidades, janela 24h e não lidas por usuário."""
    return crm_service.build_pipeline_board_data(
        db=db,
        client_id=client_id,
        pipeline_id=pipeline_id,
        current_user=current_user
    )


# --- STAGES (COLUNAS) ---

@router.get("/stages", response_model=List[schemas_crm.SalesPipelineStageResponse])
def list_stages(
    pipeline_id: int,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Lista os estágios de um pipeline específico."""
    stages = db.query(SalesPipelineStage).filter(
        SalesPipelineStage.pipeline_id == pipeline_id,
        SalesPipelineStage.client_id == client_id
    ).order_by(SalesPipelineStage.order_index.asc(), SalesPipelineStage.id.asc()).all()
    return stages


@router.post("/stages", response_model=schemas_crm.SalesPipelineStageResponse, status_code=status.HTTP_201_CREATED)
def create_stage(
    payload: schemas_crm.SalesPipelineStageCreate,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    pipe = db.query(SalesPipeline).filter(
        SalesPipeline.id == payload.pipeline_id,
        SalesPipeline.client_id == client_id
    ).first()
    if not pipe:
        raise HTTPException(status_code=404, detail="Pipeline não encontrado")

    max_order = db.query(func.max(SalesPipelineStage.order_index)).filter(
        SalesPipelineStage.pipeline_id == pipe.id
    ).scalar() or 0

    new_stage = SalesPipelineStage(
        pipeline_id=pipe.id,
        client_id=client_id,
        name=payload.name.strip(),
        order_index=max_order + 1,
        color=payload.color or "blue",
        stage_type=payload.stage_type or "in_progress",
        webhook_event_trigger=payload.webhook_event_trigger,
        forward_to_pipeline_id=payload.forward_to_pipeline_id if payload.forward_to_pipeline_id and payload.forward_to_pipeline_id > 0 else None,
        forward_to_stage_id=payload.forward_to_stage_id if payload.forward_to_stage_id and payload.forward_to_stage_id > 0 else None,
        is_followup=bool(payload.is_followup),
        followup_delay_value=payload.followup_delay_value if payload.followup_delay_value else 3,
        followup_delay_unit=payload.followup_delay_unit or "hours"
    )
    db.add(new_stage)
    db.commit()
    db.refresh(new_stage)
    return new_stage


@router.put("/stages/{stage_id}", response_model=schemas_crm.SalesPipelineStageResponse)
def update_stage(
    stage_id: int,
    payload: schemas_crm.SalesPipelineStageUpdate,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    stg = db.query(SalesPipelineStage).filter(
        SalesPipelineStage.id == stage_id,
        SalesPipelineStage.client_id == client_id
    ).first()
    if not stg:
        raise HTTPException(status_code=404, detail="Estágio não encontrado")

    if payload.name is not None:
        stg.name = payload.name.strip()
    if payload.color is not None:
        stg.color = payload.color
    if payload.stage_type is not None:
        stg.stage_type = payload.stage_type
    if payload.webhook_event_trigger is not None:
        stg.webhook_event_trigger = payload.webhook_event_trigger
    if payload.order_index is not None:
        stg.order_index = payload.order_index
    if hasattr(payload, "forward_to_pipeline_id"):
        stg.forward_to_pipeline_id = payload.forward_to_pipeline_id if payload.forward_to_pipeline_id and payload.forward_to_pipeline_id > 0 else None
    if hasattr(payload, "forward_to_stage_id"):
        stg.forward_to_stage_id = payload.forward_to_stage_id if payload.forward_to_stage_id and payload.forward_to_stage_id > 0 else None
    if payload.is_followup is not None:
        stg.is_followup = payload.is_followup
    if payload.followup_delay_value is not None:
        stg.followup_delay_value = payload.followup_delay_value
    if payload.followup_delay_unit is not None:
        stg.followup_delay_unit = payload.followup_delay_unit
    db.commit()
    db.refresh(stg)
    return stg


@router.delete("/stages/{stage_id}")
def delete_stage(
    stage_id: int,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    stg = db.query(SalesPipelineStage).filter(
        SalesPipelineStage.id == stage_id,
        SalesPipelineStage.client_id == client_id
    ).first()
    if not stg:
        raise HTTPException(status_code=404, detail="Estágio não encontrado")

    other_stage = db.query(SalesPipelineStage).filter(
        SalesPipelineStage.pipeline_id == stg.pipeline_id,
        SalesPipelineStage.id != stg.id
    ).order_by(SalesPipelineStage.order_index.asc()).first()

    if other_stage:
        db.query(SalesDeal).filter(SalesDeal.stage_id == stg.id).update(
            {"stage_id": other_stage.id}
        )

    db.delete(stg)
    db.commit()
    return {"message": "Estágio excluído com sucesso"}


# --- DEALS (CARDS / OPORTUNIDADES) ---

@router.post("/deals", response_model=schemas_crm.SalesDealResponse, status_code=status.HTTP_201_CREATED)
def create_deal(
    payload: schemas_crm.SalesDealCreate,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    return create_deal_entry(db, client_id, payload, current_user, crm_service)


@router.patch("/deals/{deal_id}/move", response_model=schemas_crm.SalesDealResponse)
def move_deal(
    deal_id: int,
    payload: schemas_crm.SalesDealMove,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    return move_deal_entry(db, deal_id, client_id, payload, current_user, crm_service)


@router.put("/deals/{deal_id}", response_model=schemas_crm.SalesDealResponse)
def update_deal(
    deal_id: int,
    payload: schemas_crm.SalesDealUpdate,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    return update_deal_entry(db, deal_id, client_id, payload, crm_service)


@router.get("/deals/by-phone/{phone}", response_model=Optional[schemas_crm.SalesDealResponse])
def get_deal_by_phone(
    phone: str,
    pipeline_id: Optional[int] = None,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    digits = "".join(filter(str.isdigit, phone))
    if len(digits) < 8:
        return None

    query = db.query(SalesDeal).filter(
        SalesDeal.client_id == client_id,
        SalesDeal.contact_phone.like(f"%{digits[-8:]}")
    )
    if pipeline_id:
        query = query.filter(SalesDeal.pipeline_id == pipeline_id)

    deal = query.order_by(SalesDeal.updated_at.desc(), SalesDeal.id.desc()).first()
    return deal


@router.post("/deals/move-contact", response_model=schemas_crm.SalesDealResponse)
def move_or_upsert_contact_deal(
    payload: schemas_crm.SalesDealContactMovePayload,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    return move_or_upsert_contact_deal_entry(db, client_id, payload, current_user, crm_service)


@router.delete("/deals/{deal_id}")
def delete_deal(
    deal_id: int,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    deal = db.query(SalesDeal).filter(
        SalesDeal.id == deal_id,
        SalesDeal.client_id == client_id
    ).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Oportunidade não encontrada")

    db.delete(deal)
    db.commit()
    return {"message": "Oportunidade excluída com sucesso"}


@router.post("/deals/bulk-delete")
def bulk_delete_deals(
    payload: schemas_crm.SalesDealBulkDelete,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Exclui múltiplos deals selecionados de uma vez."""
    deleted_count = crm_service.bulk_delete_deals(db, client_id, payload.deal_ids)
    return {"message": f"{deleted_count} oportunidades excluídas com sucesso", "count": deleted_count}


@router.post("/deals/bulk-update")
def bulk_update_deals(
    payload: schemas_crm.SalesDealBulkUpdate,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Atualiza produto e/ou preço dos deals selecionados em massa."""
    updated_count = crm_service.bulk_update_deals(
        db=db,
        client_id=client_id,
        deal_ids=payload.deal_ids,
        update_product=payload.update_product or False,
        product_id=payload.product_id,
        product_name=payload.product_name,
        update_value=payload.update_value or False,
        value=payload.value
    )
    return {"message": f"{updated_count} oportunidades atualizadas com sucesso", "count": updated_count}


@router.post("/deals/bulk-add-contacts")
def bulk_add_contacts_to_pipeline(
    payload: dict = Body(...),
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Adiciona contatos selecionados ou por filtro a uma pipeline do Kanban."""
    return crm_service.bulk_add_contacts_to_pipeline(
        db=db,
        client_id=client_id,
        current_user=current_user,
        payload=payload
    )

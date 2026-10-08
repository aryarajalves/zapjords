from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from core.deps import get_db
from core.permissions import require_user, require_premium
from models.auth import User
from models.crm import SalesPipeline, SalesPipelineStage, SalesDeal
from schemas_domain import crm as schemas_crm
from services import crm_service
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
            "updated_at": p.updated_at
        }
        result.append(p_dict)

    return result


@router.post("/pipelines", response_model=schemas_crm.SalesPipelineResponse, status_code=status.HTTP_201_CREATED)
def create_pipeline(
    payload: schemas_crm.SalesPipelineCreate,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium)
):
    """Cria um novo pipeline para um produto."""
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

    # Criar estágios iniciais
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
    current_user: User = Depends(require_premium)
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
    current_user: User = Depends(require_premium)
):
    pipe = db.query(SalesPipeline).filter(
        SalesPipeline.id == pipeline_id,
        SalesPipeline.client_id == client_id
    ).first()
    if not pipe:
        raise HTTPException(status_code=404, detail="Pipeline não encontrado")

    db.delete(pipe)
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
    res = crm_service.sync_pipeline_history(db, client_id, pipeline_id)
    return res


# --- BOARD / KANBAN VIEW ---

@router.get("/pipelines/{pipeline_id}/board", response_model=schemas_crm.SalesPipelineBoardResponse)
def get_pipeline_board(
    pipeline_id: int,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Retorna o quadro Kanban completo com estágios e oportunidades (deals)."""
    pipe = db.query(SalesPipeline).filter(
        SalesPipeline.id == pipeline_id,
        SalesPipeline.client_id == client_id
    ).first()

    if not pipe:
        raise HTTPException(status_code=404, detail="Pipeline não encontrado")

    stages = db.query(SalesPipelineStage).filter(
        SalesPipelineStage.pipeline_id == pipeline_id
    ).order_by(SalesPipelineStage.order_index.asc()).all()

    if not stages:
        stages = crm_service.create_default_stages(db, pipeline_id, client_id)

    stages_data = []
    board_total_deals = 0
    board_total_val = 0.0
    board_won_val = 0.0
    board_won_deals = 0

    for s in stages:
        deals = db.query(SalesDeal).filter(
            SalesDeal.stage_id == s.id
        ).order_by(SalesDeal.updated_at.desc()).all()

        stage_deals_count = len(deals)
        stage_total_val = sum(float(d.value or 0.0) for d in deals)

        board_total_deals += stage_deals_count
        board_total_val += stage_total_val

        if s.stage_type == "won":
            board_won_deals += stage_deals_count
            board_won_val += stage_total_val

        stages_data.append({
            "id": s.id,
            "pipeline_id": s.pipeline_id,
            "client_id": s.client_id,
            "name": s.name,
            "order_index": s.order_index,
            "color": s.color,
            "stage_type": s.stage_type,
            "webhook_event_trigger": s.webhook_event_trigger,
            "created_at": s.created_at,
            "updated_at": s.updated_at,
            "deals": deals,
            "total_deals": stage_deals_count,
            "total_value": stage_total_val
        })

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
        "total_won_deals": board_won_deals
    }


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
    current_user: User = Depends(require_premium)
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
        webhook_event_trigger=payload.webhook_event_trigger
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
    current_user: User = Depends(require_premium)
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

    db.commit()
    db.refresh(stg)
    return stg


@router.delete("/stages/{stage_id}")
def delete_stage(
    stage_id: int,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium)
):
    stg = db.query(SalesPipelineStage).filter(
        SalesPipelineStage.id == stage_id,
        SalesPipelineStage.client_id == client_id
    ).first()
    if not stg:
        raise HTTPException(status_code=404, detail="Estágio não encontrado")

    # Mover deals para outro estágio do mesmo pipeline se houver
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
    digits = "".join(filter(str.isdigit, str(payload.contact_phone)))
    if len(digits) < 8:
        raise HTTPException(status_code=400, detail="Número de telefone inválido")

    # Validar estágio
    stg = db.query(SalesPipelineStage).filter(
        SalesPipelineStage.id == payload.stage_id,
        SalesPipelineStage.client_id == client_id
    ).first()
    if not stg:
        raise HTTPException(status_code=404, detail="Estágio não encontrado")

    val = float(payload.value or 0.0)
    if val <= 0.0:
        pipe = db.query(SalesPipeline).filter(
            SalesPipeline.id == payload.pipeline_id,
            SalesPipeline.client_id == client_id
        ).first()
        if pipe and pipe.default_value and pipe.default_value > 0.0:
            val = float(pipe.default_value)

    deal = SalesDeal(
        client_id=client_id,
        pipeline_id=payload.pipeline_id,
        stage_id=payload.stage_id,
        lead_id=payload.lead_id,
        contact_phone=digits,
        contact_name=payload.contact_name or "Sem Nome",
        contact_email=payload.contact_email,
        title=payload.title or f"Oportunidade - {payload.contact_name or digits}",
        value=val,
        status=payload.status or "open",
        lost_reason=payload.lost_reason,
        notes=payload.notes,
        last_interaction_at=datetime.now(timezone.utc)
    )
    db.add(deal)
    db.commit()
    db.refresh(deal)
    return deal


@router.patch("/deals/{deal_id}/move", response_model=schemas_crm.SalesDealResponse)
def move_deal(
    deal_id: int,
    payload: schemas_crm.SalesDealMove,
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

    new_stg = db.query(SalesPipelineStage).filter(
        SalesPipelineStage.id == payload.stage_id,
        SalesPipelineStage.client_id == client_id
    ).first()
    if not new_stg:
        raise HTTPException(status_code=404, detail="Estágio destino não encontrado")

    deal.stage_id = new_stg.id
    if new_stg.stage_type == "won":
        deal.status = "won"
    elif new_stg.stage_type == "lost":
        deal.status = "lost"
    else:
        deal.status = "open"

    deal.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(deal)
    return deal


@router.put("/deals/{deal_id}", response_model=schemas_crm.SalesDealResponse)
def update_deal(
    deal_id: int,
    payload: schemas_crm.SalesDealUpdate,
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

    if payload.contact_name is not None:
        deal.contact_name = payload.contact_name
    if payload.contact_email is not None:
        deal.contact_email = payload.contact_email
    if payload.title is not None:
        deal.title = payload.title
    if payload.value is not None:
        deal.value = float(payload.value)
    if payload.status is not None:
        deal.status = payload.status
    if payload.lost_reason is not None:
        deal.lost_reason = payload.lost_reason
    if payload.notes is not None:
        deal.notes = payload.notes
    if payload.stage_id is not None:
        deal.stage_id = payload.stage_id

    deal.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(deal)
    return deal


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

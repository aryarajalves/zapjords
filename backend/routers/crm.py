from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from core.deps import get_db
from core.permissions import require_user
from models.auth import User
from models.crm import SalesPipeline, SalesPipelineStage, SalesDeal, CRMProduct
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
            "forward_to_pipeline_id": getattr(s, "forward_to_pipeline_id", None),
            "forward_to_stage_id": getattr(s, "forward_to_stage_id", None),
            "created_at": s.created_at,
            "updated_at": s.updated_at,
            "deals": deals,
            "total_deals": stage_deals_count,
            "total_value": stage_total_val
        })

    board_conversion_rate = round((board_won_deals / board_total_deals) * 100, 2) if board_total_deals > 0 else 0.0

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
        "conversion_rate": board_conversion_rate
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
        forward_to_stage_id=payload.forward_to_stage_id if payload.forward_to_stage_id and payload.forward_to_stage_id > 0 else None
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

    # Produto de interesse / Catálogo
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

    # Canal de origem do lead / oportunidade
    deal_channel = payload.channel.strip() if payload.channel else None
    if not deal_channel and payload.lead_id:
        from models.trigger import WebhookLead
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
        last_interaction_at=datetime.now(timezone.utc)
    )
    db.add(deal)
    db.commit()
    db.refresh(deal)
    stg = db.query(SalesPipelineStage).filter(SalesPipelineStage.id == deal.stage_id).first()
    if stg:
        crm_service.check_and_forward_deal_if_configured(db, deal, stg)
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

    if payload.lost_reason is not None:
        deal.lost_reason = payload.lost_reason.strip() if payload.lost_reason else None

    deal.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(deal)
    crm_service.check_and_forward_deal_if_configured(db, deal, new_stg)
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
    if payload.stage_id is not None:
        deal.stage_id = payload.stage_id

    deal.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(deal)
    if payload.stage_id is not None:
        target_stg = db.query(SalesPipelineStage).filter(SalesPipelineStage.id == deal.stage_id).first()
        if target_stg:
            crm_service.check_and_forward_deal_if_configured(db, deal, target_stg)
    return deal

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

    # Determinar status
    status = "open"
    if stage.stage_type == "won":
        status = "won"
    elif stage.stage_type == "lost" or "desist" in stage.name.lower():
        status = "lost"

    # Produto
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

    # Buscar deal existente para este contato no pipeline
    deal = db.query(SalesDeal).filter(
        SalesDeal.client_id == client_id,
        SalesDeal.pipeline_id == pipeline_id,
        SalesDeal.contact_phone.like(f"%{digits[-8:]}")
    ).first()

    if deal:
        deal.stage_id = stage.id
        deal.status = status
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
        if status == "lost":
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
        crm_service.check_and_forward_deal_if_configured(db, deal, stage)
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
            status=status,
            lost_reason=payload.lost_reason if status == "lost" else None,
            notes=payload.notes,
            last_interaction_at=datetime.now(timezone.utc)
        )
        db.add(new_deal)
        db.commit()
        db.refresh(new_deal)
        logger.info(f"✅ [CRM] Nova oportunidade criada para {digits} no estágio '{stage.name}' do pipeline {pipeline_id}.")
        crm_service.check_and_forward_deal_if_configured(db, new_deal, stage)
        return new_deal

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

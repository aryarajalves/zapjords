from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session

from core.deps import get_db
from core.permissions import require_user
from models.auth import User
from models.crm import SalesPipeline, SalesPipelineStage
from core.logger import setup_logger

logger = setup_logger("router_crm_stage_order")

router = APIRouter(prefix="/crm", tags=["CRM & Kanban - Reordenação de Colunas"])


def get_client_id(x_client_id: Optional[str] = Header(None)) -> int:
    if not x_client_id:
        raise HTTPException(status_code=400, detail="X-Client-ID header é obrigatório")
    try:
        return int(x_client_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="X-Client-ID inválido")


class StageReorderPayload(BaseModel):
    stage_ids: List[int] = Field(..., description="Lista ordenada com os IDs dos estágios / colunas")


@router.put("/pipelines/{pipeline_id}/stages/reorder")
def reorder_stages(
    pipeline_id: int,
    payload: StageReorderPayload,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """
    Reordena as colunas (estágios) de um pipeline com base na nova sequência fornecida.
    Garante isolamento por client_id e persistência atômica do order_index.
    """
    pipe = db.query(SalesPipeline).filter(
        SalesPipeline.id == pipeline_id,
        SalesPipeline.client_id == client_id
    ).first()
    if not pipe:
        raise HTTPException(status_code=404, detail="Pipeline não encontrado")

    stages = db.query(SalesPipelineStage).filter(
        SalesPipelineStage.pipeline_id == pipeline_id,
        SalesPipelineStage.client_id == client_id
    ).all()
    stages_map = {s.id: s for s in stages}

    updated_count = 0
    for idx, stage_id in enumerate(payload.stage_ids):
        if stage_id in stages_map:
            stages_map[stage_id].order_index = idx
            updated_count += 1

    # Manter estágios omitidos (se houver algum) no final com ordem sequencial
    remaining_stages = [s for s in stages if s.id not in payload.stage_ids]
    for rem_idx, rem_stg in enumerate(remaining_stages):
        rem_stg.order_index = len(payload.stage_ids) + rem_idx

    db.commit()

    logger.info(
        f"Colunas do pipeline {pipeline_id} reordenadas com sucesso para cliente {client_id}. "
        f"Total atualizado: {updated_count}"
    )

    return {
        "message": "Colunas reordenadas com sucesso",
        "pipeline_id": pipeline_id,
        "stage_ids": payload.stage_ids
    }

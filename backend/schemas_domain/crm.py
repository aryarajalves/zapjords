from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

# --- ESTÁGIOS (STAGES) ---

class SalesPipelineStageBase(BaseModel):
    name: str
    order_index: Optional[int] = 0
    color: Optional[str] = "blue"
    stage_type: Optional[str] = "in_progress"  # initial, in_progress, won, lost
    webhook_event_trigger: Optional[str] = None

class SalesPipelineStageCreate(SalesPipelineStageBase):
    pipeline_id: int

class SalesPipelineStageUpdate(BaseModel):
    name: Optional[str] = None
    order_index: Optional[int] = None
    color: Optional[str] = None
    stage_type: Optional[str] = None
    webhook_event_trigger: Optional[str] = None

class SalesPipelineStageResponse(SalesPipelineStageBase):
    id: int
    pipeline_id: int
    client_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- DEALS (OPORTUNIDADES / CARDS) ---

class SalesDealBase(BaseModel):
    contact_phone: str
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    title: Optional[str] = None
    value: Optional[float] = 0.0
    status: Optional[str] = "open"  # open, won, lost
    lost_reason: Optional[str] = None
    notes: Optional[str] = None

class SalesDealCreate(SalesDealBase):
    pipeline_id: int
    stage_id: int
    lead_id: Optional[int] = None

class SalesDealUpdate(BaseModel):
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    title: Optional[str] = None
    value: Optional[float] = None
    status: Optional[str] = None
    lost_reason: Optional[str] = None
    notes: Optional[str] = None
    stage_id: Optional[int] = None

class SalesDealMove(BaseModel):
    stage_id: int
    order_index: Optional[int] = None

class SalesDealResponse(SalesDealBase):
    id: int
    client_id: int
    pipeline_id: int
    stage_id: int
    lead_id: Optional[int] = None
    last_interaction_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- PIPELINES ---

class SalesPipelineBase(BaseModel):
    name: str
    product_name: Optional[str] = None
    associated_tags: Optional[str] = None
    default_value: Optional[float] = 0.0
    order_index: Optional[int] = 0
    is_default: Optional[bool] = False

class SalesPipelineCreate(SalesPipelineBase):
    initial_stages: Optional[List[SalesPipelineStageBase]] = None

class SalesPipelineUpdate(BaseModel):
    name: Optional[str] = None
    product_name: Optional[str] = None
    associated_tags: Optional[str] = None
    default_value: Optional[float] = None
    order_index: Optional[int] = None
    is_default: Optional[bool] = None

class SalesPipelineResponse(SalesPipelineBase):
    id: int
    client_id: int
    stages_count: Optional[int] = 0
    deals_count: Optional[int] = 0
    total_value: Optional[float] = 0.0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class StageWithDealsResponse(SalesPipelineStageResponse):
    deals: List[SalesDealResponse] = []
    total_deals: int = 0
    total_value: float = 0.0

class SalesPipelineBoardResponse(BaseModel):
    pipeline: SalesPipelineResponse
    stages: List[StageWithDealsResponse] = []
    total_deals: int = 0
    total_value: float = 0.0
    total_won_value: float = 0.0
    total_won_deals: int = 0

class CrmSyncHistoryResult(BaseModel):
    total_synced: int
    created_deals: int
    updated_deals: int
    skipped: int
    message: str

from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

# --- PRODUTOS DO CRM (CATÁLOGO) ---

class CRMProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Optional[float] = 0.0
    is_active: Optional[bool] = True

class CRMProductCreate(CRMProductBase):
    pass

class CRMProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    is_active: Optional[bool] = None

class CRMProductResponse(CRMProductBase):
    id: int
    client_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- ESTÁGIOS (STAGES) ---

class SalesPipelineStageBase(BaseModel):
    name: str
    order_index: Optional[int] = 0
    color: Optional[str] = "blue"
    stage_type: Optional[str] = "in_progress"  # initial, in_progress, won, lost
    webhook_event_trigger: Optional[str] = None
    forward_to_pipeline_id: Optional[int] = None
    forward_to_stage_id: Optional[int] = None
    is_followup: Optional[bool] = False
    followup_delay_value: Optional[int] = 3
    followup_delay_unit: Optional[str] = "hours"

class SalesPipelineStageCreate(SalesPipelineStageBase):
    pipeline_id: int

class SalesPipelineStageUpdate(BaseModel):
    name: Optional[str] = None
    order_index: Optional[int] = None
    color: Optional[str] = None
    stage_type: Optional[str] = None
    webhook_event_trigger: Optional[str] = None
    forward_to_pipeline_id: Optional[int] = None
    forward_to_stage_id: Optional[int] = None
    is_followup: Optional[bool] = None
    followup_delay_value: Optional[int] = None
    followup_delay_unit: Optional[str] = None

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
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    channel: Optional[str] = None  # Canal de origem (ex: kiwify, hotmart, whatsapp, instagram, etc.)
    original_value: Optional[float] = 0.0  # Preço de tabela / valor padrão do produto
    value: Optional[float] = 0.0  # Valor real / negociado da venda
    status: Optional[str] = "open"  # open, won, lost
    lost_reason: Optional[str] = None
    notes: Optional[str] = None
    custom_followup_delay_value: Optional[int] = None
    custom_followup_delay_unit: Optional[str] = "hours"

class SalesDealCreate(SalesDealBase):
    pipeline_id: int
    stage_id: int
    lead_id: Optional[int] = None

class SalesDealUpdate(BaseModel):
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    title: Optional[str] = None
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    channel: Optional[str] = None
    original_value: Optional[float] = None
    value: Optional[float] = None
    status: Optional[str] = None
    lost_reason: Optional[str] = None
    notes: Optional[str] = None
    stage_id: Optional[int] = None
    custom_followup_delay_value: Optional[int] = None
    custom_followup_delay_unit: Optional[str] = None
    clear_custom_followup: Optional[bool] = False

class SalesDealMove(BaseModel):
    stage_id: int
    order_index: Optional[int] = None
    lost_reason: Optional[str] = None

class SalesDealContactMovePayload(BaseModel):
    pipeline_id: int
    stage_id: int
    contact_phone: str
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    value: Optional[float] = None
    lost_reason: Optional[str] = None
    notes: Optional[str] = None

class SalesDealBulkDelete(BaseModel):
    deal_ids: List[int]

class SalesDealBulkUpdate(BaseModel):
    deal_ids: List[int]
    update_product: Optional[bool] = False
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    update_value: Optional[bool] = False
    value: Optional[float] = None

class SalesDealResponse(SalesDealBase):
    id: int
    client_id: int
    pipeline_id: int
    stage_id: int
    lead_id: Optional[int] = None
    last_interaction_at: Optional[datetime] = None
    stage_entered_at: Optional[datetime] = None
    needs_followup: Optional[bool] = None
    followup_overdue_seconds: Optional[float] = None
    followup_remaining_seconds: Optional[float] = None
    conversation_id: Optional[int] = None
    window_open: Optional[bool] = False
    window_expires_at: Optional[datetime] = None
    window_remaining_seconds: Optional[float] = None
    unread_count: Optional[int] = 0
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
    stages: Optional[List[SalesPipelineStageResponse]] = []

    model_config = ConfigDict(from_attributes=True)


class StageWithDealsResponse(SalesPipelineStageResponse):
    deals: List[SalesDealResponse] = []
    total_deals: int = 0
    total_value: float = 0.0
    percentage: Optional[float] = 0.0
    followup_overdue_count: Optional[int] = 0
    window_open_deals: Optional[int] = 0
    window_open_percentage: Optional[float] = 0.0
    unread_deals: Optional[int] = 0

class SalesPipelineBoardResponse(BaseModel):
    pipeline: SalesPipelineResponse
    stages: List[StageWithDealsResponse] = []
    total_deals: int = 0
    total_value: float = 0.0
    total_won_value: float = 0.0
    total_won_deals: int = 0
    conversion_rate: Optional[float] = 0.0
    total_window_open_deals: Optional[int] = 0
    window_open_percentage: Optional[float] = 0.0
    total_unread_deals: Optional[int] = 0

class CrmSyncHistoryResult(BaseModel):
    total_synced: int
    created_deals: int
    updated_deals: int
    skipped: int
    message: str

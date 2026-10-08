from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

class SalesPipeline(Base):
    __tablename__ = "sales_pipelines"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    product_name = Column(String(200), nullable=True, index=True)
    associated_tags = Column(Text, nullable=True)  # Tags separadas por vírgula
    default_value = Column(Float, default=0.0)  # Valor padrão da venda/produto (R$)
    order_index = Column(Integer, default=0)
    is_default = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    stages = relationship("SalesPipelineStage", back_populates="pipeline", cascade="all, delete-orphan", order_by="SalesPipelineStage.order_index")
    deals = relationship("SalesDeal", back_populates="pipeline", cascade="all, delete-orphan")


class SalesPipelineStage(Base):
    __tablename__ = "sales_pipeline_stages"

    id = Column(Integer, primary_key=True, index=True)
    pipeline_id = Column(Integer, ForeignKey("sales_pipelines.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    order_index = Column(Integer, default=0)
    color = Column(String(50), default="blue")  # blue, amber, emerald, rose, purple, sky
    stage_type = Column(String(50), default="in_progress")  # initial, in_progress, won, lost
    webhook_event_trigger = Column(String(100), nullable=True)  # carrinho_abandonado, compra_aprovada, etc.
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    pipeline = relationship("SalesPipeline", back_populates="stages")
    deals = relationship("SalesDeal", back_populates="stage", cascade="all, delete-orphan")


class SalesDeal(Base):
    __tablename__ = "sales_deals"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    pipeline_id = Column(Integer, ForeignKey("sales_pipelines.id", ondelete="CASCADE"), nullable=False, index=True)
    stage_id = Column(Integer, ForeignKey("sales_pipeline_stages.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id = Column(Integer, ForeignKey("webhook_leads.id", ondelete="SET NULL"), nullable=True, index=True)
    
    contact_phone = Column(String(50), nullable=False, index=True)
    contact_name = Column(String(200), nullable=True)
    contact_email = Column(String(200), nullable=True)
    title = Column(String(200), nullable=True)
    value = Column(Float, default=0.0)
    status = Column(String(50), default="open")  # open, won, lost
    lost_reason = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    last_interaction_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    pipeline = relationship("SalesPipeline", back_populates="deals")
    stage = relationship("SalesPipelineStage", back_populates="deals")

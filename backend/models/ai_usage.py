from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class AIUsageLog(Base):
    """
    Registra cada interação realizada com a IA pelo time comercial,
    calculando tokens utilizados e custo financeiro estimado (USD e BRL).
    """
    __tablename__ = "ai_usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    conversation_id = Column(Integer, nullable=True, index=True)
    contact_phone = Column(String(50), nullable=True, index=True)
    contact_name = Column(String(255), nullable=True)
    model = Column(String(100), nullable=False, index=True)
    prompt_tokens = Column(Integer, default=0, nullable=False)
    completion_tokens = Column(Integer, default=0, nullable=False)
    total_tokens = Column(Integer, default=0, nullable=False)
    cost_usd = Column(Float, default=0.0, nullable=False)
    cost_brl = Column(Float, default=0.0, nullable=False)
    question_preview = Column(Text, nullable=True)
    response_preview = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relacionamento com cliente
    client = relationship("Client")
    user = relationship("User")

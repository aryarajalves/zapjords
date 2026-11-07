from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class AIPromptPreset(Base):
    """
    Armazena prompts de instruções personalizadas de IA organizados por produto ou objetivo.
    Permite ao time comercial alternar rapidamente entre produtos no atendimento ao cliente.
    """
    __tablename__ = "ai_prompt_presets"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    product_identifier = Column(String(150), nullable=True)
    prompt_text = Column(Text, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relacionamento
    client = relationship("Client")

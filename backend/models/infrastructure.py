from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from datetime import datetime, timezone
from database import Base

class InfrastructureAlertConfig(Base):
    __tablename__ = "infrastructure_alert_configs"

    id = Column(Integer, primary_key=True, index=True)
    alert_pool_enabled = Column(Boolean, default=True, nullable=False)
    alert_pool_threshold = Column(Integer, default=75, nullable=False)
    alert_ram_enabled = Column(Boolean, default=True, nullable=False)
    alert_ram_threshold = Column(Integer, default=80, nullable=False)
    alert_cpu_enabled = Column(Boolean, default=True, nullable=False)
    alert_cpu_threshold = Column(Integer, default=85, nullable=False)
    cooldown_minutes = Column(Integer, default=15, nullable=False)
    webhook_url = Column(String(500), nullable=True)
    notify_normalized = Column(Boolean, default=True, nullable=False)
    last_alert_sent_at = Column(DateTime, nullable=True)
    last_alert_type = Column(String(100), nullable=True)
    is_currently_alerting = Column(Boolean, default=False, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class InfrastructurePeakLog(Base):
    __tablename__ = "infrastructure_peak_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True, nullable=False)
    hour_period = Column(String(50), nullable=False, index=True)  # Ex: "22/10/2026 18:00"
    peak_connections = Column(Integer, default=0, nullable=False)
    pool_total = Column(Integer, default=30, nullable=False)
    occupancy_percent = Column(Float, default=0.0, nullable=False)
    status = Column(String(50), default="Normal", nullable=False)  # "Normal", "Alerta", "Crítico"
    peak_ram_gb = Column(Float, default=0.0, nullable=False)
    peak_ram_percent = Column(Float, default=0.0, nullable=False)
    peak_cpu_percent = Column(Float, default=0.0, nullable=False)

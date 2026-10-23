from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional

from core.deps import get_db
from core.permissions import require_super_admin
from models import User
from services.infrastructure_service import InfrastructureService

router = APIRouter(prefix="/infra", tags=["Infrastructure & Server Monitoring"])

class InfrastructureSettingsUpdate(BaseModel):
    alert_pool_enabled: Optional[bool] = None
    alert_pool_threshold: Optional[int] = Field(None, ge=10, le=100)
    alert_ram_enabled: Optional[bool] = None
    alert_ram_threshold: Optional[int] = Field(None, ge=10, le=100)
    alert_cpu_enabled: Optional[bool] = None
    alert_cpu_threshold: Optional[int] = Field(None, ge=10, le=100)
    cooldown_minutes: Optional[int] = Field(None, ge=1, le=1440)
    webhook_url: Optional[str] = None
    notify_normalized: Optional[bool] = None

class TestWebhookRequest(BaseModel):
    webhook_url: str

@router.get("/metrics", summary="Métricas de Infraestrutura e Recursos do Servidor")
async def get_infrastructure_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Retorna métricas em tempo real de Hardware (RAM & CPU),
    Conexões do Banco de Dados (PostgreSQL) e Picos das últimas 24h.
    Requer privilégios de Super Admin.
    """
    try:
        return InfrastructureService.get_all_metrics(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao coletar métricas do servidor: {str(e)}"
        )

@router.get("/settings", summary="Configurações de Alertas e Webhooks")
async def get_infrastructure_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Retorna as configurações salvas de alerta por Webhook."""
    try:
        return InfrastructureService.get_settings(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao consultar configurações de alerta: {str(e)}"
        )

@router.put("/settings", summary="Salvar Configurações de Alertas e Webhooks")
async def update_infrastructure_settings(
    payload: InfrastructureSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Atualiza as configurações de alerta por Webhook."""
    try:
        data = payload.model_dump(exclude_unset=True)
        return InfrastructureService.update_settings(db, data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao salvar configurações de alerta: {str(e)}"
        )

@router.post("/test-webhook", summary="Disparar Teste de Webhook")
async def test_infrastructure_webhook(
    payload: TestWebhookRequest,
    current_user: User = Depends(require_super_admin)
):
    """Envia um disparo de teste imediato para a URL de Webhook especificada."""
    try:
        return InfrastructureService.send_test_webhook(payload.webhook_url)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Falha ao enviar webhook de teste: {str(e)}"
        )

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from models import User
from models.infrastructure import InfrastructureAlertConfig, InfrastructurePeakLog
from core.security import get_password_hash
from services.infrastructure_service import (
    InfrastructureService,
    get_brasilia_now,
    format_brasilia_time,
    BRASILIA_TZ,
)

@pytest.fixture
def infra_admin_user(db_session: Session) -> User:
    """Cria um usuário super_admin para os testes de infraestrutura."""
    user = db_session.query(User).filter(User.email == "infra_admin@test.com").first()
    if not user:
        user = User(
            email="infra_admin@test.com",
            hashed_password=get_password_hash("test1234"),
            role="super_admin",
            full_name="Infra Admin Test",
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    return user

@pytest.fixture
def infra_regular_user(db_session: Session) -> User:
    """Cria um usuário comum (não super admin) para testar permissão."""
    user = db_session.query(User).filter(User.email == "infra_user@test.com").first()
    if not user:
        user = User(
            email="infra_user@test.com",
            hashed_password=get_password_hash("test1234"),
            role="user",
            full_name="Regular User",
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    return user

@pytest.fixture
def infra_admin_token(client: TestClient, infra_admin_user: User) -> str:
    """Obtém token JWT de super admin."""
    res = client.post("/api/auth/token", data={
        "username": "infra_admin@test.com",
        "password": "test1234",
    })
    assert res.status_code == 200
    return res.json()["access_token"]

@pytest.fixture
def infra_regular_token(client: TestClient, infra_regular_user: User) -> str:
    """Obtém token JWT de usuário comum."""
    res = client.post("/api/auth/token", data={
        "username": "infra_user@test.com",
        "password": "test1234",
    })
    assert res.status_code == 200
    return res.json()["access_token"]


class TestInfrastructureService:
    """Testes unitários para o serviço de infraestrutura."""

    def test_brasilia_timezone_format(self):
        """Valida que o fuso horário de Brasília (UTC-3) é calculado e formatado corretamente."""
        b_now = get_brasilia_now()
        assert b_now.tzinfo is not None
        formatted = format_brasilia_time(b_now)
        assert "Horário de Brasília" in formatted

    def test_get_hardware_metrics(self):
        """Valida a coleta de métricas de hardware com psutil."""
        hw = InfrastructureService.get_hardware_metrics()
        assert "ram" in hw
        assert "cpu" in hw
        assert "used_gb" in hw["ram"]
        assert "total_gb" in hw["ram"]
        assert "percent" in hw["ram"]
        assert "percent" in hw["cpu"]
        assert "vcpu_count" in hw["cpu"]

    def test_get_database_metrics(self, db_session: Session):
        """Valida a coleta de métricas de conexões do PostgreSQL."""
        db_m = InfrastructureService.get_database_metrics(db_session)
        assert "in_use" in db_m
        assert "pool_total" in db_m
        assert db_m["pool_total"] == 30
        assert "pool_base" in db_m
        assert db_m["pool_base"] == 10
        assert "pool_overflow" in db_m
        assert db_m["pool_overflow"] == 20
        assert "occupancy_percent" in db_m
        assert db_m["occupancy_percent"] <= 100.0
        assert db_m["in_use"] + db_m["idle_in_pool"] == db_m["pool_total"]

    def test_get_database_metrics_caps_at_pool_total(self):
        """Garante que conexões de múltiplos processos não distorçam a ocupação do pool acima de 100%."""
        mock_db = MagicMock()
        mock_db.execute.return_value.scalar.return_value = 62  # Simula pico de 62 conexões somadas
        db_m = InfrastructureService.get_database_metrics(mock_db)
        assert db_m["in_use"] <= db_m["pool_total"]
        assert db_m["occupancy_percent"] <= 100.0
        assert db_m["idle_in_pool"] == max(db_m["pool_total"] - db_m["in_use"], 0)

    def test_record_and_get_peak_history(self, db_session: Session):
        """Valida o registro de picos e histórico nas últimas 24h."""
        hw = InfrastructureService.get_hardware_metrics()
        db_m = InfrastructureService.get_database_metrics(db_session)
        peaks_data = InfrastructureService.record_and_get_peak_history(db_session, hw, db_m)
        
        assert "peaks_24h" in peaks_data
        assert "history" in peaks_data
        assert len(peaks_data["history"]) >= 1

    @patch("services.infrastructure_service.httpx.post")
    def test_send_test_webhook_success(self, mock_post):
        """Valida o envio de webhook de teste com payload estruturado."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        result = InfrastructureService.send_test_webhook("https://webhook.site/test-uuid")
        assert result["status"] == "success"
        mock_post.assert_called_once()


class TestInfrastructureRouter:
    """Testes unitários dos endpoints da API de Infraestrutura."""

    def test_get_metrics_unauthorized(self, client: TestClient):
        """Acesso anônimo deve ser negado com 401."""
        res = client.get("/api/infra/metrics")
        assert res.status_code == 401

    def test_get_metrics_forbidden_for_regular_user(
        self, client: TestClient, infra_regular_token: str
    ):
        """Usuário que não é super_admin deve receber 403."""
        res = client.get(
            "/api/infra/metrics",
            headers={"Authorization": f"Bearer {infra_regular_token}"}
        )
        assert res.status_code == 403

    def test_get_metrics_super_admin(
        self, client: TestClient, infra_admin_token: str
    ):
        """Super Admin consegue consultar as métricas consolidadas."""
        res = client.get(
            "/api/infra/metrics",
            headers={"Authorization": f"Bearer {infra_admin_token}"}
        )
        assert res.status_code == 200
        data = res.json()
        assert "hardware" in data
        assert "database" in data
        assert "peaks" in data
        assert "history" in data
        assert "webhook_badge" in data
        assert "timestamp" in data

    def test_get_and_update_settings(
        self, client: TestClient, infra_admin_token: str
    ):
        """Consulta e atualiza as configurações de alerta."""
        # 1. GET settings
        res = client.get(
            "/api/infra/settings",
            headers={"Authorization": f"Bearer {infra_admin_token}"}
        )
        assert res.status_code == 200

        # 2. PUT settings
        payload = {
            "alert_pool_enabled": True,
            "alert_pool_threshold": 80,
            "alert_ram_enabled": True,
            "alert_ram_threshold": 85,
            "alert_cpu_enabled": False,
            "alert_cpu_threshold": 90,
            "cooldown_minutes": 20,
            "webhook_url": "https://discord.com/api/webhooks/123/abc",
            "notify_normalized": True,
        }
        res_put = client.put(
            "/api/infra/settings",
            json=payload,
            headers={"Authorization": f"Bearer {infra_admin_token}"}
        )
        assert res_put.status_code == 200
        saved = res_put.json()
        assert saved["alert_pool_threshold"] == 80
        assert saved["alert_ram_threshold"] == 85
        assert saved["alert_cpu_enabled"] is False
        assert saved["cooldown_minutes"] == 20
        assert saved["webhook_url"] == "https://discord.com/api/webhooks/123/abc"

    @patch("services.infrastructure_service.httpx.post")
    def test_test_webhook_endpoint(
        self, mock_post, client: TestClient, infra_admin_token: str
    ):
        """Dispara teste de webhook pelo endpoint."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        res = client.post(
            "/api/infra/test-webhook",
            json={"webhook_url": "https://meu-webhook.com/test"},
            headers={"Authorization": f"Bearer {infra_admin_token}"}
        )
        assert res.status_code == 200
        assert res.json()["status"] == "success"

    def test_test_webhook_invalid_url(
        self, client: TestClient, infra_admin_token: str
    ):
        """Valida que URL vazia ou inválida retorna 400."""
        res = client.post(
            "/api/infra/test-webhook",
            json={"webhook_url": ""},
            headers={"Authorization": f"Bearer {infra_admin_token}"}
        )
        assert res.status_code == 400

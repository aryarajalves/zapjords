import pytest
import os
import sys
from unittest.mock import AsyncMock, patch
from datetime import datetime, timezone, timedelta

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.environ["DATABASE_URL"] = "sqlite://"

from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from database import Base
from models import User, Client, WebhookLead
from models.email import EmailConfig, EmailTemplate, EmailFunnel, EmailFunnelExecution
from core.security import get_password_hash, create_access_token
from core.deps import get_db
from main import app
from services.email_funnel_service import (
    enroll_contact_in_funnel,
    execute_next_step,
    process_due_email_funnels,
    check_and_cancel_funnels_on_purchase
)

engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client_obj(db):
    c = Client(name="FunnelTestClient")
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

@pytest.fixture
def test_user(db, client_obj):
    user = User(
        email="funnel_user@test.com",
        hashed_password=get_password_hash("pass"),
        role="admin",
        is_active=True,
        client_id=client_obj.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def auth_headers(test_user, client_obj):
    token = create_access_token({"sub": test_user.email})
    return {
        "Authorization": f"Bearer {token}",
        "X-Client-Id": str(client_obj.id)
    }

@pytest.fixture
def api_client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


def test_create_and_list_email_funnel(api_client, auth_headers):
    payload = {
        "name": "Funil de Boas-Vindas",
        "description": "Sequência de boas vindas para novos leads",
        "trigger_type": "tag",
        "trigger_config": {"tag": "lead_novo"},
        "stop_tags": ["comprou", "cancelou"],
        "stop_on_purchase": True,
        "is_active": True,
        "steps": [
            {"id": "step_1", "type": "email", "template_id": 1, "subject": "Bem-vindo!"},
            {"id": "step_2", "type": "delay", "delay_value": 24, "delay_unit": "hours"},
            {"id": "step_3", "type": "email", "template_id": 2, "subject": "Como podemos ajudar?"}
        ]
    }
    res = api_client.post("/api/email/funnels", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "id" in data
    funnel_id = data["id"]

    # Listar funis
    list_res = api_client.get("/api/email/funnels", headers=auth_headers)
    assert list_res.status_code == 200
    funnels = list_res.json()
    assert len(funnels) >= 1
    assert any(f["id"] == funnel_id and f["name"] == "Funil de Boas-Vindas" for f in funnels)


def test_toggle_email_funnel_status(api_client, auth_headers, db, client_obj):
    funnel = EmailFunnel(
        client_id=client_obj.id,
        name="Funil Teste Toggle",
        trigger_type="tag",
        is_active=True,
        steps=[]
    )
    db.add(funnel)
    db.commit()
    db.refresh(funnel)

    res = api_client.post(f"/api/email/funnels/{funnel.id}/toggle-status", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["is_active"] is False

    res2 = api_client.post(f"/api/email/funnels/{funnel.id}/toggle-status", headers=auth_headers)
    assert res2.status_code == 200
    assert res2.json()["is_active"] is True


def test_funnel_executions_pagination_20_per_page(api_client, auth_headers, db, client_obj):
    funnel = EmailFunnel(
        client_id=client_obj.id,
        name="Funil Paginação",
        trigger_type="tag",
        is_active=True,
        steps=[]
    )
    db.add(funnel)
    db.commit()
    db.refresh(funnel)

    # Inserir 25 execuções
    for i in range(25):
        ex = EmailFunnelExecution(
            client_id=client_obj.id,
            funnel_id=funnel.id,
            contact_email=f"lead_{i}@teste.com",
            contact_name=f"Lead {i}",
            current_step_index=0,
            status="active"
        )
        db.add(ex)
    db.commit()

    # Página 1 com page_size=20
    res = api_client.get(f"/api/email/funnels/{funnel.id}/executions?page=1&page_size=20", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 25
    assert data["page"] == 1
    assert data["page_size"] == 20
    assert data["total_pages"] == 2
    assert len(data["items"]) == 20

    # Página 2
    res_page2 = api_client.get(f"/api/email/funnels/{funnel.id}/executions?page=2&page_size=20", headers=auth_headers)
    assert res_page2.status_code == 200
    data2 = res_page2.json()
    assert len(data2["items"]) == 5


@pytest.mark.asyncio
async def test_email_funnel_service_step_execution_and_delay(db, client_obj):
    template = EmailTemplate(
        client_id=client_obj.id,
        name="Tpl Boas Vindas",
        subject="Oi {{nome}}",
        body_html="<p>Olá {{nome}}, seja bem vindo!</p>",
        is_active=True
    )
    db.add(template)
    db.commit()
    db.refresh(template)

    funnel = EmailFunnel(
        client_id=client_obj.id,
        name="Funil Automático",
        trigger_type="tag",
        is_active=True,
        steps=[
            {"id": "s1", "type": "email", "template_id": template.id, "subject": "Boas vindas"},
            {"id": "s2", "type": "delay", "delay_value": 2, "delay_unit": "hours"},
            {"id": "s3", "type": "tag_action", "action": "add", "tag": "finalizou_funil"}
        ]
    )
    db.add(funnel)
    db.commit()
    db.refresh(funnel)

    with patch("services.email_funnel_service.send_single_email", new_callable=AsyncMock) as mock_send:
        mock_send.return_value = {"success": True, "message_id": "msg_123"}

        execution = await enroll_contact_in_funnel(
            db=db,
            client_id=client_obj.id,
            funnel_id=funnel.id,
            contact_email="lead_teste@exemplo.com",
            contact_name="Carlos Silva",
            start_immediately=True
        )

        assert execution is not None
        # O passo 1 (email) executou e avançou para o passo 2 (delay)
        assert execution.status == "waiting_delay"
        assert execution.current_step_index == 2
        assert execution.scheduled_for is not None
        assert mock_send.call_count == 1


@pytest.mark.asyncio
async def test_smart_cancellation_on_purchase(db, client_obj):
    funnel = EmailFunnel(
        client_id=client_obj.id,
        name="Funil Recuperação",
        trigger_type="webhook_status",
        stop_on_purchase=True,
        is_active=True,
        steps=[]
    )
    db.add(funnel)
    db.commit()
    db.refresh(funnel)

    execution = EmailFunnelExecution(
        client_id=client_obj.id,
        funnel_id=funnel.id,
        contact_email="comprador@exemplo.com",
        contact_name="Mariana",
        status="waiting_delay",
        current_step_index=1
    )
    db.add(execution)
    db.commit()

    # Lead compra o produto
    cancelled = await check_and_cancel_funnels_on_purchase(db, client_obj.id, "comprador@exemplo.com")
    assert cancelled == 1

    db.refresh(execution)
    assert execution.status == "stopped_purchase"
    assert "Compra aprovada" in execution.stop_reason

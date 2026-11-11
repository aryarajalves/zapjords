import pytest
import uuid
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from main import app
import models
from routers.webhooks.integrations import get_db as integrations_get_db
from core.security import create_access_token


@pytest.fixture
def auth_headers(db_session):
    test_client = models.Client(name="Client Pinning Test")
    db_session.add(test_client)
    db_session.commit()
    db_session.refresh(test_client)

    user = models.User(
        email=f"user_{uuid.uuid4().hex[:8]}@test.com",
        role="super_admin",
        client_id=test_client.id
    )
    db_session.add(user)
    db_session.commit()

    token = create_access_token({"sub": user.email, "role": user.role})
    headers = {
        "X-Client-ID": str(test_client.id),
        "Authorization": f"Bearer {token}"
    }
    return headers, test_client, user


def test_toggle_pin_webhook_success(client, db_session, auth_headers):
    headers, test_client, _ = auth_headers
    app.dependency_overrides[integrations_get_db] = lambda: db_session

    integration = models.WebhookIntegration(
        id=uuid.uuid4(),
        client_id=test_client.id,
        name="Webhook Kiwify Vendas",
        platform="kiwify",
        status="active",
        is_pinned=False
    )
    db_session.add(integration)
    db_session.commit()

    # 1. Fixar integração (PATCH /pin)
    res = client.patch(f"/api/webhook-integrations/{integration.id}/pin", headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["is_pinned"] is True
    assert data["pinned_at"] is not None

    # Verificar no banco
    db_session.refresh(integration)
    assert integration.is_pinned is True
    assert integration.pinned_at is not None

    # 2. Desafixar integração (PATCH /pin)
    res2 = client.patch(f"/api/webhook-integrations/{integration.id}/pin", headers=headers)
    assert res2.status_code == 200, res2.text
    data2 = res2.json()
    assert data2["is_pinned"] is False
    assert data2["pinned_at"] is None

    # Verificar no banco
    db_session.refresh(integration)
    assert integration.is_pinned is False
    assert integration.pinned_at is None


def test_max_5_pinned_webhooks_limit(client, db_session, auth_headers):
    headers, test_client, _ = auth_headers
    app.dependency_overrides[integrations_get_db] = lambda: db_session

    # Criar 6 integrações
    created_integrations = []
    for i in range(6):
        integ = models.WebhookIntegration(
            id=uuid.uuid4(),
            client_id=test_client.id,
            name=f"Webhook {i+1}",
            platform="hotmart",
            status="active",
            is_pinned=False
        )
        db_session.add(integ)
        created_integrations.append(integ)
    db_session.commit()

    # Fixar as 5 primeiras integrações (deve ser bem sucedido)
    for i in range(5):
        res = client.patch(f"/api/webhook-integrations/{created_integrations[i].id}/pin", headers=headers)
        assert res.status_code == 200, f"Falha ao fixar integração {i+1}: {res.text}"
        assert res.json()["is_pinned"] is True

    # Tentar fixar a 6ª integração (deve retornar HTTP 400 com erro amigável)
    res6 = client.patch(f"/api/webhook-integrations/{created_integrations[5].id}/pin", headers=headers)
    assert res6.status_code == 400
    detail = res6.json().get("detail", "")
    assert "limite de 5 integrações fixadas" in detail.lower()


def test_pinned_webhooks_sorting_order(client, db_session, auth_headers):
    headers, test_client, _ = auth_headers
    app.dependency_overrides[integrations_get_db] = lambda: db_session

    now = datetime.now(timezone.utc)
    # Criar 2 normais (não fixadas)
    unpinned1 = models.WebhookIntegration(
        id=uuid.uuid4(),
        client_id=test_client.id,
        name="Unpinned 1",
        platform="eduzz",
        is_pinned=False,
        created_at=now - timedelta(hours=5)
    )
    unpinned2 = models.WebhookIntegration(
        id=uuid.uuid4(),
        client_id=test_client.id,
        name="Unpinned 2",
        platform="eduzz",
        is_pinned=False,
        created_at=now - timedelta(hours=4)
    )

    # Criar 2 fixadas em momentos diferentes
    pinned_older = models.WebhookIntegration(
        id=uuid.uuid4(),
        client_id=test_client.id,
        name="Pinned Antigo",
        platform="kiwify",
        is_pinned=True,
        pinned_at=now - timedelta(minutes=30),
        created_at=now - timedelta(hours=3)
    )
    pinned_newer = models.WebhookIntegration(
        id=uuid.uuid4(),
        client_id=test_client.id,
        name="Pinned Recente",
        platform="hotmart",
        is_pinned=True,
        pinned_at=now - timedelta(minutes=5),
        created_at=now - timedelta(hours=2)
    )

    db_session.add_all([unpinned1, unpinned2, pinned_older, pinned_newer])
    db_session.commit()

    # Listar integrações
    res = client.get("/api/webhook-integrations", headers=headers)
    assert res.status_code == 200, res.text
    items = res.json()
    
    # Os dois primeiros devem ser os fixados, com Pinned Recente primeiro
    assert items[0]["name"] == "Pinned Recente"
    assert items[0]["is_pinned"] is True
    assert items[1]["name"] == "Pinned Antigo"
    assert items[1]["is_pinned"] is True

    # Os restantes são não-fixados
    assert items[2]["is_pinned"] is False
    assert items[3]["is_pinned"] is False


def test_pinned_webhooks_client_isolation(client, db_session, auth_headers):
    headers, test_client, _ = auth_headers
    app.dependency_overrides[integrations_get_db] = lambda: db_session

    # Criar outro cliente com 5 integrações já fixadas
    client2 = models.Client(name="Client 2")
    db_session.add(client2)
    db_session.commit()

    for i in range(5):
        integ2 = models.WebhookIntegration(
            id=uuid.uuid4(),
            client_id=client2.id,
            name=f"Client2 Webhook {i}",
            platform="hotmart",
            is_pinned=True,
            pinned_at=datetime.now(timezone.utc)
        )
        db_session.add(integ2)
    db_session.commit()

    # Agora o test_client (client 1) deve conseguir fixar uma integração sem ser bloqueado
    integ1 = models.WebhookIntegration(
        id=uuid.uuid4(),
        client_id=test_client.id,
        name="Client1 Webhook",
        platform="hotmart",
        is_pinned=False
    )
    db_session.add(integ1)
    db_session.commit()

    res = client.patch(f"/api/webhook-integrations/{integ1.id}/pin", headers=headers)
    assert res.status_code == 200
    assert res.json()["is_pinned"] is True


def test_toggle_pin_invalid_uuid_and_not_found(client, db_session, auth_headers):
    headers, _, _ = auth_headers
    app.dependency_overrides[integrations_get_db] = lambda: db_session

    # UUID inválido
    res_bad = client.patch("/api/webhook-integrations/not-a-uuid/pin", headers=headers)
    assert res_bad.status_code == 400

    # UUID inexistente
    res_not_found = client.patch(f"/api/webhook-integrations/{uuid.uuid4()}/pin", headers=headers)
    assert res_not_found.status_code == 404

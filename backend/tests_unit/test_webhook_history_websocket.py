import pytest
import uuid
from unittest.mock import AsyncMock, patch
from datetime import datetime, timezone
import models
from main import app
from routers.webhooks.actions import get_db as actions_get_db
from routers.webhooks.history import get_db as history_get_db
from core.security import create_access_token


@pytest.mark.asyncio
async def test_test_webhook_emits_websocket_history_update(client, db_session):
    app.dependency_overrides[actions_get_db] = lambda: db_session
    try:
        db = db_session

        # 1. Cria cliente, integração e usuário
        test_client = models.Client(name="WS Test Client")
        db.add(test_client)
        db.commit()
        db.refresh(test_client)

        user = models.User(
            email="ws_test@example.com",
            hashed_password="hash",
            is_active=True,
            client_id=test_client.id,
            role="admin"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        integration_id = uuid.uuid4()
        integration = models.WebhookIntegration(
            id=integration_id,
            client_id=test_client.id,
            name="WS Test Integration",
            platform="hotmart",
            status="active"
        )
        db.add(integration)
        db.commit()

        token = create_access_token(data={"sub": user.email})
        headers = {
            "Authorization": f"Bearer {token}",
            "x-client-id": str(test_client.id)
        }

        with patch("rabbitmq_client.rabbitmq.publish_event", new_callable=AsyncMock) as mock_pub:
            test_payload = {
                "event": "PURCHASE_APPROVED",
                "data": {
                    "buyer": {"name": "Cliente Realtime", "checkout_phone": "5511988887777"},
                    "product": {"name": "Curso VIP"},
                    "purchase": {"status": "APPROVED"}
                }
            }

            resp = client.post(
                f"/api/webhook-integrations/{integration_id}/test",
                headers=headers,
                json=test_payload
            )

            assert resp.status_code == 200, resp.text
            data = resp.json()
            assert "history_id" in data

            # Verifica se publish_event foi chamado com webhook_history_update e is_new: True
            assert mock_pub.called
            call_args = mock_pub.call_args[0]
            assert call_args[0] == "webhook_history_update"
            event_payload = call_args[1]
            assert event_payload["integration_id"] == str(integration_id)
            assert event_payload["client_id"] == test_client.id
            assert event_payload["is_new"] is True
            assert event_payload["history_id"] == data["history_id"]
    finally:
        app.dependency_overrides.pop(actions_get_db, None)


@pytest.mark.asyncio
async def test_delete_and_clear_webhook_history_emits_websocket(client, db_session):
    app.dependency_overrides[history_get_db] = lambda: db_session
    try:
        db = db_session

        test_client = models.Client(name="WS History Delete Client")
        db.add(test_client)
        db.commit()
        db.refresh(test_client)

        user = models.User(
            email="ws_del@example.com",
            hashed_password="hash",
            is_active=True,
            client_id=test_client.id,
            role="admin"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        integration_id = uuid.uuid4()
        integration = models.WebhookIntegration(
            id=integration_id,
            client_id=test_client.id,
            name="WS Del Integration",
            platform="hotmart",
            status="active"
        )
        db.add(integration)
        db.commit()

        # Adiciona 2 históricos
        h1 = models.WebhookHistory(
            integration_id=integration_id,
            payload={"event": "test"},
            status="processed",
            event_type="test"
        )
        h2 = models.WebhookHistory(
            integration_id=integration_id,
            payload={"event": "test2"},
            status="processed",
            event_type="test2"
        )
        db.add_all([h1, h2])
        db.commit()
        db.refresh(h1)
        db.refresh(h2)

        token = create_access_token(data={"sub": user.email})
        headers = {
            "Authorization": f"Bearer {token}",
            "x-client-id": str(test_client.id)
        }

        # 1. Testa deleção única
        with patch("rabbitmq_client.rabbitmq.publish_event", new_callable=AsyncMock) as mock_pub:
            del_resp = client.delete(
                f"/api/webhook-integrations/{integration_id}/history/{h1.id}",
                headers=headers
            )
            assert del_resp.status_code == 200
            assert mock_pub.called
            call_args = mock_pub.call_args[0]
            assert call_args[0] == "webhook_history_deleted"
            assert call_args[1]["history_ids"] == [h1.id]
            assert call_args[1]["client_id"] == test_client.id

        # 2. Testa limpeza total (clear)
        with patch("rabbitmq_client.rabbitmq.publish_event", new_callable=AsyncMock) as mock_pub_clear:
            clear_resp = client.delete(
                f"/api/webhook-integrations/{integration_id}/history/clear",
                headers=headers
            )
            assert clear_resp.status_code == 200
            assert mock_pub_clear.called
            clear_args = mock_pub_clear.call_args[0]
            assert clear_args[0] == "webhook_history_cleared"
            assert clear_args[1]["integration_id"] == str(integration_id)
            assert clear_args[1]["client_id"] == test_client.id
    finally:
        app.dependency_overrides.pop(history_get_db, None)

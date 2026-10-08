import pytest
import models
from main import app
from core.deps import get_current_user, get_validated_client_id
from routers.webhooks.integrations import get_db as integrations_get_db

@pytest.mark.asyncio
async def test_webhook_integration_platform_invite_saving(db_session, client):
    # 1. Configurar dependências de autenticação mockadas
    mock_user = models.User(id=99, email="test_invite@example.com", role="super_admin")
    db_session.add(mock_user)
    db_session.commit()

    async def override_get_current_user():
        return mock_user
        
    async def override_get_validated_client_id():
        return 99

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_validated_client_id] = override_get_validated_client_id
    app.dependency_overrides[integrations_get_db] = lambda: db_session

    try:
        # 2. Payload para criar integração com geração automática de convite na plataforma
        create_payload = {
            "name": "Integração Hotmart Convite",
            "platform": "hotmart",
            "status": "active",
            "mappings": [
                {
                    "event_type": "compra_aprovada",
                    "template_name": "compra_aprovada_bussola",
                    "delay_minutes": 0,
                    "variables_mapping": [],
                    "private_note": "true",
                    "chatwoot_label": [],
                    "publish_external_event": True,
                    "is_active": True,
                    # Campos de convite da plataforma
                    "auto_create_invite": True,
                    "invite_role": "aluno",
                    "invite_duration_hours": 72,
                    "invite_course_access": [
                        {"course_id": 1, "access_duration": "lifetime"},
                        {"course_id": 2, "access_duration": "1_year"}
                    ]
                }
            ]
        }

        # Testar POST /api/webhook-integrations
        res_create = client.post("/api/webhook-integrations", json=create_payload, headers={"X-Client-ID": "99"})
        assert res_create.status_code == 200, f"Erro ao criar: {res_create.text}"
        data_create = res_create.json()
        assert "id" in data_create
        assert len(data_create["mappings"]) == 1
        created_mapping = data_create["mappings"][0]
        assert created_mapping["auto_create_invite"] is True
        assert created_mapping["invite_role"] == "aluno"
        assert created_mapping["invite_duration_hours"] == 72
        assert len(created_mapping["invite_course_access"]) == 2

        integration_id = data_create["id"]

        # Validar no banco de dados diretamente
        import uuid
        uuid_obj = uuid.UUID(integration_id)
        db_m = db_session.query(models.WebhookEventMapping).filter(
            models.WebhookEventMapping.integration_id == uuid_obj
        ).first()
        assert db_m is not None
        assert db_m.auto_create_invite is True
        assert db_m.invite_role == "aluno"
        assert db_m.invite_duration_hours == 72
        assert len(db_m.invite_course_access) == 2

        # 3. Testar PUT /api/webhook-integrations/{id} alterando os campos de convite
        update_payload = {
            "name": "Integração Hotmart Convite Atualizada",
            "platform": "hotmart",
            "status": "active",
            "mappings": [
                {
                    "event_type": "compra_aprovada",
                    "template_name": "compra_aprovada_bussola",
                    "delay_minutes": 0,
                    "variables_mapping": [],
                    "private_note": "true",
                    "chatwoot_label": [],
                    "publish_external_event": True,
                    "is_active": True,
                    # Atualizando para admin e 24h
                    "auto_create_invite": True,
                    "invite_role": "admin",
                    "invite_duration_hours": 24,
                    "invite_course_access": [
                        {"course_id": 1, "access_duration": "6_months"}
                    ]
                }
            ]
        }

        res_update = client.put(f"/api/webhook-integrations/{integration_id}", json=update_payload, headers={"X-Client-ID": "99"})
        assert res_update.status_code == 200, f"Erro ao atualizar: {res_update.text}"
        data_update = res_update.json()
        assert len(data_update["mappings"]) == 1
        updated_mapping = data_update["mappings"][0]
        assert updated_mapping["auto_create_invite"] is True
        assert updated_mapping["invite_role"] == "admin"
        assert updated_mapping["invite_duration_hours"] == 24
        assert len(updated_mapping["invite_course_access"]) == 1

        # Validar no banco novamente
        db_session.expire_all()
        db_m_updated = db_session.query(models.WebhookEventMapping).filter(
            models.WebhookEventMapping.integration_id == uuid_obj
        ).first()
        assert db_m_updated is not None
        assert db_m_updated.auto_create_invite is True
        assert db_m_updated.invite_role == "admin"
        assert db_m_updated.invite_duration_hours == 24
        assert len(db_m_updated.invite_course_access) == 1

        # 4. Testar desativação do switch (auto_create_invite = False)
        update_payload["mappings"][0]["auto_create_invite"] = False
        res_disable = client.put(f"/api/webhook-integrations/{integration_id}", json=update_payload, headers={"X-Client-ID": "99"})
        assert res_disable.status_code == 200
        assert res_disable.json()["mappings"][0]["auto_create_invite"] is False

    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_validated_client_id, None)
        app.dependency_overrides.pop(integrations_get_db, None)

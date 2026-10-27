import pytest
from datetime import datetime, timezone
import models
from main import app
from core.deps import get_current_user, get_validated_client_id

def test_get_and_update_trigger_button_actions(client, db_session):
    # 1. Criar usuário e cliente
    user = models.User(
        id=999,
        email="test_buttons@example.com",
        role="super_admin",
        client_id=1
    )
    client_obj = models.Client(id=1, name="Cliente Teste")
    db_session.add(user)
    db_session.add(client_obj)
    db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[get_validated_client_id] = lambda: 1

    try:
        # 2. Criar funis para associar
        funnel_vendas = models.Funnel(name="Funil de Vendas", client_id=1, steps=[])
        funnel_descadastro = models.Funnel(name="Funil Descadastro", client_id=1, steps=[])
        db_session.add(funnel_vendas)
        db_session.add(funnel_descadastro)
        db_session.commit()

        # 3. Criar cache de template com botões
        tpl_cache = models.WhatsAppTemplateCache(
            id=999888777,
            client_id=1,
            name="template_com_botoes",
            language="pt_BR",
            components=[
                {
                    "type": "BODY",
                    "text": "Olá! Gostaria de participar?"
                },
                {
                    "type": "BUTTONS",
                    "buttons": [
                        {"type": "QUICK_REPLY", "text": "Quero Participar"},
                        {"type": "QUICK_REPLY", "text": "Sair da Lista"}
                    ]
                }
            ]
        )
        db_session.add(tpl_cache)
        db_session.commit()

        # 4. Criar o disparo (ScheduledTrigger) inicialmente sem button_actions
        trigger = models.ScheduledTrigger(
            client_id=1,
            status="completed",
            is_bulk=True,
            template_name="template_com_botoes",
            scheduled_time=datetime.now(timezone.utc),
            button_actions=None
        )
        db_session.add(trigger)
        db_session.commit()

        # 5. Testar GET /api/triggers/{trigger_id}/button-actions-info
        res_info = client.get(f"/api/triggers/{trigger.id}/button-actions-info")
        assert res_info.status_code == 200
        data_info = res_info.json()
        assert data_info["trigger_id"] == trigger.id
        assert data_info["template_name"] == "template_com_botoes"
        assert "Quero Participar" in data_info["discovered_buttons"]
        assert "Sair da Lista" in data_info["discovered_buttons"]
        assert any(f["id"] == funnel_vendas.id for f in data_info["funnels"])

        # 6. Testar PATCH /api/triggers/{trigger_id}/button-actions
        update_payload = {
            "button_actions": {
                "Quero Participar": {
                    "type": "interaction",
                    "funnel_id": funnel_vendas.id,
                    "activate_agent": True
                },
                "Sair da Lista": {
                    "type": "block",
                    "funnel_id": funnel_descadastro.id,
                    "activate_agent": False
                }
            }
        }

        res_patch = client.patch(f"/api/triggers/{trigger.id}/button-actions", json=update_payload)
        assert res_patch.status_code == 200
        data_patch = res_patch.json()
        assert data_patch["trigger_id"] == trigger.id
        assert "Quero Participar" in data_patch["button_actions"]
        assert data_patch["button_actions"]["Quero Participar"]["type"] == "interaction"
        assert data_patch["button_actions"]["Quero Participar"]["funnel_name"] == "Funil de Vendas"
        assert data_patch["button_actions"]["Sair da Lista"]["type"] == "block"
        assert data_patch["button_actions"]["Sair da Lista"]["funnel_name"] == "Funil Descadastro"

        # Verificar persistência no banco de dados
        db_session.refresh(trigger)
        assert trigger.button_actions is not None
        assert trigger.button_actions["Quero Participar"]["type"] == "interaction"
        assert trigger.button_actions["Quero Participar"]["funnel_id"] == funnel_vendas.id
        assert trigger.button_actions["Sair da Lista"]["type"] == "block"

        # 7. Testar limpar ações
        res_clear = client.patch(f"/api/triggers/{trigger.id}/button-actions", json={"button_actions": {}})
        assert res_clear.status_code == 200
        db_session.refresh(trigger)
        assert trigger.button_actions is None

    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_validated_client_id, None)

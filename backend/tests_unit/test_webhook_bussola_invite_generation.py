import pytest
import uuid
from unittest.mock import AsyncMock, patch
import models
from services.bussola_invite_service import ensure_trigger_bussola_invite
from services.webhooks_execution import execute_webhook_resend_logic

@pytest.mark.asyncio
async def test_ensure_trigger_bussola_invite(db_session):
    client_id = 14
    integ_id = uuid.uuid4()
    
    mapping = models.WebhookEventMapping(
        integration_id=integ_id,
        event_type="compra_aprovada",
        template_name="compra_aprovada_bussola",
        bussola_auto_create_invite=True,
        bussola_invite_role="client",
        bussola_validity_type="never",
        is_active=True
    )
    db_session.add(mapping)
    db_session.commit()

    trigger = models.ScheduledTrigger(
        client_id=client_id,
        integration_id=integ_id,
        event_type="compra_aprovada",
        contact_phone="5585998259497",
        contact_name="Cliente Teste",
        template_name="compra_aprovada_bussola",
        template_components=[{"type": "body", "parameters": [{"text": "-", "type": "text"}]}],
        private_message="Acesse sua conta 👇\n\n-\n\nSeja bem-vindo!",
        processed_data={"name": "Cliente Teste"}
    )
    db_session.add(trigger)
    db_session.commit()
    db_session.refresh(trigger)

    mock_invite = {
        "invite_url": "https://bussolaastrologica.com.br/cadastro?token=bussola_abc_123",
        "token": "bussola_abc_123"
    }

    with patch("services.bussola_invite_service.generate_bussola_invite", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = mock_invite
        
        comps, priv, proc = await ensure_trigger_bussola_invite(db_session, trigger, trigger.template_components)
        
        assert comps[0]["parameters"][0]["text"] == "https://bussolaastrologica.com.br/cadastro?token=bussola_abc_123"
        assert "https://bussolaastrologica.com.br/cadastro?token=bussola_abc_123" in priv
        assert proc["link_bussola"] == "https://bussolaastrologica.com.br/cadastro?token=bussola_abc_123"
        assert mock_gen.called


@pytest.mark.asyncio
async def test_execute_webhook_resend_logic_bussola_invite(db_session):
    client_id = 14
    integ_id = uuid.uuid4()
    
    integration = models.WebhookIntegration(
        id=integ_id,
        client_id=client_id,
        name="Hotmart Bússola",
        platform="hotmart",
        status="active"
    )
    db_session.add(integration)
    
    mapping = models.WebhookEventMapping(
        integration_id=integ_id,
        event_type="checkout_pre_populado",
        template_name="compra_aprovada_bussola",
        bussola_auto_create_invite=True,
        bussola_invite_role="client",
        bussola_validity_type="never",
        variables_mapping=[{"key": "1", "type": "body", "value": "link_bussola"}],
        is_active=True
    )
    db_session.add(mapping)
    
    history = models.WebhookHistory(
        integration_id=integ_id,
        event_type="checkout_pre_populado",
        status="skipped",
        payload={"phone": "5511999998888", "name": "Carlos", "event": "checkout_pre_populado"},
        processed_data={"name": "Carlos", "phone": "5511999998888"}
    )
    db_session.add(history)
    db_session.commit()
    db_session.refresh(history)

    mock_invite = {
        "invite_url": "https://bussolaastrologica.com.br/cadastro?token=bussola_resend_999",
        "token": "bussola_resend_999"
    }

    with patch("services.bussola_invite_service.generate_bussola_invite", new_callable=AsyncMock) as mock_gen, \
         patch("services.webhooks_execution.resolve_template_body_with_sync", new_callable=AsyncMock) as mock_tpl:
        
        mock_gen.return_value = mock_invite
        mock_tpl.return_value = ("Olá! Acesse aqui: {{1}}", None)
        
        res = await execute_webhook_resend_logic(history.id, client_id, db_session, None)
        
        assert res.get("status") == "success"
        trigger = db_session.query(models.ScheduledTrigger).filter_by(
            contact_phone="5511999998888",
            template_name="compra_aprovada_bussola"
        ).order_by(models.ScheduledTrigger.id.desc()).first()

        assert trigger is not None
        body_param = trigger.template_components[0]["parameters"][0]["text"]
        assert body_param == "https://bussolaastrologica.com.br/cadastro?token=bussola_resend_999"
        assert "https://bussolaastrologica.com.br/cadastro?token=bussola_resend_999" in trigger.private_message
        assert trigger.processed_data.get("link_bussola") == "https://bussolaastrologica.com.br/cadastro?token=bussola_resend_999"

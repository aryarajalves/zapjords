import pytest
import uuid
from unittest.mock import AsyncMock, patch
import models
from services.platform_invite_service import ensure_trigger_platform_invite
from services.webhooks_execution import execute_webhook_resend_logic

@pytest.mark.asyncio
async def test_ensure_trigger_platform_invite(db_session):
    client_id = 14
    integ_id = uuid.uuid4()
    
    # 1. Cria mapeamento com auto_create_invite
    mapping = models.WebhookEventMapping(
        integration_id=integ_id,
        event_type="checkout_pre_populado",
        template_name="compra_aprovada_bussula02",
        auto_create_invite=True,
        invite_role="aluno",
        invite_duration_hours=24,
        invite_course_access=[],
        is_active=True
    )
    db_session.add(mapping)
    db_session.commit()

    # 2. Cria trigger legado/anterior com "-" no componente
    trigger = models.ScheduledTrigger(
        client_id=client_id,
        integration_id=integ_id,
        event_type="checkout_pre_populado",
        contact_phone="5585998259497",
        contact_name="Aryaraj",
        template_name="compra_aprovada_bussula02",
        template_components=[{"type": "body", "parameters": [{"text": "-", "type": "text"}]}],
        private_message="Acesse abaixo 👇\n\n-\n\nGrupo VIP",
        processed_data={"name": "Aryaraj"}
    )
    db_session.add(trigger)
    db_session.commit()
    db_session.refresh(trigger)

    mock_invite = {
        "full_invite_url": "http://localhost:8010/register?token=test_token_123",
        "invite_url": "http://localhost:8010/register?token=test_token_123"
    }

    with patch("services.platform_invite_service.generate_platform_invite", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = mock_invite
        
        comps, priv, proc = await ensure_trigger_platform_invite(db_session, trigger, trigger.template_components)
        
        assert comps[0]["parameters"][0]["text"] == "http://localhost:8010/register?token=test_token_123"
        assert "http://localhost:8010/register?token=test_token_123" in priv
        assert proc["link_cadastro"] == "http://localhost:8010/register?token=test_token_123"
        assert mock_gen.called


@pytest.mark.asyncio
async def test_execute_webhook_resend_logic_platform_invite(db_session):
    client_id = 14
    integ_id = uuid.uuid4()

    integration = models.WebhookIntegration(
        id=integ_id,
        client_id=client_id,
        name="Hotmart Test",
        platform="hotmart",
        status="active"
    )
    db_session.add(integration)

    mapping = models.WebhookEventMapping(
        integration_id=integ_id,
        event_type="checkout_pre_populado",
        template_name="compra_aprovada_bussula02",
        auto_create_invite=True,
        invite_role="aluno",
        invite_duration_hours=0,
        invite_course_access=[],
        variables_mapping=[{"key": "1", "type": "body", "value": "link_cadastro"}],
        is_active=True
    )
    db_session.add(mapping)

    history = models.WebhookHistory(
        integration_id=integ_id,
        event_type="checkout_pre_populado",
        payload={
            "phone": "5585998259497",
            "name": "ARYARAJ ALVES",
            "event": "checkout_pre_populado"
        },
        processed_data={
            "phone": "5585998259497",
            "name": "ARYARAJ ALVES",
            "event_type": "checkout_pre_populado"
        },
        status="skipped"
    )
    db_session.add(history)
    db_session.commit()
    db_session.refresh(history)

    mock_invite = {
        "full_invite_url": "http://localhost:8010/register?token=auto_invite_456",
        "invite_url": "http://localhost:8010/register?token=auto_invite_456"
    }

    with patch("services.platform_invite_service.generate_platform_invite", new_callable=AsyncMock) as mock_gen, \
         patch("services.webhooks_execution.resolve_template_body_with_sync", new_callable=AsyncMock) as mock_tpl:
        mock_gen.return_value = mock_invite
        mock_tpl.return_value = ("Olá! Acesse aqui: {{1}}", None)

        res = await execute_webhook_resend_logic(history.id, client_id, db_session, None)
        assert res.get("status") == "success"
        
        # Valida que o scheduled_trigger foi criado com o link de convite em vez de '-'
        trigger = db_session.query(models.ScheduledTrigger).filter_by(
            contact_phone="5585998259497",
            template_name="compra_aprovada_bussula02"
        ).order_by(models.ScheduledTrigger.id.desc()).first()

        assert trigger is not None
        body_param = trigger.template_components[0]["parameters"][0]["text"]
        assert body_param == "http://localhost:8010/register?token=auto_invite_456"
        assert "http://localhost:8010/register?token=auto_invite_456" in trigger.private_message
        assert trigger.processed_data.get("link_cadastro") == "http://localhost:8010/register?token=auto_invite_456"

import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from schemas_domain.webhooks import WebhookEventMappingBase
from services.webhooks import process_webhook_automation

def test_webhook_event_mapping_schema_email_fields():
    """Valida se o schema aceita campos de email marketing"""
    data = {
        "event_type": "compra_aprovada",
        "email_active": True,
        "email_template_id": 42,
        "email_funnel_id": 99,
        "email_subject": "Acesso Liberado!"
    }
    mapping = WebhookEventMappingBase(**data)
    assert mapping.email_active is True
    assert mapping.email_template_id == 42
    assert mapping.email_funnel_id == 99
    assert mapping.email_subject == "Acesso Liberado!"

class DummyMapping:
    id = 123
    integration_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    is_active = True
    template_id = None
    template_name = None
    funnel_id = None
    manychat_active = False
    email_active = True
    email_template_id = 15
    email_funnel_id = 88
    email_subject = "Bem-vindo ao Treinamento {{nome}}"
    invite_course_access = []
    auto_create_invite = False
    bussola_auto_create_invite = False
    bussola_invite_active = False
    chatwoot_label = []
    private_note = False
    cancel_pending_on_trigger = False
    delay_minutes = 0
    auto_save_contact = False

@pytest.mark.asyncio
async def test_process_webhook_automation_email_only():
    """Valida se uma regra com apenas email marketing dispara corretamente e registra ScheduledTrigger para histórico de disparos"""
    mapping = DummyMapping()

    history_mock = MagicMock()
    history_mock.id = 999
    history_mock.integration_id = mapping.integration_id
    history_mock.event_type = "compra_aprovada"
    history_mock.payload = {"buyer": {"email": "maria@exemplo.com", "name": "Maria"}}
    history_mock.duplicate_count = 0
    history_mock.processed_data = {}
    history_mock.status = "pending"

    integration_mock = MagicMock()
    integration_mock.platform = "hotmart"

    email_tpl_mock = MagicMock()
    email_tpl_mock.id = 15
    email_tpl_mock.name = "Boas Vindas"
    email_tpl_mock.subject = "Assunto Padrão"
    email_tpl_mock.body_html = "<p>Olá Maria</p>"

    email_cfg_mock = MagicMock()
    email_cfg_mock.client_id = 1

    email_funnel_mock = MagicMock()
    email_funnel_mock.id = 88
    email_funnel_mock.name = "Funil de Onboarding"

    added_objects = []
    db_mock = MagicMock()
    def fake_add(obj):
        added_objects.append(obj)
    db_mock.add.side_effect = fake_add

    db_mock.query().filter().first.side_effect = [
        history_mock,       # history
        email_tpl_mock,     # email template
        email_cfg_mock,     # email config
        None,               # lead para email_funnel
        email_funnel_mock   # email funnel
    ]
    db_mock.query().filter_by().first.return_value = integration_mock

    variables = {
        "email": "maria@exemplo.com",
        "name": "Maria",
        "nome": "Maria"
    }

    with patch("database.SessionLocal", return_value=db_mock), \
         patch("rabbitmq_client.rabbitmq.publish_event", new_callable=AsyncMock), \
         patch("services.email_service.send_single_email", new_callable=AsyncMock, return_value={"success": True}) as mock_send_email, \
         patch("services.email_funnel_service.enroll_contact_in_funnel", new_callable=AsyncMock) as mock_enroll:
        
        await process_webhook_automation(
            client_id=1,
            mapping=mapping,
            variables=variables,
            history_id=999
        )
        
        # Status deve ter sido atualizado para processed sem erro
        assert history_mock.status == "processed"

        # ScheduledTrigger deve ter sido adicionado ao DB para o histórico de disparos
        import models
        scheduled_triggers = [o for o in added_objects if isinstance(o, models.ScheduledTrigger)]
        assert len(scheduled_triggers) >= 1
        
        # Valida que sent_as é EMAIL e o status é completed
        st_email = scheduled_triggers[0]
        assert st_email.sent_as == "EMAIL"
        assert st_email.status == "completed"
        assert st_email.integration_id == mapping.integration_id
        assert st_email.contact_name == "Maria"
        assert "E-mail: Boas Vindas" in st_email.template_name

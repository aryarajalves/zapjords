import pytest
import asyncio
from unittest.mock import MagicMock, patch
from sqlalchemy.orm import Session
from models.email import EmailFunnel, EmailFunnelExecution
from models.trigger import WebhookLead
from services.email_funnel_service import (
    trigger_email_funnels_by_tag,
    dispatch_email_funnels_by_tag_background
)

@pytest.fixture
def mock_db():
    db = MagicMock(spec=Session)
    return db

@pytest.mark.asyncio
async def test_trigger_email_funnels_by_tag_success(mock_db):
    client_id = 14
    lead_id = 100
    contact_email = "lead@teste.com"
    contact_name = "Lead Teste"
    new_tags = ["newsletter", "vip"]

    # Funil ativo com trigger de tag "newsletter"
    funnel = MagicMock(spec=EmailFunnel)
    funnel.id = 1
    funnel.client_id = client_id
    funnel.name = "Boas-Vindas Newsletter"
    funnel.is_active = True
    funnel.trigger_type = "tag"
    funnel.trigger_config = {"tag": "newsletter"}
    funnel.steps = [{"id": "step_1", "type": "email", "template_id": 10}]
    funnel.stop_tags = []

    # Configurar mock de query: primeiro busca funis, depois verifica execuções existentes (retorna None)
    mock_db.query.return_value.filter.return_value.all.return_value = [funnel]
    mock_db.query.return_value.filter.return_value.first.return_value = None

    with patch("services.email_funnel_service.enroll_contact_in_funnel") as mock_enroll:
        mock_exec = MagicMock(spec=EmailFunnelExecution)
        mock_exec.id = 99
        mock_enroll.return_value = mock_exec

        enrolled_ids = await trigger_email_funnels_by_tag(
            db=mock_db,
            client_id=client_id,
            lead_id=lead_id,
            contact_email=contact_email,
            contact_name=contact_name,
            new_tags=new_tags
        )

        assert enrolled_ids == [99]
        mock_enroll.assert_called_once_with(
            db=mock_db,
            client_id=client_id,
            funnel_id=1,
            contact_email="lead@teste.com",
            contact_name="Lead Teste",
            lead_id=100
        )

@pytest.mark.asyncio
async def test_trigger_email_funnels_by_tag_skips_when_no_matching_tag(mock_db):
    client_id = 14
    funnel = MagicMock(spec=EmailFunnel)
    funnel.id = 1
    funnel.is_active = True
    funnel.trigger_type = "tag"
    funnel.trigger_config = {"tag": "newsletter"}

    mock_db.query.return_value.filter.return_value.all.return_value = [funnel]

    with patch("services.email_funnel_service.enroll_contact_in_funnel") as mock_enroll:
        enrolled_ids = await trigger_email_funnels_by_tag(
            db=mock_db,
            client_id=client_id,
            lead_id=100,
            contact_email="outro@teste.com",
            contact_name="Outro Lead",
            new_tags=["outra_tag", "leads_quentes"]
        )

        assert enrolled_ids == []
        mock_enroll.assert_not_called()

def test_dispatch_email_funnels_by_tag_background_non_blocking():
    # Testa que a função despacha a thread sem bloquear
    with patch("threading.Thread") as mock_thread:
        mock_inst = MagicMock()
        mock_thread.return_value = mock_inst

        dispatch_email_funnels_by_tag_background(
            client_id=14,
            lead_id=100,
            contact_email="teste@teste.com",
            contact_name="Nome",
            new_tags=["newsletter"]
        )

        mock_thread.assert_called_once()
        mock_inst.start.assert_called_once()

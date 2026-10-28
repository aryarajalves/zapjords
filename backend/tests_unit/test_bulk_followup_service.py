# -*- coding: utf-8 -*-
import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, patch

import models
from services.followup_service import (
    create_followup_triggers,
    qualify_followup_contacts,
    cancel_contact_from_pending_followups
)


@pytest.fixture
def test_setup(db_session):
    """Cria cliente e usuário base para testes."""
    client = models.Client(id=1, name="Cliente Teste Follow-up")
    db_session.add(client)
    db_session.commit()
    return client


def test_create_followup_triggers_relative_and_fixed(db_session, test_setup):
    """Testa a criação de triggers de follow-up com agendamento relativo e fixo."""
    now = datetime(2026, 10, 27, 12, 0, 0, tzinfo=timezone.utc)
    
    parent_trigger = models.ScheduledTrigger(
        client_id=1,
        is_bulk=True,
        template_name="template_principal",
        template_language="pt_BR",
        scheduled_time=now,
        status="completed",
        contacts_list=[{"phone": "5511999990001", "name": "Lead 1"}]
    )
    db_session.add(parent_trigger)
    db_session.commit()
    db_session.refresh(parent_trigger)

    fixed_time = datetime(2026, 10, 30, 15, 0, 0, tzinfo=timezone.utc)
    followups_data = [
        {
            "template_name": "followup_1",
            "schedule_type": "relative",
            "relative_delay_hours": 24,
            "stop_tags": ["comprou", "fechado"],
            "button_actions": {"Quero Comprar": {"type": "interaction", "funnel_id": 10}}
        },
        {
            "template_name": "followup_2",
            "schedule_type": "fixed",
            "scheduled_time": fixed_time.isoformat(),
            "stop_tags": ["desqualificado"],
            "button_actions": {"Parar": {"type": "block"}}
        }
    ]

    fus = create_followup_triggers(db_session, parent_trigger, followups_data, client_id=1)

    assert len(fus) == 2
    
    # Follow-up 1
    fu1 = fus[0]
    assert fu1.parent_id == parent_trigger.id
    assert fu1.is_followup is True
    assert fu1.followup_step_number == 1
    assert fu1.template_name == "followup_1"
    assert fu1.schedule_type == "relative"
    assert fu1.relative_delay_hours == 24
    
    # Normaliza timezone para assert em SQLite
    fu1_time = fu1.scheduled_time if fu1.scheduled_time.tzinfo else fu1.scheduled_time.replace(tzinfo=timezone.utc)
    assert fu1_time == now + timedelta(hours=24)
    assert fu1.stop_tags == ["comprou", "fechado"]
    assert "Quero Comprar" in fu1.button_actions

    # Follow-up 2
    fu2 = fus[1]
    assert fu2.parent_id == parent_trigger.id
    assert fu2.is_followup is True
    assert fu2.followup_step_number == 2
    assert fu2.template_name == "followup_2"
    assert fu2.schedule_type == "fixed"
    fu2_time = fu2.scheduled_time if fu2.scheduled_time.tzinfo else fu2.scheduled_time.replace(tzinfo=timezone.utc)
    assert fu2_time == fixed_time
    assert fu2.stop_tags == ["desqualificado"]
    assert fu2.button_actions["Parar"]["type"] == "block"


def test_qualify_followup_contacts_strict_filtering(db_session, test_setup):
    """
    Testa os critérios de qualificação e interrupção do follow-up:
    - Inclui apenas entregue ('delivered' ou 'read');
    - Exclui 'failed';
    - Exclui contato em lista de bloqueio;
    - Exclui contato que interagiu/clicou em botão do template;
    - Exclui contato que possui stop tag na conversa do chat;
    - Exclui contato que possui stop tag nos dados do lead.
    """
    now = datetime(2026, 10, 27, 12, 0, 0, tzinfo=timezone.utc)
    
    parent_trigger = models.ScheduledTrigger(
        client_id=1,
        is_bulk=True,
        template_name="template_principal",
        scheduled_time=now,
        status="completed",
        contacts_list=[
            {"phone": "5511999990001", "name": "Contato Valido"},
            {"phone": "5511999990002", "name": "Contato Falhou"},
            {"phone": "5511999990003", "name": "Contato Bloqueado"},
            {"phone": "5511999990004", "name": "Contato Clicou Botao"},
            {"phone": "5511999990005", "name": "Contato Stop Tag Chat"},
            {"phone": "5511999990006", "name": "Contato Stop Tag Lead"}
        ]
    )
    db_session.add(parent_trigger)
    db_session.commit()

    # 1. MessageStatuses do pai
    # Contato 1: Delivered
    db_session.add(models.MessageStatus(trigger_id=parent_trigger.id, phone_number="5511999990001", status="delivered", is_interaction=False))
    # Contato 2: Failed
    db_session.add(models.MessageStatus(trigger_id=parent_trigger.id, phone_number="5511999990002", status="failed", is_interaction=False))
    # Contato 3: Delivered mas em BlockedContact
    db_session.add(models.MessageStatus(trigger_id=parent_trigger.id, phone_number="5511999990003", status="delivered", is_interaction=False))
    db_session.add(models.BlockedContact(client_id=1, phone="5511999990003", reason="Opt-out"))
    # Contato 4: Delivered mas clicou em botão (is_interaction = True)
    db_session.add(models.MessageStatus(trigger_id=parent_trigger.id, phone_number="5511999990004", status="delivered", is_interaction=True))
    # Contato 5: Delivered mas tem stop tag na conversa
    db_session.add(models.MessageStatus(trigger_id=parent_trigger.id, phone_number="5511999990005", status="read", is_interaction=False))
    db_session.add(models.ChatConversation(client_id=1, phone="5511999990005", labels=["Comprou", "Cliente_VIP"]))
    # Contato 6: Delivered mas tem stop tag no lead
    db_session.add(models.MessageStatus(trigger_id=parent_trigger.id, phone_number="5511999990006", status="read", is_interaction=False))
    db_session.add(models.WebhookLead(client_id=1, phone="5511999990006", name="Lead 6", tags="comprou,vip"))

    db_session.commit()

    # Criar o trigger de follow-up com stop_tags = ["comprou"]
    fu_trigger = models.ScheduledTrigger(
        client_id=1,
        parent_id=parent_trigger.id,
        is_bulk=True,
        is_followup=True,
        followup_step_number=1,
        template_name="template_followup",
        stop_tags=["comprou"],
        status="queued",
        scheduled_time=now + timedelta(hours=24)
    )
    db_session.add(fu_trigger)
    db_session.commit()

    qualified = qualify_followup_contacts(db_session, fu_trigger)

    # Apenas o Contato 1 deve ser qualificado!
    assert len(qualified) == 1
    assert qualified[0]["phone"] == "5511999990001"
    assert qualified[0]["name"] == "Contato Valido"


def test_cancel_contact_from_pending_followups(db_session, test_setup):
    """Testa cancelamento de um contato específico em todos os follow-ups pendentes."""
    now = datetime(2026, 10, 27, 12, 0, 0, tzinfo=timezone.utc)
    
    fu1 = models.ScheduledTrigger(
        client_id=1,
        is_bulk=True,
        is_followup=True,
        status="queued",
        scheduled_time=now + timedelta(hours=24),
        exclusion_list=[]
    )
    fu2 = models.ScheduledTrigger(
        client_id=1,
        is_bulk=True,
        is_followup=True,
        status="pending",
        scheduled_time=now + timedelta(hours=48),
        exclusion_list=["5511888888888"]
    )
    fu_finished = models.ScheduledTrigger(
        client_id=1,
        is_bulk=True,
        is_followup=True,
        status="completed",
        scheduled_time=now,
        exclusion_list=[]
    )
    db_session.add_all([fu1, fu2, fu_finished])
    db_session.commit()

    count = cancel_contact_from_pending_followups(db_session, client_id=1, phone="5511999990001")

    assert count == 2
    assert "5511999990001" in fu1.exclusion_list
    assert "5511999990001" in fu2.exclusion_list
    assert "5511999990001" not in fu_finished.exclusion_list

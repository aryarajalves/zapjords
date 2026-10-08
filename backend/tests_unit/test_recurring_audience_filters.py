import pytest
import sys, os
from datetime import datetime, timedelta, timezone

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
from core.recurrent_logic import filter_contacts_by_audience, enrich_contacts_with_audience_data
from routers.schedules import get_recurring_contacts, update_recurring_schedule, trigger_recurring_manual
import schemas

def setup_test_db():
    engine = create_engine("sqlite:///:memory:")
    models.Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    client = models.Client(id=1, name="Cliente Teste Recorrência", is_active=True)
    user = models.User(id=1, email="admin@test.com", role="super_admin", client_id=1)
    db.add_all([client, user])
    db.commit()

    now = datetime.now(timezone.utc)

    # Contato 1: Interagiu há 3 dias (dentro de 7d), Criado há 5 dias (dentro de 7d)
    lead1 = models.WebhookLead(id=1, client_id=1, name="Lead Recente", phone="5511999990001", email="lead1@test.com", created_at=now - timedelta(days=5))
    convo1 = models.ChatConversation(id=1, client_id=1, phone="5511999990001", last_contact_message_at=now - timedelta(days=3))

    # Contato 2: Interagiu há 20 dias (dentro de 30d, fora de 7d/14d), Criado há 40 dias (dentro de 60d)
    lead2 = models.WebhookLead(id=2, client_id=1, name="Lead Medio", phone="5511999990002", email="lead2@test.com", created_at=now - timedelta(days=40))
    convo2 = models.ChatConversation(id=2, client_id=1, phone="5511999990002", last_contact_message_at=now - timedelta(days=20))

    # Contato 3: Nunca interagiu (last_contact_message_at=None), Criado há 10 dias (dentro de 14d)
    lead3 = models.WebhookLead(id=3, client_id=1, name="Lead Sem Interacao", phone="5511999990003", email="lead3@test.com", created_at=now - timedelta(days=10))
    convo3 = models.ChatConversation(id=3, client_id=1, phone="5511999990003", last_contact_message_at=None)

    # Contato 4: Interagiu há 75 dias (dentro de 90d, fora de 60d), Criado há 80 dias (dentro de 90d)
    lead4 = models.WebhookLead(id=4, client_id=1, name="Lead Antigo", phone="5511999990004", email="lead4@test.com", created_at=now - timedelta(days=80))
    convo4 = models.ChatConversation(id=4, client_id=1, phone="5511999990004", last_contact_message_at=now - timedelta(days=75))

    db.add_all([lead1, lead2, lead3, lead4, convo1, convo2, convo3, convo4])
    db.commit()

    return db, client, user, now


def test_filter_contacts_by_audience_interaction_ranges():
    db, client, user, now = setup_test_db()

    contacts = [
        {"phone": "5511999990001", "name": "Lead Recente"},
        {"phone": "5511999990002", "name": "Lead Medio"},
        {"phone": "5511999990003", "name": "Lead Sem Interacao"},
        {"phone": "5511999990004", "name": "Lead Antigo"},
    ]

    # 1. Sem filtro: todos retornam
    all_res = filter_contacts_by_audience(db, client_id=1, contacts=contacts, interaction_days=None, now=now)
    assert len(all_res) == 4

    # 2. Últimos 7 dias: apenas Lead 1
    res_7 = filter_contacts_by_audience(db, client_id=1, contacts=contacts, interaction_days=7, now=now)
    assert len(res_7) == 1
    assert res_7[0]["phone"] == "5511999990001"

    # 3. Últimos 14 dias: apenas Lead 1 (Lead 2 tem 20 dias)
    res_14 = filter_contacts_by_audience(db, client_id=1, contacts=contacts, interaction_days=14, now=now)
    assert len(res_14) == 1
    assert res_14[0]["phone"] == "5511999990001"

    # 4. Últimos 30 dias: Lead 1 e Lead 2
    res_30 = filter_contacts_by_audience(db, client_id=1, contacts=contacts, interaction_days=30, now=now)
    assert len(res_30) == 2
    phones_30 = {c["phone"] for c in res_30}
    assert phones_30 == {"5511999990001", "5511999990002"}

    # 5. Últimos 60 dias: Lead 1 e Lead 2
    res_60 = filter_contacts_by_audience(db, client_id=1, contacts=contacts, interaction_days=60, now=now)
    assert len(res_60) == 2

    # 6. Últimos 90 dias: Lead 1, Lead 2 e Lead 4 (Lead 3 nunca interagiu)
    res_90 = filter_contacts_by_audience(db, client_id=1, contacts=contacts, interaction_days=90, now=now)
    assert len(res_90) == 3
    phones_90 = {c["phone"] for c in res_90}
    assert phones_90 == {"5511999990001", "5511999990002", "5511999990004"}

    db.close()


def test_filter_contacts_by_audience_created_ranges():
    db, client, user, now = setup_test_db()

    contacts = [
        {"phone": "5511999990001", "name": "Lead Recente"},
        {"phone": "5511999990002", "name": "Lead Medio"},
        {"phone": "5511999990003", "name": "Lead Sem Interacao"},
        {"phone": "5511999990004", "name": "Lead Antigo"},
    ]

    # Criados nos últimos 7 dias: apenas Lead 1 (5 dias)
    res_cr_7 = filter_contacts_by_audience(db, client_id=1, contacts=contacts, created_days=7, now=now)
    assert len(res_cr_7) == 1
    assert res_cr_7[0]["phone"] == "5511999990001"

    # Criados nos últimos 14 dias: Lead 1 (5 dias) e Lead 3 (10 dias)
    res_cr_14 = filter_contacts_by_audience(db, client_id=1, contacts=contacts, created_days=14, now=now)
    assert len(res_cr_14) == 2
    phones_14 = {c["phone"] for c in res_cr_14}
    assert phones_14 == {"5511999990001", "5511999990003"}

    # Criados nos últimos 60 dias: Lead 1 (5d), Lead 3 (10d), Lead 2 (40d)
    res_cr_60 = filter_contacts_by_audience(db, client_id=1, contacts=contacts, created_days=60, now=now)
    assert len(res_cr_60) == 3
    phones_60 = {c["phone"] for c in res_cr_60}
    assert phones_60 == {"5511999990001", "5511999990002", "5511999990003"}

    db.close()


def test_filter_contacts_by_audience_combined():
    db, client, user, now = setup_test_db()

    contacts = [
        {"phone": "5511999990001", "name": "Lead Recente"},
        {"phone": "5511999990002", "name": "Lead Medio"},
        {"phone": "5511999990003", "name": "Lead Sem Interacao"},
        {"phone": "5511999990004", "name": "Lead Antigo"},
    ]

    # Combinação: Interagiu nos últimos 30d E Criado nos últimos 14d
    # Lead 1: interagiu há 3d (ok) e criado há 5d (ok) -> SIM
    # Lead 2: interagiu há 20d (ok), mas criado há 40d (fora de 14d) -> NÃO
    # Lead 3: nunca interagiu -> NÃO
    # Lead 4: interagiu há 75d -> NÃO
    res_comb = filter_contacts_by_audience(db, client_id=1, contacts=contacts, interaction_days=30, created_days=14, now=now)
    assert len(res_comb) == 1
    assert res_comb[0]["phone"] == "5511999990001"

    db.close()


def test_enrich_contacts_with_audience_data():
    db, client, user, now = setup_test_db()

    contacts = [
        {"phone": "5511999990001", "name": "Lead Recente"},
        {"phone": "5511999990003", "name": "Lead Sem Interacao"}
    ]

    enriched = enrich_contacts_with_audience_data(db, client_id=1, contacts=contacts)
    assert len(enriched) == 2
    assert enriched[0]["last_interaction_at"] is not None
    assert enriched[0]["created_at"] is not None
    assert enriched[1]["last_interaction_at"] is None
    assert enriched[1]["created_at"] is not None

    db.close()


@pytest.mark.asyncio
async def test_recurring_contacts_endpoint_and_patch():
    db, client, user, now = setup_test_db()

    # Criar RecurringTrigger com lista estática
    rt = models.RecurringTrigger(
        client_id=1,
        frequency="weekly",
        scheduled_time="10:00",
        template_name="template_teste",
        contacts_list=[
            {"phone": "5511999990001", "name": "Lead 1"},
            {"phone": "5511999990002", "name": "Lead 2"}
        ],
        interaction_filter_days=14,
        created_filter_days=30
    )
    db.add(rt)
    db.commit()
    db.refresh(rt)

    # 1. Chamar get_recurring_contacts
    res = await get_recurring_contacts(rt_id=rt.id, x_client_id="1", db=db, current_user=user)
    assert res["interaction_filter_days"] == 14
    assert res["created_filter_days"] == 30
    assert len(res["contacts"]) == 2
    assert "last_interaction_at" in res["contacts"][0]
    assert "created_at" in res["contacts"][0]

    # 2. Atualizar via update_recurring_schedule
    patch_payload = schemas.RecurringTriggerUpdate(
        interaction_filter_days=7,
        created_filter_days=60
    )
    updated = update_recurring_schedule(rt_id=rt.id, rt_data=patch_payload, x_client_id="1", db=db, current_user=user)
    assert updated.interaction_filter_days == 7
    assert updated.created_filter_days == 60

    # 3. Testar disparo manual respeitando os filtros
    # Com interaction_filter_days=7, apenas Lead 1 (3 dias) deve ser enfileirado
    await trigger_recurring_manual(rt_id=rt.id, x_client_id="1", db=db, current_user=user)
    st = db.query(models.ScheduledTrigger).filter(models.ScheduledTrigger.recurring_trigger_id == rt.id).first()
    assert st is not None
    assert len(st.contacts_list) == 1
    assert st.contacts_list[0]["phone"] == "5511999990001"

    db.close()

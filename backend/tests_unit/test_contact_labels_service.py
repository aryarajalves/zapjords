import pytest
from unittest.mock import MagicMock, AsyncMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
from services.contact_label_service import (
    apply_contact_labels_locally,
    apply_contact_labels_to_chatwoot,
    sync_contact_dispatch_labels
)


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    models.Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_apply_contact_labels_locally_updates_existing_lead(db_session):
    client_id = 1
    phone = "5511999998888"

    # Cria lead existente com uma tag
    lead = models.WebhookLead(
        client_id=client_id,
        phone=phone,
        name="Teste Contato",
        tags="Cliente Antigo"
    )
    db_session.add(lead)
    db_session.commit()

    # Aplica novas etiquetas no contato
    labels = ["Lead Quente", "cliente antigo", "VIP"] # 'cliente antigo' duplicado case-insensitive
    res = apply_contact_labels_locally(db_session, client_id, phone, labels, contact_name="Teste Contato")

    db_session.refresh(lead)
    tags = [t.strip() for t in lead.tags.split(",")]
    assert "Cliente Antigo" in tags
    assert "Lead Quente" in tags
    assert "VIP" in tags
    # Não deve duplicar 'cliente antigo'
    assert len([t for t in tags if t.lower() == "cliente antigo"]) == 1


def test_apply_contact_labels_locally_truncates_at_25_chars(db_session):
    client_id = 1
    phone = "5511988887777"

    long_tag = "NomeDeEtiquetaMuitoLongoComMaisDeVinteECincoCaracteres"
    res = apply_contact_labels_locally(db_session, client_id, phone, [long_tag])

    lead = db_session.query(models.WebhookLead).filter(models.WebhookLead.phone == phone).first()
    assert lead is not None
    assert lead.tags == long_tag[:25]
    assert len(lead.tags) <= 25


def test_apply_contact_labels_locally_creates_new_lead_if_not_found(db_session):
    client_id = 2
    phone = "5521977776666"

    labels = ["Novo Lead Disparo"]
    res = apply_contact_labels_locally(db_session, client_id, phone, labels, contact_name="Lead Criado")

    lead = db_session.query(models.WebhookLead).filter(models.WebhookLead.phone == phone).first()
    assert lead is not None
    assert lead.client_id == client_id
    assert lead.name == "Lead Criado"
    assert "Novo Lead Disparo" in lead.tags


def test_apply_contact_labels_does_not_modify_chat_conversation(db_session):
    client_id = 1
    phone = "5511999991111"

    # Cria uma conversa local de chat
    convo = models.ChatConversation(
        client_id=client_id,
        phone=phone,
        contact_name="Conversa Chat",
        status="open",
        labels=["Conversa Atendimento"]
    )
    db_session.add(convo)
    db_session.commit()

    # Aplica etiquetas no CONTATO
    labels = ["Etiqueta Contato Disparo"]
    apply_contact_labels_locally(db_session, client_id, phone, labels)

    # Verifica se a conversa de chat permaneceu INTACTA
    db_session.refresh(convo)
    assert convo.labels == ["Conversa Atendimento"]
    assert "Etiqueta Contato Disparo" not in convo.labels


@pytest.mark.asyncio
async def test_apply_contact_labels_to_chatwoot_calls_add_label_to_contact():
    mock_cw = MagicMock()
    mock_cw.simulate = False
    mock_cw.search_contact = AsyncMock(return_value={
        "payload": [
            {"id": 4321, "phone_number": "+5511999998888", "name": "Contato Remoto"}
        ]
    })
    mock_cw.add_label_to_contact = AsyncMock(return_value={"success": True})

    success = await apply_contact_labels_to_chatwoot(mock_cw, "5511999998888", ["Comprador", "VIP"])
    assert success is True
    mock_cw.add_label_to_contact.assert_awaited_once_with(4321, ["Comprador", "VIP"])


@pytest.mark.asyncio
async def test_sync_contact_dispatch_labels_orchestration(db_session):
    client_id = 5
    phone = "5585988880000"

    mock_cw = MagicMock()
    mock_cw.simulate = False
    mock_cw.search_contact = AsyncMock(return_value={
        "payload": [{"id": 999, "phone_number": "+5585988880000"}]
    })
    mock_cw.add_label_to_contact = AsyncMock(return_value={"success": True})

    res = await sync_contact_dispatch_labels(
        db=db_session,
        client_id=client_id,
        phone=phone,
        raw_contact_labels=["Lead Qualificado"],
        contact_name="Maria",
        chatwoot_client=mock_cw
    )

    assert res is True
    # Valida persistência local
    lead = db_session.query(models.WebhookLead).filter(models.WebhookLead.phone == phone).first()
    assert lead is not None
    assert lead.tags == "Lead Qualificado"

    # Valida envio ao Chatwoot
    mock_cw.add_label_to_contact.assert_awaited_once()


def test_scheduled_and_recurring_models_have_contact_labels():
    st = models.ScheduledTrigger(client_id=1, contact_labels=["TagA", "TagB"])
    assert st.contact_labels == ["TagA", "TagB"]

    rt = models.RecurringTrigger(client_id=1, frequency="weekly", contact_labels=["RecorrenteTag"])
    assert rt.contact_labels == ["RecorrenteTag"]

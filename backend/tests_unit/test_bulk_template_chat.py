import pytest
import os
import sys
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timezone, timedelta

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.environ["DATABASE_URL"] = "sqlite://"

from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from database import Base
from models import User, Client, ChatConversation, ScheduledTrigger, SalesPipeline, SalesPipelineStage, SalesDeal
from core.security import get_password_hash, create_access_token
from core.deps import get_db

engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client_obj(db):
    c = Client(name="BulkTemplateTestClient")
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@pytest.fixture
def test_user(db, client_obj):
    user = User(
        email="bulk_tpl_user@test.com",
        hashed_password=get_password_hash("pass123"),
        role="admin",
        is_active=True,
        client_id=client_obj.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_headers(client_obj, test_user):
    token = create_access_token(data={"sub": test_user.email, "client_id": client_obj.id})
    return {
        "Authorization": f"Bearer {token}",
        "X-Client-ID": str(client_obj.id),
    }


@pytest.fixture
def app_client(db):
    from main import app
    def override_get_db():
        yield db
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_bulk_template_missing_template(app_client, auth_headers):
    """Deve retornar erro 400 se nenhum template for fornecido."""
    payload = {
        "ids": [1, 2]
    }
    res = app_client.post("/api/chat/conversations/bulk-template", json=payload, headers=auth_headers)
    assert res.status_code == 400
    assert "Template não especificado" in res.json()["detail"]


def test_bulk_template_no_selection(app_client, auth_headers):
    """Deve retornar erro 400 se nenhuma conversa for selecionada."""
    payload = {
        "template_name": "promo_black_friday",
        "ids": []
    }
    res = app_client.post("/api/chat/conversations/bulk-template", json=payload, headers=auth_headers)
    assert res.status_code == 400
    assert "Nenhuma conversa ou oportunidade selecionada" in res.json()["detail"]


@patch("rabbitmq_client.rabbitmq.publish", new_callable=AsyncMock)
def test_bulk_template_success_with_buttons_and_followup(mock_publish, app_client, auth_headers, db, client_obj):
    """Deve criar o ScheduledTrigger, processar follow-ups e publicar no RabbitMQ com sucesso."""
    convo1 = ChatConversation(
        client_id=client_obj.id,
        phone="5511999991111",
        contact_name="Ana Silva",
        status="open",
        created_at=datetime.now(timezone.utc)
    )
    convo2 = ChatConversation(
        client_id=client_obj.id,
        phone="5511999992222",
        contact_name="Carlos Souza",
        status="open",
        created_at=datetime.now(timezone.utc)
    )
    db.add_all([convo1, convo2])
    db.commit()

    payload = {
        "ids": [convo1.id, convo2.id],
        "template_name": "oferta_exclusiva",
        "language": "pt_BR",
        "delay_seconds": 3,
        "concurrency_limit": 2,
        "button_actions": {
            "Quero Comprar": {"type": "interaction", "funnel_id": 5},
            "Não Tenho Interesse": {"type": "block", "funnel_id": 8}
        },
        "is_followup_enabled": True,
        "followups": [
            {
                "template_name": "lembrete_followup_1",
                "schedule_type": "relative",
                "relative_delay_hours": 12,
                "stop_tags": ["comprou"],
                "button_actions": {
                    "Sim, quero": {"type": "interaction", "funnel_id": 5}
                }
            }
        ]
    }

    res = app_client.post("/api/chat/conversations/bulk-template", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["total_contacts"] == 2
    assert data["template_name"] == "oferta_exclusiva"
    trigger_id = data["trigger_id"]

    # Verificar no banco
    trigger = db.query(ScheduledTrigger).filter_by(id=trigger_id).first()
    assert trigger is not None
    assert trigger.template_name == "oferta_exclusiva"
    assert trigger.is_bulk is True
    assert trigger.total_contacts == 2
    assert trigger.button_actions["Quero Comprar"]["type"] == "interaction"
    assert trigger.button_actions["Não Tenho Interesse"]["type"] == "block"

    # Verificar trigger filho de follow-up
    fu_triggers = db.query(ScheduledTrigger).filter_by(parent_id=trigger.id).all()
    assert len(fu_triggers) == 1
    assert fu_triggers[0].template_name == "lembrete_followup_1"
    assert fu_triggers[0].is_followup is True

    # Verificar que RabbitMQ foi chamado
    assert mock_publish.called
    call_args = mock_publish.call_args[0]
    assert call_args[0] == "zapvoice_bulk_sends"
    assert call_args[1]["trigger_id"] == trigger_id
    assert call_args[1]["template_name"] == "oferta_exclusiva"
    assert len(call_args[1]["contacts"]) == 2


@patch("rabbitmq_client.rabbitmq.publish", new_callable=AsyncMock)
def test_bulk_template_select_all_pages(mock_publish, app_client, auth_headers, db, client_obj):
    """Deve filtrar e incluir todas as conversas válidas quando select_all_pages for True."""
    convo = ChatConversation(
        client_id=client_obj.id,
        phone="5521988887777",
        contact_name="Beatriz Lima",
        status="open",
        created_at=datetime.now(timezone.utc)
    )
    db.add(convo)
    db.commit()

    payload = {
        "select_all_pages": True,
        "status": "open",
        "tab": "todos",
        "template_name": "newsletter_geral"
    }

    res = app_client.post("/api/chat/conversations/bulk-template", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["total_contacts"] >= 1


def test_preview_bulk_template_recipients(app_client, auth_headers, db, client_obj):
    """Deve retornar a lista detalhada de destinatários para a aba de Contatos do modal."""
    c1 = ChatConversation(
        client_id=client_obj.id,
        phone="5511977778888",
        contact_name="Carlos Eduardo",
        status="open",
        labels=["Cliente VIP"],
        created_at=datetime.now(timezone.utc)
    )
    c2 = ChatConversation(
        client_id=client_obj.id,
        phone="5511966665555",
        contact_name="Diana Prince",
        status="open",
        labels=["Lead Quente"],
        created_at=datetime.now(timezone.utc)
    )
    db.add_all([c1, c2])
    db.commit()

    payload = {
        "ids": [c1.id, c2.id]
    }

    res = app_client.post("/api/chat/conversations/bulk-template/recipients", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2
    assert len(data["recipients"]) == 2

    r1 = next(r for r in data["recipients"] if r["conversation_id"] == c1.id)
    assert r1["name"] == "Carlos Eduardo"
    assert r1["phone"] == "5511977778888"
    assert "+55 (11) 97777-8888" in r1["formatted_phone"]
    assert "Cliente VIP" in r1["labels"]


def test_bulk_template_future_schedule(app_client, auth_headers, db, client_obj):
    """Deve agendar o disparo para o futuro com status 'queued' e scheduled_time configurado."""
    c = ChatConversation(
        client_id=client_obj.id,
        phone="5511999990001",
        contact_name="Lucas Agendado",
        status="open",
        created_at=datetime.now(timezone.utc)
    )
    db.add(c)
    db.commit()

    future_time = datetime.now(timezone.utc) + timedelta(days=3)
    payload = {
        "template_name": "lembrete_consulta",
        "ids": [c.id],
        "scheduled_time": future_time.isoformat()
    }

    res = app_client.post("/api/chat/conversations/bulk-template", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["mode"] == "scheduled"
    assert "agendado com sucesso" in data["message"]

    trigger = db.query(ScheduledTrigger).filter(ScheduledTrigger.id == data["trigger_id"]).first()
    assert trigger is not None
    assert trigger.status == "queued"
    assert trigger.is_bulk is True


def test_bulk_template_recurring_schedule(app_client, auth_headers, db, client_obj):
    """Deve criar um disparo recorrente (RecurringTrigger) semanal com dias e horário definidos."""
    c = ChatConversation(
        client_id=client_obj.id,
        phone="5511999990002",
        contact_name="Julia Recorrente",
        status="open",
        created_at=datetime.now(timezone.utc)
    )
    db.add(c)
    db.commit()

    from models import RecurringTrigger
    payload = {
        "template_name": "promocao_semanal",
        "ids": [c.id],
        "is_recurring": True,
        "frequency": "weekly",
        "days_of_week": [0, 2, 4],  # Seg, Qua, Sex
        "recurrence_time": "14:30"
    }

    res = app_client.post("/api/chat/conversations/bulk-template", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["mode"] == "recurring"
    assert "recorrente" in data["message"]
    assert data["frequency"] == "weekly"

    rt = db.query(RecurringTrigger).filter(RecurringTrigger.id == data["recurring_id"]).first()
    assert rt is not None
    assert rt.is_active is True
    assert rt.frequency == "weekly"
    assert rt.scheduled_time == "14:30"
    assert rt.next_run_at is not None


def test_bulk_template_kanban_recipients(app_client, auth_headers, db, client_obj):
    """Deve listar destinatários oriundos do Kanban de Vendas com variáveis de produto e valor."""
    pipe = SalesPipeline(name="Pipeline Teste Kanban", client_id=client_obj.id)
    db.add(pipe)
    db.commit()

    stage = SalesPipelineStage(name="Negociação", client_id=client_obj.id, pipeline_id=pipe.id, order_index=0)
    db.add(stage)
    db.commit()

    deal = SalesDeal(
        client_id=client_obj.id,
        pipeline_id=pipe.id,
        stage_id=stage.id,
        contact_name="Carlos Eduardo",
        contact_phone="5511988887777",
        contact_email="carlos@test.com",
        product_name="Consultoria VIP",
        value=2500.0,
        status="open"
    )
    db.add(deal)
    db.commit()

    payload = {
        "source": "kanban",
        "deal_ids": [deal.id]
    }

    res = app_client.post("/api/chat/conversations/bulk-template/recipients", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    recipient = data["recipients"][0]
    assert recipient["name"] == "Carlos Eduardo"
    assert recipient["phone"] == "5511988887777"
    assert recipient["deal_id"] == deal.id
    assert recipient["vars"]["produto"] == "Consultoria VIP"
    assert "2.500,00" in recipient["vars"]["valor"]
    assert recipient["vars"]["primeiro_nome"] == "Carlos"


@patch("rabbitmq_client.rabbitmq.publish", new_callable=AsyncMock)
def test_bulk_template_kanban_dispatch(mock_publish, app_client, auth_headers, db, client_obj):
    """Deve permitir disparar template para oportunidades selecionadas do Kanban de Vendas."""
    pipe = SalesPipeline(name="Funil Disparo", client_id=client_obj.id)
    db.add(pipe)
    db.commit()

    stage = SalesPipelineStage(name="Fechamento", client_id=client_obj.id, pipeline_id=pipe.id, order_index=0)
    db.add(stage)
    db.commit()

    deal = SalesDeal(
        client_id=client_obj.id,
        pipeline_id=pipe.id,
        stage_id=stage.id,
        contact_name="Mariana Silva",
        contact_phone="5511977776666",
        product_name="Plano Black",
        value=1497.0,
        status="open"
    )
    db.add(deal)
    db.commit()

    payload = {
        "source": "kanban",
        "deal_ids": [deal.id],
        "template_name": "cupom_exclusivo",
        "language": "pt_BR",
        "delay_seconds": 3,
        "concurrency_limit": 2
    }

    res = app_client.post("/api/chat/conversations/bulk-template", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["total_contacts"] == 1
    assert data["template_name"] == "cupom_exclusivo"


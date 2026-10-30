import pytest
import os
import sys
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.environ["DATABASE_URL"] = "sqlite://"

from database import Base
import models
from models import User, Client, ChatConversation, SalesPipeline, SalesPipelineStage, SalesDeal
from core.security import get_password_hash, create_access_token
from core.deps import get_db
from routers.chat.conversation_modules.conversation_filter_helpers import build_conversation_filter_query

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
def test_setup(db):
    client = Client(name="PipelineFilterTestClient")
    db.add(client)
    db.commit()
    db.refresh(client)

    user = User(
        email="kanban_tester@example.com",
        hashed_password=get_password_hash("pass123"),
        role="admin",
        is_active=True,
        client_id=client.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Criar pipelines e estágios
    pipe_a = SalesPipeline(client_id=client.id, name="Mentoria Elite")
    pipe_b = SalesPipeline(client_id=client.id, name="Curso VIP")
    db.add_all([pipe_a, pipe_b])
    db.commit()
    db.refresh(pipe_a)
    db.refresh(pipe_b)

    stage_a1 = SalesPipelineStage(pipeline_id=pipe_a.id, client_id=client.id, name="Lead", order_index=0)
    stage_a2 = SalesPipelineStage(pipeline_id=pipe_a.id, client_id=client.id, name="Fechamento", order_index=1)
    stage_b1 = SalesPipelineStage(pipeline_id=pipe_b.id, client_id=client.id, name="Primeiro Contato", order_index=0)
    db.add_all([stage_a1, stage_a2, stage_b1])
    db.commit()
    db.refresh(stage_a1)
    db.refresh(stage_a2)
    db.refresh(stage_b1)

    # Conversas
    c1 = ChatConversation(
        client_id=client.id,
        phone="5511999990001",
        contact_name="Lead Mentoria",
        status="open",
        created_at=datetime.now(timezone.utc)
    )
    c2 = ChatConversation(
        client_id=client.id,
        phone="5511999990002",
        contact_name="Lead Curso",
        status="open",
        created_at=datetime.now(timezone.utc)
    )
    c3 = ChatConversation(
        client_id=client.id,
        phone="5511999990003",
        contact_name="Lead Sem Kanban",
        status="open",
        created_at=datetime.now(timezone.utc)
    )
    db.add_all([c1, c2, c3])
    db.commit()
    db.refresh(c1)
    db.refresh(c2)
    db.refresh(c3)

    # Deals: c1 está na Pipe A Stage A1, c2 está na Pipe B Stage B1
    deal1 = SalesDeal(
        client_id=client.id,
        pipeline_id=pipe_a.id,
        stage_id=stage_a1.id,
        contact_phone="5511999990001",
        contact_name="Lead Mentoria",
        status="open"
    )
    deal2 = SalesDeal(
        client_id=client.id,
        pipeline_id=pipe_b.id,
        stage_id=stage_b1.id,
        contact_phone="5511999990002",
        contact_name="Lead Curso",
        status="open"
    )
    db.add_all([deal1, deal2])
    db.commit()

    return {
        "client": client,
        "user": user,
        "pipe_a": pipe_a,
        "pipe_b": pipe_b,
        "stage_a1": stage_a1,
        "stage_a2": stage_a2,
        "stage_b1": stage_b1,
        "c1": c1,
        "c2": c2,
        "c3": c3
    }


def test_filter_in_pipeline_general(db, test_setup):
    """Testa filtro in_pipeline=True (deve retornar todas as conversas com deal em qualquer pipeline)."""
    s = test_setup
    query = build_conversation_filter_query(
        db=db,
        client_id=s["client"].id,
        in_pipeline=True
    )
    results = query.all()
    phones = [c.phone for c in results]
    assert s["c1"].phone in phones
    assert s["c2"].phone in phones
    assert s["c3"].phone not in phones
    assert len(results) == 2


def test_filter_by_specific_pipeline(db, test_setup):
    """Testa filtro pipeline_id (deve retornar apenas as conversas da pipeline selecionada)."""
    s = test_setup
    query = build_conversation_filter_query(
        db=db,
        client_id=s["client"].id,
        pipeline_id=s["pipe_a"].id
    )
    results = query.all()
    assert len(results) == 1
    assert results[0].phone == s["c1"].phone


def test_filter_by_pipeline_and_stage(db, test_setup):
    """Testa filtro pipeline_id + pipeline_stage_id (deve retornar apenas conversas na coluna específica)."""
    s = test_setup
    # Estágio A1 tem c1
    query_match = build_conversation_filter_query(
        db=db,
        client_id=s["client"].id,
        pipeline_id=s["pipe_a"].id,
        pipeline_stage_id=s["stage_a1"].id
    )
    results_match = query_match.all()
    assert len(results_match) == 1
    assert results_match[0].phone == s["c1"].phone

    # Estágio A2 não tem nenhum lead
    query_empty = build_conversation_filter_query(
        db=db,
        client_id=s["client"].id,
        pipeline_id=s["pipe_a"].id,
        pipeline_stage_id=s["stage_a2"].id
    )
    results_empty = query_empty.all()
    assert len(results_empty) == 0


def test_filter_api_endpoint(db, test_setup):
    """Testa a rota GET /api/chat/conversations com in_pipeline, pipeline_id e pipeline_stage_id."""
    from main import app
    s = test_setup
    token = create_access_token(data={"sub": s["user"].email, "client_id": s["client"].id})

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as client:
            # 1. Filtro in_pipeline=true
            res = client.get(
                "/api/chat/conversations?in_pipeline=true",
                headers={"Authorization": f"Bearer {token}", "X-Client-ID": str(s["client"].id)}
            )
            assert res.status_code == 200
            data = res.json()
            convo_list = data.get("conversations", [])
            phones = [c["phone"] for c in convo_list]
            assert s["c1"].phone in phones
            assert s["c2"].phone in phones
            assert s["c3"].phone not in phones

            # 2. Filtro pipeline_id
            res_pipe = client.get(
                f"/api/chat/conversations?pipeline_id={s['pipe_a'].id}",
                headers={"Authorization": f"Bearer {token}", "X-Client-ID": str(s["client"].id)}
            )
            assert res_pipe.status_code == 200
            pipe_phones = [c["phone"] for c in res_pipe.json().get("conversations", [])]
            assert pipe_phones == [s["c1"].phone]

            # 3. Filtro pipeline_stage_id
            res_stage = client.get(
                f"/api/chat/conversations?pipeline_id={s['pipe_a'].id}&pipeline_stage_id={s['stage_a1'].id}",
                headers={"Authorization": f"Bearer {token}", "X-Client-ID": str(s["client"].id)}
            )
            assert res_stage.status_code == 200
            stage_phones = [c["phone"] for c in res_stage.json().get("conversations", [])]
            assert stage_phones == [s["c1"].phone]
    finally:
        app.dependency_overrides.clear()

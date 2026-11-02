"""
Testes unitários para validar permissões do perfil Vendedor.
Garante acesso a CRM, Pipelines, Schedules e bloqueio a rotas restritas de admin.
"""
import pytest
from models.auth import User
from models.client import Client
from models.crm import SalesPipeline, SalesPipelineStage
from core.deps import get_current_user, get_validated_client_id
from main import app


@pytest.fixture
def vendedor_setup(db_session):
    test_client = Client(name="Empresa Vendedor Teste")
    db_session.add(test_client)
    db_session.commit()
    db_session.refresh(test_client)

    vendedor = User(
        email="vendedor_teste@empresa.com",
        full_name="Vendedor Ativo",
        role="vendedor",
        client_id=test_client.id,
        is_active=True
    )
    db_session.add(vendedor)
    db_session.commit()

    pipeline = SalesPipeline(
        client_id=test_client.id,
        name="Pipeline Vendas Teste",
        is_default=True
    )
    db_session.add(pipeline)
    db_session.commit()
    db_session.refresh(pipeline)

    stage = SalesPipelineStage(
        pipeline_id=pipeline.id,
        client_id=test_client.id,
        name="Lead",
        stage_type="in_progress",
        order_index=0
    )
    db_session.add(stage)
    db_session.commit()

    return {
        "client": test_client,
        "vendedor": vendedor,
        "pipeline": pipeline
    }


def test_vendedor_can_access_crm_pipelines(client, vendedor_setup):
    """Garante que o vendedor pode listar pipelines do CRM sem erro 403."""
    setup = vendedor_setup
    app.dependency_overrides[get_current_user] = lambda: setup["vendedor"]
    app.dependency_overrides[get_validated_client_id] = lambda: setup["client"].id

    resp = client.get("/api/crm/pipelines", headers={"X-Client-ID": str(setup["client"].id)})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    assert data[0]["name"] == "Pipeline Vendas Teste"


def test_vendedor_can_access_kanban_board(client, vendedor_setup):
    """Garante que o vendedor pode carregar o quadro/colunas do Kanban."""
    setup = vendedor_setup
    app.dependency_overrides[get_current_user] = lambda: setup["vendedor"]
    app.dependency_overrides[get_validated_client_id] = lambda: setup["client"].id

    resp = client.get(
        f"/api/crm/pipelines/{setup['pipeline'].id}/board",
        headers={"X-Client-ID": str(setup["client"].id)}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "stages" in data


def test_vendedor_cannot_access_admin_team_performance(client, vendedor_setup):
    """Garante que rotas administrativas continuam com 403 Forbidden para vendedor."""
    setup = vendedor_setup
    app.dependency_overrides[get_current_user] = lambda: setup["vendedor"]
    app.dependency_overrides[get_validated_client_id] = lambda: setup["client"].id

    resp = client.get("/api/team-performance/summary", headers={"X-Client-ID": str(setup["client"].id)})
    assert resp.status_code == 403

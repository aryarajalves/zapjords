"""
Testes unitários para o módulo Team Performance (Desempenho da Equipe).
Valida permissões rígidas (apenas admin/super_admin) e cálculos de métricas de contatos atendidos.
Garante que mensagens de disparos em massa e automações sem vendedor humano (user_id=None)
sejam completamente excluídas das métricas, do ranking e da listagem de contatos.
"""
import pytest
from datetime import datetime, timezone, timedelta
from models.auth import User
from models.client import Client
from models.chat import ChatConversation, ChatMessage
from core.deps import get_current_user, get_validated_client_id
from main import app


@pytest.fixture
def test_setup(db_session):
    """Cria dados básicos: Client, Admin, Vendedor e Conversas com Mensagens"""
    # 1. Cliente
    test_client = Client(name="Empresa Teste Desempenho")
    db_session.add(test_client)
    db_session.commit()
    db_session.refresh(test_client)

    # 2. Usuários: Admin, Vendedor 1, Vendedor 2, Usuário Comum
    admin_user = User(
        email="admin_team@teste.com",
        full_name="Admin Chefe",
        role="admin",
        client_id=test_client.id,
        is_active=True
    )
    vendedor_1 = User(
        email="vendedor1@teste.com",
        full_name="Vendedor Um",
        role="vendedor",
        client_id=test_client.id,
        is_active=True
    )
    vendedor_2 = User(
        email="vendedor2@teste.com",
        full_name="Vendedor Dois",
        role="vendedor",
        client_id=test_client.id,
        is_active=True
    )
    normal_user = User(
        email="user_comum@teste.com",
        full_name="User Sem Acesso",
        role="user",
        client_id=test_client.id,
        is_active=True
    )
    db_session.add_all([admin_user, vendedor_1, vendedor_2, normal_user])
    db_session.commit()

    # 3. Conversas no chat
    now_utc = datetime.now(timezone.utc)
    convo_a = ChatConversation(
        client_id=test_client.id,
        phone="5511999990001",
        contact_name="Lead Alpha",
        status="open"
    )
    convo_b = ChatConversation(
        client_id=test_client.id,
        phone="5511999990002",
        contact_name="Lead Beta",
        status="open"
    )
    convo_c = ChatConversation(
        client_id=test_client.id,
        phone="5511999990003",
        contact_name="Lead Gamma",
        status="open"
    )
    # Conversa exclusiva de disparo em massa / template do sistema
    convo_bulk = ChatConversation(
        client_id=test_client.id,
        phone="5511999990004",
        contact_name="Lead Disparo Bulk",
        status="open"
    )
    db_session.add_all([convo_a, convo_b, convo_c, convo_bulk])
    db_session.commit()

    # 4. Mensagens enviadas:
    # Vendedor 1 envia 2 mensagens no Lead Alpha e 1 no Lead Beta (2 contatos únicos, 3 msgs)
    msg1 = ChatMessage(
        conversation_id=convo_a.id,
        sender_type="user",
        user_id=vendedor_1.id,
        content="Olá Alpha",
        timestamp=now_utc - timedelta(minutes=10)
    )
    msg2 = ChatMessage(
        conversation_id=convo_a.id,
        sender_type="user",
        user_id=vendedor_1.id,
        content="Como posso ajudar?",
        timestamp=now_utc - timedelta(minutes=5)
    )
    msg3 = ChatMessage(
        conversation_id=convo_b.id,
        sender_type="user",
        user_id=vendedor_1.id,
        content="Olá Beta",
        timestamp=now_utc - timedelta(minutes=2)
    )

    # Vendedor 2 envia 1 mensagem no Lead Gamma (1 contato único, 1 msg)
    msg4 = ChatMessage(
        conversation_id=convo_c.id,
        sender_type="user",
        user_id=vendedor_2.id,
        content="Olá Gamma",
        timestamp=now_utc - timedelta(minutes=1)
    )

    # Mensagem do contato (não deve ser contabilizada como envio do vendedor)
    msg_contact = ChatMessage(
        conversation_id=convo_a.id,
        sender_type="contact",
        content="Oi vendedor",
        timestamp=now_utc - timedelta(minutes=4)
    )

    # Mensagem de disparo em massa / template automático do sistema (user_id=None)
    # NÃO DEVE SER CONTABILIZADA no módulo de desempenho da equipe!
    msg_bulk_template = ChatMessage(
        conversation_id=convo_bulk.id,
        sender_type="user",
        user_id=None,
        message_type="template",
        content="Olá! Este é um template de disparo em massa automático.",
        timestamp=now_utc - timedelta(minutes=8)
    )

    db_session.add_all([msg1, msg2, msg3, msg4, msg_contact, msg_bulk_template])
    db_session.commit()

    return {
        "client": test_client,
        "admin": admin_user,
        "vendedor_1": vendedor_1,
        "vendedor_2": vendedor_2,
        "normal_user": normal_user,
        "convo_a": convo_a,
        "convo_b": convo_b,
        "convo_c": convo_c,
        "convo_bulk": convo_bulk
    }


def test_permission_denied_for_vendedor_and_normal_user(client, test_setup):
    """Garante que vendedor e user normal recebem 403 Forbidden."""
    setup = test_setup

    for blocked_user in [setup["vendedor_1"], setup["normal_user"]]:
        app.dependency_overrides[get_current_user] = lambda: blocked_user
        app.dependency_overrides[get_validated_client_id] = lambda: setup["client"].id

        resp = client.get("/api/team-performance/summary")
        assert resp.status_code == 403, f"Usuário {blocked_user.role} não deveria ter acesso"
        assert "permissão" in resp.json()["detail"].lower()


def test_permission_granted_for_admin(client, test_setup):
    """Garante que admin tem acesso e obtém métricas com sucesso (200 OK)."""
    setup = test_setup
    app.dependency_overrides[get_current_user] = lambda: setup["admin"]
    app.dependency_overrides[get_validated_client_id] = lambda: setup["client"].id

    resp = client.get("/api/team-performance/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert "metrics" in data
    assert "sellers_breakdown" in data

    # 3 contatos únicos e 4 mensagens da equipe humana no total hoje (exclui o disparo em massa)
    today_metrics = data["metrics"]["today"]
    assert today_metrics["unique_contacts"] == 3
    assert today_metrics["total_messages"] == 4


def test_bulk_template_messages_are_excluded_from_performance(client, test_setup):
    """
    Garante que mensagens de templates/disparos em massa sem vendedor humano (user_id=None):
    1. NÃO são somadas nos cartões de métricas.
    2. NÃO aparecem no ranking de vendedores.
    3. NÃO aparecem na lista de contatos atendidos.
    """
    setup = test_setup
    app.dependency_overrides[get_current_user] = lambda: setup["admin"]
    app.dependency_overrides[get_validated_client_id] = lambda: setup["client"].id

    # 1. Checa resumo e breakdown
    resp_summary = client.get("/api/team-performance/summary")
    assert resp_summary.status_code == 200
    data_summary = resp_summary.json()

    # Nenhum vendedor com seller_id=None ou nome de sistema deve existir no breakdown
    seller_ids = [s["seller_id"] for s in data_summary["sellers_breakdown"]]
    assert None not in seller_ids, "Disparo em massa sem user_id não deve aparecer no ranking de vendedores"
    assert len(data_summary["sellers_breakdown"]) == 2  # Vendedor Um e Vendedor Dois

    # 2. Checa listagem de contatos atendidos
    resp_contacts = client.get("/api/team-performance/contacts?period=today")
    assert resp_contacts.status_code == 200
    data_contacts = resp_contacts.json()

    contact_phones = [c["phone"] for c in data_contacts["items"]]
    assert "5511999990004" not in contact_phones, "Lead de disparo em massa automático não deve aparecer na lista"
    assert data_contacts["total"] == 3


def test_list_team_sellers(client, test_setup):
    """Garante listagem dos vendedores/membros da equipe."""
    setup = test_setup
    app.dependency_overrides[get_current_user] = lambda: setup["admin"]
    app.dependency_overrides[get_validated_client_id] = lambda: setup["client"].id

    resp = client.get("/api/team-performance/sellers")
    assert resp.status_code == 200
    data = resp.json()
    assert "sellers" in data
    emails = [s["email"] for s in data["sellers"]]
    assert setup["vendedor_1"].email in emails
    assert setup["vendedor_2"].email in emails


def test_filter_by_specific_seller(client, test_setup):
    """Garante que ao filtrar por vendedor 1, as métricas isolam apenas o trabalho dele."""
    setup = test_setup
    app.dependency_overrides[get_current_user] = lambda: setup["admin"]
    app.dependency_overrides[get_validated_client_id] = lambda: setup["client"].id

    resp = client.get(f"/api/team-performance/summary?seller_id={setup['vendedor_1'].id}")
    assert resp.status_code == 200
    data = resp.json()

    # Vendedor 1 conversou com 2 contatos (Alpha e Beta) e enviou 3 mensagens
    today_metrics = data["metrics"]["today"]
    assert today_metrics["unique_contacts"] == 2
    assert today_metrics["total_messages"] == 3


def test_list_attended_contacts(client, test_setup):
    """Garante listagem correta dos contatos atendidos com suporte a busca e paginação."""
    setup = test_setup
    app.dependency_overrides[get_current_user] = lambda: setup["admin"]
    app.dependency_overrides[get_validated_client_id] = lambda: setup["client"].id

    # Busca geral
    resp = client.get("/api/team-performance/contacts?period=today")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 3
    assert len(data["items"]) == 3

    # Busca por filtro de nome "Alpha"
    resp_alpha = client.get("/api/team-performance/contacts?search=Alpha")
    assert resp_alpha.status_code == 200
    data_alpha = resp_alpha.json()
    assert data_alpha["total"] == 1
    assert data_alpha["items"][0]["contact_name"] == "Lead Alpha"
    assert data_alpha["items"][0]["conversation_id"] == setup["convo_a"].id
    assert data_alpha["items"][0]["messages_count"] == 2

import pytest
import base64
from models.auth import User
from models.client import Client
from models.email import EmailTemplate, EmailDispatch, EmailFunnel, EmailFunnelExecution
from core.deps import get_current_user, get_validated_client_id
from main import app

@pytest.fixture
def analytics_setup(db_session):
    """Cria dados de teste para os testes de Analytics e Funil de Newsletter."""
    test_client = Client(name="Cliente Teste Newsletter")
    db_session.add(test_client)
    db_session.commit()
    db_session.refresh(test_client)

    admin_user = User(
        email="admin_newsletter@teste.com",
        full_name="Admin Newsletter",
        role="admin",
        client_id=test_client.id,
        is_active=True
    )
    db_session.add(admin_user)
    db_session.commit()
    db_session.refresh(admin_user)

    # Template
    template = EmailTemplate(
        client_id=test_client.id,
        name="Edição Semanal #1",
        subject="Novidades da Semana 🚀",
        body_html="<p>Olá {{nome}}, confira nosso artigo <a href='https://zapvoice.com.br/artigo'>clique aqui</a></p>",
        is_active=True
    )
    db_session.add(template)
    db_session.commit()
    db_session.refresh(template)

    # Disparo com 2 contatos
    rec_email = "leitor@exemplo.com"
    dispatch = EmailDispatch(
        client_id=test_client.id,
        template_id=template.id,
        title="Newsletter Semanal #1",
        subject="Novidades da Semana 🚀",
        tag_name="newsletter",
        status="completed",
        total_contacts=2,
        total_sent=2,
        total_failed=0,
        total_opened=0,
        total_clicks=0,
        contacts_list=[
            {
                "email": rec_email,
                "name": "Leitor Ativo",
                "status": "sent"
            },
            {
                "email": "leitor2@exemplo.com",
                "name": "Segundo Leitor",
                "status": "sent"
            }
        ],
        analytics_data={"clicks_by_url": {}}
    )
    db_session.add(dispatch)
    db_session.commit()
    db_session.refresh(dispatch)

    return {
        "client": test_client,
        "admin": admin_user,
        "template": template,
        "dispatch": dispatch
    }


def test_track_email_open_pixel(client, db_session, analytics_setup):
    """Valida se o pixel invisível 1x1 registra abertura e retorna PNG válido."""
    dispatch = analytics_setup["dispatch"]
    rec_email = "leitor@exemplo.com"
    rec_hash = base64.urlsafe_b64encode(rec_email.encode("utf-8")).decode("utf-8").rstrip("=")

    response = client.get(f"/api/email-marketing/track/open/{dispatch.id}/{rec_hash}")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    assert "no-cache" in response.headers["cache-control"]

    db_session.refresh(dispatch)
    assert dispatch.total_opened >= 1
    assert any(c.get("opened") for c in dispatch.contacts_list)


def test_track_email_click_redirect(client, db_session, analytics_setup):
    """Valida se o redirecionamento de clique computa métrica e redireciona 302."""
    dispatch = analytics_setup["dispatch"]
    rec_email = "leitor@exemplo.com"
    rec_hash = base64.urlsafe_b64encode(rec_email.encode("utf-8")).decode("utf-8").rstrip("=")
    target_url = "https://zapvoice.com.br/artigo"

    response = client.get(
        f"/api/email-marketing/track/click?d={dispatch.id}&r={rec_hash}&url={target_url}",
        follow_redirects=False
    )
    assert response.status_code == 302
    assert response.headers["location"] == target_url

    db_session.refresh(dispatch)
    assert dispatch.total_clicks >= 1
    assert target_url in (dispatch.analytics_data or {}).get("clicks_by_url", {})


def test_get_email_dispatch_analytics(client, db_session, analytics_setup):
    """Valida se o endpoint de analytics retorna KPIs formatados, taxas e links."""
    dispatch = analytics_setup["dispatch"]
    test_client = analytics_setup["client"]
    admin = analytics_setup["admin"]

    # Simular que houve 1 abertura e 1 clique registrado
    dispatch.total_opened = 1
    dispatch.total_clicks = 1
    dispatch.analytics_data = {"clicks_by_url": {"https://zapvoice.com.br/artigo": 1}}
    db_session.commit()
    db_session.refresh(dispatch)

    app.dependency_overrides[get_validated_client_id] = lambda: test_client.id
    app.dependency_overrides[get_current_user] = lambda: admin

    try:
        response = client.get(f"/api/email-marketing/dispatches/{dispatch.id}/analytics")
        assert response.status_code == 200
        data = response.json()

        assert data["dispatch_id"] == dispatch.id
        assert "kpis" in data
        assert data["kpis"]["total_contacts"] == 2
        assert data["kpis"]["total_sent"] == 2
        assert data["kpis"]["total_opened"] >= 1
        assert data["kpis"]["total_clicks"] >= 1
        assert data["kpis"]["open_rate"] > 0
        assert data["kpis"]["click_rate"] > 0

        assert "top_clicked_links" in data
        assert len(data["top_clicked_links"]) >= 1
        assert data["top_clicked_links"][0]["url"] == "https://zapvoice.com.br/artigo"
    finally:
        app.dependency_overrides.pop(get_validated_client_id, None)
        app.dependency_overrides.pop(get_current_user, None)


def test_seed_newsletter_welcome_funnel(client, db_session, analytics_setup):
    """Valida criação automática do template e funil de Boas-Vindas da Newsletter."""
    test_client = analytics_setup["client"]
    admin = analytics_setup["admin"]

    app.dependency_overrides[get_validated_client_id] = lambda: test_client.id
    app.dependency_overrides[get_current_user] = lambda: admin

    try:
        response = client.post("/api/email/funnels/seed-newsletter-welcome")
        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "success"
        assert data["funnel"]["trigger_tag"] == "newsletter"
        assert "Boas-Vindas" in data["funnel"]["name"]

        funnel = db_session.query(EmailFunnel).filter_by(id=data["funnel"]["id"]).first()
        assert funnel is not None
        assert funnel.trigger_type == "tag"
        assert funnel.trigger_config.get("tag") == "newsletter"
        assert len(funnel.steps) >= 1
    finally:
        app.dependency_overrides.pop(get_validated_client_id, None)
        app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_trigger_email_funnels_by_tag(db_session, analytics_setup):
    """Valida se a função de trigger automático matricula o lead quando ele recebe a tag 'newsletter'."""
    from services.email_funnel_service import trigger_email_funnels_by_tag
    test_client = analytics_setup["client"]

    # Cria funil com trigger_tag newsletter
    funnel = EmailFunnel(
        client_id=test_client.id,
        name="Boas-Vindas Auto",
        trigger_type="tag",
        trigger_config={"tag": "newsletter"},
        is_active=True,
        steps=[{"id": "s1", "type": "tag_action", "action": "add", "tag": "ativo"}]
    )
    db_session.add(funnel)
    db_session.commit()
    db_session.refresh(funnel)

    enrolled_ids = await trigger_email_funnels_by_tag(
        db=db_session,
        client_id=test_client.id,
        lead_id=None,
        contact_email="novoinscrito@newsletter.com",
        contact_name="Novo Assinante",
        new_tags=["newsletter", "lead_vip"]
    )
    assert len(enrolled_ids) >= 1

    execution = db_session.query(EmailFunnelExecution).filter_by(id=enrolled_ids[0]).first()
    assert execution is not None
    assert execution.contact_email == "novoinscrito@newsletter.com"

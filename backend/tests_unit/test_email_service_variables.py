import pytest
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from services.email_service import send_single_email


@pytest.mark.asyncio
async def test_send_single_email_replaces_invite_and_bussola_variables():
    config = SimpleNamespace(
        client_id=1,
        provider="brevo",
        from_name="AstroWake",
        from_email="contato@astrowake.com",
        brevo_api_key="xkeysib-test-key",
    )

    captured_payload = {}

    class DummyResponse:
        status_code = 201

        def json(self):
            return {"messageId": "msg-123"}

    class DummyAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url, headers=None, json=None):
            captured_payload["json"] = json
            return DummyResponse()

    body_html = (
        '<a href="{{link_cadastro}}">Área de Membros</a>'
        '<a href="{{invite_url}}">Convite</a>'
        '<a href="{{link_bussola}}">App Bússola</a>'
        '<p>Olá {{primeiro_nome}}</p>'
    )

    variables = {
        "name": "Arya Raj",
        "link_cadastro": "https://aulas-crassos-front.aryaraj.shop/register?token=abc123",
        "link_bussola": "https://bussola.aryaraj.shop/invite?token=xyz789",
    }

    with patch("services.email_service.decrypt_token", return_value="xkeysib-test-key"), \
         patch("services.email_service.httpx.AsyncClient", DummyAsyncClient):
        result = await send_single_email(
            config=config,
            to_email="aluno@teste.com",
            subject="Bem-vindo {{primeiro_nome}}!",
            body_html=body_html,
            recipient_name=variables,
        )

    assert result["success"] is True
    sent_html = captured_payload["json"]["htmlContent"]
    assert "https://aulas-crassos-front.aryaraj.shop/register?token=abc123" in sent_html
    assert "https://bussola.aryaraj.shop/invite?token=xyz789" in sent_html
    assert "{{link_cadastro}}" not in sent_html
    assert "{{invite_url}}" not in sent_html
    assert "{{link_bussola}}" not in sent_html
    assert captured_payload["json"]["subject"] == "Bem-vindo Arya!"


@pytest.mark.asyncio
async def test_send_single_email_auto_generates_invites_when_variables_present():
    config = SimpleNamespace(
        client_id=14,
        provider="brevo",
        from_name="AstroWake",
        from_email="contato@astrowake.com",
        brevo_api_key="xkeysib-test-key",
    )

    captured_payload = {}

    class DummyResponse:
        status_code = 201

        def json(self):
            return {"messageId": "msg-456"}

    class DummyAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url, headers=None, json=None):
            captured_payload["json"] = json
            return DummyResponse()

    body_html = (
        "<p>O seu acesso a comunidade do Crassus: {{link_cadastro}}</p>"
        "<p>E o seu acesso ao app do Bussola Astrologica: {{link_bussola}}</p>"
    )

    mock_platform = AsyncMock(return_value={
        "full_invite_url": "https://aulas-crassos-front.aryaraj.shop/register?token=auto_crassus_999"
    })
    mock_bussola = AsyncMock(return_value={
        "invite_url": "https://bussola.aryaraj.shop/register?token=auto_bussola_888"
    })

    with patch("services.email_service.decrypt_token", return_value="xkeysib-test-key"), \
         patch("services.email_service.httpx.AsyncClient", DummyAsyncClient), \
         patch("services.platform_invite_service.generate_platform_invite", mock_platform), \
         patch("services.bussola_invite_service.generate_bussola_invite", mock_bussola):
        result = await send_single_email(
            config=config,
            to_email="novoaluno@teste.com",
            subject="Seus acessos chegaram!",
            body_html=body_html,
            recipient_name="Novo Aluno",
        )

    assert result["success"] is True
    mock_platform.assert_awaited_once_with(
        client_id=14,
        role="aluno",
        duration_hours=0,
        course_access=None,
    )
    mock_bussola.assert_awaited_once_with(
        client_id=14,
        role="client",
        validity_type="never",
        custom_api_key=None,
    )
    sent_html = captured_payload["json"]["htmlContent"]
    assert "https://aulas-crassos-front.aryaraj.shop/register?token=auto_crassus_999" in sent_html
    assert "https://bussola.aryaraj.shop/register?token=auto_bussola_888" in sent_html


def test_config_loader_returns_bussola_settings_from_app_config(db_session):
    import models
    from config_loader import get_setting
    from core.encryption import encrypt_token

    db_session.add(models.AppConfig(client_id=99, key="BUSSOLA_API_URL", value="https://bussolaappback.aryaraj.shop"))
    db_session.add(models.AppConfig(client_id=99, key="BUSSOLA_API_KEY", value=encrypt_token("chave-secreta-99")))
    db_session.commit()

    with patch("config_loader.SessionLocal", return_value=db_session):
        # Evita fechar a sessão compartilhada do pytest fixture durante o teste
        with patch.object(db_session, "close", return_value=None):
            assert get_setting("BUSSOLA_API_URL", "", client_id=99) == "https://bussolaappback.aryaraj.shop"
            assert get_setting("BUSSOLA_API_KEY", "", client_id=99) == "chave-secreta-99"


@pytest.mark.asyncio
async def test_send_single_email_passes_template_invite_config_to_generators():
    from services.email_service import extract_template_invite_config

    template = SimpleNamespace(
        invite_role="aluno",
        invite_duration_hours=48,
        invite_course_access=[{"course_id": 7, "access_duration": "1_year"}],
        bussola_invite_role="admin",
        bussola_validity_type="72h",
        bussola_custom_api_key="custom-key-77",
    )
    invite_cfg = extract_template_invite_config(template)

    config = SimpleNamespace(
        client_id=14,
        provider="brevo",
        from_name="AstroWake",
        from_email="contato@astrowake.com",
        brevo_api_key="xkeysib-test-key",
    )

    class DummyResponse:
        status_code = 201
        def json(self):
            return {"messageId": "msg-789"}

    class DummyAsyncClient:
        def __init__(self, *args, **kwargs):
            pass
        async def __aenter__(self):
            return self
        async def __aexit__(self, exc_type, exc, tb):
            return False
        async def post(self, url, headers=None, json=None):
            return DummyResponse()

    mock_platform = AsyncMock(return_value={"full_invite_url": "https://aulas/r?token=1"})
    mock_bussola = AsyncMock(return_value={"invite_url": "https://bussola/c?token=2"})

    with patch("services.email_service.decrypt_token", return_value="xkeysib-test-key"), \
         patch("services.email_service.httpx.AsyncClient", DummyAsyncClient), \
         patch("services.platform_invite_service.generate_platform_invite", mock_platform), \
         patch("services.bussola_invite_service.generate_bussola_invite", mock_bussola):
        res = await send_single_email(
            config=config,
            to_email="aluno@teste.com",
            subject="Acesso liberado",
            body_html="{{link_cadastro}} | {{link_bussola}}",
            recipient_name="Aluno",
            invite_config=invite_cfg,
        )

    assert res["success"] is True
    mock_platform.assert_awaited_once_with(
        client_id=14,
        role="aluno",
        duration_hours=48,
        course_access=[{"course_id": 7, "access_duration": "1_year"}],
    )
    mock_bussola.assert_awaited_once_with(
        client_id=14,
        role="admin",
        validity_type="72h",
        custom_api_key="custom-key-77",
    )




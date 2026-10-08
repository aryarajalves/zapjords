import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from services.platform_invite_service import generate_platform_invite


@pytest.mark.asyncio
async def test_generate_platform_invite_missing_config():
    # Sem URL ou Token configurados
    res = await generate_platform_invite(
        client_id=1,
        role="aluno",
        duration_hours=0,
        course_access=[],
        api_url="",
        api_token=""
    )
    assert res is None


@pytest.mark.asyncio
async def test_generate_platform_invite_success():
    mock_response_data = {
        "id": 42,
        "token": "token_abc_123",
        "role": "aluno",
        "invite_url": "/register?token=token_abc_123",
        "course_access": [{"course_id": 1, "access_duration": "lifetime"}]
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 201
    mock_resp.is_success = True
    mock_resp.json.return_value = mock_response_data

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        result = await generate_platform_invite(
            client_id=1,
            role="aluno",
            duration_hours=24,
            course_access=[{"course_id": 1, "access_duration": "lifetime"}],
            api_url="https://minha-plataforma.com",
            api_token="sk_live_teste_123"
        )

        assert result is not None
        assert result["invite_url"] == "https://minha-plataforma.com/register?token=token_abc_123"
        assert result["full_invite_url"] == "https://minha-plataforma.com/register?token=token_abc_123"
        assert result["token"] == "token_abc_123"
        assert result["id"] == 42

        # Verifica argumentos passados ao httpx.post
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        assert args[0] == "https://minha-plataforma.com/api/v1/invites"
        assert kwargs["headers"]["Authorization"] == "Bearer sk_live_teste_123"
        assert kwargs["headers"]["X-API-Key"] == "sk_live_teste_123"
        assert kwargs["json"]["role"] == "aluno"
        assert kwargs["json"]["duration_hours"] == 24
        assert kwargs["json"]["course_access"] == [{"course_id": 1, "access_duration": "lifetime"}]


@pytest.mark.asyncio
async def test_generate_platform_invite_http_error():
    mock_resp = MagicMock()
    mock_resp.status_code = 401
    mock_resp.is_success = False
    mock_resp.text = "Unauthorized"

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        result = await generate_platform_invite(
            client_id=1,
            role="aluno",
            duration_hours=0,
            course_access=[],
            api_url="https://minha-plataforma.com",
            api_token="sk_live_invalido"
        )

        # Não deve estourar exceção, apenas retornar None para não quebrar o webhook
        assert result is None


@pytest.mark.asyncio
async def test_generate_platform_invite_exception():
    with patch("httpx.AsyncClient.post", side_effect=Exception("Connection timed out")):
        result = await generate_platform_invite(
            client_id=1,
            role="aluno",
            duration_hours=0,
            course_access=[],
            api_url="https://minha-plataforma.com",
            api_token="sk_live_teste"
        )
        assert result is None


def test_resolve_docker_host_url():
    from services.platform_invite_service import resolve_docker_host_url
    assert resolve_docker_host_url("http://127.0.0.1:8010") == "http://host.docker.internal:8010"
    assert resolve_docker_host_url("http://localhost:8010/") == "http://host.docker.internal:8010"
    assert resolve_docker_host_url("https://meudominio.com") == "https://meudominio.com"


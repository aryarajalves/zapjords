import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from services.bussola_invite_service import (
    generate_bussola_invite,
    test_bussola_connection as execute_test_bussola_connection,
    resolve_docker_host_url
)


def test_resolve_docker_host_url():
    assert resolve_docker_host_url("http://localhost:8005") == "http://host.docker.internal:8005"
    assert resolve_docker_host_url("http://127.0.0.1:8005") == "http://host.docker.internal:8005"
    assert resolve_docker_host_url("https://api.bussolaastrologica.com.br") == "https://api.bussolaastrologica.com.br"


@pytest.mark.asyncio
async def test_generate_bussola_invite_missing_key():
    with patch("services.bussola_invite_service.get_setting", return_value=""), \
         patch.dict("os.environ", {"BUSSOLA_API_KEY": ""}, clear=False):
        res = await generate_bussola_invite(
            client_id=1,
            role="client",
            validity_type="never"
        )
        assert res is None


@pytest.mark.asyncio
async def test_generate_bussola_invite_success():
    mock_response_data = {
        "id": "e8a9f24b-32c1-4b10-8b9a-112233445566",
        "token": "4vK9L_8xYzQ1mNoP2rStUvWxYz0123456789abcde",
        "role": "client",
        "role_label": "Aluno",
        "validity_type": "never",
        "expires_at": None,
        "invite_path": "/cadastro?token=4vK9L_8xYzQ1mNoP2rStUvWxYz0123456789abcde",
        "invite_url": "https://bussolaastrologica.com.br/cadastro?token=4vK9L_8xYzQ1mNoP2rStUvWxYz0123456789abcde"
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_response_data

    with patch("services.bussola_invite_service.get_setting") as mock_get_setting, \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        
        mock_get_setting.side_effect = lambda key, default=None, client_id=None: {
            "BUSSOLA_API_URL": "http://localhost:8005",
            "BUSSOLA_API_KEY": "bussola_ext_sec_teste"
        }.get(key, default)
        mock_post.return_value = mock_resp

        result = await generate_bussola_invite(
            client_id=1,
            role="client",
            validity_type="never"
        )

        assert result is not None
        assert result["invite_url"] == "https://bussolaastrologica.com.br/cadastro?token=4vK9L_8xYzQ1mNoP2rStUvWxYz0123456789abcde"
        assert result["token"] == "4vK9L_8xYzQ1mNoP2rStUvWxYz0123456789abcde"
        assert result["role"] == "client"

        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        assert args[0] == "http://host.docker.internal:8005/admin/invites"
        assert kwargs["headers"]["X-API-Key"] == "bussola_ext_sec_teste"
        assert kwargs["json"]["role"] == "client"
        assert kwargs["json"]["validity_type"] == "never"


@pytest.mark.asyncio
async def test_generate_bussola_invite_custom_key_override():
    mock_resp = MagicMock()
    mock_resp.status_code = 201
    mock_resp.json.return_value = {"invite_url": "https://custom.com/invite"}

    with patch("services.bussola_invite_service.get_setting") as mock_get_setting, \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        
        mock_get_setting.return_value = "https://api.bussolaastrologica.com.br"
        mock_post.return_value = mock_resp

        result = await generate_bussola_invite(
            client_id=1,
            role="admin",
            validity_type="48h",
            custom_api_key="bussola_custom_key_xyz"
        )

        assert result is not None
        assert result["invite_url"] == "https://custom.com/invite"

        args, kwargs = mock_post.call_args
        assert kwargs["headers"]["X-API-Key"] == "bussola_custom_key_xyz"
        assert kwargs["json"]["role"] == "admin"
        assert kwargs["json"]["validity_type"] == "48h"


@pytest.mark.asyncio
async def test_generate_bussola_invite_http_error():
    mock_resp = MagicMock()
    mock_resp.status_code = 403
    mock_resp.text = "Invalid API Key"

    with patch("services.bussola_invite_service.get_setting", return_value="chave_invalida"), \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        
        mock_post.return_value = mock_resp

        result = await generate_bussola_invite(
            client_id=1,
            role="client"
        )
        assert result is None


@pytest.mark.asyncio
async def test_bussola_test_connection_success():
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "invite_url": "https://bussolaastrologica.com.br/cadastro?token=test_token",
        "token": "test_token"
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        result = await execute_test_bussola_connection("http://localhost:8005", "bussola_ext_sec_123")
        assert result["success"] is True
        assert "estabelecida com sucesso" in result["message"]
        assert result["invite_url"] == "https://bussolaastrologica.com.br/cadastro?token=test_token"


@pytest.mark.asyncio
async def test_bussola_test_connection_failure():
    mock_resp = MagicMock()
    mock_resp.status_code = 401
    mock_resp.text = "Chave externa inválida"

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        result = await execute_test_bussola_connection("http://localhost:8005", "chave_errada")
        assert result["success"] is False
        assert "401" in result["error"]

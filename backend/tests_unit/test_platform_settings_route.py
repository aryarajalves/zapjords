import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import HTTPException
from routers.settings import check_platform_connection, get_platform_courses, PlatformTestConnectionRequest


@pytest.mark.asyncio
async def test_platform_connection_empty_url_or_token():
    req = PlatformTestConnectionRequest(api_url="", api_token="")
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None
    with pytest.raises(HTTPException) as exc_info:
        await check_platform_connection(req=req, x_client_id=1, current_user=MagicMock(), db=mock_db)
    assert exc_info.value.status_code == 400
    assert "obrigatórios" in exc_info.value.detail


@pytest.mark.asyncio
async def test_platform_connection_success():
    req = PlatformTestConnectionRequest(api_url="https://plataforma.com", api_token="sk_live_123")
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = [{"id": 1, "title": "Curso 1"}, {"id": 2, "title": "Curso 2"}]
    mock_resp.text = "OK"

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        res = await check_platform_connection(req=req, x_client_id=1, current_user=MagicMock(), db=MagicMock())
        assert res["success"] is True
        assert len(res["courses"]) == 2
        assert res["courses"][0]["title"] == "Curso 1"


@pytest.mark.asyncio
async def test_platform_connection_masked_token_resolution():
    req = PlatformTestConnectionRequest(api_url="https://plataforma.com", api_token="sk_l********************1234")
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = [{"id": 1, "title": "Curso 1"}]
    mock_resp.text = "OK"

    mock_db = MagicMock()
    mock_token_cfg = MagicMock()
    mock_token_cfg.value = "encrypted_sk_live_real_token"
    mock_db.query.return_value.filter.return_value.first.return_value = mock_token_cfg

    with patch("routers.settings.decrypt_token", return_value="sk_live_real_token"):
        with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_resp
            res = await check_platform_connection(req=req, x_client_id=1, current_user=MagicMock(), db=mock_db)
            assert res["success"] is True
            # Verifica se foi enviado com o token decriptado real e não os asteriscos
            headers_sent = mock_get.call_args[1]["headers"]
            assert headers_sent["Authorization"] == "Bearer sk_live_real_token"


@pytest.mark.asyncio
async def test_platform_connection_http_error():
    req = PlatformTestConnectionRequest(api_url="https://plataforma.com", api_token="sk_live_invalido")
    mock_resp = MagicMock()
    mock_resp.status_code = 401
    mock_resp.json.return_value = {}
    mock_resp.text = "Unauthorized"

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        res = await check_platform_connection(req=req, x_client_id=1, current_user=MagicMock(), db=MagicMock())
        assert res["success"] is False
        assert res["status"] == 401
        assert "não autorizado" in res["error"].lower()


@pytest.mark.asyncio
async def test_platform_connection_network_exception():
    req = PlatformTestConnectionRequest(api_url="https://url-invalida-teste.com", api_token="sk_live_123")

    with patch("httpx.AsyncClient.get", side_effect=Exception("DNS resolution failed")):
        res = await check_platform_connection(req=req, x_client_id=1, current_user=MagicMock(), db=MagicMock())
        assert res["success"] is False
        assert res["status"] == 500
        assert "DNS resolution failed" in res["error"]


@pytest.mark.asyncio
async def test_get_platform_courses_with_db():
    mock_db = MagicMock()
    mock_url_cfg = MagicMock()
    mock_url_cfg.value = "https://plataforma.com"
    mock_token_cfg = MagicMock()
    mock_token_cfg.value = "enc_token"

    def filter_side_effect(*args, **kwargs):
        mock_filter = MagicMock()
        # Se consultar PLATFORM_API_URL ou PLATFORM_API_TOKEN
        mock_filter.first.return_value = mock_url_cfg
        return mock_filter

    mock_db.query.return_value.filter.return_value.first.side_effect = [mock_url_cfg, mock_token_cfg]

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = [{"id": 10, "title": "Curso Teste"}]

    with patch("routers.settings.decrypt_token", return_value="sk_live_dec"):
        with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_resp
            res = await get_platform_courses(x_client_id=1, current_user=MagicMock(), db=mock_db)
            assert res["success"] is True
            assert len(res["courses"]) == 1
            assert res["courses"][0]["title"] == "Curso Teste"


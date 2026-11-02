import pytest
from fastapi.testclient import TestClient
from main import app, ENABLE_DOCS

client = TestClient(app)

def test_owasp_security_headers_present():
    """Valida se todos os cabeçalhos de segurança OWASP requeridos pela auditoria estão presentes."""
    response = client.get("/health")
    assert response.status_code == 200

    # 1. HSTS (Strict-Transport-Security)
    assert "strict-transport-security" in response.headers
    assert "max-age=31536000" in response.headers["strict-transport-security"]

    # 2. Permissions-Policy
    assert "permissions-policy" in response.headers
    assert "microphone=(self)" in response.headers["permissions-policy"]
    assert "camera=()" in response.headers["permissions-policy"]

    # 3. Content-Security-Policy (CSP)
    assert "content-security-policy" in response.headers
    assert "default-src 'self'" in response.headers["content-security-policy"]
    assert "frame-ancestors 'none'" in response.headers["content-security-policy"]

    # 4. Headers clássicos de proteção
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"
    assert response.headers.get("x-xss-protection") == "1; mode=block"

def test_docs_hidden_by_default_when_disabled():
    """Valida se a documentação da API Swagger / ReDoc / OpenAPI respeita a flag de proteção."""
    if not ENABLE_DOCS:
        # Quando docs estão desabilitados, endpoints devem retornar 404
        r_docs = client.get("/docs")
        assert r_docs.status_code == 404

        r_redoc = client.get("/redoc")
        assert r_redoc.status_code == 404

        r_openapi = client.get("/openapi.json")
        assert r_openapi.status_code == 404
    else:
        # Se habilitado explicitamente em dev local
        r_docs = client.get("/docs")
        assert r_docs.status_code == 200

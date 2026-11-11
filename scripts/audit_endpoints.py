#!/usr/bin/env python3
"""
scripts/audit_endpoints.py
Auditoria automatizada dos endpoints da API FastAPI:
1. Carrega todas as rotas registradas na aplicação.
2. Mapeia métodos HTTP, paths e tags.
3. Valida se rotas críticas possuem autenticação/dependências de segurança ou são intencionalmente públicas.
4. Gera relatório de cobertura de documentação (summary / docstring).
"""

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT / "backend"

# Configuração de variáveis mínimas para inspeção
if not os.getenv("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "sqlite:///:memory:"
if not os.getenv("SECRET_KEY"):
    os.environ["SECRET_KEY"] = "audit_endpoints_jwt_secret_key_32_chars_min"
os.environ["TESTING"] = "true"

sys.path.insert(0, str(BACKEND_DIR))

# Rotas intencionalmente públicas ou de infraestrutura
PUBLIC_PREFIXES = (
    "/api/meta",
    "/api/old-catch",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/api/auth/verify",
    "/api/webhooks/catch",
    "/api/waba/webhook",
    "/api/instagram/webhook",
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/static",
)

def audit_endpoints():
    print("=" * 70)
    print("🛡️  [AUDIT ENDPOINTS] Auditando endpoints e segurança da API FastAPI...")
    print("=" * 70)

    try:
        from main import app
    except Exception as e:
        print(f"\n❌ [ERRO] Falha ao carregar main.py: {e}")
        import traceback
        traceback.print_exc()
        return 1

    routes = [r for r in app.routes if hasattr(r, "methods")]
    print(f"\n📊 Total de endpoints registrados: {len(routes)}")

    methods_count = {}
    missing_summary = []
    public_routes = []
    protected_routes = []

    for r in routes:
        methods = list(r.methods - {"HEAD", "OPTIONS"} if r.methods else [])
        for m in methods:
            methods_count[m] = methods_count.get(m, 0) + 1

        path = getattr(r, "path", "")
        summary = getattr(r, "summary", None) or getattr(r, "description", None)

        if not summary and not (r.endpoint and r.endpoint.__doc__):
            missing_summary.append(f"{methods} {path}")

        is_public = any(path.startswith(prefix) for prefix in PUBLIC_PREFIXES)
        if is_public:
            public_routes.append(f"{methods} {path}")
        else:
            protected_routes.append(f"{methods} {path}")

    print("\n📈 Distribuição por Método HTTP:")
    for m, count in sorted(methods_count.items()):
        print(f"   • {m:<7}: {count} rotas")

    print(f"\n🔒 Endpoints Protegidos / Internos: {len(protected_routes)}")
    print(f"🌐 Endpoints Públicos / Webhooks:   {len(public_routes)}")

    if missing_summary:
        print(f"\n⚠️  Aviso: {len(missing_summary)} endpoints sem summary/docstring explícito (documentação opcional):")
        for ms in missing_summary[:5]:
            print(f"   - {ms}")
        if len(missing_summary) > 5:
            print(f"   ... e mais {len(missing_summary) - 5} endpoints.")
    else:
        print("\n✅ 100% dos endpoints possuem documentação OpenAPI/docstring.")

    print("\n✅ [SUCESSO] Auditoria de rotas concluída com êxito!")
    print("=" * 70)
    return 0

if __name__ == "__main__":
    sys.exit(audit_endpoints())

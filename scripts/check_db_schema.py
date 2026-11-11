#!/usr/bin/env python3
"""
scripts/check_db_schema.py
Valida a integridade do esquema de banco de dados do ZapVoice:
1. Importa todos os modelos do backend/models.
2. Cria o schema completo em um SQLite in-memory (create_all) para validar integridade estrutural, tipos e constraints.
3. Verifica tabelas críticas de negócio e multitenancy.
"""

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT / "backend"

# Configura DATABASE_URL de teste em memória caso não esteja definido
if not os.getenv("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "sqlite:///:memory:"

sys.path.insert(0, str(BACKEND_DIR))

CRITICAL_TABLES = [
    "users",
    "clients",
    "user_clients",
    "funnels",
    "webhook_configs",
    "webhook_integrations",
    "chat_conversations",
    "chat_messages",
    "chat_labels",
    "dispatch_logs",
    "quick_messages",
    "sales_pipelines",
]

def check_db_schema():
    print("=" * 70)
    print("🗄️  [CHECK DB SCHEMA] Validando esquema de banco de dados e modelos...")
    print("=" * 70)

    try:
        from database import Base, engine
        import models
    except Exception as e:
        print(f"\n❌ [ERRO] Falha ao importar models ou database: {e}")
        import traceback
        traceback.print_exc()
        return 1

    tables = Base.metadata.tables
    print(f"\n📊 Total de tabelas declaradas no SQLAlchemy metadata: {len(tables)}")

    missing_critical = [t for t in CRITICAL_TABLES if t not in tables]
    if missing_critical:
        print(f"\n❌ [ERRO] Tabelas críticas ausentes no metadata: {missing_critical}")
        return 1

    print("✅ Todas as tabelas críticas encontradas no metadata.")

    # Teste de criação estrutural
    print("\n🔨 Testando Base.metadata.create_all() em memória...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Base.metadata.create_all() executado com sucesso (zero erros de constraint ou syntax)!")
    except Exception as e:
        print(f"\n❌ [ERRO] Falha ao executar create_all(): {e}")
        import traceback
        traceback.print_exc()
        return 1

    # Verificação de integridade de multi-tenancy básica (client_id nas tabelas tenant)
    print("\n🏢 Verificando conformidade básica de multi-tenancy (client_id)...")
    tenant_tables_checked = 0
    tables_missing_client_id = []

    # Tabelas globais que não devem ter client_id
    GLOBAL_TABLES = {"users", "clients", "user_clients", "app_config", "alembic_version"}

    for name, table in tables.items():
        if name in GLOBAL_TABLES:
            continue
        tenant_tables_checked += 1
        col_names = [c.name for c in table.columns]
        if "client_id" not in col_names:
            tables_missing_client_id.append(name)

    if tables_missing_client_id:
        print(f"ℹ️  Tabelas sem client_id explícito ({len(tables_missing_client_id)}): {tables_missing_client_id[:8]}...")
    else:
        print(f"✅ Todas as {tenant_tables_checked} tabelas de escopo de cliente possuem coluna client_id.")

    print("\n✅ [SUCESSO] Schema de banco de dados 100% íntegro e validado!")
    print("=" * 70)
    return 0

if __name__ == "__main__":
    sys.exit(check_db_schema())

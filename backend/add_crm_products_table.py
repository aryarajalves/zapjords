import sys
from sqlalchemy import text
from database import engine

def migrate():
    print("Iniciando migração: criando tabela crm_products e novas colunas em sales_deals...")
    is_postgres = engine.dialect.name == "postgresql"

    with engine.connect() as conn:
        try:
            # 1. Criação da tabela crm_products
            if is_postgres:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS crm_products (
                        id SERIAL PRIMARY KEY,
                        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                        name VARCHAR(150) NOT NULL,
                        description TEXT,
                        price DOUBLE PRECISION DEFAULT 0.0,
                        is_active BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """))
                conn.commit()
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS ix_crm_products_client_id ON crm_products(client_id);
                """))
                conn.commit()
            else:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS crm_products (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                        name VARCHAR(150) NOT NULL,
                        description TEXT,
                        price FLOAT DEFAULT 0.0,
                        is_active BOOLEAN DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                """))
                conn.commit()
            print("✅ Tabela crm_products criada/verificada com sucesso.")

            # 2. Adicionar colunas em sales_deals se não existirem
            # Verificar colunas existentes
            existing_cols = []
            if is_postgres:
                res = conn.execute(text("""
                    SELECT column_name FROM information_schema.columns 
                    WHERE table_name = 'sales_deals';
                """)).fetchall()
                existing_cols = [r[0] for r in res]
            else:
                res = conn.execute(text("PRAGMA table_info(sales_deals);")).fetchall()
                existing_cols = [r[1] for r in res]

            cols_to_add = [
                ("product_id", "INTEGER REFERENCES crm_products(id) ON DELETE SET NULL" if is_postgres else "INTEGER"),
                ("product_name", "VARCHAR(200)"),
                ("original_value", "DOUBLE PRECISION DEFAULT 0.0" if is_postgres else "FLOAT DEFAULT 0.0")
            ]

            for col_name, col_type in cols_to_add:
                if col_name not in existing_cols:
                    conn.execute(text(f"ALTER TABLE sales_deals ADD COLUMN {col_name} {col_type};"))
                    conn.commit()
                    print(f"✅ Coluna {col_name} adicionada em sales_deals.")
                else:
                    print(f"ℹ️ Coluna {col_name} já existe na tabela sales_deals.")

            if is_postgres:
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_sales_deals_product_id ON sales_deals(product_id);"))
                conn.commit()

            print("✅ Migração de CRM Products e Sales Deals concluída com sucesso total!")
        except Exception as e:
            print(f"❌ Erro na migração: {e}")
            raise e

if __name__ == "__main__":
    migrate()

import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import text
from database import engine
from core.logger import setup_logger

logger = setup_logger("migration_add_deal_won_at_and_activities")

def migrate():
    """
    Adiciona a coluna won_at na tabela sales_deals e cria a tabela sales_deal_activities.
    """
    logger.info("🚀 Iniciando migração: adicionando won_at em sales_deals e criando sales_deal_activities...")
    is_sqlite = "sqlite" in str(engine.url)

    with engine.begin() as conn:
        if is_sqlite:
            # SQLite check existing columns
            res = conn.execute(text("PRAGMA table_info(sales_deals)")).fetchall()
            existing_cols = [r[1] for r in res]
            if "won_at" not in existing_cols:
                conn.execute(text("ALTER TABLE sales_deals ADD COLUMN won_at DATETIME NULL"))

            # Criar tabela no SQLite
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS sales_deal_activities (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    deal_id INTEGER NOT NULL REFERENCES sales_deals(id) ON DELETE CASCADE,
                    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                    activity_type VARCHAR(50) NOT NULL,
                    title VARCHAR(200) NOT NULL,
                    description TEXT,
                    metadata_info TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """))
        else:
            # PostgreSQL
            conn.execute(text("""
                ALTER TABLE sales_deals 
                ADD COLUMN IF NOT EXISTS won_at TIMESTAMP WITH TIME ZONE NULL;
            """))

            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS sales_deal_activities (
                    id SERIAL PRIMARY KEY,
                    deal_id INTEGER NOT NULL REFERENCES sales_deals(id) ON DELETE CASCADE,
                    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                    activity_type VARCHAR(50) NOT NULL,
                    title VARCHAR(200) NOT NULL,
                    description TEXT,
                    metadata_info TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """))

            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_deal_activities_deal_id ON sales_deal_activities(deal_id);
                CREATE INDEX IF NOT EXISTS idx_deal_activities_client_id ON sales_deal_activities(client_id);
                CREATE INDEX IF NOT EXISTS idx_deal_activities_created_at ON sales_deal_activities(created_at DESC);
            """))

    logger.info("✅ Migração concluída com sucesso: won_at e sales_deal_activities criados!")

if __name__ == "__main__":
    migrate()

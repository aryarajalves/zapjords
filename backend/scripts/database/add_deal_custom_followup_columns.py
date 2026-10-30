import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import text
from database import engine
from core.logger import setup_logger

logger = setup_logger("migration_add_deal_custom_followup")

def migrate():
    """
    Adiciona colunas custom_followup_delay_value e custom_followup_delay_unit na tabela sales_deals.
    """
    logger.info("🚀 Iniciando migração: adicionando colunas de follow-up individual em sales_deals...")
    is_sqlite = "sqlite" in str(engine.url)

    with engine.begin() as conn:
        if is_sqlite:
            # SQLite check existing columns
            res = conn.execute(text("PRAGMA table_info(sales_deals)")).fetchall()
            existing_cols = [r[1] for r in res]
            if "custom_followup_delay_value" not in existing_cols:
                conn.execute(text("ALTER TABLE sales_deals ADD COLUMN custom_followup_delay_value INTEGER NULL"))
            if "custom_followup_delay_unit" not in existing_cols:
                conn.execute(text("ALTER TABLE sales_deals ADD COLUMN custom_followup_delay_unit VARCHAR(20) DEFAULT 'hours'"))
        else:
            # PostgreSQL
            conn.execute(text("""
                ALTER TABLE sales_deals 
                ADD COLUMN IF NOT EXISTS custom_followup_delay_value INTEGER NULL,
                ADD COLUMN IF NOT EXISTS custom_followup_delay_unit VARCHAR(20) DEFAULT 'hours';
            """))

    logger.info("✅ Migração concluída com sucesso: colunas de follow-up individual adicionadas em sales_deals.")

if __name__ == "__main__":
    migrate()

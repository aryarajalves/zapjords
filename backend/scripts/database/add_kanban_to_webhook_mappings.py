import os
import sys

# Adicionar diretório raiz ao path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import text
from database import engine
from core.logger import setup_logger

logger = setup_logger("migration_add_kanban_to_webhook_mappings")

def migrate():
    """
    Adiciona as colunas do Kanban de Vendas na tabela webhook_event_mappings.
    """
    logger.info("🚀 Iniciando migração: adicionando colunas kanban em webhook_event_mappings...")
    with engine.begin() as conn:
        conn.execute(text("""
            ALTER TABLE webhook_event_mappings 
            ADD COLUMN IF NOT EXISTS kanban_active BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS kanban_pipeline_id INTEGER NULL,
            ADD COLUMN IF NOT EXISTS kanban_stage_id INTEGER NULL,
            ADD COLUMN IF NOT EXISTS kanban_product_name VARCHAR(255) NULL,
            ADD COLUMN IF NOT EXISTS kanban_value FLOAT DEFAULT 0.0,
            ADD COLUMN IF NOT EXISTS kanban_lost_reason TEXT NULL;
        """))
        logger.info("✅ Colunas kanban adicionadas com sucesso em webhook_event_mappings!")

if __name__ == "__main__":
    migrate()

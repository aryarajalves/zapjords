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

logger = setup_logger("migration_sales_kanban")

def migrate():
    """
    Cria as tabelas do Kanban de Vendas / CRM (sales_pipelines, sales_pipeline_stages, sales_deals).
    """
    logger.info("🚀 Iniciando migração: criação das tabelas do Kanban de Vendas...")
    with engine.begin() as conn:
        # 1. Tabela sales_pipelines
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS sales_pipelines (
                id SERIAL PRIMARY KEY,
                client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                name VARCHAR(150) NOT NULL,
                product_name VARCHAR(200) NULL,
                associated_tags TEXT NULL,
                order_index INTEGER DEFAULT 0,
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_sales_pipelines_client_id 
            ON sales_pipelines (client_id);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_sales_pipelines_product_name 
            ON sales_pipelines (product_name);
        """))

        # 2. Tabela sales_pipeline_stages
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS sales_pipeline_stages (
                id SERIAL PRIMARY KEY,
                pipeline_id INTEGER NOT NULL REFERENCES sales_pipelines(id) ON DELETE CASCADE,
                client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL,
                order_index INTEGER DEFAULT 0,
                color VARCHAR(50) DEFAULT 'blue',
                stage_type VARCHAR(50) DEFAULT 'in_progress',
                webhook_event_trigger VARCHAR(100) NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_sales_pipeline_stages_pipeline_id 
            ON sales_pipeline_stages (pipeline_id);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_sales_pipeline_stages_client_id 
            ON sales_pipeline_stages (client_id);
        """))

        # 3. Tabela sales_deals
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS sales_deals (
                id SERIAL PRIMARY KEY,
                client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                pipeline_id INTEGER NOT NULL REFERENCES sales_pipelines(id) ON DELETE CASCADE,
                stage_id INTEGER NOT NULL REFERENCES sales_pipeline_stages(id) ON DELETE CASCADE,
                lead_id INTEGER NULL REFERENCES webhook_leads(id) ON DELETE SET NULL,
                contact_phone VARCHAR(50) NOT NULL,
                contact_name VARCHAR(200) NULL,
                contact_email VARCHAR(200) NULL,
                title VARCHAR(200) NULL,
                value FLOAT DEFAULT 0.0,
                status VARCHAR(50) DEFAULT 'open',
                lost_reason VARCHAR(255) NULL,
                notes TEXT NULL,
                last_interaction_at TIMESTAMP WITH TIME ZONE NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_sales_deals_client_id 
            ON sales_deals (client_id);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_sales_deals_pipeline_id 
            ON sales_deals (pipeline_id);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_sales_deals_stage_id 
            ON sales_deals (stage_id);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_sales_deals_contact_phone 
            ON sales_deals (contact_phone);
        """))

    logger.info("✅ Migração concluída com sucesso: tabelas sales_pipelines, sales_pipeline_stages e sales_deals criadas.")

if __name__ == "__main__":
    migrate()

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

logger = setup_logger("migration_add_channel_to_sales_deals")

def migrate():
    """
    Adiciona a coluna channel na tabela sales_deals e sincroniza canais existentes dos leads.
    """
    logger.info("🚀 Iniciando migração: adicionando coluna channel em sales_deals...")
    with engine.begin() as conn:
        # 1. Adicionar coluna channel se não existir
        conn.execute(text("""
            ALTER TABLE sales_deals 
            ADD COLUMN IF NOT EXISTS channel VARCHAR(100) NULL;
        """))
        
        # 2. Criar índice para buscas por canal se necessário
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_sales_deals_channel 
            ON sales_deals (channel);
        """))

        # 3. Retroalimentar canal a partir de webhook_leads para deals que possuem lead_id
        conn.execute(text("""
            UPDATE sales_deals 
            SET channel = webhook_leads.platform 
            FROM webhook_leads 
            WHERE sales_deals.lead_id = webhook_leads.id 
              AND sales_deals.channel IS NULL 
              AND webhook_leads.platform IS NOT NULL;
        """))

        # 4. Para deals sem lead_id ou com channel ainda nulo, definir 'whatsapp' se houver telefone
        conn.execute(text("""
            UPDATE sales_deals 
            SET channel = 'whatsapp' 
            WHERE channel IS NULL AND contact_phone IS NOT NULL;
        """))

    logger.info("✅ Migração concluída com sucesso: coluna channel adicionada e populada em sales_deals.")

if __name__ == "__main__":
    migrate()

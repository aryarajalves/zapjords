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

logger = setup_logger("migration_add_phone_to_users")

def migrate():
    """
    Adiciona a coluna phone (WhatsApp/Telefone) na tabela users.
    """
    logger.info("🚀 Iniciando migração: adicionando coluna phone em users...")
    with engine.begin() as conn:
        conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS phone VARCHAR(50) NULL;
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_users_phone 
            ON users (phone);
        """))

    logger.info("✅ Migração concluída com sucesso: coluna phone adicionada na tabela users.")

if __name__ == "__main__":
    migrate()

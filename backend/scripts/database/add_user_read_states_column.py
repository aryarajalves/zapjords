import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from database import SessionLocal
from sqlalchemy import text


def migrate():
    print("🚀 [MIGRATION] Adicionando coluna 'user_read_states' à tabela 'chat_conversations'...")
    db = SessionLocal()
    try:
        db.execute(text("ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS user_read_states JSONB DEFAULT '{}'::jsonb;"))
        db.commit()
        print("✅ Coluna 'user_read_states' verificada/adicionada com sucesso (PostgreSQL).")
    except Exception:
        db.rollback()
        try:
            db.execute(text("ALTER TABLE chat_conversations ADD COLUMN user_read_states JSON DEFAULT '{}';"))
            db.commit()
            print("✅ Coluna 'user_read_states' verificada/adicionada com sucesso (SQLite).")
        except Exception as e:
            db.rollback()
            print(f"ℹ️ Aviso ao adicionar coluna 'user_read_states': {e}")
    finally:
        db.close()
    print("✅ [MIGRATION] Sincronização concluída.")


if __name__ == "__main__":
    migrate()

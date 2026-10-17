"""
Migration: add bussola_auto_create_invite columns to webhook_event_mappings
Run once: python backend/scripts/database/add_bussola_invite_columns.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from database import SessionLocal
from sqlalchemy import text

def run():
    db = SessionLocal()
    try:
        dialect = db.bind.dialect.name
        if dialect == 'postgresql':
            db.execute(text("""
                ALTER TABLE webhook_event_mappings
                ADD COLUMN IF NOT EXISTS bussola_auto_create_invite BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS bussola_invite_role VARCHAR DEFAULT 'client',
                ADD COLUMN IF NOT EXISTS bussola_validity_type VARCHAR DEFAULT 'never',
                ADD COLUMN IF NOT EXISTS bussola_custom_api_key VARCHAR DEFAULT NULL;
            """))
        else:
            # SQLite
            cols = [
                ("bussola_auto_create_invite", "BOOLEAN DEFAULT 0"),
                ("bussola_invite_role", "VARCHAR DEFAULT 'client'"),
                ("bussola_validity_type", "VARCHAR DEFAULT 'never'"),
                ("bussola_custom_api_key", "VARCHAR DEFAULT NULL"),
            ]
            for col_name, col_type in cols:
                try:
                    db.execute(text(f"ALTER TABLE webhook_event_mappings ADD COLUMN {col_name} {col_type};"))
                except Exception as col_err:
                    print(f"Nota para SQLite ao adicionar {col_name}: {col_err}")

        db.commit()
        print("✅ Colunas de bussola_auto_create_invite adicionadas com sucesso na tabela webhook_event_mappings.")
    except Exception as e:
        print(f"⚠️  Erro na migração: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run()

"""
Migration: Adiciona coluna contact_labels nas tabelas scheduled_triggers e recurring_triggers
Executar: python backend/scripts/database/add_contact_labels_columns.py
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from database import SessionLocal
from sqlalchemy import text


def run():
    db = SessionLocal()
    try:
        dialect = db.bind.dialect.name
        if dialect == 'postgresql':
            db.execute(text("""
                ALTER TABLE scheduled_triggers
                ADD COLUMN IF NOT EXISTS contact_labels JSONB DEFAULT '[]'::jsonb;
            """))
            db.execute(text("""
                ALTER TABLE recurring_triggers
                ADD COLUMN IF NOT EXISTS contact_labels JSONB DEFAULT '[]'::jsonb;
            """))
        else:
            # SQLite fallback
            for col, tbl in [("contact_labels", "scheduled_triggers"), ("contact_labels", "recurring_triggers")]:
                try:
                    db.execute(text(f"""
                        ALTER TABLE {tbl}
                        ADD COLUMN {col} JSON DEFAULT '[]';
                    """))
                except Exception:
                    pass
        db.commit()
        print("[OK] Coluna contact_labels adicionada a scheduled_triggers e recurring_triggers com sucesso.")
    except Exception as e:
        print(f"[ERRO] {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    run()

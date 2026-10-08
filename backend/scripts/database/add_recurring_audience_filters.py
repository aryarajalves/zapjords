"""
Migration: add interaction_filter_days and created_filter_days columns to recurring_triggers
Run once: python backend/scripts/database/add_recurring_audience_filters.py
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
                ALTER TABLE recurring_triggers
                ADD COLUMN IF NOT EXISTS interaction_filter_days INTEGER DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS created_filter_days INTEGER DEFAULT NULL;
            """))
        else:
            # SQLite
            # SQLite does not support adding multiple columns in a single ALTER TABLE statement
            try:
                db.execute(text("""
                    ALTER TABLE recurring_triggers
                    ADD COLUMN interaction_filter_days INTEGER DEFAULT NULL;
                """))
            except Exception:
                pass
            try:
                db.execute(text("""
                    ALTER TABLE recurring_triggers
                    ADD COLUMN created_filter_days INTEGER DEFAULT NULL;
                """))
            except Exception:
                pass
        db.commit()
        print("[OK] Colunas interaction_filter_days e created_filter_days adicionadas a tabela recurring_triggers com sucesso.")
    except Exception as e:
        print(f"[ERRO] {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run()

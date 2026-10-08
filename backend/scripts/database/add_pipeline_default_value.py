"""
Migration: add default_value column to sales_pipelines
Run once: python backend/scripts/database/add_pipeline_default_value.py
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
                ALTER TABLE sales_pipelines
                ADD COLUMN IF NOT EXISTS default_value DOUBLE PRECISION DEFAULT 0.0;
            """))
        else:
            # SQLite
            try:
                db.execute(text("""
                    ALTER TABLE sales_pipelines
                    ADD COLUMN default_value REAL DEFAULT 0.0;
                """))
            except Exception:
                pass
        db.commit()
        print("[OK] Coluna default_value adicionada a tabela sales_pipelines com sucesso.")
    except Exception as e:
        print(f"[ERRO] {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run()

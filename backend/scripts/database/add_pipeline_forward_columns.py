"""
Migration: Adiciona colunas forward_to_pipeline_id e forward_to_stage_id na tabela sales_pipeline_stages
Executar: python backend/scripts/database/add_pipeline_forward_columns.py
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
                ALTER TABLE sales_pipeline_stages
                ADD COLUMN IF NOT EXISTS forward_to_pipeline_id INTEGER REFERENCES sales_pipelines(id) ON DELETE SET NULL;
            """))
            db.execute(text("""
                ALTER TABLE sales_pipeline_stages
                ADD COLUMN IF NOT EXISTS forward_to_stage_id INTEGER REFERENCES sales_pipeline_stages(id) ON DELETE SET NULL;
            """))
        else:
            # SQLite fallback
            for col in ["forward_to_pipeline_id", "forward_to_stage_id"]:
                try:
                    db.execute(text(f"""
                        ALTER TABLE sales_pipeline_stages
                        ADD COLUMN {col} INTEGER DEFAULT NULL;
                    """))
                except Exception:
                    pass
        db.commit()
        print("[OK] Colunas forward_to_pipeline_id e forward_to_stage_id adicionadas a sales_pipeline_stages com sucesso.")
    except Exception as e:
        print(f"[ERRO] {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    run()

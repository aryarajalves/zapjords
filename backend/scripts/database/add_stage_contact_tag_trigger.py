"""
Migration: add contact_tag_trigger column to sales_pipeline_stages
Run once: python backend/scripts/database/add_stage_contact_tag_trigger.py
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
                ALTER TABLE sales_pipeline_stages
                ADD COLUMN IF NOT EXISTS contact_tag_trigger VARCHAR(100) DEFAULT NULL;
            """))
        else:
            try:
                db.execute(text("ALTER TABLE sales_pipeline_stages ADD COLUMN contact_tag_trigger VARCHAR(100) DEFAULT NULL;"))
            except Exception as col_err:
                print(f"Nota para SQLite ao adicionar contact_tag_trigger: {col_err}")

        db.commit()
        print("✅ Coluna contact_tag_trigger adicionada com sucesso na tabela sales_pipeline_stages.")
    except Exception as e:
        print(f"⚠️ Erro na migração: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    run()

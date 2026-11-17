"""
Migration: add platform & bussola invite config columns to email_templates
Run once: python backend/scripts/database/add_email_template_invite_columns.py
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
                ALTER TABLE email_templates
                ADD COLUMN IF NOT EXISTS invite_role VARCHAR DEFAULT 'aluno',
                ADD COLUMN IF NOT EXISTS invite_duration_hours INTEGER DEFAULT 0,
                ADD COLUMN IF NOT EXISTS invite_course_access JSONB DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS bussola_invite_role VARCHAR DEFAULT 'client',
                ADD COLUMN IF NOT EXISTS bussola_validity_type VARCHAR DEFAULT 'never',
                ADD COLUMN IF NOT EXISTS bussola_custom_api_key VARCHAR DEFAULT NULL;
            """))
        else:
            cols = [
                ("invite_role", "VARCHAR DEFAULT 'aluno'"),
                ("invite_duration_hours", "INTEGER DEFAULT 0"),
                ("invite_course_access", "JSON DEFAULT NULL"),
                ("bussola_invite_role", "VARCHAR DEFAULT 'client'"),
                ("bussola_validity_type", "VARCHAR DEFAULT 'never'"),
                ("bussola_custom_api_key", "VARCHAR DEFAULT NULL"),
            ]
            for col_name, col_type in cols:
                try:
                    db.execute(text(f"ALTER TABLE email_templates ADD COLUMN {col_name} {col_type};"))
                except Exception as col_err:
                    print(f"Nota para SQLite ao adicionar {col_name}: {col_err}")

        db.commit()
        print("✅ Colunas de convite adicionadas com sucesso na tabela email_templates.")
    except Exception as e:
        print(f"⚠️ Erro na migração: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    run()

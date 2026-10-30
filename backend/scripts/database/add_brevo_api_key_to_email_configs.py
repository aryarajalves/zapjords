"""
Script de migração para suporte a Brevo API na tabela email_configs.
Tabela afetada:
- email_configs: brevo_api_key (VARCHAR(255))
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from database import engine, Base
import models
from sqlalchemy import text, inspect

def run_migration():
    # Garante que as tabelas de email existam caso ainda não tenham sido criadas
    Base.metadata.create_all(bind=engine, tables=[
        models.EmailConfig.__table__,
        models.EmailTemplate.__table__,
        models.EmailDispatch.__table__,
        models.EmailInbound.__table__
    ])

    inspector = inspect(engine)
    if "email_configs" in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns("email_configs")]
        with engine.begin() as conn:
            if "brevo_api_key" not in columns:
                print("Adding 'brevo_api_key' to 'email_configs'...")
                conn.execute(text("ALTER TABLE email_configs ADD COLUMN brevo_api_key VARCHAR(255)"))
                print("'brevo_api_key' added successfully.")
            else:
                print("'brevo_api_key' already exists in 'email_configs'.")
    print("✅ Migration completed.")

if __name__ == "__main__":
    run_migration()

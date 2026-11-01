"""
Script de migração para suporte a E-mail na tabela blocked_contacts (Blacklist).
Tabela afetada:
- blocked_contacts: email (VARCHAR(255) NULL)
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from database import engine, Base
import models
from sqlalchemy import text, inspect

def run_migration():
    Base.metadata.create_all(bind=engine, tables=[
        models.BlockedContact.__table__
    ])

    inspector = inspect(engine)
    if "blocked_contacts" in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns("blocked_contacts")]
        with engine.begin() as conn:
            if "email" not in columns:
                print("Adding 'email' to 'blocked_contacts'...")
                conn.execute(text("ALTER TABLE blocked_contacts ADD COLUMN email VARCHAR(255) NULL"))
                try:
                    conn.execute(text("CREATE INDEX ix_blocked_contacts_email ON blocked_contacts (email)"))
                except Exception as e_idx:
                    print(f"Index creation note: {e_idx}")
                print("'email' added successfully to 'blocked_contacts'.")
            else:
                print("'email' already exists in 'blocked_contacts'.")

            # Permite phone ser nulo caso o bloqueio seja puramente por e-mail
            is_sqlite = engine.dialect.name == "sqlite"
            if not is_sqlite:
                try:
                    conn.execute(text("ALTER TABLE blocked_contacts ALTER COLUMN phone DROP NOT NULL"))
                    print("'phone' column altered to nullable.")
                except Exception as e_null:
                    print(f"Alter nullable note: {e_null}")

    print("✅ Migration completed.")

if __name__ == "__main__":
    run_migration()

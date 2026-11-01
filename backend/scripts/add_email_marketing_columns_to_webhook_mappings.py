import os
import sys

# Garante import do diretório backend
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, SessionLocal, SQLALCHEMY_DATABASE_URL
from sqlalchemy import text

def run_migration():
    print("Conectando ao banco de dados via database.py...")
    db = SessionLocal()
    is_sqlite = "sqlite" in SQLALCHEMY_DATABASE_URL.lower()
    
    columns_to_add = [
        ("email_active", "BOOLEAN DEFAULT FALSE"),
        ("email_template_id", "INTEGER REFERENCES email_templates(id) ON DELETE SET NULL" if not is_sqlite else "INTEGER"),
        ("email_funnel_id", "INTEGER REFERENCES email_funnels(id) ON DELETE SET NULL" if not is_sqlite else "INTEGER"),
        ("email_subject", "VARCHAR")
    ]

    try:
        if is_sqlite:
            pragma = db.execute(text("PRAGMA table_info(webhook_event_mappings)")).fetchall()
            existing = {row[1] for row in pragma}
            for col, col_type in columns_to_add:
                if col not in existing:
                    db.execute(text(f"ALTER TABLE webhook_event_mappings ADD COLUMN {col} {col_type}"))
                    print(f"[SQLite] Coluna '{col}' adicionada com sucesso.")
                else:
                    print(f"[SQLite] Coluna '{col}' ja existe.")
        else:
            for col, col_type in columns_to_add:
                try:
                    db.execute(text(f"ALTER TABLE webhook_event_mappings ADD COLUMN IF NOT EXISTS {col} {col_type}"))
                    print(f"[PostgreSQL] Coluna '{col}' verificada/adicionada.")
                except Exception as ex_col:
                    print(f"Aviso na coluna '{col}': {ex_col}")
                    db.rollback()
        
        db.commit()
        print("Migracao concluida com sucesso!")
    except Exception as e:
        print(f"Erro durante a migracao: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()

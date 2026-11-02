import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do .env se existirem
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
if not os.getenv("DATABASE_URL"):
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from database import SessionLocal, engine
from sqlalchemy import text

def add_columns():
    db = SessionLocal()
    is_sqlite = engine.url.drivername == "sqlite"
    try:
        if is_sqlite:
            # SQLite does not support IF NOT EXISTS in ALTER TABLE ADD COLUMN
            cols = [
                ("total_opened", "INTEGER DEFAULT 0"),
                ("total_clicks", "INTEGER DEFAULT 0"),
                ("analytics_data", "JSON DEFAULT '{}'")
            ]
            for col_name, col_type in cols:
                try:
                    db.execute(text(f"ALTER TABLE email_dispatches ADD COLUMN {col_name} {col_type}"))
                    db.commit()
                    print(f"✅ Coluna {col_name} adicionada com sucesso no SQLite.")
                except Exception as ex:
                    db.rollback()
                    if "duplicate column name" in str(ex).lower():
                        print(f"ℹ️ Coluna {col_name} já existe no SQLite.")
                    else:
                        print(f"⚠️ Aviso ao adicionar {col_name}: {ex}")
        else:
            db.execute(text("ALTER TABLE email_dispatches ADD COLUMN IF NOT EXISTS total_opened INTEGER DEFAULT 0"))
            db.execute(text("ALTER TABLE email_dispatches ADD COLUMN IF NOT EXISTS total_clicks INTEGER DEFAULT 0"))
            db.execute(text("ALTER TABLE email_dispatches ADD COLUMN IF NOT EXISTS analytics_data JSONB DEFAULT '{}'::jsonb"))
            db.commit()
            print("✅ Colunas total_opened, total_clicks e analytics_data adicionadas com sucesso no Postgres.")
    except Exception as e:
        print(f"❌ Erro ao adicionar colunas de analytics em email_dispatches: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_columns()

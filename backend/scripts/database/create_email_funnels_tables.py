import os
import sys
from sqlalchemy import create_engine, text

# Adicionar pasta raiz do backend ao sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

if not os.getenv("DATABASE_URL"):
    try:
        from dotenv import load_dotenv
        load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env")))
    except Exception:
        pass
if not os.getenv("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "sqlite:///sqlite.db"

from database import engine

def migrate():
    print("🔄 [MIGRATION] Criando tabelas email_funnels e email_funnel_executions...")
    
    with engine.connect() as conn:
        if "sqlite" in str(engine.url):
            sqlite_sql = """
            CREATE TABLE IF NOT EXISTS email_funnels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT NULL,
                trigger_type VARCHAR(50) DEFAULT 'tag' NOT NULL,
                trigger_config JSON NULL,
                stop_tags JSON NULL,
                stop_on_purchase BOOLEAN DEFAULT 1 NOT NULL,
                is_active BOOLEAN DEFAULT 1 NOT NULL,
                steps JSON NOT NULL,
                total_enrolled INTEGER DEFAULT 0,
                total_completed INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS email_funnel_executions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER NOT NULL,
                funnel_id INTEGER NOT NULL,
                lead_id INTEGER NULL,
                contact_email VARCHAR(255) NOT NULL,
                contact_name VARCHAR(255) NULL,
                current_step_index INTEGER DEFAULT 0 NOT NULL,
                status VARCHAR(50) DEFAULT 'active' NOT NULL,
                scheduled_for DATETIME NULL,
                history JSON NULL,
                stop_reason VARCHAR(255) NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_email_funnels_client ON email_funnels(client_id);
            CREATE INDEX IF NOT EXISTS idx_email_funnel_exec_client ON email_funnel_executions(client_id);
            CREATE INDEX IF NOT EXISTS idx_email_funnel_exec_funnel ON email_funnel_executions(funnel_id);
            CREATE INDEX IF NOT EXISTS idx_email_funnel_exec_email ON email_funnel_executions(contact_email);
            CREATE INDEX IF NOT EXISTS idx_email_funnel_exec_sched ON email_funnel_executions(scheduled_for);
            """
            for stmt in sqlite_sql.strip().split(";"):
                clean = stmt.strip()
                if clean:
                    conn.execute(text(clean))
        else:
            pg_sql = """
            CREATE TABLE IF NOT EXISTS email_funnels (
                id SERIAL PRIMARY KEY,
                client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                description TEXT NULL,
                trigger_type VARCHAR(50) DEFAULT 'tag' NOT NULL,
                trigger_config JSONB NULL,
                stop_tags JSONB NULL,
                stop_on_purchase BOOLEAN DEFAULT TRUE NOT NULL,
                is_active BOOLEAN DEFAULT TRUE NOT NULL,
                steps JSONB NOT NULL DEFAULT '[]'::jsonb,
                total_enrolled INTEGER DEFAULT 0,
                total_completed INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS email_funnel_executions (
                id SERIAL PRIMARY KEY,
                client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                funnel_id INTEGER NOT NULL REFERENCES email_funnels(id) ON DELETE CASCADE,
                lead_id INTEGER NULL REFERENCES webhook_leads(id) ON DELETE SET NULL,
                contact_email VARCHAR(255) NOT NULL,
                contact_name VARCHAR(255) NULL,
                current_step_index INTEGER DEFAULT 0 NOT NULL,
                status VARCHAR(50) DEFAULT 'active' NOT NULL,
                scheduled_for TIMESTAMP WITH TIME ZONE NULL,
                history JSONB NULL DEFAULT '[]'::jsonb,
                stop_reason VARCHAR(255) NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_email_funnels_client ON email_funnels(client_id);
            CREATE INDEX IF NOT EXISTS idx_email_funnel_exec_client ON email_funnel_executions(client_id);
            CREATE INDEX IF NOT EXISTS idx_email_funnel_exec_funnel ON email_funnel_executions(funnel_id);
            CREATE INDEX IF NOT EXISTS idx_email_funnel_exec_email ON email_funnel_executions(contact_email);
            CREATE INDEX IF NOT EXISTS idx_email_funnel_exec_sched ON email_funnel_executions(scheduled_for);
            """
            for stmt in pg_sql.strip().split(";"):
                clean = stmt.strip()
                if clean:
                    conn.execute(text(clean))
                    
        conn.commit()
    print("✅ [MIGRATION] Tabelas email_funnels e email_funnel_executions criadas com sucesso!")

if __name__ == "__main__":
    migrate()

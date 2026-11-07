import sys
from sqlalchemy import text
from database import engine

def migrate():
    print("Iniciando migração: criando tabela ai_usage_logs...")
    is_postgres = engine.dialect.name == "postgresql"

    with engine.connect() as conn:
        try:
            if is_postgres:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS ai_usage_logs (
                        id SERIAL PRIMARY KEY,
                        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                        conversation_id INTEGER,
                        contact_phone VARCHAR(50),
                        contact_name VARCHAR(255),
                        model VARCHAR(100) NOT NULL,
                        prompt_tokens INTEGER DEFAULT 0 NOT NULL,
                        completion_tokens INTEGER DEFAULT 0 NOT NULL,
                        total_tokens INTEGER DEFAULT 0 NOT NULL,
                        cost_usd DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
                        cost_brl DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
                        question_preview TEXT,
                        response_preview TEXT,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """))
                conn.commit()
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ai_usage_logs_client_id ON ai_usage_logs(client_id);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ai_usage_logs_conversation_id ON ai_usage_logs(conversation_id);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ai_usage_logs_contact_phone ON ai_usage_logs(contact_phone);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ai_usage_logs_model ON ai_usage_logs(model);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ai_usage_logs_created_at ON ai_usage_logs(created_at);"))
                conn.commit()
            else:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS ai_usage_logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                        conversation_id INTEGER,
                        contact_phone VARCHAR(50),
                        contact_name VARCHAR(255),
                        model VARCHAR(100) NOT NULL,
                        prompt_tokens INTEGER DEFAULT 0 NOT NULL,
                        completion_tokens INTEGER DEFAULT 0 NOT NULL,
                        total_tokens INTEGER DEFAULT 0 NOT NULL,
                        cost_usd FLOAT DEFAULT 0.0 NOT NULL,
                        cost_brl FLOAT DEFAULT 0.0 NOT NULL,
                        question_preview TEXT,
                        response_preview TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                """))
                conn.commit()
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ai_usage_logs_client_id ON ai_usage_logs(client_id);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ai_usage_logs_conversation_id ON ai_usage_logs(conversation_id);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ai_usage_logs_contact_phone ON ai_usage_logs(contact_phone);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ai_usage_logs_model ON ai_usage_logs(model);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ai_usage_logs_created_at ON ai_usage_logs(created_at);"))
                conn.commit()

            print("✅ Tabela ai_usage_logs e índices criados com sucesso!")
        except Exception as e:
            conn.rollback()
            print(f"❌ Erro durante a migração: {e}")
            raise e

if __name__ == "__main__":
    migrate()

import sys
from sqlalchemy import text
from database import engine

def migrate():
    print("Iniciando migração: criando tabela ai_prompt_presets...")
    is_postgres = engine.dialect.name == "postgresql"

    with engine.connect() as conn:
        try:
            if is_postgres:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS ai_prompt_presets (
                        id SERIAL PRIMARY KEY,
                        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                        name VARCHAR(100) NOT NULL,
                        product_identifier VARCHAR(150),
                        prompt_text TEXT NOT NULL,
                        is_default BOOLEAN DEFAULT FALSE NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """))
                conn.commit()
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ai_prompt_presets_client_id ON ai_prompt_presets(client_id);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ai_prompt_presets_is_default ON ai_prompt_presets(is_default);"))
                conn.commit()
            else:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS ai_prompt_presets (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                        name VARCHAR(100) NOT NULL,
                        product_identifier VARCHAR(150),
                        prompt_text TEXT NOT NULL,
                        is_default BOOLEAN DEFAULT 0 NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                """))
                conn.commit()
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ai_prompt_presets_client_id ON ai_prompt_presets(client_id);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ai_prompt_presets_is_default ON ai_prompt_presets(is_default);"))
                conn.commit()

            print("✅ Tabela ai_prompt_presets criada/verificada com sucesso!")
        except Exception as e:
            print(f"❌ Erro ao criar tabela ai_prompt_presets: {e}")
            sys.exit(1)

if __name__ == "__main__":
    migrate()

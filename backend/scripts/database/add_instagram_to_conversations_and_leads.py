import os
import sys
from sqlalchemy import text

# Adicionar pasta raiz do backend ao sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from database import engine

def migrate():
    print("Iniciando migração: adicionando coluna instagram em chat_conversations e webhook_leads...")
    with engine.connect() as conn:
        # 1. Adicionar em chat_conversations
        try:
            conn.execute(text("ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS instagram VARCHAR(100);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_chat_conversations_instagram ON chat_conversations(instagram);"))
            print("✅ Coluna 'instagram' adicionada em chat_conversations com sucesso!")
        except Exception as e:
            print(f"⚠️ Aviso em chat_conversations: {e}")

        # 2. Adicionar em webhook_leads
        try:
            conn.execute(text("ALTER TABLE webhook_leads ADD COLUMN IF NOT EXISTS instagram VARCHAR(100);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_webhook_leads_instagram ON webhook_leads(instagram);"))
            print("✅ Coluna 'instagram' adicionada em webhook_leads com sucesso!")
        except Exception as e:
            print(f"⚠️ Aviso em webhook_leads: {e}")

        conn.commit()
    print("Migração concluída com sucesso!")

if __name__ == "__main__":
    migrate()

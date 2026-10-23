import sys
from sqlalchemy import text
from database import engine

def migrate():
    print("Iniciando migração: adicionando ON DELETE CASCADE para constraints da tabela user_clients...")
    with engine.begin() as conn:
        # Apenas aplicável em PostgreSQL ou SQLite com suporte a constraints
        try:
            # 1. user_id
            conn.execute(text("""
                ALTER TABLE user_clients 
                DROP CONSTRAINT IF EXISTS user_clients_user_id_fkey;
            """))
            conn.execute(text("""
                ALTER TABLE user_clients 
                ADD CONSTRAINT user_clients_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
            """))
            print("Constraint user_clients_user_id_fkey atualizada para ON DELETE CASCADE.")

            # 2. client_id
            conn.execute(text("""
                ALTER TABLE user_clients 
                DROP CONSTRAINT IF EXISTS user_clients_client_id_fkey;
            """))
            conn.execute(text("""
                ALTER TABLE user_clients 
                ADD CONSTRAINT user_clients_client_id_fkey 
                FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
            """))
            print("Constraint user_clients_client_id_fkey atualizada para ON DELETE CASCADE.")
            print("✅ Migração de user_clients concluída com sucesso!")
        except Exception as e:
            print(f"Nota/Erro na execução do script (se SQLite, constraints são tratadas pelo ORM): {e}")

if __name__ == "__main__":
    migrate()

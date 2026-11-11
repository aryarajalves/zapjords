import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql://postgres:postgres@zapvoice-postgres:5432/zapvoice"

def migrate():
    engine = create_engine(DATABASE_URL)
    table_name = "webhook_integrations"

    print(f"Connecting to database to check columns in '{table_name}'...")
    with engine.connect() as conn:
        # Check is_pinned
        check_pinned = conn.execute(
            text(f"SELECT column_name FROM information_schema.columns WHERE table_name='{table_name}' AND column_name='is_pinned'")
        ).fetchone()

        if check_pinned:
            print("Column 'is_pinned' already exists.")
        else:
            print("Adding column 'is_pinned'...")
            try:
                with engine.begin() as trans:
                    trans.execute(text(f"ALTER TABLE {table_name} ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT FALSE;"))
                print("Column 'is_pinned' added successfully.")
            except Exception as e:
                print(f"Error adding 'is_pinned': {e}")

        # Check pinned_at
        check_pinned_at = conn.execute(
            text(f"SELECT column_name FROM information_schema.columns WHERE table_name='{table_name}' AND column_name='pinned_at'")
        ).fetchone()

        if check_pinned_at:
            print("Column 'pinned_at' already exists.")
        else:
            print("Adding column 'pinned_at'...")
            try:
                with engine.begin() as trans:
                    trans.execute(text(f"ALTER TABLE {table_name} ADD COLUMN pinned_at TIMESTAMP WITH TIME ZONE NULL;"))
                print("Column 'pinned_at' added successfully.")
            except Exception as e:
                print(f"Error adding 'pinned_at': {e}")

        # Ensure index
        try:
            with engine.begin() as trans:
                trans.execute(text(f"CREATE INDEX IF NOT EXISTS ix_webhook_integrations_client_pinned ON {table_name} (client_id, is_pinned, pinned_at);"))
            print("Index 'ix_webhook_integrations_client_pinned' ensured successfully.")
        except Exception as e:
            print(f"Error creating index: {e}")

if __name__ == "__main__":
    migrate()

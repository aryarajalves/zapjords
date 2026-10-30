"""
Script de migração para suporte a Follow-up em Colunas do Kanban e data de entrada em estágio nos Deals.
Tabelas afetadas:
- sales_pipeline_stages: is_followup (BOOLEAN), followup_delay_value (INTEGER), followup_delay_unit (VARCHAR)
- sales_deals: stage_entered_at (TIMESTAMP WITH TIME ZONE)
"""
from database import engine
from sqlalchemy import text, inspect

def run_migration():
    inspector = inspect(engine)
    
    # 1. Colunas em sales_pipeline_stages
    stages_columns = [c['name'] for c in inspector.get_columns("sales_pipeline_stages")]
    with engine.begin() as conn:
        if "is_followup" not in stages_columns:
            print("Adding 'is_followup' to 'sales_pipeline_stages'...")
            conn.execute(text("ALTER TABLE sales_pipeline_stages ADD COLUMN is_followup BOOLEAN DEFAULT FALSE"))
            print("'is_followup' added.")
        else:
            print("'is_followup' already exists in 'sales_pipeline_stages'.")

        if "followup_delay_value" not in stages_columns:
            print("Adding 'followup_delay_value' to 'sales_pipeline_stages'...")
            conn.execute(text("ALTER TABLE sales_pipeline_stages ADD COLUMN followup_delay_value INTEGER DEFAULT 3"))
            print("'followup_delay_value' added.")
        else:
            print("'followup_delay_value' already exists in 'sales_pipeline_stages'.")

        if "followup_delay_unit" not in stages_columns:
            print("Adding 'followup_delay_unit' to 'sales_pipeline_stages'...")
            conn.execute(text("ALTER TABLE sales_pipeline_stages ADD COLUMN followup_delay_unit VARCHAR(20) DEFAULT 'hours'"))
            print("'followup_delay_unit' added.")
        else:
            print("'followup_delay_unit' already exists in 'sales_pipeline_stages'.")

    # 2. Coluna em sales_deals
    deals_columns = [c['name'] for c in inspector.get_columns("sales_deals")]
    with engine.begin() as conn:
        if "stage_entered_at" not in deals_columns:
            print("Adding 'stage_entered_at' to 'sales_deals'...")
            conn.execute(text("ALTER TABLE sales_deals ADD COLUMN stage_entered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"))
            # Backfill para deals existentes usando updated_at ou created_at
            conn.execute(text("UPDATE sales_deals SET stage_entered_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP) WHERE stage_entered_at IS NULL"))
            print("'stage_entered_at' added and backfilled.")
        else:
            print("'stage_entered_at' already exists in 'sales_deals'.")

    print("Migration completed successfully!")

if __name__ == "__main__":
    run_migration()

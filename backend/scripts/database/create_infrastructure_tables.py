import sys
import os

# Adiciona o diretório backend ao sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL

def migrate():
    print("🚀 [MIGRATION] Criando tabelas de infraestrutura e alertas...")
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    with engine.connect() as conn:
        # 1. Tabela infrastructure_alert_configs
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS infrastructure_alert_configs (
                id SERIAL PRIMARY KEY,
                alert_pool_enabled BOOLEAN NOT NULL DEFAULT TRUE,
                alert_pool_threshold INTEGER NOT NULL DEFAULT 75,
                alert_ram_enabled BOOLEAN NOT NULL DEFAULT TRUE,
                alert_ram_threshold INTEGER NOT NULL DEFAULT 80,
                alert_cpu_enabled BOOLEAN NOT NULL DEFAULT TRUE,
                alert_cpu_threshold INTEGER NOT NULL DEFAULT 85,
                cooldown_minutes INTEGER NOT NULL DEFAULT 15,
                webhook_url VARCHAR(500) NULL,
                notify_normalized BOOLEAN NOT NULL DEFAULT TRUE,
                last_alert_sent_at TIMESTAMP WITH TIME ZONE NULL,
                last_alert_type VARCHAR(100) NULL,
                is_currently_alerting BOOLEAN NOT NULL DEFAULT FALSE,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """))

        # Inserir configuração padrão caso tabela esteja vazia
        conn.execute(text("""
            INSERT INTO infrastructure_alert_configs (
                id, alert_pool_enabled, alert_pool_threshold, alert_ram_enabled, alert_ram_threshold,
                alert_cpu_enabled, alert_cpu_threshold, cooldown_minutes, webhook_url, notify_normalized
            ) VALUES (
                1, TRUE, 75, TRUE, 80, TRUE, 85, 15, '', TRUE
            ) ON CONFLICT (id) DO NOTHING;
        """))

        # 2. Tabela infrastructure_peak_logs
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS infrastructure_peak_logs (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                hour_period VARCHAR(50) NOT NULL,
                peak_connections INTEGER NOT NULL DEFAULT 0,
                pool_total INTEGER NOT NULL DEFAULT 30,
                occupancy_percent FLOAT NOT NULL DEFAULT 0.0,
                status VARCHAR(50) NOT NULL DEFAULT 'Normal',
                peak_ram_gb FLOAT NOT NULL DEFAULT 0.0,
                peak_ram_percent FLOAT NOT NULL DEFAULT 0.0,
                peak_cpu_percent FLOAT NOT NULL DEFAULT 0.0
            );
            CREATE INDEX IF NOT EXISTS idx_infra_peak_logs_time ON infrastructure_peak_logs (timestamp);
            CREATE INDEX IF NOT EXISTS idx_infra_peak_logs_hour ON infrastructure_peak_logs (hour_period);
        """))
        conn.commit()
    print("✅ [MIGRATION] Tabelas infrastructure_alert_configs e infrastructure_peak_logs criadas com sucesso!")

if __name__ == "__main__":
    migrate()

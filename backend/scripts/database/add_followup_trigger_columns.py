# -*- coding: utf-8 -*-
"""
Script de Migração: Adicionar colunas de Follow-up em Massa na tabela scheduled_triggers
- followup_step_number (Integer)
- stop_tags (JSON / JSONB)
- schedule_type (String)
- relative_delay_hours (Integer)
"""

import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, '..', '..'))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from sqlalchemy import text, inspect
from database import engine
from core.logger import logger

def add_followup_trigger_columns():
    logger.info("Iniciando migração de colunas de Follow-up para scheduled_triggers...")
    
    with engine.connect() as conn:
        inspector = inspect(conn)
        columns = [c['name'] for c in inspector.get_columns('scheduled_triggers')]
        
        # 1. followup_step_number
        if 'followup_step_number' not in columns:
            logger.info("Adicionando coluna followup_step_number em scheduled_triggers...")
            conn.execute(text("ALTER TABLE scheduled_triggers ADD COLUMN followup_step_number INTEGER DEFAULT 0;"))
            conn.commit()
            logger.info("Coluna followup_step_number adicionada com sucesso.")
        else:
            logger.info("Coluna followup_step_number já existe.")

        # 2. stop_tags
        if 'stop_tags' not in columns:
            logger.info("Adicionando coluna stop_tags em scheduled_triggers...")
            conn.execute(text("ALTER TABLE scheduled_triggers ADD COLUMN stop_tags JSON DEFAULT NULL;"))
            conn.commit()
            logger.info("Coluna stop_tags adicionada com sucesso.")
        else:
            logger.info("Coluna stop_tags já existe.")

        # 3. schedule_type
        if 'schedule_type' not in columns:
            logger.info("Adicionando coluna schedule_type em scheduled_triggers...")
            conn.execute(text("ALTER TABLE scheduled_triggers ADD COLUMN schedule_type VARCHAR DEFAULT 'fixed';"))
            conn.commit()
            logger.info("Coluna schedule_type adicionada com sucesso.")
        else:
            logger.info("Coluna schedule_type já existe.")

        # 4. relative_delay_hours
        if 'relative_delay_hours' not in columns:
            logger.info("Adicionando coluna relative_delay_hours em scheduled_triggers...")
            conn.execute(text("ALTER TABLE scheduled_triggers ADD COLUMN relative_delay_hours INTEGER DEFAULT NULL;"))
            conn.commit()
            logger.info("Coluna relative_delay_hours adicionada com sucesso.")
        else:
            logger.info("Coluna relative_delay_hours já existe.")

    logger.info("Migração de Follow-up concluída com sucesso!")

if __name__ == '__main__':
    add_followup_trigger_columns()

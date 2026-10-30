import pytest
import sys, os
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
from models.crm import SalesPipeline, SalesPipelineStage, SalesDeal
from routers.crm import create_stage, update_stage, get_pipeline_board, move_deal, create_deal
from schemas_domain.crm import (
    SalesPipelineStageCreate,
    SalesPipelineStageUpdate,
    SalesDealCreate,
    SalesDealMove
)


def setup_crm_followup_test_db():
    engine = create_engine("sqlite:///:memory:")
    models.Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    client1 = models.Client(id=1, name="Cliente 1 CRM", is_active=True)
    user1 = models.User(id=1, email="admin1@crm.com", role="super_admin", client_id=1)
    db.add_all([client1, user1])
    db.commit()

    pipe = SalesPipeline(id=10, client_id=1, name="Pipeline Follow-up Test")
    db.add(pipe)
    db.commit()

    return db, client1, user1, pipe


def test_create_and_update_stage_with_followup():
    db, client1, user1, pipe = setup_crm_followup_test_db()

    # 1. Criar coluna com Follow-up ativado (3 horas)
    payload_create = SalesPipelineStageCreate(
        pipeline_id=pipe.id,
        name="Follow-up 3 Horas",
        color="amber",
        stage_type="in_progress",
        is_followup=True,
        followup_delay_value=3,
        followup_delay_unit="hours"
    )
    stg = create_stage(payload=payload_create, client_id=1, db=db, current_user=user1)
    assert stg.id is not None
    assert stg.is_followup is True
    assert stg.followup_delay_value == 3
    assert stg.followup_delay_unit == "hours"

    # 2. Atualizar para 1 dia
    payload_update = SalesPipelineStageUpdate(
        followup_delay_value=1,
        followup_delay_unit="days"
    )
    updated_stg = update_stage(stage_id=stg.id, payload=payload_update, client_id=1, db=db, current_user=user1)
    assert updated_stg.followup_delay_value == 1
    assert updated_stg.followup_delay_unit == "days"
    assert updated_stg.is_followup is True

    # 3. Desativar follow-up
    payload_disable = SalesPipelineStageUpdate(is_followup=False)
    disabled_stg = update_stage(stage_id=stg.id, payload=payload_disable, client_id=1, db=db, current_user=user1)
    assert disabled_stg.is_followup is False


def test_board_calculates_needs_followup_overdue_and_remaining():
    db, client1, user1, pipe = setup_crm_followup_test_db()

    # Criar estágio com follow-up de 3 horas
    stg_followup = SalesPipelineStage(
        id=101,
        pipeline_id=pipe.id,
        client_id=1,
        name="Aguardando Resposta",
        order_index=0,
        is_followup=True,
        followup_delay_value=3,
        followup_delay_unit="hours"
    )
    db.add(stg_followup)
    db.commit()

    now = datetime.now(timezone.utc)

    # Lead 1: entrou há 4 horas (VENCIDO / Precisa de follow-up)
    deal_overdue = SalesDeal(
        id=201,
        client_id=1,
        pipeline_id=pipe.id,
        stage_id=stg_followup.id,
        contact_phone="5511999990001",
        contact_name="Lead Vencido",
        value=150.0,
        stage_entered_at=now - timedelta(hours=4),
        created_at=now - timedelta(hours=4),
        updated_at=now - timedelta(hours=4)
    )

    # Lead 2: entrou há 1 hora (DENTRO DO PRAZO / Não precisa ainda)
    deal_within_limit = SalesDeal(
        id=202,
        client_id=1,
        pipeline_id=pipe.id,
        stage_id=stg_followup.id,
        contact_phone="5511999990002",
        contact_name="Lead No Prazo",
        value=200.0,
        stage_entered_at=now - timedelta(hours=1),
        created_at=now - timedelta(hours=1),
        updated_at=now - timedelta(hours=1)
    )

    db.add_all([deal_overdue, deal_within_limit])
    db.commit()

    # Obter quadro kanban
    board = get_pipeline_board(pipeline_id=pipe.id, client_id=1, db=db, current_user=user1)

    assert len(board["stages"]) == 1
    stage_data = board["stages"][0]
    assert stage_data["is_followup"] is True
    assert stage_data["followup_delay_value"] == 3
    assert stage_data["followup_delay_unit"] == "hours"
    assert stage_data["followup_overdue_count"] == 1  # Apenas 1 vencido

    deals_res = {d["id"]: d for d in stage_data["deals"]}
    
    # Validação do Lead 1 (Vencido)
    d1 = deals_res[201]
    assert d1["needs_followup"] is True
    assert d1["followup_overdue_seconds"] is not None
    assert d1["followup_overdue_seconds"] >= 3500  # ~1 hora a mais que as 3h limite

    # Validação do Lead 2 (No Prazo)
    d2 = deals_res[202]
    assert d2["needs_followup"] is False
    assert d2["followup_remaining_seconds"] is not None
    assert d2["followup_remaining_seconds"] <= 7300  # ~2 horas restantes


def test_move_deal_updates_stage_entered_at():
    db, client1, user1, pipe = setup_crm_followup_test_db()

    stg_a = SalesPipelineStage(id=1, pipeline_id=pipe.id, client_id=1, name="Etapa A", order_index=0)
    stg_b = SalesPipelineStage(id=2, pipeline_id=pipe.id, client_id=1, name="Etapa B Follow-up", order_index=1, is_followup=True)
    db.add_all([stg_a, stg_b])
    db.commit()

    past_time = datetime.now(timezone.utc) - timedelta(days=2)
    deal = SalesDeal(
        id=301,
        client_id=1,
        pipeline_id=pipe.id,
        stage_id=stg_a.id,
        contact_phone="5511988887777",
        contact_name="Lead Movimento",
        stage_entered_at=past_time
    )
    db.add(deal)
    db.commit()

    # Mover deal para Etapa B
    move_payload = SalesDealMove(stage_id=stg_b.id)
    moved_deal = move_deal(deal_id=301, payload=move_payload, client_id=1, db=db, current_user=user1)

    assert moved_deal.stage_id == stg_b.id
    # stage_entered_at deve ter sido atualizado para agora (muito mais recente que past_time)
    entered = moved_deal.stage_entered_at if moved_deal.stage_entered_at.tzinfo else moved_deal.stage_entered_at.replace(tzinfo=timezone.utc)
    past = past_time if past_time.tzinfo else past_time.replace(tzinfo=timezone.utc)
    assert entered > past
    diff = (datetime.now(timezone.utc) - entered).total_seconds()
    assert diff < 10  # atualizado há poucos segundos

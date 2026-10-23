import pytest
from unittest.mock import MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
from models.crm import SalesPipeline, SalesPipelineStage, SalesDeal
from core.engine.nodes.kanban import handle_kanban_node

def setup_test_db():
    engine = create_engine("sqlite:///:memory:")
    models.Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    client = models.Client(id=1, name="Cliente Kanban Funil", is_active=True)
    db.add(client)
    db.commit()
    return db, client

@pytest.mark.asyncio
async def test_kanban_node_creates_new_deal():
    db, client = setup_test_db()
    try:
        pipeline = SalesPipeline(client_id=client.id, name="Pipeline Vendas Teste", is_default=True)
        db.add(pipeline)
        db.commit()

        stage_lead = SalesPipelineStage(
            client_id=client.id,
            pipeline_id=pipeline.id,
            name="Lead Qualificado",
            order_index=0,
            color="blue",
            stage_type="normal"
        )
        db.add(stage_lead)
        db.commit()

        trigger = MagicMock()
        trigger.id = 1
        trigger.client_id = client.id

        node = {
            "id": "node_kanban_1",
            "data": {
                "pipeline_id": pipeline.id,
                "stage_id": stage_lead.id,
                "product_name": "Curso Completo",
                "value": "497.00"
            }
        }

        contact_phone = "5511999990001"
        res = await handle_kanban_node(db, trigger, node, contact_phone, lambda x, **kwargs: x)

        assert res is None

        deal = db.query(SalesDeal).filter(
            SalesDeal.client_id == client.id,
            SalesDeal.contact_phone == contact_phone
        ).first()

        assert deal is not None
        assert deal.stage_id == stage_lead.id
        assert deal.product_name == "Curso Completo"
        assert deal.value == 497.0
        assert deal.status == "open"
    finally:
        db.close()


@pytest.mark.asyncio
async def test_kanban_node_moves_existing_deal_and_records_lost_reason():
    db, client = setup_test_db()
    try:
        pipeline = SalesPipeline(client_id=client.id, name="Pipeline Move", is_default=True)
        db.add(pipeline)
        db.commit()

        stage_initial = SalesPipelineStage(
            client_id=client.id,
            pipeline_id=pipeline.id,
            name="Prospect",
            order_index=0,
            color="blue",
            stage_type="initial"
        )
        stage_lost = SalesPipelineStage(
            client_id=client.id,
            pipeline_id=pipeline.id,
            name="Desistencia",
            order_index=1,
            color="rose",
            stage_type="lost"
        )
        db.add_all([stage_initial, stage_lost])
        db.commit()

        contact_phone = "5511988887777"

        existing_deal = SalesDeal(
            client_id=client.id,
            pipeline_id=pipeline.id,
            stage_id=stage_initial.id,
            contact_name="Pedro Santos",
            contact_phone=contact_phone,
            channel="whatsapp",
            value=1000.0,
            status="open"
        )
        db.add(existing_deal)
        db.commit()

        trigger = MagicMock()
        trigger.id = 1
        trigger.client_id = client.id

        node = {
            "id": "node_move_lost",
            "data": {
                "pipeline_id": pipeline.id,
                "stage_id": stage_lost.id,
                "lost_reason": "Sem resposta ao follow-up automático"
            }
        }

        res = await handle_kanban_node(db, trigger, node, contact_phone, lambda x, **kwargs: x)
        assert res is None

        db.refresh(existing_deal)
        assert existing_deal.stage_id == stage_lost.id
        assert existing_deal.status == "lost"
        assert existing_deal.lost_reason == "Sem resposta ao follow-up automático"
    finally:
        db.close()


@pytest.mark.asyncio
async def test_kanban_node_moves_to_won():
    db, client = setup_test_db()
    try:
        pipeline = SalesPipeline(client_id=client.id, name="Pipeline Won", is_default=True)
        db.add(pipeline)
        db.commit()

        stage_won = SalesPipelineStage(
            client_id=client.id,
            pipeline_id=pipeline.id,
            name="Venda Fechada",
            order_index=1,
            color="emerald",
            stage_type="won"
        )
        db.add(stage_won)
        db.commit()

        trigger = MagicMock()
        trigger.id = 1
        trigger.client_id = client.id

        node = {
            "id": "node_won",
            "data": {
                "stage_id": stage_won.id,
                "product_name": "Mentoria VIP",
                "value": 3000.0
            }
        }

        contact_phone = "5511977778888"
        await handle_kanban_node(db, trigger, node, contact_phone, lambda x, **kwargs: x)

        deal = db.query(SalesDeal).filter(
            SalesDeal.client_id == client.id,
            SalesDeal.contact_phone == contact_phone
        ).first()

        assert deal is not None
        assert deal.stage_id == stage_won.id
        assert deal.status == "won"
        assert deal.value == 3000.0
        assert deal.product_name == "Mentoria VIP"
    finally:
        db.close()

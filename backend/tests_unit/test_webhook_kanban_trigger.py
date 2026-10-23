import pytest
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from models import Client, SalesPipeline, SalesPipelineStage, SalesDeal, CRMProduct
from models.trigger import WebhookEventMapping
from services.crm_service import process_webhook_kanban_trigger

@pytest.fixture
def test_setup(db_session: Session):
    # Criar cliente de teste
    client = Client(name="Cliente Webhook Kanban Test", is_active=True)
    db_session.add(client)
    db_session.commit()
    db_session.refresh(client)

    # Criar Pipeline
    pipeline = SalesPipeline(
        client_id=client.id,
        name="Pipeline Webhook Test",
        is_default=True,
        default_value=150.0
    )
    db_session.add(pipeline)
    db_session.commit()
    db_session.refresh(pipeline)

    # Criar Estágios
    stage_prospect = SalesPipelineStage(
        client_id=client.id,
        pipeline_id=pipeline.id,
        name="Prospect",
        color="blue",
        stage_type="initial",
        order_index=0
    )
    stage_won = SalesPipelineStage(
        client_id=client.id,
        pipeline_id=pipeline.id,
        name="Venda Fechada",
        color="emerald",
        stage_type="won",
        order_index=1
    )
    stage_lost = SalesPipelineStage(
        client_id=client.id,
        pipeline_id=pipeline.id,
        name="Desistência",
        color="rose",
        stage_type="lost",
        order_index=2
    )
    db_session.add_all([stage_prospect, stage_won, stage_lost])
    db_session.commit()

    # Criar Produto no Catálogo
    product = CRMProduct(
        client_id=client.id,
        name="Mentoria VIP",
        price=997.0,
        is_active=True
    )
    db_session.add(product)
    db_session.commit()

    return {
        "client": client,
        "pipeline": pipeline,
        "stages": {
            "prospect": stage_prospect,
            "won": stage_won,
            "lost": stage_lost
        },
        "product": product
    }

def test_process_webhook_kanban_creates_new_deal(db_session: Session, test_setup):
    client = test_setup["client"]
    stage = test_setup["stages"]["prospect"]

    mapping = WebhookEventMapping(
        event_type="lead_novo",
        kanban_active=True,
        kanban_pipeline_id=stage.pipeline_id,
        kanban_stage_id=stage.id,
        kanban_product_name="Mentoria VIP",
        kanban_value=997.0
    )

    deal = process_webhook_kanban_trigger(
        db=db_session,
        client_id=client.id,
        mapping=mapping,
        phone="5511999991111",
        name="Carlos Silva",
        email="carlos@teste.com",
        platform="kiwify"
    )

    assert deal is not None
    assert deal.contact_phone == "5511999991111"
    assert deal.contact_name == "Carlos Silva"
    assert deal.stage_id == stage.id
    assert deal.product_name == "Mentoria VIP"
    assert deal.value == 997.0
    assert deal.status == "open"
    assert deal.channel == "kiwify"

def test_process_webhook_kanban_updates_existing_deal(db_session: Session, test_setup):
    client = test_setup["client"]
    pipeline = test_setup["pipeline"]
    stage_prospect = test_setup["stages"]["prospect"]
    stage_won = test_setup["stages"]["won"]

    # Deal pré-existente
    existing = SalesDeal(
        client_id=client.id,
        pipeline_id=pipeline.id,
        stage_id=stage_prospect.id,
        contact_phone="5511999992222",
        contact_name="Mariana Souza",
        title="Oportunidade - Mariana Souza",
        value=500.0,
        status="open"
    )
    db_session.add(existing)
    db_session.commit()

    # Webhook de compra aprovada move para estágio WON
    mapping = WebhookEventMapping(
        event_type="compra_aprovada",
        kanban_active=True,
        kanban_pipeline_id=pipeline.id,
        kanban_stage_id=stage_won.id,
        kanban_product_name="Mentoria VIP",
        kanban_value=997.0
    )

    deal = process_webhook_kanban_trigger(
        db=db_session,
        client_id=client.id,
        mapping=mapping,
        phone="5511999992222",
        name="Mariana Souza",
        platform="hotmart"
    )

    assert deal is not None
    assert deal.id == existing.id
    assert deal.stage_id == stage_won.id
    assert deal.status == "won"
    assert deal.value == 997.0

    # Certifica que não criou deal duplicado
    total_deals = db_session.query(SalesDeal).filter(
        SalesDeal.client_id == client.id,
        SalesDeal.contact_phone == "5511999992222"
    ).count()
    assert total_deals == 1

def test_process_webhook_kanban_lost_stage_saves_reason(db_session: Session, test_setup):
    client = test_setup["client"]
    pipeline = test_setup["pipeline"]
    stage_lost = test_setup["stages"]["lost"]

    mapping = WebhookEventMapping(
        event_type="recusado",
        kanban_active=True,
        kanban_pipeline_id=pipeline.id,
        kanban_stage_id=stage_lost.id,
        kanban_lost_reason="Cartão com saldo insuficiente"
    )

    deal = process_webhook_kanban_trigger(
        db=db_session,
        client_id=client.id,
        mapping=mapping,
        phone="5511999993333",
        name="Pedro Santos",
        platform="eduzz"
    )

    assert deal is not None
    assert deal.stage_id == stage_lost.id
    assert deal.status == "lost"
    assert deal.lost_reason == "Cartão com saldo insuficiente"

def test_process_webhook_kanban_inactive_ignores(db_session: Session, test_setup):
    client = test_setup["client"]
    mapping = WebhookEventMapping(
        event_type="lead",
        kanban_active=False
    )

    deal = process_webhook_kanban_trigger(
        db=db_session,
        client_id=client.id,
        mapping=mapping,
        phone="5511999994444"
    )

    assert deal is None

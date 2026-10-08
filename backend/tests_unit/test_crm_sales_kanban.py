import pytest
import sys, os
from datetime import datetime, timedelta, timezone

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
from models.crm import SalesPipeline, SalesPipelineStage, SalesDeal
from services import crm_service
from routers.crm import (
    list_pipelines,
    create_pipeline,
    get_pipeline_board,
    create_deal,
    move_deal,
    sync_pipeline_history_endpoint
)
from schemas_domain import crm as schemas_crm

def setup_crm_test_db():
    engine = create_engine("sqlite:///:memory:")
    models.Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    client = models.Client(id=1, name="Cliente Teste CRM", is_active=True)
    user = models.User(id=1, email="admin@crm.com", role="super_admin", client_id=1)
    db.add_all([client, user])
    db.commit()

    return db, client, user


def test_default_pipeline_creation_and_stages():
    db, client, user = setup_crm_test_db()

    # Quando cliente não tem pipeline, list_pipelines deve gerar o padrão
    pipelines = list_pipelines(client_id=1, db=db, current_user=user)
    assert len(pipelines) == 1
    default_pipe = pipelines[0]
    assert default_pipe["name"] == "Pipeline Geral de Vendas"
    assert default_pipe["stages_count"] == 6

    # Verificar board do pipeline
    board = get_pipeline_board(pipeline_id=default_pipe["id"], client_id=1, db=db, current_user=user)
    assert len(board["stages"]) == 6
    assert board["stages"][0]["name"] == "Carrinho Abandonado"
    assert board["stages"][4]["name"] == "Venda Concluída"
    assert board["total_deals"] == 0

    db.close()


def test_create_custom_product_pipeline():
    db, client, user = setup_crm_test_db()

    payload = schemas_crm.SalesPipelineCreate(
        name="Mentoria High Ticket",
        product_name="Mentoria Elite",
        associated_tags="mentoria, vip, black",
        is_default=False
    )
    new_pipe = create_pipeline(payload=payload, client_id=1, db=db, current_user=user)
    assert new_pipe["name"] == "Mentoria High Ticket"
    assert new_pipe["product_name"] == "Mentoria Elite"
    assert new_pipe["associated_tags"] == "mentoria, vip, black"
    assert new_pipe["stages_count"] == 6

    db.close()


def test_deal_creation_and_movement():
    db, client, user = setup_crm_test_db()
    crm_service.get_or_create_default_pipeline(db, 1)

    pipe = db.query(SalesPipeline).filter(SalesPipeline.client_id == 1).first()
    stages = db.query(SalesPipelineStage).filter(SalesPipelineStage.pipeline_id == pipe.id).order_by(SalesPipelineStage.order_index.asc()).all()
    initial_stage = stages[0]
    won_stage = next(s for s in stages if s.stage_type == "won")

    # 1. Criar Deal
    deal_payload = schemas_crm.SalesDealCreate(
        pipeline_id=pipe.id,
        stage_id=initial_stage.id,
        contact_phone="5511988887777",
        contact_name="Carlos Eduardo",
        contact_email="carlos@exemplo.com",
        title="Oportunidade Mentoria",
        value=2500.00
    )
    deal = create_deal(payload=deal_payload, client_id=1, db=db, current_user=user)
    assert deal.id is not None
    assert deal.contact_name == "Carlos Eduardo"
    assert deal.value == 2500.00
    assert deal.status == "open"

    # 2. Mover Deal para 'Venda Concluída' (drag & drop)
    move_payload = schemas_crm.SalesDealMove(stage_id=won_stage.id)
    moved_deal = move_deal(deal_id=deal.id, payload=move_payload, client_id=1, db=db, current_user=user)
    assert moved_deal.stage_id == won_stage.id
    assert moved_deal.status == "won"

    # 3. Conferir board atualizado
    board = get_pipeline_board(pipeline_id=pipe.id, client_id=1, db=db, current_user=user)
    assert board["total_deals"] == 1
    assert board["total_value"] == 2500.00
    assert board["total_won_deals"] == 1
    assert board["total_won_value"] == 2500.00

    db.close()


def test_sync_pipeline_history():
    db, client, user = setup_crm_test_db()

    # Criar Leads históricos no banco
    lead_abandoned = models.WebhookLead(
        client_id=1,
        name="Lead Abandonou",
        phone="5511911112222",
        product_name="Curso Master",
        last_event_type="carrinho_abandonado",
        price="497.00"
    )
    lead_approved = models.WebhookLead(
        client_id=1,
        name="Lead Comprou",
        phone="5511933334444",
        product_name="Curso Master",
        last_event_type="compra_aprovada",
        price="497.00"
    )
    db.add_all([lead_abandoned, lead_approved])
    db.commit()

    # Criar Pipeline para o produto
    pipe = SalesPipeline(
        client_id=1,
        name="Pipeline Curso Master",
        product_name="Curso Master"
    )
    db.add(pipe)
    db.commit()
    db.refresh(pipe)
    crm_service.create_default_stages(db, pipe.id, 1)

    # Executar sincronização retroativa
    res = sync_pipeline_history_endpoint(pipeline_id=pipe.id, client_id=1, db=db, current_user=user)
    assert res["total_synced"] == 2
    assert res["created_deals"] == 2

    # Validar que caíram nas colunas certas
    board = get_pipeline_board(pipeline_id=pipe.id, client_id=1, db=db, current_user=user)
    assert board["total_deals"] == 2
    assert board["total_won_deals"] == 1
    assert board["total_won_value"] == 497.00

    db.close()


def test_automatic_crm_hooks():
    db, client, user = setup_crm_test_db()

    # Pipeline com tag associada 'vip'
    pipe = SalesPipeline(
        client_id=1,
        name="Pipeline VIP",
        product_name="Mentoria VIP",
        associated_tags="vip, mentoria"
    )
    db.add(pipe)
    db.commit()
    db.refresh(pipe)
    crm_service.create_default_stages(db, pipe.id, 1)

    # 1. Testar hook de tag aplicada
    crm_service.process_tag_applied_for_crm(
        db=db,
        client_id=1,
        phone="5511977778888",
        name="Lead da Tag",
        tag="vip"
    )

    deal = db.query(SalesDeal).filter(
        SalesDeal.pipeline_id == pipe.id,
        SalesDeal.contact_phone == "5511977778888"
    ).first()
    assert deal is not None
    assert deal.contact_name == "Lead da Tag"

    # 2. Testar hook de webhook de venda recebido (compra aprovada)
    crm_service.process_webhook_lead_for_crm(
        db=db,
        client_id=1,
        phone="5511977778888",
        name="Lead da Tag",
        product_name="Mentoria VIP",
        event_type="compra_aprovada",
        value=3000.00
    )

    db.refresh(deal)
    assert deal.status == "won"
    assert deal.value == 3000.00

    db.close()


def test_pipeline_default_value_propagation():
    db, client, user = setup_crm_test_db()

    # 1. Criar pipeline com default_value de 997.00
    payload = schemas_crm.SalesPipelineCreate(
        name="Curso Especial de Astrologia",
        product_name="Bússola Astrológica",
        associated_tags="astrologia",
        default_value=997.00
    )
    pipe_res = create_pipeline(payload=payload, client_id=1, db=db, current_user=user)
    assert pipe_res["default_value"] == 997.00

    pipe = db.query(SalesPipeline).filter(SalesPipeline.id == pipe_res["id"]).first()
    stages = db.query(SalesPipelineStage).filter(SalesPipelineStage.pipeline_id == pipe.id).all()
    first_stage = stages[0]

    # 2. Criar deal sem informar valor (0.0) -> deve herdar 997.00 do pipeline
    deal_payload = schemas_crm.SalesDealCreate(
        pipeline_id=pipe.id,
        stage_id=first_stage.id,
        contact_phone="5511999990000",
        contact_name="Aluno Astrologia",
        value=0.0
    )
    deal_res = create_deal(payload=deal_payload, client_id=1, db=db, current_user=user)
    assert deal_res.value == 997.00

    # 3. Aplicar etiqueta -> novo deal deve nascer com o default_value de 997.00
    crm_service.process_tag_applied_for_crm(
        db=db,
        client_id=1,
        phone="5511988881111",
        name="Lead Astrologia Tag",
        tag="astrologia"
    )
    tag_deal = db.query(SalesDeal).filter(
        SalesDeal.pipeline_id == pipe.id,
        SalesDeal.contact_phone == "5511988881111"
    ).first()
    assert tag_deal is not None
    assert tag_deal.value == 997.00

    db.close()

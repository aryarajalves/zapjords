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
    sync_pipeline_history_endpoint,
    bulk_delete_deals,
    bulk_update_deals
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

    # Verificar board do pipeline com as 6 colunas padrão
    board = get_pipeline_board(pipeline_id=default_pipe["id"], client_id=1, db=db, current_user=user)
    assert len(board["stages"]) == 6
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


def test_deal_channel_creation_and_update():
    from routers.crm import update_deal
    db, client, user = setup_crm_test_db()
    crm_service.get_or_create_default_pipeline(db, 1)

    pipe = db.query(SalesPipeline).filter(SalesPipeline.client_id == 1).first()
    stages = db.query(SalesPipelineStage).filter(SalesPipelineStage.pipeline_id == pipe.id).all()
    stage = stages[0]

    # 1. Criar deal com canal 'kiwify'
    deal_payload = schemas_crm.SalesDealCreate(
        pipeline_id=pipe.id,
        stage_id=stage.id,
        contact_phone="5511999997777",
        contact_name="Lead Kiwify",
        channel="kiwify",
        value=197.00
    )
    deal = create_deal(payload=deal_payload, client_id=1, db=db, current_user=user)
    assert deal.channel == "kiwify"

    # 2. Atualizar canal do deal para 'hotmart'
    update_payload = schemas_crm.SalesDealUpdate(
        channel="hotmart"
    )
    updated = update_deal(deal_id=deal.id, payload=update_payload, client_id=1, db=db, current_user=user)
    assert updated.channel == "hotmart"

    # 3. Criar deal sem informar canal -> deve assumir fallback 'whatsapp'
    deal_payload_fallback = schemas_crm.SalesDealCreate(
        pipeline_id=pipe.id,
        stage_id=stage.id,
        contact_phone="5511999998888",
        contact_name="Lead WhatsApp",
        value=97.00
    )
    deal_fallback = create_deal(payload=deal_payload_fallback, client_id=1, db=db, current_user=user)
    assert deal_fallback.channel == "whatsapp"

    db.close()


def test_stage_creation_update_and_deletion():
    from routers.crm import create_stage, update_stage, delete_stage
    db, client, user = setup_crm_test_db()
    crm_service.get_or_create_default_pipeline(db, 1)

    pipe = db.query(SalesPipeline).filter(SalesPipeline.client_id == 1).first()
    initial_stages_count = db.query(SalesPipelineStage).filter(SalesPipelineStage.pipeline_id == pipe.id).count()

    # 1. Criar nova coluna customizada no CRM
    stage_payload = schemas_crm.SalesPipelineStageCreate(
        pipeline_id=pipe.id,
        name="Demonstração Agendada",
        color="indigo",
        stage_type="in_progress"
    )
    new_stage = create_stage(payload=stage_payload, client_id=1, db=db, current_user=user)
    assert new_stage.id is not None
    assert new_stage.name == "Demonstração Agendada"
    assert new_stage.color == "indigo"

    # 2. Atualizar coluna
    stage_update = schemas_crm.SalesPipelineStageUpdate(
        name="Demo Concluída",
        color="cyan"
    )
    updated_stage = update_stage(stage_id=new_stage.id, payload=stage_update, client_id=1, db=db, current_user=user)
    assert updated_stage.name == "Demo Concluída"
    assert updated_stage.color == "cyan"

    # 3. Adicionar deal nessa coluna
    deal_payload = schemas_crm.SalesDealCreate(
        pipeline_id=pipe.id,
        stage_id=new_stage.id,
        contact_phone="5511966665555",
        contact_name="Lead Demo",
        channel="bussola_quiz",
        value=500.00
    )
    deal = create_deal(payload=deal_payload, client_id=1, db=db, current_user=user)
    assert deal.stage_id == new_stage.id

    # 4. Excluir a coluna -> deal deve ser migrado automaticamente para outro estágio do pipeline
    del_res = delete_stage(stage_id=new_stage.id, client_id=1, db=db, current_user=user)
    assert "sucesso" in del_res["message"]

    db.refresh(deal)
    assert deal.stage_id != new_stage.id
    assert db.query(SalesPipelineStage).filter(SalesPipelineStage.id == new_stage.id).first() is None

    db.close()


def test_deal_move_to_desistencia_with_reason():
    db, client, user = setup_crm_test_db()
    crm_service.get_or_create_default_pipeline(db, 1)

    pipe = db.query(SalesPipeline).filter(SalesPipeline.client_id == 1).first()
    stages = db.query(SalesPipelineStage).filter(SalesPipelineStage.pipeline_id == pipe.id).order_by(SalesPipelineStage.order_index.asc()).all()
    initial_stage = stages[0]
    desistencia_stage = next(s for s in stages if s.stage_type == "lost")

    deal = create_deal(
        payload=schemas_crm.SalesDealCreate(
            pipeline_id=pipe.id,
            stage_id=initial_stage.id,
            contact_phone="5511999998888",
            contact_name="Lead Desistente",
            value=300.00
        ),
        client_id=1,
        db=db,
        current_user=user
    )

    move_payload = schemas_crm.SalesDealMove(
        stage_id=desistencia_stage.id,
        lost_reason="Achou o preço muito alto"
    )
    moved = move_deal(deal_id=deal.id, payload=move_payload, client_id=1, db=db, current_user=user)
    assert moved.stage_id == desistencia_stage.id
    assert moved.status == "lost"
    assert moved.lost_reason == "Achou o preço muito alto"

    db.close()


def test_pipeline_board_conversion_rate_and_stage_percentages():
    db, client, user = setup_crm_test_db()
    crm_service.get_or_create_default_pipeline(db, 1)

    pipe = db.query(SalesPipeline).filter(SalesPipeline.client_id == 1).first()
    stages = db.query(SalesPipelineStage).filter(SalesPipelineStage.pipeline_id == pipe.id).order_by(SalesPipelineStage.order_index.asc()).all()
    lead_stage = stages[1]
    won_stage = next(s for s in stages if s.stage_type == 'won')

    for i in range(8):
        create_deal(
            payload=schemas_crm.SalesDealCreate(
                pipeline_id=pipe.id,
                stage_id=lead_stage.id,
                contact_phone=f'551199999000{i}',
                contact_name=f'Lead {i}',
                value=100.00
            ),
            client_id=1,
            db=db,
            current_user=user
        )

    for j in range(2):
        create_deal(
            payload=schemas_crm.SalesDealCreate(
                pipeline_id=pipe.id,
                stage_id=won_stage.id,
                contact_phone=f'551198888000{j}',
                contact_name=f'Comprador {j}',
                value=500.00,
                status='won'
            ),
            client_id=1,
            db=db,
            current_user=user
        )

    board = get_pipeline_board(pipeline_id=pipe.id, client_id=1, db=db, current_user=user)
    assert board['total_deals'] == 10
    assert board['total_won_deals'] == 2
    assert board['conversion_rate'] == 20.0

    lead_board_stage = next(s for s in board['stages'] if s['id'] == lead_stage.id)
    won_board_stage = next(s for s in board['stages'] if s['id'] == won_stage.id)

    assert lead_board_stage['total_deals'] == 8
    assert lead_board_stage['percentage'] == 80.0

    assert won_board_stage['total_deals'] == 2
    assert won_board_stage['percentage'] == 20.0

    db.close()


def test_bulk_delete_deals_success():
    db, client, user = setup_crm_test_db()
    crm_service.get_or_create_default_pipeline(db, 1)

    pipe = db.query(SalesPipeline).filter(SalesPipeline.client_id == 1).first()
    stages = db.query(SalesPipelineStage).filter(SalesPipelineStage.pipeline_id == pipe.id).all()
    stage = stages[0]

    # Criar 3 deals
    deals = []
    for i in range(3):
        d = create_deal(
            payload=schemas_crm.SalesDealCreate(
                pipeline_id=pipe.id,
                stage_id=stage.id,
                contact_phone=f"551199999000{i}",
                contact_name=f"Lead {i}",
                value=100.0
            ),
            client_id=1,
            db=db,
            current_user=user
        )
        deals.append(d)

    assert db.query(SalesDeal).filter(SalesDeal.client_id == 1).count() == 3

    # Deletar os 2 primeiros em massa
    res = bulk_delete_deals(
        payload=schemas_crm.SalesDealBulkDelete(deal_ids=[deals[0].id, deals[1].id]),
        client_id=1,
        db=db,
        current_user=user
    )
    assert res["count"] == 2

    # Apenas o terceiro deve restar
    remaining = db.query(SalesDeal).filter(SalesDeal.client_id == 1).all()
    assert len(remaining) == 1
    assert remaining[0].id == deals[2].id

    db.close()


def test_bulk_update_deals_product_and_value():
    db, client, user = setup_crm_test_db()
    crm_service.get_or_create_default_pipeline(db, 1)

    pipe = db.query(SalesPipeline).filter(SalesPipeline.client_id == 1).first()
    stages = db.query(SalesPipelineStage).filter(SalesPipelineStage.pipeline_id == pipe.id).all()
    stage = stages[0]

    # Criar 2 produtos no catálogo
    prod1 = models.crm.CRMProduct(client_id=1, name="Curso Alpha", price=197.00)
    prod2 = models.crm.CRMProduct(client_id=1, name="Mentoria Beta", price=997.00)
    db.add_all([prod1, prod2])
    db.commit()

    # Criar 3 deals com valor inicial de 50.00
    deals = []
    for i in range(3):
        d = create_deal(
            payload=schemas_crm.SalesDealCreate(
                pipeline_id=pipe.id,
                stage_id=stage.id,
                contact_phone=f"558599999000{i}",
                contact_name=f"Aluno {i}",
                value=50.0
            ),
            client_id=1,
            db=db,
            current_user=user
        )
        deals.append(d)

    # Atualizar deals 0 e 1 para Mentoria Beta com valor personalizado 797.00
    res = bulk_update_deals(
        payload=schemas_crm.SalesDealBulkUpdate(
            deal_ids=[deals[0].id, deals[1].id],
            update_product=True,
            product_id=prod2.id,
            update_value=True,
            value=797.00
        ),
        client_id=1,
        db=db,
        current_user=user
    )
    assert res["count"] == 2

    db.refresh(deals[0])
    db.refresh(deals[1])
    db.refresh(deals[2])

    assert deals[0].product_name == "Mentoria Beta"
    assert deals[0].product_id == prod2.id
    assert deals[0].original_value == 997.00
    assert deals[0].value == 797.00

    assert deals[1].product_name == "Mentoria Beta"
    assert deals[1].value == 797.00

    # Deal 2 não foi afetado
    assert deals[2].product_name is None
    assert deals[2].value == 50.00

    db.close()


def test_bulk_update_deals_only_value_or_only_product():
    db, client, user = setup_crm_test_db()
    crm_service.get_or_create_default_pipeline(db, 1)

    pipe = db.query(SalesPipeline).filter(SalesPipeline.client_id == 1).first()
    stages = db.query(SalesPipelineStage).filter(SalesPipelineStage.pipeline_id == pipe.id).all()
    stage = stages[0]

    d1 = create_deal(
        payload=schemas_crm.SalesDealCreate(
            pipeline_id=pipe.id,
            stage_id=stage.id,
            contact_phone="5511999991111",
            contact_name="Lead Unico",
            product_name="Produto Antigo",
            value=100.0
        ),
        client_id=1,
        db=db,
        current_user=user
    )

    # Atualizar SOMENTE o preço
    bulk_update_deals(
        payload=schemas_crm.SalesDealBulkUpdate(
            deal_ids=[d1.id],
            update_product=False,
            update_value=True,
            value=250.00
        ),
        client_id=1,
        db=db,
        current_user=user
    )
    db.refresh(d1)
    assert d1.value == 250.00
    assert d1.product_name == "Produto Antigo"

    # Atualizar SOMENTE o produto com nome livre
    bulk_update_deals(
        payload=schemas_crm.SalesDealBulkUpdate(
            deal_ids=[d1.id],
            update_product=True,
            product_name="Novo Produto Top",
            update_value=False
        ),
        client_id=1,
        db=db,
        current_user=user
    )
    db.refresh(d1)
    assert d1.value == 250.00
    assert d1.product_name == "Novo Produto Top"

    db.close()


def test_bulk_operations_client_isolation():
    db, client, user = setup_crm_test_db()
    crm_service.get_or_create_default_pipeline(db, 1)

    # Cliente 2
    client2 = models.Client(id=2, name="Outro Cliente", is_active=True)
    user2 = models.User(id=2, email="outro@crm.com", role="super_admin", client_id=2)
    db.add_all([client2, user2])
    db.commit()
    crm_service.get_or_create_default_pipeline(db, 2)

    pipe1 = db.query(SalesPipeline).filter(SalesPipeline.client_id == 1).first()
    pipe2 = db.query(SalesPipeline).filter(SalesPipeline.client_id == 2).first()
    stg1 = db.query(SalesPipelineStage).filter(SalesPipelineStage.pipeline_id == pipe1.id).first()
    stg2 = db.query(SalesPipelineStage).filter(SalesPipelineStage.pipeline_id == pipe2.id).first()

    d1 = create_deal(
        payload=schemas_crm.SalesDealCreate(pipeline_id=pipe1.id, stage_id=stg1.id, contact_phone="5511999991111", value=100.0),
        client_id=1, db=db, current_user=user
    )
    d2 = create_deal(
        payload=schemas_crm.SalesDealCreate(pipeline_id=pipe2.id, stage_id=stg2.id, contact_phone="5511999992222", value=200.0),
        client_id=2, db=db, current_user=user2
    )

    # Cliente 1 tenta deletar deal do Cliente 2
    res_del = bulk_delete_deals(
        payload=schemas_crm.SalesDealBulkDelete(deal_ids=[d2.id]),
        client_id=1,
        db=db,
        current_user=user
    )
    assert res_del["count"] == 0
    assert db.query(SalesDeal).filter(SalesDeal.id == d2.id).first() is not None

    # Cliente 1 tenta atualizar deal do Cliente 2
    res_upd = bulk_update_deals(
        payload=schemas_crm.SalesDealBulkUpdate(deal_ids=[d2.id], update_value=True, value=999.0),
        client_id=1,
        db=db,
        current_user=user
    )
    assert res_upd["count"] == 0
    db.refresh(d2)
    assert d2.value == 200.0

    db.close()

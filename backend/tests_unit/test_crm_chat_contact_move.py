import pytest
import sys, os
from datetime import datetime, timezone

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
from models.crm import SalesPipeline, SalesPipelineStage, SalesDeal, CRMProduct
from routers.crm import (
    list_pipelines,
    get_deal_by_phone,
    move_or_upsert_contact_deal
)
from schemas_domain import crm as schemas_crm

def setup_test_db():
    engine = create_engine("sqlite:///:memory:")
    models.Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    client = models.Client(id=1, name="Cliente Teste CRM Chat", is_active=True)
    user = models.User(id=1, email="admin@crm.com", role="super_admin", client_id=1)
    db.add_all([client, user])
    db.commit()

    return db, client, user

def test_chat_get_deal_by_phone_empty():
    db, client, user = setup_test_db()
    # Verifica que contato sem deal retorna None
    deal = get_deal_by_phone(phone="5511999998888", client_id=1, db=db, current_user=user)
    assert deal is None
    db.close()

def test_chat_move_or_upsert_contact_creates_deal():
    db, client, user = setup_test_db()

    # Cria pipeline padrão
    pipelines = list_pipelines(client_id=1, db=db, current_user=user)
    pipe_id = pipelines[0]["id"]
    stages = db.query(SalesPipelineStage).filter(SalesPipelineStage.pipeline_id == pipe_id).all()
    stage_prospect = next(s for s in stages if s.name == "Prospect")

    # Cadastra produto
    prod = CRMProduct(client_id=1, name="Curso Growth", price=997.0)
    db.add(prod)
    db.commit()

    # Mover contato pela conversa (criação automática se ainda não existe)
    payload = schemas_crm.SalesDealContactMovePayload(
        pipeline_id=pipe_id,
        stage_id=stage_prospect.id,
        contact_phone="5511999998888",
        contact_name="Carlos Silva",
        product_id=prod.id,
        product_name=prod.name,
        value=997.0,
        notes="Lead veio do chat querendo saber sobre o curso"
    )

    deal = move_or_upsert_contact_deal(payload=payload, client_id=1, db=db, current_user=user)
    assert deal is not None
    assert deal.contact_phone == "5511999998888"
    assert deal.contact_name == "Carlos Silva"
    assert deal.stage_id == stage_prospect.id
    assert deal.status == "open"
    assert deal.value == 997.0
    assert deal.product_name == "Curso Growth"

    # Agora get_deal_by_phone deve retornar este deal
    found_deal = get_deal_by_phone(phone="5511999998888", client_id=1, db=db, current_user=user)
    assert found_deal is not None
    assert found_deal.id == deal.id
    assert found_deal.stage_id == stage_prospect.id

    db.close()

def test_chat_move_contact_to_next_stage_and_desistencia():
    db, client, user = setup_test_db()

    pipelines = list_pipelines(client_id=1, db=db, current_user=user)
    pipe_id = pipelines[0]["id"]
    stages = db.query(SalesPipelineStage).filter(SalesPipelineStage.pipeline_id == pipe_id).all()
    stage_prospect = next(s for s in stages if s.name == "Prospect")
    stage_lead = next(s for s in stages if s.name == "Lead")
    stage_desist = next(s for s in stages if "desist" in s.name.lower())

    # 1. Cria deal na etapa Prospect
    payload1 = schemas_crm.SalesDealContactMovePayload(
        pipeline_id=pipe_id,
        stage_id=stage_prospect.id,
        contact_phone="5511988887777",
        contact_name="Mariana Santos",
        value=500.0
    )
    deal1 = move_or_upsert_contact_deal(payload=payload1, client_id=1, db=db, current_user=user)
    assert deal1.stage_id == stage_prospect.id
    assert deal1.status == "open"

    # 2. Operador avança o lead no chat para a próxima etapa (Lead) com valor ajustado
    payload2 = schemas_crm.SalesDealContactMovePayload(
        pipeline_id=pipe_id,
        stage_id=stage_lead.id,
        contact_phone="5511988887777",
        contact_name="Mariana Santos",
        value=450.0
    )
    deal2 = move_or_upsert_contact_deal(payload=payload2, client_id=1, db=db, current_user=user)
    assert deal2.id == deal1.id  # Mesmo deal atualizado!
    assert deal2.stage_id == stage_lead.id
    assert deal2.value == 450.0
    assert deal2.status == "open"

    # 3. Operador move para Desistência informando o motivo
    payload3 = schemas_crm.SalesDealContactMovePayload(
        pipeline_id=pipe_id,
        stage_id=stage_desist.id,
        contact_phone="5511988887777",
        lost_reason="Achou que o horário não atendia"
    )
    deal3 = move_or_upsert_contact_deal(payload=payload3, client_id=1, db=db, current_user=user)
    assert deal3.id == deal1.id
    assert deal3.stage_id == stage_desist.id
    assert deal3.status == "lost"
    assert deal3.lost_reason == "Achou que o horário não atendia"

    db.close()

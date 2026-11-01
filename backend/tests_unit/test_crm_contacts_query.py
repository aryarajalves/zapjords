import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
from models.crm import SalesPipeline, SalesPipelineStage, SalesDeal
from routers.crm import query_kanban_contacts, KanbanContactsQueryPayload

def setup_test_db():
    engine = create_engine("sqlite:///:memory:")
    models.Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    client = models.Client(id=1, name="Cliente Teste CRM", is_active=True)
    user = models.User(id=1, email="admin@crm.com", role="super_admin", client_id=1)
    db.add_all([client, user])
    db.commit()

    return db, client, user

def test_query_kanban_contacts_multi_pipeline_unit():
    db, client, user = setup_test_db()
    client_id = client.id

    # Pipeline 1
    pipe1 = SalesPipeline(name="Pipeline 1", client_id=client_id)
    db.add(pipe1)
    db.commit()

    stage1 = SalesPipelineStage(pipeline_id=pipe1.id, client_id=client_id, name="Lead Novo", order_index=0)
    stage2 = SalesPipelineStage(pipeline_id=pipe1.id, client_id=client_id, name="Negociando", order_index=1)
    db.add_all([stage1, stage2])
    db.commit()

    deal1 = SalesDeal(pipeline_id=pipe1.id, stage_id=stage1.id, client_id=client_id, contact_phone="5511999991111", contact_name="Lead P1 S1")
    deal2 = SalesDeal(pipeline_id=pipe1.id, stage_id=stage2.id, client_id=client_id, contact_phone="5511999992222", contact_name="Lead P1 S2")
    db.add_all([deal1, deal2])

    # Pipeline 2
    pipe2 = SalesPipeline(name="Pipeline 2", client_id=client_id)
    db.add(pipe2)
    db.commit()

    stage3 = SalesPipelineStage(pipeline_id=pipe2.id, client_id=client_id, name="Checkout Iniciado", order_index=0)
    db.add(stage3)
    db.commit()

    deal3 = SalesDeal(pipeline_id=pipe2.id, stage_id=stage3.id, client_id=client_id, contact_phone="5511999993333", contact_name="Lead P2 S3")
    db.add(deal3)
    db.commit()

    # 1. Query all from both pipelines (no stage filter)
    payload_all = KanbanContactsQueryPayload(pipeline_ids=[pipe1.id, pipe2.id])
    res_all = query_kanban_contacts(payload=payload_all, client_id=client_id, db=db, current_user=user)
    assert res_all["total"] == 3
    phones = [c["phone"] for c in res_all["items"]]
    assert "5511999991111" in phones
    assert "5511999992222" in phones
    assert "5511999993333" in phones

    # 2. Query specific stages across pipelines
    payload_stages = KanbanContactsQueryPayload(
        pipeline_ids=[pipe1.id, pipe2.id],
        stage_ids=[stage1.id, stage3.id]
    )
    res_stages = query_kanban_contacts(payload=payload_stages, client_id=client_id, db=db, current_user=user)
    assert res_stages["total"] == 2
    phones_filtered = [c["phone"] for c in res_stages["items"]]
    assert "5511999991111" in phones_filtered
    assert "5511999993333" in phones_filtered
    assert "5511999992222" not in phones_filtered

    db.close()

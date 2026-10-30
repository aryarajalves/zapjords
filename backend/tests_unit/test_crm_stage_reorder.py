import pytest
import sys, os
from fastapi import HTTPException

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
from models.crm import SalesPipeline, SalesPipelineStage
from routers.crm_stage_order import reorder_stages, StageReorderPayload


def setup_crm_reorder_test_db():
    engine = create_engine("sqlite:///:memory:")
    models.Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    client1 = models.Client(id=1, name="Cliente 1 CRM", is_active=True)
    client2 = models.Client(id=2, name="Cliente 2 CRM", is_active=True)
    user1 = models.User(id=1, email="admin1@crm.com", role="super_admin", client_id=1)
    user2 = models.User(id=2, email="admin2@crm.com", role="super_admin", client_id=2)
    db.add_all([client1, client2, user1, user2])
    db.commit()

    return db, client1, user1, client2, user2


def test_reorder_stages_success():
    db, client1, user1, _, _ = setup_crm_reorder_test_db()

    pipe = SalesPipeline(id=10, client_id=1, name="Pipeline Teste")
    db.add(pipe)
    db.commit()

    stage_a = SalesPipelineStage(id=1, pipeline_id=10, client_id=1, name="Prospect", order_index=0)
    stage_b = SalesPipelineStage(id=2, pipeline_id=10, client_id=1, name="Lead", order_index=1)
    stage_c = SalesPipelineStage(id=3, pipeline_id=10, client_id=1, name="Oportunidade", order_index=2)
    stage_d = SalesPipelineStage(id=4, pipeline_id=10, client_id=1, name="Venda", order_index=3)
    db.add_all([stage_a, stage_b, stage_c, stage_d])
    db.commit()

    # Reordenar para [Venda (4), Prospect (1), Oportunidade (3), Lead (2)]
    payload = StageReorderPayload(stage_ids=[4, 1, 3, 2])
    res = reorder_stages(pipeline_id=10, payload=payload, client_id=1, db=db, current_user=user1)

    assert res["message"] == "Colunas reordenadas com sucesso"
    assert res["stage_ids"] == [4, 1, 3, 2]

    # Verificar banco
    stages = db.query(SalesPipelineStage).filter(SalesPipelineStage.pipeline_id == 10).order_by(SalesPipelineStage.order_index.asc()).all()
    assert [s.id for s in stages] == [4, 1, 3, 2]
    assert [s.order_index for s in stages] == [0, 1, 2, 3]


def test_reorder_stages_partial():
    db, client1, user1, _, _ = setup_crm_reorder_test_db()

    pipe = SalesPipeline(id=10, client_id=1, name="Pipeline Teste")
    db.add(pipe)
    db.commit()

    stage_a = SalesPipelineStage(id=1, pipeline_id=10, client_id=1, name="Prospect", order_index=0)
    stage_b = SalesPipelineStage(id=2, pipeline_id=10, client_id=1, name="Lead", order_index=1)
    stage_c = SalesPipelineStage(id=3, pipeline_id=10, client_id=1, name="Oportunidade", order_index=2)
    db.add_all([stage_a, stage_b, stage_c])
    db.commit()

    # Passa apenas [Oportunidade (3), Prospect (1)], omitindo Lead (2)
    payload = StageReorderPayload(stage_ids=[3, 1])
    res = reorder_stages(pipeline_id=10, payload=payload, client_id=1, db=db, current_user=user1)

    assert res["message"] == "Colunas reordenadas com sucesso"

    stages = db.query(SalesPipelineStage).filter(SalesPipelineStage.pipeline_id == 10).order_by(SalesPipelineStage.order_index.asc()).all()
    assert stages[0].id == 3
    assert stages[0].order_index == 0
    assert stages[1].id == 1
    assert stages[1].order_index == 1
    assert stages[2].id == 2
    assert stages[2].order_index == 2


def test_reorder_stages_pipeline_not_found():
    db, client1, user1, _, _ = setup_crm_reorder_test_db()
    payload = StageReorderPayload(stage_ids=[1, 2])

    with pytest.raises(HTTPException) as exc_info:
        reorder_stages(pipeline_id=999, payload=payload, client_id=1, db=db, current_user=user1)
    assert exc_info.value.status_code == 404


def test_reorder_stages_tenant_isolation():
    db, client1, user1, client2, user2 = setup_crm_reorder_test_db()

    pipe2 = SalesPipeline(id=20, client_id=2, name="Pipeline Cliente 2")
    db.add(pipe2)
    db.commit()

    payload = StageReorderPayload(stage_ids=[1, 2])

    # Cliente 1 não pode acessar nem reordenar pipeline do Cliente 2
    with pytest.raises(HTTPException) as exc_info:
        reorder_stages(pipeline_id=20, payload=payload, client_id=1, db=db, current_user=user1)
    assert exc_info.value.status_code == 404

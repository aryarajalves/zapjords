import pytest
import sys, os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
from models.crm import SalesPipeline, SalesPipelineStage, SalesDeal, CRMProduct
from services import crm_service
from routers.crm import create_deal, update_deal
from routers.crm_products import (
    list_products,
    create_product,
    update_product,
    delete_product
)
from schemas_domain import crm as schemas_crm
from fastapi import HTTPException

def setup_products_test_db():
    engine = create_engine("sqlite:///:memory:")
    models.Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    client1 = models.Client(id=1, name="Cliente 1 CRM", is_active=True)
    client2 = models.Client(id=2, name="Cliente 2 CRM", is_active=True)
    user1 = models.User(id=1, email="admin1@crm.com", role="super_admin", client_id=1)
    user2 = models.User(id=2, email="admin2@crm.com", role="user", client_id=2)
    db.add_all([client1, client2, user1, user2])
    db.commit()

    return db, client1, client2, user1, user2


def test_create_and_list_products():
    db, client1, client2, user1, user2 = setup_products_test_db()

    # 1. Criar dois produtos
    p1 = create_product(
        payload=schemas_crm.CRMProductCreate(name="Astrowake", price=1497.00, description="Curso completo"),
        client_id=1,
        db=db,
        current_user=user1
    )
    p2 = create_product(
        payload=schemas_crm.CRMProductCreate(name="Mentoria VIP", price=6000.00, description="Acompanhamento individual"),
        client_id=1,
        db=db,
        current_user=user1
    )

    assert p1.id is not None
    assert p1.name == "Astrowake"
    assert p1.price == 1497.00

    assert p2.id is not None
    assert p2.name == "Mentoria VIP"
    assert p2.price == 6000.00

    # 2. Listar produtos
    products = list_products(include_inactive=False, client_id=1, db=db, current_user=user1)
    assert len(products) == 2
    assert products[0].name == "Astrowake"
    assert products[1].name == "Mentoria VIP"

    db.close()


def test_products_isolation_by_client_id():
    db, client1, client2, user1, user2 = setup_products_test_db()

    # Criar produto para client 1
    create_product(
        payload=schemas_crm.CRMProductCreate(name="Produto Exclusivo C1", price=250.00),
        client_id=1,
        db=db,
        current_user=user1
    )

    # Client 2 não deve ver
    products_c2 = list_products(include_inactive=False, client_id=2, db=db, current_user=user2)
    assert len(products_c2) == 0

    # Tentar atualizar com client_id diferente deve dar 404
    p1 = db.query(CRMProduct).filter(CRMProduct.client_id == 1).first()
    with pytest.raises(HTTPException) as exc_info:
        update_product(
            product_id=p1.id,
            payload=schemas_crm.CRMProductUpdate(name="Tentativa Hacker"),
            client_id=2,
            db=db,
            current_user=user2
        )
    assert exc_info.value.status_code == 404

    db.close()


def test_update_and_delete_product():
    db, client1, client2, user1, user2 = setup_products_test_db()

    p = create_product(
        payload=schemas_crm.CRMProductCreate(name="Produto Teste", price=100.00),
        client_id=1,
        db=db,
        current_user=user1
    )

    # Atualizar preço
    updated = update_product(
        product_id=p.id,
        payload=schemas_crm.CRMProductUpdate(price=150.00, name="Produto Teste Plus"),
        client_id=1,
        db=db,
        current_user=user1
    )
    assert updated.price == 150.00
    assert updated.name == "Produto Teste Plus"

    # Excluir
    res = delete_product(product_id=p.id, client_id=1, db=db, current_user=user1)
    assert res["message"] == "Produto excluído com sucesso"

    # Não deve mais aparecer na lista
    products = list_products(client_id=1, db=db, current_user=user1)
    assert len(products) == 0

    db.close()


def test_create_deal_with_product_and_discount():
    db, client1, client2, user1, user2 = setup_products_test_db()
    pipe = crm_service.get_or_create_default_pipeline(db, 1)
    stage = db.query(SalesPipelineStage).filter(SalesPipelineStage.pipeline_id == pipe.id).first()

    # 1. Criar produto de tabela no CRM
    product = create_product(
        payload=schemas_crm.CRMProductCreate(name="Mentoria High Ticket", price=5000.00),
        client_id=1,
        db=db,
        current_user=user1
    )

    # 2. Criar Deal com produto selecionado e valor com desconto negociado
    deal_payload = schemas_crm.SalesDealCreate(
        pipeline_id=pipe.id,
        stage_id=stage.id,
        contact_phone="5511999998888",
        contact_name="Lucas Silva",
        product_id=product.id,
        original_value=5000.00,
        value=4200.00,  # Desconto de R$ 800
        channel="whatsapp"
    )
    deal = create_deal(payload=deal_payload, client_id=1, db=db, current_user=user1)

    assert deal.product_id == product.id
    assert deal.product_name == "Mentoria High Ticket"
    assert deal.original_value == 5000.00
    assert deal.value == 4200.00

    # 3. Atualizar valor negociado
    deal_upd = update_deal(
        deal_id=deal.id,
        payload=schemas_crm.SalesDealUpdate(value=3900.00),
        client_id=1,
        db=db,
        current_user=user1
    )
    assert deal_upd.value == 3900.00
    assert deal_upd.original_value == 5000.00

    db.close()


def test_deal_inherits_product_price_when_value_zero():
    db, client1, client2, user1, user2 = setup_products_test_db()
    pipe = crm_service.get_or_create_default_pipeline(db, 1)
    stage = db.query(SalesPipelineStage).filter(SalesPipelineStage.pipeline_id == pipe.id).first()

    product = create_product(
        payload=schemas_crm.CRMProductCreate(name="Curso Base", price=997.00),
        client_id=1,
        db=db,
        current_user=user1
    )

    # Deal criado sem informar value (0.0): deve herdar o preço do produto
    deal_payload = schemas_crm.SalesDealCreate(
        pipeline_id=pipe.id,
        stage_id=stage.id,
        contact_phone="5511977776666",
        contact_name="Ana Paula",
        product_id=product.id,
        value=0.0
    )
    deal = create_deal(payload=deal_payload, client_id=1, db=db, current_user=user1)

    assert deal.original_value == 997.00
    assert deal.value == 997.00
    assert deal.product_name == "Curso Base"

    db.close()

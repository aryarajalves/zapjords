import pytest
from sqlalchemy.orm import Session
import models
from services import crm_service

@pytest.mark.asyncio
async def test_bulk_add_contacts_to_existing_pipeline(db_session: Session):
    db = db_session
    client = models.Client(name="Cliente Bulk CRM Test")
    db.add(client)
    db.commit()
    db.refresh(client)

    pipe = models.SalesPipeline(client_id=client.id, name="Pipeline Vendas 1", is_default=True)
    db.add(pipe)
    db.commit()
    db.refresh(pipe)

    stage = models.SalesPipelineStage(client_id=client.id, pipeline_id=pipe.id, name="Prospect", order_index=0)
    db.add(stage)
    db.commit()
    db.refresh(stage)

    c1 = models.ChatConversation(client_id=client.id, phone="5511988881111", contact_name="Lead Um")
    c2 = models.ChatConversation(client_id=client.id, phone="5511988882222", contact_name="Lead Dois")
    db.add_all([c1, c2])
    db.commit()

    user = models.User(email="admin_bulk_crm@test.com", hashed_password="hash", role="admin")
    db.add(user)
    db.commit()

    # Bulk add by ids
    payload = {
        "ids": [c1.id, c2.id],
        "pipeline_id": pipe.id,
        "stage_id": stage.id,
        "value": 150.0,
        "product_name": "Curso Zap"
    }

    res = crm_service.bulk_add_contacts_to_pipeline(
        db=db,
        client_id=client.id,
        current_user=user,
        payload=payload
    )

    assert res["count"] == 2
    assert res["created"] == 2
    assert res["pipeline_id"] == pipe.id

    # Verify deals in DB
    deals = db.query(models.SalesDeal).filter(
        models.SalesDeal.client_id == client.id,
        models.SalesDeal.pipeline_id == pipe.id
    ).all()
    assert len(deals) == 2
    phones = {d.contact_phone for d in deals}
    assert "5511988881111" in phones
    assert "5511988882222" in phones

    # Verify private notes were created in the conversations
    notes = db.query(models.ChatMessage).filter(
        models.ChatMessage.conversation_id.in_([c1.id, c2.id]),
        models.ChatMessage.sender_type == "system"
    ).all()
    assert len(notes) == 2
    for n in notes:
        assert "🔒 Anotação Privada: Contato adicionado à pipeline 'Pipeline Vendas 1' (Etapa: Prospect)." in n.content

    db.refresh(c1)
    assert c1.private_note == "Contato adicionado à pipeline 'Pipeline Vendas 1' (Etapa: Prospect)."
    assert "🔒 Nota:" in c1.last_message_content


@pytest.mark.asyncio
async def test_bulk_add_contacts_with_new_pipeline(db_session: Session):
    db = db_session
    client = models.Client(name="Cliente New Pipe Test")
    db.add(client)
    db.commit()
    db.refresh(client)

    c1 = models.ChatConversation(client_id=client.id, phone="5511977773333", contact_name="Lead Novo")
    db.add(c1)
    db.commit()

    user = models.User(email="admin_new_pipe@test.com", hashed_password="hash", role="admin")
    db.add(user)
    db.commit()

    # Bulk add creating a NEW pipeline
    payload = {
        "ids": [c1.id],
        "new_pipeline_name": "Pipeline Black Friday 2026",
        "product_name": "Mentoria Elite",
        "value": 2500.0
    }

    res = crm_service.bulk_add_contacts_to_pipeline(
        db=db,
        client_id=client.id,
        current_user=user,
        payload=payload
    )

    assert res["count"] == 1
    assert res["created"] == 1
    assert res["pipeline_name"] == "Pipeline Black Friday 2026"

    # Verify pipeline created with default stages
    new_pipe = db.query(models.SalesPipeline).filter(
        models.SalesPipeline.id == res["pipeline_id"],
        models.SalesPipeline.client_id == client.id
    ).first()
    assert new_pipe is not None
    assert new_pipe.name == "Pipeline Black Friday 2026"
    assert len(new_pipe.stages) >= 4

    # Verify deal created in first stage
    deal = db.query(models.SalesDeal).filter(
        models.SalesDeal.client_id == client.id,
        models.SalesDeal.pipeline_id == new_pipe.id
    ).first()
    assert deal is not None
    assert deal.contact_phone == "5511977773333"
    assert deal.value == 2500.0

    # Verify private note for the newly created pipeline
    note = db.query(models.ChatMessage).filter(
        models.ChatMessage.conversation_id == c1.id,
        models.ChatMessage.sender_type == "system"
    ).first()
    assert note is not None
    assert "🔒 Anotação Privada: Contato adicionado à pipeline 'Pipeline Black Friday 2026'" in note.content


@pytest.mark.asyncio
async def test_bulk_add_contacts_update_existing_deal(db_session: Session):
    db = db_session
    client = models.Client(name="Cliente Deal Update Test")
    db.add(client)
    db.commit()
    db.refresh(client)

    pipe = models.SalesPipeline(client_id=client.id, name="Pipe Update", is_default=True)
    db.add(pipe)
    db.commit()
    db.refresh(pipe)

    stage1 = models.SalesPipelineStage(client_id=client.id, pipeline_id=pipe.id, name="Etapa 1", order_index=0)
    stage2 = models.SalesPipelineStage(client_id=client.id, pipeline_id=pipe.id, name="Etapa 2", order_index=1)
    db.add_all([stage1, stage2])
    db.commit()

    c1 = models.ChatConversation(client_id=client.id, phone="5511966664444", contact_name="Lead Existente")
    db.add(c1)
    db.commit()

    # Pre-existing deal in stage 1
    old_deal = models.SalesDeal(
        client_id=client.id,
        pipeline_id=pipe.id,
        stage_id=stage1.id,
        contact_phone="5511966664444",
        contact_name="Lead Existente"
    )
    db.add(old_deal)
    db.commit()

    user = models.User(email="admin_update_pipe@test.com", hashed_password="hash", role="admin")
    db.add(user)
    db.commit()

    # Move/update to stage 2 in bulk
    payload = {
        "ids": [c1.id],
        "pipeline_id": pipe.id,
        "stage_id": stage2.id
    }

    res = crm_service.bulk_add_contacts_to_pipeline(
        db=db,
        client_id=client.id,
        current_user=user,
        payload=payload
    )

    assert res["count"] == 1
    assert res["updated"] == 1
    assert res["created"] == 0

    # Ensure no duplicate deal created
    deals = db.query(models.SalesDeal).filter(
        models.SalesDeal.client_id == client.id,
        models.SalesDeal.pipeline_id == pipe.id
    ).all()
    assert len(deals) == 1
    assert deals[0].stage_id == stage2.id

    # Verify moved note created
    note = db.query(models.ChatMessage).filter(
        models.ChatMessage.conversation_id == c1.id,
        models.ChatMessage.sender_type == "system"
    ).order_by(models.ChatMessage.id.desc()).first()
    assert note is not None
    assert "🔒 Anotação Privada: Oportunidade movida para a etapa 'Etapa 2' na pipeline 'Pipe Update'." in note.content


@pytest.mark.asyncio
async def test_add_pipeline_private_note_helper(db_session: Session):
    db = db_session
    client = models.Client(name="Cliente Helper Test")
    db.add(client)
    db.commit()
    db.refresh(client)

    convo = models.ChatConversation(client_id=client.id, phone="5511999990000", contact_name="Lead Manual")
    db.add(convo)
    db.commit()
    db.refresh(convo)

    # Call helper directly with phone
    crm_service.add_pipeline_private_note(
        db=db,
        client_id=client.id,
        phone="5511999990000",
        pipeline_name="Funil de Alta Conversão",
        stage_name="Apresentação",
        action_type="added",
        commit=True
    )

    db.refresh(convo)
    assert convo.private_note == "Contato adicionado à pipeline 'Funil de Alta Conversão' (Etapa: Apresentação)."
    assert convo.last_message_content == "🔒 Nota: Contato adicionado à pipeline 'Funil de Alta Conversão' (Etapa: Apresentação)."

    msg = db.query(models.ChatMessage).filter(models.ChatMessage.conversation_id == convo.id).first()
    assert msg is not None
    assert msg.sender_type == "system"
    assert msg.content == "🔒 Anotação Privada: Contato adicionado à pipeline 'Funil de Alta Conversão' (Etapa: Apresentação)."


@pytest.mark.asyncio
async def test_bulk_add_contacts_with_product_catalog_and_price(db_session: Session):
    db = db_session
    client = models.Client(name="Cliente Produto Catálogo")
    db.add(client)
    db.commit()
    db.refresh(client)

    # Cadastrar produto no catálogo CRM
    prod = models.CRMProduct(
        client_id=client.id,
        name="Mentoria Estelar 2026",
        price=2997.00,
        is_active=True
    )
    db.add(prod)

    # Pipeline existente
    pipe = models.SalesPipeline(client_id=client.id, name="Pipeline de Mentoria", is_default=True)
    db.add(pipe)
    db.commit()
    db.refresh(prod)
    db.refresh(pipe)

    stage = models.SalesPipelineStage(client_id=client.id, pipeline_id=pipe.id, name="Oportunidade", order_index=0)
    db.add(stage)

    convo = models.ChatConversation(client_id=client.id, phone="5585991114444", contact_name="Lead Catálogo")
    db.add(convo)
    db.commit()
    db.refresh(convo)

    user = models.User(email="admin_prod@test.com", hashed_password="hash", role="admin")
    db.add(user)
    db.commit()

    # Bulk add passando product_id (sem informar value explícito)
    payload = {
        "ids": [convo.id],
        "pipeline_id": pipe.id,
        "stage_id": stage.id,
        "product_id": prod.id
    }

    res = crm_service.bulk_add_contacts_to_pipeline(
        db=db,
        client_id=client.id,
        current_user=user,
        payload=payload
    )

    assert res["count"] == 1
    deal = db.query(models.SalesDeal).filter(
        models.SalesDeal.client_id == client.id,
        models.SalesDeal.pipeline_id == pipe.id
    ).first()

    assert deal is not None
    assert deal.product_id == prod.id
    assert deal.product_name == "Mentoria Estelar 2026"
    assert deal.value == 2997.00
    assert deal.original_value == 2997.00


import pytest
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session
import models
from routers.chat.conversation_modules.toggle_routes import (
    update_conversation_contact_name,
    UpdateContactNamePayload
)

@pytest.mark.asyncio
async def test_update_contact_name_updates_conversation_and_existing_lead(db_session: Session):
    db = db_session
    client = models.Client(name="Cliente Teste Contact Name 1")
    db.add(client)
    db.commit()
    db.refresh(client)

    phone = "5567981360992"
    convo = models.ChatConversation(
        client_id=client.id,
        phone=phone,
        contact_name="Selma Prates"
    )
    db.add(convo)

    lead = models.WebhookLead(
        client_id=client.id,
        name="Selma Prates",
        phone=phone
    )
    db.add(lead)
    db.commit()
    db.refresh(convo)
    db.refresh(lead)

    user = models.User(email="user_edit_name@test.com", hashed_password="hash", role="admin")
    db.add(user)
    db.commit()

    payload = UpdateContactNamePayload(contact_name="Selma Prates VIP")
    res = await update_conversation_contact_name(
        conversation_id=convo.id,
        payload=payload,
        client_id=client.id,
        current_user=user,
        db=db
    )

    assert res["status"] == "ok"
    assert res["contact_name"] == "Selma Prates VIP"
    assert res["leads_updated"] >= 1

    db.refresh(convo)
    db.refresh(lead)
    assert convo.contact_name == "Selma Prates VIP"
    assert lead.name == "Selma Prates VIP"


@pytest.mark.asyncio
async def test_update_contact_name_creates_lead_if_not_exists(db_session: Session):
    db = db_session
    client = models.Client(name="Cliente Teste Contact Name 2")
    db.add(client)
    db.commit()
    db.refresh(client)

    phone = "5511988887777"
    convo = models.ChatConversation(
        client_id=client.id,
        phone=phone,
        contact_name="Sem Cadastro"
    )
    db.add(convo)
    db.commit()
    db.refresh(convo)

    user = models.User(email="user_create_lead@test.com", hashed_password="hash", role="admin")
    db.add(user)
    db.commit()

    # Antes da edição, não existe nenhum lead para esse número
    existing = db.query(models.WebhookLead).filter(
        models.WebhookLead.client_id == client.id,
        models.WebhookLead.phone == phone
    ).first()
    assert existing is None

    payload = UpdateContactNamePayload(contact_name="Novo Lead Criado")
    res = await update_conversation_contact_name(
        conversation_id=convo.id,
        payload=payload,
        client_id=client.id,
        current_user=user,
        db=db
    )

    assert res["status"] == "ok"
    assert res["contact_name"] == "Novo Lead Criado"

    # Agora o lead existe e tem o novo nome sincronizado
    new_lead = db.query(models.WebhookLead).filter(
        models.WebhookLead.client_id == client.id,
        models.WebhookLead.phone == phone
    ).first()
    assert new_lead is not None
    assert new_lead.name == "Novo Lead Criado"


@pytest.mark.asyncio
async def test_update_contact_name_updates_crm_deal_if_exists(db_session: Session):
    db = db_session
    client = models.Client(name="Cliente Teste Contact Name 3")
    db.add(client)
    db.commit()
    db.refresh(client)

    phone = "5511977776666"
    convo = models.ChatConversation(
        client_id=client.id,
        phone=phone,
        contact_name="Nome Antigo"
    )
    db.add(convo)

    pipeline = models.SalesPipeline(client_id=client.id, name="Pipeline Vendas")
    db.add(pipeline)
    db.commit()
    db.refresh(pipeline)

    stage = models.SalesPipelineStage(client_id=client.id, pipeline_id=pipeline.id, name="Em Aberto", order_index=0)
    db.add(stage)
    db.commit()
    db.refresh(stage)

    deal = models.SalesDeal(
        client_id=client.id,
        pipeline_id=pipeline.id,
        stage_id=stage.id,
        contact_phone=phone,
        contact_name="Nome Antigo"
    )
    db.add(deal)
    db.commit()
    db.refresh(convo)
    db.refresh(deal)

    user = models.User(email="user_deal_sync@test.com", hashed_password="hash", role="admin")
    db.add(user)
    db.commit()

    payload = UpdateContactNamePayload(contact_name="Nome Atualizado Kanban")
    res = await update_conversation_contact_name(
        conversation_id=convo.id,
        payload=payload,
        client_id=client.id,
        current_user=user,
        db=db
    )

    assert res["status"] == "ok"
    db.refresh(deal)
    assert deal.contact_name == "Nome Atualizado Kanban"


@pytest.mark.asyncio
async def test_update_contact_name_validations(db_session: Session):
    db = db_session
    client = models.Client(name="Cliente Teste Contact Name 4")
    db.add(client)
    db.commit()
    db.refresh(client)

    convo = models.ChatConversation(
        client_id=client.id,
        phone="5511966665555",
        contact_name="Teste Validação"
    )
    db.add(convo)
    db.commit()
    db.refresh(convo)

    user = models.User(email="user_val@test.com", hashed_password="hash", role="admin")
    db.add(user)
    db.commit()

    # 1. Rejeita nome vazio
    with pytest.raises(HTTPException) as exc_info:
        await update_conversation_contact_name(
            conversation_id=convo.id,
            payload=UpdateContactNamePayload(contact_name="   "),
            client_id=client.id,
            current_user=user,
            db=db
        )
    assert exc_info.value.status_code == 400

    # 2. Rejeita IDOR (outro client_id)
    with pytest.raises(HTTPException) as exc_info2:
        await update_conversation_contact_name(
            conversation_id=convo.id,
            payload=UpdateContactNamePayload(contact_name="Nome Válido"),
            client_id=999999,
            current_user=user,
            db=db
        )
    assert exc_info2.value.status_code in (403, 404)

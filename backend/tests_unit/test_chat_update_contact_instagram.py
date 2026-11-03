import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session
import models
from routers.chat.conversation_modules.toggle_routes import (
    update_conversation_contact_instagram,
    UpdateContactInstagramPayload
)

@pytest.mark.asyncio
async def test_update_contact_instagram_clean_and_syncs_lead(db_session: Session):
    db = db_session
    client = models.Client(name="Cliente Teste Instagram 1")
    db.add(client)
    db.commit()
    db.refresh(client)

    phone = "5511999990001"
    convo = models.ChatConversation(
        client_id=client.id,
        phone=phone,
        contact_name="Lead Instagram 1",
        instagram=None
    )
    db.add(convo)

    lead = models.WebhookLead(
        client_id=client.id,
        name="Lead Instagram 1",
        phone=phone,
        instagram=None
    )
    db.add(lead)
    db.commit()
    db.refresh(convo)
    db.refresh(lead)

    user = models.User(email="user_insta_1@test.com", hashed_password="hash", role="admin")
    db.add(user)
    db.commit()

    payload = UpdateContactInstagramPayload(instagram="@usuario_teste")
    res = await update_conversation_contact_instagram(
        conversation_id=convo.id,
        payload=payload,
        client_id=client.id,
        current_user=user,
        db=db
    )

    assert res["status"] == "ok"
    assert res["instagram"] == "usuario_teste"
    assert res["leads_updated"] >= 1

    db.refresh(convo)
    db.refresh(lead)
    assert convo.instagram == "usuario_teste"
    assert lead.instagram == "usuario_teste"


@pytest.mark.asyncio
async def test_update_contact_instagram_url_stripping(db_session: Session):
    db = db_session
    client = models.Client(name="Cliente Teste Instagram 2")
    db.add(client)
    db.commit()
    db.refresh(client)

    phone = "5511999990002"
    convo = models.ChatConversation(
        client_id=client.id,
        phone=phone,
        contact_name="Lead Instagram 2"
    )
    db.add(convo)
    db.commit()
    db.refresh(convo)

    user = models.User(email="user_insta_2@test.com", hashed_password="hash", role="admin")
    db.add(user)
    db.commit()

    # Passando uma URL completa com slash no final
    payload = UpdateContactInstagramPayload(instagram="https://www.instagram.com/empresa.oficial/")
    res = await update_conversation_contact_instagram(
        conversation_id=convo.id,
        payload=payload,
        client_id=client.id,
        current_user=user,
        db=db
    )

    assert res["status"] == "ok"
    assert res["instagram"] == "empresa.oficial"

    db.refresh(convo)
    assert convo.instagram == "empresa.oficial"


@pytest.mark.asyncio
async def test_update_contact_instagram_remove_when_empty(db_session: Session):
    db = db_session
    client = models.Client(name="Cliente Teste Instagram 3")
    db.add(client)
    db.commit()
    db.refresh(client)

    phone = "5511999990003"
    convo = models.ChatConversation(
        client_id=client.id,
        phone=phone,
        contact_name="Lead Instagram 3",
        instagram="insta_anterior"
    )
    lead = models.WebhookLead(
        client_id=client.id,
        name="Lead Instagram 3",
        phone=phone,
        instagram="insta_anterior"
    )
    db.add(convo)
    db.add(lead)
    db.commit()
    db.refresh(convo)
    db.refresh(lead)

    user = models.User(email="user_insta_3@test.com", hashed_password="hash", role="admin")
    db.add(user)
    db.commit()

    # Passa string vazia ou apenas espaços
    payload = UpdateContactInstagramPayload(instagram="   ")
    res = await update_conversation_contact_instagram(
        conversation_id=convo.id,
        payload=payload,
        client_id=client.id,
        current_user=user,
        db=db
    )

    assert res["status"] == "ok"
    assert res["instagram"] is None

    db.refresh(convo)
    db.refresh(lead)
    assert convo.instagram is None
    assert lead.instagram is None


@pytest.mark.asyncio
async def test_update_contact_instagram_client_isolation(db_session: Session):
    db = db_session
    client1 = models.Client(name="Cliente 1")
    client2 = models.Client(name="Cliente 2")
    db.add_all([client1, client2])
    db.commit()
    db.refresh(client1)
    db.refresh(client2)

    convo = models.ChatConversation(
        client_id=client1.id,
        phone="5511999990004",
        contact_name="Contato Cliente 1"
    )
    db.add(convo)
    db.commit()
    db.refresh(convo)

    user = models.User(email="user_insta_other@test.com", hashed_password="hash", role="admin")
    db.add(user)
    db.commit()

    # Tentando acessar conversa do client1 com client_id do client2
    payload = UpdateContactInstagramPayload(instagram="@hacker")
    with pytest.raises(HTTPException) as exc_info:
        await update_conversation_contact_instagram(
            conversation_id=convo.id,
            payload=payload,
            client_id=client2.id,
            current_user=user,
            db=db
        )

    assert exc_info.value.status_code in (403, 404)

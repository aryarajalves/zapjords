import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import models
from routers.chat.conversation_modules.status_routes import bulk_block_conversations, bulk_unblock_conversations

@pytest.mark.asyncio
async def test_bulk_block_conversations_permanent(db_session: Session):
    db = db_session
    client = models.Client(name="Cliente Bulk Block Test 1")
    db.add(client)
    db.commit()
    db.refresh(client)

    c1 = models.ChatConversation(client_id=client.id, phone="5511999991111", contact_name="Lead Bloq 1")
    c2 = models.ChatConversation(client_id=client.id, phone="5511999992222", contact_name="Lead Bloq 2")
    db.add_all([c1, c2])
    db.commit()

    user = models.User(email="admin_bloq@test.com", hashed_password="hash", role="admin")
    db.add(user)
    db.commit()

    payload = {
        "ids": [c1.id, c2.id],
        "type": "permanent"
    }

    res = await bulk_block_conversations(
        payload=payload,
        client_id=client.id,
        current_user=user,
        db=db
    )

    assert res["status"] == "success"
    assert res["blocked_count"] == 2
    assert res["already_blocked_count"] == 0

    # Verify BlockedContact in DB
    blocks = db.query(models.BlockedContact).filter(models.BlockedContact.client_id == client.id).all()
    assert len(blocks) == 2
    phones = {b.phone for b in blocks}
    assert "5511999991111" in phones
    assert "5511999992222" in phones


@pytest.mark.asyncio
async def test_bulk_block_conversations_resting(db_session: Session):
    db = db_session
    client = models.Client(name="Cliente Bulk Block Resting")
    db.add(client)
    db.commit()
    db.refresh(client)

    c1 = models.ChatConversation(client_id=client.id, phone="5511977771111", contact_name="Lead Repouso 1")
    c2 = models.ChatConversation(client_id=client.id, phone="5511977772222", contact_name="Lead Repouso 2")
    db.add_all([c1, c2])
    db.commit()

    user = models.User(email="admin_resting@test.com", hashed_password="hash", role="admin")
    db.add(user)
    db.commit()

    payload = {
        "ids": [c1.id, c2.id],
        "type": "resting",
        "hours": 48
    }

    res = await bulk_block_conversations(
        payload=payload,
        client_id=client.id,
        current_user=user,
        db=db
    )

    assert res["status"] == "success"
    assert res["blocked_count"] == 2
    assert "48h" in res["message"]

    # Verify RestingContact in DB
    resting = db.query(models.RestingContact).filter(models.RestingContact.client_id == client.id).all()
    assert len(resting) == 2
    for r in resting:
        assert r.expires_at > datetime.utcnow() + timedelta(hours=40)


@pytest.mark.asyncio
async def test_bulk_block_deduplication(db_session: Session):
    db = db_session
    client = models.Client(name="Cliente Bulk Block Dedup")
    db.add(client)
    db.commit()
    db.refresh(client)

    # Pre-existing block
    already_blocked = models.BlockedContact(client_id=client.id, phone="5511988881234", name="Pre Existing")
    db.add(already_blocked)

    c1 = models.ChatConversation(client_id=client.id, phone="5511988881234", contact_name="Same phone")
    c2 = models.ChatConversation(client_id=client.id, phone="5511988889999", contact_name="New phone")
    db.add_all([c1, c2])
    db.commit()

    user = models.User(email="admin_dedup@test.com", hashed_password="hash", role="admin")
    db.add(user)
    db.commit()

    payload = {
        "ids": [c1.id, c2.id],
        "type": "permanent"
    }

    res = await bulk_block_conversations(
        payload=payload,
        client_id=client.id,
        current_user=user,
        db=db
    )

    assert res["status"] == "success"
    assert res["blocked_count"] == 1
    assert res["already_blocked_count"] == 1


@pytest.mark.asyncio
async def test_bulk_unblock_conversations(db_session: Session):
    db = db_session
    client = models.Client(name="Cliente Bulk Unblock")
    db.add(client)
    db.commit()
    db.refresh(client)

    b1 = models.BlockedContact(client_id=client.id, phone="5511966661111", name="Bloq")
    r1 = models.RestingContact(client_id=client.id, phone="5511966662222", name="Rest", expires_at=datetime.utcnow() + timedelta(days=1))
    c1 = models.ChatConversation(client_id=client.id, phone="5511966661111", contact_name="Convo 1")
    c2 = models.ChatConversation(client_id=client.id, phone="5511966662222", contact_name="Convo 2")
    db.add_all([b1, r1, c1, c2])
    db.commit()

    user = models.User(email="admin_unblock@test.com", hashed_password="hash", role="admin")
    db.add(user)
    db.commit()

    payload = {
        "ids": [c1.id, c2.id]
    }

    res = await bulk_unblock_conversations(
        payload=payload,
        client_id=client.id,
        current_user=user,
        db=db
    )

    assert res["status"] == "success"
    assert res["unblocked_count"] == 1
    assert res["unrested_count"] == 1

    # Verify both removed from DB
    remaining_blocks = db.query(models.BlockedContact).filter(models.BlockedContact.client_id == client.id).all()
    remaining_rests = db.query(models.RestingContact).filter(models.RestingContact.client_id == client.id).all()
    assert len(remaining_blocks) == 0
    assert len(remaining_rests) == 0

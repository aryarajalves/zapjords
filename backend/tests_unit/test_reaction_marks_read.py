import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from models import Client, ChatConversation, ChatMessage, User
from routers.chat.message_action_routes import react_to_message
from routers.chat.common import ReactRequest

@pytest.mark.asyncio
async def test_react_to_message_marks_conversation_as_read(db_session):
    # Setup Client
    client = Client(name="ReactReadClient", is_active=True)
    db_session.add(client)
    db_session.flush()

    # Setup User
    user = User(
        client_id=client.id,
        email="agent@test.com",
        role="admin",
        hashed_password="fake"
    )
    db_session.add(user)
    db_session.flush()

    # Setup Conversation com unread_count = 3
    phone_number = "5511999990000"
    convo = ChatConversation(
        client_id=client.id,
        phone=phone_number,
        contact_name="Lead Não Lido",
        status="open",
        unread_count=3,
        user_read_states={"1": 0}
    )
    db_session.add(convo)
    db_session.flush()

    # Setup Message
    wamid = "wamid.HBgMNTU4NTk2MTIzNTg2FQIAERgSRDZDQUJDM0M3RDU1MUY4Njg5AA=="
    msg = ChatMessage(
        conversation_id=convo.id,
        sender_type="user",
        message_type="text",
        content="Oi, preciso de ajuda!",
        wa_message_id=wamid
    )
    db_session.add(msg)
    db_session.flush()

    # Mock WhatsApp client
    mock_wa = MagicMock()
    mock_wa.send_reaction_official = AsyncMock(return_value={"status": "sent", "id": wamid})

    with patch("routers.chat.message_action_routes._get_wa_client", return_value=mock_wa):
        with patch("rabbitmq_client.rabbitmq.publish_event", new_callable=AsyncMock) as mock_pub:
            payload = ReactRequest(
                phone=phone_number,
                message_id=wamid,
                emoji="❤️"
            )
            res = await react_to_message(
                payload=payload,
                client_id=client.id,
                current_user=user,
                db=db_session
            )

            assert res["status"] == "success"
            assert res["emoji"] == "❤️"
            assert res["unread_count"] == 0

            # Verifica no banco que a conversa foi zerada
            db_session.refresh(convo)
            assert convo.unread_count == 0
            assert convo.user_read_states == {}

            # Verifica se evento websocket/rabbitmq foi publicado
            assert mock_pub.called
            call_args = mock_pub.call_args[0]
            assert call_args[0] == "conversation_updated"
            assert call_args[1]["unread_count"] == 0
            assert call_args[1]["id"] == convo.id

import pytest
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
import models
from routers.chat.common import (
    get_user_unread_count,
    mark_conversation_read_for_user,
    mark_conversation_read_for_all,
    get_user_display_name,
)
from routers.chat.conversation_modules.list_routes import _format_conversation_dict
from routers.chat.conversation_modules.toggle_routes import mark_as_read
from routers.chat.message_routes import list_messages, send_chat_message


def test_per_user_unread_independent_states():
    """
    Valida que o contador de mensagens não lidas funciona de forma independente para cada usuário:
    - Se Usuário 1 marcar como lida, zera apenas para o Usuário 1.
    - Se Usuário 2 marcar como lida, zera para os Usuários 1 e 2.
    - Usuário 3 continua vendo as não lidas até que ele mesmo marque.
    - Se chegar nova mensagem do contato, incrementa corretamente para todos a partir do ponto de leitura de cada um.
    """
    convo = models.ChatConversation(
        id=100,
        client_id=14,
        phone="5511999998888",
        contact_name="Maria",
        status="open",
        unread_count=2,
        user_read_states={},
    )

    # Inicialmente todos os 3 usuários veem 2 mensagens não lidas
    assert get_user_unread_count(convo, 1) == 2
    assert get_user_unread_count(convo, 2) == 2
    assert get_user_unread_count(convo, 3) == 2

    # Usuário 1 marca como lida -> some apenas para o Usuário 1
    mark_conversation_read_for_user(convo, 1)
    assert get_user_unread_count(convo, 1) == 0
    assert get_user_unread_count(convo, 2) == 2
    assert get_user_unread_count(convo, 3) == 2

    # Usuário 2 marca como lida -> some para Usuário 1 e Usuário 2, mas Usuário 3 ainda vê 2
    mark_conversation_read_for_user(convo, 2)
    assert get_user_unread_count(convo, 1) == 0
    assert get_user_unread_count(convo, 2) == 0
    assert get_user_unread_count(convo, 3) == 2

    # Chega 1 nova mensagem do contato (unread_count total passa de 2 para 3)
    convo.unread_count = 3
    assert get_user_unread_count(convo, 1) == 1
    assert get_user_unread_count(convo, 2) == 1
    assert get_user_unread_count(convo, 3) == 3


@pytest.mark.asyncio
async def test_opening_conversation_does_not_clear_unread_count():
    """
    Valida que apenas abrir a conversa (GET /chat/conversations/{id}/messages)
    NÃO zera o unread_count nem marca como lida.
    """
    convo = models.ChatConversation(
        id=200,
        client_id=14,
        phone="5511988887777",
        contact_name="Sabrina",
        status="open",
        unread_count=3,
        user_read_states={},
    )
    user_1 = models.User(id=1, email="aryaraj@gmail.com", full_name="Aryaraj")
    user_2 = models.User(id=2, email="jordao@gmail.com", full_name="Jordão")

    msg_from_user2 = models.ChatMessage(
        id=501,
        conversation_id=200,
        sender_type="user",
        user_id=2,
        message_type="text",
        content="Oi Sabrina, tudo bem?",
        meta_data={},
    )
    msg_from_user2.user = user_2

    db = MagicMock()
    convo_query = MagicMock()
    convo_query.filter.return_value.first.return_value = convo

    msg_query = MagicMock()
    msg_query.filter.return_value = msg_query
    msg_query.order_by.return_value.limit.return_value.all.return_value = [msg_from_user2]

    def side_effect_query(model):
        if model == models.ChatConversation:
            return convo_query
        if model == models.ChatMessage:
            return msg_query
        return MagicMock()

    db.query.side_effect = side_effect_query

    res = await list_messages(
        conversation_id=200,
        limit=50,
        before_id=None,
        client_id=14,
        current_user=user_1,
        db=db,
    )

    # O unread_count permanece intacto (3) para ambos os usuários após apenas abrir a conversa
    assert convo.unread_count == 3
    assert get_user_unread_count(convo, user_1.id) == 3
    assert get_user_unread_count(convo, user_2.id) == 3

    # E a mensagem retornada inclui sender_name e user_id para identificação interna
    assert len(res) == 1
    assert res[0]["user_id"] == 2
    assert res[0]["sender_name"] == "Jordão"


@pytest.mark.asyncio
async def test_mark_as_read_endpoint_and_auto_read_on_reply():
    """
    Valida que:
    1) O endpoint POST /chat/conversations/{id}/read marca como lida para o usuário autenticado.
    2) Responder na conversa (send_chat_message) marca automaticamente como lida para TODOS os usuários,
       zerando o contador geral e de cada operador (regra: resposta de atendente zera não lidas para todos).
    """
    convo = models.ChatConversation(
        id=300,
        client_id=14,
        phone="5511977776666",
        contact_name="Cliente Teste",
        status="open",
        unread_count=4,
        user_read_states={},
        last_contact_message_at=datetime.now(timezone.utc),
    )
    user_1 = models.User(id=1, email="aryaraj@gmail.com", full_name="Aryaraj")
    user_2 = models.User(id=2, email="jordao@gmail.com", full_name="Jordão")
    user_3 = models.User(id=3, email="outro@gmail.com", full_name="Outro")

    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = convo

    # 1) Usuário 1 clica no botão "Marcar como lida" (marca individualmente para Usuário 1)
    resp = await mark_as_read(conversation_id=300, client_id=14, current_user=user_1, db=db)
    assert resp["status"] == "ok"
    assert resp["unread_count"] == 0
    assert get_user_unread_count(convo, user_1.id) == 0
    assert get_user_unread_count(convo, user_2.id) == 4
    assert get_user_unread_count(convo, user_3.id) == 4

    # 2) Usuário 2 envia uma resposta na conversa -> marca como lida para TODOS os usuários!
    fake_wa_client = MagicMock()

    async def fake_send_text(*args, **kwargs):
        return {"messages": [{"id": "wamid.123"}]}

    fake_wa_client.send_text_official = fake_send_text

    with patch("routers.chat.message_routes._get_whatsapp_client", return_value=fake_wa_client), \
         patch("routers.chat.message_routes._get_chatwoot_client", return_value=None):
        sent = await send_chat_message(
            conversation_id=300,
            payload={"content": "Olá, posso ajudar!"},
            client_id=14,
            current_user=user_2,
            db=db,
        )

    assert sent["user_id"] == 2
    assert sent["sender_name"] == "Jordão"
    assert convo.unread_count == 0
    assert convo.user_read_states == {}
    assert get_user_unread_count(convo, user_1.id) == 0
    assert get_user_unread_count(convo, user_2.id) == 0
    assert get_user_unread_count(convo, user_3.id) == 0

    # Formatação da lista de conversas retorna unread_count zerado para todos os usuários
    dict_u2 = _format_conversation_dict(convo, set(), {}, {}, current_user_id=user_2.id)
    dict_u3 = _format_conversation_dict(convo, set(), {}, {}, current_user_id=user_3.id)
    assert dict_u2["unread_count"] == 0
    assert dict_u3["unread_count"] == 0


def test_mark_conversation_read_for_all_helper():
    """
    Testa diretamente a função auxiliar mark_conversation_read_for_all.
    """
    convo = models.ChatConversation(
        id=400,
        client_id=14,
        unread_count=5,
        user_read_states={"1": 2, "2": 3}
    )
    mark_conversation_read_for_all(convo)
    assert convo.unread_count == 0
    assert convo.user_read_states == {}

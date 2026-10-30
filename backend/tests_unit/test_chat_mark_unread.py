import pytest
from unittest.mock import MagicMock
try:
    from routers.chat.common import (
        get_user_unread_count,
        mark_conversation_read_for_user,
        mark_conversation_unread_for_user
    )
except ImportError:
    from backend.routers.chat.common import (
        get_user_unread_count,
        mark_conversation_read_for_user,
        mark_conversation_unread_for_user
    )


class MockConversation:
    def __init__(self, id=1, unread_count=3, user_read_states=None, client_id=1):
        self.id = id
        self.unread_count = unread_count
        self.user_read_states = user_read_states or {}
        self.client_id = client_id


def test_mark_conversation_read_and_restore_previous_unread_count():
    # Conversa começa com 3 mensagens não lidas
    convo = MockConversation(id=10, unread_count=3, user_read_states={})
    user_id = 42

    # Verifica que usuário vê 3 não lidas
    assert get_user_unread_count(convo, user_id) == 3

    # Marca como lida
    mark_conversation_read_for_user(convo, user_id)

    # Agora deve estar zerado para o usuário
    assert get_user_unread_count(convo, user_id) == 0
    # Deve ter registrado o histórico anterior
    assert convo.user_read_states.get(f"prev_{user_id}") == 3

    # Agora o usuário clica em marcar como não lida novamente
    restored = mark_conversation_unread_for_user(convo, user_id)

    # A contagem restaurada deve ser exatamente a anterior (3), e não todas as mensagens
    assert restored == 3
    assert get_user_unread_count(convo, user_id) == 3


def test_mark_conversation_unread_fallback_when_no_history():
    # Conversa zerada sem histórico prévio
    convo = MockConversation(id=20, unread_count=0, user_read_states={})
    user_id = 99

    assert get_user_unread_count(convo, user_id) == 0

    # Marca como não lido -> deve ir para 1 para sinalizar a pendência
    restored = mark_conversation_unread_for_user(convo, user_id)

    assert restored == 1
    assert get_user_unread_count(convo, user_id) == 1

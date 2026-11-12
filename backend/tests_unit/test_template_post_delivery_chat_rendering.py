import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from datetime import datetime, timezone
import models
from core.worker.handlers.whatsapp_status import _run_deferred_post_delivery


@pytest.mark.asyncio
async def test_deferred_post_delivery_creates_template_card_when_not_exists():
    """
    Testa se o pós-entrega cria o ChatMessage com meta_data de template completo
    (is_template=True, template_name, botões) e sender_type='user' (user_id=None -> Automação)
    quando a mensagem ainda não existe localmente.
    """
    trigger = models.ScheduledTrigger(
        id=1392,
        client_id=1,
        contact_phone="5517992387118",
        contact_name="Lia",
        template_name="astrowake_dia15"
    )
    message_record = models.MessageStatus(
        id=701,
        trigger_id=1392,
        message_id="D38E241C39553D0CA3",
        phone_number="5517992387118",
        contact_name="Lia",
        status="delivered",
        message_type="TEMPLATE",
        template_name="astrowake_dia15",
        content="Olá Lia, aqui é o Crassus Gobbi..."
    )

    tpl_cache = models.WhatsAppTemplateCache(
        client_id=1,
        name="astrowake_dia15",
        language="pt_BR",
        body="Olá {{1}}, aqui é o Crassus Gobbi...",
        components=[
            {"type": "HEADER", "format": "TEXT", "text": "Aviso Especial"},
            {"type": "BUTTONS", "buttons": [{"type": "QUICK_REPLY", "text": "Quero Entrar No Grupo"}]}
        ]
    )

    chat_convo = models.ChatConversation(
        id=1017,
        client_id=1,
        phone="5517992387118",
        contact_name="Lia",
        status="open"
    )

    added_objects = []

    mock_db = MagicMock()
    mock_db.query.return_value.get.side_effect = lambda model_id: message_record if model_id == 701 else trigger
    
    def mock_query(model):
        q = MagicMock()
        if model == models.MessageStatus:
            q.get.return_value = message_record
            return q
        elif model == models.ScheduledTrigger:
            q.get.return_value = trigger
            return q
        elif model == models.ChatMessage:
            q.filter.return_value.first.return_value = None  # Não existe ainda
            return q
        elif model == models.ChatConversation:
            q.filter.return_value.order_by.return_value.first.return_value = chat_convo
            return q
        elif model == models.WhatsAppTemplateCache:
            q.filter.return_value.first.return_value = tpl_cache
            return q
        return q

    mock_db.query.side_effect = mock_query
    mock_db.add.side_effect = lambda obj: added_objects.append(obj)

    with patch("core.worker.handlers.whatsapp_status.wah.SessionLocal", return_value=mock_db), \
         patch("rabbitmq_client.rabbitmq.publish_event", new_callable=AsyncMock) as mock_pub:
        
        await _run_deferred_post_delivery(
            trigger_id=1392,
            message_id=701,
            status="delivered",
            msg_id="wamid.HBgMNTUxNzk5MjM4NzExOBUCABEYEkQzOEUyNDFDMzk1NTNEMENBMwA=",
            phone="5517992387118"
        )

        assert mock_db.commit.called
        # Validar que a mensagem de template foi adicionada
        chat_messages = [o for o in added_objects if isinstance(o, models.ChatMessage)]
        assert len(chat_messages) == 1
        msg = chat_messages[0]

        assert msg.message_type == "template"
        assert msg.user_id is None
        assert msg.status == "delivered"
        assert msg.meta_data is not None
        assert msg.meta_data.get("is_template") is True
        assert msg.meta_data.get("template_name") == "astrowake_dia15"
        assert msg.meta_data.get("buttons") == ["Quero Entrar No Grupo"]
        assert msg.meta_data.get("header") == {"format": "TEXT", "text": "Aviso Especial"}
        assert mock_pub.called


@pytest.mark.asyncio
async def test_deferred_post_delivery_updates_existing_message_to_template():
    """
    Testa se uma mensagem já existente (por exemplo enviada como texto livre ou Smart Send)
    é atualizada com os metadados oficiais do template quando o status de entrega chega.
    """
    trigger = models.ScheduledTrigger(
        id=1393,
        client_id=1,
        contact_phone="5517992387118",
        template_name="astrowake_dia15"
    )
    message_record = models.MessageStatus(
        id=702,
        trigger_id=1393,
        message_id="ABC123456",
        phone_number="5517992387118",
        status="delivered",
        message_type="FREE_MESSAGE",  # Smart Send
        template_name="astrowake_dia15",
        content="Texto do Smart Send"
    )

    tpl_cache = models.WhatsAppTemplateCache(
        client_id=1,
        name="astrowake_dia15",
        language="pt_BR",
        body="Texto do Smart Send",
        components=[
            {"type": "BUTTONS", "buttons": [{"type": "QUICK_REPLY", "text": "Quero Entrar No Grupo"}]}
        ]
    )

    existing_msg = models.ChatMessage(
        id=888,
        conversation_id=1017,
        sender_type="user",
        user_id=None,
        message_type="text",
        content="Texto do Smart Send",
        wa_message_id="ABC123456",
        status="sent",
        meta_data={"is_template": False}
    )

    mock_db = MagicMock()
    def mock_query(model):
        q = MagicMock()
        if model == models.MessageStatus:
            q.get.return_value = message_record
            return q
        elif model == models.ScheduledTrigger:
            q.get.return_value = trigger
            return q
        elif model == models.ChatMessage:
            q.filter.return_value.first.return_value = existing_msg
            return q
        elif model == models.WhatsAppTemplateCache:
            q.filter.return_value.first.return_value = tpl_cache
            return q
        return q

    mock_db.query.side_effect = mock_query

    with patch("core.worker.handlers.whatsapp_status.wah.SessionLocal", return_value=mock_db), \
         patch("rabbitmq_client.rabbitmq.publish_event", new_callable=AsyncMock) as mock_pub:
        
        await _run_deferred_post_delivery(
            trigger_id=1393,
            message_id=702,
            status="delivered",
            msg_id="wamid.ABC123456",
            phone="5517992387118"
        )

        assert mock_db.commit.called
        # A mensagem existente foi atualizada para template
        assert existing_msg.message_type == "template"
        assert existing_msg.status == "delivered"
        assert existing_msg.meta_data.get("is_template") is True
        assert existing_msg.meta_data.get("template_name") == "astrowake_dia15"
        assert existing_msg.meta_data.get("buttons") == ["Quero Entrar No Grupo"]
        assert mock_pub.called

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import models
from services.discovery import discover_or_create_chatwoot_conversation
from core.worker.handlers.whatsapp_status import handle_deferred_post_delivery, handle_whatsapp_statuses

@pytest.mark.asyncio
async def test_discovery_search_queries_with_and_without_ninth_digit():
    """Valida se o DiscoveryService gera queries com e sem '+' e com e sem o nono dígito."""
    mock_cw = MagicMock()
    mock_cw.account_id = 1
    # Simula busca encontrando o contato na segunda query
    mock_cw.search_contact = AsyncMock(side_effect=[
        {"payload": []},
        {"payload": [{"id": 6039, "name": "Aryaraj Fernandes", "phone_number": "+5585998259497"}]}
    ])
    mock_cw.get_contact_conversations = AsyncMock(return_value=[{"id": 1296, "status": "open"}])

    with patch("services.discovery.ChatwootClient", return_value=mock_cw):
        # Passa telefone de 12 dígitos sem o 9 (como vem da Meta)
        res = await discover_or_create_chatwoot_conversation(
            client_id=1,
            phone="558598259497",
            name="Aryaraj Fernandes"
        )
        assert res is not None
        assert res["contact_id"] == 6039
        assert res["conversation_id"] == 1296
        assert res["contact_name"] == "Aryaraj Fernandes"
        
        # Verifica se as chamadas de search_contact cobriram variações
        called_queries = [call.args[0] for call in mock_cw.search_contact.call_args_list]
        assert "558598259497" in called_queries
        assert "+558598259497" in called_queries

@pytest.mark.asyncio
async def test_discovery_fallback_creation_uses_normalized_phone():
    """Valida se ao criar um novo contato, o DiscoveryService normaliza o telefone brasileiro para 13 dígitos."""
    mock_cw = MagicMock()
    mock_cw.account_id = 1
    mock_cw.search_contact = AsyncMock(return_value={"payload": []})
    mock_cw.get_default_whatsapp_inbox = AsyncMock(return_value=10)
    mock_cw.ensure_conversation = AsyncMock(return_value={
        "conversation_id": 9999,
        "contact_id": 8888,
        "account_id": 1
    })

    with patch("services.discovery.ChatwootClient", return_value=mock_cw):
        res = await discover_or_create_chatwoot_conversation(
            client_id=1,
            phone="558598259497",
            name="Novo Contato"
        )
        assert res is not None
        assert res["conversation_id"] == 9999
        # Verifica que o telefone passado para ensure_conversation foi normalizado com o 9º dígito
        mock_cw.ensure_conversation.assert_called_once_with("5585998259497", "Novo Contato", 10)

@pytest.mark.asyncio
async def test_handle_deferred_post_delivery_resolves_canonical_phone():
    """Valida se handle_deferred_post_delivery normaliza o telefone com o 9º dígito a partir do message_record."""
    mock_db = MagicMock()
    mock_msg_record = models.MessageStatus(
        id=123,
        trigger_id=10,
        phone_number="5585998259497",
        message_type="TEMPLATE",
        pending_private_note="Nota privada do teste",
        private_note_posted=False
    )
    mock_trigger = models.ScheduledTrigger(
        id=10,
        client_id=1,
        contact_phone="5585998259497",
        contact_name="Aryaraj Fernandes",
        chatwoot_label=["lead_bussola"],
        is_bulk=False
    )
    mock_db.query.return_value.get.side_effect = lambda entity_id: (
        mock_msg_record if entity_id == 123 else mock_trigger
    )
    mock_db.query.return_value.filter.return_value.first.return_value = None

    mock_cw = MagicMock()
    mock_cw.send_private_note = AsyncMock(return_value=True)
    mock_cw.add_label_to_conversation = AsyncMock(return_value=True)

    with patch("core.worker.handlers.whatsapp_status.wah.SessionLocal", return_value=mock_db), \
         patch("core.worker.handlers.whatsapp_status.asyncio.sleep", new_callable=AsyncMock), \
         patch("core.worker.handlers.whatsapp_status.discover_or_create_chatwoot_conversation", new_callable=AsyncMock) as mock_disc, \
         patch("core.worker.handlers.whatsapp_status.wah.ChatwootClient", return_value=mock_cw):

        mock_disc.return_value = {
            "conversation_id": 1296,
            "contact_id": 6039,
            "account_id": 1
        }

        # Passa o número de 12 dígitos sem o 9 (simulando a Meta Cloud API)
        await handle_deferred_post_delivery(
            trigger_id=10,
            message_id=123,
            status="delivered",
            msg_id="wamid.test1234",
            phone="558598259497"
        )

        # O discovery deve ter sido chamado com o número canônico normalizado (5585998259497)
        mock_disc.assert_called_once()
        call_kwargs = mock_disc.call_args[1]
        assert call_kwargs["phone"] == "5585998259497"
        assert mock_msg_record.private_note_posted == True

@pytest.mark.asyncio
async def test_handle_whatsapp_statuses_failed_cleanup_no_unbound_local_error(db_session):
    """Valida se status failed da Meta não causa UnboundLocalError com or_ na limpeza do histórico."""
    # Cria trigger e message_status reais na sessão de teste
    trigger = models.ScheduledTrigger(
        client_id=1,
        contact_phone="5559897347259",
        template_name="test_tpl",
        status="processing"
    )
    db_session.add(trigger)
    db_session.commit()
    db_session.refresh(trigger)

    msg_record = models.MessageStatus(
        trigger_id=trigger.id,
        message_id="test_failed_msg_id",
        phone_number="5559897347259",
        status="sent",
        message_type="TEMPLATE",
        template_name="test_tpl"
    )
    db_session.add(msg_record)

    # Cria histórico no ContactTemplateHistory para simular limpeza
    hist = models.ContactTemplateHistory(
        client_id=1,
        phone="5559897347259",
        template_name="test_tpl"
    )
    db_session.add(hist)
    db_session.commit()

    statuses = [{
        "id": "wamid.test_failed_msg_id",
        "status": "failed",
        "recipient_id": "5559897347259",
        "errors": [{"code": 131026, "title": "Message undeliverable"}]
    }]

    # Deve executar perfeitamente sem levantar UnboundLocalError
    await handle_whatsapp_statuses(db_session, statuses, value={})
    db_session.refresh(msg_record)
    assert msg_record.status == "failed"
    assert "Message undeliverable" in msg_record.failure_reason

    # Valida que o histórico de 24h foi deletado após a falha
    remaining_hist = db_session.query(models.ContactTemplateHistory).filter(
        models.ContactTemplateHistory.template_name == "test_tpl",
        models.ContactTemplateHistory.phone == "5559897347259"
    ).first()
    assert remaining_hist is None

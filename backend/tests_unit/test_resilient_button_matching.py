import pytest
from core.worker.handlers.whatsapp_inbound.button_actions import (
    match_button_action,
    lookup_message_and_trigger,
    handle_button_actions,
)
import models


def test_match_button_action_exact_match():
    actions = {
        "Quero Link Do Grupo Vip": {"type": "interaction", "funnel_id": 10},
        "Sair": {"type": "block", "funnel_id": None}
    }
    key, act = match_button_action(actions, "Quero Link Do Grupo Vip")
    assert key == "Quero Link Do Grupo Vip"
    assert act == {"type": "interaction", "funnel_id": 10}


def test_match_button_action_case_insensitive():
    actions = {
        "Quero Link Do Grupo Vip": {"type": "interaction", "funnel_id": 10},
        "Sair da Lista": {"type": "block", "funnel_id": None}
    }
    key, act = match_button_action(actions, "quero link do grupo vip")
    assert key == "Quero Link Do Grupo Vip"
    assert act["funnel_id"] == 10

    key2, act2 = match_button_action(actions, "SAIR DA LISTA")
    assert key2 == "Sair da Lista"
    assert act2["type"] == "block"


def test_match_button_action_prefix_truncated_by_meta():
    """
    Testa o caso em que a Meta trunca o botão para 20 caracteres (ex: 'Quero Link Do Grupo'
    ao invés do texto completo 'Quero Link Do Grupo Vip').
    """
    actions = {
        "Quero Link Do Grupo Vip": {"type": "interaction", "funnel_id": 71},
        "Outro Botao": {"type": "none"}
    }
    key, act = match_button_action(actions, "Quero Link Do Grupo")
    assert key == "Quero Link Do Grupo Vip"
    assert act["type"] == "interaction"
    assert act["funnel_id"] == 71


def test_match_button_action_configured_is_prefix():
    """
    Testa quando a chave configurada é menor que o texto enviado.
    """
    actions = {
        "Quero Entrar": {"type": "interaction", "funnel_id": 55}
    }
    key, act = match_button_action(actions, "Quero Entrar no Grupo Agora")
    assert key == "Quero Entrar"
    assert act["funnel_id"] == 55


def test_match_button_action_no_match():
    actions = {
        "Quero Comprar": {"type": "interaction", "funnel_id": 10}
    }
    key, act = match_button_action(actions, "Ajuda Suporte")
    assert key is None
    assert act is None


def test_match_button_action_empty_and_none():
    assert match_button_action(None, "Botao") == (None, None)
    assert match_button_action({}, "Botao") == (None, None)
    assert match_button_action({"Botao": {}}, "") == (None, None)
    assert match_button_action({"Botao": {}}, None) == (None, None)


@pytest.mark.asyncio
async def test_handle_button_actions_with_truncated_text(db_session, monkeypatch):
    """
    Testa se handle_button_actions aciona a ação de funil mesmo quando o texto
    do botão recebido da Meta está truncado em relação à chave do ScheduledTrigger.
    """
    client = models.Client(name="ResilientBtnClient")
    db_session.add(client)
    db_session.flush()

    trigger = models.ScheduledTrigger(
        client_id=client.id,
        template_name="disparo_black_astrowake",
        status="sent",
        button_actions={
            "Quero Link Do Grupo Vip": {
                "type": "interaction",
                "funnel_id": 99,
                "funnel_name": "Funil Teste"
            }
        }
    )
    db_session.add(trigger)
    db_session.flush()

    published_events = []
    async def mock_publish(queue, payload):
        published_events.append((queue, payload))

    import core.worker.handlers.whatsapp as wah
    monkeypatch.setattr(wah.rabbitmq, "publish", mock_publish)

    msg = {
        "type": "button",
        "button": {"text": "Quero Link Do Grupo"}
    }

    handled = await handle_button_actions(
        db=db_session,
        target_cid=client.id,
        from_phone="5585998259497",
        raw_from="5585998259497",
        user_input="Quero Link Do Grupo",
        msg=msg,
        trigger_ref=trigger,
        message_record=None,
        resolved_convo_id=None,
        contacts_map={},
        metadata={},
        value={}
    )

    assert handled is True

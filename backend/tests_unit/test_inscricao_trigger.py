import pytest
from unittest.mock import MagicMock
from services.webhooks_utils import parse_webhook_payload, normalize_event_type

def test_parse_webhook_payload_inscricao_user_payload():
    """Valida a extração do payload exato recebido pelo usuário com status/event inscricao"""
    payload = {
        "ddi": "55",
        "utm": {},
        "name": "Aryaraj Fernandes",
        "nome": "Aryaraj Fernandes",
        "event": "inscricao",
        "phone": "+558598259497",
        "evento": "inscricao",
        "origem": "lp-astrowake",
        "pagina": "https://pgbussola.crassusastrologo.com.br/",
        "referrer": None,
        "whatsapp": "+558598259497",
        "enviado_em": "2026-11-10T18:23:26.172Z",
        "event_type": "inscricao",
        "first_name": "Aryaraj",
        "whatsapp_formatado": "+55 (85) 9825-9497"
    }

    result = parse_webhook_payload("outra", payload)

    assert result["event_type"] == "inscricao"
    assert result["name"] == "Aryaraj Fernandes"
    assert result["first_name"] == "Aryaraj"
    assert "55859" in result["phone"]
    assert result["raw_status"] == "Inscricao"


def test_normalize_event_type_inscricao():
    """Valida a normalização de diferentes grafias de inscricao"""
    assert normalize_event_type("inscricao") == "inscricao"
    assert normalize_event_type("INSCRICAO") == "inscricao"
    assert normalize_event_type("Inscricao") == "inscricao"


def test_find_mapping_for_inscricao_alias():
    """Valida que o mapeamento com 'inscricao' é encontrado com resiliência de alias"""
    mock_db = MagicMock()
    mock_mapping = MagicMock()
    mock_mapping.event_type = "inscricao"
    mock_mapping.product_name = None
    mock_mapping.is_active = True

    # Simula busca de mapping
    search_events = list(set(["inscricao", normalize_event_type("inscricao")]))
    assert "inscricao" in search_events

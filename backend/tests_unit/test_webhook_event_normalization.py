import pytest
from unittest.mock import MagicMock
from services.webhooks_utils import normalize_event_type, parse_webhook_payload
from services.utils.webhook_platform_parsers.digital_platforms import parse_hotmart


def test_normalize_event_type_various_formats():
    """Valida que strings com espaços, hífens, maiúsculas e pontos são normalizadas com underlines."""
    assert normalize_event_type("Compra Aprovada") == "compra_aprovada"
    assert normalize_event_type("compra aprovada") == "compra_aprovada"
    assert normalize_event_type("COMPRA_APROVADA") == "compra_aprovada"
    assert normalize_event_type("compra-aprovada") == "compra_aprovada"
    assert normalize_event_type("compra.aprovada") == "compra_aprovada"
    assert normalize_event_type("PURCHASE_APPROVED") == "compra_aprovada"
    assert normalize_event_type("Pix Gerado") == "pix_gerado"
    assert normalize_event_type("pix gerado") == "pix_gerado"
    assert normalize_event_type("Boleto Impresso") == "boleto_impresso"
    assert normalize_event_type("Carrinho Abandonado") == "carrinho_abandonado"
    assert normalize_event_type("checkout_pre_populado") == "checkout_pre_populado"
    assert normalize_event_type("") == "outros"
    assert normalize_event_type(None) == "outros"


def test_parse_hotmart_with_spaced_event():
    """Valida que o parser da Hotmart normaliza eventos em português enviados com espaço."""
    payload = {
        "event": "Compra Aprovada",
        "order": {"status": "Compra Aprovada"},
        "product": {"name": "Bússola Astrológica"},
        "data": {
            "buyer": {"name": "Aryaraj Fernandes", "email": "teste@example.com"}
        }
    }
    result = {"event_type": None, "raw_status": None}
    parse_hotmart(payload, result)
    assert result["event_type"] == "compra_aprovada"


def test_parse_webhook_payload_normalizes_event_type():
    """Valida que parse_webhook_payload sempre retorna event_type canônico com underline."""
    payload = {
        "event": "Compra Aprovada",
        "status": "Compra Aprovada",
        "name": "Cliente Teste",
        "phone": "5511999998888"
    }
    parsed = parse_webhook_payload("hotmart", payload)
    assert parsed["event_type"] == "compra_aprovada"


def test_find_mapping_resilient_candidates():
    """Valida que a lógica de busca de candidatos suporta tanto underline quanto espaço."""
    ev_type = "compra aprovada"
    norm_ev = normalize_event_type(ev_type)
    candidates = list(set([ev_type, norm_ev, norm_ev.replace("_", " "), norm_ev.replace(" ", "_")]))
    
    assert "compra_aprovada" in candidates
    assert "compra aprovada" in candidates

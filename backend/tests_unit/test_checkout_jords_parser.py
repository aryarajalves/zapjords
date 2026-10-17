import pytest
from services.webhooks_utils import parse_webhook_payload, extract_mapped_variables
from services.utils.webhook_platform_parsers.checkout_jords import parse_checkout_jords


SAMPLE_CHECKOUT_JORDS_CRYPTO = {
    "event": "Compra Aprovada",
    "order": {
        "status": "Compra Aprovada",
        "paid_at": "2026-10-16T13:33:34.444706+00:00",
        "amount_brl": 114,
        "amount_usd": 15,
        "created_at": "2026-10-16T13:33:29.737867+00:00",
        "order_code": "ORD-20261016-202796",
        "status_raw": "paid",
        "gateway_name": "nowpayments",
        "crypto_amount": 15.023445,
        "crypto_network": "Polygon",
        "payment_method": "crypto",
        "crypto_currency": "USDT",
        "crypto_wallet_address": "0x9F614C09fD8C0E217B0725E5D475241ADB27A6f7",
        "external_transaction_id": "6300984363"
    },
    "split": [
        {
            "amount_brl": 102.6,
            "percentage": 90,
            "recipient_id": 2,
            "recipient_name": "Jordão"
        },
        {
            "amount_brl": 11.4,
            "percentage": 10,
            "recipient_id": 1,
            "recipient_name": "Aryaraj Alves Fernandes"
        }
    ],
    "product": {
        "id": 1,
        "name": "Bussola Astrologica",
        "slug": "bussola-astrologica",
        "offer_name": "Oferta Principal",
        "offer_slug": "bussola-astrologica"
    },
    "customer": {
        "cpf": None,
        "name": "ARYARAJ ALVES FERNANDES",
        "email": "aryarajunity@gmail.com",
        "phone": "+558588146141",
        "phone_ddi": "55",
        "phone_formatted": "+55 (85) 8814-6141"
    },
    "event_raw": "order.approved",
    "created_at": "2026-10-16T13:33:34.453798+00:00",
    "event_label": "Compra Aprovada"
}


def test_parse_checkout_jords_direct():
    result = {}
    parse_checkout_jords(SAMPLE_CHECKOUT_JORDS_CRYPTO, result)

    assert result["platform"] == "checkout_jords"
    assert result["event_type"] == "compra_aprovada"
    assert result["name"] == "ARYARAJ ALVES FERNANDES"
    assert result["first_name"] == "ARYARAJ"
    assert result["email"] == "aryarajunity@gmail.com"
    assert result["phone"] == "+558588146141"
    assert result["country"] == "BR"
    assert result["product_name"] == "Bussola Astrologica"
    assert result["price"] == 114
    assert result["currency"] == "BRL"
    assert result["is_crypto"] is True
    assert result["crypto_currency"] == "USDT"
    assert result["crypto_amount"] == 15.023445
    assert result["crypto_network"] == "Polygon"
    assert result["crypto_wallet_address"] == "0x9F614C09fD8C0E217B0725E5D475241ADB27A6f7"
    assert result["gateway_name"] == "nowpayments"
    assert result["order_code"] == "ORD-20261016-202796"
    assert result["custom_fields"]["Meio de Pagamento"] == "Criptomoeda"
    assert result["custom_fields"]["Gateway"] == "NOWPAYMENTS"
    assert result["custom_fields"]["Rede Cripto"] == "Polygon"


def test_parse_webhook_payload_with_checkout_jords():
    parsed = parse_webhook_payload("checkout_jords", SAMPLE_CHECKOUT_JORDS_CRYPTO)

    assert parsed["platform"] == "checkout_jords"
    assert parsed["event_type"] == "compra_aprovada"
    assert parsed["name"] == "ARYARAJ ALVES FERNANDES"
    assert parsed["first_name"] == "ARYARAJ"
    assert parsed["email"] == "aryarajunity@gmail.com"
    # Valida normalização de telefone padrão (55 + DDD + 9 dígitos)
    assert parsed["phone"] == "5585988146141"
    assert parsed["payment_method"] == "Criptomoeda"
    assert parsed["price"] == "114.00"
    assert parsed["is_crypto"] is True
    assert parsed["crypto_currency"] == "USDT"


def test_parse_webhook_payload_auto_detection_when_platform_outra():
    # Caso a integração esteja configurada como "outra" mas receba o payload do Checkout Jords
    parsed = parse_webhook_payload("outra", SAMPLE_CHECKOUT_JORDS_CRYPTO)

    assert parsed["platform"] == "checkout_jords"
    assert parsed["event_type"] == "compra_aprovada"
    assert parsed["name"] == "ARYARAJ ALVES FERNANDES"
    assert parsed["email"] == "aryarajunity@gmail.com"
    assert parsed["product_name"] == "Bussola Astrologica"
    assert parsed["price"] == "114.00"
    assert parsed["is_crypto"] is True
    assert parsed["payment_method"] == "Criptomoeda"


def test_extract_mapped_variables_checkout_jords():
    parsed = parse_webhook_payload("checkout_jords", SAMPLE_CHECKOUT_JORDS_CRYPTO)
    
    mapping_config = [
        {"key": "1", "value": "first_name", "type": "body"},
        {"key": "2", "value": "order.order_code", "type": "body"},
        {"key": "3", "value": "order.crypto_currency", "type": "body"},
        {"key": "4", "value": "order.crypto_amount", "type": "body"},
        {"key": "5", "value": "order.crypto_network", "type": "body"},
    ]

    components = extract_mapped_variables(SAMPLE_CHECKOUT_JORDS_CRYPTO, parsed, mapping_config)
    body_comp = next(c for c in components if c["type"] == "body")
    parameters = body_comp["parameters"]

    assert parameters[0]["text"] == "ARYARAJ"
    assert parameters[1]["text"] == "ORD-20261016-202796"
    assert parameters[2]["text"] == "USDT"
    assert parameters[3]["text"] == "15.023445"
    assert parameters[4]["text"] == "Polygon"


def test_checkout_jords_pix_and_refund():
    payload_pix = {
        "event": "Pix Gerado",
        "order": {
            "status": "waiting_payment",
            "payment_method": "pix",
            "amount_brl": 97
        },
        "customer": {"name": "Cliente Pix", "phone": "5511999998888"}
    }
    result_pix = {}
    parse_checkout_jords(payload_pix, result_pix)
    assert result_pix["event_type"] == "pix_gerado"
    assert result_pix["payment_method"] == "pix"

    payload_refund = {
        "event_raw": "order.refunded",
        "order": {"status_raw": "refunded"},
        "customer": {"name": "Cliente Reembolso"}
    }
    result_refund = {}
    parse_checkout_jords(payload_refund, result_refund)
    assert result_refund["event_type"] == "reembolso"

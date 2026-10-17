import re as _re
from typing import Dict, Any

def parse_checkout_jords(payload: Dict[str, Any], result: Dict[str, Any]) -> None:
    """
    Parser oficial para webhooks do Checkout Jords (com suporte a Criptomoedas, Pix, Cartão e Boleto).
    """
    result['platform'] = "checkout_jords"
    
    order = payload.get("order") or {}
    customer = payload.get("customer") or {}
    product = payload.get("product") or {}
    
    # 1. Mapeamento de Evento
    event_raw = str(payload.get("event_raw") or "").lower().strip()
    event_top = str(payload.get("event") or "").lower().strip()
    status_raw = str(order.get("status_raw") or "").lower().strip()
    status_top = str(order.get("status") or "").lower().strip()
    payment_method = str(order.get("payment_method") or "").lower().strip()
    
    combined_status = f"{event_raw} {event_top} {status_raw} {status_top}"
    
    if any(k in combined_status for k in ["order.approved", "compra aprovada", "aprovado", "approved", "paid"]):
        result['event_type'] = "compra_aprovada"
    elif any(k in combined_status for k in ["order.refunded", "refund", "reembolso"]):
        result['event_type'] = "reembolso"
    elif any(k in combined_status for k in ["order.chargeback", "chargeback"]):
        result['event_type'] = "chargeback"
    elif any(k in combined_status for k in ["order.canceled", "order.cancelled", "cancelad", "canceled", "cancelled"]):
        result['event_type'] = "compra_cancelada"
    elif any(k in combined_status for k in ["order.abandoned", "abandoned_cart", "carrinho abandonado", "abandon"]):
        result['event_type'] = "carrinho_abandonado"
    elif "pix" in payment_method and any(k in combined_status for k in ["waiting", "pending", "gerado", "aguardando"]):
        result['event_type'] = "pix_gerado"
    elif "pix" in payment_method and any(k in combined_status for k in ["expirad", "expired"]):
        result['event_type'] = "pix_expirado"
    elif any(k in payment_method for k in ["boleto", "billet"]) and any(k in combined_status for k in ["waiting", "pending", "gerado", "impresso"]):
        result['event_type'] = "boleto_impresso"
    elif any(k in combined_status for k in ["refused", "failed", "recusad", "falhou"]):
        result['event_type'] = "cartao_recusado"
    elif order.get("paid_at") or status_raw == "paid":
        result['event_type'] = "compra_aprovada"
    else:
        result['event_type'] = "outros"

    # 2. Dados do Cliente / Comprador
    result['name'] = customer.get("name")
    if result['name']:
        result['first_name'] = str(result['name']).strip().split()[0]
    result['email'] = customer.get("email")
    result['phone'] = customer.get("phone") or customer.get("phone_formatted")
    
    # Detecção de país
    phone_str = str(result.get("phone") or "")
    if customer.get("phone_ddi") == "55" or phone_str.startswith("+55") or phone_str.startswith("55"):
        result['country'] = "BR"
    elif customer.get("country"):
        result['country'] = str(customer.get("country")).upper()

    # 3. Dados do Produto
    result['product_name'] = product.get("name") or product.get("offer_name")
    
    # 4. Dados Financeiros
    amount_brl = order.get("amount_brl")
    amount_usd = order.get("amount_usd")
    
    if amount_brl is not None:
        result['price'] = amount_brl
        result['currency'] = "BRL"
    elif amount_usd is not None:
        result['price'] = amount_usd
        result['currency'] = "USD"
        
    if result['product_name']:
        result['items'] = [{"name": result['product_name'], "price": result['price']}]

    result['raw_status'] = order.get("status_raw") or order.get("status")
    result['payment_method'] = payment_method or ("crypto" if order.get("crypto_currency") else "outros")

    # 5. Tratamento Especial para Criptomoedas
    is_crypto = (payment_method == "crypto") or bool(order.get("crypto_currency") or order.get("crypto_amount"))
    result['is_crypto'] = is_crypto
    
    if "custom_fields" not in result or not isinstance(result["custom_fields"], dict):
        result["custom_fields"] = {}

    if customer.get("cpf"):
        result["custom_fields"]["CPF"] = customer.get("cpf")

    if is_crypto:
        result['crypto_currency'] = order.get("crypto_currency")
        result['crypto_amount'] = order.get("crypto_amount")
        result['crypto_network'] = order.get("crypto_network")
        result['crypto_wallet_address'] = order.get("crypto_wallet_address")
        result['gateway_name'] = order.get("gateway_name")
        result['order_code'] = order.get("order_code")
        result['external_transaction_id'] = order.get("external_transaction_id")
        result['amount_usd'] = amount_usd
        result['amount_brl'] = amount_brl
        
        # Injetar nos custom_fields para exibição rica na UI
        result["custom_fields"]["Meio de Pagamento"] = "Criptomoeda"
        if order.get("crypto_amount") and order.get("crypto_currency"):
            result["custom_fields"]["Cripto Valor"] = f"{order.get('crypto_amount')} {order.get('crypto_currency')}"
        if order.get("crypto_network"):
            result["custom_fields"]["Rede Cripto"] = order.get("crypto_network")
        if order.get("gateway_name"):
            result["custom_fields"]["Gateway"] = str(order.get("gateway_name")).upper()
        if order.get("order_code"):
            result["custom_fields"]["Código Pedido"] = order.get("order_code")
        if order.get("crypto_wallet_address"):
            result["custom_fields"]["Carteira"] = order.get("crypto_wallet_address")
    elif payment_method:
        result["custom_fields"]["Meio de Pagamento"] = payment_method.capitalize()

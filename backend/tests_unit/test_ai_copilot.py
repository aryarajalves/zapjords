import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from models import User, Client, AppConfig, AIUsageLog, ChatConversation, ChatMessage
from core.security import get_password_hash, create_access_token
from services.ai_copilot_service import calculate_token_cost, MODELS_CATALOG

def setup_test_auth(db_session):
    test_client = Client(name="Cliente AI Copilot Test", is_active=True)
    db_session.add(test_client)
    db_session.commit()
    db_session.refresh(test_client)

    test_user = User(
        email="vendedor_ai@zapvoice.com.br",
        hashed_password=get_password_hash("password123"),
        role="admin",
        is_active=True,
        client_id=test_client.id
    )
    test_user.accessible_clients.append(test_client)
    db_session.add(test_user)
    db_session.commit()
    db_session.refresh(test_user)

    jwt_token = create_access_token(data={"sub": test_user.email})
    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "X-Client-ID": str(test_client.id)
    }
    return test_client, test_user, headers

def test_models_catalog_and_cost_calculation():
    # Valida presença dos modelos solicitados pelo usuário
    assert "gpt-6-astra" in MODELS_CATALOG
    assert "gpt-6.1-sol" in MODELS_CATALOG
    assert "gpt-6.1-terra" in MODELS_CATALOG
    assert "gpt-6-luna" in MODELS_CATALOG
    assert "gpt-5.6-sol" in MODELS_CATALOG
    assert "gpt-5.6-terra" in MODELS_CATALOG
    assert "gpt-5" in MODELS_CATALOG
    assert "gpt-4.1" in MODELS_CATALOG

    # Valida cálculo de custo: 1000 prompt tokens + 500 completion tokens no gpt-6.1-sol
    # gpt-6.1-sol: input = $2.00/1M ($0.000002/token), output = $10.00/1M ($0.000010/token)
    # custo = (1000 * 0.000002) + (500 * 0.000010) = 0.002 + 0.005 = 0.007 USD
    usd, brl = calculate_token_cost("gpt-6.1-sol", 1000, 500, usd_to_brl=5.0)
    assert usd == 0.007
    assert brl == 0.035

def test_ai_settings_endpoints(client, db_session):
    test_client, test_user, headers = setup_test_auth(db_session)

    # 1. Listar modelos disponíveis
    res_models = client.get("/api/ai/models")
    assert res_models.status_code == 200
    data_models = res_models.json()
    assert len(data_models["models"]) >= 8
    model_ids = [m["id"] for m in data_models["models"]]
    assert "gpt-6.1-sol" in model_ids
    assert "gpt-5.6-terra" in model_ids

    # 2. Obter configurações iniciais
    res_get = client.get("/api/ai/settings", headers=headers)
    assert res_get.status_code == 200
    cfg = res_get.json()
    assert cfg["model"] == "gpt-6.1-sol"
    assert "default_prompt" in cfg

    # 3. Atualizar configurações (modelo, chave, prompt personalizado)
    update_payload = {
        "model": "gpt-6.1-terra",
        "api_key": "sk-test-live-key-123456789",
        "system_prompt": "Prompt customizado de vendas para infoproduto",
        "temperature": 0.5,
        "usd_to_brl": 5.85
    }
    res_put = client.post("/api/ai/settings", json=update_payload, headers=headers)
    assert res_put.status_code == 200

    # 4. Verificar se persistiu e mascarou a chave
    res_check = client.get("/api/ai/settings", headers=headers)
    assert res_check.status_code == 200
    updated_cfg = res_check.json()
    assert updated_cfg["model"] == "gpt-6.1-terra"
    assert updated_cfg["has_api_key"] is True
    assert updated_cfg["masked_api_key"].startswith("sk-")
    assert "123456789" not in updated_cfg["masked_api_key"]
    assert updated_cfg["system_prompt"] == "Prompt customizado de vendas para infoproduto"
    assert updated_cfg["temperature"] == 0.5

def test_ai_chat_and_financial_logging(client, db_session):
    test_client, test_user, headers = setup_test_auth(db_session)

    # Configurar chave
    client.post("/api/ai/settings", json={"api_key": "sk-fake-valid-key", "model": "gpt-6.1-sol"}, headers=headers)

    # Criar uma conversa de teste
    convo = ChatConversation(
        client_id=test_client.id,
        phone="5511999998888",
        contact_name="Stella Lead",
        instagram="@stellalead"
    )
    db_session.add(convo)
    db_session.commit()
    db_session.refresh(convo)

    msg = ChatMessage(
        conversation_id=convo.id,
        sender_type="customer",
        content="Olá! Qual o valor do plano anual?"
    )
    db_session.add(msg)
    db_session.commit()

    # Mockar a chamada à OpenAI
    mock_openai_response = {
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": "Olá Stella! Nosso plano anual está com 40% de desconto saindo por 12x de R$ 97. Deseja garantir essa condição agora?"
                }
            }
        ],
        "usage": {
            "prompt_tokens": 150,
            "completion_tokens": 40,
            "total_tokens": 190
        }
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_openai_response
    mock_resp.text = "{}"

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_resp):
        chat_payload = {
            "message": "Gere uma resposta apresentando o plano anual com desconto",
            "conversation_id": convo.id
        }
        res_chat = client.post("/api/ai/chat", json=chat_payload, headers=headers)
        assert res_chat.status_code == 200
        chat_data = res_chat.json()
        assert "Stella" in chat_data["reply"]
        assert chat_data["usage"]["total_tokens"] == 190
        assert chat_data["usage"]["cost_usd"] > 0

    # 5. Consultar relatório financeiro
    res_fin = client.get("/api/ai/financial", headers=headers)
    assert res_fin.status_code == 200
    fin_data = res_fin.json()
    assert fin_data["summary"]["total_calls"] >= 1
    assert fin_data["summary"]["total_tokens"] >= 190
    assert fin_data["summary"]["total_cost_usd"] > 0
    assert len(fin_data["recent_logs"]) >= 1
    assert fin_data["recent_logs"][0]["contact_name"] == "Stella Lead"
    assert fin_data["recent_logs"][0]["model"] == "gpt-6.1-sol"

def test_ai_prompt_presets_management_and_chat_selection(client, db_session):
    test_client, test_user, headers = setup_test_auth(db_session)

    # 1. Obter lista inicial (cria o preset default)
    res_list = client.get("/api/ai/prompts", headers=headers)
    assert res_list.status_code == 200
    data_list = res_list.json()
    assert len(data_list["prompts"]) >= 1
    default_preset = data_list["prompts"][0]
    assert default_preset["is_default"] is True
    assert "Geral" in default_preset["name"]

    # 2. Criar novo preset para produto específico (ex: Bússola Astrológica)
    create_payload = {
        "name": "Bússola Astrológica",
        "product_identifier": "Bussola",
        "prompt_text": "Você é especialista em vender o mapa astral da Bússola Astrológica.",
        "is_default": False
    }
    res_create = client.post("/api/ai/prompts", json=create_payload, headers=headers)
    assert res_create.status_code == 200
    created = res_create.json()["preset"]
    assert created["name"] == "Bússola Astrológica"
    product_preset_id = created["id"]

    # 3. Atualizar o preset criado
    update_payload = {
        "name": "Bússola Astrológica VIP",
        "prompt_text": "Você é especialista em vender o mapa astral VIP com acompanhamento."
    }
    res_update = client.put(f"/api/ai/prompts/{product_preset_id}", json=update_payload, headers=headers)
    assert res_update.status_code == 200
    updated = res_update.json()["preset"]
    assert updated["name"] == "Bússola Astrológica VIP"

    # 4. Usar o preset de produto no chat com a IA
    mock_openai_response = {
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": "Olá! O mapa astral VIP da Bússola inclui sua análise completa dos 12 signos."
                }
            }
        ],
        "usage": {
            "prompt_tokens": 120,
            "completion_tokens": 30,
            "total_tokens": 150
        }
    }
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_openai_response
    mock_resp.text = "{}"

    # Salva a chave temporária no AppConfig para o teste
    app_key = AppConfig(client_id=test_client.id, key="AI_API_KEY", value="sk-test-fake-key")
    db_session.add(app_key)
    db_session.commit()

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_resp):
        chat_payload = {
            "message": "Como funciona o mapa?",
            "prompt_id": product_preset_id
        }
        res_chat = client.post("/api/ai/chat", json=chat_payload, headers=headers)
        assert res_chat.status_code == 200
        assert "Bússola" in res_chat.json()["reply"]

    # 5. Deletar preset criado
    res_delete = client.delete(f"/api/ai/prompts/{product_preset_id}", headers=headers)
    assert res_delete.status_code == 200

    # 6. Impedir deletar o único preset restante
    res_delete_last = client.delete(f"/api/ai/prompts/{default_preset['id']}", headers=headers)
    assert res_delete_last.status_code == 400
    assert "não pode excluir o único prompt" in res_delete_last.json()["detail"]

import pytest
from services.webhooks_utils import parse_webhook_payload
from services.utils.webhook_platform_parsers.formulario_personalizado import parse_formulario_personalizado


USER_SAMPLE_PAYLOAD = {
    "event": "form_submission",
    "answers": [
        {
            "answer": "João da Silva",
            "question": "Qual é o seu nome completo?"
        },
        {
            "answer": "+5511999998888",
            "question": "Qual é o seu WhatsApp?"
        },
        {
            "answer": "joao@exemplo.com",
            "question": "Qual é o seu e-mail?"
        }
    ],
    "form_id": 1,
    "is_test": True,
    "form_slug": "9g00wTk7",
    "created_at": "2026-10-16T20:09:11.062000",
    "form_title": "Formulario Inicial"
}


def test_parse_formulario_personalizado_user_payload():
    """Valida o payload exato fornecido pelo usuário com Opção 1 (Detecção Inteligente)."""
    result = parse_webhook_payload("formulario_personalizado", USER_SAMPLE_PAYLOAD)

    assert result["name"] == "João da Silva"
    assert result["first_name"] == "João"
    # O telefone deve ser normalizado com DDD e código de país padrão BR
    assert "11999998888" in result["phone"]
    assert result["email"] == "joao@exemplo.com"
    assert result["product_name"] == "Formulario Inicial"
    assert result["event_type"] == "formulario"
    assert result["raw_status"] == "Formulário"
    assert result["event_time"] == "2026-10-16T20:09:11.062000"

    # Validação de variáveis dinâmicas geradas a partir das perguntas
    vars_dict = result.get("variables", {})
    assert vars_dict.get("qual_e_o_seu_nome_completo") == "João da Silva"
    assert vars_dict.get("qual_e_o_seu_whatsapp") == "+5511999998888"
    assert vars_dict.get("qual_e_o_seu_email") == "joao@exemplo.com"
    assert vars_dict.get("form_id") == "1"
    assert vars_dict.get("form_slug") == "9g00wTk7"
    assert vars_dict.get("is_test") == "Sim"


def test_parse_formulario_personalizado_varied_questions():
    """Testa formulário com perguntas com títulos alternativos e perguntas dinâmicas extras."""
    varied_payload = {
        "event": "form_submission",
        "form_title": "Pesquisa de Mercado VIP",
        "answers": [
            {
                "question": "Como prefere ser chamado?",
                "answer": "Dra. Ana Paula"
            },
            {
                "question": "Seu celular com DDD para receber avisos",
                "answer": "(21) 97777-6666"
            },
            {
                "question": "Onde devemos enviar o seu relatório?",
                "answer": "ana.paula@clinica.med.br"
            },
            {
                "question": "Qual o faturamento mensal da sua empresa?",
                "answer": "Acima de 50 mil"
            },
            {
                "question": "Qual a sua cidade?",
                "answer": "Rio de Janeiro"
            }
        ]
    }

    result = parse_webhook_payload("formulario_personalizado", varied_payload)

    assert result["name"] == "Dra. Ana Paula"
    assert result["first_name"] == "Dra."
    assert "21977776666" in result["phone"]
    # Detectado como e-mail pelo regex de formato na resposta mesmo com pergunta indireta
    assert result["email"] == "ana.paula@clinica.med.br"
    assert result["product_name"] == "Pesquisa de Mercado VIP"
    assert result["cidade"] == "Rio de Janeiro"

    # Pergunta dinâmica extra capturada
    assert result["variables"]["qual_o_faturamento_mensal_da_sua_empresa"] == "Acima de 50 mil"


def test_parse_formulario_personalizado_fallback_on_generic_platform():
    """Testa se o parser é acionado automaticamente mesmo se enviado para a plataforma 'outros'."""
    result = parse_webhook_payload("outros", USER_SAMPLE_PAYLOAD)

    assert result["name"] == "João da Silva"
    assert "11999998888" in result["phone"]
    assert result["email"] == "joao@exemplo.com"
    assert result["product_name"] == "Formulario Inicial"


def test_parse_formulario_personalizado_direct_function():
    """Testa a função isolada parse_formulario_personalizado diretamente."""
    res = {}
    parse_formulario_personalizado(USER_SAMPLE_PAYLOAD, res)

    assert res["name"] == "João da Silva"
    assert res["phone"] == "5511999998888"
    assert res["email"] == "joao@exemplo.com"
    assert res["event_type"] == "formulario"

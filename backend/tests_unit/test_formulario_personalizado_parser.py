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


BOOKING_REMINDER_MORNING_PAYLOAD = {
    "event": "booking_reminder_morning",
    "form_id": 1,
    "form_slug": "9g00wTk7",
    "form_title": "Formulario Inicial",
    "response_id": 13,
    "contact_name": "Hinata",
    "contact_email": "aryarajcrypto@gmail.com",
    "contact_phone": "+55 85988146141",
    "dispatched_at": "2026-10-25T20:26:58.410314+00:00",
    "reminder_type": "morning",
    "scheduled_for": "30/10/2026 09:00",
    "reminder_label": "Lembrete do dia da reunião (09:00)",
    "manual_dispatch": True,
    "formatted_datetime": "30/10/26 19:00",
    "scheduled_datetime": "2026-10-30T19:00:00-03:00"
}


def test_parse_formulario_personalizado_booking_reminder_morning():
    """Valida o payload de lembrete de agendamento matinal (booking_reminder_morning)."""
    result = parse_webhook_payload("formulario_personalizado", BOOKING_REMINDER_MORNING_PAYLOAD)

    assert result["event_type"] == "booking_reminder_morning"
    assert result["raw_status"].lower() == "lembrete reunião (manhã)".lower()
    assert result["name"] == "Hinata"
    assert result["first_name"] == "Hinata"
    assert "85988146141" in result["phone"]
    assert result["email"] == "aryarajcrypto@gmail.com"
    assert result["product_name"] == "Formulario Inicial"
    assert result["event_time"] == "2026-10-25T20:26:58.410314+00:00"

    vars_dict = result.get("variables", {})
    assert vars_dict.get("formatted_datetime") == "30/10/26 19:00"
    assert vars_dict.get("data_reuniao") == "30/10/26 19:00"
    assert vars_dict.get("scheduled_for") == "30/10/2026 09:00"
    assert vars_dict.get("reminder_label") == "Lembrete do dia da reunião (09:00)"
    assert vars_dict.get("reminder_type") == "morning"
    assert vars_dict.get("response_id") == "13"
    assert vars_dict.get("form_id") == "1"
    assert vars_dict.get("form_slug") == "9g00wTk7"
    assert vars_dict.get("manual_dispatch") == "Sim"


BOOKING_REMINDER_BEFORE_MEETING_PAYLOAD = {
    "event": "booking_reminder_before_meeting",
    "form_id": 1,
    "form_slug": "9g00wTk7",
    "form_title": "Formulario Inicial",
    "response_id": 13,
    "contact_name": "Hinata",
    "contact_email": "aryarajcrypto@gmail.com",
    "contact_phone": "+55 85988146141",
    "dispatched_at": "2026-10-25T20:25:16.768765+00:00",
    "reminder_type": "before_meeting",
    "scheduled_for": "30/10/2026 18:30",
    "minutes_before": 30,
    "reminder_label": "Lembrete 30 minutos antes da reunião",
    "manual_dispatch": True,
    "formatted_datetime": "30/10/26 19:00",
    "scheduled_datetime": "2026-10-30T19:00:00-03:00"
}


def test_parse_formulario_personalizado_booking_reminder_before_meeting():
    """Valida o payload de lembrete de agendamento minutos antes (booking_reminder_before_meeting)."""
    result = parse_webhook_payload("formulario_personalizado", BOOKING_REMINDER_BEFORE_MEETING_PAYLOAD)

    assert result["event_type"] == "booking_reminder_before_meeting"
    assert result["raw_status"].lower() == "lembrete reunião (antes da reunião)".lower()
    assert result["name"] == "Hinata"
    assert result["first_name"] == "Hinata"
    assert "85988146141" in result["phone"]
    assert result["email"] == "aryarajcrypto@gmail.com"
    assert result["product_name"] == "Formulario Inicial"
    assert result["event_time"] == "2026-10-25T20:25:16.768765+00:00"

    vars_dict = result.get("variables", {})
    assert vars_dict.get("minutes_before") == "30"
    assert vars_dict.get("formatted_datetime") == "30/10/26 19:00"
    assert vars_dict.get("scheduled_for") == "30/10/2026 18:30"
    assert vars_dict.get("reminder_label") == "Lembrete 30 minutos antes da reunião"
    assert vars_dict.get("reminder_type") == "before_meeting"
    assert vars_dict.get("response_id") == "13"


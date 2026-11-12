import pytest
from unittest.mock import MagicMock
from services.utils.contact_name_helpers import (
    is_generic_or_phone_name,
    find_best_contact_name_for_phone,
    resolve_and_update_conversation_name
)

class TestContactNameHelpers:
    def test_is_generic_or_phone_name_detects_empty_and_null(self):
        assert is_generic_or_phone_name(None) is True
        assert is_generic_or_phone_name("") is True
        assert is_generic_or_phone_name("   ") is True
        assert is_generic_or_phone_name("none") is True
        assert is_generic_or_phone_name("null") is True

    def test_is_generic_or_phone_name_detects_pure_and_formatted_phones(self):
        assert is_generic_or_phone_name("559888623013") is True
        assert is_generic_or_phone_name("5598988623013") is True
        assert is_generic_or_phone_name("+55 98 8862-3013") is True
        assert is_generic_or_phone_name("(98) 98886-2301") is True
        assert is_generic_or_phone_name("9888623013") is True

    def test_is_generic_or_phone_name_detects_generic_terms(self):
        assert is_generic_or_phone_name("Contato") is True
        assert is_generic_or_phone_name("contato") is True
        assert is_generic_or_phone_name("Lead") is True
        assert is_generic_or_phone_name("Cliente") is True
        assert is_generic_or_phone_name("Sem Nome") is True
        assert is_generic_or_phone_name("Lead_3586") is True
        assert is_generic_or_phone_name("cliente_123") is True
        assert is_generic_or_phone_name("Contato ZapVoice") is True

    def test_is_generic_or_phone_name_accepts_valid_names(self):
        assert is_generic_or_phone_name("Mi") is False
        assert is_generic_or_phone_name("Mireille") is False
        assert is_generic_or_phone_name("Lucas Jordão") is False
        assert is_generic_or_phone_name("Josi") is False
        assert is_generic_or_phone_name("Andriéli") is False

    def test_find_best_contact_name_for_phone_returns_lead_name(self):
        db = MagicMock()
        lead_mock = MagicMock()
        lead_mock.name = "Mireille Silva"
        
        # Simula query de webhook_leads
        query_mock = MagicMock()
        filter_mock = MagicMock()
        order_mock = MagicMock()
        
        db.query.return_value = query_mock
        query_mock.filter.return_value = filter_mock
        filter_mock.order_by.return_value = order_mock
        order_mock.all.return_value = [lead_mock]

        result = find_best_contact_name_for_phone(db, client_id=14, phone="559888623013")
        assert result == "Mireille Silva"

    def test_find_best_contact_name_for_phone_ignores_numeric_lead_name(self):
        db = MagicMock()
        numeric_lead = MagicMock()
        numeric_lead.name = "559888623013"
        
        valid_deal = MagicMock()
        valid_deal.contact_name = "Mireille Silva"
        
        # Primeiro chamado para WebhookLead retorna apenas lead numérico
        # Segundo chamado para SalesDeal retorna deal com nome válido
        q1 = MagicMock()
        q1.filter.return_value.order_by.return_value.all.return_value = [numeric_lead]
        
        q2 = MagicMock()
        q2.filter.return_value.order_by.return_value.all.return_value = [valid_deal]

        # Configura side_effect para db.query dependendo do modelo consultado
        def query_side_effect(model):
            import models
            if model == models.WebhookLead:
                return q1
            elif model == models.SalesDeal:
                return q2
            mock_def = MagicMock()
            mock_def.filter.return_value.first.return_value = None
            return mock_def

        db.query.side_effect = query_side_effect

        result = find_best_contact_name_for_phone(db, client_id=14, phone="559888623013")
        assert result == "Mireille Silva"

    def test_resolve_and_update_conversation_name_keeps_valid_name(self):
        db = MagicMock()
        convo = MagicMock()
        convo.contact_name = "Lucas Jordão"

        result = resolve_and_update_conversation_name(db, convo, candidate_name="Outro Nome")
        assert result == "Lucas Jordão"
        db.commit.assert_not_called()

    def test_resolve_and_update_conversation_name_replaces_numeric_with_candidate(self):
        db = MagicMock()
        convo = MagicMock()
        convo.id = 123
        convo.contact_name = "559888623013"

        result = resolve_and_update_conversation_name(db, convo, candidate_name="Mi")
        assert result == "Mi"
        assert convo.contact_name == "Mi"
        db.commit.assert_called_once()

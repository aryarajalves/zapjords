import pytest
from datetime import datetime, timezone
from unittest.mock import MagicMock
from models.crm import SalesDeal, SalesPipelineStage, SalesDealActivity, SalesPipeline
from services.crm_modules.crm_deal_ops_service import move_deal_entry, record_deal_activity, create_deal_entry

def test_record_deal_activity():
    db = MagicMock()
    activity = record_deal_activity(
        db=db,
        deal_id=10,
        client_id=1,
        activity_type="stage_change",
        title="Movido para Proposta",
        description="De Lead para Proposta",
        commit=True
    )
    assert activity is not None
    assert activity.deal_id == 10
    assert activity.activity_type == "stage_change"
    assert activity.title == "Movido para Proposta"
    db.add.assert_called_once()
    db.commit.assert_called_once()

def test_move_deal_to_won_sets_won_at_and_activity():
    db = MagicMock()
    deal = SalesDeal(
        id=42,
        client_id=1,
        pipeline_id=1,
        stage_id=1,
        contact_phone="5511999998888",
        contact_name="Cliente Teste",
        value=1500.0,
        status="open",
        won_at=None,
        stage_entered_at=None
    )
    
    old_stage = SalesPipelineStage(id=1, client_id=1, name="Oportunidade", stage_type="in_progress")
    won_stage = SalesPipelineStage(id=2, client_id=1, name="Venda Fechada", stage_type="won")

    def query_mock(model):
        q = MagicMock()
        if model == SalesDeal:
            q.filter.return_value.first.return_value = deal
        elif model == SalesPipelineStage:
            def filter_mock(*args, **kwargs):
                f = MagicMock()
                # se for o novo estágio
                f.first.return_value = won_stage
                return f
            q.filter.side_effect = filter_mock
        elif model == SalesPipeline:
            q.filter.return_value.first.return_value = SalesPipeline(id=1, name="Funil 1")
        return q

    db.query.side_effect = query_mock

    payload = MagicMock()
    payload.stage_id = 2
    payload.lost_reason = None

    crm_service_mock = MagicMock()

    moved_deal = move_deal_entry(
        db=db,
        deal_id=42,
        client_id=1,
        payload=payload,
        current_user=MagicMock(),
        crm_service_module=crm_service_mock
    )

    assert moved_deal.stage_id == 2
    assert moved_deal.status == "won"
    assert moved_deal.won_at is not None
    assert moved_deal.stage_entered_at is not None

import pytest
from datetime import datetime
from unittest.mock import MagicMock
from services.email_funnel_service import (
    calculate_wait_until_time,
    execute_next_step
)
from models.email import EmailFunnel, EmailFunnelExecution
from models.trigger import WebhookLead

def test_calculate_wait_until_time():
    target = calculate_wait_until_time("09:00", "18:00", weekdays_only=True)
    assert isinstance(target, datetime)
    assert target.hour == 9
    assert target.minute == 0
    # Não pode cair em sábado (5) ou domingo (6) se weekdays_only=True
    assert target.weekday() < 5

@pytest.mark.asyncio
async def test_execute_step_condition_node():
    mock_db = MagicMock()
    
    funnel = MagicMock()
    funnel.id = 10
    funnel.is_active = True
    funnel.stop_tags = []
    funnel.total_completed = 0
    steps = [
        {"id": "c1", "type": "condition", "condition_type": "opened_email"}
    ]
    funnel.steps = steps

    execution = MagicMock()
    execution.id = 1
    execution.funnel_id = 10
    execution.lead_id = None
    execution.status = "active"
    execution.current_step_index = 0
    execution.history = []

    def mock_query(model):
        m = MagicMock()
        if model == EmailFunnelExecution:
            m.filter.return_value.first.return_value = execution
        elif model == EmailFunnel:
            m.filter.return_value.first.return_value = funnel
        return m

    mock_db.query.side_effect = mock_query
    
    result = await execute_next_step(mock_db, 1)
    assert result is True
    assert execution.status == "completed"
    assert len(execution.history) == 1
    assert execution.history[0]["type"] == "condition"

@pytest.mark.asyncio
async def test_execute_step_ab_split_node():
    mock_db = MagicMock()
    
    funnel = MagicMock()
    funnel.id = 10
    funnel.is_active = True
    funnel.stop_tags = []
    funnel.total_completed = 0
    steps = [
        {"id": "s1", "type": "ab_split", "split_ratio": 50}
    ]
    funnel.steps = steps

    execution = MagicMock()
    execution.id = 2
    execution.funnel_id = 10
    execution.lead_id = None
    execution.status = "active"
    execution.current_step_index = 0
    execution.history = []

    def mock_query(model):
        m = MagicMock()
        if model == EmailFunnelExecution:
            m.filter.return_value.first.return_value = execution
        elif model == EmailFunnel:
            m.filter.return_value.first.return_value = funnel
        return m

    mock_db.query.side_effect = mock_query
    
    result = await execute_next_step(mock_db, 2)
    assert result is True
    assert execution.status == "completed"
    assert len(execution.history) == 1
    assert execution.history[0]["type"] == "ab_split"
    assert execution.history[0]["selected_branch"] in ("branch_a", "branch_b")

@pytest.mark.asyncio
async def test_execute_step_wait_until_node():
    mock_db = MagicMock()
    
    funnel = MagicMock()
    funnel.id = 10
    funnel.is_active = True
    funnel.stop_tags = []
    steps = [
        {"id": "w1", "type": "wait_until", "start_time": "10:00", "end_time": "17:00"}
    ]
    funnel.steps = steps

    execution = MagicMock()
    execution.id = 3
    execution.funnel_id = 10
    execution.lead_id = None
    execution.status = "active"
    execution.current_step_index = 0
    execution.history = []

    def mock_query(model):
        m = MagicMock()
        if model == EmailFunnelExecution:
            m.filter.return_value.first.return_value = execution
        elif model == EmailFunnel:
            m.filter.return_value.first.return_value = funnel
        return m

    mock_db.query.side_effect = mock_query
    
    result = await execute_next_step(mock_db, 3)
    assert result is True
    assert execution.status == "waiting_delay"
    assert execution.scheduled_for is not None
    assert len(execution.history) == 1
    assert execution.history[0]["type"] == "wait_until"

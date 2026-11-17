import pytest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from services.utils.bulk_helpers import (
    extract_trigger_invite_config,
    ensure_bulk_invite_vars,
    sanitize_template_components,
)


@pytest.mark.asyncio
async def test_ensure_bulk_invite_vars_generates_links_with_trigger_config():
    trigger = SimpleNamespace(
        invite_role="aluno",
        invite_duration_hours=72,
        invite_course_access=[{"course_id": 5, "access_duration": "1_year"}],
        bussola_invite_role="client",
        bussola_validity_type="48h",
    )
    invite_cfg = extract_trigger_invite_config(trigger)

    components = [
        {
            "type": "body",
            "parameters": [
                {"type": "text", "text": "{{link_cadastro}}"},
                {"type": "text", "text": "{{link_bussola}}"},
            ],
        }
    ]

    mock_platform = AsyncMock(return_value={"full_invite_url": "https://aulas.teste/register?token=plat1"})
    mock_bussola = AsyncMock(return_value={"invite_url": "https://bussola.teste/cadastro?token=bus2"})

    with patch("services.platform_invite_service.generate_platform_invite", mock_platform), \
         patch("services.bussola_invite_service.generate_bussola_invite", mock_bussola):
        result_vars = await ensure_bulk_invite_vars(
            client_id=14,
            components=components,
            contact_vars={"nome": "Arya"},
            invite_config=invite_cfg,
        )

    mock_platform.assert_awaited_once_with(
        client_id=14,
        role="aluno",
        duration_hours=72,
        course_access=[{"course_id": 5, "access_duration": "1_year"}],
    )
    mock_bussola.assert_awaited_once_with(
        client_id=14,
        role="client",
        validity_type="48h",
    )
    assert result_vars["link_cadastro"] == "https://aulas.teste/register?token=plat1"
    assert result_vars["invite_url"] == "https://aulas.teste/register?token=plat1"
    assert result_vars["link_bussola"] == "https://bussola.teste/cadastro?token=bus2"


def test_sanitize_template_components_replaces_link_cadastro_and_link_bussola():
    components = [
        {
            "type": "body",
            "parameters": [
                {"type": "text", "text": "{{primeiro_nome}}"},
                {"type": "text", "text": "{{link_cadastro}}"},
                {"type": "text", "text": "{{link_bussola}}"},
            ],
        }
    ]
    contact_vars = {
        "nome": "Arya Raj",
        "link_cadastro": "https://aulas.teste/register?token=plat1",
        "link_bussola": "https://bussola.teste/cadastro?token=bus2",
    }

    sanitized = sanitize_template_components(
        components=components,
        contact_name="Arya Raj",
        contact_phone="5511999999999",
        contact_vars=contact_vars,
    )

    params = sanitized[0]["parameters"]
    assert params[0]["text"] == "Arya"
    assert params[1]["text"] == "https://aulas.teste/register?token=plat1"
    assert params[2]["text"] == "https://bussola.teste/cadastro?token=bus2"

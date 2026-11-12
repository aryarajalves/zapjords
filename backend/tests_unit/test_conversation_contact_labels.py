import pytest
from datetime import datetime, timezone
import models
from routers.chat.conversation_modules.list_routes import (
    get_contact_labels_map,
    _format_conversation_dict
)

def test_get_contact_labels_map_matches_exact_and_suffix(db_session):
    client_id = 999
    
    # Criar leads com tags
    lead1 = models.WebhookLead(
        client_id=client_id,
        phone="5511999998888",
        name="Lead Um",
        tags="vip, cliente_ativo, blackfriday"
    )
    lead2 = models.WebhookLead(
        client_id=client_id,
        phone="5585988887777",
        name="Lead Dois",
        tags="alunos_astrowake"
    )
    db_session.add_all([lead1, lead2])
    db_session.commit()

    # Buscar pelo telefone completo
    labels_map = get_contact_labels_map(db_session, client_id, ["5511999998888", "5585988887777"])
    assert "5511999998888" in labels_map
    assert labels_map["5511999998888"] == ["vip", "cliente_ativo", "blackfriday"]
    assert "5585988887777" in labels_map
    assert labels_map["5585988887777"] == ["alunos_astrowake"]

    # Buscar pelo sufixo de 8 dígitos
    assert "99998888" in labels_map
    assert labels_map["99998888"] == ["vip", "cliente_ativo", "blackfriday"]

def test_format_conversation_dict_includes_contact_labels():
    convo = models.ChatConversation(
        id=100,
        client_id=1,
        phone="5511999998888",
        contact_name="Lia",
        status="open",
        labels=["lead_bussola", "humano"]
    )
    
    formatted = _format_conversation_dict(
        c=convo,
        blocked_suffixes=set(),
        resting_map={},
        active_funnels_map={},
        contact_labels=["blackfriday-astrowake", "alunos_astrowake"]
    )

    assert formatted["labels"] == ["lead_bussola", "humano"]
    assert formatted["contact_labels"] == ["blackfriday-astrowake", "alunos_astrowake"]
    assert formatted["phone"] == "5511999998888"

import pytest
from models import BlockedContact, WebhookLead, Client
from services.blocked_contacts_service import (
    is_email_blocked,
    get_blocked_emails_set,
    generate_unsubscribe_token,
    verify_unsubscribe_token
)

def test_token_generation_and_verification():
    client_id = 42
    email = "lead.interessado@empresa.com"
    token = generate_unsubscribe_token(client_id, email)
    
    assert token is not None
    assert "." in token
    
    verified_cid, verified_em = verify_unsubscribe_token(token)
    assert verified_cid == client_id
    assert verified_em == email

def test_tampered_token_rejected():
    token = generate_unsubscribe_token(10, "usuario@teste.com")
    parts = token.split(".")
    tampered_token = f"{parts[0]}a.{parts[1]}"
    
    cid, em = verify_unsubscribe_token(tampered_token)
    assert cid is None
    assert em is None

def test_unsubscribe_endpoint_blocks_only_email(client, db_session):
    # Setup test client and lead
    client_obj = Client(name="Empresa Teste Email", is_active=True)
    db_session.add(client_obj)
    db_session.commit()
    client_id = client_obj.id

    test_email = "descadastro.teste@empresa.com"
    test_phone = "5511999998888"

    lead = WebhookLead(
        client_id=client_id,
        name="Lead Teste Descadastro",
        email=test_email,
        phone=test_phone,
        tags="vip"
    )
    db_session.add(lead)
    db_session.commit()

    token = generate_unsubscribe_token(client_id, test_email)

    # 1. Test GET unsubscribe-page
    resp_get = client.get(f"/api/email/unsubscribe-page?token={token}")
    assert resp_get.status_code == 200
    assert "Cancelar Inscrição?" in resp_get.text
    assert test_email in resp_get.text

    # 2. Test POST unsubscribe confirmation
    resp_post = client.post("/api/email/unsubscribe", json={"token": token})
    assert resp_post.status_code == 200
    assert resp_post.json()["status"] == "success"

    # 3. Verify in database: blocked_contacts has email, phone is None (CANAL ISOLADO)
    blocked = db_session.query(BlockedContact).filter(
        BlockedContact.client_id == client_id,
        BlockedContact.email == test_email
    ).first()
    assert blocked is not None
    assert blocked.phone is None # WhatsApp NÃO é bloqueado
    assert "Descadastro" in (blocked.reason or "")

    # 4. Verify WebhookLead had email cleared from active list
    lead_refreshed = db_session.query(WebhookLead).filter(WebhookLead.id == lead.id).first()
    assert lead_refreshed.email is None
    assert lead_refreshed.phone == test_phone # Telefone preservado intacto

    # 5. Verify is_email_blocked helper
    assert is_email_blocked(db_session, client_id, test_email) is True
    assert test_email in get_blocked_emails_set(db_session, client_id)

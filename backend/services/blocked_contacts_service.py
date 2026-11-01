import hmac
import hashlib
import base64
import json
import time
import os
from sqlalchemy.orm import Session
from typing import Set, Optional
import models


def get_client_and_sibling_ids(db: Session, client_id: int) -> list:
    """Retorna o ID do cliente e de clientes irmãos do mesmo projeto (se houver)."""
    client_ids = [client_id]
    client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if client and client.project_id:
        siblings = db.query(models.Client.id).filter(models.Client.project_id == client.project_id).all()
        client_ids = [c.id for c in siblings]
    return client_ids


def is_contact_blocked(db: Session, client_id: int, phone: Optional[str]) -> bool:
    """
    Verifica se um telefone está na lista de contatos bloqueados (BlockedContact)
    do cliente ou de clientes do mesmo projeto, considerando os últimos 8 dígitos.
    """
    if not phone:
        return False
    
    clean_phone = "".join(filter(str.isdigit, str(phone)))
    if len(clean_phone) < 8:
        return False
        
    suffix = clean_phone[-8:]
    client_ids = get_client_and_sibling_ids(db, client_id)

    exists = db.query(models.BlockedContact.id).filter(
        models.BlockedContact.client_id.in_(client_ids),
        models.BlockedContact.phone.like(f"%{suffix}")
    ).first()

    return exists is not None


def get_blocked_phone_suffixes(db: Session, client_id: int) -> Set[str]:
    """
    Retorna um conjunto (Set) com os últimos 8 dígitos de todos os telefones bloqueados
    para o cliente e seus clientes irmãos de projeto. Otimizado para verificações em lote.
    """
    client_ids = get_client_and_sibling_ids(db, client_id)
    blocked_entries = db.query(models.BlockedContact.phone).filter(
        models.BlockedContact.client_id.in_(client_ids)
    ).all()

    suffixes = set()
    for row in blocked_entries:
        if not row[0]:
            continue
        digits = "".join(filter(str.isdigit, str(row[0])))
        if len(digits) >= 8:
            suffixes.add(digits[-8:])
        elif digits:
            suffixes.add(digits)
    return suffixes


def is_phone_in_blocked_suffixes(phone: Optional[str], blocked_suffixes: Set[str]) -> bool:
    """Verifica rapidamente em memória se um telefone corresponde a algum sufixo bloqueado."""
    if not phone or not blocked_suffixes:
        return False
    digits = "".join(filter(str.isdigit, str(phone)))
    if len(digits) >= 8:
        return digits[-8:] in blocked_suffixes
    return digits in blocked_suffixes


def is_email_blocked(db: Session, client_id: int, email: Optional[str]) -> bool:
    """
    Verifica se um endereço de e-mail está na lista de bloqueados (BlockedContact)
    do cliente ou de clientes irmãos do mesmo projeto (case-insensitive).
    """
    if not email or "@" not in email:
        return False
    
    clean_email = email.strip().lower()
    client_ids = get_client_and_sibling_ids(db, client_id)

    exists = db.query(models.BlockedContact.id).filter(
        models.BlockedContact.client_id.in_(client_ids),
        models.BlockedContact.email.ilike(clean_email)
    ).first()

    return exists is not None


def get_blocked_emails_set(db: Session, client_id: int) -> Set[str]:
    """
    Retorna um conjunto (Set) com todos os e-mails bloqueados (em minúsculas)
    para o cliente e seus clientes irmãos de projeto. Otimizado para verificações em lote.
    """
    client_ids = get_client_and_sibling_ids(db, client_id)
    blocked_entries = db.query(models.BlockedContact.email).filter(
        models.BlockedContact.client_id.in_(client_ids),
        models.BlockedContact.email.isnot(None)
    ).all()

    return {row[0].strip().lower() for row in blocked_entries if row[0] and "@" in row[0]}


def _get_signing_secret() -> bytes:
    raw = os.getenv("SECRET_KEY", "zapvoice-default-secret-key-32chars-minimum!!")
    return raw.strip('"').strip("'").strip().encode("utf-8")


def generate_unsubscribe_token(client_id: int, email: str) -> str:
    """
    Gera um token assinado (HMAC-SHA256) e URL-safe para descadastro seguro de e-mail.
    """
    payload = {
        "cid": int(client_id),
        "em": email.strip().lower(),
        "ts": int(time.time())
    }
    payload_json = json.dumps(payload, separators=(',', ':')).encode("utf-8")
    payload_b64 = base64.urlsafe_b64encode(payload_json).decode("ascii").rstrip("=")
    
    secret = _get_signing_secret()
    sig = hmac.new(secret, payload_b64.encode("ascii"), hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).decode("ascii").rstrip("=")
    
    return f"{payload_b64}.{sig_b64}"


def verify_unsubscribe_token(token: str) -> tuple[Optional[int], Optional[str]]:
    """
    Valida a assinatura do token de descadastro.
    Retorna (client_id, email) se válido, ou (None, None) se adulterado ou inválido.
    """
    if not token or "." not in token:
        return None, None
    try:
        parts = token.strip().split(".")
        if len(parts) != 2:
            return None, None
        payload_b64, sig_b64 = parts

        secret = _get_signing_secret()
        expected_sig = hmac.new(secret, payload_b64.encode("ascii"), hashlib.sha256).digest()
        expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).decode("ascii").rstrip("=")

        if not hmac.compare_digest(sig_b64, expected_sig_b64):
            return None, None

        # Re-adiciona padding base64 se necessário
        rem = len(payload_b64) % 4
        padded_b64 = payload_b64 + ("=" * (4 - rem) if rem else "")
        payload_data = json.loads(base64.urlsafe_b64decode(padded_b64).decode("utf-8"))

        cid = payload_data.get("cid")
        em = payload_data.get("em")
        if cid and em:
            return int(cid), str(em).strip().lower()
        return None, None
    except Exception:
        return None, None

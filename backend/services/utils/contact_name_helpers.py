import re
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

import models
from core.logger import setup_logger

logger = setup_logger("ContactNameHelpers")

GENERIC_NAMES = {
    "", "none", "null", "contato", "lead", "cliente",
    "sem nome", "contato zapvoice", "contato manual",
    "contato simulado", "cliente whatsapp", "desconhecido"
}

def is_generic_or_phone_name(name: Optional[str]) -> bool:
    """
    Retorna True se o nome for nulo, vazio, contiver apenas dígitos (telefone)
    ou corresponder a um termo genérico do sistema.
    """
    if not name:
        return True
    
    clean = str(name).strip()
    if not clean:
        return True
    
    # Remove caracteres usuais de formatação de telefone (+, -, (, ), espaços)
    digits_only = re.sub(r"[\s\+\-\(\)\.]", "", clean)
    if digits_only.isdigit() and len(digits_only) >= 8:
        return True
    
    # Se todo o texto for apenas dígitos
    if clean.isdigit():
        return True
    
    lower = clean.lower()
    if lower in GENERIC_NAMES:
        return True
    
    if lower.startswith("lead_") or lower.startswith("cliente_") or lower.startswith("contato_"):
        return True
        
    return False

def find_best_contact_name_for_phone(db: Session, client_id: int, phone: str) -> Optional[str]:
    """
    Localiza o melhor nome real para o telefone consultando webhook_leads e sales_deals.
    Utiliza correspondência pelos últimos 8 dígitos para compatibilidade com o 9º dígito.
    """
    if not phone:
        return None
        
    digits = re.sub(r"\D", "", str(phone))
    if len(digits) < 8:
        return None
    suffix8 = digits[-8:]

    # 1. Tentar em WebhookLead para o mesmo client_id
    leads = db.query(models.WebhookLead).filter(
        models.WebhookLead.client_id == client_id,
        models.WebhookLead.phone.like(f"%{suffix8}")
    ).order_by(models.WebhookLead.updated_at.desc().nullslast()).all()

    for ld in leads:
        if ld.name and not is_generic_or_phone_name(ld.name):
            return ld.name.strip()

    # 2. Tentar em SalesDeal para o mesmo client_id
    deals = db.query(models.SalesDeal).filter(
        models.SalesDeal.client_id == client_id,
        models.SalesDeal.contact_phone.like(f"%{suffix8}")
    ).order_by(models.SalesDeal.updated_at.desc().nullslast()).all()

    for deal in deals:
        if deal.contact_name and not is_generic_or_phone_name(deal.contact_name):
            return deal.contact_name.strip()

    # 3. Tentar em projeto compartilhado se o cliente pertencer a um projeto
    client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if client and client.project_id:
        proj_leads = db.query(models.WebhookLead).filter(
            models.WebhookLead.project_id == client.project_id,
            models.WebhookLead.phone.like(f"%{suffix8}")
        ).order_by(models.WebhookLead.updated_at.desc().nullslast()).all()

        for pld in proj_leads:
            if pld.name and not is_generic_or_phone_name(pld.name):
                return pld.name.strip()

    return None

def resolve_and_update_conversation_name(
    db: Session,
    convo: models.ChatConversation,
    candidate_name: Optional[str] = None
) -> str:
    """
    Verifica se a conversa precisa de atualização de nome.
    Se o nome atual for genérico ou número, resolve o nome real e persiste.
    Retorna o nome final formatado da conversa.
    """
    current_name = getattr(convo, "contact_name", None)
    
    if not is_generic_or_phone_name(current_name):
        return current_name.strip()
        
    # Se recebemos um candidato válido (ex: profile name do WhatsApp)
    if candidate_name and not is_generic_or_phone_name(candidate_name):
        new_name = candidate_name.strip()
        convo.contact_name = new_name
        try:
            db.commit()
            logger.info(f"👤 [NAME-SYNC] Nome da conversa #{convo.id} atualizado com candidate: '{new_name}'")
        except Exception as e:
            logger.error(f"Erro ao persistir novo nome na conversa #{convo.id}: {e}")
            db.rollback()
        return new_name

    # Busca na base de leads e CRM
    best_name = find_best_contact_name_for_phone(db, convo.client_id, convo.phone)
    if best_name and not is_generic_or_phone_name(best_name):
        convo.contact_name = best_name
        try:
            db.commit()
            logger.info(f"👤 [NAME-SYNC] Nome da conversa #{convo.id} atualizado da base de leads: '{best_name}'")
        except Exception as e:
            logger.error(f"Erro ao persistir novo nome na conversa #{convo.id}: {e}")
            db.rollback()
        return best_name

    return current_name or convo.phone

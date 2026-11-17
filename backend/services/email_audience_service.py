# -*- coding: utf-8 -*-
"""
Serviço de resolução de audiência do E-mail Marketing.
Inclui fallback de busca de e-mail na aba Contatos (WebhookLead) pelo telefone
para cards do Kanban de Vendas que não possuem contact_email preenchido.
"""

from typing import Optional, Set
from sqlalchemy.orm import Session

import models
from core.logger import logger
from services.utils.phone_utils import normalize_phone, get_phone_suffix


def _build_contacts_email_index(db: Session, client_id: int) -> tuple[dict, dict]:
    """Indexa leads da aba Contatos (WebhookLead) com e-mail válido por telefone normalizado e sufixo."""
    exact_map: dict[str, models.WebhookLead] = {}
    suffix_map: dict[str, models.WebhookLead] = {}

    leads = (
        db.query(models.WebhookLead)
        .filter(
            models.WebhookLead.client_id == client_id,
            models.WebhookLead.email.isnot(None),
            models.WebhookLead.email != "",
        )
        .order_by(models.WebhookLead.id.desc())
        .all()
    )

    for lead in leads:
        email = (lead.email or "").strip()
        if not email or "@" not in email:
            continue
        norm = normalize_phone(lead.phone or "")
        if norm and norm not in exact_map:
            exact_map[norm] = lead
        suf = get_phone_suffix(lead.phone or "", 8)
        if suf and suf not in suffix_map:
            suffix_map[suf] = lead

    return exact_map, suffix_map


def _find_fallback_lead(phone: str, exact_map: dict, suffix_map: dict) -> Optional[models.WebhookLead]:
    norm = normalize_phone(phone or "")
    if norm and norm in exact_map:
        return exact_map[norm]
    suf = get_phone_suffix(phone or "", 8)
    if suf and suf in suffix_map:
        return suffix_map[suf]
    return None


def resolve_kanban_audience_contacts(
    db: Session,
    client_id: int,
    pipeline_id: Optional[int],
    stage_id: Optional[int],
    blocked_emails: Set[str],
) -> list:
    """
    Resolve os destinatários de e-mail a partir dos cards do Kanban de Vendas.
    Se um card não tiver contact_email, busca o e-mail correspondente na aba Contatos (WebhookLead)
    cruzando pelo telefone normalizado.
    """
    query = db.query(models.SalesDeal).filter(models.SalesDeal.client_id == client_id)
    if pipeline_id:
        query = query.filter(models.SalesDeal.pipeline_id == pipeline_id)
    if stage_id:
        query = query.filter(models.SalesDeal.stage_id == stage_id)

    deals = query.all()
    needs_fallback = any(
        (not (d.contact_email or "").strip() or "@" not in (d.contact_email or ""))
        and (d.contact_phone or "").strip()
        for d in deals
    )

    exact_map, suffix_map = _build_contacts_email_index(db, client_id) if needs_fallback else ({}, {})

    target_contacts = []
    seen_emails: Set[str] = set()
    fallback_hits = 0

    for d in deals:
        email = (d.contact_email or "").strip()
        fallback_lead = None

        if (not email or "@" not in email) and (d.contact_phone or "").strip():
            fallback_lead = _find_fallback_lead(d.contact_phone, exact_map, suffix_map)
            if fallback_lead:
                email = (fallback_lead.email or "").strip()
                fallback_hits += 1

        if email and "@" in email and email.lower() not in seen_emails and email.lower() not in blocked_emails:
            seen_emails.add(email.lower())
            target_contacts.append({
                "email": email,
                "name": d.contact_name or d.title or (fallback_lead.name if fallback_lead else "") or "",
                "phone": d.contact_phone or (fallback_lead.phone if fallback_lead else "") or "",
                "product_name": d.product_name or (fallback_lead.product_name if fallback_lead else "") or "",
                "platform": d.channel or "kanban",
                "price": str(d.value) if d.value else "",
                "payment_method": "",
                "tags": f"kanban_stage_{d.stage_id}",
            })

    if fallback_hits:
        logger.info(
            f"📧 [EMAIL_AUDIENCE] Fallback na aba Contatos recuperou {fallback_hits} e-mail(s) "
            f"para cards do Kanban (Client ID: {client_id})."
        )

    return target_contacts

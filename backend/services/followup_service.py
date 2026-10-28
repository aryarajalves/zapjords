# -*- coding: utf-8 -*-
"""
Serviço de Gestão e Execução de Follow-up em Disparos em Massa (ZapVoice).
Regras de Negócio:
1. Qualificação: Apenas contatos com entrega confirmada ('delivered' ou 'read') no disparo pai.
2. Descarte Automático: Contatos com falha no pai ou em lista de bloqueio são ignorados.
3. Critérios de Interrupção:
   - Clique em botão do template (interação ou bloqueio);
   - Presença de etiqueta de parada (stop_tags) na conversa (ChatConversation) ou no contato (WebhookLead);
   - Cancelamento manual (da etapa ou do contato específico).
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_

import models
from core.logger import logger
from services.utils.phone_utils import normalize_phone


def create_followup_triggers(
    db: Session,
    parent_trigger: models.ScheduledTrigger,
    followups_data: List[Dict[str, Any]],
    client_id: int
) -> List[models.ScheduledTrigger]:
    """
    Cria os agendamentos filhos de follow-up vinculados ao disparo pai.
    """
    if not followups_data:
        return []

    created_triggers = []
    base_time = parent_trigger.scheduled_time or datetime.now(timezone.utc)
    if base_time.tzinfo is None:
        base_time = base_time.replace(tzinfo=timezone.utc)

    for idx, fu in enumerate(followups_data, start=1):
        schedule_type = fu.get("schedule_type", "relative")
        relative_hours = fu.get("relative_delay_hours")
        
        if schedule_type == "relative":
            hours = int(relative_hours) if relative_hours is not None else 24
            fu_scheduled_time = base_time + timedelta(hours=hours)
        else:
            sched_str = fu.get("scheduled_time")
            if sched_str:
                try:
                    fu_scheduled_time = datetime.fromisoformat(str(sched_str).replace("Z", "+00:00"))
                except (ValueError, TypeError):
                    fu_scheduled_time = base_time + timedelta(hours=24)
            else:
                fu_scheduled_time = base_time + timedelta(hours=24)

        if fu_scheduled_time.tzinfo is None:
            fu_scheduled_time = fu_scheduled_time.replace(tzinfo=timezone.utc)

        template_name = fu.get("template_name")
        if not template_name:
            continue

        raw_stop_tags = fu.get("stop_tags") or []
        clean_stop_tags = [str(t).strip() for t in raw_stop_tags if str(t).strip()]

        fu_trigger = models.ScheduledTrigger(
            client_id=client_id,
            parent_id=parent_trigger.id,
            is_bulk=True,
            is_followup=True,
            followup_step_number=idx,
            template_name=template_name,
            template_language=fu.get("language") or parent_trigger.template_language or "pt_BR",
            template_components=fu.get("components"),
            button_actions=fu.get("button_actions"),
            stop_tags=clean_stop_tags,
            schedule_type=schedule_type,
            relative_delay_hours=int(relative_hours) if relative_hours is not None else None,
            scheduled_time=fu_scheduled_time,
            delay_seconds=parent_trigger.delay_seconds or 5,
            concurrency_limit=parent_trigger.concurrency_limit or 1,
            chatwoot_label=parent_trigger.chatwoot_label,
            contact_labels=parent_trigger.contact_labels,
            status="queued",
            contacts_list=[],
            total_contacts=0
        )
        db.add(fu_trigger)
        created_triggers.append(fu_trigger)

    db.commit()
    for t in created_triggers:
        db.refresh(t)

    logger.info(f"✅ [FOLLOW-UP] Criados {len(created_triggers)} follow-ups vinculados ao disparo pai #{parent_trigger.id}")
    return created_triggers


def qualify_followup_contacts(db: Session, followup_trigger: models.ScheduledTrigger) -> List[Dict[str, Any]]:
    """
    Avalia os contatos do disparo pai e retorna apenas os contatos qualificados para receber o follow-up.
    Aplica filtros de entrega confirmada, lista de bloqueio, cliques em botões e etiquetas de parada.
    """
    parent = db.query(models.ScheduledTrigger).get(followup_trigger.parent_id)
    if not parent:
        logger.warning(f"⚠️ [FOLLOW-UP #{followup_trigger.id}] Disparo pai #{followup_trigger.parent_id} não encontrado.")
        return []

    # 1. Contatos que tiveram entrega confirmada no pai
    delivered_statuses = db.query(models.MessageStatus).filter(
        models.MessageStatus.trigger_id == parent.id,
        models.MessageStatus.status.in_(["delivered", "read"])
    ).all()

    if not delivered_statuses:
        logger.info(f"ℹ️ [FOLLOW-UP #{followup_trigger.id}] Nenhum contato entregue/lido no disparo pai #{parent.id}.")
        return []

    # Mapa de dados originais dos contatos do pai (para preservar variáveis dinâmicas)
    parent_contacts_map = {}
    if parent.contacts_list:
        for c in parent.contacts_list:
            p = normalize_phone(c.get("phone") or c.get("telefone") or "")
            if p:
                parent_contacts_map[p] = c

    # 2. Blacklist do cliente
    blocked_phones = set()
    blocked_rows = db.query(models.BlockedContact.phone).filter(
        models.BlockedContact.client_id == followup_trigger.client_id
    ).all()
    for b in blocked_rows:
        bp = normalize_phone(b[0])
        if bp:
            blocked_phones.add(bp)

    # 3. Contatos que interagiram / clicaram em botão no disparo pai ou em follow-ups anteriores
    # Buscar triggers da mesma árvore (pai + outros follow-ups concluídos)
    related_trigger_ids = [parent.id]
    prev_fus = db.query(models.ScheduledTrigger.id).filter(
        models.ScheduledTrigger.parent_id == parent.id,
        models.ScheduledTrigger.id != followup_trigger.id
    ).all()
    for pf in prev_fus:
        related_trigger_ids.append(pf[0])

    interacted_phones = set()
    interacted_rows = db.query(models.MessageStatus.phone_number).filter(
        models.MessageStatus.trigger_id.in_(related_trigger_ids),
        models.MessageStatus.is_interaction == True
    ).all()
    for ir in interacted_rows:
        ip = normalize_phone(ir[0])
        if ip:
            interacted_phones.add(ip)

    # 4. Etiquetas de Parada (Stop Tags)
    stop_tags = [str(t).strip().lower() for t in (followup_trigger.stop_tags or []) if str(t).strip()]

    # 5. Lista de exclusão explícita do próprio follow-up
    exclusion_list = set()
    if followup_trigger.exclusion_list:
        for ex in followup_trigger.exclusion_list:
            exp = normalize_phone(ex)
            if exp:
                exclusion_list.add(exp)

    qualified_contacts = []
    seen_phones = set()

    for ms in delivered_statuses:
        phone = normalize_phone(ms.phone_number)
        if not phone or phone in seen_phones:
            continue
        seen_phones.add(phone)

        # Regra A: Descartar bloqueados
        if phone in blocked_phones:
            logger.info(f"🚫 [FOLLOW-UP #{followup_trigger.id}] {phone} descartado: na lista de bloqueio.")
            continue

        # Regra B: Descartar se foi excluído manualmente deste follow-up
        if phone in exclusion_list:
            logger.info(f"🚫 [FOLLOW-UP #{followup_trigger.id}] {phone} descartado: excluído manualmente do follow-up.")
            continue

        # Regra C: Descartar se clicou em botão do template
        if phone in interacted_phones:
            logger.info(f"🚫 [FOLLOW-UP #{followup_trigger.id}] {phone} cancelado: clicou em botão de template no disparo pai/anterior.")
            continue

        # Regra D: Descartar se tiver Stop Tag
        if stop_tags:
            # D1: Na conversa do chat
            conv = db.query(models.ChatConversation).filter(
                models.ChatConversation.client_id == followup_trigger.client_id,
                models.ChatConversation.phone == phone
            ).first()
            if conv and conv.labels:
                if isinstance(conv.labels, list):
                    conv_labels = [str(l).strip().lower() for l in conv.labels]
                elif isinstance(conv.labels, str):
                    conv_labels = [str(l).strip().lower() for l in conv.labels.split(",") if str(l).strip()]
                else:
                    conv_labels = []
                if any(st in conv_labels for st in stop_tags):
                    logger.info(f"🚫 [FOLLOW-UP #{followup_trigger.id}] {phone} cancelado: possui etiqueta de parada no chat ({conv_labels}).")
                    continue

            # D2: No cadastro do lead
            lead = db.query(models.WebhookLead).filter(
                models.WebhookLead.client_id == followup_trigger.client_id,
                models.WebhookLead.phone == phone
            ).first()
            if lead and lead.tags:
                if isinstance(lead.tags, list):
                    lead_tags = [str(t).strip().lower() for t in lead.tags]
                elif isinstance(lead.tags, str):
                    lead_tags = [str(t).strip().lower() for t in lead.tags.split(",") if str(t).strip()]
                else:
                    lead_tags = []
                if any(st in lead_tags for st in stop_tags):
                    logger.info(f"🚫 [FOLLOW-UP #{followup_trigger.id}] {phone} cancelado: possui etiqueta de parada no lead ({lead_tags}).")
                    continue

        # Contato 100% qualificado!
        base_contact = parent_contacts_map.get(phone, {"phone": phone, "name": getattr(ms, "contact_name", None) or phone})
        base_contact["phone"] = phone
        qualified_contacts.append(base_contact)

    logger.info(f"🎯 [FOLLOW-UP #{followup_trigger.id}] Total qualificados: {len(qualified_contacts)} de {len(delivered_statuses)} entregues.")
    return qualified_contacts


def cancel_contact_from_pending_followups(db: Session, client_id: int, phone: str, reason: str = "interagiu_botao") -> int:
    """
    Cancela ou remove um contato de todos os follow-ups agendados pendentes.
    Chamado quando o contato clica em botão ou recebe uma etiqueta de parada.
    """
    norm_phone = normalize_phone(phone)
    if not norm_phone:
        return 0

    pending_fus = db.query(models.ScheduledTrigger).filter(
        models.ScheduledTrigger.client_id == client_id,
        models.ScheduledTrigger.is_followup == True,
        models.ScheduledTrigger.status.in_(["queued", "pending"])
    ).all()

    affected_count = 0
    for fu in pending_fus:
        cur_exclusions = list(fu.exclusion_list or [])
        if norm_phone not in cur_exclusions:
            cur_exclusions.append(norm_phone)
            fu.exclusion_list = cur_exclusions
            affected_count += 1
            logger.info(f"🚫 [FOLLOW-UP-AUTO-CANCEL] Contato {norm_phone} removido do Follow-up #{fu.id} (Motivo: {reason})")

    if affected_count > 0:
        db.commit()

    return affected_count

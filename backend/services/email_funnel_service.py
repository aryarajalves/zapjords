from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from core.logger import setup_logger
from models.email import EmailFunnel, EmailFunnelExecution, EmailTemplate, EmailConfig
from models.trigger import WebhookLead
from services.email_service import send_single_email

logger = setup_logger("email_funnel_service")

def _now():
    return datetime.now(timezone.utc)

def calculate_delay_time(delay_value: int, delay_unit: str) -> datetime:
    """Calcula a data e hora futura baseado no valor e unidade de delay."""
    now = _now()
    unit = (delay_unit or "hours").lower()
    if unit in ("minute", "minutes", "min", "m"):
        return now + timedelta(minutes=max(1, int(delay_value)))
    elif unit in ("day", "days", "d", "dia", "dias"):
        return now + timedelta(days=max(1, int(delay_value)))
    else:  # hours default
        return now + timedelta(hours=max(1, int(delay_value)))

async def enroll_contact_in_funnel(
    db: Session,
    client_id: int,
    funnel_id: int,
    contact_email: str,
    contact_name: Optional[str] = None,
    lead_id: Optional[int] = None,
    start_immediately: bool = True
) -> Optional[EmailFunnelExecution]:
    """
    Inscreve um contato em um funil de e-mail marketing.
    """
    if not contact_email or "@" not in contact_email:
        logger.warning(f"Tentativa de inscrever e-mail inválido: {contact_email}")
        return None

    funnel = db.query(EmailFunnel).filter(
        EmailFunnel.id == funnel_id,
        EmailFunnel.client_id == client_id,
        EmailFunnel.is_active == True
    ).first()

    if not funnel:
        logger.warning(f"Funil {funnel_id} não encontrado ou inativo para cliente {client_id}")
        return None

    # Se já existir execução ativa ou em delay para este contato neste funil, não duplica
    existing = db.query(EmailFunnelExecution).filter(
        EmailFunnelExecution.client_id == client_id,
        EmailFunnelExecution.funnel_id == funnel_id,
        EmailFunnelExecution.contact_email == contact_email,
        EmailFunnelExecution.status.in_(["active", "waiting_delay"])
    ).first()

    if existing:
        logger.info(f"Contato {contact_email} já possui execução ativa no funil {funnel.name} (ID: {funnel.id})")
        return existing

    # Buscar dados do lead se não fornecidos
    if not lead_id:
        lead = db.query(WebhookLead).filter(
            WebhookLead.client_id == client_id,
            WebhookLead.email == contact_email
        ).first()
        if lead:
            lead_id = lead.id
            if not contact_name:
                contact_name = lead.name

    execution = EmailFunnelExecution(
        client_id=client_id,
        funnel_id=funnel_id,
        lead_id=lead_id,
        contact_email=contact_email,
        contact_name=contact_name or "",
        current_step_index=0,
        status="active",
        history=[]
    )
    db.add(execution)
    
    funnel.total_enrolled = (funnel.total_enrolled or 0) + 1
    db.commit()
    db.refresh(execution)

    logger.info(f"Contato {contact_email} inscrito no funil '{funnel.name}' (Execução ID: {execution.id})")

    if start_immediately:
        await execute_next_step(db, execution.id)

    return execution

async def execute_next_step(db: Session, execution_id: int) -> bool:
    """
    Executa ou agenda o próximo passo do funil para a execução indicada.
    """
    execution = db.query(EmailFunnelExecution).filter(EmailFunnelExecution.id == execution_id).first()
    if not execution or execution.status in ["completed", "stopped_tag", "stopped_purchase", "cancelled", "failed"]:
        return False

    funnel = db.query(EmailFunnel).filter(EmailFunnel.id == execution.funnel_id).first()
    if not funnel or not funnel.is_active:
        execution.status = "cancelled"
        execution.stop_reason = "Funil desativado ou excluído"
        db.commit()
        return False

    # Validação de Stop Tags
    if funnel.stop_tags:
        stop_tags = [t.strip().lower() for t in funnel.stop_tags if isinstance(t, str)]
        if stop_tags:
            lead = db.query(WebhookLead).filter(WebhookLead.id == execution.lead_id).first() if execution.lead_id else None
            lead_tags = [t.strip().lower() for t in (lead.tags or [])] if (lead and lead.tags) else []
            has_stop_tag = any(st in lead_tags for st in stop_tags)
            if has_stop_tag:
                execution.status = "stopped_tag"
                execution.stop_reason = f"Contato possui etiqueta de parada: {', '.join(stop_tags)}"
                db.commit()
                logger.info(f"Execução {execution.id} interrompida por Stop Tag no funil '{funnel.name}'")
                return False

    steps = funnel.steps or []
    if execution.current_step_index >= len(steps):
        execution.status = "completed"
        execution.stop_reason = "Sequência concluída com sucesso"
        funnel.total_completed = (funnel.total_completed or 0) + 1
        db.commit()
        logger.info(f"Execução {execution.id} do funil '{funnel.name}' finalizada!")
        return True

    current_step = steps[execution.current_step_index]
    step_type = current_step.get("type", "email")

    if step_type == "delay":
        delay_val = int(current_step.get("delay_value") or current_step.get("delay") or 1)
        delay_unit = current_step.get("delay_unit") or current_step.get("timeUnit") or "hours"
        scheduled_at = calculate_delay_time(delay_val, delay_unit)
        
        execution.status = "waiting_delay"
        execution.scheduled_for = scheduled_at
        
        # Registrar no histórico
        hist = list(execution.history or [])
        hist.append({
            "step_index": execution.current_step_index,
            "type": "delay",
            "delay_value": delay_val,
            "delay_unit": delay_unit,
            "scheduled_for": scheduled_at.isoformat(),
            "recorded_at": _now().isoformat()
        })
        execution.history = hist
        
        # O próximo passo a rodar após o delay será current_step_index + 1
        execution.current_step_index += 1
        db.commit()
        logger.info(f"Execução {execution.id} aguardando delay de {delay_val} {delay_unit} até {scheduled_at}")
        return True

    elif step_type == "email":
        template_id = current_step.get("template_id")
        subject_override = current_step.get("subject")
        
        template = db.query(EmailTemplate).filter(
            EmailTemplate.id == template_id,
            EmailTemplate.client_id == execution.client_id
        ).first() if template_id else None

        if not template:
            # Falha por ausência de template
            hist = list(execution.history or [])
            hist.append({
                "step_index": execution.current_step_index,
                "type": "email",
                "status": "failed",
                "error": f"Template ID {template_id} não encontrado",
                "recorded_at": _now().isoformat()
            })
            execution.history = hist
            execution.status = "failed"
            execution.stop_reason = f"Template {template_id} não encontrado"
            db.commit()
            return False

        config = db.query(EmailConfig).filter(EmailConfig.client_id == execution.client_id).first()
        subject = subject_override or template.subject
        body_html = template.body_html

        rec_name = execution.contact_name or ""
        send_result = await send_single_email(
            config=config,
            to_email=execution.contact_email,
            subject=subject,
            body_html=body_html,
            recipient_name=rec_name
        )

        hist = list(execution.history or [])
        if send_result.get("success"):
            hist.append({
                "step_index": execution.current_step_index,
                "type": "email",
                "template_id": template.id,
                "template_name": template.name,
                "subject": subject,
                "status": "sent",
                "message_id": send_result.get("message_id"),
                "recorded_at": _now().isoformat()
            })
            execution.history = hist
            execution.current_step_index += 1
            execution.status = "active"
            execution.scheduled_for = None
            db.commit()
            logger.info(f"E-mail do passo {execution.current_step_index} enviado com sucesso para {execution.contact_email}")
            
            # Se ainda houver passos, continua a cadeia
            if execution.current_step_index < len(steps):
                return await execute_next_step(db, execution.id)
            else:
                execution.status = "completed"
                execution.stop_reason = "Sequência concluída com sucesso"
                funnel.total_completed = (funnel.total_completed or 0) + 1
                db.commit()
                return True
        else:
            hist.append({
                "step_index": execution.current_step_index,
                "type": "email",
                "template_id": template.id,
                "status": "failed",
                "error": send_result.get("error"),
                "recorded_at": _now().isoformat()
            })
            execution.history = hist
            execution.status = "failed"
            execution.stop_reason = f"Falha no envio de e-mail: {send_result.get('error')}"
            db.commit()
            return False

    elif step_type == "tag_action":
        action = current_step.get("action", "add")  # 'add' ou 'remove'
        tag_name = current_step.get("tag")
        if tag_name and execution.lead_id:
            lead = db.query(WebhookLead).filter(WebhookLead.id == execution.lead_id).first()
            if lead:
                tags = list(lead.tags or [])
                if action == "add" and tag_name not in tags:
                    tags.append(tag_name)
                elif action == "remove" and tag_name in tags:
                    tags = [t for t in tags if t != tag_name]
                lead.tags = tags

        hist = list(execution.history or [])
        hist.append({
            "step_index": execution.current_step_index,
            "type": "tag_action",
            "action": action,
            "tag": tag_name,
            "recorded_at": _now().isoformat()
        })
        execution.history = hist
        execution.current_step_index += 1
        db.commit()

        if execution.current_step_index < len(steps):
            return await execute_next_step(db, execution.id)
        else:
            execution.status = "completed"
            execution.stop_reason = "Sequência concluída com sucesso"
            funnel.total_completed = (funnel.total_completed or 0) + 1
            db.commit()
            return True

    return False

async def process_due_email_funnels(db: Session) -> int:
    """
    Varre execuções pendentes cujo delay expirou e aciona o próximo passo.
    """
    now = _now()
    due_executions = db.query(EmailFunnelExecution).filter(
        EmailFunnelExecution.status == "waiting_delay",
        EmailFunnelExecution.scheduled_for <= now
    ).limit(50).all()

    processed_count = 0
    for exec_item in due_executions:
        try:
            exec_item.status = "active"
            db.commit()
            await execute_next_step(db, exec_item.id)
            processed_count += 1
        except Exception as e:
            logger.error(f"Erro ao processar execução de funil {exec_item.id}: {e}")
            exec_item.status = "failed"
            exec_item.stop_reason = str(e)
            db.commit()

    return processed_count

async def check_and_cancel_funnels_on_purchase(db: Session, client_id: int, contact_email: str) -> int:
    """
    Cancela execuções ativas quando o lead compra um produto.
    """
    if not contact_email:
        return 0

    active_executions = db.query(EmailFunnelExecution).join(
        EmailFunnel, EmailFunnel.id == EmailFunnelExecution.funnel_id
    ).filter(
        EmailFunnelExecution.client_id == client_id,
        EmailFunnelExecution.contact_email == contact_email,
        EmailFunnelExecution.status.in_(["active", "waiting_delay"]),
        EmailFunnel.stop_on_purchase == True
    ).all()

    count = 0
    for ex in active_executions:
        ex.status = "stopped_purchase"
        ex.stop_reason = "Interrupção inteligente: Compra aprovada registrada"
        count += 1
    
    if count > 0:
        db.commit()
        logger.info(f"{count} execuções de funil de e-mail canceladas para {contact_email} por Compra Aprovada")

    return count

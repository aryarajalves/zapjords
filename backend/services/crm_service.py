from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from core.logger import setup_logger
from models.crm import SalesPipeline, SalesPipelineStage, SalesDeal
from models.trigger import WebhookLead
from models.chat import ChatConversation

logger = setup_logger("crm_service")

DEFAULT_STAGE_TEMPLATES = [
    {"name": "Carrinho Abandonado", "color": "rose", "stage_type": "initial", "webhook_event_trigger": "carrinho_abandonado", "order_index": 0},
    {"name": "Primeiro Contato", "color": "blue", "stage_type": "in_progress", "webhook_event_trigger": None, "order_index": 1},
    {"name": "Em Negociação", "color": "amber", "stage_type": "in_progress", "webhook_event_trigger": None, "order_index": 2},
    {"name": "Aguardando Pagamento", "color": "purple", "stage_type": "in_progress", "webhook_event_trigger": "pix_gerado,boleto_gerado", "order_index": 3},
    {"name": "Venda Concluída", "color": "emerald", "stage_type": "won", "webhook_event_trigger": "compra_aprovada", "order_index": 4},
    {"name": "Perdido", "color": "slate", "stage_type": "lost", "webhook_event_trigger": None, "order_index": 5},
]


def create_default_stages(db: Session, pipeline_id: int, client_id: int) -> List[SalesPipelineStage]:
    """Cria os estágios padrão para um novo pipeline."""
    stages = []
    for tpl in DEFAULT_STAGE_TEMPLATES:
        stage = SalesPipelineStage(
            pipeline_id=pipeline_id,
            client_id=client_id,
            name=tpl["name"],
            color=tpl["color"],
            stage_type=tpl["stage_type"],
            webhook_event_trigger=tpl["webhook_event_trigger"],
            order_index=tpl["order_index"]
        )
        db.add(stage)
        stages.append(stage)
    db.commit()
    for s in stages:
        db.refresh(s)
    return stages


def get_or_create_default_pipeline(db: Session, client_id: int) -> SalesPipeline:
    """Retorna o pipeline padrão do cliente ou cria um inicial."""
    pipeline = db.query(SalesPipeline).filter(
        SalesPipeline.client_id == client_id,
        SalesPipeline.is_default == True
    ).first()

    if not pipeline:
        pipeline = db.query(SalesPipeline).filter(
            SalesPipeline.client_id == client_id
        ).order_by(SalesPipeline.order_index.asc()).first()

    if not pipeline:
        logger.info(f"Criando pipeline de vendas padrão para o cliente {client_id}...")
        pipeline = SalesPipeline(
            client_id=client_id,
            name="Pipeline Geral de Vendas",
            product_name=None,
            associated_tags=None,
            order_index=0,
            is_default=True
        )
        db.add(pipeline)
        db.commit()
        db.refresh(pipeline)
        create_default_stages(db, pipeline.id, client_id)

    return pipeline


def sync_pipeline_history(db: Session, client_id: int, pipeline_id: int) -> Dict[str, Any]:
    """
    Sincroniza retroativamente os leads de WebhookLead para o pipeline.
    """
    pipeline = db.query(SalesPipeline).filter(
        SalesPipeline.id == pipeline_id,
        SalesPipeline.client_id == client_id
    ).first()

    if not pipeline:
        return {"total_synced": 0, "created_deals": 0, "updated_deals": 0, "skipped": 0, "message": "Pipeline não encontrado."}

    stages = db.query(SalesPipelineStage).filter(
        SalesPipelineStage.pipeline_id == pipeline_id
    ).order_by(SalesPipelineStage.order_index.asc()).all()

    if not stages:
        stages = create_default_stages(db, pipeline_id, client_id)

    # Mapear estágios por tipo e trigger
    won_stage = next((s for s in stages if s.stage_type == "won"), stages[-1])
    abandoned_stage = next((s for s in stages if s.webhook_event_trigger and "carrinho_abandonado" in s.webhook_event_trigger), stages[0])
    payment_stage = next((s for s in stages if s.webhook_event_trigger and ("pix_gerado" in s.webhook_event_trigger or "boleto" in s.webhook_event_trigger)), stages[0])
    initial_stage = stages[0]

    # Buscar leads elegíveis
    query = db.query(WebhookLead).filter(WebhookLead.client_id == client_id)

    if pipeline.product_name and pipeline.product_name.strip():
        pname = pipeline.product_name.strip().lower()
        query = query.filter(
            or_(
                func.lower(WebhookLead.product_name).ilike(f"%{pname}%"),
                func.lower(func.coalesce(WebhookLead.tags, "")).ilike(f"%{pname}%")
            )
        )
    elif pipeline.associated_tags and pipeline.associated_tags.strip():
        tag_list = [t.strip().lower() for t in pipeline.associated_tags.split(",") if t.strip()]
        if tag_list:
            conds = [func.lower(func.coalesce(WebhookLead.tags, "")).ilike(f"%{t}%") for t in tag_list]
            query = query.filter(or_(*conds))

    leads = query.all()
    created_count = 0
    updated_count = 0

    for lead in leads:
        if not lead.phone:
            continue

        digits = "".join(filter(str.isdigit, str(lead.phone)))
        if len(digits) < 8:
            continue

        # Determinar estágio pelo evento/status do lead
        status_norm = (getattr(lead, "last_event_type", None) or getattr(lead, "status", None) or "").lower()
        target_stage = initial_stage
        deal_status = "open"

        if status_norm in ["compra_aprovada", "approved", "pago", "aprovado"]:
            target_stage = won_stage
            deal_status = "won"
        elif "carrinho" in status_norm or "abandoned" in status_norm:
            target_stage = abandoned_stage
        elif "pix" in status_norm or "boleto" in status_norm:
            target_stage = payment_stage

        # Checar se deal já existe neste pipeline
        existing_deal = db.query(SalesDeal).filter(
            SalesDeal.pipeline_id == pipeline_id,
            SalesDeal.contact_phone == digits
        ).first()

        lead_value = 0.0
        try:
            val_raw = getattr(lead, "price", None) or getattr(lead, "value", None)
            if val_raw:
                val_clean = str(val_raw).replace("R$", "").replace(" ", "").strip()
                if "," in val_clean:
                    val_clean = val_clean.replace(".", "").replace(",", ".")
                lead_value = float(val_clean)
        except Exception:
            lead_value = 0.0

        if existing_deal:
            # Se já está ganho, preserva; se novo status for won, atualiza
            if deal_status == "won" and existing_deal.status != "won":
                existing_deal.stage_id = won_stage.id
                existing_deal.status = "won"
            if lead_value > 0 and (not existing_deal.value or existing_deal.value == 0):
                existing_deal.value = lead_value
            existing_deal.lead_id = lead.id
            updated_count += 1
        else:
            new_deal = SalesDeal(
                client_id=client_id,
                pipeline_id=pipeline_id,
                stage_id=target_stage.id,
                lead_id=lead.id,
                contact_phone=digits,
                contact_name=lead.name or "Sem Nome",
                contact_email=lead.email,
                title=f"Oportunidade - {lead.name or digits}",
                value=lead_value,
                status=deal_status,
                last_interaction_at=lead.updated_at or lead.created_at
            )
            db.add(new_deal)
            created_count += 1

    db.commit()
    logger.info(f"Sincronização do Pipeline {pipeline_id} concluída: {created_count} criados, {updated_count} atualizados.")
    return {
        "total_synced": len(leads),
        "created_deals": created_count,
        "updated_deals": updated_count,
        "skipped": len(leads) - (created_count + updated_count),
        "message": f"Sincronização concluída! {created_count} novas oportunidades criadas e {updated_count} atualizadas."
    }


def process_webhook_lead_for_crm(
    db: Session,
    client_id: int,
    phone: str,
    name: Optional[str] = None,
    email: Optional[str] = None,
    product_name: Optional[str] = None,
    event_type: Optional[str] = None,
    value: Optional[float] = 0.0,
    lead_id: Optional[int] = None
):
    """
    Hook chamado após processamento de webhook de venda. Cria ou move o deal no pipeline correspondente.
    """
    if not phone:
        return

    digits = "".join(filter(str.isdigit, str(phone)))
    if len(digits) < 8:
        return

    # Buscar pipelines relevantes
    pipelines = []
    if product_name and product_name.strip():
        pname = product_name.strip().lower()
        pipelines = db.query(SalesPipeline).filter(
            SalesPipeline.client_id == client_id,
            func.lower(SalesPipeline.product_name).ilike(f"%{pname}%")
        ).all()

    if not pipelines:
        # Fallback para o pipeline padrão
        default_pipe = get_or_create_default_pipeline(db, client_id)
        pipelines = [default_pipe]

    event_norm = (event_type or "").lower().strip()

    for pipe in pipelines:
        stages = db.query(SalesPipelineStage).filter(
            SalesPipelineStage.pipeline_id == pipe.id
        ).order_by(SalesPipelineStage.order_index.asc()).all()

        if not stages:
            stages = create_default_stages(db, pipe.id, client_id)

        target_stage = stages[0]
        deal_status = "open"

        if event_norm in ["compra_aprovada", "approved", "pago", "aprovado"]:
            won_stage = next((s for s in stages if s.stage_type == "won"), stages[-1])
            target_stage = won_stage
            deal_status = "won"
        else:
            # Procurar estágio com trigger correspondente
            matching = next(
                (s for s in stages if s.webhook_event_trigger and event_norm in s.webhook_event_trigger.lower()),
                None
            )
            if matching:
                target_stage = matching

        # Atualizar ou criar deal
        existing = db.query(SalesDeal).filter(
            SalesDeal.pipeline_id == pipe.id,
            SalesDeal.contact_phone == digits
        ).first()

        if existing:
            existing.stage_id = target_stage.id
            if deal_status == "won":
                existing.status = "won"
            if value and value > 0:
                existing.value = float(value)
            if name:
                existing.contact_name = name
            if email:
                existing.contact_email = email
            if lead_id:
                existing.lead_id = lead_id
            existing.updated_at = datetime.now(timezone.utc)
        else:
            deal_val = float(value or 0.0) if (value and float(value) > 0) else float(pipe.default_value or 0.0)
            new_deal = SalesDeal(
                client_id=client_id,
                pipeline_id=pipe.id,
                stage_id=target_stage.id,
                lead_id=lead_id,
                contact_phone=digits,
                contact_name=name or "Sem Nome",
                contact_email=email,
                title=f"Oportunidade - {name or digits}",
                value=deal_val,
                status=deal_status,
                last_interaction_at=datetime.now(timezone.utc)
            )
            db.add(new_deal)

    db.commit()


def process_tag_applied_for_crm(
    db: Session,
    client_id: int,
    phone: str,
    name: Optional[str] = None,
    tag: Optional[str] = None
):
    """
    Hook chamado quando uma etiqueta é aplicada a um contato no Chat ou via Funil.
    """
    if not tag or not phone:
        return

    digits = "".join(filter(str.isdigit, str(phone)))
    if len(digits) < 8:
        return

    tag_norm = tag.strip().lower()

    # Buscar pipelines com tags associadas
    pipelines = db.query(SalesPipeline).filter(
        SalesPipeline.client_id == client_id,
        SalesPipeline.associated_tags.isnot(None),
        func.lower(SalesPipeline.associated_tags).ilike(f"%{tag_norm}%")
    ).all()

    for pipe in pipelines:
        # Se o deal já existe no pipeline, não regride
        existing = db.query(SalesDeal).filter(
            SalesDeal.pipeline_id == pipe.id,
            SalesDeal.contact_phone == digits
        ).first()

        if not existing:
            stages = db.query(SalesPipelineStage).filter(
                SalesPipelineStage.pipeline_id == pipe.id
            ).order_by(SalesPipelineStage.order_index.asc()).all()

            if not stages:
                stages = create_default_stages(db, pipe.id, client_id)

            initial_stage = stages[0]
            new_deal = SalesDeal(
                client_id=client_id,
                pipeline_id=pipe.id,
                stage_id=initial_stage.id,
                contact_phone=digits,
                contact_name=name or "Sem Nome",
                title=f"Oportunidade - {name or digits}",
                value=float(pipe.default_value or 0.0),
                status="open",
                last_interaction_at=datetime.now(timezone.utc)
            )
            db.add(new_deal)

    db.commit()

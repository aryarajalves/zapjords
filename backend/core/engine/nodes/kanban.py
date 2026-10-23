from sqlalchemy.orm import Session
from models import SalesPipeline, SalesPipelineStage, SalesDeal, WebhookLead
from core.logger import setup_logger
from core.engine.logging import log_node_execution

logger = setup_logger("FunnelEngine.KanbanNode")

def parse_deal_value(val) -> float:
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    val_str = str(val).replace("R$", "").strip()
    if not val_str:
        return 0.0
    if "," in val_str:
        val_str = val_str.replace(".", "").replace(",", ".")
    try:
        return float(val_str)
    except (ValueError, TypeError):
        return 0.0

async def handle_kanban_node(db: Session, trigger, node: dict, contact_phone: str, apply_vars_func) -> str | None:
    """
    Executa o nó de Kanban de Vendas.
    Move o contato para a coluna especificada ou cria uma oportunidade se ela ainda não existir.
    """
    node_id = node.get("id")
    data = node.get("data", {})
    client_id = trigger.client_id

    stage_id = data.get("stage_id")
    product_name = data.get("product_name")
    raw_value = data.get("value")
    lost_reason = data.get("lost_reason")

    if not stage_id:
        logger.warning(f"⚠️ [KANBAN_NODE] Nó {node_id} não possui estágio de destino configurado.")
        log_node_execution(db, trigger, node_id, "failed", "Nó de Kanban sem estágio de destino selecionado.")
        return None

    try:
        stage_id = int(stage_id)
    except (ValueError, TypeError):
        return None

    stage = db.query(SalesPipelineStage).filter(
        SalesPipelineStage.id == stage_id,
        SalesPipelineStage.client_id == client_id
    ).first()

    if not stage:
        logger.warning(f"⚠️ [KANBAN_NODE] Estágio ID {stage_id} não encontrado para client_id {client_id}.")
        log_node_execution(db, trigger, node_id, "failed", f"Estágio ID {stage_id} não encontrado no CRM.")
        return None

    actual_pipeline_id = stage.pipeline_id

    # Determinar status com base no tipo da coluna
    status = "open"
    if stage.stage_type == "won":
        status = "won"
    elif stage.stage_type == "lost" or "desist" in stage.name.lower():
        status = "lost"

    # Tratar valor em R$
    deal_value = parse_deal_value(raw_value)

    # Buscar deal existente para este contato no pipeline
    deal = db.query(SalesDeal).filter(
        SalesDeal.pipeline_id == actual_pipeline_id,
        SalesDeal.client_id == client_id,
        SalesDeal.contact_phone == contact_phone
    ).first()

    contact_name = contact_phone
    # Tenta achar o nome do contato se houver em WebhookLead
    lead = db.query(WebhookLead).filter(
        WebhookLead.client_id == client_id,
        WebhookLead.phone == contact_phone
    ).order_by(WebhookLead.id.desc()).first()
    if lead and lead.name:
        contact_name = lead.name

    if deal:
        # Atualizar deal existente
        old_stage_name = deal.stage.name if deal.stage else f"ID {deal.stage_id}"
        deal.stage_id = stage_id
        deal.status = status
        if product_name:
            deal.product_name = product_name
        if deal_value > 0:
            deal.value = deal_value
        if status == "lost" and lost_reason:
            deal.lost_reason = lost_reason

        db.commit()
        logger.info(f"✅ [KANBAN_NODE] Lead {contact_phone} movido para estágio '{stage.name}' no pipeline {actual_pipeline_id}.")
        log_node_execution(db, trigger, node_id, "success", f"Lead movido para '{stage.name}' no Kanban de Vendas.")
    else:
        # Criar novo deal no estágio selecionado
        new_deal = SalesDeal(
            client_id=client_id,
            pipeline_id=actual_pipeline_id,
            stage_id=stage_id,
            contact_name=contact_name,
            contact_phone=contact_phone,
            channel="whatsapp",
            title=f"Oportunidade - {contact_name}",
            value=deal_value,
            product_name=product_name,
            status=status,
            lost_reason=lost_reason if status == "lost" else None
        )
        db.add(new_deal)
        db.commit()
        logger.info(f"✅ [KANBAN_NODE] Novo deal criado para {contact_phone} no estágio '{stage.name}' do pipeline {actual_pipeline_id}.")
        log_node_execution(db, trigger, node_id, "success", f"Nova oportunidade criada em '{stage.name}' no Kanban de Vendas.")

    return None

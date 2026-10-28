from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from core.logger import setup_logger
from models.crm import SalesPipeline, SalesPipelineStage, SalesDeal, CRMProduct as CrmProduct
from models.trigger import WebhookLead
from models.chat import ChatConversation, ChatMessage

logger = setup_logger("crm_service")

DEFAULT_STAGE_TEMPLATES = [
    {"name": "Prospect", "color": "blue", "stage_type": "initial", "webhook_event_trigger": None, "order_index": 0},
    {"name": "Lead", "color": "cyan", "stage_type": "in_progress", "webhook_event_trigger": "carrinho_abandonado", "order_index": 1},
    {"name": "Oportunidade", "color": "amber", "stage_type": "in_progress", "webhook_event_trigger": "pix_gerado,boleto_gerado", "order_index": 2},
    {"name": "Venda", "color": "emerald", "stage_type": "won", "webhook_event_trigger": "compra_aprovada", "order_index": 3},
    {"name": "Desistencia", "color": "rose", "stage_type": "lost", "webhook_event_trigger": None, "order_index": 4},
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

        add_pipeline_private_note(
            db=db,
            client_id=client_id,
            convo_id=convo.id,
            pipeline_name=target_pipeline.name,
            stage_name=target_stage.name,
            user_id=current_user.id if current_user and hasattr(current_user, "id") else None,
            action_type="moved" if existing_deal else "added"
        )

    db.commit()
    logger.info(f"Sincronização do Pipeline {pipeline_id} concluída: {created_count} criados, {updated_count} atualizados.")
    return {
        "total_synced": len(leads),
        "created_deals": created_count,
        "updated_deals": updated_count,
        "skipped": len(leads) - (created_count + updated_count),
        "message": f"Sincronização concluída! {created_count} novas oportunidades criadas e {updated_count} atualizadas."
    }



def check_and_forward_deal_if_configured(
    db: Session,
    deal: SalesDeal,
    stage: SalesPipelineStage
) -> Optional[SalesDeal]:
    """
    Avança automaticamente um contato para outro pipeline/etapa quando ele entra
    em uma coluna que possui forward_to_pipeline_id e forward_to_stage_id configurados.
    """
    if not stage or not getattr(stage, "forward_to_pipeline_id", None) or not getattr(stage, "forward_to_stage_id", None):
        return None

    # Segurança: não auto-avançar para o próprio pipeline para prevenir loops
    if stage.forward_to_pipeline_id == deal.pipeline_id:
        logger.warning(f"⚠️ [CRM AUTO-FORWARD] Ignorado forward em loop para o mesmo pipeline {deal.pipeline_id}.")
        return None

    target_pipe = db.query(SalesPipeline).filter(
        SalesPipeline.id == stage.forward_to_pipeline_id,
        SalesPipeline.client_id == deal.client_id
    ).first()

    if not target_pipe:
        logger.warning(f"⚠️ [CRM AUTO-FORWARD] Pipeline destino {stage.forward_to_pipeline_id} não encontrado.")
        return None

    target_stg = db.query(SalesPipelineStage).filter(
        SalesPipelineStage.id == stage.forward_to_stage_id,
        SalesPipelineStage.pipeline_id == target_pipe.id,
        SalesPipelineStage.client_id == deal.client_id
    ).first()

    if not target_stg:
        logger.warning(f"⚠️ [CRM AUTO-FORWARD] Etapa destino {stage.forward_to_stage_id} não encontrada no pipeline {target_pipe.id}.")
        return None

    # Verificar se o contato já possui deal no pipeline de destino
    existing_target_deal = db.query(SalesDeal).filter(
        SalesDeal.pipeline_id == target_pipe.id,
        SalesDeal.contact_phone == deal.contact_phone,
        SalesDeal.client_id == deal.client_id
    ).first()

    target_deal_status = "won" if target_stg.stage_type == "won" else ("lost" if target_stg.stage_type == "lost" else "open")

    if existing_target_deal:
        existing_target_deal.stage_id = target_stg.id
        existing_target_deal.status = target_deal_status
        existing_target_deal.updated_at = datetime.now(timezone.utc)
        existing_target_deal.last_interaction_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing_target_deal)
        logger.info(
            f"⚡ [CRM AUTO-FORWARD] Contato {deal.contact_phone} ({deal.contact_name}) já possuía deal no pipeline "
            f"'{target_pipe.name}', movido para etapa '{target_stg.name}'."
        )
        return existing_target_deal
    else:
        new_val = target_pipe.default_value or 0.0
        new_deal = SalesDeal(
            client_id=deal.client_id,
            pipeline_id=target_pipe.id,
            stage_id=target_stg.id,
            lead_id=deal.lead_id,
            contact_phone=deal.contact_phone,
            contact_name=deal.contact_name,
            contact_email=deal.contact_email,
            title=f"Oportunidade - {deal.contact_name or deal.contact_phone}",
            product_id=None,
            product_name=target_pipe.product_name,
            channel=deal.channel,
            original_value=new_val,
            value=new_val,
            status=target_deal_status,
            notes=f"Avançado automaticamente da etapa '{stage.name}' do pipeline anterior.",
            last_interaction_at=datetime.now(timezone.utc)
        )
        db.add(new_deal)
        db.commit()
        db.refresh(new_deal)
        logger.info(
            f"⚡ [CRM AUTO-FORWARD] Novo deal criado para {deal.contact_phone} ({deal.contact_name}) no pipeline "
            f"'{target_pipe.name}' na etapa '{target_stg.name}' (R$ {new_val})."
        )
        return new_deal


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


def process_webhook_kanban_trigger(
    db: Session,
    client_id: int,
    mapping: Any,
    phone: str,
    name: Optional[str] = None,
    email: Optional[str] = None,
    platform: Optional[str] = None,
    payload_value: Optional[float] = 0.0
) -> Optional[SalesDeal]:
    """
    Executa a ação de Kanban de Vendas para um gatilho de webhook configurado.
    Move o contato para a coluna especificada ou cria uma oportunidade se ela ainda não existir,
    utilizando o telefone para busca e desduplicação.
    """
    if not getattr(mapping, "kanban_active", False):
        return None

    if not phone:
        return None

    digits = "".join(filter(str.isdigit, str(phone)))
    if len(digits) < 8:
        return None

    stage_id = getattr(mapping, "kanban_stage_id", None)
    if not stage_id:
        logger.warning(f"⚠️ [CRM_WEBHOOK] Mapeamento #{getattr(mapping, 'id', None)} possui kanban_active=True mas não tem kanban_stage_id.")
        return None

    stage = db.query(SalesPipelineStage).filter(
        SalesPipelineStage.id == stage_id,
        SalesPipelineStage.client_id == client_id
    ).first()

    if not stage:
        logger.warning(f"⚠️ [CRM_WEBHOOK] Estágio {stage_id} não encontrado para client_id {client_id}.")
        return None

    actual_pipeline_id = stage.pipeline_id

    # Determinar status com base no estágio
    status = "open"
    if stage.stage_type == "won":
        status = "won"
    elif stage.stage_type == "lost" or "desist" in stage.name.lower() or "perdid" in stage.name.lower():
        status = "lost"

    # Produto e valor
    prod_name = getattr(mapping, "kanban_product_name", None)
    cfg_val = getattr(mapping, "kanban_value", 0.0) or 0.0
    deal_val = float(cfg_val) if float(cfg_val) > 0.0 else float(payload_value or 0.0)

    # Se produto foi selecionado mas o valor está zerado, tenta obter base_price do catálogo
    if prod_name and deal_val <= 0.0:
        catalog_prod = db.query(CrmProduct).filter(
            CrmProduct.client_id == client_id,
            func.lower(CrmProduct.name) == prod_name.strip().lower()
        ).first()
        if catalog_prod and catalog_prod.price:
            deal_val = float(catalog_prod.price)

    lost_reason = getattr(mapping, "kanban_lost_reason", None) if status == "lost" else None

    # Buscar deal existente por telefone no pipeline
    deal = db.query(SalesDeal).filter(
        SalesDeal.client_id == client_id,
        SalesDeal.pipeline_id == actual_pipeline_id,
        or_(
            SalesDeal.contact_phone == digits,
            SalesDeal.contact_phone.like(f"%{digits[-8:]}")
        )
    ).first()

    clean_name = name.strip() if name and name.strip() else None
    clean_email = email.strip() if email and email.strip() else None

    if deal:
        deal.stage_id = stage.id
        deal.status = status
        if clean_name:
            deal.contact_name = clean_name
        if clean_email:
            deal.contact_email = clean_email
        if prod_name:
            deal.product_name = prod_name
        if deal_val > 0.0:
            deal.value = deal_val
        if status == "lost":
            if lost_reason:
                deal.lost_reason = lost_reason
        else:
            deal.lost_reason = None
        deal.last_interaction_at = datetime.now(timezone.utc)
        deal.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(deal)
        logger.info(f"✅ [CRM_WEBHOOK] Lead {digits} atualizado/movido para estágio '{stage.name}' no pipeline {actual_pipeline_id}.")
        return deal
    else:
        new_deal = SalesDeal(
            client_id=client_id,
            pipeline_id=actual_pipeline_id,
            stage_id=stage.id,
            product_name=prod_name,
            original_value=deal_val,
            contact_phone=digits,
            contact_name=clean_name or digits,
            contact_email=clean_email,
            title=f"Oportunidade - {clean_name or digits}",
            channel=platform or "webhook",
            value=deal_val,
            status=status,
            lost_reason=lost_reason if status == "lost" else None,
            last_interaction_at=datetime.now(timezone.utc)
        )
        db.add(new_deal)
        db.commit()
        db.refresh(new_deal)
        logger.info(f"✅ [CRM_WEBHOOK] Novo lead criado no Kanban para {digits} no estágio '{stage.name}' do pipeline {actual_pipeline_id}.")
        return new_deal


def bulk_delete_deals(db: Session, client_id: int, deal_ids: List[int]) -> int:
    """Exclui múltiplos deals do cliente de forma atômica."""
    if not deal_ids:
        return 0
    deleted = db.query(SalesDeal).filter(
        SalesDeal.client_id == client_id,
        SalesDeal.id.in_(deal_ids)
    ).delete(synchronize_session=False)
    db.commit()
    logger.info(f"🗑️ [CRM] {deleted} oportunidades excluídas em massa para client_id {client_id}.")
    return deleted


def bulk_update_deals(
    db: Session,
    client_id: int,
    deal_ids: List[int],
    update_product: bool = False,
    product_id: Optional[int] = None,
    product_name: Optional[str] = None,
    update_value: bool = False,
    value: Optional[float] = None
) -> int:
    """Atualiza produto e/ou preço de múltiplos deals do cliente."""
    if not deal_ids:
        return 0

    deals = db.query(SalesDeal).filter(
        SalesDeal.client_id == client_id,
        SalesDeal.id.in_(deal_ids)
    ).all()

    if not deals:
        return 0

    # Se selecionou produto de catálogo, buscar dados oficiais
    catalog_product = None
    if update_product and product_id and product_id > 0:
        catalog_product = db.query(CrmProduct).filter(
            CrmProduct.id == product_id,
            CrmProduct.client_id == client_id
        ).first()

    prod_name_to_set = None
    if update_product:
        if catalog_product:
            prod_name_to_set = catalog_product.name
        elif product_name:
            prod_name_to_set = product_name.strip()
        else:
            prod_name_to_set = None

    now = datetime.now(timezone.utc)
    for deal in deals:
        if update_product:
            deal.product_id = catalog_product.id if catalog_product else (product_id if product_id and product_id > 0 else None)
            deal.product_name = prod_name_to_set
            if catalog_product and catalog_product.price is not None:
                deal.original_value = float(catalog_product.price)
        if update_value:
            deal.value = float(value or 0.0)
        deal.updated_at = now

    db.commit()
    logger.info(f"✏️ [CRM] {len(deals)} oportunidades atualizadas em massa para client_id {client_id} (update_product={update_product}, update_value={update_value}).")
    return len(deals)


def add_pipeline_private_note(
    db: Session,
    client_id: int,
    convo_id: Optional[int] = None,
    phone: Optional[str] = None,
    pipeline_name: str = "",
    stage_name: str = "",
    user_id: Optional[int] = None,
    action_type: str = "added",
    commit: bool = True
):
    """Cria uma anotação privada na conversa informando a adição/movimentação na pipeline do Kanban."""
    convo = None
    if convo_id:
        convo = db.query(ChatConversation).filter(
            ChatConversation.id == convo_id,
            ChatConversation.client_id == client_id
        ).first()
    elif phone:
        digits = "".join(filter(str.isdigit, str(phone)))
        if len(digits) >= 8:
            convo = db.query(ChatConversation).filter(
                ChatConversation.client_id == client_id,
                ChatConversation.phone.like(f"%{digits[-8:]}")
            ).first()

    if not convo:
        return

    if action_type == "moved":
        note_text = f"Oportunidade movida para a etapa '{stage_name}' na pipeline '{pipeline_name}'."
    else:
        note_text = f"Contato adicionado à pipeline '{pipeline_name}' (Etapa: {stage_name})."

    full_content = f"🔒 Anotação Privada: {note_text}"

    msg = ChatMessage(
        conversation_id=convo.id,
        sender_type="system",
        user_id=user_id,
        message_type="text",
        content=full_content,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(msg)

    convo.private_note = note_text
    convo.last_message_content = f"🔒 Nota: {note_text}"
    convo.last_message_at = datetime.now(timezone.utc)
    if commit:
        db.commit()
    logger.info(f"📝 [CRM] Anotação privada registrada na conversa #{convo.id} para {convo.phone}: {note_text}")


def bulk_add_contacts_to_pipeline(
    db: Session,
    client_id: int,
    current_user: Any,
    payload: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Adiciona contatos em massa (selecionados por IDs ou por filtros/todas as páginas)
    a uma pipeline existente ou recém-criada no Kanban.
    """
    from fastapi import HTTPException
    from routers.chat.conversation_modules.conversation_filter_helpers import build_conversation_filter_query

    select_all_pages = payload.get("select_all_pages", False)
    ids = payload.get("ids", [])
    excluded_ids = payload.get("excluded_ids", [])

    if not select_all_pages and not ids:
        raise HTTPException(status_code=400, detail="Nenhum contato selecionado.")

    new_pipeline_name = payload.get("new_pipeline_name")
    pipeline_id = payload.get("pipeline_id")
    target_pipeline = None

    if new_pipeline_name and str(new_pipeline_name).strip():
        # Criação de nova pipeline
        clean_name = str(new_pipeline_name).strip()
        prod_name = payload.get("product_name")
        def_val = float(payload.get("default_value") or payload.get("value") or 0.0)

        target_pipeline = SalesPipeline(
            client_id=client_id,
            name=clean_name,
            product_name=prod_name,
            default_value=def_val,
            is_default=False
        )
        db.add(target_pipeline)
        db.commit()
        db.refresh(target_pipeline)

        # Cria os estágios padrão para a nova pipeline
        create_default_stages(db, target_pipeline.id, client_id)
        db.refresh(target_pipeline)
        pipeline_id = target_pipeline.id
        logger.info(f"✨ [CRM] Nova pipeline criada via ação em massa: '{clean_name}' (ID {pipeline_id}) para client_id {client_id}.")
    else:
        if not pipeline_id:
            raise HTTPException(status_code=400, detail="Pipeline de destino não informada.")
        target_pipeline = db.query(SalesPipeline).filter(
            SalesPipeline.id == pipeline_id,
            SalesPipeline.client_id == client_id
        ).first()
        if not target_pipeline:
            raise HTTPException(status_code=404, detail="Pipeline não encontrada.")

    # Resolver estágio inicial
    stage_id = payload.get("stage_id")
    target_stage = None
    if stage_id:
        target_stage = db.query(SalesPipelineStage).filter(
            SalesPipelineStage.id == stage_id,
            SalesPipelineStage.pipeline_id == target_pipeline.id,
            SalesPipelineStage.client_id == client_id
        ).first()

    if not target_stage:
        target_stage = db.query(SalesPipelineStage).filter(
            SalesPipelineStage.pipeline_id == target_pipeline.id,
            SalesPipelineStage.client_id == client_id
        ).order_by(SalesPipelineStage.order_index.asc()).first()

    if not target_stage:
        stages = create_default_stages(db, target_pipeline.id, client_id)
        target_stage = stages[0]

    # Resolver contatos a adicionar
    if select_all_pages:
        q = build_conversation_filter_query(
            db=db,
            client_id=client_id,
            current_user=current_user,
            tab=payload.get("tab", "todos"),
            status=payload.get("status", "open"),
            unread_only=payload.get("unread_only"),
            window_open_only=payload.get("window_open_only"),
            template_sent_24h_only=payload.get("template_sent_24h_only"),
            urgent_only=payload.get("urgent_only"),
            has_replied=payload.get("has_replied"),
            has_active_funnel=payload.get("has_active_funnel"),
            last_message_read_only=payload.get("last_message_read_only"),
            last_message_unread_only=payload.get("last_message_unread_only"),
            no_pipeline=payload.get("no_pipeline"),
            not_in_pipeline_id=payload.get("not_in_pipeline_id"),
            start_date=payload.get("start_date"),
            end_date=payload.get("end_date"),
            search=payload.get("search"),
            has_note=payload.get("has_note"),
            order_by=payload.get("order_by", "recent"),
            excluded_ids=excluded_ids
        )
        convos = q.with_entities(
            ChatConversation.id,
            ChatConversation.phone,
            ChatConversation.contact_name
        ).all()
    else:
        convos = db.query(
            ChatConversation.id,
            ChatConversation.phone,
            ChatConversation.contact_name
        ).filter(
            ChatConversation.client_id == client_id,
            ChatConversation.id.in_(ids)
        ).all()

    if not convos:
        return {
            "message": "Nenhum contato encontrado para os filtros selecionados.",
            "count": 0,
            "created": 0,
            "updated": 0,
            "pipeline_id": target_pipeline.id,
            "pipeline_name": target_pipeline.name
        }

    # Produto e valor da oportunidade (com suporte a produto do catálogo)
    prod_id = payload.get("product_id")
    product_obj = db.query(CrmProduct).filter(CrmProduct.id == prod_id, CrmProduct.client_id == client_id).first() if prod_id else None
    deal_product = payload.get("product_name") or (product_obj.name if product_obj else None) or target_pipeline.product_name
    deal_value = float(payload.get("value") or (product_obj.price if product_obj and product_obj.price else None) or target_pipeline.default_value or 0.0)
    orig_val = float(product_obj.price) if product_obj and product_obj.price else deal_value
    stage_status = target_stage.stage_type if target_stage.stage_type in ["won", "lost"] else "open"

    created_count = 0
    updated_count = 0
    now = datetime.now(timezone.utc)

    for convo in convos:
        digits = "".join(filter(str.isdigit, str(convo.phone or "")))
        if len(digits) < 8:
            continue

        existing_deal = db.query(SalesDeal).filter(
            SalesDeal.client_id == client_id,
            SalesDeal.pipeline_id == target_pipeline.id,
            SalesDeal.contact_phone.like(f"%{digits[-8:]}")
        ).first()

        if existing_deal:
            existing_deal.stage_id = target_stage.id
            existing_deal.status = stage_status
            existing_deal.last_interaction_at = now
            existing_deal.updated_at = now
            if deal_value > 0.0:
                existing_deal.value = deal_value
            if orig_val > 0.0:
                existing_deal.original_value = orig_val
            if deal_product:
                existing_deal.product_name = deal_product
            if product_obj:
                existing_deal.product_id = product_obj.id
            updated_count += 1
        else:
            new_deal = SalesDeal(
                client_id=client_id,
                pipeline_id=target_pipeline.id,
                stage_id=target_stage.id,
                product_id=product_obj.id if product_obj else prod_id,
                contact_phone=digits,
                contact_name=convo.contact_name or "Sem Nome",
                title=f"Oportunidade - {convo.contact_name or digits}",
                channel="chat",
                value=deal_value,
                original_value=orig_val,
                product_name=deal_product,
                status=stage_status,
                last_interaction_at=now,
                created_at=now,
                updated_at=now
            )
            db.add(new_deal)
            created_count += 1

        add_pipeline_private_note(
            db=db,
            client_id=client_id,
            convo_id=convo.id,
            pipeline_name=target_pipeline.name,
            stage_name=target_stage.name,
            user_id=current_user.id if current_user and hasattr(current_user, "id") else None,
            action_type="moved" if existing_deal else "added",
            commit=False
        )

    db.commit()
    total_processed = created_count + updated_count
    logger.info(
        f"✅ [CRM] Ação em massa concluída: {total_processed} contatos adicionados/atualizados "
        f"na pipeline '{target_pipeline.name}' (estágio '{target_stage.name}') para client_id {client_id}."
    )

    return {
        "message": f"{total_processed} contatos processados na pipeline '{target_pipeline.name}' com sucesso.",
        "count": total_processed,
        "created": created_count,
        "updated": updated_count,
        "pipeline_id": target_pipeline.id,
        "pipeline_name": target_pipeline.name,
        "stage_id": target_stage.id,
        "stage_name": target_stage.name
    }

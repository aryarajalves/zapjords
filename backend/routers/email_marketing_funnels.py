from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
import math

import models
from core.deps import get_current_user, get_db, get_validated_client_id
from core.logger import setup_logger
from services.email_funnel_service import enroll_contact_in_funnel

logger = setup_logger("email_marketing_funnels_router")

router = APIRouter(prefix="/email/funnels", tags=["Email Marketing Funnels"])

# Schemas
class StepItemSchema(BaseModel):
    id: Optional[str] = None
    type: str = Field(description="'email', 'delay', 'tag_action'")
    template_id: Optional[int] = None
    subject: Optional[str] = None
    delay_value: Optional[int] = 1
    delay_unit: Optional[str] = "hours"  # 'minutes', 'hours', 'days'
    action: Optional[str] = "add"  # 'add' ou 'remove'
    tag: Optional[str] = None

class EmailFunnelCreateSchema(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    trigger_type: str = Field(default="tag", description="'tag', 'webhook_status', 'pipeline_stage', 'manual'")
    trigger_config: Optional[Dict[str, Any]] = None
    stop_tags: Optional[List[str]] = Field(default_factory=list)
    stop_on_purchase: bool = True
    is_active: bool = True
    steps: List[Dict[str, Any]] = Field(default_factory=list)

class EmailFunnelUpdateSchema(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger_type: Optional[str] = None
    trigger_config: Optional[Dict[str, Any]] = None
    stop_tags: Optional[List[str]] = None
    stop_on_purchase: Optional[bool] = None
    is_active: Optional[bool] = None
    steps: Optional[List[Dict[str, Any]]] = None

class EmailFunnelEnrollPayload(BaseModel):
    contacts: List[Dict[str, str]] = Field(..., description="[{'email': '...', 'name': '...'}]")


@router.get("", summary="Listar todos os funis de e-mail marketing do cliente")
def list_email_funnels(
    client_id: int = Depends(get_validated_client_id),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    funnels = db.query(models.EmailFunnel).filter_by(client_id=client_id).order_by(models.EmailFunnel.created_at.desc()).all()
    return [{
        "id": f.id,
        "name": f.name,
        "description": f.description,
        "trigger_type": f.trigger_type,
        "trigger_config": f.trigger_config or {},
        "stop_tags": f.stop_tags or [],
        "stop_on_purchase": f.stop_on_purchase,
        "is_active": f.is_active,
        "steps_count": len(f.steps or []),
        "steps": f.steps or [],
        "total_enrolled": f.total_enrolled or 0,
        "total_completed": f.total_completed or 0,
        "created_at": f.created_at.isoformat() if f.created_at else None,
        "updated_at": f.updated_at.isoformat() if f.updated_at else None,
    } for f in funnels]


@router.post("", summary="Criar novo funil de e-mail marketing")
def create_email_funnel(
    payload: EmailFunnelCreateSchema,
    client_id: int = Depends(get_validated_client_id),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    funnel = models.EmailFunnel(
        client_id=client_id,
        name=payload.name,
        description=payload.description,
        trigger_type=payload.trigger_type,
        trigger_config=payload.trigger_config or {},
        stop_tags=payload.stop_tags or [],
        stop_on_purchase=payload.stop_on_purchase,
        is_active=payload.is_active,
        steps=payload.steps or [],
        total_enrolled=0,
        total_completed=0
    )
    db.add(funnel)
    db.commit()
    db.refresh(funnel)

    logger.info(f"Funil de e-mail '{funnel.name}' (ID: {funnel.id}) criado para cliente {client_id}")
    return {"id": funnel.id, "name": funnel.name, "message": "Funil criado com sucesso"}


@router.get("/{funnel_id}", summary="Obter detalhes de um funil")
def get_email_funnel(
    funnel_id: int,
    client_id: int = Depends(get_validated_client_id),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    funnel = db.query(models.EmailFunnel).filter_by(id=funnel_id, client_id=client_id).first()
    if not funnel:
        raise HTTPException(status_code=404, detail="Funil não encontrado")

    return {
        "id": funnel.id,
        "name": funnel.name,
        "description": funnel.description,
        "trigger_type": funnel.trigger_type,
        "trigger_config": funnel.trigger_config or {},
        "stop_tags": funnel.stop_tags or [],
        "stop_on_purchase": funnel.stop_on_purchase,
        "is_active": funnel.is_active,
        "steps": funnel.steps or [],
        "total_enrolled": funnel.total_enrolled or 0,
        "total_completed": funnel.total_completed or 0,
        "created_at": funnel.created_at.isoformat() if funnel.created_at else None,
        "updated_at": funnel.updated_at.isoformat() if funnel.updated_at else None,
    }


@router.put("/{funnel_id}", summary="Atualizar um funil")
def update_email_funnel(
    funnel_id: int,
    payload: EmailFunnelUpdateSchema,
    client_id: int = Depends(get_validated_client_id),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    funnel = db.query(models.EmailFunnel).filter_by(id=funnel_id, client_id=client_id).first()
    if not funnel:
        raise HTTPException(status_code=404, detail="Funil não encontrado")

    if payload.name is not None:
        funnel.name = payload.name
    if payload.description is not None:
        funnel.description = payload.description
    if payload.trigger_type is not None:
        funnel.trigger_type = payload.trigger_type
    if payload.trigger_config is not None:
        funnel.trigger_config = payload.trigger_config
    if payload.stop_tags is not None:
        funnel.stop_tags = payload.stop_tags
    if payload.stop_on_purchase is not None:
        funnel.stop_on_purchase = payload.stop_on_purchase
    if payload.is_active is not None:
        funnel.is_active = payload.is_active
    if payload.steps is not None:
        funnel.steps = payload.steps

    db.commit()
    return {"message": "Funil atualizado com sucesso", "id": funnel.id}


@router.delete("/{funnel_id}", summary="Excluir um funil")
def delete_email_funnel(
    funnel_id: int,
    client_id: int = Depends(get_validated_client_id),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    funnel = db.query(models.EmailFunnel).filter_by(id=funnel_id, client_id=client_id).first()
    if not funnel:
        raise HTTPException(status_code=404, detail="Funil não encontrado")

    db.delete(funnel)
    db.commit()
    logger.info(f"Funil {funnel_id} excluído com sucesso para o cliente {client_id}")
    return {"message": "Funil excluído com sucesso"}


@router.post("/{funnel_id}/toggle-status", summary="Ativar ou pausar um funil")
def toggle_funnel_status(
    funnel_id: int,
    client_id: int = Depends(get_validated_client_id),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    funnel = db.query(models.EmailFunnel).filter_by(id=funnel_id, client_id=client_id).first()
    if not funnel:
        raise HTTPException(status_code=404, detail="Funil não encontrado")

    funnel.is_active = not funnel.is_active
    db.commit()
    status_str = "ativado" if funnel.is_active else "pausado"
    return {"message": f"Funil {status_str} com sucesso", "is_active": funnel.is_active}


@router.get("/{funnel_id}/executions", summary="Listar contatos inscritos no funil com paginação de 20 contatos")
def list_funnel_executions(
    funnel_id: int,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, le=100),
    status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    client_id: int = Depends(get_validated_client_id),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.EmailFunnelExecution).filter_by(funnel_id=funnel_id, client_id=client_id)
    
    if status:
        query = query.filter(models.EmailFunnelExecution.status == status)

    if search:
        search_filter = f"%{search.strip().lower()}%"
        query = query.filter(
            (models.EmailFunnelExecution.contact_email.ilike(search_filter)) |
            (models.EmailFunnelExecution.contact_name.ilike(search_filter))
        )

    total_count = query.count()
    total_pages = max(1, math.ceil(total_count / page_size))
    offset = (page - 1) * page_size
    items = query.order_by(models.EmailFunnelExecution.created_at.desc()).offset(offset).limit(page_size).all()

    return {
        "items": [{
            "id": ex.id,
            "contact_email": ex.contact_email,
            "contact_name": ex.contact_name,
            "current_step_index": ex.current_step_index,
            "status": ex.status,
            "scheduled_for": ex.scheduled_for.isoformat() if ex.scheduled_for else None,
            "stop_reason": ex.stop_reason,
            "history": ex.history or [],
            "created_at": ex.created_at.isoformat() if ex.created_at else None,
            "updated_at": ex.updated_at.isoformat() if ex.updated_at else None,
        } for ex in items],
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.post("/{funnel_id}/enroll", summary="Inscrever contatos manualmente no funil")
async def enroll_contacts_manually(
    funnel_id: int,
    payload: EmailFunnelEnrollPayload,
    client_id: int = Depends(get_validated_client_id),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    funnel = db.query(models.EmailFunnel).filter_by(id=funnel_id, client_id=client_id).first()
    if not funnel:
        raise HTTPException(status_code=404, detail="Funil não encontrado")

    enrolled = 0
    for c in payload.contacts:
        email = c.get("email")
        name = c.get("name")
        if email:
            exec_item = await enroll_contact_in_funnel(
                db=db,
                client_id=client_id,
                funnel_id=funnel_id,
                contact_email=email,
                contact_name=name,
                start_immediately=True
            )
            if exec_item:
                enrolled += 1

    return {"message": f"{enrolled} contatos inscritos no funil com sucesso", "enrolled_count": enrolled}


@router.post("/seed-newsletter-welcome", summary="Criar modelo e funil de Boas-Vindas à Newsletter em 1 clique")
async def seed_newsletter_welcome_funnel(
    client_id: int = Depends(get_validated_client_id),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Cria ou reutiliza o Template 'Boas-Vindas à Newsletter' e cria o Funil Automático
    com gatilho na etiqueta 'newsletter'.
    """
    # 1. Localiza ou cria o template de Boas-Vindas
    template = db.query(models.EmailTemplate).filter(
        models.EmailTemplate.client_id == client_id,
        models.EmailTemplate.name.ilike("%Boas-Vindas%Newsletter%")
    ).first()

    if not template:
        welcome_html = (
            "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 12px;\">\n"
            "  <div style=\"text-align: center; margin-bottom: 24px;\">\n"
            "    <h1 style=\"color: #1e293b; font-size: 24px; font-weight: bold; margin: 0;\">Seja muito bem-vindo(a) à nossa Newsletter! 🎉</h1>\n"
            "  </div>\n"
            "  <p style=\"color: #334155; font-size: 16px; line-height: 1.6;\">\n"
            "    Olá, <strong>{{primeiro_nome}}</strong>!\n"
            "  </p>\n"
            "  <p style=\"color: #334155; font-size: 15px; line-height: 1.6;\">\n"
            "    É um prazer enorme ter você com a gente. A partir de agora, toda semana você vai receber em primeira mão as nossas melhores análises, novidades exclusivas e insights práticos diretamente na sua caixa de entrada.\n"
            "  </p>\n"
            "  <div style=\"background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 6px; margin: 24px 0;\">\n"
            "    <p style=\"margin: 0; font-weight: bold; color: #1e293b;\">📌 O que esperar das próximas edições:</p>\n"
            "    <ul style=\"color: #475569; font-size: 14px; margin: 8px 0 0 16px; padding: 0;\">\n"
            "      <li>Estratégias testadas no campo de batalha</li>\n"
            "      <li>Novidades e tendências do mercado</li>\n"
            "      <li>Ofertas e conteúdos para assinantes VIP</li>\n"
            "    </ul>\n"
            "  </div>\n"
            "  <div style=\"text-align: center; margin: 30px 0;\">\n"
            "    <a href=\"https://instagram.com\" style=\"background: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;\">Acompanhar Novidades no Instagram</a>\n"
            "  </div>\n"
            "  <p style=\"color: #64748b; font-size: 13px; text-align: center; margin-top: 32px;\">\n"
            "    Caso não queira mais receber nossos e-mails, você pode <a href=\"{{unsubscribe_url}}\" style=\"color: #94a3b8; text-decoration: underline;\">cancelar sua inscrição aqui</a> a qualquer momento.\n"
            "  </p>\n"
            "</div>"
        )
        template = models.EmailTemplate(
            client_id=client_id,
            name="Boas-Vindas à Newsletter",
            subject="Bem-vindo(a) à nossa Newsletter semanal! 💌",
            body_html=welcome_html,
            is_active=True
        )
        db.add(template)
        db.commit()
        db.refresh(template)

    # 2. Localiza ou cria o funil de Boas-Vindas
    funnel = db.query(models.EmailFunnel).filter(
        models.EmailFunnel.client_id == client_id,
        models.EmailFunnel.name.ilike("%Boas-Vindas%Newsletter%")
    ).first()

    if not funnel:
        steps = [
            {
                "id": "step_1",
                "type": "email",
                "template_id": template.id,
                "label": "E-mail de Boas-Vindas Imediato"
            },
            {
                "id": "step_2",
                "type": "tag_action",
                "action": "add",
                "tag": "newsletter_ativa",
                "label": "Adicionar Etiqueta 'newsletter_ativa'"
            }
        ]
        funnel = models.EmailFunnel(
            client_id=client_id,
            name="Boas-Vindas à Newsletter",
            description="Envia automaticamente a edição inaugural de boas-vindas para todo lead que recebe a tag 'newsletter'.",
            trigger_type="tag",
            trigger_config={"tag": "newsletter"},
            stop_tags=["descadastro", "cancelou"],
            stop_on_purchase=False,
            is_active=True,
            steps=steps
        )
        db.add(funnel)
        db.commit()
        db.refresh(funnel)

    return {
        "status": "success",
        "message": "Funil e Template de Boas-Vindas à Newsletter prontos para uso!",
        "funnel": {
            "id": funnel.id,
            "name": funnel.name,
            "trigger_tag": "newsletter",
            "template_id": template.id,
            "template_name": template.name,
            "is_active": funnel.is_active
        }
    }

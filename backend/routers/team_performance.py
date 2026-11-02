"""
Router para análise e métricas de desempenho da equipe / vendedores.
Acesso restrito exclusivamente para administradores (super_admin e admin).
"""
from datetime import datetime, timezone, timedelta, time
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_, and_

from core.deps import get_db, get_validated_client_id
from core.permissions import require_admin
from core.logger import logger
from models.auth import User
from models.chat import ChatConversation, ChatMessage
from models.client import Client

router = APIRouter(prefix="/team-performance", tags=["Team Performance"])

# Fuso horário padrão de Brasília (UTC-3)
TZ_BRASILIA = timezone(timedelta(hours=-3))


def get_date_range_brasilia(
    period: str,
    start_date_str: Optional[str] = None,
    end_date_str: Optional[str] = None
) -> tuple[datetime, datetime]:
    """
    Retorna tupla (start_dt_utc, end_dt_utc) calculada com base no horário de Brasília.
    """
    now_bsb = datetime.now(TZ_BRASILIA)
    today_start_bsb = datetime.combine(now_bsb.date(), time.min).replace(tzinfo=TZ_BRASILIA)
    today_end_bsb = datetime.combine(now_bsb.date(), time.max).replace(tzinfo=TZ_BRASILIA)

    if period == "today":
        start_bsb = today_start_bsb
        end_bsb = now_bsb
    elif period == "7days":
        start_bsb = (now_bsb - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_bsb = now_bsb
    elif period == "30days":
        start_bsb = (now_bsb - timedelta(days=29)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_bsb = now_bsb
    elif period == "this_month":
        start_bsb = today_start_bsb.replace(day=1)
        end_bsb = now_bsb
    elif period == "custom" and start_date_str:
        try:
            parsed_start = datetime.strptime(start_date_str[:10], "%Y-%m-%d").date()
            start_bsb = datetime.combine(parsed_start, time.min).replace(tzinfo=TZ_BRASILIA)
            if end_date_str:
                parsed_end = datetime.strptime(end_date_str[:10], "%Y-%m-%d").date()
                end_bsb = datetime.combine(parsed_end, time.max).replace(tzinfo=TZ_BRASILIA)
            else:
                end_bsb = now_bsb
        except Exception as e:
            logger.warning(f"Erro ao parsear datas customizadas: {e}. Usando hoje como fallback.")
            start_bsb = today_start_bsb
            end_bsb = now_bsb
    else:
        start_bsb = today_start_bsb
        end_bsb = now_bsb

    # Converte para UTC para query no banco
    start_utc = start_bsb.astimezone(timezone.utc)
    end_utc = end_bsb.astimezone(timezone.utc)
    return start_utc, end_utc


@router.get("/sellers", summary="Listar vendedores/atendentes da equipe")
async def list_team_sellers(
    db: Session = Depends(get_db),
    client_id: int = Depends(get_validated_client_id),
    current_user: User = Depends(require_admin)
):
    """
    Retorna os usuários vinculados ao cliente (equipe/vendedores) para seleção nos filtros.
    Exclusivo para admin e super_admin.
    """
    try:
        users = (
            db.query(User)
            .filter(
                or_(
                    User.client_id == client_id,
                    User.accessible_clients.any(Client.id == client_id)
                )
            )
            .order_by(User.full_name.asc(), User.email.asc())
            .all()
        )

        sellers = []
        for u in users:
            sellers.append({
                "id": u.id,
                "full_name": u.full_name or u.email.split("@")[0],
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active
            })

        return {"sellers": sellers}
    except Exception as e:
        logger.error(f"Erro ao listar membros da equipe (client_id={client_id}): {e}")
        raise HTTPException(status_code=500, detail="Erro ao carregar lista de atendentes.")


@router.get("/summary", summary="Métricas de desempenho da equipe")
async def get_performance_summary(
    seller_id: Optional[int] = Query(None, description="Filtrar por vendedor específico"),
    period: str = Query("today", description="today, 7days, 30days, this_month, custom"),
    start_date: Optional[str] = Query(None, description="Data início customizada (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Data fim customizada (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    client_id: int = Depends(get_validated_client_id),
    current_user: User = Depends(require_admin)
):
    """
    Retorna o resumo comparativo de atendimentos da equipe humana:
    - Métricas Hoje, 7 Dias, Mês e Período selecionado (exclui disparos em massa e automações sem atendente).
    - Breakdown por vendedor no período.
    """
    try:
        # 1. Obter ranges de datas
        dt_today_start, dt_today_end = get_date_range_brasilia("today")
        dt_7d_start, dt_7d_end = get_date_range_brasilia("7days")
        dt_month_start, dt_month_end = get_date_range_brasilia("this_month")
        dt_selected_start, dt_selected_end = get_date_range_brasilia(period, start_date, end_date)

        def query_metrics_range(start_dt: datetime, end_dt: datetime):
            q = (
                db.query(
                    func.count(func.distinct(ChatMessage.conversation_id)).label("unique_contacts"),
                    func.count(ChatMessage.id).label("total_messages")
                )
                .join(ChatConversation, ChatMessage.conversation_id == ChatConversation.id)
                .filter(
                    ChatConversation.client_id == client_id,
                    ChatMessage.sender_type == "user",
                    ChatMessage.user_id.isnot(None),  # Exclui disparos em massa e automações
                    ChatMessage.timestamp >= start_dt,
                    ChatMessage.timestamp <= end_dt
                )
            )
            if seller_id:
                q = q.filter(ChatMessage.user_id == seller_id)
            row = q.one()
            return {
                "unique_contacts": row.unique_contacts or 0,
                "total_messages": row.total_messages or 0
            }

        # Cards fixos de referência rápida
        today_metrics = query_metrics_range(dt_today_start, dt_today_end)
        week_metrics = query_metrics_range(dt_7d_start, dt_7d_end)
        month_metrics = query_metrics_range(dt_month_start, dt_month_end)
        selected_metrics = query_metrics_range(dt_selected_start, dt_selected_end)

        # 2. Ranking / Breakdown por vendedor no período selecionado (apenas atendentes reais)
        seller_query = (
            db.query(
                ChatMessage.user_id,
                func.count(func.distinct(ChatMessage.conversation_id)).label("unique_contacts"),
                func.count(ChatMessage.id).label("total_messages"),
                func.max(ChatMessage.timestamp).label("last_message_at")
            )
            .join(ChatConversation, ChatMessage.conversation_id == ChatConversation.id)
            .filter(
                ChatConversation.client_id == client_id,
                ChatMessage.sender_type == "user",
                ChatMessage.user_id.isnot(None),  # Exclui disparos em massa e templates automáticos
                ChatMessage.timestamp >= dt_selected_start,
                ChatMessage.timestamp <= dt_selected_end
            )
        )

        if seller_id:
            seller_query = seller_query.filter(ChatMessage.user_id == seller_id)

        seller_query = seller_query.group_by(ChatMessage.user_id).order_by(desc("unique_contacts"))
        seller_rows = seller_query.all()

        # Mapeia nomes dos usuários
        user_ids = [r.user_id for r in seller_rows if r.user_id]
        users_map = {}
        if user_ids:
            found_users = db.query(User).filter(User.id.in_(user_ids)).all()
            for u in found_users:
                users_map[u.id] = {
                    "name": u.full_name or u.email.split("@")[0],
                    "email": u.email,
                    "role": u.role
                }

        sellers_breakdown = []
        for r in seller_rows:
            uid = r.user_id
            u_info = users_map.get(uid, {
                "name": f"Vendedor #{uid}",
                "email": "",
                "role": "vendedor"
            })
            contacts_cnt = r.unique_contacts or 0
            msgs_cnt = r.total_messages or 0
            avg_msgs = round(msgs_cnt / contacts_cnt, 1) if contacts_cnt > 0 else 0

            sellers_breakdown.append({
                "seller_id": uid,
                "name": u_info["name"],
                "email": u_info["email"],
                "role": u_info["role"],
                "unique_contacts": contacts_cnt,
                "total_messages": msgs_cnt,
                "avg_messages_per_contact": avg_msgs,
                "last_message_at": r.last_message_at.isoformat() if r.last_message_at else None
            })

        return {
            "period": period,
            "start_date": dt_selected_start.isoformat(),
            "end_date": dt_selected_end.isoformat(),
            "selected_seller_id": seller_id,
            "metrics": {
                "today": today_metrics,
                "this_week": week_metrics,
                "this_month": month_metrics,
                "selected_period": selected_metrics
            },
            "sellers_breakdown": sellers_breakdown
        }
    except Exception as e:
        logger.error(f"Erro ao calcular resumo de desempenho da equipe: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao gerar métricas da equipe.")


@router.get("/contacts", summary="Listar contatos conversados no período")
async def list_attended_contacts(
    seller_id: Optional[int] = Query(None, description="Filtrar por vendedor"),
    period: str = Query("today", description="today, 7days, 30days, this_month, custom"),
    start_date: Optional[str] = Query(None, description="Data início customizada (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Data fim customizada (YYYY-MM-DD)"),
    search: Optional[str] = Query(None, description="Buscar por nome ou telefone do contato"),
    page: int = Query(1, ge=1, description="Número da página"),
    page_size: int = Query(15, ge=1, le=100, description="Itens por página"),
    db: Session = Depends(get_db),
    client_id: int = Depends(get_validated_client_id),
    current_user: User = Depends(require_admin)
):
    """
    Retorna a lista de contatos únicos que os atendentes humanos conversaram no período.
    Disparos em massa e automações sem vendedor humano são filtrados e não aparecem.
    Inclui atalho com conversation_id para abrir direto a conversa no Chat.
    """
    try:
        dt_start, dt_end = get_date_range_brasilia(period, start_date, end_date)

        # Query base com join
        base_query = (
            db.query(
                ChatConversation.id.label("conversation_id"),
                ChatConversation.contact_name,
                ChatConversation.phone,
                ChatConversation.status.label("conversation_status"),
                ChatMessage.user_id.label("seller_id"),
                func.count(ChatMessage.id).label("messages_count"),
                func.max(ChatMessage.timestamp).label("last_message_at")
            )
            .join(ChatConversation, ChatMessage.conversation_id == ChatConversation.id)
            .filter(
                ChatConversation.client_id == client_id,
                ChatMessage.sender_type == "user",
                ChatMessage.user_id.isnot(None),  # Exclui disparos em massa e templates automáticos
                ChatMessage.timestamp >= dt_start,
                ChatMessage.timestamp <= dt_end
            )
        )

        if seller_id:
            base_query = base_query.filter(ChatMessage.user_id == seller_id)

        if search:
            term = f"%{search.strip()}%"
            base_query = base_query.filter(
                or_(
                    ChatConversation.contact_name.ilike(term),
                    ChatConversation.phone.ilike(term)
                )
            )

        grouped_query = base_query.group_by(
            ChatConversation.id,
            ChatConversation.contact_name,
            ChatConversation.phone,
            ChatConversation.status,
            ChatMessage.user_id
        )

        total_records = grouped_query.count()

        # Paginação e ordenação por última mensagem desc
        paged_rows = (
            grouped_query
            .order_by(desc("last_message_at"))
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        # Buscar nomes dos usuários dos registros retornados
        user_ids = {r.seller_id for r in paged_rows if r.seller_id}
        users_map = {}
        if user_ids:
            found_users = db.query(User).filter(User.id.in_(user_ids)).all()
            for u in found_users:
                users_map[u.id] = u.full_name or u.email.split("@")[0]

        items = []
        for r in paged_rows:
            s_name = users_map.get(r.seller_id, f"Vendedor #{r.seller_id}")
            items.append({
                "conversation_id": r.conversation_id,
                "contact_name": r.contact_name or "Sem Nome",
                "phone": r.phone,
                "conversation_status": r.conversation_status or "open",
                "seller_id": r.seller_id,
                "seller_name": s_name,
                "messages_count": r.messages_count,
                "last_message_at": r.last_message_at.isoformat() if r.last_message_at else None
            })

        return {
            "total": total_records,
            "page": page,
            "page_size": page_size,
            "total_pages": (total_records + page_size - 1) // page_size if total_records > 0 else 1,
            "items": items
        }
    except Exception as e:
        logger.error(f"Erro ao listar contatos atendidos: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao listar contatos atendidos.")

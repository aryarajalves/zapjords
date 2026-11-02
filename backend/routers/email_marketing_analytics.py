import base64
import urllib.parse
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from fastapi.responses import RedirectResponse, Response
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from core.deps import get_db, get_current_user, get_validated_client_id
import models
from core.logger import setup_logger

logger = setup_logger("email_marketing_analytics")

router = APIRouter(prefix="", tags=["Email Marketing Analytics"])

# 1x1 Transparent PNG binary data
TRANSPARENT_1X1_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
)

def _decode_recipient_hash(rec_hash: str) -> Optional[str]:
    """Decodifica o hash de e-mail do destinatário."""
    try:
        # Adicionar padding base64 se necessário
        padded = rec_hash + "=" * ((4 - len(rec_hash) % 4) % 4)
        return base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8").strip().lower()
    except Exception:
        return None

@router.get("/track/open/{dispatch_id}/{recipient_hash}", summary="Pixel invisível para rastreamento de abertura de e-mail")
async def track_email_open(
    dispatch_id: int,
    recipient_hash: str,
    db: Session = Depends(get_db)
):
    """
    Registra a abertura da newsletter/e-mail quando a imagem 1x1 invisível é carregada.
    Retorna sempre um PNG 1x1 transparente com headers de no-cache.
    """
    recipient_email = _decode_recipient_hash(recipient_hash)
    if recipient_email and dispatch_id:
        try:
            dispatch = db.query(models.EmailDispatch).filter(models.EmailDispatch.id == dispatch_id).first()
            if dispatch:
                contacts = dispatch.contacts_list or []
                updated = False
                now_iso = datetime.now(timezone.utc).isoformat()

                for c in contacts:
                    c_email = (c.get("email") or "").strip().lower()
                    if c_email == recipient_email:
                        if not c.get("opened"):
                            c["opened"] = True
                            c["opened_at"] = now_iso
                            c["status"] = "opened"
                            dispatch.total_opened = (dispatch.total_opened or 0) + 1
                            updated = True
                        break

                if updated:
                    analytics = dict(dispatch.analytics_data or {})
                    opens_timeline = list(analytics.get("opens_timeline") or [])
                    opens_timeline.append({"time": now_iso, "email": recipient_email})
                    analytics["opens_timeline"] = opens_timeline
                    dispatch.analytics_data = analytics
                    
                    flag_modified(dispatch, "contacts_list")
                    flag_modified(dispatch, "analytics_data")
                    db.commit()

                    # Notificar atualização em tempo real
                    try:
                        from rabbitmq_client import rabbitmq
                        await rabbitmq.publish_event("email_dispatch_analytics_updated", {
                            "dispatch_id": dispatch.id,
                            "client_id": dispatch.client_id,
                            "total_opened": dispatch.total_opened,
                            "total_clicks": dispatch.total_clicks
                        })
                    except Exception:
                        pass
        except Exception as e:
            logger.error(f"Erro ao processar tracking de abertura no disparo {dispatch_id}: {e}")

    return Response(
        content=TRANSPARENT_1X1_PNG,
        media_type="image/png",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )


@router.get("/track/click", summary="Redirecionador para rastreamento de cliques em links (CTR)")
async def track_email_click(
    d: int = Query(..., description="ID do Disparo"),
    r: str = Query(..., description="Hash do Destinatário"),
    url: str = Query(..., description="URL de Destino Original"),
    db: Session = Depends(get_db)
):
    """
    Registra o clique no link da newsletter e redireciona (302) instantaneamente para a URL original.
    """
    dispatch_id = d
    recipient_email = _decode_recipient_hash(r)
    target_url = urllib.parse.unquote(url)

    if not target_url.startswith("http://") and not target_url.startswith("https://"):
        target_url = f"https://{target_url}"

    if recipient_email and dispatch_id:
        try:
            dispatch = db.query(models.EmailDispatch).filter(models.EmailDispatch.id == dispatch_id).first()
            if dispatch:
                contacts = dispatch.contacts_list or []
                updated = False
                now_iso = datetime.now(timezone.utc).isoformat()

                for c in contacts:
                    c_email = (c.get("email") or "").strip().lower()
                    if c_email == recipient_email:
                        # Se ainda não abriu, marca abertura também
                        if not c.get("opened"):
                            c["opened"] = True
                            c["opened_at"] = now_iso
                            dispatch.total_opened = (dispatch.total_opened or 0) + 1

                        if not c.get("clicked"):
                            c["clicked"] = True
                            c["clicked_at"] = now_iso
                            dispatch.total_clicks = (dispatch.total_clicks or 0) + 1
                        
                        # Salvar lista de links clicados pelo contato
                        c_clicked = list(c.get("clicked_links") or [])
                        if target_url not in c_clicked:
                            c_clicked.append(target_url)
                        c["clicked_links"] = c_clicked
                        c["status"] = "clicked"
                        updated = True
                        break

                analytics = dict(dispatch.analytics_data or {})
                clicks_by_url = dict(analytics.get("clicks_by_url") or {})
                clicks_by_url[target_url] = clicks_by_url.get(target_url, 0) + 1
                analytics["clicks_by_url"] = clicks_by_url

                clicks_timeline = list(analytics.get("clicks_timeline") or [])
                clicks_timeline.append({"time": now_iso, "email": recipient_email, "url": target_url})
                analytics["clicks_timeline"] = clicks_timeline
                dispatch.analytics_data = analytics

                if updated:
                    flag_modified(dispatch, "contacts_list")
                flag_modified(dispatch, "analytics_data")
                db.commit()

                # Notificar via WebSocket
                try:
                    from rabbitmq_client import rabbitmq
                    await rabbitmq.publish_event("email_dispatch_analytics_updated", {
                        "dispatch_id": dispatch.id,
                        "client_id": dispatch.client_id,
                        "total_opened": dispatch.total_opened,
                        "total_clicks": dispatch.total_clicks
                    })
                except Exception:
                    pass
        except Exception as e:
            logger.error(f"Erro ao processar tracking de clique no disparo {dispatch_id}: {e}")

    return RedirectResponse(url=target_url, status_code=302)


@router.get("/dispatches/{dispatch_id}/analytics", summary="Obter métricas e analytics detalhados do disparo de e-mail / newsletter")
def get_email_dispatch_analytics(
    dispatch_id: int,
    client_id: int = Depends(get_validated_client_id),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Retorna taxas de abertura, cliques (CTR), links mais clicados e histórico por leitor.
    """
    dispatch = db.query(models.EmailDispatch).filter(
        models.EmailDispatch.id == dispatch_id,
        models.EmailDispatch.client_id == client_id
    ).first()

    if not dispatch:
        raise HTTPException(status_code=404, detail="Disparo não encontrado para este cliente.")

    contacts = dispatch.contacts_list or []
    total_contacts = dispatch.total_contacts or len(contacts)
    total_sent = dispatch.total_sent or 0
    total_failed = dispatch.total_failed or 0
    total_opened = dispatch.total_opened or sum(1 for c in contacts if c.get("opened") or c.get("status") in ("opened", "clicked"))
    total_clicks = dispatch.total_clicks or sum(1 for c in contacts if c.get("clicked") or c.get("status") == "clicked")

    # Delivered count
    total_delivered = sum(
        1 for c in contacts 
        if c.get("status") in ("delivered", "opened", "clicked") or c.get("delivered_at") or c.get("opened")
    )
    if total_delivered == 0 and total_sent > 0 and total_failed == 0:
        total_delivered = total_sent

    # Rates
    open_rate = round((total_opened / total_sent * 100), 1) if total_sent > 0 else 0.0
    click_rate = round((total_clicks / total_sent * 100), 1) if total_sent > 0 else 0.0
    ctor = round((total_clicks / total_opened * 100), 1) if total_opened > 0 else 0.0

    # Top clicked links
    analytics = dispatch.analytics_data or {}
    clicks_by_url = analytics.get("clicks_by_url") or {}
    
    top_links = []
    for u, count in clicks_by_url.items():
        top_links.append({
            "url": u,
            "clicks": count,
            "percentage": round((count / total_clicks * 100), 1) if total_clicks > 0 else 0.0
        })
    top_links.sort(key=lambda x: x["clicks"], reverse=True)

    # Contatos formatados para visualização no modal
    contacts_performance = []
    for c in contacts:
        status_norm = c.get("status") or "sent"
        if c.get("clicked"):
            status_norm = "clicked"
        elif c.get("opened"):
            status_norm = "opened"
        elif c.get("failure_reason"):
            status_norm = "failed"

        contacts_performance.append({
            "email": c.get("email") or "",
            "name": c.get("name") or c.get("nome") or "",
            "status": status_norm,
            "opened": bool(c.get("opened")),
            "opened_at": c.get("opened_at"),
            "clicked": bool(c.get("clicked")),
            "clicked_at": c.get("clicked_at"),
            "clicked_links": c.get("clicked_links") or [],
            "failure_reason": c.get("failure_reason")
        })

    return {
        "dispatch_id": dispatch.id,
        "title": dispatch.title,
        "subject": dispatch.subject,
        "tag_name": dispatch.tag_name,
        "status": dispatch.status,
        "created_at": dispatch.created_at.isoformat() if dispatch.created_at else None,
        "kpis": {
            "total_contacts": total_contacts,
            "total_sent": total_sent,
            "total_delivered": total_delivered,
            "total_failed": total_failed,
            "total_opened": total_opened,
            "total_clicks": total_clicks,
            "open_rate": open_rate,
            "click_rate": click_rate,
            "click_to_open_rate": ctor
        },
        "top_clicked_links": top_links,
        "contacts_performance": contacts_performance
    }

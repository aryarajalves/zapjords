# -*- coding: utf-8 -*-
"""
Roteador para configurações e operações com a API do App Bússola Astrológica.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy.orm import Session

from core.deps import get_db, get_validated_client_id
from core.permissions import require_admin
from models import User, AppConfig
from core.encryption import decrypt_token
from services.bussola_invite_service import test_bussola_connection

router = APIRouter(tags=["bussola"])

class TestBussolaRequest(BaseModel):
    api_url: Optional[str] = Field(None, description="URL base da API da Bússola (opcional se já salva)")
    api_key: Optional[str] = Field(None, description="Chave de API externa da Bússola (opcional se já salva)")

@router.post("/test-bussola-connection")
async def handle_test_bussola_connection(
    payload: TestBussolaRequest,
    x_client_id: int = Depends(get_validated_client_id),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Testa a conexão com o App Bússola Astrológica fazendo uma chamada de teste em /admin/invites.
    Caso a URL ou chave não sejam informadas na requisição, busca as configurações salvas do cliente.
    """
    api_url = (payload.api_url or "").strip()
    api_key = (payload.api_key or "").strip()

    if not api_url and db:
        url_cfg = db.query(AppConfig).filter(
            AppConfig.client_id == x_client_id,
            AppConfig.key == "BUSSOLA_API_URL"
        ).first()
        if url_cfg and url_cfg.value:
            api_url = url_cfg.value.strip()

    if not api_key and db:
        key_cfg = db.query(AppConfig).filter(
            AppConfig.client_id == x_client_id,
            AppConfig.key == "BUSSOLA_API_KEY"
        ).first()
        if key_cfg and key_cfg.value:
            api_key = decrypt_token(key_cfg.value).strip()

    result = await test_bussola_connection(api_url, api_key)
    return result

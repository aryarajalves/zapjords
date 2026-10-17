# -*- coding: utf-8 -*-
"""
Serviço de Integração com a API do App Bússola Astrológica.
Responsável por autenticar e gerar links de convites/cadastro automáticos via API REST (/admin/invites).
"""

import os
from typing import Any, Dict, Optional
import httpx
from core.logger import logger
from config_loader import get_setting

def resolve_docker_host_url(url: str) -> str:
    """
    Se o backend estiver rodando no Docker e o usuário informar localhost ou 127.0.0.1,
    redireciona internamente para host.docker.internal para conseguir conectar ao host.
    """
    clean = (url or "").strip().rstrip("/")
    if "://127.0.0.1" in clean:
        return clean.replace("://127.0.0.1", "://host.docker.internal")
    if "://localhost" in clean:
        return clean.replace("://localhost", "://host.docker.internal")
    return clean

async def generate_bussola_invite(
    client_id: int,
    role: str = "client",
    validity_type: str = "never",
    custom_api_key: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Gera um link de convite na API da Bússola Astrológica através da rota POST /admin/invites.
    
    Retorna o dicionário de resposta da API com o campo 'invite_url' completo montado.
    Em caso de falha ou credenciais ausentes, retorna None e registra o log.
    """
    # 1. Recupera credenciais da Bússola (chave personalizada do gatilho, AppConfig do tenant ou .env)
    api_key = (
        custom_api_key
        or get_setting("BUSSOLA_API_KEY", "", client_id=client_id)
        or os.getenv("BUSSOLA_API_KEY", "")
    ).strip()

    base_url = (
        get_setting("BUSSOLA_API_URL", "", client_id=client_id)
        or os.getenv("BUSSOLA_API_URL", "https://api.bussolaastrologica.com.br")
    ).strip().rstrip("/")

    if not api_key:
        logger.warning(
            f"⚠️ [BUSSOLA_INVITE] Chave de API da Bússola não configurada para o cliente #{client_id}. "
            f"URL: {'Presente' if base_url else 'Ausente'} | API Key: Ausente"
        )
        return None

    if not base_url:
        logger.warning(f"⚠️ [BUSSOLA_INVITE] URL da API da Bússola não informada para o cliente #{client_id}.")
        return None

    call_url = resolve_docker_host_url(base_url)
    endpoint = f"{call_url}/admin/invites"
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": api_key
    }

    # 2. Monta o payload conforme documentação oficial (role: client|admin, validity_type: never|24h|48h|72h)
    valid_roles = ["client", "admin"]
    safe_role = role if role in valid_roles else "client"

    valid_types = ["never", "24h", "48h", "72h"]
    safe_validity = validity_type if validity_type in valid_types else "never"

    payload: Dict[str, Any] = {
        "role": safe_role,
        "validity_type": safe_validity
    }

    logger.info(f"🔮 [BUSSOLA_INVITE] Solicitando convite em {endpoint} com role={safe_role}, validity={safe_validity}...")

    # 3. Execução da chamada HTTP assíncrona
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(endpoint, json=payload, headers=headers)
            
            if resp.status_code in (200, 201):
                data = resp.json()
                invite_url = data.get("invite_url")
                
                if invite_url:
                    logger.info(f"✅ [BUSSOLA_INVITE] Link de convite Bússola gerado com sucesso: {invite_url}")
                    return data
                else:
                    logger.warning(f"⚠️ [BUSSOLA_INVITE] Resposta com sucesso mas sem campo 'invite_url': {data}")
                    return data
            else:
                logger.error(
                    f"❌ [BUSSOLA_INVITE] Erro ao gerar convite na Bússola: "
                    f"Status {resp.status_code} - Resposta: {resp.text}"
                )
                return None

    except httpx.TimeoutException:
        logger.error(f"❌ [BUSSOLA_INVITE] Timeout ao tentar conectar com a API da Bússola ({endpoint})")
        return None
    except Exception as exc:
        logger.error(f"❌ [BUSSOLA_INVITE] Falha inesperada ao comunicar com a Bússola: {exc}", exc_info=True)
        return None


async def test_bussola_connection(api_url: str, api_key: str) -> Dict[str, Any]:
    """
    Testa a conectividade com a API do App Bússola Astrológica gerando um convite de teste.
    """
    clean_url = (api_url or "").strip().rstrip("/")
    clean_key = (api_key or "").strip()

    if not clean_url:
        return {"success": False, "error": "URL da API não informada."}
    if not clean_key:
        return {"success": False, "error": "Chave de API (X-API-Key) não informada."}

    call_url = resolve_docker_host_url(clean_url)
    endpoint = f"{call_url}/admin/invites"
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": clean_key
    }
    payload = {
        "role": "client",
        "validity_type": "never"
    }

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(endpoint, json=payload, headers=headers)
            if resp.status_code in (200, 201):
                data = resp.json()
                return {
                    "success": True,
                    "message": "Conexão com a API da Bússola estabelecida com sucesso!",
                    "invite_url": data.get("invite_url"),
                    "token": data.get("token")
                }
            else:
                err_detail = resp.text[:300]
                return {
                    "success": False,
                    "status": resp.status_code,
                    "error": f"API da Bússola retornou HTTP {resp.status_code}: {err_detail}"
                }
    except httpx.TimeoutException:
        return {
            "success": False,
            "error": f"Timeout ao tentar conectar na URL da Bússola ({endpoint}). Verifique se o endereço está acessível."
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Falha na conexão: {str(e)}"
        }


async def ensure_trigger_bussola_invite(db, trigger, repaired_components: list) -> tuple:
    """
    Garante que o link_bussola seja gerado para triggers agendados/com delay caso não tenha sido gerado antes.
    """
    import copy
    import models
    from uuid import UUID

    comps = copy.deepcopy(repaired_components or [])
    priv_msg = trigger.private_message
    proc_data = copy.deepcopy(trigger.processed_data or {})

    if not getattr(trigger, "integration_id", None):
        return comps, priv_msg, proc_data

    try:
        try:
            integ_uuid = UUID(str(trigger.integration_id))
        except (ValueError, TypeError):
            integ_uuid = trigger.integration_id

        mapping = db.query(models.WebhookEventMapping).filter(
            models.WebhookEventMapping.integration_id == integ_uuid,
            models.WebhookEventMapping.event_type == trigger.event_type,
            models.WebhookEventMapping.is_active == True
        ).first()

        if not mapping or not getattr(mapping, "bussola_auto_create_invite", False):
            return comps, priv_msg, proc_data

        existing_link = proc_data.get("link_bussola")
        invite_link = existing_link

        needs_new_invite = not existing_link
        if not needs_new_invite:
            for c in comps:
                if c.get("type") == "body":
                    for p in c.get("parameters", []):
                        if p.get("text") == "-":
                            needs_new_invite = True
                            break

        if needs_new_invite:
            invite_res = await generate_bussola_invite(
                client_id=trigger.client_id,
                role=getattr(mapping, "bussola_invite_role", "client") or "client",
                validity_type=getattr(mapping, "bussola_validity_type", "never") or "never",
                custom_api_key=getattr(mapping, "bussola_custom_api_key", None)
            )
            if invite_res and invite_res.get("invite_url"):
                invite_link = invite_res["invite_url"]
                proc_data["link_bussola"] = invite_link
                if "link_cadastro" not in proc_data:
                    proc_data["link_cadastro"] = invite_link

        if invite_link:
            for c in comps:
                if c.get("type") == "body":
                    for p in c.get("parameters", []):
                        if p.get("text") == "-":
                            p["text"] = invite_link

            if priv_msg:
                priv_msg = priv_msg.replace("\n\n-\n\n", f"\n\n{invite_link}\n\n").replace("\n-\n", f"\n{invite_link}\n")

    except Exception as e:
        logger.error(f"❌ [BUSSOLA_INVITE] Erro ao garantir convite em trigger: {e}")

    return comps, priv_msg, proc_data

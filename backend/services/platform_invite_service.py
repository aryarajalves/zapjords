# -*- coding: utf-8 -*-
"""
Serviço de Integração com a Plataforma / Área de Membros Externa.
Responsável por autenticar e gerar links de convites/cadastro automáticos via API REST.
"""

from typing import Any, Dict, List, Optional
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

async def generate_platform_invite(
    client_id: int,
    role: str = "aluno",
    duration_hours: int = 0,
    course_access: Optional[List[Dict[str, Any]]] = None,
    api_url: Optional[str] = None,
    api_token: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Gera um link de convite na plataforma externa através da rota POST /api/v1/invites.
    
    Retorna o dicionário de resposta da API com o campo 'invite_url' completo montado.
    Em caso de falha ou credenciais ausentes, retorna None e registra o log.
    """
    # 1. Recupera credenciais da plataforma (priorizando parâmetros explícitos ou config do tenant)
    base_url = (api_url or get_setting("PLATFORM_API_URL", "", client_id=client_id) or "").strip().rstrip("/")
    token = (api_token or get_setting("PLATFORM_API_TOKEN", "", client_id=client_id) or "").strip()

    if not base_url or not token:
        logger.warning(
            f"⚠️ [PLATFORM_INVITE] Credenciais da plataforma não configuradas para o cliente #{client_id}. "
            f"URL: {'Presente' if base_url else 'Ausente'} | Token: {'Presente' if token else 'Ausente'}"
        )
        return None

    call_url = resolve_docker_host_url(base_url)
    endpoint = f"{call_url}/api/v1/invites"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
        "X-API-Key": token
    }

    # 2. Monta o payload conforme a documentação oficial da API
    payload: Dict[str, Any] = {
        "role": role or "aluno",
        "duration_hours": int(duration_hours or 0)
    }

    if course_access and isinstance(course_access, list):
        # Valida e formata a lista de cursos
        cleaned_access = []
        for item in course_access:
            if isinstance(item, dict) and "course_id" in item:
                try:
                    c_id = int(item["course_id"])
                    dur = str(item.get("access_duration") or "lifetime").strip()
                    cleaned_access.append({
                        "course_id": c_id,
                        "access_duration": dur
                    })
                except (ValueError, TypeError):
                    continue
        if cleaned_access:
            payload["course_access"] = cleaned_access

    logger.info(f"🚀 [PLATFORM_INVITE] Enviando requisição para {endpoint} com role={payload['role']}...")

    # 3. Execução da chamada HTTP assíncrona
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(endpoint, json=payload, headers=headers)
            
            if resp.status_code in (200, 201):
                data = resp.json()
                raw_invite_url = data.get("invite_url")
                
                # Monta a URL completa apontando para a interface do aluno (Frontend)
                if raw_invite_url:
                    frontend_base = (
                        get_setting("PLATFORM_FRONTEND_URL", "", client_id=client_id) or ""
                    ).strip().rstrip("/")
                    
                    if not frontend_base:
                        # Fallback inteligente: se a API for na porta 8010 (dev), o frontend dos alunos roda na 3010
                        if ":8010" in base_url:
                            frontend_base = base_url.replace(":8010", ":3010")
                        else:
                            frontend_base = base_url

                    if raw_invite_url.startswith("http://") or raw_invite_url.startswith("https://"):
                        if ":8010" in raw_invite_url and ":3010" in frontend_base:
                            full_invite_url = raw_invite_url.replace(":8010", ":3010")
                        else:
                            full_invite_url = raw_invite_url
                    else:
                        path = raw_invite_url if raw_invite_url.startswith('/') else '/' + raw_invite_url
                        full_invite_url = f"{frontend_base}{path}"
                    
                    data["full_invite_url"] = full_invite_url
                    data["invite_url"] = full_invite_url
                    logger.info(f"✅ [PLATFORM_INVITE] Link de cadastro gerado com sucesso: {full_invite_url}")
                    return data
                else:
                    logger.warning(f"⚠️ [PLATFORM_INVITE] Resposta recebida com sucesso mas sem campo 'invite_url': {data}")
                    return data
            else:
                logger.error(
                    f"❌ [PLATFORM_INVITE] Erro ao gerar convite na plataforma externa: "
                    f"Status {resp.status_code} - Resposta: {resp.text}"
                )
                return None

    except httpx.TimeoutException:
        logger.error(f"❌ [PLATFORM_INVITE] Timeout ao tentar conectar com a plataforma externa ({endpoint})")
        return None
    except Exception as exc:
        logger.error(f"❌ [PLATFORM_INVITE] Falha inesperada ao comunicar com a plataforma: {exc}", exc_info=True)
        return None


async def ensure_trigger_platform_invite(db, trigger, repaired_components: list) -> tuple:
    """
    Verifica se o trigger pertence a uma integração cujo mapeamento possui auto_create_invite ativo.
    Se o link_cadastro estiver pendente, '-' ou ausente, gera um novo convite na plataforma externa
    e atualiza repaired_components, private_message e processed_data.
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

        if not mapping or not getattr(mapping, "auto_create_invite", False):
            return comps, priv_msg, proc_data

        existing_link = proc_data.get("link_cadastro") or proc_data.get("invite_url")
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
            invite_res = await generate_platform_invite(
                client_id=trigger.client_id,
                role=getattr(mapping, "invite_role", "aluno") or "aluno",
                duration_hours=getattr(mapping, "invite_duration_hours", 0) or 0,
                course_access=getattr(mapping, "invite_course_access", None)
            )
            if invite_res and invite_res.get("full_invite_url"):
                invite_link = invite_res["full_invite_url"]
                proc_data["link_cadastro"] = invite_link
                proc_data["invite_url"] = invite_link

        if invite_link:
            for c in comps:
                if c.get("type") == "body":
                    for p in c.get("parameters", []):
                        if p.get("text") == "-":
                            p["text"] = invite_link
            
            if priv_msg:
                priv_msg = priv_msg.replace("\n\n-\n\n", f"\n\n{invite_link}\n\n").replace("\n-\n", f"\n{invite_link}\n")

    except Exception as e:
        logger.error(f"❌ [PLATFORM_INVITE] Erro ao garantir convite em trigger: {e}")

    return comps, priv_msg, proc_data

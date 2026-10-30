from datetime import datetime, timezone
from typing import Optional, Dict, Any
from core.logger import logger
from websocket_manager import manager


async def broadcast_crm_event(client_id: int, event: str, data: Optional[Dict[str, Any]] = None):
    """
    Transmite eventos em tempo real do CRM / Kanban via WebSocket para clientes conectados.
    Garante o isolamento multi-tenant por client_id.
    """
    if not client_id:
        return

    payload = {
        "event": event,
        "client_id": client_id,
        "data": {
            **(data or {}),
            "server_time": datetime.now(timezone.utc).isoformat()
        }
    }
    try:
        await manager.broadcast_to_client(client_id, payload)
        logger.debug(f"📡 [CRM-WS] Evento '{event}' enviado com sucesso para o cliente {client_id}")
    except Exception as e:
        logger.warning(f"⚠️ [CRM-WS] Erro ao transmitir evento '{event}' via WebSocket: {e}")

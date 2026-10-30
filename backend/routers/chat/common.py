from typing import Optional
from fastapi import Header, Depends
from pydantic import BaseModel
import models
from core.deps import get_current_user, get_validated_client_id
from core.logger import setup_logger

logger = setup_logger("ChatRouter")


async def get_client_id(
    client_id: int = Depends(get_validated_client_id)
) -> int:
    """
    Retorna o client_id autenticado e validado contra o usuário atual (multi-tenant IDOR protection).
    """
    return client_id


def get_user_unread_count(convo, user_id: Optional[int] = None) -> int:
    """
    Calcula a quantidade de mensagens não lidas de uma conversa de forma independente para o usuário logado.
    """
    total_unread = int(getattr(convo, "unread_count", 0) or 0)
    if total_unread <= 0:
        return 0
    if not user_id:
        return total_unread
    states = getattr(convo, "user_read_states", None)
    if not isinstance(states, dict):
        return total_unread
    seen_count = states.get(str(user_id))
    if seen_count is None:
        return total_unread
    try:
        seen_int = int(seen_count)
    except (ValueError, TypeError):
        return total_unread
    return max(0, total_unread - seen_int)


def mark_conversation_read_for_user(convo, user_id: Optional[int] = None) -> None:
    """
    Marca a conversa como lida exclusivamente para o user_id informado,
    registrando o total atual de unread_count no dicionário user_read_states
    e armazenando a contagem anterior em prev_{user_id} para permitir restauração exata.
    """
    if not convo:
        return
    if not user_id:
        convo.unread_count = 0
        return
    from sqlalchemy.orm.attributes import flag_modified
    total_unread = int(getattr(convo, "unread_count", 0) or 0)
    current_unread = get_user_unread_count(convo, user_id)
    states = getattr(convo, "user_read_states", None)
    new_states = dict(states) if isinstance(states, dict) else {}
    if current_unread > 0:
        new_states[f"prev_{user_id}"] = current_unread
    new_states[str(user_id)] = total_unread
    convo.user_read_states = new_states
    try:
        flag_modified(convo, "user_read_states")
    except Exception:
        pass


def mark_conversation_unread_for_user(convo, user_id: Optional[int] = None) -> int:
    """
    Restaura o estado de não lido da conversa exclusivamente para o user_id informado,
    revertendo para a quantidade exata de mensagens que estava mostrando antigamente na bolinha.
    """
    if not convo:
        return 0
    from sqlalchemy.orm.attributes import flag_modified
    states = getattr(convo, "user_read_states", None)
    new_states = dict(states) if isinstance(states, dict) else {}

    # Quantidade que estava mostrando antes na bolinha
    prev_unread = 1
    if user_id:
        recorded_prev = new_states.get(f"prev_{user_id}")
        if recorded_prev is not None:
            try:
                val = int(recorded_prev)
                if val > 0:
                    prev_unread = val
            except (ValueError, TypeError):
                prev_unread = 1

    total_unread = int(getattr(convo, "unread_count", 0) or 0)
    if not user_id:
        convo.unread_count = max(total_unread, prev_unread)
        return convo.unread_count

    if total_unread < prev_unread:
        convo.unread_count = prev_unread
        new_states[str(user_id)] = 0
    else:
        new_states[str(user_id)] = max(0, total_unread - prev_unread)

    convo.user_read_states = new_states
    try:
        flag_modified(convo, "user_read_states")
    except Exception:
        pass

    return prev_unread


def mark_conversation_read_for_all(convo) -> None:
    """
    Marca a conversa como lida para todos os usuários/atendentes,
    zerando unread_count e limpando user_read_states.
    Utilizado sempre que qualquer usuário/atendente envia mensagem para o contato.
    """
    if not convo:
        return
    from sqlalchemy.orm.attributes import flag_modified
    convo.unread_count = 0
    convo.user_read_states = {}
    try:
        flag_modified(convo, "user_read_states")
    except Exception:
        pass


def get_user_display_name(user) -> Optional[str]:
    """
    Retorna o nome amigável do usuário (full_name ou parte local do email).
    """
    if not user:
        return None
    full_name = getattr(user, "full_name", None)
    if full_name and str(full_name).strip():
        return str(full_name).strip()
    email = getattr(user, "email", None)
    if email and str(email).strip():
        return str(email).strip().split("@")[0]
    return None



class LabelCreateRequest(BaseModel):
    name: str
    color: Optional[str] = "#3B82F6"


class ResendAgentFlowPayload(BaseModel):
    content: Optional[str] = None


class ReactRequest(BaseModel):
    phone: str
    message_id: str
    emoji: str

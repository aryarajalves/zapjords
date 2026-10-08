
from datetime import datetime, time, timedelta, timezone
import calendar

# Fuso horário de Brasília (UTC-3)
BRT = timezone(timedelta(hours=-3))

def calculate_next_run(base_date: datetime, frequency: str, days_of_week: list = None, day_of_month: any = None, scheduled_time_str: str = "09:00"):
    """
    Calcula a próxima data/hora de execução suportando múltiplos dias e horários.
    base_date: Ponto de partida (geralmente agora)
    days_of_week: [{'day': 0, 'time': '09:00'}, ...] - 0=Seg, 6=Dom
    day_of_month: [1, 15] ou apenas 1 (legado)
    scheduled_time_str: Horário de fallback HH:mm
    """
    if base_date.tzinfo is None:
        base_date = base_date.replace(tzinfo=timezone.utc)
    
    potential_dates = []

    def parse_time(t_str):
        try:
            h, m = map(int, t_str.split(':'))
            return time(h, m)
        except:
            return time(9, 0)

    if frequency == 'weekly' and days_of_week:
        for entry in days_of_week:
            # Suporte a legado (lista de ints) e novo (lista de dicts)
            if isinstance(entry, int):
                d_idx = entry
                t_obj = parse_time(scheduled_time_str)
            else:
                d_idx = entry.get('day', 0)
                t_obj = parse_time(entry.get('time', scheduled_time_str))
            
            # 0=Monday, 6=Sunday
            current_weekday = base_date.weekday()
            days_diff = (d_idx - current_weekday) % 7
            
            candidate = base_date + timedelta(days=days_diff)
            # Trata o horário configurado como Brasília (UTC-3) e converte para UTC
            candidate = datetime.combine(candidate.date(), t_obj).replace(tzinfo=BRT)

            # Se for hoje e já passou o horário, pula para próxima semana
            if candidate <= base_date:
                candidate += timedelta(days=7)
            
            potential_dates.append(candidate)

    elif frequency == 'monthly' and day_of_month:
        # Suporte a int único (legado), lista de ints ou lista de dicts
        entries = day_of_month if isinstance(day_of_month, list) else [day_of_month]

        for entry in entries:
            if isinstance(entry, int):
                d_idx = entry
                t_obj = parse_time(scheduled_time_str)
            else:
                d_idx = entry.get('day', 1)
                t_obj = parse_time(entry.get('time', scheduled_time_str))

            # Procura o próximo dia disponível (pode ser este mês ou próximos)
            found = False
            for delta_month in range(0, 13): # Tenta até 12 meses à frente
                test_month = base_date.month + delta_month
                test_year = base_date.year + (test_month - 1) // 12
                test_month = (test_month - 1) % 12 + 1
                
                last_day = calendar.monthrange(test_year, test_month)[1]
                actual_day = min(d_idx, last_day) # Trata 31 em meses curtos
                
                candidate = datetime.combine(datetime(test_year, test_month, actual_day).date(), t_obj).replace(tzinfo=BRT)
                if candidate > base_date:
                    potential_dates.append(candidate)
                    found = True
                    break
    
    if not potential_dates:
        return None
    
    return min(potential_dates)


def filter_contacts_by_audience(db, client_id: int, contacts: list, interaction_days: int = None, created_days: int = None, now: datetime = None) -> list:
    """
    Filtra lista de contatos para disparos recorrentes baseado em:
    - interaction_days: última interação (ChatConversation.last_contact_message_at) nos últimos X dias.
    - created_days: criação do contato (WebhookLead.created_at ou ChatConversation.created_at) nos últimos X dias.
    """
    if not interaction_days and not created_days:
        return contacts
    
    if not contacts:
        return []

    if now is None:
        now = datetime.now(timezone.utc)
    elif now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    import re
    import models

    interaction_cutoff = (now - timedelta(days=interaction_days)) if interaction_days else None
    created_cutoff = (now - timedelta(days=created_days)) if created_days else None

    convos = db.query(
        models.ChatConversation.phone,
        models.ChatConversation.last_contact_message_at,
        models.ChatConversation.created_at
    ).filter(
        models.ChatConversation.client_id == client_id
    ).all()

    convo_by_suffix = {}
    for c_phone, last_msg, c_created in convos:
        d = re.sub(r"\D", "", str(c_phone or ''))
        if d:
            suf = d[-8:] if len(d) >= 8 else d
            existing = convo_by_suffix.get(suf)
            if not existing or (last_msg and (not existing[0] or last_msg > existing[0])):
                convo_by_suffix[suf] = (last_msg, c_created)

    leads = db.query(
        models.WebhookLead.phone,
        models.WebhookLead.created_at
    ).filter(
        models.WebhookLead.client_id == client_id
    ).all()

    lead_created_by_suffix = {}
    for l_phone, l_created in leads:
        d = re.sub(r"\D", "", str(l_phone or ''))
        if d:
            suf = d[-8:] if len(d) >= 8 else d
            lead_created_by_suffix[suf] = l_created

    filtered = []
    for c in contacts:
        p = c.get('phone') or ''
        digits = re.sub(r"\D", "", str(p))
        suf = digits[-8:] if len(digits) >= 8 else digits

        # Validação do filtro de última interação
        if interaction_cutoff:
            convo_info = convo_by_suffix.get(suf)
            last_interaction = convo_info[0] if convo_info else None
            if not last_interaction:
                continue
            if last_interaction.tzinfo is None:
                last_interaction = last_interaction.replace(tzinfo=timezone.utc)
            if last_interaction < interaction_cutoff:
                continue

        # Validação do filtro de data de criação
        if created_cutoff:
            created_at = lead_created_by_suffix.get(suf)
            if not created_at and convo_info:
                created_at = convo_info[1]
            if not created_at and c.get('created_at'):
                try:
                    c_dt = c.get('created_at')
                    if isinstance(c_dt, str):
                        created_at = datetime.fromisoformat(c_dt.replace("Z", "+00:00"))
                    elif isinstance(c_dt, datetime):
                        created_at = c_dt
                except Exception:
                    pass

            if not created_at:
                continue
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            if created_at < created_cutoff:
                continue

        filtered.append(c)

    return filtered


def enrich_contacts_with_audience_data(db, client_id: int, contacts: list) -> list:
    """
    Enriquece cada contato com `last_interaction_at` (ISO ou None) e `created_at` (ISO ou None).
    """
    if not contacts:
        return []

    import re
    import models

    convos = db.query(
        models.ChatConversation.phone,
        models.ChatConversation.last_contact_message_at,
        models.ChatConversation.created_at
    ).filter(
        models.ChatConversation.client_id == client_id
    ).all()

    convo_by_suffix = {}
    for c_phone, last_msg, c_created in convos:
        d = re.sub(r"\D", "", str(c_phone or ''))
        if d:
            suf = d[-8:] if len(d) >= 8 else d
            existing = convo_by_suffix.get(suf)
            if not existing or (last_msg and (not existing[0] or last_msg > existing[0])):
                convo_by_suffix[suf] = (last_msg, c_created)

    leads = db.query(
        models.WebhookLead.phone,
        models.WebhookLead.created_at
    ).filter(
        models.WebhookLead.client_id == client_id
    ).all()

    lead_created_by_suffix = {}
    for l_phone, l_created in leads:
        d = re.sub(r"\D", "", str(l_phone or ''))
        if d:
            suf = d[-8:] if len(d) >= 8 else d
            lead_created_by_suffix[suf] = l_created

    enriched = []
    for c in contacts:
        p = c.get('phone') or ''
        digits = re.sub(r"\D", "", str(p))
        suf = digits[-8:] if len(digits) >= 8 else digits

        convo_info = convo_by_suffix.get(suf)
        last_interaction = convo_info[0] if convo_info else None
        
        created_at = lead_created_by_suffix.get(suf)
        if not created_at and convo_info:
            created_at = convo_info[1]
        if not created_at and c.get('created_at'):
            created_at = c.get('created_at')

        c_copy = dict(c)
        c_copy['last_interaction_at'] = last_interaction.isoformat() if hasattr(last_interaction, 'isoformat') else (str(last_interaction) if last_interaction else None)
        c_copy['created_at'] = created_at.isoformat() if hasattr(created_at, 'isoformat') else (str(created_at) if created_at else None)
        enriched.append(c_copy)

    return enriched


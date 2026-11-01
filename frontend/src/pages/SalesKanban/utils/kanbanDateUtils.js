/**
 * Utilitários de Formatação de Data e Hora no Horário Oficial de Brasília (America/Sao_Paulo / UTC-3)
 */

export function formatBrasiliaDateTime(dateInput) {
    if (!dateInput) return '';
    try {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return '';
        
        // Formato: DD/MM/AAAA às HH:mm
        const formatter = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        
        const parts = formatter.formatToParts(d);
        const day = parts.find(p => p.type === 'day')?.value;
        const month = parts.find(p => p.type === 'month')?.value;
        const year = parts.find(p => p.type === 'year')?.value;
        const hour = parts.find(p => p.type === 'hour')?.value;
        const minute = parts.find(p => p.type === 'minute')?.value;
        
        if (!day || !month || !year || !hour || !minute) {
            return formatter.format(d);
        }
        
        return `${day}/${month}/${year} às ${hour}:${minute}`;
    } catch (e) {
        return '';
    }
}

export function formatBrasiliaDate(dateInput) {
    if (!dateInput) return '';
    try {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return '';
        return new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(d);
    } catch (e) {
        return '';
    }
}

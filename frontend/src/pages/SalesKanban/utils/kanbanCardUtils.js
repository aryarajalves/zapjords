import { FiGlobe } from 'react-icons/fi';
import { FaWhatsapp, FaInstagram, FaGoogle } from 'react-icons/fa';

// Mapeamento visual dos canais de origem
export const CHANNEL_BADGES = {
    whatsapp: {
        label: 'WhatsApp',
        icon: FaWhatsapp,
        className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    },
    kiwify: {
        label: 'Kiwify',
        icon: FiGlobe,
        className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    },
    hotmart: {
        label: 'Hotmart',
        icon: FiGlobe,
        className: 'bg-orange-500/15 text-orange-400 border-orange-500/30'
    },
    eduzz: {
        label: 'Eduzz',
        icon: FiGlobe,
        className: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    },
    checkout_jords: {
        label: 'Checkout Jords',
        icon: FiGlobe,
        className: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
    },
    checkout_presell: {
        label: 'Checkout Jords',
        icon: FiGlobe,
        className: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
    },
    bussola_quiz: {
        label: 'Bússola Quiz',
        icon: FiGlobe,
        className: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
    },
    quiz_bussola: {
        label: 'Bússola Quiz',
        icon: FiGlobe,
        className: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
    },
    yayforms: {
        label: 'Formulário',
        icon: FiGlobe,
        className: 'bg-violet-500/15 text-violet-300 border-violet-500/30'
    },
    elementor: {
        label: 'Elementor',
        icon: FiGlobe,
        className: 'bg-rose-500/15 text-rose-300 border-rose-500/30'
    },
    instagram: {
        label: 'Instagram',
        icon: FaInstagram,
        className: 'bg-pink-500/15 text-pink-300 border-pink-500/30'
    },
    google_ads: {
        label: 'Google Ads',
        icon: FaGoogle,
        className: 'bg-blue-500/15 text-blue-300 border-blue-500/30'
    },
    facebook_ads: {
        label: 'Facebook Ads',
        icon: FiGlobe,
        className: 'bg-blue-600/15 text-blue-300 border-blue-500/30'
    },
    manual_bulk: {
        label: 'Disparo em Massa',
        icon: FiGlobe,
        className: 'bg-sky-500/15 text-sky-300 border-sky-500/30'
    },
    importacao: {
        label: 'Importação',
        icon: FiGlobe,
        className: 'bg-slate-500/15 text-slate-300 border-slate-500/30'
    },
    'importação': {
        label: 'Importação',
        icon: FiGlobe,
        className: 'bg-slate-500/15 text-slate-300 border-slate-500/30'
    }
};

export function getChannelConfig(rawChannel) {
    if (!rawChannel) return null;
    const key = String(rawChannel).toLowerCase().trim();
    if (CHANNEL_BADGES[key]) return CHANNEL_BADGES[key];

    const capitalized = key.charAt(0).toUpperCase() + key.slice(1);
    return {
        label: capitalized,
        icon: FiGlobe,
        className: 'bg-blue-500/15 text-blue-300 border-blue-500/30'
    };
}

export function getFollowupStatus(deal, stage, currentTime) {
    const hasCustomFollowup = deal?.custom_followup_delay_value !== null &&
        deal?.custom_followup_delay_value !== undefined &&
        Number(deal.custom_followup_delay_value) > 0;

    if (!stage?.is_followup && !hasCustomFollowup) return null;

    const delayVal = hasCustomFollowup
        ? Number(deal.custom_followup_delay_value)
        : (Number(stage?.followup_delay_value) || 3);
    const unit = hasCustomFollowup
        ? (deal.custom_followup_delay_unit || 'hours')
        : (stage?.followup_delay_unit || 'hours');

    let limitMs = delayVal * 3600 * 1000;
    if (unit === 'minutes') limitMs = delayVal * 60 * 1000;
    else if (unit === 'days') limitMs = delayVal * 86400 * 1000;

    const rawEnteredAt = deal.stage_entered_at || deal.updated_at || deal.created_at;
    if (!rawEnteredAt) {
        return deal.needs_followup
            ? { isOverdue: true, timeText: `${delayVal}${unit === 'hours' ? 'h' : unit === 'days' ? 'd' : 'm'}`, delayVal, unit, isCustom: hasCustomFollowup }
            : null;
    }

    const enteredTime = new Date(rawEnteredAt).getTime();
    const now = currentTime ? (typeof currentTime === 'number' ? currentTime : new Date(currentTime).getTime()) : Date.now();
    const elapsedMs = Math.max(0, now - enteredTime);
    const isOverdue = deal.needs_followup !== undefined && deal.needs_followup !== null
        ? Boolean(deal.needs_followup)
        : elapsedMs >= limitMs;

    const diffMs = Math.abs(elapsedMs - limitMs);
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    let timeText = '';
    if (diffDays > 0) {
        timeText = `${diffDays}d ${diffHours % 24}h`;
    } else if (diffHours > 0) {
        timeText = `${diffHours}h ${diffMinutes % 60}m`;
    } else if (diffMinutes > 0) {
        timeText = `${diffMinutes}m`;
    } else {
        timeText = `${Math.max(1, diffSeconds)}s`;
    }

    return {
        isOverdue,
        timeText,
        delayVal,
        unit,
        isCustom: hasCustomFollowup
    };
}

export function getWindow24hStatus(deal, currentTime) {
    if (!deal) return { isOpen: false, timeText: null };

    const now = currentTime ? (typeof currentTime === 'number' ? currentTime : new Date(currentTime).getTime()) : Date.now();

    if (deal.window_expires_at) {
        const expiresMs = new Date(deal.window_expires_at).getTime();
        if (!Number.isNaN(expiresMs)) {
            const remMs = expiresMs - now;
            if (remMs <= 0) {
                return { isOpen: false, timeText: null };
            }
            const totalMinutes = Math.floor(remMs / (60 * 1000));
            const hours = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            const timeText = hours > 0 ? `${hours}h ${mins}m` : `${Math.max(1, mins)}m`;
            return { isOpen: true, timeText };
        }
    }

    if (deal.window_open) {
        const remSec = Number(deal.window_remaining_seconds || 0);
        if (remSec > 0) {
            const totalMinutes = Math.floor(remSec / 60);
            const hours = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            const timeText = hours > 0 ? `${hours}h ${mins}m` : `${Math.max(1, mins)}m`;
            return { isOpen: true, timeText };
        }
        return { isOpen: true, timeText: null };
    }

    return { isOpen: false, timeText: null };
}

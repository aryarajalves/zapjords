import React from 'react';
import { FiDollarSign, FiGlobe, FiTag, FiPhone, FiMessageSquare } from 'react-icons/fi';
import { FaWhatsapp, FaInstagram, FaGoogle } from 'react-icons/fa';

// Mapeamento visual dos canais de origem
const CHANNEL_BADGES = {
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

function getChannelConfig(rawChannel) {
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

export function KanbanCard({ deal, onEdit, onDelete, onOpenChat }) {
    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const handleDragStart = (e) => {
        e.dataTransfer.setData('dealId', String(deal.id));
        e.dataTransfer.effectAllowed = 'move';
    };

    const channelConfig = getChannelConfig(deal.channel);
    const ChannelIcon = channelConfig?.icon || FiGlobe;

    const hasDiscount = Boolean(
        deal.original_value &&
        deal.value &&
        Number(deal.original_value) > Number(deal.value) &&
        Number(deal.value) > 0
    );

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onClick={() => onEdit(deal)}
            title="Clique para ver todas as informações do lead"
            className="group bg-slate-900/90 hover:bg-slate-850 border border-white/10 hover:border-blue-500/50 rounded-2xl p-3.5 space-y-2.5 transition-all duration-150 shadow-md hover:shadow-xl hover:shadow-blue-500/5 cursor-pointer relative"
        >
            {/* Topo do Card: Nome da Pessoa em Destaque */}
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-black text-white truncate group-hover:text-blue-300 transition-colors">
                        {deal.contact_name || 'Sem Nome'}
                    </h4>
                    {deal.title && deal.title !== `Oportunidade - ${deal.contact_name}` && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{deal.title}</p>
                    )}
                </div>

                {/* Status Ganho/Perdido */}
                {deal.status === 'won' && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        Ganho 🎉
                    </span>
                )}
                {deal.status === 'lost' && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                        Perdido ❌
                    </span>
                )}
            </div>

            {/* Preço do Produto em Destaque de Primeira */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1 font-black text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg shadow-sm">
                    <FiDollarSign size={12} className="text-emerald-500 shrink-0" />
                    <span>{formatCurrency(deal.value)}</span>
                </div>

                {hasDiscount && (
                    <div className="flex items-center gap-1 text-[10px]">
                        <span className="text-slate-500 line-through">
                            {formatCurrency(deal.original_value)}
                        </span>
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 rounded">
                            Desconto
                        </span>
                    </div>
                )}
            </div>

            {/* Tags: Produto e Canal de Origem */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {/* Produto de Interesse */}
                {deal.product_name && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        <FiTag size={9} className="shrink-0 text-amber-400" />
                        <span className="truncate max-w-[130px]">{deal.product_name}</span>
                    </span>
                )}

                {/* Canal de Origem */}
                {channelConfig && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${channelConfig.className}`}>
                        <ChannelIcon size={10} className="shrink-0" />
                        <span>{channelConfig.label}</span>
                    </span>
                )}
            </div>

            {/* Motivo da Desistência (se houver) */}
            {deal.lost_reason && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-2 text-rose-300">
                    <span className="font-bold text-rose-400 block text-[9px] uppercase tracking-wider mb-0.5">
                        Motivo da Desistência:
                    </span>
                    <span className="text-[10px] leading-tight block line-clamp-2">
                        {deal.lost_reason}
                    </span>
                </div>
            )}

            {/* Rodapé sutil: Telefone e Atalho Rápido de Chat */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-400">
                <div className="flex items-center gap-1 font-mono text-slate-400">
                    <FiPhone size={11} className="text-slate-500" />
                    <span>{deal.contact_phone}</span>
                </div>

                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpenChat(deal.contact_phone);
                    }}
                    className="p-1.5 hover:bg-emerald-500/15 text-slate-400 hover:text-emerald-400 border border-transparent hover:border-emerald-500/30 rounded-lg transition-all cursor-pointer"
                    title="Conversar no WhatsApp"
                >
                    <FiMessageSquare size={13} />
                </button>
            </div>
        </div>
    );
}

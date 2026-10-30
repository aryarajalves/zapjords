import React from 'react';
import { FiDollarSign, FiGlobe, FiTag, FiPhone, FiMessageSquare, FiTrash2, FiClock } from 'react-icons/fi';
import { getChannelConfig, getFollowupStatus, getWindow24hStatus } from '../utils/kanbanCardUtils';

export { getFollowupStatus, getWindow24hStatus };

export function KanbanCard({
    deal,
    stage,
    currentTime,
    onEdit,
    onDelete,
    onOpenChat,
    isSelected = false,
    onToggleSelect
}) {
    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const handleDragStart = (e) => {
        e.dataTransfer.setData('dealId', String(deal.id));
        e.dataTransfer.setData('sourceStageId', String(deal.stage_id));
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

    const followupStatus = getFollowupStatus(deal, stage, currentTime);
    const windowStatus = getWindow24hStatus(deal, currentTime);
    const unreadCount = Number(deal.unread_count || 0);

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onClick={() => onEdit(deal)}
            title="Clique para ver todas as informações do lead"
            className={`group bg-slate-900/90 hover:bg-slate-850 border rounded-2xl p-3.5 space-y-2.5 transition-all duration-150 shadow-md hover:shadow-xl cursor-pointer relative ${
                isSelected
                    ? 'border-blue-500/80 bg-blue-950/25 shadow-blue-500/10 ring-1 ring-blue-500/40'
                    : followupStatus?.isOverdue
                    ? 'border-amber-500/60 bg-gradient-to-b from-amber-950/20 to-slate-900/90 ring-1 ring-amber-500/40 shadow-lg shadow-amber-500/5'
                    : windowStatus.isOpen
                    ? 'border-emerald-500/35 hover:border-emerald-400/60 shadow-emerald-500/5'
                    : 'border-white/10 hover:border-blue-500/50 hover:shadow-blue-500/5'
            }`}
        >
            {/* Topo do Card: Seleção, Nome da Pessoa e Bolinha de Mensagens Não Lidas */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {onToggleSelect && (
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                                e.stopPropagation();
                                onToggleSelect(deal.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-white/20 bg-slate-800 text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer shrink-0 transition-all accent-blue-500 hover:border-blue-400"
                            title="Selecionar lead para ações em massa"
                            aria-label={`Selecionar lead ${deal.contact_name || deal.contact_phone}`}
                        />
                    )}
                    <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black text-white truncate group-hover:text-blue-300 transition-colors">
                            {deal.contact_name || 'Sem Nome'}
                        </h4>
                        {deal.title && deal.title !== `Oportunidade - ${deal.contact_name}` && (
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{deal.title}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {/* Bolinha verde indicando mensagens não lidas para o usuário logado */}
                    {unreadCount > 0 && (
                        <span
                            data-testid={`deal-unread-badge-${deal.id}`}
                            title={`${unreadCount} ${unreadCount === 1 ? 'mensagem não lida' : 'mensagens não lidas'} para o seu usuário`}
                            className="min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.45)] shrink-0"
                        >
                            {unreadCount}
                        </span>
                    )}

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
            </div>

            {/* Badge de Janela de 24h Aberta */}
            {windowStatus.isOpen && (
                <div
                    data-testid={`deal-window-open-badge-${deal.id}`}
                    title={
                        windowStatus.timeText
                            ? `Conversa com janela de 24h aberta (restam ${windowStatus.timeText})`
                            : 'Conversa com janela de 24h aberta'
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 text-[10px] font-black shadow-sm"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span>
                        Janela 24h{windowStatus.timeText ? ` • ${windowStatus.timeText}` : ' Aberta'}
                    </span>
                </div>
            )}

            {/* Alerta de Follow-up (quando coluna é follow-up) */}
            {followupStatus && (
                <div className="pt-0.5">
                    {followupStatus.isOverdue ? (
                        <div
                            data-testid={`deal-followup-overdue-${deal.id}`}
                            className="w-full flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black shadow-sm"
                            title={`Contato há mais de ${followupStatus.delayVal}${followupStatus.unit === 'hours' ? 'h' : followupStatus.unit === 'days' ? 'd' : 'm'} nesta coluna! ${followupStatus.isCustom ? '(Prazo individual) ' : ''}Precisa de retorno.`}
                        >
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="relative flex h-2 w-2 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                                <span className="truncate">
                                    ⚠️ {followupStatus.isCustom ? 'Follow-up Individual' : 'Precisa de Follow-up'}
                                </span>
                            </div>
                            <span className="text-[9px] font-mono text-amber-200 shrink-0">
                                +{followupStatus.timeText}
                            </span>
                        </div>
                    ) : (
                        <div
                            data-testid={`deal-followup-pending-${deal.id}`}
                            className={`w-full flex items-center justify-between gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-bold border ${
                                followupStatus.isCustom
                                    ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                                    : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                            }`}
                            title={`Prazo ${followupStatus.isCustom ? 'individual ' : ''}de follow-up: restam ${followupStatus.timeText}`}
                        >
                            <div className="flex items-center gap-1 min-w-0">
                                <FiClock size={10} className={followupStatus.isCustom ? 'text-cyan-400 shrink-0' : 'text-blue-400 shrink-0'} />
                                <span className="truncate">
                                    {followupStatus.isCustom ? 'Follow-up individual' : 'Follow-up no prazo'}
                                </span>
                            </div>
                            <span className="font-mono text-slate-300 shrink-0">
                                restam {followupStatus.timeText}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Preço do Produto em Destaque */}
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
                {deal.product_name && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        <FiTag size={9} className="shrink-0 text-amber-400" />
                        <span className="truncate max-w-[130px]">{deal.product_name}</span>
                    </span>
                )}

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

                <div className="flex items-center gap-1">
                    {onDelete && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(deal.id, deal.contact_name || deal.contact_phone);
                            }}
                            className="p-1.5 hover:bg-rose-500/15 text-slate-500 hover:text-rose-400 border border-transparent hover:border-rose-500/30 rounded-lg transition-all cursor-pointer opacity-70 hover:opacity-100"
                            title="Remover contato do Kanban"
                            aria-label={`Remover lead ${deal.contact_name || deal.contact_phone}`}
                        >
                            <FiTrash2 size={13} />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenChat(deal.contact_phone, deal.contact_name);
                        }}
                        className={`relative p-1.5 border rounded-lg transition-all cursor-pointer ${
                            unreadCount > 0
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35 hover:bg-emerald-500/25'
                                : 'hover:bg-emerald-500/15 text-slate-400 hover:text-emerald-400 border-transparent hover:border-emerald-500/30'
                        }`}
                        title={
                            unreadCount > 0
                                ? `Abrir conversa no ZapVoice (${unreadCount} não lida(s))`
                                : 'Abrir conversa no ZapVoice'
                        }
                    >
                        <FiMessageSquare size={13} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

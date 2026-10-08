import React from 'react';
import { FiMessageSquare, FiMoreVertical, FiDollarSign, FiClock, FiPhone, FiMail } from 'react-icons/fi';

export function KanbanCard({ deal, onEdit, onDelete, onOpenChat }) {
    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const handleDragStart = (e) => {
        e.dataTransfer.setData('dealId', String(deal.id));
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            className="group bg-slate-900/90 hover:bg-slate-850 border border-white/10 hover:border-blue-500/40 rounded-2xl p-3.5 space-y-3 transition-all duration-150 shadow-md hover:shadow-xl hover:shadow-blue-500/5 cursor-grab active:cursor-grabbing relative"
        >
            {/* Topo do Card: Nome e Ações */}
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                        {deal.contact_name || 'Sem Nome'}
                    </h4>
                    {deal.title && deal.title !== `Oportunidade - ${deal.contact_name}` && (
                        <p className="text-[10px] text-slate-400 truncate">{deal.title}</p>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(deal);
                        }}
                        className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                        title="Editar Oportunidade"
                    >
                        <FiMoreVertical size={13} />
                    </button>
                </div>
            </div>

            {/* Informações de Contato */}
            <div className="space-y-1 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 font-mono text-slate-300">
                    <FiPhone size={11} className="text-slate-500" />
                    <span>{deal.contact_phone}</span>
                </div>
                {deal.contact_email && (
                    <div className="flex items-center gap-1.5 truncate text-[10px]">
                        <FiMail size={11} className="text-slate-500 shrink-0" />
                        <span className="truncate">{deal.contact_email}</span>
                    </div>
                )}
            </div>

            {/* Valor da Oportunidade & Status */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-1 font-black text-xs text-emerald-400">
                    <FiDollarSign size={12} className="text-emerald-500 shrink-0" />
                    <span>{formatCurrency(deal.value)}</span>
                </div>

                {deal.status === 'won' && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Ganho 🎉
                    </span>
                )}
                {deal.status === 'lost' && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        Perdido ❌
                    </span>
                )}
            </div>

            {/* Ação Rápida de 1 Clique: Abrir no Chat */}
            <div className="pt-1">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpenChat(deal.contact_phone);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                >
                    <FiMessageSquare size={12} />
                    <span>Abrir no WhatsApp</span>
                </button>
            </div>
        </div>
    );
}

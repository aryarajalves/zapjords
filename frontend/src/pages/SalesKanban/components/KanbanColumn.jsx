import React, { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { KanbanCard } from './KanbanCard';

const COLOR_MAP = {
    blue: {
        border: 'border-blue-500/30',
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        badge: 'bg-blue-500/20 text-blue-300'
    },
    rose: {
        border: 'border-rose-500/30',
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        badge: 'bg-rose-500/20 text-rose-300'
    },
    amber: {
        border: 'border-amber-500/30',
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        badge: 'bg-amber-500/20 text-amber-300'
    },
    purple: {
        border: 'border-purple-500/30',
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        badge: 'bg-purple-500/20 text-purple-300'
    },
    emerald: {
        border: 'border-emerald-500/30',
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        badge: 'bg-emerald-500/20 text-emerald-300'
    },
    slate: {
        border: 'border-slate-500/30',
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        badge: 'bg-slate-500/20 text-slate-300'
    }
};

export function KanbanColumn({ stage, onMoveDeal, onOpenNewDeal, onEditDeal, onDeleteDeal, onOpenChat }) {
    const [isDragOver, setIsDragOver] = useState(false);
    const colorStyle = COLOR_MAP[stage.color] || COLOR_MAP.blue;

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!isDragOver) setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const dealIdStr = e.dataTransfer.getData('dealId');
        if (dealIdStr) {
            const dealId = Number(dealIdStr);
            onMoveDeal(dealId, stage.id);
        }
    };

    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-72 md:w-80 shrink-0 flex flex-col h-full max-h-[calc(100vh-250px)] min-h-[400px] bg-slate-950/40 backdrop-blur-md rounded-3xl border transition-all duration-200 overflow-hidden ${
                isDragOver ? 'border-blue-400 bg-blue-500/5 shadow-2xl scale-[1.01]' : 'border-white/5'
            }`}
        >
            {/* Cabeçalho da Coluna */}
            <div className={`p-4 border-b border-white/5 rounded-t-3xl ${colorStyle.bg}`}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full ${colorStyle.border} bg-current ${colorStyle.text}`} />
                        <h3 className="text-xs font-black text-white uppercase tracking-wider truncate">
                            {stage.name}
                        </h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${colorStyle.badge}`}>
                            {stage.total_deals || 0}
                        </span>
                        <button
                            type="button"
                            onClick={() => onOpenNewDeal(stage.id)}
                            className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                            title={`Adicionar oportunidade em ${stage.name}`}
                        >
                            <FiPlus size={14} />
                        </button>
                    </div>
                </div>

                <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                    <span>Total da Etapa:</span>
                    <span className="text-white font-mono">{formatCurrency(stage.total_value)}</span>
                </div>
            </div>

            {/* Lista de Cards da Coluna */}
            <div className="p-3 pb-8 overflow-y-auto space-y-3 flex-1 min-h-0 custom-scrollbar">
                {stage.deals && stage.deals.length > 0 ? (
                    <>
                        {stage.deals.map(deal => (
                            <KanbanCard
                                key={deal.id}
                                deal={deal}
                                onEdit={onEditDeal}
                                onDelete={onDeleteDeal}
                                onOpenChat={onOpenChat}
                            />
                        ))}
                        {/* Espaçador de segurança para o último card nunca ser cortado no scroll */}
                        <div className="h-6 shrink-0" aria-hidden="true" />
                    </>
                ) : (
                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl text-slate-500 text-xs text-center p-3">
                        <span className="text-sm mb-1">📭</span>
                        <span>Nenhum lead nesta etapa</span>
                        <span className="text-[10px] text-slate-600 mt-0.5">Arraste um card para cá</span>
                    </div>
                )}
            </div>
        </div>
    );
}

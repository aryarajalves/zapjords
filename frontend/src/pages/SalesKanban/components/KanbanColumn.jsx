import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FiPlus, FiEdit2 } from 'react-icons/fi';
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
    },
    indigo: {
        border: 'border-indigo-500/30',
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-400',
        badge: 'bg-indigo-500/20 text-indigo-300'
    },
    cyan: {
        border: 'border-cyan-500/30',
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400',
        badge: 'bg-cyan-500/20 text-cyan-300'
    }
};

export function KanbanColumn({
    stage,
    onMoveDeal,
    onOpenNewDeal,
    onEditDeal,
    onDeleteDeal,
    onOpenChat,
    onEditStage,
    selectedDealIds = [],
    onToggleSelectDeal,
    onToggleSelectStage
}) {
    const [isDragOver, setIsDragOver] = useState(false);
    const colorStyle = COLOR_MAP[stage.color] || COLOR_MAP.blue;

    const checkboxRef = useRef(null);
    const stageDealIds = useMemo(() => (stage.deals || []).map(d => d.id), [stage.deals]);
    const stageDealsCount = stageDealIds.length;
    const selectedCountInStage = stageDealIds.filter(id => selectedDealIds.includes(id)).length;
    const isAllSelectedInStage = stageDealsCount > 0 && selectedCountInStage === stageDealsCount;
    const isPartiallySelectedInStage = selectedCountInStage > 0 && selectedCountInStage < stageDealsCount;

    useEffect(() => {
        if (checkboxRef.current) {
            checkboxRef.current.indeterminate = isPartiallySelectedInStage;
        }
    }, [isPartiallySelectedInStage]);

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
            className={`w-72 md:w-80 shrink-0 flex flex-col h-full max-h-full min-h-0 bg-slate-950/40 backdrop-blur-md rounded-2xl border transition-all duration-200 overflow-hidden ${
                isDragOver ? 'border-blue-400 bg-blue-500/5 shadow-2xl scale-[1.01]' : 'border-white/5'
            }`}
        >
            {/* Cabeçalho da Coluna */}
            <div className={`py-2 px-3.5 border-b border-white/5 rounded-t-2xl ${colorStyle.bg}`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                        {onToggleSelectStage && stageDealsCount > 0 && (
                            <input
                                type="checkbox"
                                ref={checkboxRef}
                                checked={isAllSelectedInStage}
                                onChange={() => onToggleSelectStage(stageDealIds)}
                                className="w-3.5 h-3.5 rounded border-white/20 bg-slate-800 text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer shrink-0 transition-all accent-blue-500 hover:border-blue-400"
                                title={
                                    isAllSelectedInStage
                                        ? `Desmarcar todos os ${stageDealsCount} leads de ${stage.name}`
                                        : `Selecionar todos os ${stageDealsCount} leads de ${stage.name}`
                                }
                                aria-label={`Selecionar todos os leads da coluna ${stage.name}`}
                            />
                        )}
                        <span className={`w-2.5 h-2.5 rounded-full ${colorStyle.border} bg-current ${colorStyle.text}`} />
                        <h3 className="text-xs font-black text-white uppercase tracking-wider truncate">
                            {stage.name}
                        </h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${colorStyle.badge}`} title={`${stage.total_deals || 0} leads (${stage.percentage !== undefined ? stage.percentage : 0}% do total)`}>
                            {stage.total_deals || 0} ({stage.percentage !== undefined ? stage.percentage : 0}%)
                        </span>
                        {onEditStage && (
                            <button
                                type="button"
                                onClick={() => onEditStage(stage)}
                                className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                                title={`Editar coluna ${stage.name}`}
                            >
                                <FiEdit2 size={12} />
                            </button>
                        )}
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

                <div className="text-[10px] font-bold text-slate-400 flex items-center justify-between">
                    <span>Total da Etapa ({stage.percentage !== undefined ? stage.percentage : 0}%):</span>
                    <span className="text-white font-mono">{formatCurrency(stage.total_value)}</span>
                </div>

                {stage.forward_to_pipeline_id && (
                    <div className="flex items-center gap-1 mt-1 pt-1 border-t border-white/5 text-[9px] font-bold text-emerald-400">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Avança automaticamente para outro funil</span>
                    </div>
                )}
            </div>

            {/* Lista de Cards da Coluna */}
            <div className="p-2.5 pb-4 overflow-y-auto space-y-2.5 flex-1 min-h-0 custom-scrollbar">
                {stage.deals && stage.deals.length > 0 ? (
                    <>
                        {stage.deals.map(deal => (
                            <KanbanCard
                                key={deal.id}
                                deal={deal}
                                onEdit={onEditDeal}
                                onDelete={onDeleteDeal}
                                onOpenChat={onOpenChat}
                                isSelected={selectedDealIds.includes(deal.id)}
                                onToggleSelect={onToggleSelectDeal}
                            />
                        ))}
                        {/* Espaçador de segurança sutil */}
                        <div className="h-2 shrink-0" aria-hidden="true" />
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

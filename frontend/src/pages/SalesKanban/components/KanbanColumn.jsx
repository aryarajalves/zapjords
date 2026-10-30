import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FiPlus, FiEdit2, FiClock } from 'react-icons/fi';
import { KanbanCard, getWindow24hStatus } from './KanbanCard';

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
    currentTime,
    onMoveDeal,
    onMoveStage,
    onStageDragStart,
    onStageDragEnd,
    draggedStageId,
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
    const isBeingDragged = draggedStageId === stage.id;
    const isStageTarget = isDragOver && Boolean(draggedStageId) && draggedStageId !== stage.id;
    const isDealTarget = isDragOver && !draggedStageId;

    const checkboxRef = useRef(null);
    const stageDealIds = useMemo(() => (stage.deals || []).map(d => d.id), [stage.deals]);
    const stageDealsCount = stageDealIds.length;
    const selectedCountInStage = stageDealIds.filter(id => selectedDealIds.includes(id)).length;
    const isAllSelectedInStage = stageDealsCount > 0 && selectedCountInStage === stageDealsCount;
    const isPartiallySelectedInStage = selectedCountInStage > 0 && selectedCountInStage < stageDealsCount;

    const stageWindowStats = useMemo(() => {
        const deals = stage.deals || [];
        const total = deals.length;
        if (total === 0) {
            return { count: 0, percentage: 0 };
        }
        const openCount = deals.filter(d => getWindow24hStatus(d, currentTime).isOpen).length;
        const pct = Math.round((openCount / total) * 1000) / 10;
        return { count: openCount, percentage: pct };
    }, [stage.deals, currentTime]);

    const liveFollowupOverdueCount = useMemo(() => {
        if (!stage.is_followup) return 0;
        const delayVal = Number(stage.followup_delay_value) || 3;
        const unit = stage.followup_delay_unit || 'hours';
        let limitMs = delayVal * 3600 * 1000;
        if (unit === 'minutes') limitMs = delayVal * 60 * 1000;
        else if (unit === 'days') limitMs = delayVal * 86400 * 1000;

        const now = currentTime ? (typeof currentTime === 'number' ? currentTime : new Date(currentTime).getTime()) : Date.now();
        return (stage.deals || []).filter(deal => {
            const rawEnteredAt = deal.stage_entered_at || deal.updated_at || deal.created_at;
            if (!rawEnteredAt) return Boolean(deal.needs_followup);
            const enteredTime = new Date(rawEnteredAt).getTime();
            return (now - enteredTime) >= limitMs;
        }).length;
    }, [stage, currentTime]);

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

    const handleDragLeave = (e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const textData = e.dataTransfer.getData('text/plain') || '';
        const stageIdStr = e.dataTransfer.getData('stageId') || (
            textData.startsWith('stage:') ? textData.replace('stage:', '') : ''
        );
        if (stageIdStr) {
            const sourceStageId = Number(stageIdStr);
            if (sourceStageId && sourceStageId !== stage.id && onMoveStage) {
                onMoveStage(sourceStageId, stage.id);
            }
            if (onStageDragEnd) onStageDragEnd();
            return;
        }
        const dealIdStr = e.dataTransfer.getData('dealId');
        if (dealIdStr) {
            const dealId = Number(dealIdStr);
            const sourceStageIdStr = e.dataTransfer.getData('sourceStageId');
            const sourceStageId = sourceStageIdStr ? Number(sourceStageIdStr) : null;
            if (sourceStageId && sourceStageId === stage.id) {
                // Soltou na mesma coluna: não atualiza nada
                return;
            }
            onMoveDeal(dealId, stage.id);
        }
    };

    const handleHeaderDragStart = (e) => {
        if (e.target.closest('button') || e.target.closest('input')) {
            e.preventDefault();
            return;
        }
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', `stage:${stage.id}`);
        e.dataTransfer.setData('stageId', String(stage.id));
        e.dataTransfer.setData('type', 'stage');
        e.dataTransfer.effectAllowed = 'move';
        if (onStageDragStart) onStageDragStart(stage.id);
    };

    const handleHeaderDragEnd = () => {
        if (onStageDragEnd) onStageDragEnd();
    };

    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            data-testid={`kanban-column-${stage.id}`}
            className={`w-72 md:w-80 shrink-0 flex flex-col h-full max-h-full min-h-0 bg-slate-950/40 backdrop-blur-md rounded-2xl border transition-all duration-200 overflow-hidden ${
                isBeingDragged
                    ? 'opacity-40 border-dashed border-blue-400 scale-[0.98]'
                    : isStageTarget
                    ? 'border-blue-400 bg-blue-500/15 shadow-2xl ring-2 ring-blue-500/50 scale-[1.02]'
                    : isDealTarget
                    ? 'border-blue-400 bg-blue-500/5 shadow-2xl scale-[1.01]'
                    : 'border-white/5'
            }`}
        >
            {/* Cabeçalho da Coluna (100% Arrastável com cursor intuitivo) */}
            <div
                draggable={true}
                data-column-header="true"
                data-testid={`column-drag-header-${stage.id}`}
                onDragStart={handleHeaderDragStart}
                onDragEnd={handleHeaderDragEnd}
                className={`py-2 px-3.5 border-b border-white/5 rounded-t-2xl cursor-grab active:cursor-grabbing select-none transition-colors ${colorStyle.bg}`}
                title={`Coluna ${stage.name} • Clique e segure com o botão esquerdo para reposicionar a coluna`}
            >
                <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                        {onToggleSelectStage && stageDealsCount > 0 && (
                            <input
                                type="checkbox"
                                ref={checkboxRef}
                                checked={isAllSelectedInStage}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
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
                        <span
                            className="text-slate-400/80 hover:text-white transition-colors cursor-grab text-xs font-mono mr-0.5 select-none shrink-0"
                            title="Segure e arraste para reposicionar a coluna"
                            aria-hidden="true"
                        >
                            ⠿
                        </span>
                        <span className={`w-2.5 h-2.5 rounded-full ${colorStyle.border} bg-current ${colorStyle.text}`} />
                        <h3 className="text-xs font-black text-white uppercase tracking-wider truncate cursor-grab active:cursor-grabbing">
                            {stage.name}
                        </h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span
                            draggable={true}
                            data-testid={`column-drag-handle-${stage.id}`}
                            onDragStart={handleHeaderDragStart}
                            onDragEnd={handleHeaderDragEnd}
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full cursor-grab active:cursor-grabbing select-none transition-all hover:scale-105 active:scale-95 shadow-sm inline-flex items-center gap-1 ${colorStyle.badge}`}
                            title={`${stage.total_deals || 0} leads (${stage.percentage !== undefined ? stage.percentage : 0}% do total) • Segure e arraste para reposicionar a coluna`}
                        >
                            <span className="opacity-50 text-[9px] select-none pointer-events-none">⠿</span>
                            {stage.total_deals || 0} ({stage.percentage !== undefined ? stage.percentage : 0}%)
                        </span>
                        {onEditStage && (
                            <button
                                type="button"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditStage(stage);
                                }}
                                className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                                title={`Editar coluna ${stage.name}`}
                            >
                                <FiEdit2 size={12} />
                            </button>
                        )}
                        <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenNewDeal(stage.id);
                            }}
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

                <div
                    data-testid={`stage-window-24h-stats-${stage.id}`}
                    className="text-[10px] font-bold text-slate-400 flex items-center justify-between mt-1 pt-1 border-t border-white/5"
                    title="Quantidade e porcentagem de contatos desta coluna com a janela de 24h do WhatsApp aberta"
                >
                    <span className="flex items-center gap-1.5 text-emerald-400">
                        <span className={`w-1.5 h-1.5 rounded-full ${stageWindowStats.count > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                        <span>Janela 24h Aberta:</span>
                    </span>
                    <span className="font-mono text-emerald-300 font-black">
                        {stageWindowStats.count}/{stageDealsCount} ({stageWindowStats.percentage}%)
                    </span>
                </div>

                {stage.forward_to_pipeline_id && (
                    <div className="flex items-center gap-1 mt-1 pt-1 border-t border-white/5 text-[9px] font-bold text-emerald-400">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Avança automaticamente para outro funil</span>
                    </div>
                )}

                {stage.is_followup && (
                    <div className="flex items-center justify-between gap-1 mt-1 pt-1 border-t border-white/5 text-[9px] font-bold">
                        <div className="flex items-center gap-1 text-amber-300">
                            <FiClock size={10} className="text-amber-400 shrink-0" />
                            <span>Follow-up: {stage.followup_delay_value || 3}{stage.followup_delay_unit === 'hours' ? 'h' : stage.followup_delay_unit === 'days' ? 'd' : 'm'}</span>
                        </div>
                        {Boolean((liveFollowupOverdueCount ?? stage.followup_overdue_count) > 0) && (
                            <span
                                data-testid={`stage-followup-badge-${stage.id}`}
                                className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[8px] font-black animate-pulse"
                            >
                                {(liveFollowupOverdueCount ?? stage.followup_overdue_count)} {(liveFollowupOverdueCount ?? stage.followup_overdue_count) === 1 ? 'pendente' : 'pendentes'}
                            </span>
                        )}
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
                                stage={stage}
                                currentTime={currentTime}
                                onEdit={onEditDeal}
                                onDelete={onDeleteDeal}
                                onOpenChat={onOpenChat}
                                isSelected={selectedDealIds.includes(deal.id)}
                                onToggleSelect={onToggleSelectDeal}
                            />
                        ))}
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

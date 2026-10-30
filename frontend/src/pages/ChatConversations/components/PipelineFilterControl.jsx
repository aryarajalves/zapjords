import React, { useMemo } from 'react';
import { FiColumns, FiSlash, FiX } from 'react-icons/fi';

export default function PipelineFilterControl({
    filterNoPipeline,
    setFilterNoPipeline,
    filterNotInPipelineId,
    setFilterNotInPipelineId,
    filterInPipeline,
    setFilterInPipeline,
    filterPipelineId,
    setFilterPipelineId,
    filterPipelineStageId,
    setFilterPipelineStageId,
    pipelines = []
}) {
    const isNegativeActive = filterNoPipeline || !!filterNotInPipelineId;
    const isPositiveActive = filterInPipeline || !!filterPipelineId || !!filterPipelineStageId;

    const selectedPipeline = useMemo(() => {
        if (!filterPipelineId) return null;
        return pipelines.find(p => p.id === filterPipelineId) || null;
    }, [pipelines, filterPipelineId]);

    const availableStages = useMemo(() => {
        if (!selectedPipeline || !Array.isArray(selectedPipeline.stages)) return [];
        return [...selectedPipeline.stages].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    }, [selectedPipeline]);

    const selectedStage = useMemo(() => {
        if (!filterPipelineStageId) return null;
        return availableStages.find(s => s.id === filterPipelineStageId) || null;
    }, [availableStages, filterPipelineStageId]);

    const handleClearAll = () => {
        setFilterNoPipeline(false);
        setFilterNotInPipelineId(null);
        if (setFilterInPipeline) setFilterInPipeline(false);
        if (setFilterPipelineId) setFilterPipelineId(null);
        if (setFilterPipelineStageId) setFilterPipelineStageId(null);
    };

    // Toggle para "No Kanban" (Filtro Positivo)
    const handleTogglePositive = () => {
        if (isPositiveActive) {
            handleClearAll();
        } else {
            // Desativa o negativo e ativa o positivo geral
            setFilterNoPipeline(false);
            setFilterNotInPipelineId(null);
            if (setFilterInPipeline) setFilterInPipeline(true);
            if (setFilterPipelineId) setFilterPipelineId(null);
            if (setFilterPipelineStageId) setFilterPipelineStageId(null);
        }
    };

    // Toggle para "Sem Kanban" (Filtro Negativo)
    const handleToggleNegative = () => {
        if (isNegativeActive) {
            handleClearAll();
        } else {
            // Desativa o positivo e ativa o negativo geral
            if (setFilterInPipeline) setFilterInPipeline(false);
            if (setFilterPipelineId) setFilterPipelineId(null);
            if (setFilterPipelineStageId) setFilterPipelineStageId(null);
            setFilterNoPipeline(true);
            setFilterNotInPipelineId(null);
        }
    };

    const handlePositivePipelineChange = (e) => {
        const val = e.target.value;
        if (!val || val === 'all') {
            if (setFilterInPipeline) setFilterInPipeline(true);
            if (setFilterPipelineId) setFilterPipelineId(null);
            if (setFilterPipelineStageId) setFilterPipelineStageId(null);
        } else {
            const pipeId = Number(val);
            if (setFilterInPipeline) setFilterInPipeline(false);
            if (setFilterPipelineId) setFilterPipelineId(pipeId);
            if (setFilterPipelineStageId) setFilterPipelineStageId(null);
        }
    };

    const handlePositiveStageChange = (e) => {
        const val = e.target.value;
        if (!val || val === 'all') {
            if (setFilterPipelineStageId) setFilterPipelineStageId(null);
        } else {
            if (setFilterPipelineStageId) setFilterPipelineStageId(Number(val));
        }
    };

    const handleNegativeSelectChange = (e) => {
        const val = e.target.value;
        if (!val || val === 'all_none') {
            setFilterNoPipeline(true);
            setFilterNotInPipelineId(null);
        } else {
            setFilterNoPipeline(false);
            setFilterNotInPipelineId(Number(val));
        }
    };

    return (
        <div className="col-span-3 mt-1 pt-1.5 border-t border-gray-100 dark:border-white/5 space-y-1.5">
            {/* Linha de botões de alternância */}
            <div className="flex items-center gap-1.5">
                {/* Botão: No Kanban (Positivo) */}
                <button
                    type="button"
                    onClick={handleTogglePositive}
                    data-testid="filter-in-pipeline-toggle-btn"
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition ${
                        isPositiveActive
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 ring-1 ring-emerald-500/40 font-bold shadow-sm'
                            : 'text-gray-400 border-gray-200 dark:border-white/5 bg-white dark:bg-[#1e293b] hover:border-gray-300 dark:hover:border-white/10'
                    }`}
                    title="Filtrar contatos que possuem oportunidade/lead no Kanban"
                >
                    <FiColumns size={12} className="shrink-0" />
                    <span className="truncate">
                        {selectedStage && selectedPipeline
                            ? `${selectedPipeline.name} > ${selectedStage.name}`
                            : selectedPipeline
                            ? `Kanban: ${selectedPipeline.name}`
                            : isPositiveActive
                            ? 'No Kanban (Todos)'
                            : 'No Kanban'}
                    </span>
                </button>

                {/* Botão: Sem Kanban (Negativo) */}
                <button
                    type="button"
                    onClick={handleToggleNegative}
                    data-testid="filter-pipeline-toggle-btn"
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition ${
                        isNegativeActive
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 ring-1 ring-amber-500/40 font-bold'
                            : 'text-gray-400 border-gray-200 dark:border-white/5 bg-white dark:bg-[#1e293b] hover:border-gray-300 dark:hover:border-white/10'
                    }`}
                    title="Filtrar conversas que não possuem negócio/lead no Kanban"
                >
                    <FiSlash size={12} className="shrink-0" />
                    <span className="truncate">
                        {filterNotInPipelineId
                            ? `Fora de: ${(pipelines.find(p => p.id === filterNotInPipelineId)?.name) || 'Específica'}`
                            : filterNoPipeline
                            ? 'Sem Nenhuma Pipeline'
                            : 'Sem Kanban'}
                    </span>
                </button>

                {/* Botão Limpar Filtro */}
                {(isPositiveActive || isNegativeActive) && (
                    <button
                        type="button"
                        onClick={handleClearAll}
                        data-testid="filter-pipeline-clear-btn"
                        className="p-1.5 rounded-lg border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition shrink-0"
                        title="Limpar filtros de Kanban"
                    >
                        <FiX size={12} />
                    </button>
                )}
            </div>

            {/* Painel de Configuração: Filtro Positivo (No Kanban) */}
            {isPositiveActive && (
                <div className="bg-gray-100/70 dark:bg-black/20 p-2 rounded-lg border border-emerald-500/20 space-y-1.5 animate-in fade-in duration-150">
                    {/* Seletor de Pipeline */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 shrink-0 font-medium w-12">Pipeline:</span>
                        <select
                            value={filterPipelineId ? String(filterPipelineId) : 'all'}
                            onChange={handlePositivePipelineChange}
                            data-testid="filter-in-pipeline-select"
                            className="flex-1 bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-200 text-[10px] rounded border border-gray-200 dark:border-white/10 py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                        >
                            <option value="all">⭐ Todas as Pipelines (Qualquer Lead no Kanban)</option>
                            {pipelines.map(pipe => (
                                <option key={pipe.id} value={String(pipe.id)}>
                                    📂 {pipe.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Seletor de Coluna/Etapa (apenas se uma pipeline específica foi escolhida) */}
                    {selectedPipeline && (
                        <div className="flex items-center gap-1.5 pt-1 border-t border-gray-200/50 dark:border-white/5">
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 shrink-0 font-medium w-12">Coluna:</span>
                            <select
                                value={filterPipelineStageId ? String(filterPipelineStageId) : 'all'}
                                onChange={handlePositiveStageChange}
                                data-testid="filter-in-stage-select"
                                className="flex-1 bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-200 text-[10px] rounded border border-gray-200 dark:border-white/10 py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                            >
                                <option value="all">📑 Todas as Colunas de "{selectedPipeline.name}"</option>
                                {availableStages.map(stage => (
                                    <option key={stage.id} value={String(stage.id)}>
                                        📍 {stage.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}

            {/* Painel de Configuração: Filtro Negativo (Sem Kanban) */}
            {isNegativeActive && (
                <div className="flex items-center gap-1.5 bg-gray-100/70 dark:bg-black/20 p-1.5 rounded-lg border border-amber-500/20 animate-in fade-in duration-150">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 shrink-0 font-medium">Modo:</span>
                    <select
                        value={filterNotInPipelineId ? String(filterNotInPipelineId) : 'all_none'}
                        onChange={handleNegativeSelectChange}
                        data-testid="filter-pipeline-select"
                        className="flex-1 bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-200 text-[10px] rounded border border-gray-200 dark:border-white/10 py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    >
                        <option value="all_none">🚫 Em Nenhuma Pipeline (Geral - Sem CRM)</option>
                        {pipelines.map(pipe => (
                            <option key={pipe.id} value={String(pipe.id)}>
                                🚫 Fora da pipeline: {pipe.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}

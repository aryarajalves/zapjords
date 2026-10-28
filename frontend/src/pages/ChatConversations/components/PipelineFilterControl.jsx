import React from 'react';
import { FiColumns, FiX } from 'react-icons/fi';

export default function PipelineFilterControl({
    filterNoPipeline,
    setFilterNoPipeline,
    filterNotInPipelineId,
    setFilterNotInPipelineId,
    pipelines = []
}) {
    const isFilterActive = filterNoPipeline || !!filterNotInPipelineId;

    const handleToggleMain = () => {
        if (isFilterActive) {
            setFilterNoPipeline(false);
            setFilterNotInPipelineId(null);
        } else {
            setFilterNoPipeline(true);
            setFilterNotInPipelineId(null);
        }
    };

    const handleSelectChange = (e) => {
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
            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={handleToggleMain}
                    data-testid="filter-pipeline-toggle-btn"
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition ${
                        isFilterActive
                            ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40 ring-1 ring-indigo-500/40 font-bold'
                            : 'text-gray-400 border-gray-200 dark:border-white/5 bg-white dark:bg-[#1e293b] hover:border-gray-300 dark:hover:border-white/10'
                    }`}
                    title="Filtrar conversas que não possuem negócio/lead no Kanban"
                >
                    <FiColumns size={12} className="shrink-0" />
                    <span className="truncate">
                        {filterNotInPipelineId
                            ? `Fora da Pipeline: ${(pipelines.find(p => p.id === filterNotInPipelineId)?.name) || 'Específica'}`
                            : filterNoPipeline
                            ? 'Sem Nenhuma Pipeline (Kanban)'
                            : 'Sem Pipeline no Kanban'}
                    </span>
                </button>

                {isFilterActive && (
                    <button
                        type="button"
                        onClick={() => {
                            setFilterNoPipeline(false);
                            setFilterNotInPipelineId(null);
                        }}
                        data-testid="filter-pipeline-clear-btn"
                        className="p-1.5 rounded-lg border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition shrink-0"
                        title="Limpar filtro de pipeline"
                    >
                        <FiX size={12} />
                    </button>
                )}
            </div>

            {isFilterActive && (
                <div className="flex items-center gap-1.5 bg-gray-100/70 dark:bg-black/20 p-1.5 rounded-lg border border-gray-200 dark:border-white/5">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 shrink-0 font-medium">Modo:</span>
                    <select
                        value={filterNotInPipelineId ? String(filterNotInPipelineId) : 'all_none'}
                        onChange={handleSelectChange}
                        data-testid="filter-pipeline-select"
                        className="flex-1 bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-200 text-[10px] rounded border border-gray-200 dark:border-white/10 py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
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

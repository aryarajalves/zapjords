import React from 'react';
import { FiCheckSquare, FiSquare, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';

export function BulkActionsBar({
    selectedCount,
    totalDeals = 0,
    stages = [],
    onSelectAll,
    onClearSelection,
    onSelectStage,
    onOpenBulkEdit,
    onOpenBulkDelete
}) {
    if (!selectedCount || selectedCount <= 0) return null;

    const isAllSelected = totalDeals > 0 && selectedCount >= totalDeals;

    return (
        <div 
            data-testid="kanban-bulk-actions-bar"
            className="bg-slate-900/95 backdrop-blur-md border border-blue-500/30 rounded-2xl p-2.5 px-4 mb-2 shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-fade-in transition-all"
        >
            {/* Lado Esquerdo: Contagem e Seleção Total / Coluna */}
            <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                    </span>
                    <span className="text-xs font-black text-white">
                        {selectedCount} {selectedCount === 1 ? 'lead selecionado' : 'leads selecionados'}
                    </span>
                </div>

                <div className="h-4 w-px bg-white/10 hidden sm:block" />

                {/* Selecionar Todos do Quadro Inteiro */}
                {!isAllSelected && (
                    <button
                        type="button"
                        onClick={onSelectAll}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                        title={`Selecionar todos os ${totalDeals} leads do quadro`}
                    >
                        <FiCheckSquare size={13} className="text-blue-400" />
                        <span>Selecionar Todos ({totalDeals})</span>
                    </button>
                )}

                {/* Dropdown Rápido para Selecionar por Coluna Específica */}
                {stages && stages.length > 0 && onSelectStage && (
                    <div className="relative">
                        <select
                            defaultValue=""
                            onChange={(e) => {
                                if (!e.target.value) return;
                                const stageId = Number(e.target.value);
                                const targetStage = stages.find(s => s.id === stageId);
                                if (targetStage) {
                                    const dealIds = (targetStage.deals || []).map(d => d.id);
                                    onSelectStage(dealIds);
                                }
                                e.target.value = '';
                            }}
                            className="bg-slate-800/90 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white font-bold text-xs rounded-lg px-2.5 py-1 outline-none cursor-pointer focus:border-blue-500 transition-all pr-6 appearance-none"
                            title="Selecionar todos os leads de uma coluna específica"
                        >
                            <option value="" disabled className="bg-slate-900 text-slate-400">
                                + Selecionar Coluna...
                            </option>
                            {stages.map(st => {
                                const count = st.deals?.length || 0;
                                return (
                                    <option key={st.id} value={st.id} className="bg-slate-900 text-white">
                                        {st.name} ({count})
                                    </option>
                                );
                            })}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-400 text-[10px]">
                            ▼
                        </div>
                    </div>
                )}

                {/* Desmarcar Todos */}
                <button
                    type="button"
                    onClick={onClearSelection}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                    title="Desmarcar todos os leads selecionados"
                >
                    <FiSquare size={13} />
                    <span>Desmarcar Todos</span>
                </button>
            </div>

            {/* Lado Direito: Ações em Massa */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onOpenBulkEdit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-black transition-all cursor-pointer shadow-sm hover:shadow-blue-500/10"
                    title="Editar produto e/ou preço dos leads selecionados"
                >
                    <FiEdit2 size={13} />
                    <span>Editar Produto e Preço</span>
                </button>

                <button
                    type="button"
                    onClick={onOpenBulkDelete}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-black transition-all cursor-pointer shadow-sm hover:shadow-rose-600/10"
                    title="Remover todos os leads selecionados deste Kanban"
                >
                    <FiTrash2 size={13} />
                    <span>Remover Selecionados</span>
                </button>

                <button
                    type="button"
                    onClick={onClearSelection}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer ml-1"
                    title="Cancelar seleção"
                    aria-label="Cancelar seleção"
                >
                    <FiX size={15} />
                </button>
            </div>
        </div>
    );
}

import React from 'react';
import { FiTrello, FiPlus, FiRefreshCw, FiDollarSign, FiCheckCircle, FiSearch, FiEdit2, FiTag } from 'react-icons/fi';

export function KanbanHeader({
    pipelines,
    selectedPipelineId,
    onSelectPipeline,
    boardData,
    searchTerm,
    onSearchChange,
    onOpenNewPipeline,
    onOpenEditPipeline,
    onOpenNewDeal,
    onSyncHistory,
    isSyncing
}) {
    const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);

    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <div className="space-y-4 mb-6">
            {/* Linha 1: Título e Ações Principais */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 shadow-inner">
                        <FiTrello size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                            Kanban de Vendas
                            {selectedPipeline?.product_name && (
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold flex items-center gap-1">
                                    <FiTag size={10} />
                                    {selectedPipeline.product_name}
                                </span>
                            )}
                        </h1>
                        <p className="text-xs text-slate-400">
                            Gestão visual de oportunidades, fechamento e automação por estágios de produto.
                        </p>
                    </div>
                </div>

                {/* Seletor de Pipeline e Botões */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Dropdown de Pipelines de Produto */}
                    <div className="relative">
                        <select
                            value={selectedPipelineId || ''}
                            onChange={(e) => onSelectPipeline(Number(e.target.value))}
                            className="bg-slate-900 border border-white/10 text-white font-bold text-xs rounded-xl px-3 py-2.5 outline-none cursor-pointer focus:border-blue-500 transition-all pr-8 appearance-none"
                        >
                            {pipelines.map(pipe => (
                                <option key={pipe.id} value={pipe.id} className="bg-slate-900 text-white">
                                    {pipe.name} {pipe.product_name ? `(${pipe.product_name})` : ''}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                            ▼
                        </div>
                    </div>

                    {selectedPipeline && (
                        <button
                            type="button"
                            onClick={() => onOpenEditPipeline(selectedPipeline)}
                            title="Editar Pipeline do Produto"
                            className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-white/10 rounded-xl transition-all cursor-pointer"
                        >
                            <FiEdit2 size={15} />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onSyncHistory}
                        disabled={isSyncing}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-white/10 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        title="Puxar leads antigos de webhook que compraram ou abandonaram este produto"
                    >
                        <FiRefreshCw size={14} className={isSyncing ? 'animate-spin text-blue-400' : ''} />
                        <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Histórico'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={onOpenNewPipeline}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                        <FiPlus size={14} />
                        <span>Novo Pipeline</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onOpenNewDeal(null)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                    >
                        <FiPlus size={15} />
                        <span>Nova Oportunidade</span>
                    </button>
                </div>
            </div>

            {/* Linha 2: Resumo Financeiro & Busca */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Métricas */}
                <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-3 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total em Negociação</span>
                        <div className="text-lg font-black text-white mt-0.5">
                            {formatCurrency(boardData?.total_value)}
                        </div>
                    </div>
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                        <FiDollarSign size={18} />
                    </div>
                </div>

                <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-3 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Vendas Fechadas (Ganho)</span>
                        <div className="text-lg font-black text-emerald-400 mt-0.5">
                            {formatCurrency(boardData?.total_won_value)}
                        </div>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                        <FiCheckCircle size={18} />
                    </div>
                </div>

                <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-3 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total de Leads / Deals</span>
                        <div className="text-lg font-black text-white mt-0.5">
                            {boardData?.total_deals || 0} <span className="text-xs font-medium text-slate-400">({boardData?.total_won_deals || 0} ganhos)</span>
                        </div>
                    </div>
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                        <FiTrello size={18} />
                    </div>
                </div>

                {/* Busca Rápida */}
                <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-2.5 flex items-center gap-2">
                    <FiSearch className="text-slate-400 shrink-0 ml-1" size={16} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Buscar por nome, telefone ou e-mail..."
                        className="w-full bg-transparent text-white text-xs placeholder:text-slate-500 outline-none"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => onSearchChange('')}
                            className="text-xs text-slate-400 hover:text-white mr-1 cursor-pointer"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { FiTrello, FiPlus, FiRefreshCw, FiDollarSign, FiCheckCircle, FiSearch, FiEdit2, FiTag, FiColumns, FiPackage, FiTrendingUp, FiMinimize2, FiMaximize2, FiTrash2 } from 'react-icons/fi';

const STAGE_BAR_COLORS = {
    blue: 'bg-blue-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
    emerald: 'bg-emerald-500',
    slate: 'bg-slate-500',
    indigo: 'bg-indigo-500',
    cyan: 'bg-cyan-500'
};

export function KanbanHeader({
    pipelines,
    selectedPipelineId,
    onSelectPipeline,
    boardData,
    searchTerm,
    onSearchChange,
    onOpenNewPipeline,
    onOpenEditPipeline,
    onDeletePipeline,
    onOpenNewDeal,
    onOpenNewStage,
    onOpenProducts,
    productsCount = 0,
    onSyncHistory,
    isSyncing
}) {
    const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);
    const [showMetrics, setShowMetrics] = useState(() => {
        return localStorage.getItem('kanban_show_metrics') !== 'false';
    });

    const toggleMetrics = () => {
        setShowMetrics(prev => {
            const next = !prev;
            localStorage.setItem('kanban_show_metrics', String(next));
            return next;
        });
    };

    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <div className="space-y-2 mb-2">
            {/* Linha 1: Título Compacto e Ações Principais */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 shadow-inner">
                        <FiTrello size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
                            Kanban de Vendas
                            {selectedPipeline?.product_name && (
                                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold flex items-center gap-1">
                                    <FiTag size={10} />
                                    {selectedPipeline.product_name}
                                </span>
                            )}
                        </h1>
                        <p className="text-[11px] text-slate-400 hidden sm:block">
                            Gestão visual de oportunidades, fechamento e automação por estágios de produto.
                        </p>
                    </div>
                </div>

                {/* Seletor de Pipeline e Botões */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Botão para Alternar Modo Compacto / Ver Métricas */}
                    <button
                        type="button"
                        onClick={toggleMetrics}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border border-cyan-500/20 hover:border-cyan-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                        title={showMetrics ? 'Recolher métricas numéricas para expandir a altura visível das colunas' : 'Exibir métricas do funil'}
                    >
                        {showMetrics ? <FiMinimize2 size={13} /> : <FiMaximize2 size={13} />}
                        <span>{showMetrics ? 'Recolher Métricas' : 'Ver Métricas'}</span>
                    </button>

                    {/* Dropdown de Pipelines de Produto */}
                    <div className="relative">
                        <select
                            value={selectedPipelineId || ''}
                            onChange={(e) => onSelectPipeline(Number(e.target.value))}
                            className="bg-slate-900 border border-white/10 text-white font-bold text-xs rounded-xl px-3 py-2 outline-none cursor-pointer focus:border-blue-500 transition-all pr-8 appearance-none"
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
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => onOpenEditPipeline(selectedPipeline)}
                                title="Editar Pipeline do Produto"
                                className="p-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-white/10 rounded-xl transition-all cursor-pointer"
                            >
                                <FiEdit2 size={14} />
                            </button>
                            {onDeletePipeline && (
                                <button
                                    type="button"
                                    onClick={() => onDeletePipeline(selectedPipeline)}
                                    title={`Excluir Pipeline "${selectedPipeline.name}"`}
                                    className="p-2 bg-slate-800/80 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-xl transition-all cursor-pointer"
                                >
                                    <FiTrash2 size={14} />
                                </button>
                            )}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={onSyncHistory}
                        disabled={isSyncing}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-white/10 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        title="Puxar leads antigos de webhook que compraram ou abandonaram este produto"
                    >
                        <FiRefreshCw size={13} className={isSyncing ? 'animate-spin text-blue-400' : ''} />
                        <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={onOpenNewPipeline}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                        <FiPlus size={13} />
                        <span>Novo Pipeline</span>
                    </button>

                    <button
                        type="button"
                        onClick={onOpenNewStage}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer hover:border-emerald-500/40"
                        title="Criar nova coluna / estágio no CRM"
                    >
                        <FiColumns size={13} />
                        <span>+ Nova Coluna</span>
                    </button>

                    <button
                        type="button"
                        onClick={onOpenProducts}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-amber-400 border border-amber-500/20 hover:border-amber-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        title="Gerenciar catálogo de produtos e valores da empresa"
                    >
                        <FiPackage size={13} />
                        <span>Produtos</span>
                        {productsCount > 0 && (
                            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/15 text-amber-300 font-black">
                                {productsCount}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => onOpenNewDeal(null)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                    >
                        <FiPlus size={14} />
                        <span>Nova Oportunidade</span>
                    </button>
                </div>
            </div>

            {/* Linha 2: Resumo Financeiro & Taxa de Conversão Compactos */}
            {showMetrics && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 transition-all">
                    {/* Métricas */}
                    <div className="bg-slate-900/60 border border-white/5 rounded-xl px-3 py-2 flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Total em Negociação</span>
                            <div className="text-base font-black text-white">
                                {formatCurrency(boardData?.total_value)}
                            </div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                            <FiDollarSign size={16} />
                        </div>
                    </div>

                    <div className="bg-slate-900/60 border border-white/5 rounded-xl px-3 py-2 flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Vendas Fechadas (Ganho)</span>
                            <div className="text-base font-black text-emerald-400">
                                {formatCurrency(boardData?.total_won_value)}
                            </div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <FiCheckCircle size={16} />
                        </div>
                    </div>

                    <div className="bg-slate-900/60 border border-white/5 rounded-xl px-3 py-2 flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Total de Leads / Deals</span>
                            <div className="text-base font-black text-white">
                                {boardData?.total_deals || 0} <span className="text-[11px] font-medium text-slate-400">({boardData?.total_won_deals || 0} ganhos)</span>
                            </div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                            <FiTrello size={16} />
                        </div>
                    </div>

                    <div className="bg-slate-900/60 border border-white/5 rounded-xl px-3 py-2 flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Taxa de Conversão</span>
                            <div className="text-base font-black text-cyan-400">
                                {Number(boardData?.conversion_rate || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%
                            </div>
                            <span className="text-[9px] font-bold text-slate-500">
                                {boardData?.total_won_deals || 0} de {boardData?.total_deals || 0} convertidos
                            </span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                            <FiTrendingUp size={16} />
                        </div>
                    </div>
                </div>
            )}

            {/* Linha 3: Barra de Progresso do Funil e Busca Rápida Compactas */}
            <div className="bg-slate-900/50 border border-white/5 rounded-xl p-2.5 space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-white">
                            Distribuição do Funil
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                            {boardData?.total_deals || 0} {boardData?.total_deals === 1 ? 'lead' : 'leads'} totais
                        </span>
                    </div>

                    {/* Busca Rápida Integrada Compacta */}
                    <div className="relative w-full sm:w-64">
                        <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Buscar por nome, telefone ou e-mail..."
                            className="w-full bg-slate-950/60 border border-white/10 rounded-lg pl-8 pr-6 py-1 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500/50 transition-all"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => onSearchChange('')}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1 cursor-pointer"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* Barra de Progresso Proporcional Fina */}
                <div className="w-full h-2 rounded-full bg-slate-800/80 border border-white/10 overflow-hidden flex shadow-inner">
                    {boardData?.stages?.map((st) => {
                        const pct = st.percentage || 0;
                        if (pct <= 0) return null;
                        const barBg = STAGE_BAR_COLORS[st.color] || 'bg-blue-500';
                        return (
                            <div
                                key={st.id}
                                style={{ width: `${pct}%` }}
                                className={`${barBg} h-full transition-all duration-500 relative group cursor-pointer`}
                                title={`${st.name}: ${st.total_deals || 0} leads (${pct}%)`}
                            />
                        );
                    })}
                    {(!boardData?.total_deals || boardData.total_deals === 0) && (
                        <div className="w-full h-full bg-slate-800/40 text-[9px] text-slate-500 flex items-center justify-center font-bold">
                            Nenhum lead no funil ainda
                        </div>
                    )}
                </div>

                {/* Legendas das Fatias com Bolinhas Coloridas e Porcentagens Compactas */}
                <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pt-0.5 flex-wrap">
                    {boardData?.stages?.map((st) => {
                        const dotBg = STAGE_BAR_COLORS[st.color] || 'bg-blue-500';
                        const pct = st.percentage !== undefined ? st.percentage : 0;
                        return (
                            <div key={st.id} className="flex items-center gap-1.5 shrink-0 text-[11px]">
                                <span className={`w-1.5 h-1.5 rounded-full ${dotBg}`} />
                                <span className="font-bold text-slate-300">{st.name}:</span>
                                <span className="font-mono font-black text-white">{pct}%</span>
                                <span className="text-[10px] text-slate-500">({st.total_deals || 0})</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

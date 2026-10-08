import React from 'react';
import { FiMessageSquare, FiCalendar, FiFilter, FiX } from 'react-icons/fi';

export const ViewContactsFilterBar = ({
    filterType,
    setFilterType,
    contactsCount,
    activeCount,
    excludedCount,
    pageSize,
    setPageSize,
    interactionFilter,
    setInteractionFilter,
    createdFilter,
    setCreatedFilter
}) => {
    const hasActiveFilters = Boolean(interactionFilter || createdFilter);

    return (
        <div className="bg-slate-950/40 border-b border-white/5 space-y-3 px-8 py-4">
            {/* Linha 1: Status do Contato e Limite por Página */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setFilterType('all')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${filterType === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 hover:bg-white/10 text-slate-400'}`}
                    >
                        Todos ({contactsCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterType('active')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${filterType === 'active' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white/5 hover:bg-white/10 text-slate-400'}`}
                    >
                        Ativos ({activeCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterType('excluded')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${filterType === 'excluded' ? 'bg-rose-600 text-white shadow-lg' : 'bg-white/5 hover:bg-white/10 text-slate-400'}`}
                    >
                        Removidos ({excludedCount})
                    </button>
                </div>
                
                {/* Seletor de Contatos por Página */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Exibir:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="bg-slate-800 border border-white/10 text-white text-xs font-black rounded-lg px-2.5 py-1.5 outline-none cursor-pointer focus:border-blue-500/50"
                    >
                        <option value={20}>20 contatos</option>
                        <option value={50}>50 contatos</option>
                        <option value={100}>100 contatos</option>
                        <option value={500}>500 contatos</option>
                        <option value={1000}>1000 contatos</option>
                    </select>
                </div>
            </div>

            {/* Linha 2: Filtros de Segmentação Dinâmica (Interação & Criação) */}
            <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <FiFilter className="text-blue-400" />
                        Disparar Apenas:
                    </span>

                    {/* Filtro de Última Interação */}
                    <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/10">
                        <FiMessageSquare size={13} className={interactionFilter ? 'text-purple-400' : 'text-slate-500'} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Interagiram:</span>
                        <select
                            value={interactionFilter || ''}
                            onChange={(e) => setInteractionFilter(e.target.value ? Number(e.target.value) : null)}
                            className="bg-transparent text-white text-xs font-black outline-none cursor-pointer pr-1"
                        >
                            <option value="" className="bg-slate-900 text-white">Todas as interações</option>
                            <option value="7" className="bg-slate-900 text-white">Últimos 7 dias</option>
                            <option value="14" className="bg-slate-900 text-white">Últimos 14 dias</option>
                            <option value="30" className="bg-slate-900 text-white">Últimos 30 dias</option>
                            <option value="60" className="bg-slate-900 text-white">Últimos 60 dias</option>
                            <option value="90" className="bg-slate-900 text-white">Últimos 90 dias</option>
                        </select>
                    </div>

                    {/* Filtro de Data de Criação */}
                    <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/10">
                        <FiCalendar size={13} className={createdFilter ? 'text-sky-400' : 'text-slate-500'} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Criados:</span>
                        <select
                            value={createdFilter || ''}
                            onChange={(e) => setCreatedFilter(e.target.value ? Number(e.target.value) : null)}
                            className="bg-transparent text-white text-xs font-black outline-none cursor-pointer pr-1"
                        >
                            <option value="" className="bg-slate-900 text-white">Qualquer data de cadastro</option>
                            <option value="7" className="bg-slate-900 text-white">Últimos 7 dias</option>
                            <option value="14" className="bg-slate-900 text-white">Últimos 14 dias</option>
                            <option value="30" className="bg-slate-900 text-white">Últimos 30 dias</option>
                            <option value="60" className="bg-slate-900 text-white">Últimos 60 dias</option>
                            <option value="90" className="bg-slate-900 text-white">Últimos 90 dias</option>
                        </select>
                    </div>

                    {/* Botão Limpar Filtros quando ativo */}
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={() => {
                                setInteractionFilter(null);
                                setCreatedFilter(null);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                            title="Remover filtros de interação e criação"
                        >
                            <FiX size={12} />
                            Limpar Filtros
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

import React from 'react';

const QUICK_FILTER_BUTTONS = [
    {
        id: 'empty',
        label: 'Vazios',
        activeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 ring-1 ring-rose-500/30',
    },
    {
        id: 'numeric',
        label: 'Só Números',
        activeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30',
    },
    {
        id: 'not_real_name',
        label: 'Não parece nome',
        activeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40 ring-1 ring-purple-500/30',
    },
];

const ContactTableToolbar = ({
    excludedCount = 0,
    filterExcludedOnly = false,
    setFilterExcludedOnly,
    showContactTags,
    isLoadingTags,
    toggleShowContactTags,
    hasVariables = false,
    quickVarFilter = 'all',
    toggleQuickVarFilter,
    quickFilterStats = { empty: 0, numeric: 0, not_real_name: 0 },
}) => {
    return (
        <div className="px-6 py-2.5 bg-[#0b132b]/90 border-b border-white/5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="text-[11px] font-semibold flex items-center gap-1.5 text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        💡 Segure com o botão esquerdo para arrastar a tabela (horizontal e vertical)
                    </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {excludedCount > 0 && (
                        <button
                            type="button"
                            onClick={() => setFilterExcludedOnly && setFilterExcludedOnly(!filterExcludedOnly)}
                            className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 border shadow-md active:scale-95 cursor-pointer ${
                                filterExcludedOnly
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-950/40 ring-1 ring-amber-500/30'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/10'
                            }`}
                            title="Filtrar e visualizar contatos que coincidiram com o filtro de exclusão"
                        >
                            <span>🚫</span>
                            <span>{filterExcludedOnly ? 'Voltar para Destinatários' : `Ver Excluídos (${excludedCount})`}</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={toggleShowContactTags}
                        disabled={isLoadingTags}
                        className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 border shadow-md active:scale-95 cursor-pointer ${
                            showContactTags
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/10'
                        }`}
                        title="Ver se o contato está cadastrado na aba Contatos e suas etiquetas"
                    >
                        {isLoadingTags ? (
                            <>
                                <span className="w-3 h-3 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></span>
                                <span>Consultando Contatos...</span>
                            </>
                        ) : (
                            <>
                                <span>🏷️</span>
                                <span>{showContactTags ? 'Ocultar Etiquetas Contatos' : 'Ver Etiquetas da Aba Contatos'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {hasVariables && toggleQuickVarFilter && (
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">
                        Filtrar Valores:
                    </span>
                    {QUICK_FILTER_BUTTONS.map((btn) => {
                        const isActive = quickVarFilter === btn.id;
                        const count = quickFilterStats?.[btn.id] ?? 0;
                        return (
                            <button
                                key={btn.id}
                                type="button"
                                onClick={() => toggleQuickVarFilter(btn.id)}
                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer flex items-center gap-1.5 ${
                                    isActive
                                        ? btn.activeClass
                                        : 'bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 border-white/10'
                                }`}
                            >
                                <span>{btn.label}</span>
                                <span className="px-1.5 py-0.2 rounded bg-black/30 text-[9px] font-mono">
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                    {quickVarFilter !== 'all' && (
                        <button
                            type="button"
                            onClick={() => toggleQuickVarFilter('all')}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                            Limpar filtro
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ContactTableToolbar;

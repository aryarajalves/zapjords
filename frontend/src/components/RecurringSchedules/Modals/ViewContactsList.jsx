import React from 'react';
import { FiRotateCcw, FiTrash2, FiMessageSquare, FiCalendar, FiAlertCircle } from 'react-icons/fi';

export const ViewContactsList = ({
    displayedContacts,
    localExclusions,
    onToggleExclusion
}) => {
    if (displayedContacts.length === 0) {
        return (
            <div className="flex-1 overflow-y-auto p-6 space-y-2 premium-scrollbar">
                <div className="text-center py-20 text-slate-500 font-bold uppercase tracking-widest text-xs">
                    Nenhum contato nesta visualização
                </div>
            </div>
        );
    }

    const formatDate = (isoStr) => {
        if (!isoStr) return null;
        try {
            return new Date(isoStr).toLocaleDateString('pt-BR');
        } catch {
            return null;
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-2 premium-scrollbar">
            {displayedContacts.map((contact, i) => {
                const isExcluded = localExclusions.includes(contact.phone);
                const isAudienceMismatch = contact.matchesAudience === false;
                const interactionDate = formatDate(contact.last_interaction_at);
                const createdDate = formatDate(contact.created_at);

                return (
                    <div 
                        key={contact.phone || i} 
                        className={`flex items-center justify-between p-4 border rounded-2xl transition-all ${
                            isExcluded
                                ? 'bg-rose-950/10 border-rose-500/10 opacity-60'
                                : isAudienceMismatch
                                    ? 'bg-amber-950/10 border-amber-500/20 opacity-75'
                                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                    >
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="text-sm font-black text-white">{contact.name}</div>
                                {isExcluded && (
                                    <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded-full font-black text-[9px] uppercase tracking-widest border border-rose-500/20">
                                        Removido Manualmente
                                    </span>
                                )}
                                {isAudienceMismatch && !isExcluded && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full font-black text-[9px] uppercase tracking-widest border border-amber-500/20">
                                        <FiAlertCircle size={10} />
                                        Fora do Filtro Selecionado
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold flex-wrap">
                                <span>{contact.email || '-'}</span>

                                {/* Badge Interação */}
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[9px] font-bold ${
                                    interactionDate
                                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                                        : 'bg-slate-800/50 text-slate-500 border-white/5'
                                }`}>
                                    <FiMessageSquare size={10} className={interactionDate ? 'text-purple-400' : 'text-slate-500'} />
                                    {interactionDate ? `Interagiu: ${interactionDate}` : 'Sem interação'}
                                </span>

                                {/* Badge Criação */}
                                {createdDate && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg border bg-sky-500/10 text-sky-300 border-sky-500/20 text-[9px] font-bold">
                                        <FiCalendar size={10} className="text-sky-400" />
                                        Criado: {createdDate}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className={`font-black text-xs tabular-nums ${isExcluded ? 'text-slate-500 line-through' : 'text-blue-400'}`}>
                                {contact.phone}
                            </div>
                            <button
                                type="button"
                                onClick={() => onToggleExclusion(contact.phone)}
                                className={`p-2 rounded-xl border transition-all cursor-pointer ${isExcluded ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 text-rose-400'}`}
                                title={isExcluded ? "Adicionar de volta ao disparo" : "Remover do disparo"}
                            >
                                {isExcluded ? <FiRotateCcw size={14} /> : <FiTrash2 size={14} />}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

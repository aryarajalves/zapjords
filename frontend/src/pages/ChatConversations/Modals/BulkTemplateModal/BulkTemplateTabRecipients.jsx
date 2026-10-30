import React, { useState, useMemo } from 'react';
import { FiUsers, FiSearch, FiPhone, FiTag, FiRefreshCw, FiCheckCircle, FiFilter, FiUser } from 'react-icons/fi';

export default function BulkTemplateTabRecipients({
    recipients = [],
    loading = false,
    onRefresh,
    selectedCount = 0,
    selectAllPages = false
}) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRecipients = useMemo(() => {
        if (!searchTerm.trim()) return recipients;
        const term = searchTerm.toLowerCase().trim();
        return recipients.filter((r) => {
            const name = (r.name || '').toLowerCase();
            const phone = (r.phone || '').toLowerCase();
            const formatted = (r.formatted_phone || '').toLowerCase();
            return name.includes(term) || phone.includes(term) || formatted.includes(term);
        });
    }, [recipients, searchTerm]);

    const getInitials = (name) => {
        if (!name) return 'WA';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-150">
            {/* Header com resumo e busca */}
            <div className="bg-slate-900/60 rounded-xl p-4 border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
                            <FiUsers size={16} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <span>Destinatários Selecionados</span>
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                                    {recipients.length} {recipients.length === 1 ? 'contato' : 'contatos'}
                                </span>
                            </h4>
                            <p className="text-[11px] text-slate-400">
                                {selectAllPages
                                    ? 'Todas as conversas filtradas na lista receberão o disparo.'
                                    : 'Apenas os contatos marcados nas conversas receberão este disparo.'}
                            </p>
                        </div>
                    </div>

                    {onRefresh && (
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={loading}
                            className="self-start sm:self-auto flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-white/10 transition-colors disabled:opacity-50"
                            title="Atualizar lista de destinatários"
                        >
                            <FiRefreshCw size={12} className={loading ? 'animate-spin text-teal-400' : ''} />
                            <span>Atualizar</span>
                        </button>
                    )}
                </div>

                {/* Barra de busca interna */}
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar destinatário por nome ou telefone..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 transition-colors"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Lista dos destinatários */}
            <div className="space-y-2">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3 bg-slate-900/30 rounded-xl border border-white/5">
                        <FiRefreshCw className="animate-spin text-teal-500" size={24} />
                        <span className="text-xs">Carregando lista de contatos destinatários...</span>
                    </div>
                ) : filteredRecipients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-xl border border-dashed border-white/10 bg-slate-900/30">
                        <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-400 mb-2">
                            <FiSearch size={18} />
                        </div>
                        <p className="text-sm font-semibold text-slate-300">Nenhum destinatário encontrado</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs">
                            {searchTerm
                                ? `Nenhum contato corresponde ao filtro "${searchTerm}".`
                                : 'Nenhum contato com telefone válido foi selecionado para este disparo.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                        {filteredRecipients.map((contact, index) => {
                            const initials = getInitials(contact.name);
                            const phoneDisplay = contact.formatted_phone || contact.phone;

                            return (
                                <div
                                    key={contact.id || contact.conversation_id || index}
                                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 border border-white/5 hover:border-teal-500/20 transition-all duration-150 group"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        {/* Avatar com Iniciais */}
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 text-xs font-bold shrink-0">
                                            {initials}
                                        </div>

                                        {/* Nome e Telefone */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-white truncate block">
                                                    {contact.name || 'Contato sem nome'}
                                                </span>
                                                {contact.has_active_funnel && (
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                                                        Funil Ativo
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                                                <FiPhone size={10} className="text-teal-400 shrink-0" />
                                                <span className="font-mono text-slate-300">{phoneDisplay}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Etiquetas / Badges */}
                                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                                        {contact.labels && contact.labels.length > 0 ? (
                                            <div className="flex items-center gap-1 max-w-[140px] overflow-hidden">
                                                {contact.labels.slice(0, 2).map((label, lIdx) => (
                                                    <span
                                                        key={lIdx}
                                                        className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-white/10 truncate"
                                                        title={label}
                                                    >
                                                        {label}
                                                    </span>
                                                ))}
                                                {contact.labels.length > 2 && (
                                                    <span className="text-[10px] text-slate-500 font-bold">
                                                        +{contact.labels.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-slate-500 italic">Sem etiquetas</span>
                                        )}

                                        <div className="w-5 h-5 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0 ml-1">
                                            <FiCheckCircle size={12} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

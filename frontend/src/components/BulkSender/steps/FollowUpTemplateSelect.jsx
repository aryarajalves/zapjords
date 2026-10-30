import React, { useState, useMemo } from 'react';
import { FiSearch, FiChevronDown, FiX, FiCheck, FiBookmark } from 'react-icons/fi';

export default function FollowUpTemplateSelect({
    selectedTemplateName = '',
    templates = [],
    onSelectTemplate,
    placeholder = 'Selecione o template do follow-up...',
    onOpenChange
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const setOpenState = (open) => {
        setIsOpen(open);
        if (onOpenChange) {
            onOpenChange(open);
        }
    };

    const selectedTemplateObj = useMemo(() => {
        return (templates || []).find(t => t?.name === selectedTemplateName) || null;
    }, [templates, selectedTemplateName]);

    // Filtra templates com base no texto de busca
    const filteredTemplates = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return (templates || []).filter(t => {
            if (!t || !t.name) return false;
            // Se houver status, prioriza APPROVED / ACTIVE
            if (t.status && !['APPROVED', 'ACTIVE'].includes(t.status.toUpperCase())) return false;
            if (!query) return true;

            const nameMatch = t.name.toLowerCase().includes(query);
            const categoryMatch = (t.category || '').toLowerCase().includes(query);
            const langMatch = (t.language || '').toLowerCase().includes(query);
            const tagsMatch = Array.isArray(t.tags) && t.tags.some(tag => String(tag).toLowerCase().includes(query));

            return nameMatch || categoryMatch || langMatch || tagsMatch;
        });
    }, [templates, searchQuery]);

    // Separação em Pinned (Fixados) e Outros, ordenados pelos criados por último (mais recentes primeiro)
    const { pinnedTemplates, otherTemplates } = useMemo(() => {
        const pinned = [];
        const other = [];

        filteredTemplates.forEach(t => {
            if (t.is_pinned) {
                pinned.push(t);
            } else {
                other.push(t);
            }
        });

        const sortRecentFirst = (a, b) => {
            // 1. Mais recentes primeiro por created_at
            if (a.created_at && b.created_at) {
                const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                if (diff !== 0) return diff;
            } else if (a.created_at && !b.created_at) {
                return -1;
            } else if (!a.created_at && b.created_at) {
                return 1;
            }

            // 2. Por ID decrescente (caso ID seja numérico, maiores IDs foram criados por último)
            const numA = Number(a.id);
            const numB = Number(b.id);
            if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
                return numB - numA;
            }

            // 3. Mantém a ordem original da lista
            return 0;
        };

        pinned.sort(sortRecentFirst);
        other.sort(sortRecentFirst);

        return { pinnedTemplates: pinned, otherTemplates: other };
    }, [filteredTemplates]);

    const handleSelect = (tpl) => {
        if (!tpl) {
            onSelectTemplate('', 'pt_BR');
        } else {
            onSelectTemplate(tpl.name, tpl.language || 'pt_BR');
        }
        setOpenState(false);
        setSearchQuery('');
    };

    return (
        <div className="relative w-full">
            {/* Gatilho do Dropdown */}
            <button
                type="button"
                onClick={() => setOpenState(!isOpen)}
                className={`w-full bg-slate-900 border rounded-2xl px-4 py-3 text-left flex items-center justify-between gap-3 transition-all ${
                    isOpen 
                        ? 'border-violet-500 ring-2 ring-violet-500/20' 
                        : 'border-white/10 hover:border-white/20'
                }`}
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    {selectedTemplateObj ? (
                        <>
                            {selectedTemplateObj.is_pinned && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-black shrink-0">
                                    📌 Fixado
                                </span>
                            )}
                            <span className="text-xs font-bold text-white truncate">
                                {selectedTemplateObj.name}
                            </span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-white/5 text-slate-400 shrink-0">
                                {selectedTemplateObj.category || 'MARKETING'}
                            </span>
                        </>
                    ) : (
                        <span className="text-xs font-bold text-slate-500">
                            {placeholder}
                        </span>
                    )}
                </div>

                <FiChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-violet-400' : ''}`}
                />
            </button>

            {/* Menu Dropdown com Busca */}
            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setOpenState(false)} 
                    />
                    <div className="absolute left-0 right-0 top-full mt-2 bg-[#0d1527] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-80 w-full">
                        {/* Campo de Busca */}
                        <div className="p-3 border-b border-white/10 bg-slate-950/90 sticky top-0 z-10 w-full">
                            <div className="relative">
                                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Digitar para filtrar templates..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-white placeholder-slate-500 outline-none focus:border-violet-500"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-0.5"
                                    >
                                        <FiX size={13} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Lista de Resultados */}
                        <div className="overflow-y-auto overflow-x-hidden p-2 space-y-3 w-full custom-scrollbar">
                            {/* Opção para Desmarcar */}
                            <button
                                type="button"
                                onClick={() => handleSelect(null)}
                                className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors italic"
                            >
                                -- Nenhum template (limpar seleção) --
                            </button>

                            {/* Templates Fixados (Destacados na parte de cima) */}
                            {pinnedTemplates.length > 0 && (
                                <div className="space-y-1">
                                    <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                        <span>📌</span>
                                        <span>Templates Fixados ({pinnedTemplates.length})</span>
                                    </div>
                                    <div className="space-y-1 bg-amber-500/5 p-1 rounded-xl border border-amber-500/10">
                                        {pinnedTemplates.map((t) => {
                                            const isSelected = selectedTemplateName === t.name;
                                            return (
                                                <button
                                                    key={t.id || t.name}
                                                    type="button"
                                                    onClick={() => handleSelect(t)}
                                                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between group ${
                                                        isSelected
                                                            ? 'bg-amber-500/20 text-white font-black border border-amber-500/30'
                                                            : 'hover:bg-amber-500/10 text-slate-200'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="text-amber-400 shrink-0">📌</span>
                                                        <span className="text-xs font-bold truncate">
                                                            {t.name}
                                                        </span>
                                                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                                                            {t.category || 'MARKETING'}
                                                        </span>
                                                    </div>
                                                    {isSelected && (
                                                        <FiCheck size={14} className="text-amber-400 shrink-0" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Demais Templates */}
                            {otherTemplates.length > 0 && (
                                <div className="space-y-1">
                                    {pinnedTemplates.length > 0 && (
                                        <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                            Outros Templates ({otherTemplates.length})
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        {otherTemplates.map((t) => {
                                            const isSelected = selectedTemplateName === t.name;
                                            return (
                                                <button
                                                    key={t.id || t.name}
                                                    type="button"
                                                    onClick={() => handleSelect(t)}
                                                    className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between group ${
                                                        isSelected
                                                            ? 'bg-violet-600/20 text-white font-black border border-violet-500/30'
                                                            : 'hover:bg-white/5 text-slate-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="text-xs font-semibold truncate">
                                                            {t.name}
                                                        </span>
                                                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/5 text-slate-400 shrink-0">
                                                            {t.category || 'MARKETING'}
                                                        </span>
                                                    </div>
                                                    {isSelected && (
                                                        <FiCheck size={14} className="text-violet-400 shrink-0" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {pinnedTemplates.length === 0 && otherTemplates.length === 0 && (
                                <div className="py-6 text-center text-xs text-slate-500 italic">
                                    Nenhum template encontrado com &quot;{searchQuery}&quot;
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

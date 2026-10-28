import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FiSearch, FiX, FiCheck, FiChevronDown, FiZap } from 'react-icons/fi';

const normalizeText = (text) =>
    String(text || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

export default function SearchableFunnelSelect({
    value,
    onChange,
    funnels = [],
    placeholder = 'Pesquisar funil por nome ou tag...',
    emptyLabel = 'Nenhum funil (apenas registrar clique)',
    theme = 'violet'
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const selectedFunnel = useMemo(() => {
        if (!value) return null;
        return funnels.find((f) => String(f.id) === String(value)) || null;
    }, [value, funnels]);

    // Fechar ao clicar fora
    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filtra funis pelo texto digitado (nome, id ou tag)
    const filteredFunnels = useMemo(() => {
        const query = normalizeText(searchTerm);
        if (!query) return funnels;
        return funnels.filter((f) => {
            const normName = normalizeText(f.name);
            const normTag = normalizeText(f.tag);
            const strId = String(f.id);
            return normName.includes(query) || normTag.includes(query) || strId.includes(query);
        });
    }, [funnels, searchTerm]);

    // Separação em Pinned (Fixados) e Outros
    const { pinnedFunnels, otherFunnels } = useMemo(() => {
        const pinned = [];
        const other = [];

        filteredFunnels.forEach((f) => {
            if (f.is_pinned) {
                pinned.push(f);
            } else {
                other.push(f);
            }
        });

        return { pinnedFunnels: pinned, otherFunnels: other };
    }, [filteredFunnels]);

    const handleSelect = (funnelId) => {
        onChange(funnelId ? parseInt(funnelId) : null);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange(null);
        setSearchTerm('');
        setIsOpen(true);
        if (inputRef.current) inputRef.current.focus();
    };

    const borderColors = {
        violet: 'border-violet-500/30 focus-within:border-violet-500',
        emerald: 'border-emerald-500/30 focus-within:border-emerald-500',
        rose: 'border-rose-500/30 focus-within:border-rose-500'
    };

    return (
        <div ref={containerRef} className="relative w-full text-xs">
            {/* Gatilho / Seleção Fechada */}
            {!isOpen ? (
                <div
                    onClick={() => {
                        setIsOpen(true);
                        setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border border-white/10 bg-slate-950 text-white cursor-pointer hover:border-white/20 transition group shadow-inner ${
                        selectedFunnel ? 'border-white/15' : ''
                    }`}
                    title="Clique para pesquisar ou trocar de funil"
                >
                    <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                        {selectedFunnel ? (
                            <>
                                <span className="p-1 rounded-lg bg-violet-500/10 text-violet-400 shrink-0">
                                    <FiZap size={13} />
                                </span>
                                {selectedFunnel.is_pinned && (
                                    <span className="text-[10px] text-amber-400 font-bold shrink-0">📌</span>
                                )}
                                <span className="font-bold text-white truncate text-xs">
                                    {selectedFunnel.name}
                                </span>
                                {selectedFunnel.tag && (
                                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 shrink-0 font-bold">
                                        {selectedFunnel.tag}
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className="text-slate-500 text-xs truncate">
                                {emptyLabel || placeholder}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {selectedFunnel && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                                title="Remover funil selecionado"
                            >
                                <FiX size={13} />
                            </button>
                        )}
                        <FiChevronDown size={14} className="text-slate-500 group-hover:text-white transition" />
                    </div>
                </div>
            ) : (
                /* Input de Busca Ativo */
                <div className="relative">
                    <div className={`relative flex items-center bg-slate-950 rounded-xl border ${borderColors[theme] || borderColors.violet}`}>
                        <FiSearch className="absolute left-3 text-slate-400 pointer-events-none" size={13} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={placeholder}
                            className="w-full pl-9 pr-8 py-2.5 bg-transparent text-white placeholder-slate-500 outline-none text-xs font-medium"
                        />
                        {searchTerm ? (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2.5 p-1 text-slate-500 hover:text-white"
                            >
                                <FiX size={13} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="absolute right-2.5 p-1 text-slate-500 hover:text-white"
                            >
                                <FiChevronDown size={14} className="rotate-180" />
                            </button>
                        )}
                    </div>

                    {/* Dropdown com Lista de Funis */}
                    <div className="absolute left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-slate-900 shadow-2xl z-50 p-1.5 space-y-1">
                        {/* Opção Vazia / Limpar */}
                        <button
                            type="button"
                            onClick={() => handleSelect(null)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition ${
                                !value ? 'bg-violet-500/10 text-violet-300 font-bold border border-violet-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white italic'
                            }`}
                        >
                            <span>-- {emptyLabel} --</span>
                            {!value && <FiCheck className="text-violet-400" size={13} />}
                        </button>

                        {/* Funis Fixados */}
                        {pinnedFunnels.length > 0 && (
                            <div className="space-y-1 pt-1">
                                <div className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                                    <span>📌</span>
                                    <span>Fixados ({pinnedFunnels.length})</span>
                                </div>
                                <div className="space-y-0.5 bg-amber-500/5 p-1 rounded-lg border border-amber-500/10">
                                    {pinnedFunnels.map((f) => {
                                        const isSelected = String(f.id) === String(value);
                                        return (
                                            <button
                                                key={f.id}
                                                type="button"
                                                onClick={() => handleSelect(f.id)}
                                                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition ${
                                                    isSelected
                                                        ? 'bg-amber-500/20 text-white font-black border border-amber-500/30'
                                                        : 'hover:bg-amber-500/10 text-slate-200'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 truncate min-w-0">
                                                    <span className="text-amber-400 shrink-0">📌</span>
                                                    <span className="font-bold truncate">{f.name}</span>
                                                    {f.tag && (
                                                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 font-bold">
                                                            {f.tag}
                                                        </span>
                                                    )}
                                                </div>
                                                {isSelected && <FiCheck className="text-amber-400 shrink-0 ml-2" size={13} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Outros Funis */}
                        {otherFunnels.length > 0 && (
                            <div className="space-y-0.5 pt-1">
                                {pinnedFunnels.length > 0 && (
                                    <div className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
                                        Outros Funis ({otherFunnels.length})
                                    </div>
                                )}
                                {otherFunnels.map((f) => {
                                    const isSelected = String(f.id) === String(value);
                                    return (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => handleSelect(f.id)}
                                            className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition ${
                                                isSelected
                                                    ? 'bg-violet-500/20 text-white font-bold border border-violet-500/30'
                                                    : 'hover:bg-white/5 text-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 truncate min-w-0">
                                                <FiZap className="shrink-0 text-slate-500" size={12} />
                                                <span className="truncate">{f.name}</span>
                                                {f.tag && (
                                                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 shrink-0">
                                                        {f.tag}
                                                    </span>
                                                )}
                                            </div>
                                            {isSelected && <FiCheck className="text-violet-400 shrink-0 ml-2" size={13} />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {pinnedFunnels.length === 0 && otherFunnels.length === 0 && (
                            <div className="p-3 text-center text-xs text-slate-500 italic">
                                Nenhum funil encontrado para &quot;{searchTerm}&quot;
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

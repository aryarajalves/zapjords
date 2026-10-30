import React, { useRef, useEffect } from 'react';
import { FiSliders, FiX, FiCheck, FiRotateCcw } from 'react-icons/fi';

const ORDER_OPTIONS = [
    { key: 'recent', label: 'Mais recentes', desc: 'Última msg' },
    { key: 'oldest', label: 'Mais antigas', desc: 'Primeira msg' },
    { key: 'name_asc', label: 'Nome (A → Z)', desc: 'Alfabética' },
    { key: 'name_desc', label: 'Nome (Z → A)', desc: 'Inversa' },
    { key: 'messages_desc', label: 'Mais mensagens', desc: 'Maior volume' },
    { key: 'messages_asc', label: 'Menos mensagens', desc: 'Menor volume' },
    { key: 'unread_desc', label: 'Mais não lidas', desc: 'Não lidas no topo' }
];

export default function ChatOrderFilterPopover({
    isOpen,
    onClose,
    orderBy = 'recent',
    setOrderBy
}) {
    const popoverRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                const isOrderTrigger = e.target.closest('[data-testid="filter-tab-ordem"]');
                if (!isOrderTrigger) {
                    onClose();
                }
            }
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const currentOrder = orderBy || 'recent';
    const isCustomOrder = currentOrder !== 'recent';

    return (
        <div
            ref={popoverRef}
            data-testid="chat-order-filter-popover"
            className="absolute top-full left-2 right-2 mt-1.5 z-50 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-150 text-slate-200"
        >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <FiSliders size={13} />
                    </div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Ordenar Conversas</span>
                        {isCustomOrder && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                Ativo
                            </span>
                        )}
                    </h4>
                </div>

                <div className="flex items-center gap-1.5">
                    {isCustomOrder && (
                        <button
                            type="button"
                            onClick={() => {
                                setOrderBy('recent');
                                onClose();
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-0.5 rounded-md transition cursor-pointer"
                            title="Voltar para a ordenação padrão (Mais recentes)"
                        >
                            <FiRotateCcw size={11} />
                            <span>Padrão</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                        title="Fechar painel de ordenação"
                        aria-label="Fechar"
                    >
                        <FiX size={15} />
                    </button>
                </div>
            </div>

            {/* Opções de Ordenação */}
            <div className="grid grid-cols-2 gap-1.5">
                {ORDER_OPTIONS.map((opt) => {
                    const active = currentOrder === opt.key;
                    return (
                        <button
                            key={opt.key}
                            type="button"
                            data-testid={`order-option-${opt.key}`}
                            onClick={() => {
                                setOrderBy(opt.key);
                                onClose();
                            }}
                            className={`flex items-center justify-between px-2.5 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                                active
                                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm font-bold'
                                    : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-300 hover:text-white'
                            }`}
                        >
                            <div className="min-w-0 pr-1">
                                <div className="text-[11px] font-semibold tracking-tight truncate">
                                    {opt.label}
                                </div>
                                <div className="text-[9px] text-slate-400 font-normal truncate">
                                    {opt.desc}
                                </div>
                            </div>
                            <span
                                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[9px] transition-all shrink-0 ${
                                    active
                                        ? 'bg-blue-500 border-blue-400 text-white'
                                        : 'border-white/20 bg-slate-800'
                                }`}
                            >
                                {active && <FiCheck size={10} />}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

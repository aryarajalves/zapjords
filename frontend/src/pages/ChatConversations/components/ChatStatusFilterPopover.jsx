import React, { useRef, useEffect } from 'react';
import {
    FiRefreshCw,
    FiX,
    FiCheck,
    FiMessageSquare,
    FiZap,
    FiColumns,
    FiRotateCcw
} from 'react-icons/fi';
import PipelineFilterControl from './PipelineFilterControl';

export default function ChatStatusFilterPopover({
    isOpen,
    onClose,
    filterWindowOpen,
    setFilterWindowOpen,
    filterTemplate24h,
    setFilterTemplate24h,
    filterUnread,
    setFilterUnread,
    filterHasNote,
    setFilterHasNote,
    filterUrgent,
    setFilterUrgent,
    filterHasReplied,
    setFilterHasReplied,
    filterHasActiveFunnel,
    setFilterHasActiveFunnel,
    filterLastMessageRead,
    setFilterLastMessageRead,
    filterLastMessageUnread,
    setFilterLastMessageUnread,
    filterNoPipeline,
    setFilterNoPipeline,
    filterNotInPipelineId,
    setFilterNotInPipelineId,
    filterInPipeline,
    setFilterInPipeline,
    filterPipelineId,
    setFilterPipelineId,
    filterPipelineStageId,
    setFilterPipelineStageId,
    pipelines = []
}) {
    const popoverRef = useRef(null);

    // Fecha ao clicar fora do popover
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                // Não fechar se o clique foi no botão de acionamento do Status
                const isStatusTrigger = e.target.closest('[data-testid="filter-tab-status"]');
                if (!isStatusTrigger) {
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

    // Itens ativos
    const activeCount = [
        filterWindowOpen,
        filterTemplate24h,
        filterUnread,
        filterHasNote,
        filterUrgent,
        filterHasReplied,
        filterHasActiveFunnel,
        filterLastMessageRead,
        filterLastMessageUnread,
        filterNoPipeline,
        !!filterNotInPipelineId,
        filterInPipeline,
        !!filterPipelineId,
        !!filterPipelineStageId
    ].filter(Boolean).length;

    const handleClearAll = () => {
        setFilterWindowOpen(false);
        setFilterTemplate24h(false);
        setFilterUnread(false);
        setFilterHasNote(false);
        setFilterUrgent(false);
        setFilterHasReplied(false);
        setFilterHasActiveFunnel(false);
        setFilterLastMessageRead(false);
        setFilterLastMessageUnread(false);
        setFilterNoPipeline(false);
        if (setFilterNotInPipelineId) setFilterNotInPipelineId(null);
        if (setFilterInPipeline) setFilterInPipeline(false);
        if (setFilterPipelineId) setFilterPipelineId(null);
        if (setFilterPipelineStageId) setFilterPipelineStageId(null);
    };

    return (
        <div
            ref={popoverRef}
            data-testid="chat-status-filter-popover"
            className="absolute top-full left-2 right-2 mt-1.5 z-50 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-150 text-slate-200"
            style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <FiRefreshCw size={13} />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>Filtros de Status</span>
                            {activeCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    {activeCount} ativo{activeCount > 1 ? 's' : ''}
                                </span>
                            )}
                        </h4>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    {activeCount > 0 && (
                        <button
                            type="button"
                            onClick={handleClearAll}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-0.5 rounded-md transition cursor-pointer"
                            title="Limpar todos os filtros de status"
                        >
                            <FiRotateCcw size={11} />
                            <span>Limpar</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                        title="Fechar painel de filtros"
                        aria-label="Fechar"
                    >
                        <FiX size={15} />
                    </button>
                </div>
            </div>

            {/* Grupo 1: Mensagens & Leitura */}
            <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FiMessageSquare size={11} className="text-blue-400" />
                    <span>Mensagens & Leitura</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                    <FilterCheckboxItem
                        label="Não lidas"
                        active={filterUnread}
                        onClick={() => setFilterUnread(!filterUnread)}
                        activeColor="emerald"
                    />
                    <FilterCheckboxItem
                        label="Respondeu"
                        active={filterHasReplied}
                        onClick={() => setFilterHasReplied(!filterHasReplied)}
                        activeColor="purple"
                    />
                    <FilterCheckboxItem
                        label="Viu última msg"
                        active={filterLastMessageRead}
                        onClick={() => {
                            setFilterLastMessageRead(!filterLastMessageRead);
                            if (!filterLastMessageRead) setFilterLastMessageUnread(false);
                        }}
                        activeColor="sky"
                    />
                    <FilterCheckboxItem
                        label="Não viu última msg"
                        active={filterLastMessageUnread}
                        onClick={() => {
                            setFilterLastMessageUnread(!filterLastMessageUnread);
                            if (!filterLastMessageUnread) setFilterLastMessageRead(false);
                        }}
                        activeColor="amber"
                    />
                </div>
            </div>

            {/* Grupo 2: Atendimento & Automação */}
            <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FiZap size={11} className="text-amber-400" />
                    <span>Atendimento & Automação</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                    <FilterCheckboxItem
                        label="Janela 24h"
                        active={filterWindowOpen}
                        onClick={() => setFilterWindowOpen(!filterWindowOpen)}
                        activeColor="green"
                    />
                    <FilterCheckboxItem
                        label="Template 24h"
                        active={filterTemplate24h}
                        onClick={() => setFilterTemplate24h(!filterTemplate24h)}
                        activeColor="amber"
                    />
                    <FilterCheckboxItem
                        label="Funil Ativo"
                        active={filterHasActiveFunnel}
                        onClick={() => setFilterHasActiveFunnel(!filterHasActiveFunnel)}
                        activeColor="cyan"
                    />
                    <FilterCheckboxItem
                        label="Urgentes"
                        active={filterUrgent}
                        onClick={() => setFilterUrgent(!filterUrgent)}
                        activeColor="rose"
                    />
                    <FilterCheckboxItem
                        label="Com Anotações"
                        active={filterHasNote}
                        onClick={() => setFilterHasNote(!filterHasNote)}
                        activeColor="blue"
                        className="col-span-2"
                    />
                </div>
            </div>

            {/* Grupo 3: CRM Kanban */}
            <div className="space-y-1.5 pt-1 border-t border-white/5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FiColumns size={11} className="text-indigo-400" />
                    <span>CRM Kanban de Vendas</span>
                </div>
                <div className="pt-0.5">
                    <PipelineFilterControl
                        filterNoPipeline={filterNoPipeline}
                        setFilterNoPipeline={setFilterNoPipeline}
                        filterNotInPipelineId={filterNotInPipelineId}
                        setFilterNotInPipelineId={setFilterNotInPipelineId}
                        filterInPipeline={filterInPipeline}
                        setFilterInPipeline={setFilterInPipeline}
                        filterPipelineId={filterPipelineId}
                        setFilterPipelineId={setFilterPipelineId}
                        filterPipelineStageId={filterPipelineStageId}
                        setFilterPipelineStageId={setFilterPipelineStageId}
                        pipelines={pipelines}
                    />
                </div>
            </div>

            {/* Rodapé de Ação */}
            <div className="pt-2 border-t border-white/10">
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-blue-900/30 cursor-pointer"
                >
                    <FiCheck size={14} />
                    <span>Concluir {activeCount > 0 ? `(${activeCount} ativo${activeCount > 1 ? 's' : ''})` : ''}</span>
                </button>
            </div>
        </div>
    );
}

function FilterCheckboxItem({ label, active, onClick, activeColor = 'blue', className = '' }) {
    const colorClasses = {
        blue: active ? 'bg-blue-500/20 text-blue-300 border-blue-500/50' : '',
        emerald: active ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : '',
        green: active ? 'bg-green-500/20 text-green-300 border-green-500/50' : '',
        amber: active ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : '',
        purple: active ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' : '',
        cyan: active ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : '',
        rose: active ? 'bg-rose-500/20 text-rose-300 border-rose-500/50' : '',
        sky: active ? 'bg-sky-500/20 text-sky-300 border-sky-500/50' : ''
    };

    const activeStyle = colorClasses[activeColor] || colorClasses.blue;

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                active
                    ? `${activeStyle} shadow-sm font-bold`
                    : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-400 hover:text-slate-200'
            } ${className}`}
        >
            <span className="truncate">{label}</span>
            <span
                className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] transition-all ml-1 shrink-0 ${
                    active
                        ? 'bg-blue-500 border-blue-400 text-white'
                        : 'border-white/20 bg-slate-800'
                }`}
            >
                {active && <FiCheck size={10} />}
            </span>
        </button>
    );
}

import React from 'react';
import { FiTag, FiZap, FiColumns, FiSlash, FiCheckCircle, FiArchive, FiRefreshCw, FiSend } from 'react-icons/fi';
import { BsStars } from 'react-icons/bs';

export default function ChatBulkActionsBar({
    visibleConversations = [],
    selectAllPages = false,
    setSelectAllPages,
    excludedConvoIds = [],
    setExcludedConvoIds,
    totalSelectedCount = 0,
    engine,
    setIsBulkTagModalOpen,
    setIsBulkPipelineModalOpen,
    setIsBulkTemplateModalOpen,
    filterBlockStatus,
    handleBulkUnblock,
    statusFilter,
    selectedLabelFilter,
    activeTab,
    searchQuery,
    filterHasNote,
    filterStartDate,
    filterEndDate,
    filterUnread,
    filterWindowOpen,
    filterHasReplied,
    isOpenAiConfigured,
    handleAnalyzeBulkChatsDoubts,
    isAnalyzingAi
}) {
    const selectedCount = selectAllPages ? totalSelectedCount : (engine?.selectedConvoIds?.length || 0);
    const hasSelection = selectedCount > 0;

    const handleSelectAllCheckboxToggle = () => {
        const allIds = visibleConversations.map(c => c.id);
        if (selectAllPages) {
            const allExcluded = allIds.every(id => excludedConvoIds.includes(id));
            if (!allExcluded) {
                setExcludedConvoIds(prev => [...new Set([...prev, ...allIds])]);
            } else {
                setExcludedConvoIds(prev => prev.filter(id => !allIds.includes(id)));
            }
        } else {
            const allSelected = allIds.every(id => engine?.selectedConvoIds?.includes(id));
            if (allSelected) {
                engine?.setSelectedConvoIds(prev => prev.filter(id => !allIds.includes(id)));
                setSelectAllPages(false);
            } else {
                engine?.setSelectedConvoIds(prev => [...new Set([...prev, ...allIds])]);
            }
        }
    };

    const handleArchiveClick = async () => {
        const willArchive = statusFilter !== 'archived';
        const inc = selectedLabelFilter?.include_labels || (selectedLabelFilter?.items?.filter(i => i.mode === 'has').map(i => i.name)) || [];
        const exc = selectedLabelFilter?.exclude_labels || (selectedLabelFilter?.items?.filter(i => i.mode === 'has_not').map(i => i.name)) || [];

        const labelPayload = typeof selectedLabelFilter === 'string'
            ? { label: selectedLabelFilter || undefined }
            : (inc.length > 0 || exc.length > 0 ? {
                include_labels: inc.length > 0 ? inc : undefined,
                exclude_labels: exc.length > 0 ? exc : undefined,
                label_op: selectedLabelFilter?.op || 'or'
            } : (selectedLabelFilter?.labels?.length > 0 ? {
                labels: selectedLabelFilter.labels,
                label_mode: selectedLabelFilter.mode || 'has',
                label_op: selectedLabelFilter.op || 'or'
            } : {}));

        const payloadExtra = selectAllPages ? {
            select_all_pages: true,
            excluded_ids: excludedConvoIds.length > 0 ? excludedConvoIds : undefined,
            tab: activeTab,
            status: statusFilter,
            search: searchQuery || undefined,
            ...labelPayload,
            block_status: filterBlockStatus || undefined,
            has_note: filterHasNote || undefined,
            start_date: filterStartDate || undefined,
            end_date: filterEndDate || undefined,
            unread_only: filterUnread || undefined,
            window_open_only: filterWindowOpen || undefined,
            has_replied: filterHasReplied || undefined
        } : {
            ids: engine?.selectedConvoIds || []
        };

        if (engine?.handleBulkArchive) {
            await engine.handleBulkArchive(willArchive, payloadExtra);
        }
        if (selectAllPages) {
            engine?.setSelectedConvoIds([]);
            setSelectAllPages(false);
            if (setExcludedConvoIds) setExcludedConvoIds([]);
        }
    };

    return (
        <>
            {/* Barra superior de seleção e botões de lote */}
            <div className="px-4 py-2 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center justify-between">
                    <button
                        onClick={handleSelectAllCheckboxToggle}
                        className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 font-medium transition-colors cursor-pointer shrink-0"
                    >
                        <input
                            type="checkbox"
                            readOnly
                            checked={visibleConversations.length > 0 && (
                                selectAllPages
                                    ? visibleConversations.every(c => !excludedConvoIds.includes(c.id))
                                    : visibleConversations.every(c => engine?.selectedConvoIds?.includes(c.id))
                            )}
                            className="rounded border-gray-300 text-blue-600 pointer-events-none cursor-pointer"
                        />
                        <span>Selecionar todas</span>
                    </button>

                    {hasSelection && (
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/20 shrink-0">
                            {selectAllPages ? `${totalSelectedCount} selecionados` : `${engine?.selectedConvoIds?.length || 0} selecionado(s)`}
                        </span>
                    )}
                </div>

                {hasSelection && (
                    <div className="flex items-center gap-1 mt-2 overflow-x-auto no-scrollbar py-0.5">
                        {/* Botão NOVO: Disparo Template */}
                        <button
                            id="bulk-template-btn"
                            onClick={() => setIsBulkTemplateModalOpen && setIsBulkTemplateModalOpen(true)}
                            className="flex items-center gap-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 px-2 py-1.5 rounded-lg text-xs font-semibold transition border border-teal-500/20 shrink-0 whitespace-nowrap cursor-pointer shadow-sm"
                            title="Disparar template da Meta para conversas selecionadas"
                        >
                            <FiSend size={13} />
                            <span>Disparo Template</span>
                        </button>

                        <button
                            id="bulk-tag-btn"
                            onClick={() => setIsBulkTagModalOpen(true)}
                            className="flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-1.5 rounded-lg text-xs font-semibold transition border border-blue-500/20 shrink-0 whitespace-nowrap cursor-pointer shadow-sm"
                            title="Etiquetar conversas selecionadas"
                        >
                            <FiTag size={13} />
                            <span>Etiquetar</span>
                        </button>

                        <button
                            id="bulk-funnel-btn"
                            onClick={() => engine?.setIsBulkFunnelModalOpen(true)}
                            className="flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-1.5 rounded-lg text-xs font-semibold transition border border-indigo-500/20 shrink-0 whitespace-nowrap cursor-pointer shadow-sm"
                            title="Disparar funil para conversas selecionadas"
                        >
                            <FiZap size={13} />
                            <span>Funil</span>
                        </button>

                        <button
                            id="bulk-pipeline-btn"
                            onClick={() => setIsBulkPipelineModalOpen && setIsBulkPipelineModalOpen(true)}
                            className="flex items-center gap-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-1.5 rounded-lg text-xs font-semibold transition border border-purple-500/20 shrink-0 whitespace-nowrap cursor-pointer shadow-sm"
                            title="Adicionar conversas selecionadas a uma pipeline do Kanban"
                        >
                            <FiColumns size={13} />
                            <span>Pipeline</span>
                        </button>

                        {filterBlockStatus === 'blocked' || filterBlockStatus === 'resting' ? (
                            <button
                                id="bulk-unblock-btn"
                                onClick={() => handleBulkUnblock && handleBulkUnblock()}
                                className="flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-1.5 rounded-lg text-xs font-semibold transition border border-emerald-500/20 shrink-0 whitespace-nowrap cursor-pointer shadow-sm"
                                title="Desbloquear conversas selecionadas"
                            >
                                <FiCheckCircle size={13} />
                                <span>Desbloquear</span>
                            </button>
                        ) : (
                            <button
                                id="bulk-block-btn"
                                onClick={() => {
                                    if (engine?.setBlockModalMode) engine.setBlockModalMode('bulk');
                                    engine?.setIsBlockModalOpen(true);
                                }}
                                className="flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-2 py-1.5 rounded-lg text-xs font-semibold transition border border-rose-500/20 shrink-0 whitespace-nowrap cursor-pointer shadow-sm"
                                title="Bloquear conversas selecionadas"
                            >
                                <FiSlash size={13} />
                                <span>Bloquear</span>
                            </button>
                        )}

                        <button
                            id="bulk-archive-btn"
                            onClick={handleArchiveClick}
                            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition border shrink-0 whitespace-nowrap cursor-pointer shadow-sm ${
                                statusFilter === 'archived'
                                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            }`}
                            title={statusFilter === 'archived' ? "Desarquivar conversas selecionadas" : "Arquivar conversas selecionadas"}
                        >
                            <FiArchive size={13} />
                            <span>{statusFilter === 'archived' ? 'Desarquivar' : 'Arquivar'}</span>
                        </button>

                        <button
                            id="bulk-delete-btn"
                            onClick={() => engine?.setConfirmDeleteConvos('bulk')}
                            className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-1.5 rounded-lg text-xs font-semibold transition border border-red-500/20 shrink-0 whitespace-nowrap cursor-pointer shadow-sm"
                            title="Deletar conversas selecionadas"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Deletar</span>
                        </button>

                        {isOpenAiConfigured && (
                            <button
                                id="bulk-ai-doubts-btn"
                                onClick={handleAnalyzeBulkChatsDoubts}
                                disabled={isAnalyzingAi}
                                className="flex items-center gap-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 px-2 py-1.5 rounded-lg text-xs font-semibold transition border border-purple-500/20 shrink-0 whitespace-nowrap cursor-pointer shadow-sm disabled:opacity-50"
                                title="Analisar dúvidas não respondidas das conversas selecionadas com IA"
                            >
                                {isAnalyzingAi ? <FiRefreshCw className="animate-spin" size={13} /> : <BsStars size={13} />}
                                <span>Dúvidas IA</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Banner de seleção de todas as páginas */}
            {visibleConversations.length > 0 && (
                (selectAllPages && totalSelectedCount > 0) ||
                visibleConversations.every(c => engine?.selectedConvoIds?.includes(c.id))
            ) && (engine?.totalConvos || 0) > visibleConversations.length && (
                <div className="px-4 py-2 border-b border-blue-500/20 bg-blue-500/10 dark:bg-blue-500/5 text-xs text-gray-700 dark:text-gray-300 flex items-center justify-between shrink-0">
                    {selectAllPages ? (
                        <span>
                            {excludedConvoIds.length > 0 ? (
                                <>Todos os contatos de todas as páginas estão selecionados (<strong>{totalSelectedCount}</strong> contatos, <strong>{excludedConvoIds.length}</strong> desmarcado{excludedConvoIds.length > 1 ? 's' : ''}).</>
                            ) : (
                                <>Todos os <strong>{engine?.totalConvos}</strong> contatos de todas as páginas estão selecionados.</>
                            )}
                        </span>
                    ) : (
                        <span>Todos os <strong>{visibleConversations.length}</strong> contatos desta página estão selecionados.</span>
                    )}
                    <button
                        onClick={() => {
                            if (selectAllPages) {
                                engine?.setSelectedConvoIds([]);
                                setSelectAllPages(false);
                                if (setExcludedConvoIds) setExcludedConvoIds([]);
                            } else {
                                setSelectAllPages(true);
                                if (setExcludedConvoIds) setExcludedConvoIds([]);
                            }
                        }}
                        className="text-blue-500 hover:text-blue-600 font-semibold transition cursor-pointer"
                    >
                        {selectAllPages ? `Deselecionar todos os ${engine?.totalConvos} contatos` : `Selecionar todos os ${engine?.totalConvos} contatos`}
                    </button>
                </div>
            )}
        </>
    );
}

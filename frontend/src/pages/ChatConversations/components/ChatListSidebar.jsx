import React, { useState } from 'react';
import ChatListFilters from './ChatListFilters';
import ChatListItem from './ChatListItem';
import ChatBulkActionsBar from './ChatBulkActionsBar';

export default function ChatListSidebar({
    activeTab,
    setActiveTab,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    selectedLabelFilter,
    setSelectedLabelFilter,
    activeFilterTab,
    setActiveFilterTab,
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
    filterBlockStatus,
    setFilterBlockStatus,
    filterStartDate,
    setFilterStartDate,
    filterEndDate,
    setFilterEndDate,
    orderBy,
    setOrderBy,
    engine,
    selectedConvo,
    setSelectedConvo,
    selectAllPages,
    setSelectAllPages,
    excludedConvoIds = [],
    setExcludedConvoIds,
    setIsBulkTagModalOpen,
    setIsBulkPipelineModalOpen,
    setIsBulkTemplateModalOpen,
    handleBulkUnblock,
    isOpenAiConfigured,
    isAnalyzingAi,
    handleAnalyzeBulkChatsDoubts,
    formatTime
}) {
    const [isLabelFilterOpen, setIsLabelFilterOpen] = useState(false);
    const visibleConversations = engine.conversations;
    const totalSelectedCount = selectAllPages
        ? Math.max(0, engine.totalConvos - excludedConvoIds.length)
        : engine.selectedConvoIds.length;

    return (
        <div className="w-full md:w-96 border-r border-gray-200 dark:border-white/5 flex flex-col h-full bg-gray-50/50 dark:bg-[#111827]/40 shrink-0">
            <ChatListFilters
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedLabelFilter={selectedLabelFilter}
                setSelectedLabelFilter={setSelectedLabelFilter}
                onLabelDropdownOpenChange={setIsLabelFilterOpen}
                availableLabels={engine.availableLabels}
                availableLabelsDetails={engine.availableLabelsDetails}
                getLabelColor={engine.getLabelColor}
                activeFilterTab={activeFilterTab}
                setActiveFilterTab={setActiveFilterTab}
                filterWindowOpen={filterWindowOpen}
                setFilterWindowOpen={setFilterWindowOpen}
                filterTemplate24h={filterTemplate24h}
                setFilterTemplate24h={setFilterTemplate24h}
                filterUnread={filterUnread}
                setFilterUnread={setFilterUnread}
                filterHasNote={filterHasNote}
                setFilterHasNote={setFilterHasNote}
                filterUrgent={filterUrgent}
                setFilterUrgent={setFilterUrgent}
                filterHasReplied={filterHasReplied}
                setFilterHasReplied={setFilterHasReplied}
                filterHasActiveFunnel={filterHasActiveFunnel}
                setFilterHasActiveFunnel={setFilterHasActiveFunnel}
                filterLastMessageRead={filterLastMessageRead}
                setFilterLastMessageRead={setFilterLastMessageRead}
                filterLastMessageUnread={filterLastMessageUnread}
                setFilterLastMessageUnread={setFilterLastMessageUnread}
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
                pipelines={engine.pipelines}
                filterBlockStatus={filterBlockStatus}
                setFilterBlockStatus={setFilterBlockStatus}
                filterStartDate={filterStartDate}
                setFilterStartDate={setFilterStartDate}
                filterEndDate={filterEndDate}
                setFilterEndDate={setFilterEndDate}
                orderBy={orderBy}
                setOrderBy={setOrderBy}
                visibleCount={visibleConversations.length}
            />

            {/* Barra de seleção e ações em massa */}
            {visibleConversations.length > 0 && (
                <ChatBulkActionsBar
                    visibleConversations={visibleConversations}
                    selectAllPages={selectAllPages}
                    setSelectAllPages={setSelectAllPages}
                    excludedConvoIds={excludedConvoIds}
                    setExcludedConvoIds={setExcludedConvoIds}
                    totalSelectedCount={totalSelectedCount}
                    engine={engine}
                    setIsBulkTagModalOpen={setIsBulkTagModalOpen}
                    setIsBulkPipelineModalOpen={setIsBulkPipelineModalOpen}
                    setIsBulkTemplateModalOpen={setIsBulkTemplateModalOpen}
                    filterBlockStatus={filterBlockStatus}
                    handleBulkUnblock={handleBulkUnblock}
                    statusFilter={statusFilter}
                    selectedLabelFilter={selectedLabelFilter}
                    activeTab={activeTab}
                    searchQuery={searchQuery}
                    filterHasNote={filterHasNote}
                    filterStartDate={filterStartDate}
                    filterEndDate={filterEndDate}
                    filterUnread={filterUnread}
                    filterWindowOpen={filterWindowOpen}
                    filterHasReplied={filterHasReplied}
                    isOpenAiConfigured={isOpenAiConfigured}
                    handleAnalyzeBulkChatsDoubts={handleAnalyzeBulkChatsDoubts}
                    isAnalyzingAi={isAnalyzingAi}
                />
            )}

            {/* Lista com scroll - quando o filtro de marcadores estiver aberto, o scroll é ocultado e desativado */}
            <div
                id="chat-conversations-list-scroll-container"
                className={`relative flex-1 divide-y divide-gray-100 dark:divide-white/5 ${
                    isLabelFilterOpen
                        ? 'overflow-hidden pointer-events-none select-none'
                        : 'overflow-y-auto custom-scrollbar'
                }`}
            >
                {engine.isLoadingConvos && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-3 transition-opacity">
                        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-semibold text-white bg-slate-800/90 px-3.5 py-1.5 rounded-xl border border-slate-700/60 shadow-xl">
                            Filtrando conversas...
                        </span>
                    </div>
                )}
                {visibleConversations.map(convo => {
                    const isSelected = selectedConvo?.id === convo.id;
                    const isChecked = selectAllPages
                        ? !excludedConvoIds.includes(convo.id)
                        : engine.selectedConvoIds.includes(convo.id);

                    return (
                        <ChatListItem
                            key={convo.id}
                            convo={convo}
                            isSelected={isSelected}
                            isChecked={isChecked}
                            onSelect={() => setSelectedConvo(convo)}
                            onToggleCheck={(e) => {
                                e.stopPropagation();
                                if (selectAllPages) {
                                    if (isChecked) {
                                        setExcludedConvoIds(prev => [...new Set([...prev, convo.id])]);
                                    } else {
                                        setExcludedConvoIds(prev => prev.filter(id => id !== convo.id));
                                    }
                                } else {
                                    engine.setSelectedConvoIds(prev => isChecked ? prev.filter(id => id !== convo.id) : [...prev, convo.id]);
                                }
                            }}
                            onDelete={(id) => {
                                engine.setDeletingConvoId(id);
                                engine.setConfirmDeleteConvos('single');
                            }}
                            onArchive={(id, willArchive) => engine.handleToggleArchive(id, willArchive)}
                            onTag={(c) => {
                                engine.setSelectedConvoIds([c.id]);
                                setIsBulkTagModalOpen(true);
                            }}
                            getLabelColor={engine.getLabelColor}
                            formatTime={formatTime}
                        />
                    );
                })}
            </div>

            {/* Paginação */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-black/10 text-xs text-gray-500 dark:text-gray-400 shrink-0 select-none">
                <div className="flex items-center gap-1.5">
                    <span>Exibir:</span>
                    <select
                        value={engine.limit}
                        onChange={(e) => {
                            engine.setLimit(Number(e.target.value));
                            engine.setPage(1);
                        }}
                        className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded px-1.5 py-0.5 text-xs text-gray-700 dark:text-gray-200 outline-none focus:border-blue-500"
                    >
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                    </select>
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        disabled={engine.page <= 1}
                        onClick={() => engine.setPage(prev => Math.max(prev - 1, 1))}
                        className="p-1.5 rounded-lg border border-gray-300 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-white/5 transition"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    
                    <span className="font-medium">
                        {engine.page} / {Math.ceil(engine.totalConvos / engine.limit) || 1}
                    </span>
                    
                    <button
                        disabled={engine.page >= Math.ceil(engine.totalConvos / engine.limit)}
                        onClick={() => engine.setPage(prev => prev + 1)}
                        className="p-1.5 rounded-lg border border-gray-300 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-white/5 transition"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

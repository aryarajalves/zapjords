import React, { useState, useRef } from 'react';
import { FiMessageSquare, FiUploadCloud } from 'react-icons/fi';
import { useAuth } from '../AuthContext';
import { useClient } from '../contexts/ClientContext';
import { getFirstName } from '../utils/nameFormatter';

// Componentes da Interface
import ChatHeaderNav from './ChatConversations/components/ChatHeaderNav';
import ChatListSidebar from './ChatConversations/components/ChatListSidebar';
import ActiveChatHeader from './ChatConversations/components/ActiveChatHeader';
import ActiveChatBanner from './ChatConversations/components/ActiveChatBanner';
import FollowUpChatBanner from './ChatConversations/components/FollowUpChatBanner';
import ChatMessageList from './ChatConversations/components/ChatMessageList';
import ActiveChatInput from './ChatConversations/components/ActiveChatInput';
import ChatContactSidebar from './ChatConversations/ChatContactSidebar';
import ChatModals from './ChatConversations/components/ChatModals';

import { useChatEngine } from './ChatConversations/useChatEngine';
import { useChatMediaUploader } from './ChatConversations/hooks/useChatMediaUploader';
import { useChatNoteAndAi } from './ChatConversations/hooks/useChatNoteAndAi';
import { useChatOperations } from './ChatConversations/hooks/useChatOperations';
import { useChatFilterState } from './ChatConversations/hooks/useChatFilterState';
import { useChatMessageScroller } from './ChatConversations/hooks/useChatMessageScroller';
import { useChatModalState } from './ChatConversations/hooks/useChatModalState';
import { useChatEffects } from './ChatConversations/hooks/useChatEffects';
import { resolveMediaUrl } from './ChatConversations/utils/mediaUrlResolver';
import { formatTime, formatMessageTimestamp } from './ChatConversations/utils/chatDateUtils';

export default function ChatConversations({ onClose, onNavigate }) {
    const { activeClient } = useClient();
    const { user } = useAuth();
    const chatInputRef = useRef(null);

    // 1. Estado de filtros e paginação
    const filterState = useChatFilterState();
    const {
        selectedConvo, setSelectedConvo,
        activeTab, setActiveTab,
        statusFilter, setStatusFilter,
        searchQuery, setSearchQuery,
        selectedLabelFilter, setSelectedLabelFilter,
        filterWindowOpen, setFilterWindowOpen,
        filterTemplate24h, setFilterTemplate24h,
        filterUnread, setFilterUnread,
        filterHasNote, setFilterHasNote,
        filterUrgent, setFilterUrgent,
        filterHasReplied, setFilterHasReplied,
        filterHasActiveFunnel, setFilterHasActiveFunnel,
        filterLastMessageRead, setFilterLastMessageRead,
        filterLastMessageUnread, setFilterLastMessageUnread,
        filterNoPipeline, setFilterNoPipeline,
        filterNotInPipelineId, setFilterNotInPipelineId,
        filterInPipeline, setFilterInPipeline,
        filterPipelineId, setFilterPipelineId,
        filterPipelineStageId, setFilterPipelineStageId,
        filterBlockStatus, setFilterBlockStatus,
        filterStartDate, setFilterStartDate,
        filterEndDate, setFilterEndDate,
        orderBy, setOrderBy,
        activeFilterTab, setActiveFilterTab,
        selectAllPages, setSelectAllPages,
        excludedConvoIds, setExcludedConvoIds
    } = filterState;

    // 2. Modais e estados visuais auxiliares
    const modalState = useChatModalState();
    const {
        showRightSidebar, setShowRightSidebar,
        showTemplateModal, setShowTemplateModal,
        isMaximizedInputOpen, setIsMaximizedInputOpen,
        showFunnelModal, setShowFunnelModal,
        replyingTo, setReplyingTo,
        isCancelFunnelModalOpen, setIsCancelFunnelModalOpen,
        isCancelingFunnel, setIsCancelingFunnel,
        isSearchMode, setIsSearchMode,
        isChatMaximized, setIsChatMaximized,
        highlightedMsgId, setHighlightedMsgId,
        exportModal, setExportModal,
        handleExportConversation
    } = modalState;

    const [isCrmModalOpen, setIsCrmModalOpen] = useState(false);
    const [isBulkPipelineModalOpen, setIsBulkPipelineModalOpen] = useState(false);
    const [isBulkTemplateModalOpen, setIsBulkTemplateModalOpen] = useState(false);

    const filterParams = {
        tab: activeTab,
        status: statusFilter,
        search: searchQuery || undefined,
        ...(typeof selectedLabelFilter === 'string' ? { label: selectedLabelFilter || undefined } : {}),
        block_status: filterBlockStatus || undefined,
        has_note: filterHasNote || undefined,
        start_date: filterStartDate || undefined,
        end_date: filterEndDate || undefined,
        unread_only: filterUnread || undefined,
        window_open_only: filterWindowOpen || undefined,
        template_sent_24h_only: filterTemplate24h || undefined,
        urgent_only: filterUrgent || undefined,
        has_replied: filterHasReplied || undefined,
        has_active_funnel: filterHasActiveFunnel || undefined,
        last_message_read_only: filterLastMessageRead || undefined,
        last_message_unread_only: filterLastMessageUnread || undefined,
        no_pipeline: filterNoPipeline || undefined,
        not_in_pipeline_id: filterNotInPipelineId || undefined,
        in_pipeline: filterInPipeline || undefined,
        pipeline_id: filterPipelineId || undefined,
        pipeline_stage_id: filterPipelineStageId || undefined,
        order_by: orderBy || undefined
    };

    // 3. Engine de dados e hooks especializados
    const engine = useChatEngine({
        activeClient, activeTab, statusFilter, searchQuery, selectedLabelFilter,
        filterBlockStatus, filterHasNote, filterStartDate, filterEndDate, filterUnread,
        filterWindowOpen, filterTemplate24h, filterUrgent, filterHasReplied, filterHasActiveFunnel,
        filterLastMessageRead, filterLastMessageUnread,
        filterNoPipeline, filterNotInPipelineId,
        filterInPipeline, filterPipelineId, filterPipelineStageId,
        orderBy, selectedConvo, setSelectedConvo
    });

    const mediaUploader = useChatMediaUploader({ engine, selectedConvo, activeClient, replyingTo, setReplyingTo });
    const noteAndAi = useChatNoteAndAi({ engine, selectedConvo, setSelectedConvo, activeClient });
    const chatOps = useChatOperations({
        engine, selectedConvo, setSelectedConvo, activeClient, activeTab, statusFilter, searchQuery,
        selectedLabelFilter, filterBlockStatus, filterHasNote, filterStartDate, filterEndDate,
        filterUnread, filterWindowOpen, filterTemplate24h, filterHasReplied,
        selectAllPages, setSelectAllPages, excludedConvoIds, setExcludedConvoIds
    });

    // 4. Scroll de mensagens e busca interna
    const { handleScrollMessages, handleSelectSearchMessage } = useChatMessageScroller({
        engine,
        selectedConvo,
        setIsSearchMode,
        setHighlightedMsgId,
        activeClient
    });

    // 5. Efeitos colaterais, sincronização contínua e timers
    useChatEffects({
        engine,
        selectedConvo,
        setSelectedConvo,
        chatInputRef,
        setSelectAllPages,
        selectAllPages,
        excludedConvoIds,
        setExcludedConvoIds,
        activeTab,
        statusFilter,
        searchQuery,
        selectedLabelFilter,
        filterBlockStatus,
        filterHasNote,
        filterStartDate,
        filterEndDate,
        filterUnread,
        filterWindowOpen,
        filterTemplate24h,
        filterUrgent,
        filterHasReplied,
        filterHasActiveFunnel,
        filterLastMessageRead,
        filterLastMessageUnread,
        filterNoPipeline,
        filterNotInPipelineId,
        filterInPipeline,
        filterPipelineId,
        filterPipelineStageId,
        orderBy,
        activeClient,
        setIsSearchMode,
        setHighlightedMsgId,
        noteAndAi,
        chatOps,
        isMaximizedInputOpen,
        showTemplateModal,
        showFunnelModal
    });

    const getMediaSrc = (msg) => {
        if (!msg || !msg.media_url) return '';
        return resolveMediaUrl(msg.media_url, activeClient?.id);
    };

    return (
        <>
            <ChatModals
                engine={engine}
                selectedConvo={selectedConvo}
                activeClient={activeClient}
                mediaUploader={mediaUploader}
                noteAndAi={noteAndAi}
                chatOps={chatOps}
                showTemplateModal={showTemplateModal}
                setShowTemplateModal={setShowTemplateModal}
                isMaximizedInputOpen={isMaximizedInputOpen}
                setIsMaximizedInputOpen={setIsMaximizedInputOpen}
                showFunnelModal={showFunnelModal}
                setShowFunnelModal={setShowFunnelModal}
                isCancelFunnelModalOpen={isCancelFunnelModalOpen}
                setIsCancelFunnelModalOpen={setIsCancelFunnelModalOpen}
                isCancelingFunnel={isCancelingFunnel}
                setIsCancelingFunnel={setIsCancelingFunnel}
                selectAllPages={selectAllPages}
                excludedConvoIds={excludedConvoIds}
                setExcludedConvoIds={setExcludedConvoIds}
                exportModal={exportModal}
                setExportModal={setExportModal}
                isCrmModalOpen={isCrmModalOpen}
                setIsCrmModalOpen={setIsCrmModalOpen}
                isBulkPipelineModalOpen={isBulkPipelineModalOpen}
                setIsBulkPipelineModalOpen={setIsBulkPipelineModalOpen}
                isBulkTemplateModalOpen={isBulkTemplateModalOpen}
                setIsBulkTemplateModalOpen={setIsBulkTemplateModalOpen}
                filterParams={filterParams}
            />

            <div className="flex flex-col h-full w-full bg-[#0f172a] text-gray-100 overflow-hidden font-sans">
                <ChatHeaderNav
                    activeClient={activeClient}
                    user={user}
                    onClose={onClose}
                    onNavigate={onNavigate}
                />

                <div className="flex flex-1 min-h-0 bg-white dark:bg-[#1e293b] overflow-hidden">
                {(!isChatMaximized || !selectedConvo) && (
                    <div className={`h-full shrink-0 ${selectedConvo ? 'hidden md:flex' : 'flex w-full md:w-auto'}`}>
                        <ChatListSidebar
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            statusFilter={statusFilter}
                            setStatusFilter={setStatusFilter}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            selectedLabelFilter={selectedLabelFilter}
                            setSelectedLabelFilter={setSelectedLabelFilter}
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
                            filterBlockStatus={filterBlockStatus}
                            setFilterBlockStatus={setFilterBlockStatus}
                            filterStartDate={filterStartDate}
                            setFilterStartDate={setFilterStartDate}
                            filterEndDate={filterEndDate}
                            setFilterEndDate={setFilterEndDate}
                            orderBy={orderBy}
                            setOrderBy={setOrderBy}
                            engine={engine}
                            selectedConvo={selectedConvo}
                            setSelectedConvo={setSelectedConvo}
                            selectAllPages={selectAllPages}
                            setSelectAllPages={setSelectAllPages}
                            excludedConvoIds={excludedConvoIds}
                            setExcludedConvoIds={setExcludedConvoIds}
                            setIsBulkTagModalOpen={chatOps.setIsBulkTagModalOpen}
                            setIsBulkPipelineModalOpen={setIsBulkPipelineModalOpen}
                            setIsBulkTemplateModalOpen={setIsBulkTemplateModalOpen}
                            handleBulkUnblock={chatOps.handleBulkUnblock}
                            isOpenAiConfigured={noteAndAi.isOpenAiConfigured}
                            isAnalyzingAi={noteAndAi.isAnalyzingAi}
                            handleAnalyzeBulkChatsDoubts={noteAndAi.handleAnalyzeBulkChatsDoubts}
                            formatTime={formatTime}
                        />
                    </div>
                )}

                    <div 
                        className={`flex-1 flex-col h-full bg-white dark:bg-[#0f172a] relative min-w-0 ${
                            selectedConvo ? 'flex' : 'hidden md:flex'
                        }`}
                        onDragEnter={mediaUploader.handleDragEnter}
                        onDragOver={mediaUploader.handleDragOver}
                        onDragLeave={mediaUploader.handleDragLeave}
                        onDrop={mediaUploader.handleDrop}
                        onPaste={mediaUploader.handlePaste}
                    >
                        {mediaUploader.isDraggingFile && (
                            <div className="absolute inset-0 z-40 bg-blue-900/80 backdrop-blur-md border-2 border-dashed border-blue-400 rounded-2xl flex flex-col items-center justify-center text-white p-6 shadow-2xl transition-all pointer-events-none">
                                <div className="w-16 h-16 rounded-full bg-blue-500/30 flex items-center justify-center mb-3 animate-bounce">
                                    <FiUploadCloud size={36} className="text-blue-300" />
                                </div>
                                <p className="text-lg font-bold text-white">Solte seu arquivo aqui para enviar</p>
                                <p className="text-xs text-blue-200 mt-1">Imagens, Vídeos, Áudios ou PDFs (Documentos)</p>
                            </div>
                        )}

                        {selectedConvo ? (
                            <>
                                <ActiveChatHeader
                                    selectedConvo={selectedConvo}
                                    setSelectedConvo={setSelectedConvo}
                                    showRightSidebar={showRightSidebar}
                                    setShowRightSidebar={setShowRightSidebar}
                                    engine={engine}
                                    handleTogglePin={chatOps.handleTogglePin}
                                    handleToggleUrgent={chatOps.handleToggleUrgent}
                                    handleUnblockContact={chatOps.handleUnblockContact}
                                    setShowFunnelModal={setShowFunnelModal}
                                    exportConversationToDoc={handleExportConversation}
                                    activeClientId={activeClient?.id}
                                    isOpenAiConfigured={noteAndAi.isOpenAiConfigured}
                                    isAnalyzingAi={noteAndAi.isAnalyzingAi}
                                    handleAnalyzeSingleChatDoubts={noteAndAi.handleAnalyzeSingleChatDoubts}
                                    isSearchMode={isSearchMode}
                                    setIsSearchMode={setIsSearchMode}
                                    isChatMaximized={isChatMaximized}
                                    setIsChatMaximized={setIsChatMaximized}
                                    onOpenCrm={() => setIsCrmModalOpen(true)}
                                />

                                <ActiveChatBanner
                                    activeFunnel={selectedConvo.active_funnel}
                                    onOpenPipeline={chatOps.handleOpenActiveFunnelPipeline}
                                    isLoadingPipeline={chatOps.isLoadingPipeline}
                                    onOpenCancelModal={() => setIsCancelFunnelModalOpen(true)}
                                />

                                <FollowUpChatBanner selectedConvo={selectedConvo} />

                                <ChatMessageList
                                    engine={engine}
                                    selectedConvo={selectedConvo}
                                    handleScrollMessages={handleScrollMessages}
                                    getMediaSrc={getMediaSrc}
                                    formatMessageTimestamp={formatMessageTimestamp}
                                    editingNoteId={noteAndAi.editingNoteId}
                                    setEditingNoteId={noteAndAi.setEditingNoteId}
                                    editingNoteText={noteAndAi.editingNoteText}
                                    setEditingNoteText={noteAndAi.setEditingNoteText}
                                    isSavingNoteMsg={noteAndAi.isSavingNoteMsg}
                                    handleSaveEditedNote={noteAndAi.handleSaveEditedNote}
                                    setIsNoteModalMaximized={noteAndAi.setIsNoteModalMaximized}
                                    setDeleteNoteConfirmMsgId={noteAndAi.setDeleteNoteConfirmMsgId}
                                    setReplyingTo={setReplyingTo}
                                    chatInputRef={chatInputRef}
                                    highlightedMsgId={highlightedMsgId}
                                    handleTogglePinMessage={chatOps.handleTogglePinMessage}
                                    handleToggleStarMessage={chatOps.handleToggleStarMessage}
                                    handleCopyMessageContent={chatOps.handleCopyMessageContent}
                                    handleDeleteMessage={noteAndAi.handleDeleteNoteMsg}
                                    onOpenPipelineByTriggerId={chatOps.handleOpenPipelineByTriggerId}
                                    onRetryTemplateMessage={chatOps.handleRetryTemplateMessage}
                                />

                                <ActiveChatInput
                                    engine={engine}
                                    selectedConvo={selectedConvo}
                                    activeClientId={activeClient?.id}
                                    replyingTo={replyingTo}
                                    setReplyingTo={setReplyingTo}
                                    chatInputRef={chatInputRef}
                                    handleMediaUpload={mediaUploader.handleMediaUpload}
                                    setShowTemplateModal={setShowTemplateModal}
                                    setIsMaximizedInputOpen={setIsMaximizedInputOpen}
                                    startRecording={mediaUploader.startRecording}
                                    stopRecordingToPreview={mediaUploader.stopRecordingToPreview}
                                    discardRecordedAudio={mediaUploader.discardRecordedAudio}
                                    sendRecordedAudio={mediaUploader.sendRecordedAudio}
                                    cancelRecording={mediaUploader.cancelRecording}
                                    recordedAudio={mediaUploader.recordedAudio}
                                    isSendingAudio={mediaUploader.isSendingAudio}
                                />
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <FiMessageSquare className="mb-3 animate-pulse" size={48} />
                                <h3 className="font-semibold text-lg">Área de Atendimento</h3>
                                <p className="text-sm">Selecione uma conversa para iniciar.</p>
                            </div>
                        )}
                    </div>

                    {selectedConvo && showRightSidebar && !isChatMaximized && (
                        <ChatContactSidebar
                            selectedConvo={selectedConvo}
                            setSelectedConvo={setSelectedConvo}
                            timeLeft24h={engine.timeLeft24h}
                            handleClose24hWindow={engine.handleClose24hWindow}
                            isAssigning={engine.isAssigning}
                            availableAgents={engine.availableAgents}
                            handleAssignConversation={engine.handleAssignConversation}
                            availableLabels={engine.availableLabels}
                            getLabelColor={engine.getLabelColor}
                            handleRemoveTag={chatOps.handleRemoveTag}
                            tagSearchQuery={engine.tagSearchQuery}
                            setTagSearchQuery={engine.setTagSearchQuery}
                            isTagDropdownOpen={engine.isTagDropdownOpen}
                            setIsTagDropdownOpen={engine.setIsTagDropdownOpen}
                            handleAddTagWithName={chatOps.handleAddTagWithName}
                            privateNote={engine.privateNote}
                            setPrivateNote={engine.setPrivateNote}
                            isSavingNote={engine.isSavingNote}
                            handleSaveNote={chatOps.handleSaveNote}
                            onOpenClearModal={() => engine.setIsClearChatModalOpen(true)}
                            mediaData={engine.mediaData}
                            isLoadingMedia={engine.isLoadingMedia}
                            isMediaModalOpen={engine.isMediaModalOpen}
                            setIsMediaModalOpen={engine.setIsMediaModalOpen}
                            getFirstName={getFirstName}
                            activeClientId={activeClient?.id}
                            conversations={engine.conversations}
                            openConversationById={engine.openConversationById}
                            isSearchMode={isSearchMode}
                            setIsSearchMode={setIsSearchMode}
                            onSelectMessage={handleSelectSearchMessage}
                            messages={engine.messages}
                            handleToggleStarMessage={chatOps.handleToggleStarMessage}
                            formatMessageTimestamp={formatMessageTimestamp}
                            handleDeleteNoteMsg={noteAndAi.handleDeleteNoteMsg}
                            onClose={() => setShowRightSidebar(false)}
                            onOpenCrm={() => setIsCrmModalOpen(true)}
                        />
                    )}
                </div>
            </div>
        </>
    );
}

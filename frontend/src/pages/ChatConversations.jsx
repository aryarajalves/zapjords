import React, { useState, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useClient } from '../contexts/ClientContext';
import { getFirstName } from '../utils/nameFormatter';

// Componentes da Interface
import ChatHeaderNav from './ChatConversations/components/ChatHeaderNav';
import ChatListSidebar from './ChatConversations/components/ChatListSidebar';
import ActiveChatArea from './ChatConversations/components/ActiveChatArea';
import ChatContactSidebar from './ChatConversations/ChatContactSidebar';
import ChatModals from './ChatConversations/components/ChatModals';
import FloatingAIChat from '../components/ai/FloatingAIChat';

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
        retryTemplateMessage, setRetryTemplateMessage,
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
                retryTemplateMessage={retryTemplateMessage}
                setRetryTemplateMessage={setRetryTemplateMessage}
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
                                {...filterState}
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

                    <ActiveChatArea
                        selectedConvo={selectedConvo}
                        setSelectedConvo={setSelectedConvo}
                        mediaUploader={mediaUploader}
                        engine={engine}
                        showRightSidebar={showRightSidebar}
                        setShowRightSidebar={setShowRightSidebar}
                        chatOps={chatOps}
                        setShowFunnelModal={setShowFunnelModal}
                        handleExportConversation={handleExportConversation}
                        activeClient={activeClient}
                        noteAndAi={noteAndAi}
                        isSearchMode={isSearchMode}
                        setIsSearchMode={setIsSearchMode}
                        isChatMaximized={isChatMaximized}
                        setIsChatMaximized={setIsChatMaximized}
                        setIsCrmModalOpen={setIsCrmModalOpen}
                        setIsCancelFunnelModalOpen={setIsCancelFunnelModalOpen}
                        handleScrollMessages={handleScrollMessages}
                        getMediaSrc={getMediaSrc}
                        formatMessageTimestamp={formatMessageTimestamp}
                        replyingTo={replyingTo}
                        setReplyingTo={setReplyingTo}
                        chatInputRef={chatInputRef}
                        highlightedMsgId={highlightedMsgId}
                        setRetryTemplateMessage={setRetryTemplateMessage}
                        setShowTemplateModal={setShowTemplateModal}
                        setIsMaximizedInputOpen={setIsMaximizedInputOpen}
                    />

                    {/* Copiloto de Atendimento com IA (Visível apenas em conversa aberta) */}
                    {selectedConvo && (
                        <FloatingAIChat 
                            selectedConvo={selectedConvo}
                            onInsertMessage={(text) => {
                                if (engine.setNewMessage) {
                                    engine.setNewMessage(prev => prev ? `${prev} ${text}` : text);
                                }
                                if (chatInputRef.current) {
                                    chatInputRef.current.focus();
                                }
                            }}
                        />
                    )}

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
                            setConversations={engine.setConversations}
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

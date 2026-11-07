import React from 'react';
import { FiMessageSquare, FiUploadCloud } from 'react-icons/fi';
import ActiveChatHeader from './ActiveChatHeader';
import ActiveChatBanner from './ActiveChatBanner';
import FollowUpChatBanner from './FollowUpChatBanner';
import ChatMessageList from './ChatMessageList';
import ActiveChatInput from './ActiveChatInput';

export default function ActiveChatArea({
    selectedConvo,
    setSelectedConvo,
    mediaUploader,
    engine,
    showRightSidebar,
    setShowRightSidebar,
    chatOps,
    setShowFunnelModal,
    handleExportConversation,
    activeClient,
    noteAndAi,
    isSearchMode,
    setIsSearchMode,
    isChatMaximized,
    setIsChatMaximized,
    setIsCrmModalOpen,
    setIsCancelFunnelModalOpen,
    handleScrollMessages,
    getMediaSrc,
    formatMessageTimestamp,
    replyingTo,
    setReplyingTo,
    chatInputRef,
    highlightedMsgId,
    setRetryTemplateMessage,
    setShowTemplateModal,
    setIsMaximizedInputOpen,
}) {
    return (
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
                        onEditAndRetryTemplateMessage={(msg) => {
                            setRetryTemplateMessage(msg);
                            setShowTemplateModal(true);
                        }}
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
    );
}

import React from 'react';
import {
    FiX,
    FiCheckCircle,
    FiSidebar,
    FiSearch,
    FiArrowLeft,
    FiTrello
} from 'react-icons/fi';
import {
    BsPinAngleFill,
    BsExclamationCircleFill
} from 'react-icons/bs';
import { IoCheckmarkDone, IoMailUnreadOutline } from 'react-icons/io5';
import { getFirstName } from '../../../utils/nameFormatter';
import ConversationLabelsList from './ConversationLabelsList';
import ActiveChatMoreActionsMenu from './ActiveChatMoreActionsMenu';

export default function ActiveChatHeader({
    selectedConvo,
    setSelectedConvo,
    showRightSidebar,
    setShowRightSidebar,
    engine,
    handleTogglePin,
    handleToggleUrgent,
    handleUnblockContact,
    setShowFunnelModal,
    exportConversationToDoc,
    activeClientId,
    isOpenAiConfigured,
    isAnalyzingAi,
    handleAnalyzeSingleChatDoubts,
    isSearchMode,
    setIsSearchMode,
    isChatMaximized,
    setIsChatMaximized,
    onOpenCrm
}) {
    if (!selectedConvo) return null;

    const isWindowClosed =
        !engine.timeLeft24h ||
        engine.timeLeft24h === 'Janela Fechada' ||
        String(engine.timeLeft24h).toLowerCase().includes('fechada');

    return (
        <div
            data-testid="active-chat-header"
            className="p-2.5 sm:px-4 sm:py-3 border-b border-gray-200 dark:border-white/5 flex flex-col sm:flex-row flex-wrap justify-between items-stretch sm:items-center gap-2.5 sm:gap-3 bg-gray-50/20 dark:bg-[#111827]/20 shrink-0 relative z-30"
        >
            {/* Lado Esquerdo / Linha Superior no Mobile: Dados do Contato */}
            <div className="flex items-start sm:items-center gap-2 w-full sm:w-auto flex-1 overflow-hidden">
                <button
                    type="button"
                    onClick={() => {
                        setIsChatMaximized?.(false);
                        setSelectedConvo(null);
                    }}
                    data-testid="chat-mobile-back-btn"
                    className="md:hidden p-2 -ml-1 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 transition-colors cursor-pointer shrink-0"
                    title="Voltar para a lista de conversas"
                    aria-label="Voltar para a lista de conversas"
                >
                    <FiArrowLeft size={18} />
                </button>

                <div className="min-w-0 flex-1 overflow-hidden">
                    <h3 className="font-bold text-gray-800 dark:text-white text-sm sm:text-base flex items-center gap-2 truncate">
                        <span className="truncate">
                            {selectedConvo.contact_name ? getFirstName(selectedConvo.contact_name) : selectedConvo.phone}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 bg-gray-200/60 dark:bg-slate-800/80 text-gray-600 dark:text-gray-400 rounded-lg shrink-0">
                            ID: {selectedConvo.id}
                        </span>
                        {selectedConvo.pinned && (
                            <span
                                title="Conversa fixada"
                                className="inline-flex items-center justify-center p-1 rounded-md bg-blue-500/15 text-blue-400 shrink-0"
                            >
                                <BsPinAngleFill size={11} />
                            </span>
                        )}
                        {selectedConvo.urgent && (
                            <span
                                title="Conversa urgente"
                                className="inline-flex items-center justify-center p-1 rounded-md bg-red-500/15 text-red-400 shrink-0"
                            >
                                <BsExclamationCircleFill size={11} />
                            </span>
                        )}
                    </h3>

                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span
                            data-testid="chat-header-phone"
                            className="text-xs font-medium text-gray-600 dark:text-gray-300 tracking-wide whitespace-nowrap"
                        >
                            {selectedConvo.phone}
                        </span>

                        {!showRightSidebar && (
                            <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 border transition-colors ${
                                    isWindowClosed
                                        ? 'bg-red-500/15 text-red-500 dark:text-red-400 border-red-500/30'
                                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                }`}
                            >
                                <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        isWindowClosed ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'
                                    }`}
                                />
                                <span className={isWindowClosed ? 'text-red-500 dark:text-red-400' : ''}>
                                    {isWindowClosed ? 'Janela 24h: Janela Fechada' : `Janela 24h: ${engine.timeLeft24h}`}
                                </span>
                            </span>
                        )}
                    </div>

                    <ConversationLabelsList
                        labels={selectedConvo.labels}
                        getLabelColor={engine?.getLabelColor}
                        contactName={selectedConvo.contact_name || selectedConvo.phone}
                        variant="header"
                        className="mt-1.5"
                    />
                </div>
            </div>

            {/* Lado Direito / Linha Inferior no Mobile: Ações Principais + Menu Flutuante "Mais ações (⋯)" */}
            <div
                data-testid="chat-header-actions-row"
                className="flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto pt-2 sm:pt-0 border-t border-gray-200/50 dark:border-white/5 sm:border-t-0 shrink-0"
            >
                <div className="flex items-center gap-1.5 flex-1 sm:flex-initial min-w-0">
                    {Number(selectedConvo.unread_count || 0) > 0 ? (
                        <button
                            type="button"
                            data-testid="chat-header-mark-read-btn"
                            disabled={Boolean(engine.isMarkingAsRead)}
                            onClick={() => engine.handleMarkAsRead && engine.handleMarkAsRead(selectedConvo)}
                            title={`Marcar conversa como lida para o seu usuário (${selectedConvo.unread_count} não lida(s))`}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap bg-emerald-600 text-white border-emerald-500/40 hover:bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.28)]"
                        >
                            <IoCheckmarkDone size={15} />
                            <span>Marcar como lida ({selectedConvo.unread_count})</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            data-testid="chat-header-mark-unread-btn"
                            disabled={Boolean(engine.isMarkingAsRead)}
                            onClick={() => engine.handleMarkAsUnread && engine.handleMarkAsUnread(selectedConvo)}
                            title="Marcar conversa como não lida novamente (restaura a quantidade anterior na bolinha)"
                            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap bg-slate-800/80 hover:bg-amber-500/15 text-slate-300 hover:text-amber-300 border-white/10 hover:border-amber-500/30"
                        >
                            <IoMailUnreadOutline size={15} className="text-amber-400" />
                            <span>Marcar como não lida</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={engine.handleToggleStatus}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap ${
                            selectedConvo.status === 'resolved'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : 'bg-blue-600 text-white border-transparent hover:bg-blue-700'
                        }`}
                    >
                        <FiCheckCircle size={14} />
                        <span>{selectedConvo.status === 'resolved' ? 'Resolvida' : 'Resolver'}</span>
                    </button>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => onOpenCrm && onOpenCrm()}
                        title="Kanban de Vendas (Mover de Etapa)"
                        data-testid="chat-header-kanban-btn"
                        className="hidden sm:flex p-2 rounded-xl border bg-white dark:bg-[#1e293b] border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800/30 transition-all cursor-pointer items-center justify-center"
                    >
                        <FiTrello size={16} />
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setShowRightSidebar(true);
                            if (setIsSearchMode) setIsSearchMode(prev => !prev);
                        }}
                        title="Pesquisar mensagens nesta conversa"
                        className={`hidden sm:flex p-2 rounded-xl border transition-all cursor-pointer ${
                            isSearchMode && showRightSidebar
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                : 'bg-white dark:bg-[#1e293b] border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-800/30'
                        }`}
                    >
                        <FiSearch size={16} />
                    </button>

                    <ActiveChatMoreActionsMenu
                        selectedConvo={selectedConvo}
                        engine={engine}
                        isOpenAiConfigured={isOpenAiConfigured}
                        isAnalyzingAi={isAnalyzingAi}
                        handleAnalyzeSingleChatDoubts={handleAnalyzeSingleChatDoubts}
                        setShowFunnelModal={setShowFunnelModal}
                        handleTogglePin={handleTogglePin}
                        handleToggleUrgent={handleToggleUrgent}
                        exportConversationToDoc={exportConversationToDoc}
                        activeClientId={activeClientId}
                        handleUnblockContact={handleUnblockContact}
                        isChatMaximized={isChatMaximized}
                        setIsChatMaximized={setIsChatMaximized}
                        onOpenCrm={onOpenCrm}
                        setShowRightSidebar={setShowRightSidebar}
                        setIsSearchMode={setIsSearchMode}
                    />

                    <button
                        type="button"
                        data-testid="toggle-chat-details-btn"
                        onClick={() => {
                            if (isChatMaximized && !showRightSidebar) {
                                setIsChatMaximized?.(false);
                                setShowRightSidebar(true);
                            } else {
                                setShowRightSidebar(!showRightSidebar);
                            }
                        }}
                        title={showRightSidebar ? 'Fechar detalhes' : 'Abrir detalhes'}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            showRightSidebar
                                ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
                                : 'bg-white dark:bg-[#1e293b] border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                    >
                        <FiSidebar size={16} />
                    </button>

                    <button
                        type="button"
                        data-testid="chat-header-close-btn"
                        onClick={() => {
                            setIsChatMaximized?.(false);
                            setSelectedConvo(null);
                        }}
                        title="Fechar conversa"
                        aria-label="Fechar conversa"
                        className="p-2 rounded-xl border transition-all bg-white dark:bg-[#1e293b] border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800/30 flex items-center justify-center cursor-pointer"
                    >
                        <FiX size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

import React, { useState, useRef, useEffect } from 'react';
import {
    FiSlash,
    FiLayers,
    FiFileText,
    FiRefreshCw,
    FiSearch,
    FiArchive,
    FiMaximize2,
    FiMinimize2,
    FiTrello,
    FiMoreHorizontal
} from 'react-icons/fi';
import {
    BsPinAngle,
    BsPinAngleFill,
    BsExclamationCircle,
    BsExclamationCircleFill,
    BsStars
} from 'react-icons/bs';

export default function ActiveChatMoreActionsMenu({
    selectedConvo,
    engine,
    isOpenAiConfigured,
    isAnalyzingAi,
    handleAnalyzeSingleChatDoubts,
    setShowFunnelModal,
    handleTogglePin,
    handleToggleUrgent,
    exportConversationToDoc,
    activeClientId,
    handleUnblockContact,
    isChatMaximized,
    setIsChatMaximized,
    onOpenCrm,
    setShowRightSidebar,
    setIsSearchMode
}) {
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const moreMenuRef = useRef(null);

    useEffect(() => {
        if (!isMoreMenuOpen) return;

        const handleClickOutside = (e) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
                setIsMoreMenuOpen(false);
            }
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') setIsMoreMenuOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isMoreMenuOpen]);

    const hasActiveSecondaryState = Boolean(
        selectedConvo.pinned ||
        selectedConvo.urgent ||
        selectedConvo.block_status === 'blocked' ||
        selectedConvo.block_status === 'resting' ||
        selectedConvo.status === 'archived'
    );

    return (
        <div className="relative" ref={moreMenuRef}>
            <button
                type="button"
                data-testid="chat-header-more-actions-btn"
                onClick={() => setIsMoreMenuOpen(prev => !prev)}
                title="Mais ações da conversa"
                className={`relative p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                    isMoreMenuOpen
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-white dark:bg-[#1e293b] border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
            >
                <FiMoreHorizontal size={16} />
                {hasActiveSecondaryState && !isMoreMenuOpen && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-[#111827]" />
                )}
            </button>

            {isMoreMenuOpen && (
                <div
                    data-testid="chat-header-more-actions-menu"
                    className="absolute right-0 top-full mt-2 w-60 z-50 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 text-slate-200"
                >
                    {/* Atalhos mobile para Kanban e Busca (visíveis no menu em telas pequenas) */}
                    <button
                        type="button"
                        onClick={() => {
                            setIsMoreMenuOpen(false);
                            onOpenCrm?.();
                        }}
                        className="sm:hidden w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-white/10 transition cursor-pointer"
                    >
                        <FiTrello className="shrink-0 text-blue-400" size={14} />
                        <span>Kanban de Vendas</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setIsMoreMenuOpen(false);
                            setShowRightSidebar?.(true);
                            setIsSearchMode?.(prev => !prev);
                        }}
                        className="sm:hidden w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-white/10 transition cursor-pointer"
                    >
                        <FiSearch className="shrink-0 text-emerald-400" size={14} />
                        <span>Pesquisar na conversa</span>
                    </button>

                    {isOpenAiConfigured && (
                        <button
                            type="button"
                            disabled={isAnalyzingAi}
                            onClick={() => {
                                setIsMoreMenuOpen(false);
                                handleAnalyzeSingleChatDoubts?.();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-purple-300 hover:bg-purple-500/15 transition cursor-pointer disabled:opacity-50"
                        >
                            {isAnalyzingAi ? <FiRefreshCw className="animate-spin shrink-0" size={14} /> : <BsStars className="shrink-0" size={14} />}
                            <span>Analisar Dúvidas (IA)</span>
                        </button>
                    )}

                    {engine.timeLeft24h !== 'Janela Fechada' && (
                        <button
                            type="button"
                            onClick={() => {
                                setIsMoreMenuOpen(false);
                                setShowFunnelModal(true);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-white/10 transition cursor-pointer"
                        >
                            <FiLayers className="shrink-0 text-blue-400" size={14} />
                            <span>Disparar Funil</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            setIsMoreMenuOpen(false);
                            handleTogglePin?.();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-white/10 transition cursor-pointer"
                    >
                        {selectedConvo.pinned ? (
                            <BsPinAngleFill className="shrink-0 text-blue-400" size={14} />
                        ) : (
                            <BsPinAngle className="shrink-0 text-slate-400" size={14} />
                        )}
                        <span>{selectedConvo.pinned ? 'Desafixar conversa' : 'Fixar conversa'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setIsMoreMenuOpen(false);
                            handleToggleUrgent?.();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-white/10 transition cursor-pointer"
                    >
                        {selectedConvo.urgent ? (
                            <BsExclamationCircleFill className="shrink-0 text-red-400" size={14} />
                        ) : (
                            <BsExclamationCircle className="shrink-0 text-slate-400" size={14} />
                        )}
                        <span>{selectedConvo.urgent ? 'Remover urgência' : 'Marcar como urgente'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setIsMoreMenuOpen(false);
                            exportConversationToDoc?.(selectedConvo, engine.messages, activeClientId);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-white/10 transition cursor-pointer"
                    >
                        <FiFileText className="shrink-0 text-sky-400" size={14} />
                        <span>Exportar Conversa (PDF/HTML)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setIsMoreMenuOpen(false);
                            engine.handleToggleArchive?.();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-white/10 transition cursor-pointer"
                    >
                        <FiArchive className="shrink-0 text-amber-400" size={14} />
                        <span>{selectedConvo.status === 'archived' ? 'Desarquivar conversa' : 'Arquivar conversa'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setIsMoreMenuOpen(false);
                            if (selectedConvo.block_status === 'blocked' || selectedConvo.block_status === 'resting') {
                                handleUnblockContact?.();
                            } else {
                                engine.setIsBlockModalOpen(true);
                            }
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/15 transition cursor-pointer"
                    >
                        <FiSlash className="shrink-0 text-rose-400" size={14} />
                        <span>
                            {selectedConvo.block_status === 'blocked'
                                ? 'Desbloquear contato'
                                : selectedConvo.block_status === 'resting'
                                ? 'Remover do repouso'
                                : 'Bloquear ou colocar em repouso'}
                        </span>
                    </button>

                    <div className="border-t border-white/10 my-1" />

                    <button
                        type="button"
                        onClick={() => {
                            setIsMoreMenuOpen(false);
                            setIsChatMaximized?.(!isChatMaximized);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-white/10 transition cursor-pointer"
                    >
                        {isChatMaximized ? (
                            <FiMinimize2 className="shrink-0 text-amber-400" size={14} />
                        ) : (
                            <FiMaximize2 className="shrink-0 text-slate-400" size={14} />
                        )}
                        <span>{isChatMaximized ? 'Restaurar layout' : 'Maximizar conversa'}</span>
                    </button>
                </div>
            )}
        </div>
    );
}

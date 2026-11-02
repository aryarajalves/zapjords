import React, { useEffect, useRef } from 'react';

export function useChatEffects({
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
}) {
    // Redimensiona input quando vazio
    useEffect(() => {
        if (!engine?.newMessage && chatInputRef.current) {
            chatInputRef.current.style.height = 'auto';
        }
    }, [engine?.newMessage]);

    // Reseta exclusões se não estiver em selectAllPages e lista esvaziar
    useEffect(() => {
        if (!selectAllPages && engine.selectedConvoIds.length === 0) {
            if (setExcludedConvoIds) setExcludedConvoIds([]);
        }
    }, [engine.selectedConvoIds, selectAllPages]);

    // Reseta selectAllPages e excludedConvoIds ao alterar qualquer filtro
    useEffect(() => {
        setSelectAllPages(false);
        if (setExcludedConvoIds) setExcludedConvoIds([]);
    }, [activeTab, statusFilter, searchQuery, selectedLabelFilter, filterBlockStatus, filterHasNote, filterStartDate, filterEndDate, filterUnread, filterWindowOpen, filterTemplate24h, filterUrgent, filterHasReplied, filterHasActiveFunnel, filterLastMessageRead, filterLastMessageUnread, filterNoPipeline, filterNotInPipelineId, filterInPipeline, filterPipelineId, filterPipelineStageId, orderBy]);

    // Polling de conversas e labels
    useEffect(() => {
        engine.loadConversations(true);
        engine.loadAvailableLabels();
        const convoInterval = setInterval(() => {
            engine.loadConversations(false);
            engine.loadAvailableLabels();
        }, 5000);
        return () => clearInterval(convoInterval);
    }, [activeTab, statusFilter, searchQuery, selectedLabelFilter, filterBlockStatus, filterHasNote, filterStartDate, filterEndDate, activeClient, engine.page, engine.limit, filterUnread, filterWindowOpen, filterTemplate24h, filterUrgent, filterHasReplied, filterHasActiveFunnel, filterLastMessageRead, filterLastMessageUnread, filterNoPipeline, filterNotInPipelineId, filterInPipeline, filterPipelineId, filterPipelineStageId, orderBy]);

    // Carregamento de mensagens da conversa selecionada e polling
    useEffect(() => {
        if (!selectedConvo) return;
        engine.setIsLoadingMessages?.(true);
        engine.setMessages([]);
        engine.setShouldScrollToBottom(true);
        engine.loadMessages(selectedConvo.id, true);
        engine.setPrivateNote('');
        setIsSearchMode(false);
        setHighlightedMsgId(null);

        const msgInterval = setInterval(() => {
            engine.loadMessages(selectedConvo.id, false);
        }, 3000);
        return () => clearInterval(msgInterval);
    }, [selectedConvo?.id, activeClient]);

    // Carrega atendentes disponíveis e pipelines
    useEffect(() => {
        engine.loadAvailableAgents();
        if (engine.loadPipelines) engine.loadPipelines();
    }, [activeClient]);

        const pendingTargetPhoneRef = useRef(() => {
        if (typeof window === 'undefined') return null;
        const urlParams = new URLSearchParams(window.location.search);
        const urlPhone = urlParams.get('phone');
        const urlName = urlParams.get('name') || '';

        const localPhone = typeof localStorage !== 'undefined' ? localStorage.getItem('crm_target_chat_phone') : null;
        const localName = typeof localStorage !== 'undefined' ? localStorage.getItem('crm_target_chat_name') : null;

        const phone = localPhone || urlPhone;
        const name = localName || urlName;
        return phone ? { phone, name } : null;
    });

    const openTarget = useRef(pendingTargetPhoneRef.current());

    // Abre a conversa pendente da URL ou CRM no momento exato em que o activeClient estiver pronto
    useEffect(() => {
        if (!activeClient?.id || !openTarget.current || !engine.openConversationByPhone) return;

        const target = openTarget.current;
        openTarget.current = null; // consumido, nunca repete em re-renders

        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('crm_target_chat_phone');
            localStorage.removeItem('crm_target_chat_name');
        }

        if (typeof window !== 'undefined') {
            try {
                const cleanUrl = new URL(window.location.href);
                cleanUrl.searchParams.delete('phone');
                cleanUrl.searchParams.delete('name');
                const searchStr = cleanUrl.searchParams.toString();
                window.history.replaceState({}, '', cleanUrl.pathname + (searchStr ? '?' + searchStr : ''));
            } catch (_) {}
        }

        engine.openConversationByPhone(target.phone, target.name);
    }, [activeClient?.id, engine.openConversationByPhone]);

    // Event listener global para seleÃ§Ã£o externa de conversa
    useEffect(() => {
        const handleSelectConvo = (event) => {
            const convo = event.detail;
            if (!convo) return;
            if (convo.id && engine.openConversationById) {
                engine.openConversationById(convo.id);
            } else if (convo.phone && engine.openConversationByPhone) {
                engine.openConversationByPhone(convo.phone, convo.contact_name || convo.name || '');
            } else {
                setSelectedConvo(convo);
            }
        };
        window.addEventListener('select-chat-convo', handleSelectConvo);
        return () => window.removeEventListener('select-chat-convo', handleSelectConvo);
    }, [engine.openConversationById, engine.openConversationByPhone, setSelectedConvo]);

    // Recarregar mensagens da conversa ativa ao receber evento
    useEffect(() => {
        const handleReloadMessages = (event) => {
            const targetId = event.detail?.convoId || selectedConvo?.id;
            if (targetId && typeof engine.loadMessages === 'function') {
                engine.loadMessages(targetId, false);
            }
            if (typeof engine.loadConversations === 'function') {
                engine.loadConversations();
            }
        };
        window.addEventListener('reload-chat-messages', handleReloadMessages);
        return () => window.removeEventListener('reload-chat-messages', handleReloadMessages);
    }, [selectedConvo?.id, engine.loadMessages, engine.loadConversations]);

    // Timer da Janela de 24 horas
    useEffect(() => {
        if (!selectedConvo || !selectedConvo.last_contact_message_at) {
            engine.setTimeLeft24h('Janela Fechada');
            return;
        }
        const updateTimer = () => {
            const lastMsg = new Date(selectedConvo.last_contact_message_at);
            const expiry = new Date(lastMsg.getTime() + 24 * 60 * 60 * 1000);
            const now = new Date();
            let diff = expiry - now;
            const maxDiff = (24 * 60 * 60 * 1000) - 1000;
            if (diff > maxDiff) diff = maxDiff;

            if (diff <= 0) {
                engine.setTimeLeft24h('Janela Fechada');
            } else {
                const hours = Math.floor(diff / 3600000);
                const minutes = Math.floor((diff % 3600000) / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                engine.setTimeLeft24h(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
            }
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [selectedConvo?.last_contact_message_at, selectedConvo?.id]);

    // Bloqueia scroll do body se algum modal estiver aberto
    useEffect(() => {
        const isModalOpen = noteAndAi?.isNoteModalMaximized || isMaximizedInputOpen || !!noteAndAi?.deleteNoteConfirmMsgId || chatOps?.isBulkTagModalOpen || noteAndAi?.isAiReportModalOpen || showTemplateModal || showFunnelModal || !!engine?.confirmDeleteConvos || !!engine?.mediaPreview || engine?.isClearChatModalOpen;
        if (isModalOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [noteAndAi?.isNoteModalMaximized, isMaximizedInputOpen, noteAndAi?.deleteNoteConfirmMsgId, chatOps?.isBulkTagModalOpen, noteAndAi?.isAiReportModalOpen, showTemplateModal, showFunnelModal, engine?.confirmDeleteConvos, engine?.mediaPreview, engine?.isClearChatModalOpen]);
}

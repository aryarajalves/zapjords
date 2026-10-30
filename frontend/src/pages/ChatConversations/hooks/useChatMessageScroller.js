import React, { useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

export function useChatMessageScroller({ engine, selectedConvo, setIsSearchMode, setHighlightedMsgId, activeClient }) {
    const scrollOffsetRef = useRef(null);
    const initialScrolledConvoIdRef = useRef(null);
    const isScrolledUpRef = useRef(false);
    const engineRef = useRef(engine);
    engineRef.current = engine;

    const scrollToLatest = useCallback(() => {
        const eng = engineRef.current;
        const container = eng?.messagesContainerRef?.current;
        if (container) {
            container.scrollTop = container.scrollHeight;
            eng?.setShowScrollBtn?.(false);
            eng?.setShowScrollTopBtn?.(container.scrollTop > 80 || eng?.hasMoreMessages);
        }
        eng?.messagesEndRef?.current?.scrollIntoView?.({ behavior: 'auto' });
    }, []);

    // Preserva a posição exata da rolagem ao carregar blocos de mensagens antigas
    useLayoutEffect(() => {
        const eng = engineRef.current;
        if (scrollOffsetRef.current !== null && eng?.messagesContainerRef?.current) {
            const container = eng.messagesContainerRef.current;
            container.scrollTop = container.scrollHeight - scrollOffsetRef.current.prevHeight + scrollOffsetRef.current.prevTop;
            scrollOffsetRef.current = null;
        }
    }, [engine?.messages]);

    // Reseta o rastreador de scroll inicial quando a conversa ativa for trocada
    useEffect(() => {
        if (selectedConvo?.id !== initialScrolledConvoIdRef.current) {
            initialScrolledConvoIdRef.current = null;
            isScrolledUpRef.current = false;
        }
    }, [selectedConvo?.id]);

    // Rola para a última mensagem APENAS uma vez ao abrir a conversa e carregar o lote inicial
    useEffect(() => {
        if (
            selectedConvo?.id &&
            !engine?.isLoadingMessages &&
            engine?.messages?.length > 0 &&
            initialScrolledConvoIdRef.current !== selectedConvo.id
        ) {
            initialScrolledConvoIdRef.current = selectedConvo.id;
            isScrolledUpRef.current = false;
            scrollToLatest();
            const timers = [
                setTimeout(scrollToLatest, 50),
                setTimeout(scrollToLatest, 150),
                setTimeout(scrollToLatest, 300)
            ];
            return () => timers.forEach(clearTimeout);
        }
    }, [selectedConvo?.id, engine?.isLoadingMessages, engine?.messages?.length, scrollToLatest]);

    // Rola para a última mensagem sob demanda (ex: envio de nova mensagem pelo operador)
    // Se o operador estiver lendo mensagens antigas no topo, não puxa para baixo a menos que seja ele quem enviou
    useEffect(() => {
        if (engine?.shouldScrollToBottom) {
            const eng = engineRef.current;
            const container = eng?.messagesContainerRef?.current;
            const distanceFromBottom = container
                ? container.scrollHeight - container.scrollTop - container.clientHeight
                : 0;

            const lastMsg = eng?.messages?.[eng.messages.length - 1];
            const isUserSent = lastMsg?.sender_type === 'user';

            if (isScrolledUpRef.current && distanceFromBottom > 120 && !isUserSent) {
                // Mantém a visualização do operador no histórico e apenas exibe o botão para rolar se desejar
                eng?.setShowScrollBtn?.(true);
            } else {
                scrollToLatest();
                const timers = [
                    setTimeout(scrollToLatest, 50),
                    setTimeout(scrollToLatest, 180)
                ];
                eng?.setShouldScrollToBottom?.(false);
                return () => timers.forEach(clearTimeout);
            }
            eng?.setShouldScrollToBottom?.(false);
        }
    }, [engine?.shouldScrollToBottom, scrollToLatest]);

    const handleScrollMessages = useCallback(() => {
        const eng = engineRef.current;
        const container = eng?.messagesContainerRef?.current;
        if (!container) return;

        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        const isUp = distanceFromBottom > 120;
        isScrolledUpRef.current = isUp;

        eng.setShowScrollBtn?.(isUp);
        eng.setShowScrollTopBtn?.(container.scrollTop > 80 || eng.hasMoreMessages);

        if (container.scrollTop <= 40 && eng.hasMoreMessages && !eng.isLoadingMoreMessages) {
            scrollOffsetRef.current = { prevHeight: container.scrollHeight, prevTop: container.scrollTop };
            eng.loadMoreMessages?.();
        }
    }, []);

    const handleSelectSearchMessage = useCallback((msgId) => {
        if (!msgId) return;
        const el = document.getElementById(`msg-${msgId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedMsgId(msgId);
            setTimeout(() => setHighlightedMsgId(null), 2500);
        } else {
            toast.loading('Carregando mensagem no histórico...', { duration: 1500 });
        }
    }, [setHighlightedMsgId]);

    return {
        handleScrollMessages,
        handleSelectSearchMessage,
        scrollToLatest
    };
}

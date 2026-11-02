import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useChatEffects } from './hooks/useChatEffects';

describe('useChatEffects - Deep linking com activeClient assíncrono (Nova Aba)', () => {
    let mockEngine;
    let mockSetSelectedConvo;

    beforeEach(() => {
        vi.clearAllMocks();
        mockEngine = {
            openConversationByPhone: vi.fn(),
            openConversationById: vi.fn(),
            loadConversations: vi.fn(),
            loadAvailableLabels: vi.fn(),
            loadAvailableAgents: vi.fn(),
            loadPipelines: vi.fn(),
            loadMessages: vi.fn(),
            setMessages: vi.fn(),
            setIsLoadingMessages: vi.fn(),
            setTimeLeft24h: vi.fn(),
            setShouldScrollToBottom: vi.fn(),
            setPrivateNote: vi.fn(),
            selectedConvoIds: [],
            page: 1,
            limit: 20
        };
        mockSetSelectedConvo = vi.fn();
    });

    it('aguarda activeClient ficar disponível para abrir a conversa vinda de URL sem perder o telefone', async () => {
        // Simula query param na URL da nova aba
        const originalLocation = window.location;
        delete window.location;
        window.location = new URL('http://localhost:5176/?view=chat_conversations&phone=5511988887777&name=Lead%20Novo');

        try {
            // No tick inicial da nova aba, activeClient é null
            let activeClient = null;

            const { rerender } = renderHook(
                ({ client }) =>
                    useChatEffects({
                        engine: mockEngine,
                        selectedConvo: null,
                        setSelectedConvo: mockSetSelectedConvo,
                        chatInputRef: { current: null },
                        setSelectAllPages: vi.fn(),
                        selectAllPages: false,
                        excludedConvoIds: [],
                        setExcludedConvoIds: vi.fn(),
                        activeTab: 'todos',
                        statusFilter: 'open',
                        searchQuery: '',
                        selectedLabelFilter: '',
                        filterBlockStatus: '',
                        filterHasNote: null,
                        filterStartDate: '',
                        filterEndDate: '',
                        filterUnread: false,
                        filterWindowOpen: false,
                        filterTemplate24h: false,
                        filterUrgent: false,
                        filterHasReplied: '',
                        filterHasActiveFunnel: false,
                        filterLastMessageRead: false,
                        filterLastMessageUnread: false,
                        filterNoPipeline: false,
                        filterNotInPipelineId: null,
                        filterInPipeline: false,
                        filterPipelineId: null,
                        filterPipelineStageId: null,
                        orderBy: '',
                        activeClient: client,
                        setIsSearchMode: vi.fn(),
                        setHighlightedMsgId: vi.fn()
                    }),
                { initialProps: { client: activeClient } }
            );

            // Como activeClient é null, openConversationByPhone NÃO deve ser chamado ainda
            expect(mockEngine.openConversationByPhone).not.toHaveBeenCalled();

            // Simula resolução do activeClient (API /clients/ finalizada ou cache carregado)
            activeClient = { id: 1, name: 'Empresa Teste' };
            rerender({ client: activeClient });

            // Agora sim, com activeClient pronto, a conversa deve ser aberta com o telefone e nome exatos
            expect(mockEngine.openConversationByPhone).toHaveBeenCalledTimes(1);
            expect(mockEngine.openConversationByPhone).toHaveBeenCalledWith('5511988887777', 'Lead Novo');
        } finally {
            window.location = originalLocation;
        }
    });
});

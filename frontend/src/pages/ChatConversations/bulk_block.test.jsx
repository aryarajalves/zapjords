// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatListSidebar from './components/ChatListSidebar';
import { useChatConvoStatusOperations } from './hooks/chatOperations/useChatConvoStatusOperations';

vi.mock('./components/ChatListFilters', () => ({
    default: () => <div data-testid="mock-filters" />
}));

vi.mock('./components/ChatListItem', () => ({
    default: ({ convo }) => <div data-testid={`chat-item-${convo.id}`}>{convo.contact_name}</div>
}));

vi.mock('../../AuthContext', () => ({
    fetchWithAuth: vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'success', blocked_count: 2, message: '2 contatos bloqueados' })
    }))
}));

describe('Operações em Massa de Bloqueio de Contatos no Chat', () => {
    it('deve renderizar o botão Bloquear na barra de ações em massa quando conversas estiverem selecionadas', () => {
        const mockEngine = {
            conversations: [{ id: 1, contact_name: 'Lead 1' }, { id: 2, contact_name: 'Lead 2' }],
            selectedConvoIds: [1, 2],
            setSelectedConvoIds: vi.fn(),
            totalConvos: 2,
            setBlockModalMode: vi.fn(),
            setIsBlockModalOpen: vi.fn()
        };

        render(
            <ChatListSidebar
                engine={mockEngine}
                activeTab="todos"
                setActiveTab={vi.fn()}
                statusFilter="open"
                setStatusFilter={vi.fn()}
                searchQuery=""
                setSearchQuery={vi.fn()}
                selectedLabelFilter=""
                setSelectedLabelFilter={vi.fn()}
                activeFilterTab="status"
                setActiveFilterTab={vi.fn()}
                filterWindowOpen={false}
                setFilterWindowOpen={vi.fn()}
                filterTemplate24h={false}
                setFilterTemplate24h={vi.fn()}
                filterUnread={false}
                setFilterUnread={vi.fn()}
                filterHasNote={false}
                setFilterHasNote={vi.fn()}
                filterUrgent={false}
                setFilterUrgent={vi.fn()}
                filterHasReplied={false}
                setFilterHasReplied={vi.fn()}
                filterHasActiveFunnel={false}
                setFilterHasActiveFunnel={vi.fn()}
                filterLastMessageRead={false}
                setFilterLastMessageRead={vi.fn()}
                filterLastMessageUnread={false}
                setFilterLastMessageUnread={vi.fn()}
                filterNoPipeline={false}
                setFilterNoPipeline={vi.fn()}
                filterNotInPipelineId={null}
                setFilterNotInPipelineId={vi.fn()}
                filterBlockStatus={null}
                setFilterBlockStatus={vi.fn()}
                filterStartDate=""
                setFilterStartDate={vi.fn()}
                filterEndDate=""
                setFilterEndDate={vi.fn()}
                orderBy="recent"
                setOrderBy={vi.fn()}
                selectedConvo={null}
                setSelectedConvo={vi.fn()}
                selectAllPages={false}
                setSelectAllPages={vi.fn()}
                excludedConvoIds={[]}
                setExcludedConvoIds={vi.fn()}
                setIsBulkTagModalOpen={vi.fn()}
                setIsBulkPipelineModalOpen={vi.fn()}
                handleBulkUnblock={vi.fn()}
                isOpenAiConfigured={false}
                isAnalyzingAi={false}
                handleAnalyzeBulkChatsDoubts={vi.fn()}
                formatTime={vi.fn()}
            />
        );

        const blockBtn = screen.getByRole('button', { name: /Bloquear/i });
        expect(blockBtn).toBeInTheDocument();

        fireEvent.click(blockBtn);
        expect(mockEngine.setBlockModalMode).toHaveBeenCalledWith('bulk');
        expect(mockEngine.setIsBlockModalOpen).toHaveBeenCalledWith(true);
    });

    it('deve renderizar o botão Desbloquear quando o filtro de bloqueio estiver ativo', () => {
        const mockEngine = {
            conversations: [{ id: 1, contact_name: 'Lead 1' }],
            selectedConvoIds: [1],
            setSelectedConvoIds: vi.fn(),
            totalConvos: 1,
            setBlockModalMode: vi.fn(),
            setIsBlockModalOpen: vi.fn()
        };

        const handleBulkUnblockMock = vi.fn();

        render(
            <ChatListSidebar
                engine={mockEngine}
                activeTab="todos"
                setActiveTab={vi.fn()}
                statusFilter="open"
                setStatusFilter={vi.fn()}
                searchQuery=""
                setSearchQuery={vi.fn()}
                selectedLabelFilter=""
                setSelectedLabelFilter={vi.fn()}
                activeFilterTab="status"
                setActiveFilterTab={vi.fn()}
                filterWindowOpen={false}
                setFilterWindowOpen={vi.fn()}
                filterTemplate24h={false}
                setFilterTemplate24h={vi.fn()}
                filterUnread={false}
                setFilterUnread={vi.fn()}
                filterHasNote={false}
                setFilterHasNote={vi.fn()}
                filterUrgent={false}
                setFilterUrgent={vi.fn()}
                filterHasReplied={false}
                setFilterHasReplied={vi.fn()}
                filterHasActiveFunnel={false}
                setFilterHasActiveFunnel={vi.fn()}
                filterLastMessageRead={false}
                setFilterLastMessageRead={vi.fn()}
                filterLastMessageUnread={false}
                setFilterLastMessageUnread={vi.fn()}
                filterNoPipeline={false}
                setFilterNoPipeline={vi.fn()}
                filterNotInPipelineId={null}
                setFilterNotInPipelineId={vi.fn()}
                filterBlockStatus="blocked"
                setFilterBlockStatus={vi.fn()}
                filterStartDate=""
                setFilterStartDate={vi.fn()}
                filterEndDate=""
                setFilterEndDate={vi.fn()}
                orderBy="recent"
                setOrderBy={vi.fn()}
                selectedConvo={null}
                setSelectedConvo={vi.fn()}
                selectAllPages={false}
                setSelectAllPages={vi.fn()}
                excludedConvoIds={[]}
                setExcludedConvoIds={vi.fn()}
                setIsBulkTagModalOpen={vi.fn()}
                setIsBulkPipelineModalOpen={vi.fn()}
                handleBulkUnblock={handleBulkUnblockMock}
                isOpenAiConfigured={false}
                isAnalyzingAi={false}
                handleAnalyzeBulkChatsDoubts={vi.fn()}
                formatTime={vi.fn()}
            />
        );

        const unblockBtn = screen.getByRole('button', { name: /Desbloquear/i });
        expect(unblockBtn).toBeInTheDocument();

        fireEvent.click(unblockBtn);
        expect(handleBulkUnblockMock).toHaveBeenCalled();
    });

    it('handleBulkBlock deve enviar payload com IDs e tipo permanente para a API', async () => {
        const { fetchWithAuth } = await import('../../AuthContext');
        const mockEngine = {
            selectedConvoIds: [10, 20],
            setSelectedConvoIds: vi.fn(),
            setIsBlockingContact: vi.fn(),
            setIsBlockModalOpen: vi.fn(),
            setBlockModalMode: vi.fn(),
            loadConversations: vi.fn()
        };

        const { result } = renderHook(() => useChatConvoStatusOperations({
            selectedConvo: null,
            setSelectedConvo: vi.fn(),
            activeClient: { id: 14 },
            engine: mockEngine,
            selectAllPages: false
        }));

        await act(async () => {
            await result.current.handleBulkBlock('permanent');
        });

        expect(fetchWithAuth).toHaveBeenCalledWith(
            expect.stringContaining('/chat/conversations/bulk-block'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ ids: [10, 20], type: 'permanent' })
            }),
            14
        );

        expect(mockEngine.setIsBlockModalOpen).toHaveBeenCalledWith(false);
        expect(mockEngine.setSelectedConvoIds).toHaveBeenCalledWith([]);
        expect(mockEngine.loadConversations).toHaveBeenCalledWith(false);
    });

    it('handleBulkBlock deve suportar repouso temporário com horas', async () => {
        const { fetchWithAuth } = await import('../../AuthContext');
        const mockEngine = {
            selectedConvoIds: [5],
            setSelectedConvoIds: vi.fn(),
            setIsBlockingContact: vi.fn(),
            setIsBlockModalOpen: vi.fn(),
            setBlockModalMode: vi.fn(),
            loadConversations: vi.fn()
        };

        const { result } = renderHook(() => useChatConvoStatusOperations({
            selectedConvo: null,
            setSelectedConvo: vi.fn(),
            activeClient: { id: 14 },
            engine: mockEngine,
            selectAllPages: false
        }));

        await act(async () => {
            await result.current.handleBulkBlock('resting', 72);
        });

        expect(fetchWithAuth).toHaveBeenCalledWith(
            expect.stringContaining('/chat/conversations/bulk-block'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ ids: [5], type: 'resting', hours: 72 })
            }),
            14
        );
    });
});

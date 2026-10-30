import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ActiveChatHeader from '../pages/ChatConversations/components/ActiveChatHeader';
import ChatHeaderNav from '../pages/ChatConversations/components/ChatHeaderNav';
import ChatOrderFilterPopover from '../pages/ChatConversations/components/ChatOrderFilterPopover';
import ChatListFilters from '../pages/ChatConversations/components/ChatListFilters';

describe('Chat - Menu Flutuante no Cabeçalho (Opção A), Popover de Ordem e Badge de Filtro Ativo', () => {
    const mockEngine = {
        timeLeft24h: '22h 15m',
        isMarkingAsRead: false,
        handleMarkAsRead: vi.fn(),
        handleToggleStatus: vi.fn(),
        handleToggleArchive: vi.fn(),
        setIsBlockModalOpen: vi.fn(),
        messages: []
    };

    it('exibe o número de telefone desimpedido e abre o menu flutuante "Mais ações (⋯)" com as ferramentas secundárias', () => {
        const handleTogglePin = vi.fn();
        const handleToggleUrgent = vi.fn();
        const exportConversationToDoc = vi.fn();
        const handleAnalyzeSingleChatDoubts = vi.fn();
        const setShowFunnelModal = vi.fn();

        const selectedConvo = {
            id: 17847,
            phone: '5511999955100',
            contact_name: 'Regina Uechi',
            status: 'open',
            unread_count: 0,
            pinned: false,
            urgent: false,
            labels: ['leads_bussola']
        };

        render(
            <ActiveChatHeader
                selectedConvo={selectedConvo}
                setSelectedConvo={vi.fn()}
                showRightSidebar={true}
                setShowRightSidebar={vi.fn()}
                engine={mockEngine}
                handleTogglePin={handleTogglePin}
                handleToggleUrgent={handleToggleUrgent}
                handleUnblockContact={vi.fn()}
                setShowFunnelModal={setShowFunnelModal}
                exportConversationToDoc={exportConversationToDoc}
                activeClientId={14}
                isOpenAiConfigured={true}
                isAnalyzingAi={false}
                handleAnalyzeSingleChatDoubts={handleAnalyzeSingleChatDoubts}
            />
        );

        // Telefone completo visível
        expect(screen.getByTestId('chat-header-phone').textContent).toBe('5511999955100');

        // Menu secundário fechado inicialmente
        expect(screen.queryByTestId('chat-header-more-actions-menu')).not.toBeInTheDocument();

        // Abre o menu "Mais ações (⋯)"
        const moreBtn = screen.getByTestId('chat-header-more-actions-btn');
        fireEvent.click(moreBtn);

        const menu = screen.getByTestId('chat-header-more-actions-menu');
        expect(menu).toBeInTheDocument();
        expect(screen.getByText('Analisar Dúvidas (IA)')).toBeInTheDocument();
        expect(screen.getByText('Disparar Funil')).toBeInTheDocument();
        expect(screen.getByText('Fixar conversa')).toBeInTheDocument();
        expect(screen.getByText('Marcar como urgente')).toBeInTheDocument();
        expect(screen.getByText('Exportar Conversa (PDF/HTML)')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Fixar conversa'));
        expect(handleTogglePin).toHaveBeenCalledTimes(1);
    });

    it('abre o popover flutuante de Ordenação (ChatOrderFilterPopover) e seleciona uma opção sem empurrar a lista', () => {
        const setOrderBy = vi.fn();
        const onClose = vi.fn();

        render(
            <ChatOrderFilterPopover
                isOpen={true}
                onClose={onClose}
                orderBy="recent"
                setOrderBy={setOrderBy}
            />
        );

        const popover = screen.getByTestId('chat-order-filter-popover');
        expect(popover).toBeInTheDocument();
        expect(screen.getByText('Ordenar Conversas')).toBeInTheDocument();

        const unreadOpt = screen.getByTestId('order-option-unread_desc');
        fireEvent.click(unreadOpt);

        expect(setOrderBy).toHaveBeenCalledWith('unread_desc');
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renderiza o indicador de filtro ativo na aba Status (1) com espaçamento vertical py-1.5 para não cortar a bolinha', () => {
        render(
            <ChatListFilters
                activeTab="todos"
                setActiveTab={vi.fn()}
                statusFilter="open"
                setStatusFilter={vi.fn()}
                searchQuery=""
                setSearchQuery={vi.fn()}
                selectedLabelFilter=""
                setSelectedLabelFilter={vi.fn()}
                activeFilterTab="ordem"
                setActiveFilterTab={vi.fn()}
                filterWindowOpen={true}
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
                filterInPipeline={false}
                setFilterInPipeline={vi.fn()}
                filterPipelineId={null}
                setFilterPipelineId={vi.fn()}
                filterPipelineStageId={null}
                setFilterPipelineStageId={vi.fn()}
                orderBy="name_desc"
                setOrderBy={vi.fn()}
                visibleCount={16}
            />
        );

        const statusTab = screen.getByTestId('filter-tab-status');
        expect(statusTab.textContent).toContain('Status (1)');
        expect(screen.getByTestId('chat-order-filter-popover')).toBeInTheDocument();
    });

    it('restaura a barra lateral de conversas (setIsChatMaximized(false)) ao clicar no botão X de fechar conversa enquanto maximizada', () => {
        const setSelectedConvo = vi.fn();
        const setIsChatMaximized = vi.fn();

        const selectedConvo = {
            id: 17874,
            phone: '5519981286180',
            contact_name: 'Vanessa',
            status: 'open',
            unread_count: 3,
            pinned: false,
            urgent: false,
            labels: ['leads_bussola']
        };

        render(
            <ActiveChatHeader
                selectedConvo={selectedConvo}
                setSelectedConvo={setSelectedConvo}
                showRightSidebar={false}
                setShowRightSidebar={vi.fn()}
                isChatMaximized={true}
                setIsChatMaximized={setIsChatMaximized}
                engine={mockEngine}
                handleTogglePin={vi.fn()}
                handleToggleUrgent={vi.fn()}
                handleUnblockContact={vi.fn()}
                setShowFunnelModal={vi.fn()}
                exportConversationToDoc={vi.fn()}
            />
        );

        const closeBtn = screen.getByTestId('chat-header-close-btn');
        fireEvent.click(closeBtn);

        expect(setIsChatMaximized).toHaveBeenCalledWith(false);
        expect(setSelectedConvo).toHaveBeenCalledWith(null);
    });

    it('aplica classes responsivas (flex-wrap e w-full sm:w-auto) no ActiveChatHeader e ChatHeaderNav para impedir sobreposição no celular', () => {
        const selectedConvo = {
            id: 17874,
            phone: '351914342688',
            contact_name: null,
            status: 'open',
            unread_count: 2,
            pinned: false,
            urgent: false,
            labels: ['leads_bussola']
        };

        render(
            <>
                <ChatHeaderNav
                    activeClient={{ id: 14, name: 'Cliente - Crassus' }}
                    user={{ role: 'admin' }}
                    onClose={vi.fn()}
                    onNavigate={vi.fn()}
                />
                <ActiveChatHeader
                    selectedConvo={selectedConvo}
                    setSelectedConvo={vi.fn()}
                    showRightSidebar={false}
                    setShowRightSidebar={vi.fn()}
                    engine={mockEngine}
                    handleTogglePin={vi.fn()}
                    handleToggleUrgent={vi.fn()}
                    handleUnblockContact={vi.fn()}
                    setShowFunnelModal={vi.fn()}
                    exportConversationToDoc={vi.fn()}
                />
            </>
        );

        const header = screen.getByTestId('active-chat-header');
        expect(header.className).toContain('flex-wrap');

        const actionsRow = screen.getByTestId('chat-header-actions-row');
        expect(actionsRow.className).toContain('w-full');
        expect(actionsRow.className).toContain('sm:w-auto');

        const topNav = screen.getByTestId('chat-header-nav');
        expect(topNav.className).toContain('gap-2');
        expect(topNav.className).toContain('overflow-hidden');
    });
});

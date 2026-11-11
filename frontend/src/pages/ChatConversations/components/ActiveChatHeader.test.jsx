import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActiveChatHeader from './ActiveChatHeader';

describe('ActiveChatHeader - Botão Maximizar Conversa', () => {
    const baseProps = {
        selectedConvo: {
            id: 1,
            contact_name: 'Aryaraj',
            phone: '5585998259497',
            pinned: false,
            urgent: false,
            status: 'open',
            block_status: 'none',
            labels: []
        },
        setSelectedConvo: vi.fn(),
        showRightSidebar: true,
        setShowRightSidebar: vi.fn(),
        engine: {
            timeLeft24h: '23:45:00',
            handleToggleStatus: vi.fn(),
            handleToggleArchive: vi.fn(),
            setIsBlockModalOpen: vi.fn(),
            getLabelColor: vi.fn(() => '#3b82f6'),
            availableLabels: []
        },
        handleTogglePin: vi.fn(),
        handleToggleUrgent: vi.fn(),
        handleUnblockContact: vi.fn(),
        setShowFunnelModal: vi.fn(),
        exportConversationToDoc: vi.fn(),
        activeClientId: 'client-1',
        isOpenAiConfigured: false,
        isAnalyzingAi: false,
        handleAnalyzeSingleChatDoubts: vi.fn(),
        isSearchMode: false,
        setIsSearchMode: vi.fn(),
        isChatMaximized: false,
        setIsChatMaximized: vi.fn()
    };

    it('renderiza o botão de maximizar no menu de mais ações quando não maximizado', () => {
        render(<ActiveChatHeader {...baseProps} />);
        fireEvent.click(screen.getByTestId('chat-header-more-actions-btn'));
        const btn = screen.getByText('Maximizar conversa');
        expect(btn).toBeDefined();
    });

    it('renderiza o botão de minimizar no menu de mais ações quando maximizado', () => {
        render(<ActiveChatHeader {...baseProps} isChatMaximized={true} />);
        fireEvent.click(screen.getByTestId('chat-header-more-actions-btn'));
        const btn = screen.getByText('Restaurar layout');
        expect(btn).toBeDefined();
    });

    it('chama setIsChatMaximized com true ao clicar no botão de maximizar', () => {
        const setIsChatMaximized = vi.fn();
        render(<ActiveChatHeader {...baseProps} isChatMaximized={false} setIsChatMaximized={setIsChatMaximized} />);
        fireEvent.click(screen.getByTestId('chat-header-more-actions-btn'));
        const btn = screen.getByText('Maximizar conversa');
        fireEvent.click(btn);
        expect(setIsChatMaximized).toHaveBeenCalledWith(true);
    });

    it('chama setIsChatMaximized com false ao clicar no botão de restaurar', () => {
        const setIsChatMaximized = vi.fn();
        render(<ActiveChatHeader {...baseProps} isChatMaximized={true} setIsChatMaximized={setIsChatMaximized} />);
        fireEvent.click(screen.getByTestId('chat-header-more-actions-btn'));
        const btn = screen.getByText('Restaurar layout');
        fireEvent.click(btn);
        expect(setIsChatMaximized).toHaveBeenCalledWith(false);
    });

    it('renderiza o botão Voltar para lista de conversas no mobile', () => {
        render(<ActiveChatHeader {...baseProps} />);
        const backBtn = screen.getByTestId('chat-mobile-back-btn');
        expect(backBtn).toBeDefined();
        expect(backBtn.getAttribute('aria-label')).toBe('Voltar para a lista de conversas');
    });

    it('chama setSelectedConvo com null ao clicar no botão Voltar no mobile', () => {
        const setSelectedConvo = vi.fn();
        render(<ActiveChatHeader {...baseProps} setSelectedConvo={setSelectedConvo} />);
        const backBtn = screen.getByTestId('chat-mobile-back-btn');
        fireEvent.click(backBtn);
        expect(setSelectedConvo).toHaveBeenCalledWith(null);
    });

    it('renderiza o botão Disparar Template quando setShowTemplateModal é fornecido', () => {
        const setShowTemplateModal = vi.fn();
        render(<ActiveChatHeader {...baseProps} setShowTemplateModal={setShowTemplateModal} />);
        const btn = screen.getByTestId('chat-header-send-template-btn');
        expect(btn).toBeDefined();
        expect(screen.getByText('Disparar Template')).toBeDefined();
        fireEvent.click(btn);
        expect(setShowTemplateModal).toHaveBeenCalledWith(true);
    });
});

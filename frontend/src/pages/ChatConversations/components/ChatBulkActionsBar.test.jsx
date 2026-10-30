import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatBulkActionsBar from './ChatBulkActionsBar';

describe('ChatBulkActionsBar Component Tests', () => {
    const mockEngine = {
        selectedConvoIds: [1, 2],
        setSelectedConvoIds: vi.fn(),
        setIsBulkFunnelModalOpen: vi.fn(),
        setIsBlockModalOpen: vi.fn(),
        setBlockModalMode: vi.fn(),
        handleBulkArchive: vi.fn(),
        setConfirmDeleteConvos: vi.fn(),
        totalConvos: 10
    };

    const mockConversations = [
        { id: 1, phone: '5511999990001', contact_name: 'Lead 1' },
        { id: 2, phone: '5511999990002', contact_name: 'Lead 2' }
    ];

    it('renderiza o botão "Disparo Template" quando há conversas selecionadas', () => {
        const setIsBulkTemplateModalOpen = vi.fn();
        render(
            <ChatBulkActionsBar
                visibleConversations={mockConversations}
                engine={mockEngine}
                setIsBulkTemplateModalOpen={setIsBulkTemplateModalOpen}
                setIsBulkTagModalOpen={vi.fn()}
                setIsBulkPipelineModalOpen={vi.fn()}
            />
        );

        const templateBtn = screen.getByRole('button', { name: /disparo template/i });
        expect(templateBtn).toBeInTheDocument();
        expect(screen.getByText('2 selecionado(s)')).toBeInTheDocument();
    });

    it('chama setIsBulkTemplateModalOpen ao clicar no botão "Disparo Template"', () => {
        const setIsBulkTemplateModalOpen = vi.fn();
        render(
            <ChatBulkActionsBar
                visibleConversations={mockConversations}
                engine={mockEngine}
                setIsBulkTemplateModalOpen={setIsBulkTemplateModalOpen}
                setIsBulkTagModalOpen={vi.fn()}
                setIsBulkPipelineModalOpen={vi.fn()}
            />
        );

        const templateBtn = screen.getByRole('button', { name: /disparo template/i });
        fireEvent.click(templateBtn);
        expect(setIsBulkTemplateModalOpen).toHaveBeenCalledWith(true);
    });

    it('não exibe os botões de ação em massa se nenhuma conversa estiver selecionada', () => {
        const engineEmpty = { ...mockEngine, selectedConvoIds: [] };
        render(
            <ChatBulkActionsBar
                visibleConversations={mockConversations}
                engine={engineEmpty}
                selectAllPages={false}
                totalSelectedCount={0}
                setIsBulkTemplateModalOpen={vi.fn()}
                setIsBulkTagModalOpen={vi.fn()}
                setIsBulkPipelineModalOpen={vi.fn()}
            />
        );

        expect(screen.queryByRole('button', { name: /disparo template/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /etiquetar/i })).not.toBeInTheDocument();
    });

    it('chama setIsBulkTagModalOpen e setIsBulkFunnelModalOpen ao clicar em Etiquetar e Funil', () => {
        const setIsBulkTagModalOpen = vi.fn();
        render(
            <ChatBulkActionsBar
                visibleConversations={mockConversations}
                engine={mockEngine}
                setIsBulkTemplateModalOpen={vi.fn()}
                setIsBulkTagModalOpen={setIsBulkTagModalOpen}
                setIsBulkPipelineModalOpen={vi.fn()}
            />
        );

        const tagBtn = screen.getByRole('button', { name: /etiquetar/i });
        fireEvent.click(tagBtn);
        expect(setIsBulkTagModalOpen).toHaveBeenCalledWith(true);

        const funnelBtn = screen.getByRole('button', { name: /funil/i });
        fireEvent.click(funnelBtn);
        expect(mockEngine.setIsBulkFunnelModalOpen).toHaveBeenCalledWith(true);
    });
});

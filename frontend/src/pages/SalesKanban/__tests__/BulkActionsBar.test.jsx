import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BulkActionsBar } from '../components/BulkActionsBar';

describe('BulkActionsBar', () => {
    const mockStages = [
        { id: 1, name: 'Prospect', deals: [{ id: 101 }, { id: 102 }] },
        { id: 2, name: 'Lead', deals: [{ id: 103 }] }
    ];

    it('não renderiza nada se selectedCount for 0', () => {
        const { container } = render(
            <BulkActionsBar
                selectedCount={0}
                totalDeals={3}
                stages={mockStages}
                onSelectAll={vi.fn()}
                onClearSelection={vi.fn()}
                onSelectStage={vi.fn()}
                onOpenBulkEdit={vi.fn()}
                onOpenBulkDelete={vi.fn()}
                onOpenBulkTemplate={vi.fn()}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renderiza contador e botões quando selectedCount > 0', () => {
        render(
            <BulkActionsBar
                selectedCount={2}
                totalDeals={3}
                stages={mockStages}
                onSelectAll={vi.fn()}
                onClearSelection={vi.fn()}
                onSelectStage={vi.fn()}
                onOpenBulkEdit={vi.fn()}
                onOpenBulkDelete={vi.fn()}
                onOpenBulkTemplate={vi.fn()}
            />
        );

        expect(screen.getByText('2 leads selecionados')).toBeInTheDocument();
        expect(screen.getByText('Editar Produto e Preço')).toBeInTheDocument();
        expect(screen.getByText('Remover Selecionados')).toBeInTheDocument();
        expect(screen.getByTestId('kanban-bulk-template-btn')).toBeInTheDocument();
        expect(screen.getByText('Disparar Template')).toBeInTheDocument();
    });

    it('chama onOpenBulkTemplate ao clicar no botão "Disparar Template"', () => {
        const handleOpenTemplate = vi.fn();

        render(
            <BulkActionsBar
                selectedCount={1}
                totalDeals={3}
                stages={mockStages}
                onSelectAll={vi.fn()}
                onClearSelection={vi.fn()}
                onSelectStage={vi.fn()}
                onOpenBulkEdit={vi.fn()}
                onOpenBulkDelete={vi.fn()}
                onOpenBulkTemplate={handleOpenTemplate}
            />
        );

        const btn = screen.getByTestId('kanban-bulk-template-btn');
        fireEvent.click(btn);

        expect(handleOpenTemplate).toHaveBeenCalledTimes(1);
    });

    it('permite selecionar todos os leads ou desmarcar todos', () => {
        const handleSelectAll = vi.fn();
        const handleClear = vi.fn();

        render(
            <BulkActionsBar
                selectedCount={1}
                totalDeals={3}
                stages={mockStages}
                onSelectAll={handleSelectAll}
                onClearSelection={handleClear}
                onSelectStage={vi.fn()}
                onOpenBulkEdit={vi.fn()}
                onOpenBulkDelete={vi.fn()}
                onOpenBulkTemplate={vi.fn()}
            />
        );

        const selectAllBtn = screen.getByText('Selecionar Todos (3)');
        fireEvent.click(selectAllBtn);
        expect(handleSelectAll).toHaveBeenCalledTimes(1);

        const desmarcarBtn = screen.getByText('Desmarcar Todos');
        fireEvent.click(desmarcarBtn);
        expect(handleClear).toHaveBeenCalledTimes(1);
    });
});

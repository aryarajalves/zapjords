import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { KanbanColumn } from '../components/KanbanColumn';

describe('KanbanColumn - Reordenação de Colunas por Arraste', () => {
    const mockStage = {
        id: 14,
        name: 'Prospect',
        color: 'blue',
        order_index: 0,
        total_deals: 5,
        percentage: 50,
        total_value: 1500,
        deals: []
    };

    it('deve renderizar o badge com atributo draggable=true e ícone de grip', () => {
        render(
            <KanbanColumn
                stage={mockStage}
                onMoveDeal={vi.fn()}
                onMoveStage={vi.fn()}
                onStageDragStart={vi.fn()}
                onStageDragEnd={vi.fn()}
                draggedStageId={null}
                onOpenNewDeal={vi.fn()}
                onEditDeal={vi.fn()}
                onDeleteDeal={vi.fn()}
                onOpenChat={vi.fn()}
                onEditStage={vi.fn()}
            />
        );

        const badgeHandle = screen.getByTestId('column-drag-handle-14');
        expect(badgeHandle).toBeInTheDocument();
        expect(badgeHandle).toHaveAttribute('draggable', 'true');
        expect(badgeHandle).toHaveTextContent('5 (50%)');
    });

    it('deve disparar onStageDragStart e preencher stageId no dataTransfer ao iniciar o arraste pelo badge', () => {
        const onStageDragStart = vi.fn();
        render(
            <KanbanColumn
                stage={mockStage}
                onMoveDeal={vi.fn()}
                onMoveStage={vi.fn()}
                onStageDragStart={onStageDragStart}
                onStageDragEnd={vi.fn()}
                draggedStageId={null}
                onOpenNewDeal={vi.fn()}
                onEditDeal={vi.fn()}
                onDeleteDeal={vi.fn()}
                onOpenChat={vi.fn()}
                onEditStage={vi.fn()}
            />
        );

        const badgeHandle = screen.getByTestId('column-drag-handle-14');
        const setDataMock = vi.fn();

        fireEvent.dragStart(badgeHandle, {
            dataTransfer: {
                setData: setDataMock,
                effectAllowed: ''
            }
        });

        expect(setDataMock).toHaveBeenCalledWith('stageId', '14');
        expect(setDataMock).toHaveBeenCalledWith('type', 'stage');
        expect(onStageDragStart).toHaveBeenCalledWith(14);
    });

    it('deve chamar onMoveStage ao soltar outra coluna sobre esta', () => {
        const onMoveStage = vi.fn();
        render(
            <KanbanColumn
                stage={mockStage}
                onMoveDeal={vi.fn()}
                onMoveStage={onMoveStage}
                onStageDragStart={vi.fn()}
                onStageDragEnd={vi.fn()}
                draggedStageId={18}
                onOpenNewDeal={vi.fn()}
                onEditDeal={vi.fn()}
                onDeleteDeal={vi.fn()}
                onOpenChat={vi.fn()}
                onEditStage={vi.fn()}
            />
        );

        const columnContainer = screen.getByTestId('kanban-column-14');

        fireEvent.drop(columnContainer, {
            dataTransfer: {
                getData: (key) => (key === 'stageId' ? '18' : '')
            }
        });

        expect(onMoveStage).toHaveBeenCalledWith(18, 14);
    });

    it('deve aplicar estilo de opacidade reduzida na coluna que está sendo arrastada', () => {
        render(
            <KanbanColumn
                stage={mockStage}
                onMoveDeal={vi.fn()}
                onMoveStage={vi.fn()}
                onStageDragStart={vi.fn()}
                onStageDragEnd={vi.fn()}
                draggedStageId={14} // Esta coluna está sendo arrastada
                onOpenNewDeal={vi.fn()}
                onEditDeal={vi.fn()}
                onDeleteDeal={vi.fn()}
                onOpenChat={vi.fn()}
                onEditStage={vi.fn()}
            />
        );

        const columnContainer = screen.getByTestId('kanban-column-14');
        expect(columnContainer.className).toContain('opacity-40');
        expect(columnContainer.className).toContain('border-dashed');
    });

    it('deve renderizar o cabeçalho inteiro como arrastável com atributo draggable=true', () => {
        render(
            <KanbanColumn
                stage={mockStage}
                onMoveDeal={vi.fn()}
                onMoveStage={vi.fn()}
                onStageDragStart={vi.fn()}
                onStageDragEnd={vi.fn()}
                draggedStageId={null}
                onOpenNewDeal={vi.fn()}
                onEditDeal={vi.fn()}
                onDeleteDeal={vi.fn()}
                onOpenChat={vi.fn()}
                onEditStage={vi.fn()}
            />
        );

        const header = screen.getByTestId('column-drag-header-14');
        expect(header).toBeInTheDocument();
        expect(header).toHaveAttribute('draggable', 'true');
        expect(header.className).toContain('cursor-grab');
    });

    it('deve disparar onStageDragStart e preencher text/plain ao arrastar pelo cabeçalho da coluna', () => {
        const onStageDragStart = vi.fn();
        render(
            <KanbanColumn
                stage={mockStage}
                onMoveDeal={vi.fn()}
                onMoveStage={vi.fn()}
                onStageDragStart={onStageDragStart}
                onStageDragEnd={vi.fn()}
                draggedStageId={null}
                onOpenNewDeal={vi.fn()}
                onEditDeal={vi.fn()}
                onDeleteDeal={vi.fn()}
                onOpenChat={vi.fn()}
                onEditStage={vi.fn()}
            />
        );

        const header = screen.getByTestId('column-drag-header-14');
        const setDataMock = vi.fn();

        fireEvent.dragStart(header, {
            dataTransfer: {
                setData: setDataMock,
                effectAllowed: ''
            }
        });

        expect(setDataMock).toHaveBeenCalledWith('text/plain', 'stage:14');
        expect(setDataMock).toHaveBeenCalledWith('stageId', '14');
        expect(setDataMock).toHaveBeenCalledWith('type', 'stage');
        expect(onStageDragStart).toHaveBeenCalledWith(14);
    });

    it('deve processar o drop com formato text/plain padronizado', () => {
        const onMoveStage = vi.fn();
        render(
            <KanbanColumn
                stage={mockStage}
                onMoveDeal={vi.fn()}
                onMoveStage={onMoveStage}
                onStageDragStart={vi.fn()}
                onStageDragEnd={vi.fn()}
                draggedStageId={18}
                onOpenNewDeal={vi.fn()}
                onEditDeal={vi.fn()}
                onDeleteDeal={vi.fn()}
                onOpenChat={vi.fn()}
                onEditStage={vi.fn()}
            />
        );

        const columnContainer = screen.getByTestId('kanban-column-14');

        fireEvent.drop(columnContainer, {
            dataTransfer: {
                getData: (key) => (key === 'text/plain' ? 'stage:18' : '')
            }
        });

        expect(onMoveStage).toHaveBeenCalledWith(18, 14);
    });
});

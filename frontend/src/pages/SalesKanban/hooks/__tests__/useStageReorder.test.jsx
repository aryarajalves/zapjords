import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStageReorder } from '../useStageReorder';

vi.mock('react-hot-toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn()
    }
}));

import { toast } from 'react-hot-toast';

describe('useStageReorder hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it('deve inicializar com draggedStageId nulo', () => {
        const { result } = renderHook(() =>
            useStageReorder({
                boardData: { stages: [] },
                setBoardData: vi.fn(),
                selectedPipelineId: 10,
                clientId: 1
            })
        );

        expect(result.current.draggedStageId).toBeNull();
    });

    it('deve alterar e limpar draggedStageId com dragStart e dragEnd', () => {
        const { result } = renderHook(() =>
            useStageReorder({
                boardData: { stages: [] },
                setBoardData: vi.fn(),
                selectedPipelineId: 10,
                clientId: 1
            })
        );

        act(() => {
            result.current.handleStageDragStart(15);
        });
        expect(result.current.draggedStageId).toBe(15);

        act(() => {
            result.current.handleStageDragEnd();
        });
        expect(result.current.draggedStageId).toBeNull();
    });

    it('deve reordenar estágios otimisticamente e enviar requisição PUT para o backend', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Colunas reordenadas com sucesso' })
        });

        const initialStages = [
            { id: 1, name: 'Prospect', order_index: 0 },
            { id: 2, name: 'Lead', order_index: 1 },
            { id: 3, name: 'Oportunidade', order_index: 2 },
            { id: 4, name: 'Venda', order_index: 3 }
        ];

        const setBoardData = vi.fn();
        const { result } = renderHook(() =>
            useStageReorder({
                boardData: { id: 10, stages: initialStages },
                setBoardData,
                selectedPipelineId: 10,
                clientId: 1
            })
        );

        // Mover stage 4 (Venda) para a primeira posição (onde está o stage 1)
        await act(async () => {
            await result.current.handleMoveStage(4, 1);
        });

        expect(setBoardData).toHaveBeenCalledTimes(1);
        const calledArg = setBoardData.mock.calls[0][0];
        expect(calledArg.stages.map(s => s.id)).toEqual([4, 1, 2, 3]);
        expect(calledArg.stages.map(s => s.order_index)).toEqual([0, 1, 2, 3]);

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/crm/pipelines/10/stages/reorder'),
            expect.objectContaining({
                method: 'PUT',
                body: JSON.stringify({ stage_ids: [4, 1, 2, 3] })
            })
        );
        expect(toast.success).toHaveBeenCalledWith('Coluna "Venda" reposicionada com sucesso!');
    });

    it('deve reverter para o estado anterior caso a API retorne erro', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 500
        });

        const initialStages = [
            { id: 1, name: 'Prospect', order_index: 0 },
            { id: 2, name: 'Lead', order_index: 1 }
        ];

        const setBoardData = vi.fn();
        const initialBoard = { id: 10, stages: initialStages };

        const { result } = renderHook(() =>
            useStageReorder({
                boardData: initialBoard,
                setBoardData,
                selectedPipelineId: 10,
                clientId: 1
            })
        );

        await act(async () => {
            await result.current.handleMoveStage(2, 1);
        });

        // 1ª chamada: otimista; 2ª chamada: rollback com initialBoard
        expect(setBoardData).toHaveBeenCalledTimes(2);
        expect(setBoardData).toHaveBeenLastCalledWith(initialBoard);
        expect(toast.error).toHaveBeenCalledWith('Erro ao salvar nova posição da coluna.');
    });

    it('não deve fazer nada se os IDs de origem e destino forem iguais', async () => {
        const setBoardData = vi.fn();
        const { result } = renderHook(() =>
            useStageReorder({
                boardData: { id: 10, stages: [{ id: 1 }, { id: 2 }] },
                setBoardData,
                selectedPipelineId: 10,
                clientId: 1
            })
        );

        await act(async () => {
            await result.current.handleMoveStage(1, 1);
        });

        expect(setBoardData).not.toHaveBeenCalled();
        expect(global.fetch).not.toHaveBeenCalled();
    });
});

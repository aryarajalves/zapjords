import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { resolveUrl } from '../../../config';

export function useStageReorder({
    boardData,
    setBoardData,
    selectedPipelineId,
    clientId
}) {
    const [draggedStageId, setDraggedStageId] = useState(null);

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            'X-Client-ID': clientId ? String(clientId) : ''
        };
    }, [clientId]);

    const handleStageDragStart = useCallback((stageId) => {
        setDraggedStageId(stageId);
    }, []);

    const handleStageDragEnd = useCallback(() => {
        setDraggedStageId(null);
    }, []);

    const handleMoveStage = useCallback(async (sourceStageId, targetStageId) => {
        if (!boardData?.stages || !selectedPipelineId) return;
        if (sourceStageId === targetStageId) return;

        const currentStages = [...boardData.stages];
        const fromIndex = currentStages.findIndex(s => s.id === sourceStageId);
        const toIndex = currentStages.findIndex(s => s.id === targetStageId);

        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

        // Move o item de fromIndex para toIndex
        const [movedStage] = currentStages.splice(fromIndex, 1);
        currentStages.splice(toIndex, 0, movedStage);

        const updatedStages = currentStages.map((stage, idx) => ({
            ...stage,
            order_index: idx
        }));

        // Atualização otimista imediata na interface
        const previousBoard = boardData;
        setBoardData({
            ...boardData,
            stages: updatedStages
        });
        setDraggedStageId(null);

        try {
            const stageIds = updatedStages.map(s => s.id);
            const res = await fetch(resolveUrl(`/api/crm/pipelines/${selectedPipelineId}/stages/reorder`), {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ stage_ids: stageIds })
            });

            if (!res.ok) {
                throw new Error('Falha na resposta do servidor');
            }
            toast.success(`Coluna "${movedStage.name}" reposicionada com sucesso!`);
        } catch (err) {
            console.error('Erro ao reordenar colunas:', err);
            toast.error('Erro ao salvar nova posição da coluna.');
            setBoardData(previousBoard);
        }
    }, [boardData, selectedPipelineId, setBoardData, getAuthHeaders]);

    return {
        draggedStageId,
        handleStageDragStart,
        handleStageDragEnd,
        handleMoveStage
    };
}

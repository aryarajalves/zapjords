import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { resolveUrl } from '../../../config';
import { useClient } from '../../../contexts/ClientContext';
import { filterKanbanStages, apiRequestJson } from '../utils/kanbanApiActions';

export function useSalesKanban({ onViewChange, products = [] }) {
    const { activeClient } = useClient();
    const clientId = activeClient?.id;

    const [pipelines, setPipelines] = useState([]);

    const [selectedPipelineId, setSelectedPipelineId] = useState(() => {
        if (typeof window === 'undefined' || !clientId) return null;
        try {
            const saved = localStorage.getItem('kanban_selected_pipeline_' + clientId);
            return saved ? Number(saved) : null;
        } catch {
            return null;
        }
    });
    const [boardData, setBoardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBoardLoading, setIsBoardLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterWindowOpenOnly, setFilterWindowOpenOnly] = useState(false);
    const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
    const [filterProduct, setFilterProduct] = useState('all');

    // Modais
    const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
    const [pipelineToEdit, setPipelineToEdit] = useState(null);
    const [isDealModalOpen, setIsDealModalOpen] = useState(false);
    const [dealToEdit, setDealToEdit] = useState(null);
    const [initialStageForNewDeal, setInitialStageForNewDeal] = useState(null);
    const [isStageModalOpen, setIsStageModalOpen] = useState(false);
    const [stageToEdit, setStageToEdit] = useState(null);
    const [lostReasonModal, setLostReasonModal] = useState({ isOpen: false, deal: null, targetStageId: null });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null, title: '', message: '' });

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            'X-Client-ID': clientId ? String(clientId) : ''
        };
    }, [clientId]);

    const fetchPipelines = useCallback(async () => {
        if (!clientId) return;
        try {
            setIsLoading(true);
            const data = await apiRequestJson('/api/crm/pipelines', 'GET', getAuthHeaders(), undefined, 'Falha ao carregar pipelines');
            setPipelines(data);

            if (data.length > 0) {
                setSelectedPipelineId(prev => {
                    if (prev && data.some(p => p.id === prev)) return prev;
                    try {
                        const saved = localStorage.getItem('kanban_selected_pipeline_' + clientId);
                        const savedId = saved ? Number(saved) : null;
                        if (savedId && data.some(p => p.id === savedId)) return savedId;
                    } catch {
                        // ignore
                    }
                    const defaultPipe = data.find(p => p.is_default) || data[0];
                    return defaultPipe.id;
                });
            }
        } catch (err) {
            console.error('Erro ao buscar pipelines:', err);
            toast.error('Não foi possível carregar os pipelines de vendas.');
        } finally {
            setIsLoading(false);
        }
    }, [clientId, getAuthHeaders]);

    const fetchBoard = useCallback(async (pipelineId) => {
        if (!clientId || !pipelineId) return;
        try {
            setIsBoardLoading(true);
            const data = await apiRequestJson(`/api/crm/pipelines/${pipelineId}/board`, 'GET', getAuthHeaders(), undefined, 'Falha ao carregar quadro');
            setBoardData(data);
        } catch (err) {
            console.error('Erro ao carregar quadro do CRM:', err);
            toast.error('Erro ao carregar colunas do Kanban.');
        } finally {
            setIsBoardLoading(false);
        }
    }, [clientId, getAuthHeaders]);

    useEffect(() => {
        fetchPipelines();
    }, [fetchPipelines]);

    useEffect(() => {
        if (selectedPipelineId) {
            fetchBoard(selectedPipelineId);
            try {
                if (clientId) {
                    localStorage.setItem('kanban_selected_pipeline_' + clientId, String(selectedPipelineId));
                }
            } catch {
                // ignore
            }
        }
    }, [selectedPipelineId, fetchBoard, clientId]);

    const handleMoveDeal = async (dealId, targetStageId, optionalLostReason = null) => {
        if (!boardData) return;

        // Se o card já está na mesma coluna (mesmo estágio), não atualiza nada
        let currentStageId = null;
        let foundDeal = null;
        for (const stg of boardData.stages || []) {
            const d = stg.deals?.find(item => item.id === dealId);
            if (d) {
                foundDeal = d;
                currentStageId = stg.id;
                break;
            }
        }

        if (currentStageId !== null && Number(currentStageId) === Number(targetStageId)) {
            return;
        }

        const targetStage = boardData.stages?.find(s => s.id === targetStageId);
        const isLostStage = targetStage && (
            targetStage.stage_type === 'lost' ||
            targetStage.name.toLowerCase().includes('desistencia') ||
            targetStage.name.toLowerCase().includes('desistência') ||
            targetStage.name.toLowerCase().includes('perdido')
        );

        if (isLostStage && optionalLostReason === null) {
            if (foundDeal) {
                setLostReasonModal({ isOpen: true, deal: foundDeal, targetStageId });
                return;
            }
        }

        setLostReasonModal({ isOpen: false, deal: null, targetStageId: null });

        setBoardData(prev => {
            if (!prev) return prev;
            let movedDeal = null;
            const updatedStages = prev.stages.map(stage => {
                const filtered = stage.deals.filter(d => {
                    if (d.id === dealId) {
                        movedDeal = {
                            ...d,
                            stage_id: targetStageId,
                            lost_reason: optionalLostReason !== null ? optionalLostReason : d.lost_reason,
                            status: isLostStage ? 'lost' : d.status
                        };
                        return false;
                    }
                    return true;
                });
                return { ...stage, deals: filtered };
            });

            if (movedDeal) {
                const finalStages = updatedStages.map(stage => (
                    stage.id === targetStageId ? { ...stage, deals: [movedDeal, ...stage.deals] } : stage
                ));
                return { ...prev, stages: finalStages };
            }
            return prev;
        });

        try {
            const bodyPayload = { stage_id: targetStageId };
            if (optionalLostReason !== null && optionalLostReason !== undefined) {
                bodyPayload.lost_reason = optionalLostReason;
            }
            const res = await fetch(resolveUrl(`/api/crm/deals/${dealId}/move`), {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify(bodyPayload)
            });
            if (!res.ok) throw new Error('Falha ao mover card');
            await res.json();
            toast.success('Oportunidade atualizada!');
            if (selectedPipelineId) fetchBoard(selectedPipelineId);
        } catch (err) {
            console.error('Erro ao mover deal:', err);
            toast.error('Erro ao salvar movimentação da oportunidade.');
            if (selectedPipelineId) fetchBoard(selectedPipelineId);
        }
    };

    const handleConfirmLostReason = (lostReasonText) => {
        if (lostReasonModal.deal && lostReasonModal.targetStageId) {
            handleMoveDeal(lostReasonModal.deal.id, lostReasonModal.targetStageId, lostReasonText || 'Desistência informada');
        }
    };

    const handleSyncHistory = async () => {
        if (!selectedPipelineId) return;
        setIsSyncing(true);
        try {
            const result = await apiRequestJson(`/api/crm/pipelines/${selectedPipelineId}/sync-history`, 'POST', getAuthHeaders(), undefined, 'Falha ao sincronizar');
            toast.success(result.message || 'Histórico sincronizado com sucesso!');
            fetchBoard(selectedPipelineId);
            fetchPipelines();
        } catch (err) {
            console.error('Erro na sincronização:', err);
            toast.error('Erro ao puxar histórico retroativo de leads.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSavePipeline = async (payload) => {
        try {
            const isEditing = Boolean(pipelineToEdit?.id);
            const path = isEditing ? `/api/crm/pipelines/${pipelineToEdit.id}` : '/api/crm/pipelines';
            const saved = await apiRequestJson(path, isEditing ? 'PUT' : 'POST', getAuthHeaders(), payload, isEditing ? 'Falha ao atualizar pipeline' : 'Falha ao criar pipeline');
            toast.success(isEditing ? 'Pipeline atualizado!' : 'Novo Pipeline de Vendas criado com sucesso!');
            setIsPipelineModalOpen(false);
            setPipelineToEdit(null);
            await fetchPipelines();
            setSelectedPipelineId(saved.id);
        } catch (err) {
            console.error('Erro ao salvar pipeline:', err);
            toast.error(err.message || 'Não foi possível salvar o pipeline de produto.');
        }
    };

    const handleDeletePipeline = async (pipelineId) => {
        try {
            await apiRequestJson(`/api/crm/pipelines/${pipelineId}`, 'DELETE', getAuthHeaders(), undefined, 'Falha ao excluir pipeline');
            toast.success('Pipeline excluído com sucesso.');
            setDeleteModal({ isOpen: false, type: null, id: null, title: '', message: '' });
            await fetchPipelines();
        } catch (err) {
            console.error('Erro ao excluir pipeline:', err);
            toast.error(err.message || 'Erro ao excluir pipeline.');
        }
    };

    const handleSaveDeal = async (payload) => {
        try {
            const isEditing = Boolean(dealToEdit?.id);
            const path = isEditing ? `/api/crm/deals/${dealToEdit.id}` : '/api/crm/deals';
            await apiRequestJson(path, isEditing ? 'PUT' : 'POST', getAuthHeaders(), payload, 'Falha ao salvar oportunidade');
            toast.success(isEditing ? 'Oportunidade atualizada!' : 'Oportunidade criada com sucesso!');
            setIsDealModalOpen(false);
            setDealToEdit(null);
            if (selectedPipelineId) fetchBoard(selectedPipelineId);
        } catch (err) {
            console.error('Erro ao salvar deal:', err);
            toast.error(err.message || 'Não foi possível salvar a oportunidade.');
        }
    };

    const handleDeleteDeal = async (dealId) => {
        try {
            await apiRequestJson(`/api/crm/deals/${dealId}`, 'DELETE', getAuthHeaders(), undefined, 'Falha ao excluir deal');
            toast.success('Oportunidade removida.');
            setDeleteModal({ isOpen: false, type: null, id: null, title: '', message: '' });
            if (selectedPipelineId) fetchBoard(selectedPipelineId);
        } catch (err) {
            console.error('Erro ao excluir deal:', err);
            toast.error('Erro ao excluir oportunidade.');
        }
    };

    const handleSaveStage = async (payload, stageId = null) => {
        try {
            const isEditing = Boolean(stageId);
            const path = isEditing ? `/api/crm/stages/${stageId}` : '/api/crm/stages';
            await apiRequestJson(path, isEditing ? 'PUT' : 'POST', getAuthHeaders(), payload, 'Falha ao salvar coluna');
            toast.success(isEditing ? 'Coluna atualizada!' : 'Nova coluna criada com sucesso!');
            setIsStageModalOpen(false);
            setStageToEdit(null);
            if (selectedPipelineId) fetchBoard(selectedPipelineId);
        } catch (err) {
            console.error('Erro ao salvar coluna:', err);
            toast.error(err.message || 'Não foi possível salvar a coluna.');
        }
    };

    const handleDeleteStage = async (stageId) => {
        try {
            await apiRequestJson(`/api/crm/stages/${stageId}`, 'DELETE', getAuthHeaders(), undefined, 'Falha ao excluir coluna');
            toast.success('Coluna excluída com sucesso.');
            setDeleteModal({ isOpen: false, type: null, id: null, title: '', message: '' });
            setIsStageModalOpen(false);
            setStageToEdit(null);
            if (selectedPipelineId) fetchBoard(selectedPipelineId);
        } catch (err) {
            console.error('Erro ao excluir coluna:', err);
            toast.error('Erro ao excluir coluna.');
        }
    };

    const handleOpenChat = (phone, contactName = '') => {
        if (!phone) return;
        localStorage.setItem('crm_target_chat_phone', phone);
        if (contactName) {
            localStorage.setItem('crm_target_chat_name', contactName);
        }
        if (onViewChange) {
            onViewChange('chat_conversations');
        }
        window.dispatchEvent(new CustomEvent('navigate-view', { detail: 'chat_conversations' }));
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('select-chat-convo', {
                detail: { phone, contact_name: contactName }
            }));
        }, 150);
    };

    const filteredStages = useMemo(() => {
        return filterKanbanStages(boardData, searchTerm, filterWindowOpenOnly, filterUnreadOnly, null, filterProduct, products);
    }, [boardData, searchTerm, filterWindowOpenOnly, filterUnreadOnly, filterProduct, products]);

    return {
        pipelines,
        selectedPipelineId,
        setSelectedPipelineId,
        boardData,
        setBoardData,
        filteredStages,
        isLoading,
        isBoardLoading,
        isSyncing,
        searchTerm,
        setSearchTerm,
        filterWindowOpenOnly,
        setFilterWindowOpenOnly,
        filterUnreadOnly,
        setFilterUnreadOnly,
        filterProduct,
        setFilterProduct,
        isPipelineModalOpen,
        setIsPipelineModalOpen,
        pipelineToEdit,
        setPipelineToEdit,
        isDealModalOpen,
        setIsDealModalOpen,
        dealToEdit,
        setDealToEdit,
        initialStageForNewDeal,
        setInitialStageForNewDeal,
        isStageModalOpen,
        setIsStageModalOpen,
        stageToEdit,
        setStageToEdit,
        deleteModal,
        setDeleteModal,
        lostReasonModal,
        setLostReasonModal,
        handleConfirmLostReason,
        handleMoveDeal,
        handleSyncHistory,
        handleSavePipeline,
        handleDeletePipeline,
        handleSaveDeal,
        handleDeleteDeal,
        handleSaveStage,
        handleDeleteStage,
        handleOpenChat,
        fetchBoard
    };
}

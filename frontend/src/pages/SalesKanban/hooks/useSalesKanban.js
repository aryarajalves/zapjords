import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { resolveUrl } from '../../../config';
import { useClient } from '../../../contexts/ClientContext';

export function useSalesKanban({ onViewChange }) {
    const { activeClient } = useClient();
    const clientId = activeClient?.id;

    const [pipelines, setPipelines] = useState([]);
    const [selectedPipelineId, setSelectedPipelineId] = useState(null);
    const [boardData, setBoardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Modais
    const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
    const [pipelineToEdit, setPipelineToEdit] = useState(null);
    const [isDealModalOpen, setIsDealModalOpen] = useState(false);
    const [dealToEdit, setDealToEdit] = useState(null);
    const [initialStageForNewDeal, setInitialStageForNewDeal] = useState(null);

    // Modal de Coluna / Estágio
    const [isStageModalOpen, setIsStageModalOpen] = useState(false);
    const [stageToEdit, setStageToEdit] = useState(null);

    // Modal de Motivo de Desistência
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

    // Buscar lista de pipelines
    const fetchPipelines = useCallback(async () => {
        if (!clientId) return;
        try {
            setIsLoading(true);
            const res = await fetch(resolveUrl('/api/crm/pipelines'), {
                headers: getAuthHeaders()
            });
            if (!res.ok) throw new Error('Falha ao carregar pipelines');
            const data = await res.json();
            setPipelines(data);

            if (data.length > 0) {
                // Manter o selecionado se ainda existir, ou selecionar o primeiro
                setSelectedPipelineId(prev => {
                    const exists = data.some(p => p.id === prev);
                    return exists ? prev : data[0].id;
                });
            }
        } catch (err) {
            console.error('Erro ao buscar pipelines:', err);
            toast.error('Não foi possível carregar os pipelines de vendas.');
        } finally {
            setIsLoading(false);
        }
    }, [clientId, getAuthHeaders]);

    // Buscar quadro do pipeline selecionado
    const fetchBoard = useCallback(async (pipelineId) => {
        if (!clientId || !pipelineId) return;
        try {
            const res = await fetch(resolveUrl(`/api/crm/pipelines/${pipelineId}/board`), {
                headers: getAuthHeaders()
            });
            if (!res.ok) throw new Error('Falha ao carregar quadro');
            const data = await res.json();
            setBoardData(data);
        } catch (err) {
            console.error('Erro ao carregar quadro do CRM:', err);
            toast.error('Erro ao carregar colunas do Kanban.');
        }
    }, [clientId, getAuthHeaders]);

    useEffect(() => {
        fetchPipelines();
    }, [fetchPipelines]);

    useEffect(() => {
        if (selectedPipelineId) {
            fetchBoard(selectedPipelineId);
        }
    }, [selectedPipelineId, fetchBoard]);

    // Movimentação de Deal (Drag & Drop)
    const handleMoveDeal = async (dealId, targetStageId, optionalLostReason = null) => {
        if (!boardData) return;

        // Verifica se a etapa de destino é de desistência e se ainda não há motivo fornecido
        const targetStage = boardData.stages?.find(s => s.id === targetStageId);
        const isLostStage = targetStage && (
            targetStage.stage_type === 'lost' ||
            targetStage.name.toLowerCase().includes('desistencia') ||
            targetStage.name.toLowerCase().includes('desistência') ||
            targetStage.name.toLowerCase().includes('perdido')
        );

        if (isLostStage && optionalLostReason === null) {
            let foundDeal = null;
            for (const stg of boardData.stages) {
                const d = stg.deals?.find(item => item.id === dealId);
                if (d) {
                    foundDeal = d;
                    break;
                }
            }
            if (foundDeal) {
                setLostReasonModal({
                    isOpen: true,
                    deal: foundDeal,
                    targetStageId
                });
                return;
            }
        }

        // Fecha modal se estava aberto
        setLostReasonModal({ isOpen: false, deal: null, targetStageId: null });

        // Otimistic update no state local
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
                const finalStages = updatedStages.map(stage => {
                    if (stage.id === targetStageId) {
                        return { ...stage, deals: [movedDeal, ...stage.deals] };
                    }
                    return stage;
                });
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
            // Re-sincronizar board com métricas
            if (selectedPipelineId) fetchBoard(selectedPipelineId);
        } catch (err) {
            console.error('Erro ao mover deal:', err);
            toast.error('Erro ao salvar movimentação da oportunidade.');
            if (selectedPipelineId) fetchBoard(selectedPipelineId);
        }
    };

    const handleConfirmLostReason = (lostReasonText) => {
        if (lostReasonModal.deal && lostReasonModal.targetStageId) {
            handleMoveDeal(
                lostReasonModal.deal.id,
                lostReasonModal.targetStageId,
                lostReasonText || 'Desistência informada'
            );
        }
    };

    // Sincronizar Histórico Retroativo
    const handleSyncHistory = async () => {
        if (!selectedPipelineId) return;
        setIsSyncing(true);
        try {
            const res = await fetch(resolveUrl(`/api/crm/pipelines/${selectedPipelineId}/sync-history`), {
                method: 'POST',
                headers: getAuthHeaders()
            });
            if (!res.ok) throw new Error('Falha ao sincronizar');
            const result = await res.json();
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

    // Salvar / Criar Pipeline
    const handleSavePipeline = async (payload) => {
        try {
            const isEditing = Boolean(pipelineToEdit?.id);
            const url = isEditing
                ? resolveUrl(`/api/crm/pipelines/${pipelineToEdit.id}`)
                : resolveUrl('/api/crm/pipelines');
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || (isEditing ? 'Falha ao atualizar pipeline' : 'Falha ao criar pipeline'));
            }
            const saved = await res.json();
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

    // Deletar Pipeline
    const handleDeletePipeline = async (pipelineId) => {
        try {
            const res = await fetch(resolveUrl(`/api/crm/pipelines/${pipelineId}`), {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || 'Falha ao excluir pipeline');
            }
            toast.success('Pipeline excluído com sucesso.');
            setDeleteModal({ isOpen: false, type: null, id: null, title: '', message: '' });
            await fetchPipelines();
        } catch (err) {
            console.error('Erro ao excluir pipeline:', err);
            toast.error(err.message || 'Erro ao excluir pipeline.');
        }
    };

    // Salvar Deal (Criar ou Editar)
    const handleSaveDeal = async (payload) => {
        try {
            const isEditing = Boolean(dealToEdit?.id);
            const url = isEditing
                ? resolveUrl(`/api/crm/deals/${dealToEdit.id}`)
                : resolveUrl('/api/crm/deals');
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || 'Falha ao salvar oportunidade');
            }
            toast.success(isEditing ? 'Oportunidade atualizada!' : 'Oportunidade criada com sucesso!');
            setIsDealModalOpen(false);
            setDealToEdit(null);
            if (selectedPipelineId) fetchBoard(selectedPipelineId);
        } catch (err) {
            console.error('Erro ao salvar deal:', err);
            toast.error(err.message || 'Não foi possível salvar a oportunidade.');
        }
    };

    // Deletar Deal
    const handleDeleteDeal = async (dealId) => {
        try {
            const res = await fetch(resolveUrl(`/api/crm/deals/${dealId}`), {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!res.ok) throw new Error('Falha ao excluir deal');
            toast.success('Oportunidade removida.');
            setDeleteModal({ isOpen: false, type: null, id: null, title: '', message: '' });
            if (selectedPipelineId) fetchBoard(selectedPipelineId);
        } catch (err) {
            console.error('Erro ao excluir deal:', err);
            toast.error('Erro ao excluir oportunidade.');
        }
    };

    // Salvar / Criar Coluna (Stage)
    const handleSaveStage = async (payload, stageId = null) => {
        try {
            const isEditing = Boolean(stageId);
            const url = isEditing
                ? resolveUrl(`/api/crm/stages/${stageId}`)
                : resolveUrl('/api/crm/stages');
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || 'Falha ao salvar coluna');
            }
            toast.success(isEditing ? 'Coluna atualizada!' : 'Nova coluna criada com sucesso!');
            setIsStageModalOpen(false);
            setStageToEdit(null);
            if (selectedPipelineId) fetchBoard(selectedPipelineId);
        } catch (err) {
            console.error('Erro ao salvar coluna:', err);
            toast.error(err.message || 'Não foi possível salvar a coluna.');
        }
    };

    // Deletar Coluna (Stage)
    const handleDeleteStage = async (stageId) => {
        try {
            const res = await fetch(resolveUrl(`/api/crm/stages/${stageId}`), {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!res.ok) throw new Error('Falha ao excluir coluna');
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

    // Ação Rápida: Abrir conversa no Chat com o contato
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

    // Filtragem de deals por termo de busca
    const filteredStages = useMemo(() => {
        if (!boardData?.stages) return [];
        if (!searchTerm.trim()) return boardData.stages;

        const term = searchTerm.toLowerCase().trim();
        return boardData.stages.map(stage => {
            const filteredDeals = stage.deals.filter(deal => {
                const name = (deal.contact_name || '').toLowerCase();
                const phone = (deal.contact_phone || '').toLowerCase();
                const title = (deal.title || '').toLowerCase();
                const email = (deal.contact_email || '').toLowerCase();
                const channelStr = (deal.channel || '').toLowerCase();
                return name.includes(term) || phone.includes(term) || title.includes(term) || email.includes(term) || channelStr.includes(term);
            });
            return {
                ...stage,
                deals: filteredDeals,
                total_deals: filteredDeals.length,
                total_value: filteredDeals.reduce((acc, cur) => acc + (cur.value || 0), 0)
            };
        });
    }, [boardData, searchTerm]);

    return {
        pipelines,
        selectedPipelineId,
        setSelectedPipelineId,
        boardData,
        filteredStages,
        isLoading,
        isSyncing,
        searchTerm,
        setSearchTerm,
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

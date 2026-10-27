import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { resolveUrl } from '../../../config';

export function useBulkDeals({ clientId, selectedPipelineId, onRefreshBoard, setDeleteModal }) {
    const [selectedDealIds, setSelectedDealIds] = useState([]);
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [isProcessingBulk, setIsProcessingBulk] = useState(false);

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            'X-Client-ID': clientId ? String(clientId) : ''
        };
    }, [clientId]);

    const toggleSelectDeal = useCallback((dealId) => {
        setSelectedDealIds(prev =>
            prev.includes(dealId) ? prev.filter(id => id !== dealId) : [...prev, dealId]
        );
    }, []);

    const selectAllDeals = useCallback((allIds) => {
        setSelectedDealIds(Array.isArray(allIds) ? allIds : []);
    }, []);

    const toggleSelectStage = useCallback((stageDealIds) => {
        if (!Array.isArray(stageDealIds) || stageDealIds.length === 0) return;
        setSelectedDealIds(prev => {
            const allSelectedInStage = stageDealIds.every(id => prev.includes(id));
            if (allSelectedInStage) {
                // Desmarca todos os da coluna
                return prev.filter(id => !stageDealIds.includes(id));
            } else {
                // Marca todos os da coluna mantendo os que já estavam selecionados
                return Array.from(new Set([...prev, ...stageDealIds]));
            }
        });
    }, []);

    const clearSelectedDeals = useCallback(() => {
        setSelectedDealIds([]);
    }, []);

    const openBulkDeleteConfirm = useCallback(() => {
        if (!selectedDealIds || selectedDealIds.length === 0) return;
        setDeleteModal({
            isOpen: true,
            type: 'bulk_deals',
            id: null,
            title: `Remover ${selectedDealIds.length} ${selectedDealIds.length === 1 ? 'Contato' : 'Contatos'}?`,
            message: `Tem certeza que deseja remover os ${selectedDealIds.length} contatos selecionados deste Kanban? Esta ação não pode ser desfeita.`
        });
    }, [selectedDealIds, setDeleteModal]);

    const handleBulkDeleteDeals = useCallback(async () => {
        if (!selectedDealIds || selectedDealIds.length === 0) return;
        try {
            setIsProcessingBulk(true);
            const res = await fetch(resolveUrl('/api/crm/deals/bulk-delete'), {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ deal_ids: selectedDealIds })
            });
            if (!res.ok) throw new Error('Falha ao excluir contatos em massa');
            const data = await res.json();
            toast.success(data.message || `${selectedDealIds.length} contatos removidos do Kanban.`);
            clearSelectedDeals();
            if (setDeleteModal) {
                setDeleteModal({ isOpen: false, type: null, id: null, title: '', message: '' });
            }
            if (onRefreshBoard && selectedPipelineId) {
                await onRefreshBoard(selectedPipelineId);
            }
        } catch (err) {
            console.error('Erro ao excluir contatos em massa:', err);
            toast.error('Não foi possível remover os contatos selecionados.');
        } finally {
            setIsProcessingBulk(false);
        }
    }, [selectedDealIds, getAuthHeaders, clearSelectedDeals, setDeleteModal, onRefreshBoard, selectedPipelineId]);

    const handleBulkUpdateDeals = useCallback(async (payload) => {
        if (!selectedDealIds || selectedDealIds.length === 0) return;
        try {
            setIsProcessingBulk(true);
            const res = await fetch(resolveUrl('/api/crm/deals/bulk-update'), {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    deal_ids: selectedDealIds,
                    update_product: Boolean(payload.update_product),
                    product_id: payload.product_id,
                    product_name: payload.product_name,
                    update_value: Boolean(payload.update_value),
                    value: payload.value
                })
            });
            if (!res.ok) throw new Error('Falha ao atualizar contatos em massa');
            const data = await res.json();
            toast.success(data.message || `${selectedDealIds.length} contatos atualizados com sucesso!`);
            clearSelectedDeals();
            setIsBulkEditModalOpen(false);
            if (onRefreshBoard && selectedPipelineId) {
                await onRefreshBoard(selectedPipelineId);
            }
        } catch (err) {
            console.error('Erro ao atualizar contatos em massa:', err);
            toast.error('Não foi possível atualizar os contatos selecionados.');
        } finally {
            setIsProcessingBulk(false);
        }
    }, [selectedDealIds, getAuthHeaders, clearSelectedDeals, onRefreshBoard, selectedPipelineId]);

    return {
        selectedDealIds,
        isBulkEditModalOpen,
        setIsBulkEditModalOpen,
        isProcessingBulk,
        toggleSelectDeal,
        selectAllDeals,
        toggleSelectStage,
        clearSelectedDeals,
        openBulkDeleteConfirm,
        handleBulkDeleteDeals,
        handleBulkUpdateDeals
    };
}

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { fetchWithAuth } from '../../../AuthContext';
import { API_URL } from '../../../config';

export function useUserSelection({ filteredUsers = [], fetchUsers }) {
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);

    // Alternar seleção de um usuário individual (ignora super_admin)
    const handleToggleSelectUser = useCallback((user) => {
        if (!user || user.role === 'super_admin') return;

        setSelectedUserIds((prev) => {
            if (prev.includes(user.id)) {
                return prev.filter((id) => id !== user.id);
            } else {
                return [...prev, user.id];
            }
        });
    }, []);

    // Selecionar ou desmarcar todos os usuários visíveis da página (apenas elegíveis)
    const handleToggleSelectAllVisible = useCallback((visibleUsers = []) => {
        const eligibleUsers = visibleUsers.filter((u) => u.role !== 'super_admin');
        const eligibleIds = eligibleUsers.map((u) => u.id);

        if (eligibleIds.length === 0) return;

        setSelectedUserIds((prev) => {
            const allSelected = eligibleIds.every((id) => prev.includes(id));
            if (allSelected) {
                // Desmarca apenas os visíveis da página
                return prev.filter((id) => !eligibleIds.includes(id));
            } else {
                // Adiciona os que ainda não estavam selecionados
                const newIds = eligibleIds.filter((id) => !prev.includes(id));
                return [...prev, ...newIds];
            }
        });
    }, []);

    // Selecionar todos os usuários filtrados elegíveis de todas as páginas
    const handleSelectAllFiltered = useCallback(() => {
        const allEligible = filteredUsers
            .filter((u) => u.role !== 'super_admin')
            .map((u) => u.id);

        setSelectedUserIds(allEligible);
        toast.success(`${allEligible.length} usuário(s) selecionado(s).`);
    }, [filteredUsers]);

    // Limpar toda a seleção
    const handleClearSelection = useCallback(() => {
        setSelectedUserIds([]);
    }, []);

    // Abrir modal de confirmação para exclusão em lote
    const confirmBulkDelete = useCallback(() => {
        if (selectedUserIds.length === 0) return;
        setIsBulkDeleteModalOpen(true);
    }, [selectedUserIds.length]);

    // Executar exclusão em lote via API
    const handleBulkDeleteUsers = useCallback(async () => {
        if (selectedUserIds.length === 0) return;

        setIsDeletingBulk(true);
        const count = selectedUserIds.length;
        const loadingToast = toast.loading(`Excluindo ${count} usuário(s)...`);

        try {
            const res = await fetchWithAuth(`${API_URL}/auth/users/bulk-delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_ids: selectedUserIds })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || 'Erro ao excluir usuários em lote.');
            }

            toast.dismiss(loadingToast);
            toast.success(data.message || `${count} usuário(s) excluído(s) com sucesso!`);
            
            setSelectedUserIds([]);
            setIsBulkDeleteModalOpen(false);

            if (fetchUsers) {
                await fetchUsers();
            }
        } catch (err) {
            toast.dismiss(loadingToast);
            console.error('Erro ao excluir usuários em massa:', err);
            toast.error(err.message || 'Falha na exclusão dos usuários selecionados.');
        } finally {
            setIsDeletingBulk(false);
        }
    }, [selectedUserIds, fetchUsers]);

    return {
        selectedUserIds,
        setSelectedUserIds,
        isBulkDeleteModalOpen,
        setIsBulkDeleteModalOpen,
        isDeletingBulk,
        handleToggleSelectUser,
        handleToggleSelectAllVisible,
        handleSelectAllFiltered,
        handleClearSelection,
        confirmBulkDelete,
        handleBulkDeleteUsers
    };
}

import React from 'react';
import ConfirmModal from '../../../components/ConfirmModal';

const UsersDeleteModals = ({
    isDeleteModalOpen,
    onCloseDeleteUser,
    onConfirmDeleteUser,
    userToDelete,
    isDeleteInviteModalOpen,
    onCloseDeleteInvite,
    onConfirmDeleteInvite,
    isBulkDeleteModalOpen,
    onCloseBulkDelete,
    onConfirmBulkDelete,
    bulkDeleteCount = 0
}) => {
    return (
        <>
            {/* Modal de Exclusão Individual */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={onCloseDeleteUser}
                onConfirm={onConfirmDeleteUser}
                title="Confirma a exclusão?"
                message={`Você está prestes a remover "${userToDelete?.full_name || userToDelete?.email}" do sistema. Esta ação é irreversível.`}
                confirmText="Sim, Excluir"
                isDangerous={true}
            />

            {/* Modal de Revogação de Convite */}
            <ConfirmModal
                isOpen={isDeleteInviteModalOpen}
                onClose={onCloseDeleteInvite}
                onConfirm={onConfirmDeleteInvite}
                title="Revogar Link de Convite?"
                message="Você está prestes a revogar este link de convite. Ninguém poderá utilizá-lo para se cadastrar. Esta ação é irreversível."
                confirmText="Sim, Revogar"
                isDangerous={true}
            />

            {/* Modal de Exclusão em Lote */}
            <ConfirmModal
                isOpen={isBulkDeleteModalOpen}
                onClose={onCloseBulkDelete}
                onConfirm={onConfirmBulkDelete}
                title="Excluir Usuários Selecionados?"
                message={`Você está prestes a excluir permanentemente ${bulkDeleteCount} usuário(s) selecionado(s). O Super Administrador não será afetado. Esta ação é irreversível.`}
                confirmText={`Sim, Excluir (${bulkDeleteCount})`}
                isDangerous={true}
            />
        </>
    );
};

export default UsersDeleteModals;

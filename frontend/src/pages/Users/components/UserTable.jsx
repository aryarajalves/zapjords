import React from 'react';
import { FiShield, FiUser, FiUserPlus, FiCheck, FiX, FiEdit2, FiTrash2, FiPhone, FiClock } from 'react-icons/fi';
import TablePagination from './TablePagination';
import BulkUserActionBar from './BulkUserActionBar';

export const formatBrasiliaDateTime = (dateStr) => {
    if (!dateStr) return { date: '—', time: '—' };
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return { date: '—', time: '—' };

        const date = d.toLocaleDateString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const time = d.toLocaleTimeString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        return { date, time };
    } catch {
        return { date: '—', time: '—' };
    }
};

const UserTable = ({
    users,
    handleOpenEditModal,
    confirmDeleteUser,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    selectedUserIds = [],
    handleToggleSelectUser = () => {},
    handleToggleSelectAllVisible = () => {},
    handleSelectAllFiltered = () => {},
    handleClearSelection = () => {},
    confirmBulkDelete = () => {},
    totalEligibleUsers = 0
}) => {
    const totalItems = users.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * itemsPerPage;
    const paginatedUsers = users.slice(startIndex, startIndex + itemsPerPage);

    // Usuários da página elegíveis para seleção (Super Admin é excluído por segurança)
    const eligibleInPage = paginatedUsers.filter((u) => u.role !== 'super_admin');
    const isAllPageSelected =
        eligibleInPage.length > 0 &&
        eligibleInPage.every((u) => selectedUserIds.includes(u.id));

    return (
        <div className="space-y-3">
            {/* Barra de Ação em Lote quando houver seleção */}
            <BulkUserActionBar
                selectedCount={selectedUserIds.length}
                totalEligibleUsers={totalEligibleUsers}
                onSelectAllFiltered={handleSelectAllFiltered}
                onClearSelection={handleClearSelection}
                onConfirmBulkDelete={confirmBulkDelete}
            />

            <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-gray-200 dark:border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-4 py-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        aria-label="Selecionar todos os usuários da página"
                                        checked={isAllPageSelected}
                                        onChange={() => handleToggleSelectAllVisible(paginatedUsers)}
                                        className="w-4 h-4 rounded border-gray-300 dark:border-white/20 bg-white dark:bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                                    />
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Nome / Email
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Cargo
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Criado em
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {paginatedUsers.length > 0 ? (
                                paginatedUsers.map((user) => {
                                    const isSuperAdmin = user.role === 'super_admin';
                                    const isSelected = selectedUserIds.includes(user.id);

                                    return (
                                        <tr
                                            key={user.id}
                                            className={`transition-colors group ${
                                                isSelected
                                                    ? 'bg-blue-50/60 dark:bg-blue-950/20'
                                                    : 'hover:bg-gray-50/50 dark:hover:bg-gray-700/30'
                                            }`}
                                        >
                                            {/* Checkbox de Seleção */}
                                            <td className="px-4 py-4 text-center">
                                                {isSuperAdmin ? (
                                                    <span
                                                        className="inline-flex items-center justify-center text-purple-400 opacity-60 cursor-not-allowed"
                                                        title="Super Administrador protegido contra exclusão"
                                                    >
                                                        <FiShield size={16} />
                                                    </span>
                                                ) : (
                                                    <input
                                                        type="checkbox"
                                                        aria-label={`Selecionar ${user.full_name || user.email}`}
                                                        checked={isSelected}
                                                        onChange={() => handleToggleSelectUser(user)}
                                                        className="w-4 h-4 rounded border-gray-300 dark:border-white/20 bg-white dark:bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                                                    />
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-800 dark:text-gray-200">
                                                    {user.full_name || 'Sem nome'}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {user.email}
                                                </div>
                                                {user.phone && (
                                                    <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5 font-medium">
                                                        <FiPhone size={11} /> {user.phone}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                        user.role === 'super_admin'
                                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                                                            : user.role === 'admin'
                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                                            : user.role === 'premium'
                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                                            : user.role === 'vendedor'
                                                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800'
                                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
                                                    }`}
                                                >
                                                    {user.role === 'super_admin' ? (
                                                        <FiShield size={12} />
                                                    ) : user.role === 'premium' ? (
                                                        <FiUserPlus size={12} />
                                                    ) : (
                                                        <FiUser size={12} />
                                                    )}
                                                    {user.role}{' '}
                                                    {user.role === 'vendedor'
                                                        ? `(Peso: ${user.seller_weight || 1})`
                                                        : ''}
                                                </span>
                                            </td>
                                            {/* Data e Horário de Criação (Horário de Brasília) */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                                    {formatBrasiliaDateTime(user.created_at).date}
                                                </div>
                                                <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                                                    <FiClock size={11} className="text-blue-500 dark:text-blue-400 shrink-0" />
                                                    <span>{formatBrasiliaDateTime(user.created_at).time}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.is_active ? (
                                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-bold">
                                                        <FiCheck /> ATIVO
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-bold">
                                                        <FiX /> INATIVO
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {!isSuperAdmin && (
                                                        <button
                                                            onClick={() => handleOpenEditModal(user)}
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                                            title="Editar Usuário"
                                                        >
                                                            <FiEdit2 size={18} />
                                                        </button>
                                                    )}
                                                    {!isSuperAdmin && (
                                                        <button
                                                            onClick={() => confirmDeleteUser(user)}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                                            title="Excluir Usuário"
                                                        >
                                                            <FiTrash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        Nenhum usuário encontrado com os filtros aplicados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <TablePagination
                    currentPage={safePage}
                    setCurrentPage={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                    totalItems={totalItems}
                />
            </div>
        </div>
    );
};

export default UserTable;

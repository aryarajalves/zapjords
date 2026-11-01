import React from 'react';
import { FiUnlock, FiMail, FiPhone } from 'react-icons/fi';

export default function ContactTable({ 
    contacts, 
    selectedIds, 
    toggleSelectRow, 
    toggleSelectAll, 
    isAllVisibleSelected,
    onUnblock,
    listTab
}) {
    const isResting = listTab === 'resting';

    const getRemainingTime = (expiresAt) => {
        if (!expiresAt) return 'Expirado';
        const now = new Date();
        const exp = new Date(expiresAt);
        const diffMs = exp - now;
        if (diffMs <= 0) return 'Expirado';

        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffHrs > 0) {
            return `${diffHrs}h ${diffMins}m`;
        }
        return `${diffMins}m`;
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-white/5 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-4 font-bold w-10">
                            <input
                                type="checkbox"
                                onChange={(e) => toggleSelectAll(e.target.checked)}
                                checked={isAllVisibleSelected}
                                className="rounded border-white/10 text-red-600 focus:ring-red-500 bg-white/5"
                            />
                        </th>
                        <th className="px-6 py-4 font-bold">Canal</th>
                        <th className="px-6 py-4 font-bold">Contato Bloqueado</th>
                        <th className="px-6 py-4 font-bold">Nome</th>
                        <th className="px-6 py-4 font-bold">Origem</th>
                        <th className="px-6 py-4 font-bold">Motivo</th>
                        <th className="px-6 py-4 font-bold">{isResting ? 'Tempo de Repouso' : 'Data/Hora Bloqueio'}</th>
                        <th className="px-6 py-4 font-bold text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {contacts.map((contact) => {
                        const hasEmail = Boolean(contact.email);
                        const hasPhone = Boolean(contact.phone);

                        return (
                            <tr 
                                key={contact.id} 
                                className={`hover:bg-white/5 transition-colors duration-200 ${selectedIds.has(contact.id) ? 'bg-red-500/10' : ''}`}
                            >
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(contact.id)}
                                        onChange={() => toggleSelectRow(contact.id)}
                                        className="rounded border-white/10 text-red-600 focus:ring-red-500 bg-white/5"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    {hasEmail && !hasPhone ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                            <FiMail size={13} /> E-mail
                                        </span>
                                    ) : hasPhone && !hasEmail ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            <FiPhone size={13} /> WhatsApp
                                        </span>
                                    ) : (
                                        <div className="flex flex-wrap gap-1">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                <FiPhone size={11} /> WhatsApp
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                                <FiMail size={11} /> E-mail
                                            </span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                                    <div className="flex flex-col gap-0.5">
                                        {hasEmail && (
                                            <span className="font-sans text-sky-400 text-xs flex items-center gap-1.5">
                                                <FiMail size={12} className="text-sky-400/80" /> {contact.email}
                                            </span>
                                        )}
                                        {hasPhone && (
                                            <span className="font-mono text-xs text-gray-200 flex items-center gap-1.5">
                                                <FiPhone size={12} className="text-emerald-400/80" /> {contact.phone}
                                            </span>
                                        )}
                                        {!hasEmail && !hasPhone && (
                                            <span className="text-gray-500 text-xs">-</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                    {contact.name || '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium text-amber-500/90 dark:text-amber-400/90">
                                    {isResting 
                                        ? (contact.resting_by_client_name || '-')
                                        : (contact.blocked_by_client_name || '-')
                                    }
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                        contact.reason === 'Manual' 
                                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                                            : contact.reason?.includes('Descadastro')
                                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                                    }`}>
                                        {contact.reason}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                                    {isResting ? (
                                        <span className="font-bold text-amber-500 flex flex-col">
                                            <span>⏰ {getRemainingTime(contact.expires_at)}</span>
                                            <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500">
                                                Expira: {new Date(contact.expires_at).toLocaleString('pt-BR', {
                                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </span>
                                    ) : (
                                        new Date(contact.created_at).toLocaleString('pt-BR', {
                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => onUnblock(contact.id)}
                                        className="text-emerald-400 hover:text-emerald-300 p-2 rounded-lg transition-all hover:bg-emerald-500/10"
                                        title={isResting ? 'Remover do Repouso' : 'Desbloquear Contato'}
                                    >
                                        <FiUnlock size={18} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

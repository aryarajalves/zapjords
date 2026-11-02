import React from 'react';
import { FiMessageSquare, FiX, FiHome, FiClock, FiLayers, FiUsers, FiGlobe, FiTrello } from 'react-icons/fi';

const NAV_SHORTCUTS = [
    { view: 'webhook_integrations', label: 'Integração Webhook', icon: FiGlobe, roles: ['super_admin', 'admin', 'premium'] },
    { view: 'bulk_sender', label: 'Disparo em Massa', icon: FiHome, roles: ['super_admin', 'admin', 'premium', 'vendedor'] },
    { view: 'history',     label: 'Histórico de Disparos', icon: FiClock, roles: ['super_admin', 'admin', 'premium', 'user', 'vendedor'] },
    { view: 'funnels',     label: 'Funis', icon: FiLayers, roles: ['super_admin', 'admin', 'premium'] },
    { view: 'sales_kanban', label: 'Kanban', icon: FiTrello, roles: ['super_admin', 'admin', 'premium', 'user', 'vendedor'] },
    { view: 'leads',       label: 'Contatos', icon: FiUsers, roles: ['super_admin', 'admin', 'premium', 'vendedor'] },
];

export default function ChatHeaderNav({ activeClient, user, onClose, onNavigate }) {
    const userRole = user?.role || 'user';
    const visibleShortcuts = NAV_SHORTCUTS.filter(s => s.roles.includes(userRole));

    return (
        <div
            data-testid="chat-header-nav"
            className="min-h-[3.5rem] sm:h-16 py-1.5 sm:py-0 border-b border-gray-200 dark:border-white/5 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 bg-white dark:bg-[#1e293b] shrink-0 overflow-hidden"
        >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 animate-pulse shrink-0">
                    <FiMessageSquare size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
                <div className="min-w-0 overflow-hidden">
                    <h2 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white tracking-tight truncate">Painel de Atendimento</h2>
                    {activeClient && <p className="text-[10px] text-gray-500 truncate">Cliente: {activeClient.name}</p>}
                </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar scrollbar-none py-0.5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {visibleShortcuts.map(s => {
                        const Icon = s.icon;
                        return (
                            <button
                                key={s.view}
                                type="button"
                                onClick={() => {
                                    if (s.view === 'bulk_sender' && onClose) {
                                        onClose();
                                    } else if (onNavigate) {
                                        onNavigate(s.view);
                                    }
                                }}
                                title={s.label}
                                className="hidden sm:flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 bg-gray-100 dark:bg-white/5 hover:bg-blue-500/10 text-gray-600 dark:text-gray-300 hover:text-blue-500 rounded-xl transition-colors duration-150 text-xs font-semibold cursor-pointer shrink-0 select-none"
                            >
                                <Icon size={14} />
                                <span className="hidden md:inline">{s.label}</span>
                            </button>
                        );
                    })}
                </div>
                {onClose && (
                    <button
                        type="button"
                        data-testid="chat-header-close-nav-btn"
                        onClick={onClose}
                        title="Fechar painel de atendimento"
                        aria-label="Fechar painel de atendimento"
                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors duration-150 shrink-0 cursor-pointer select-none relative z-10"
                    >
                        <FiX size={18} />
                    </button>
                )}
            </div>
        </div>
    );
}

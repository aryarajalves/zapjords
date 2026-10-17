import React from 'react';
import { FiMessageSquare, FiX, FiHome, FiClock, FiLayers, FiUsers, FiGlobe } from 'react-icons/fi';

const NAV_SHORTCUTS = [
    { view: 'webhook_integrations', label: 'Integração Webhook', icon: FiGlobe },
    { view: 'bulk_sender', label: 'Disparo em Massa', icon: FiHome },
    { view: 'history',     label: 'Histórico de Disparos', icon: FiClock },
    { view: 'funnels',     label: 'Funis', icon: FiLayers },
    { view: 'leads',       label: 'Contatos', icon: FiUsers },
];

export default function ChatHeaderNav({ activeClient, user, onClose, onNavigate }) {
    return (
        <div className="h-14 sm:h-16 border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-3.5 sm:px-6 bg-white dark:bg-[#1e293b] shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 animate-pulse shrink-0">
                    <FiMessageSquare size={18} />
                </div>
                <div className="min-w-0">
                    <h2 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white tracking-tight truncate">Painel de Atendimento</h2>
                    {activeClient && <p className="text-[10px] text-gray-500 truncate">Cliente: {activeClient.name}</p>}
                </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {user?.role !== 'vendedor' && NAV_SHORTCUTS.map(s => {
                    const Icon = s.icon;
                    return (
                        <button
                            key={s.view}
                            onClick={() => {
                                if (s.view === 'bulk_sender' && onClose) {
                                    onClose();
                                } else if (onNavigate) {
                                    onNavigate(s.view);
                                }
                            }}
                            title={s.label}
                            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 bg-gray-100 dark:bg-white/5 hover:bg-blue-500/10 text-gray-600 dark:text-gray-300 hover:text-blue-500 rounded-xl transition text-xs font-semibold cursor-pointer"
                        >
                            <Icon size={14} />
                            <span className="hidden md:inline">{s.label}</span>
                        </button>
                    );
                })}
                {onClose && (
                    <button
                        onClick={onClose}
                        title="Fechar painel de atendimento"
                        className="ml-1 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition"
                    >
                        <FiX size={18} />
                    </button>
                )}
            </div>
        </div>
    );
}

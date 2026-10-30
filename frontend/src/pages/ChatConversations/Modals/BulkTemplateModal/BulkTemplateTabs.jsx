import React from 'react';
import { FiMessageSquare, FiSliders, FiUsers } from 'react-icons/fi';

export default function BulkTemplateTabs({ activeTab, onTabChange, recipientCount = 0 }) {
    const tabs = [
        {
            id: 'template',
            label: 'Template & Mensagem',
            icon: FiMessageSquare
        },
        {
            id: 'settings',
            label: 'Ações & Envio',
            icon: FiSliders
        },
        {
            id: 'recipients',
            label: 'Contatos',
            icon: FiUsers,
            badge: recipientCount
        }
    ];

    return (
        <div className="flex items-center gap-1.5 px-6 pt-3 pb-2 border-b border-white/10 bg-slate-950/40">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onTabChange(tab.id)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                            isActive
                                ? 'bg-gradient-to-r from-teal-500/20 to-emerald-500/20 text-teal-300 border border-teal-500/40 shadow-sm shadow-teal-950/50'
                                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                    >
                        <Icon size={14} className={isActive ? 'text-teal-400' : 'text-slate-400'} />
                        <span>{tab.label}</span>
                        {tab.badge !== undefined && (
                            <span
                                className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    isActive
                                        ? 'bg-teal-500/30 text-teal-200 border border-teal-400/40'
                                        : 'bg-slate-800 text-slate-300 border border-white/10'
                                }`}
                            >
                                {tab.badge}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

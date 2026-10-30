import React from 'react';
import { FiLayers } from 'react-icons/fi';

export default function KanbanLoadingModal({ isOpen, pipelineName }) {
    if (!isOpen) return null;

    return (
        <div 
            data-testid="kanban-loading-modal-backdrop"
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none"
        >
            <div 
                data-testid="kanban-loading-modal-panel"
                className="w-full max-w-sm rounded-3xl bg-slate-900/95 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.85)] p-6 text-center flex flex-col items-center gap-4 relative overflow-hidden ring-1 ring-blue-500/20"
            >
                {/* Glow decorativo neon no topo */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent blur-sm" />

                {/* Ícone com spinner neon pulsante */}
                <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.25)]">
                    <FiLayers size={28} className="text-blue-400 animate-pulse" />
                    <div className="absolute inset-0 rounded-2xl border-2 border-blue-500 border-t-transparent animate-spin" />
                </div>

                <div className="space-y-1.5">
                    <h3 className="text-base font-black text-white tracking-tight">
                        Carregando Oportunidades do Kanban...
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        {pipelineName ? (
                            <>Sincronizando colunas, métricas e leads de <strong className="text-blue-400">"{pipelineName}"</strong>...</>
                        ) : (
                            <>Sincronizando dados, métricas e oportunidades...</>
                        )}
                    </p>
                </div>

                {/* Barra de pulso suave neon */}
                <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden p-0.5">
                    <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 h-full w-2/3 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
                </div>
            </div>
        </div>
    );
}

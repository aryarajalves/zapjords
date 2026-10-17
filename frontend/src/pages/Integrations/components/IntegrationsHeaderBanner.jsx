import React from 'react';
import { FiZap, FiUsers, FiSend, FiActivity, FiGitMerge, FiShare2 } from 'react-icons/fi';

export default function IntegrationsHeaderBanner({
  onNavigateToLeads,
  onNavigateToBulk,
  onNavigateToDispatchHistory,
  onNavigateToFunnels,
  onOpenMappingGuide,
  onOpenNewModal
}) {
  return (
    <div className="bg-[#1e293b]/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/5 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
      <div className="flex items-start sm:items-center gap-3 sm:gap-5 w-full lg:w-auto min-w-0">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)] shrink-0">
          <FiZap size={22} fill="currentColor" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
              Webhook Integrations
            </h2>
            <div className="flex flex-wrap items-center gap-1.5">
              {onNavigateToLeads && (
                <button
                  type="button"
                  onClick={onNavigateToLeads}
                  className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest border border-blue-500/20 cursor-pointer"
                  title="Ir para Contatos"
                >
                  <FiUsers size={11} /> Contatos
                </button>
              )}
              {onNavigateToBulk && (
                <button
                  type="button"
                  onClick={onNavigateToBulk}
                  className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest border border-indigo-500/20 cursor-pointer"
                  title="Ir para Disparo em Massa"
                >
                  <FiSend size={11} /> Disparo em Massa
                </button>
              )}
              {onNavigateToDispatchHistory && (
                <button
                  type="button"
                  onClick={onNavigateToDispatchHistory}
                  className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500 text-violet-400 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest border border-violet-500/20 cursor-pointer"
                  title="Ir para Histórico de Disparos"
                >
                  <FiActivity size={11} /> Hist. Disparos
                </button>
              )}
              {onNavigateToFunnels && (
                <button
                  type="button"
                  onClick={onNavigateToFunnels}
                  className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 cursor-pointer"
                  title="Ir para Funis"
                >
                  <FiGitMerge size={11} /> Funis
                </button>
              )}
            </div>
          </div>
          <p className="text-gray-400 text-[11px] font-medium mt-1">
            Conecte a Hotmart, Kiwify, Eduzz para Automações de Eventos.
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 w-full lg:w-auto justify-end shrink-0">
        <button
          type="button"
          onClick={onOpenMappingGuide}
          className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800/50 hover:bg-gray-800 text-gray-400 transition-all font-bold text-[9px] border border-white/5 uppercase tracking-widest cursor-pointer"
        >
          <FiShare2 size={14} /> Guia
        </button>
        <button
          type="button"
          onClick={onOpenNewModal}
          className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all font-black text-[10px] shadow-lg shadow-blue-600/20 active:scale-95 uppercase tracking-widest cursor-pointer whitespace-nowrap"
        >
          <FiZap size={14} fill="currentColor" /> Nova Integração
        </button>
      </div>
    </div>
  );
}

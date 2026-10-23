import React, { useState } from 'react';
import { FiServer, FiCpu, FiDatabase, FiBell, FiRefreshCw, FiClock } from 'react-icons/fi';
import { useInfrastructure } from './hooks/useInfrastructure';
import { HardwareTab } from './components/HardwareTab';
import { DatabaseConnectionsTab } from './components/DatabaseConnectionsTab';
import { AlertSettingsTab } from './components/AlertSettingsTab';

export default function Infrastructure() {
  const [activeTab, setActiveTab] = useState('hardware');

  const {
    metrics,
    settings,
    setSettings,
    isLoadingMetrics,
    isRefreshing,
    isSavingSettings,
    isTestingWebhook,
    fetchMetrics,
    saveSettings,
    testWebhook,
  } = useInfrastructure();

  const ramPercent = metrics?.hardware?.ram?.percent ?? 0;
  const cpuPercent = metrics?.hardware?.cpu?.percent ?? 0;
  const poolOccupancy = metrics?.database?.occupancy_percent ?? 0;
  const webhookBadge = metrics?.webhook_badge || 'Inativo';
  const timestamp = metrics?.timestamp || '';

  const tabs = [
    {
      id: 'hardware',
      label: 'Recursos do Servidor (RAM & CPU)',
      icon: FiCpu,
      badge: `RAM ${ramPercent}% • CPU ${cpuPercent}%`,
      badgeStyle: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    },
    {
      id: 'database',
      label: 'Conexões & Banco (PostgreSQL)',
      icon: FiDatabase,
      badge: `Pool ${poolOccupancy}%`,
      badgeStyle: poolOccupancy > 75 
        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    },
    {
      id: 'alerts',
      label: 'Configurações de Alertas (Webhook)',
      icon: FiBell,
      badge: webhookBadge,
      badgeStyle: webhookBadge === 'Ativo'
        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        : 'bg-slate-700/40 text-slate-400 border border-slate-700',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* Header da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-lg">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <FiServer className="w-6 h-6" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Infraestrutura & Recursos do Servidor
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 max-w-2xl">
            Acompanhe a saúde de hardware, capacidade de conexões no PostgreSQL e configure notificações automáticas de tráfego.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-end md:self-auto">
          {timestamp && (
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-950/60 border border-slate-800 px-3 py-2 rounded-xl">
              <FiClock className="w-3.5 h-3.5 text-slate-400" />
              <span>{timestamp}</span>
            </div>
          )}

          <button
            onClick={() => fetchMetrics(true)}
            disabled={isRefreshing}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
            title="Atualizar métricas agora"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800/80 pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-600/15 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${tab.badgeStyle}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Conteúdo da Aba Ativa */}
      {isLoadingMetrics && !metrics ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
          <FiRefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-xs text-slate-400">Coletando métricas do servidor em tempo real...</p>
        </div>
      ) : (
        <>
          {activeTab === 'hardware' && (
            <HardwareTab metrics={metrics} isLoading={isLoadingMetrics} />
          )}

          {activeTab === 'database' && (
            <DatabaseConnectionsTab metrics={metrics} />
          )}

          {activeTab === 'alerts' && (
            <AlertSettingsTab
              settings={settings}
              setSettings={setSettings}
              saveSettings={saveSettings}
              testWebhook={testWebhook}
              isSaving={isSavingSettings}
              isTesting={isTestingWebhook}
            />
          )}
        </>
      )}
    </div>
  );
}

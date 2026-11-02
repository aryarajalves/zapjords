import React from 'react';
import { FiRefreshCw, FiUser, FiCalendar, FiShield, FiWifi } from 'react-icons/fi';

export default function PerformanceHeader({
  sellers = [],
  selectedSellerId,
  onSelectSeller,
  period,
  onSelectPeriod,
  onRefresh,
  loading = false,
  isWsConnected = false,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/60 dark:bg-[#131b2e]/60 backdrop-blur-md p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Desempenho da Equipe
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <FiShield size={12} /> Acesso Admin
            </span>
            <span
              data-testid="ws-status-badge"
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                isWsConnected
                  ? 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20'
                  : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
              }`}
              title={isWsConnected ? 'Atualização em tempo real ativa via WebSocket' : 'Conectando ao servidor...'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
              <FiWifi size={11} />
              {isWsConnected ? 'Tempo Real Ativo' : 'Conectando...'}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Acompanhe em tempo real os contatos conversados e o volume de mensagens de cada vendedor.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          data-testid="refresh-performance-btn"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors cursor-pointer disabled:opacity-50"
        >
          <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Atualizando...' : 'Atualizar Dados'}
        </button>
      </div>

      {/* Barra de Filtros: Vendedor e Período */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-white/5">
        {/* Seletor de Vendedor */}
        <div className="flex items-center gap-2 min-w-[220px]">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <FiUser size={14} /> Vendedor:
          </span>
          <select
            value={selectedSellerId || ''}
            onChange={(e) => onSelectSeller(e.target.value ? Number(e.target.value) : null)}
            data-testid="seller-select"
            className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a233a] px-3 py-1.5 text-sm text-gray-800 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Toda a Equipe</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name} ({s.role})
              </option>
            ))}
          </select>
        </div>

        {/* Botões de Período */}
        <div className="flex flex-wrap items-center gap-1.5 ml-auto">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1 flex items-center gap-1">
            <FiCalendar size={14} /> Período:
          </span>
          {[
            { id: 'today', label: 'Hoje' },
            { id: '7days', label: '7 Dias' },
            { id: 'this_month', label: 'Este Mês' },
            { id: '30days', label: '30 Dias' },
            { id: 'custom', label: 'Personalizado' },
          ].map((item) => {
            const isActive = period === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectPeriod(item.id)}
                data-testid={`period-btn-${item.id}`}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Inputs de Data Customizada */}
        {period === 'custom' && (
          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <input
              type="date"
              value={startDate || ''}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a233a] px-2.5 py-1 text-xs text-gray-800 dark:text-gray-100"
            />
            <span className="text-xs text-gray-400">até</span>
            <input
              type="date"
              value={endDate || ''}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a233a] px-2.5 py-1 text-xs text-gray-800 dark:text-gray-100"
            />
          </div>
        )}
      </div>
    </div>
  );
}

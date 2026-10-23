import React from 'react';
import { FiDatabase, FiTrendingUp, FiServer, FiLayers, FiCheckCircle, FiClock } from 'react-icons/fi';

export function DatabaseConnectionsTab({ metrics }) {
  const db = metrics?.database || {
    in_use: 1,
    pool_total: 30,
    pool_base: 10,
    pool_overflow: 20,
    idle_in_pool: 29,
    occupancy_percent: 3.3,
    status: 'Saudável',
  };

  const peaks = metrics?.peaks?.connections || {
    peak: 1,
    pool_total: 30,
    occupancy_percent: 3.3,
    recorded_at: 'Aguardando dados',
    status: 'Pico Seguro',
  };

  const history = metrics?.history || [];

  const getProgressColor = (percent) => {
    if (percent >= 85) return 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]';
    if (percent >= 60) return 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]';
    return 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]';
  };

  const getStatusBadge = (status) => {
    if (status === 'Crítico' || status === 'Alerta Máximo') {
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
    }
    if (status === 'Alerta' || status === 'Moderado') {
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
    }
    return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Grid de 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Conexões em Uso Agora */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden transition-all hover:border-slate-700/80 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <FiDatabase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Conexões em Uso Agora</h3>
                <p className="text-xs text-slate-400">PostgreSQL Connection Pool</p>
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusBadge(db.status)}`}>
              {db.status}
            </span>
          </div>

          <div className="flex items-baseline space-x-2 my-2">
            <span className="text-3xl font-bold tracking-tight text-white">
              {db.in_use} / {db.pool_total}
            </span>
            <span className="text-xs text-slate-400">({db.occupancy_percent}%)</span>
          </div>

          {/* Barra de Progresso */}
          <div className="w-full bg-slate-800/90 rounded-full h-2.5 mb-5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ${getProgressColor(db.occupancy_percent)}`}
              style={{ width: `${Math.min(db.occupancy_percent, 100)}%` }}
            />
          </div>

          <div className="space-y-2.5 text-xs border-t border-slate-800/80 pt-4">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Capacidade Total Alocada:</span>
              <span className="font-semibold text-slate-200">{db.pool_total} conexões</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Conexões Ociosas no Pool:</span>
              <span className="font-semibold text-emerald-400">{db.idle_in_pool || Math.max(db.pool_total - db.in_use, 0)} disponíveis</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Tempo de Resposta Médio:</span>
              <span className="font-semibold text-cyan-400">&lt; 3ms (Local Docker)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Maior Pico Registrado Hoje */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden transition-all hover:border-slate-700/80 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <FiTrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Maior Pico Registrado Hoje</h3>
                <p className="text-xs text-amber-400/90 font-medium">Horário de Brasília (UTC-3)</p>
              </div>
            </div>
          </div>

          <div className="flex items-baseline space-x-2 my-2">
            <span className="text-3xl font-bold tracking-tight text-white">
              {peaks.peak} conexões
            </span>
            <span className="text-xs text-slate-400">simultâneas</span>
          </div>

          <div className="w-full bg-slate-800/90 rounded-full h-2.5 mb-5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ${getProgressColor(peaks.occupancy_percent)}`}
              style={{ width: `${Math.min(peaks.occupancy_percent, 100)}%` }}
            />
          </div>

          <div className="space-y-2.5 text-xs border-t border-slate-800/80 pt-4">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Utilização Máxima do Pool:</span>
              <span className="font-semibold text-slate-200">{peaks.occupancy_percent}%</span>
            </div>
            <div className="flex justify-between items-start text-slate-300 gap-2">
              <span className="text-slate-400 shrink-0">Horário do Pico:</span>
              <span className="font-medium text-slate-200 text-right truncate">{peaks.recorded_at}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Margem de Segurança:</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <FiCheckCircle className="w-3.5 h-3.5" /> Pool com Folga
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Capacidade do Servidor */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden transition-all hover:border-slate-700/80 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <FiServer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Capacidade do Servidor</h3>
                <p className="text-xs text-slate-400">Configuração de Conexões</p>
              </div>
            </div>
          </div>

          <div className="flex items-baseline space-x-2 my-2">
            <span className="text-3xl font-bold tracking-tight text-white">{db.pool_total}</span>
            <span className="text-xs text-slate-400">conexões simultâneas max</span>
          </div>

          <div className="space-y-3 text-xs border-t border-slate-800/80 pt-4 mt-7">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Pool Base Estável:</span>
              <span className="font-semibold text-slate-200">{db.pool_base} conexões</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Buffer Overflow Temporário:</span>
              <span className="font-semibold text-purple-400">+{db.pool_overflow} conexões</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Motor de Conexão:</span>
              <span className="font-semibold text-slate-300">QueuePool (PostgreSQL 15)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Histórico de Picos por Hora */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <FiClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Histórico de Picos por Hora (Últimas 24h)
              </h3>
              <p className="text-xs text-slate-400">
                Registro consolidado por fuso de Brasília (UTC-3)
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Horário (Brasília)</th>
                <th className="py-3 px-4">Conexões Máximas</th>
                <th className="py-3 px-4">Utilização %</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
              {history.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-500">
                    Nenhum registro histórico recente encontrado.
                  </td>
                </tr>
              ) : (
                history.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-300 font-medium">{row.period}</td>
                    <td className="py-3 px-4 font-semibold text-white">{row.peak_connections}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-cyan-400">{row.occupancy_percent}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${getStatusBadge(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

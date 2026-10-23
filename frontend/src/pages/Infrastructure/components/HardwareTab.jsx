import React from 'react';
import { FiHardDrive, FiCpu, FiTrendingUp, FiCheckCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi';

export function HardwareTab({ metrics, isLoading }) {
  const ram = metrics?.hardware?.ram || {
    used_gb: 0,
    total_gb: 0,
    free_gb: 0,
    percent: 0,
    api_process_mb: 0,
    status: 'Carregando...',
  };

  const cpu = metrics?.hardware?.cpu || {
    percent: 0,
    vcpu_count: 2,
    status: 'Carregando...',
  };

  const peaks = metrics?.peaks || {};
  const ramPeak = peaks.ram || { percent: 0, used_gb: 0, recorded_at: 'Aguardando dados' };
  const cpuPeak = peaks.cpu || { percent: 0, recorded_at: 'Aguardando dados' };

  const getProgressColor = (percent) => {
    if (percent >= 90) return 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]';
    if (percent >= 75) return 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]';
    return 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]';
  };

  const getBadgeStyle = (status) => {
    if (status === 'Crítico' || status === 'Gargalo') {
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
    }
    if (status === 'Atenção' || status === 'Alerta') {
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
    }
    return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Grid de Cards Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Memória RAM */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden transition-all hover:border-slate-700/80 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <FiHardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Memória RAM (VPS)</h3>
                <p className="text-xs text-slate-400">Capacidade da Máquina Virtual</p>
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getBadgeStyle(ram.status)}`}>
              {ram.status}
            </span>
          </div>

          <div className="flex items-baseline space-x-2 my-2">
            <span className="text-3xl font-bold tracking-tight text-white">{ram.percent}%</span>
            <span className="text-xs text-slate-400">em uso</span>
          </div>

          {/* Barra de Progresso */}
          <div className="w-full bg-slate-800/90 rounded-full h-2.5 mb-5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ${getProgressColor(ram.percent)}`}
              style={{ width: `${Math.min(ram.percent, 100)}%` }}
            />
          </div>

          <div className="space-y-2.5 text-xs border-t border-slate-800/80 pt-4">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Usada / Total:</span>
              <span className="font-semibold text-slate-200">{ram.used_gb} GB / {ram.total_gb} GB</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Memória Livre:</span>
              <span className="font-semibold text-emerald-400">{ram.free_gb} GB</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Consumo da Aplicação (API):</span>
              <span className="font-semibold text-cyan-400">{ram.api_process_mb} MB</span>
            </div>
          </div>
        </div>

        {/* Card 2: Processamento (CPU) */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden transition-all hover:border-slate-700/80 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <FiCpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Processamento (CPU)</h3>
                <p className="text-xs text-slate-400">Carga Geral do Processador</p>
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getBadgeStyle(cpu.status)}`}>
              {cpu.status}
            </span>
          </div>

          <div className="flex items-baseline space-x-2 my-2">
            <span className="text-3xl font-bold tracking-tight text-white">{cpu.percent}%</span>
            <span className="text-xs text-slate-400">carga atual</span>
          </div>

          {/* Barra de Progresso */}
          <div className="w-full bg-slate-800/90 rounded-full h-2.5 mb-5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ${getProgressColor(cpu.percent)}`}
              style={{ width: `${Math.min(cpu.percent, 100)}%` }}
            />
          </div>

          <div className="space-y-2.5 text-xs border-t border-slate-800/80 pt-4">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Núcleos de Execução:</span>
              <span className="font-semibold text-slate-200">{cpu.vcpu_count} vCPUs detectadas</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Nível Operacional:</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <FiCheckCircle className="w-3.5 h-3.5" /> Operação Fluida
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Alocação de Workers:</span>
              <span className="font-semibold text-purple-400">Assíncrono (FastAPI / Uvicorn)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Maiores Picos (24h) */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden transition-all hover:border-slate-700/80 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <FiTrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Maiores Picos de Hardware (24h)</h3>
                <p className="text-xs text-amber-400/90 font-medium">Horário de Brasília (UTC-3)</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 my-2">
            <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-400">Maior Pico de RAM:</span>
                <span className="text-sm font-bold text-white">{ramPeak.percent}%</span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {ramPeak.recorded_at}
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-400">Maior Pico de CPU:</span>
                <span className="text-sm font-bold text-white">{cpuPeak.percent}%</span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {cpuPeak.recorded_at}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-3">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <FiCheckCircle className="w-3.5 h-3.5" />
              <span>Nenhum estouro crítico de recursos detectado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Box de Diretrizes e Boas Práticas */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex items-start space-x-3.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mt-0.5">
            <FiInfo className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-200">
              Diretrizes e Boas Práticas de Recursos de Servidor
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Para garantir alta disponibilidade dos envios em massa e webhooks em tempo real, recomendamos manter a RAM do VPS abaixo de 80% e a CPU média abaixo de 85%. Caso configure os alertas na aba &quot;Configurações de Alertas&quot;, você será notificado no Discord, Slack ou ZapVoice assim que esses patamares forem atingidos.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3">
                <span className="font-semibold text-slate-300 block mb-1">Memória RAM Segura</span>
                <span className="text-slate-400">Até 80% em pico de disparo intenso.</span>
              </div>
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3">
                <span className="font-semibold text-slate-300 block mb-1">Processador (CPU)</span>
                <span className="text-slate-400">Operação ideal abaixo de 70% contínuo.</span>
              </div>
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3">
                <span className="font-semibold text-slate-300 block mb-1">Fusos e Métricas</span>
                <span className="text-slate-400">Todos os registros em Horário de Brasília.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { FiBell, FiClock, FiSend, FiSave, FiRefreshCw } from 'react-icons/fi';

export function AlertSettingsTab({
  settings,
  setSettings,
  saveSettings,
  testWebhook,
  isSaving,
  isTesting,
}) {
  const [localUrl, setLocalUrl] = useState(settings?.webhook_url || '');

  const handleChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUrlChange = (e) => {
    const val = e.target.value;
    setLocalUrl(val);
    handleChange('webhook_url', val);
  };

  const onSave = (e) => {
    if (e) e.preventDefault();
    saveSettings({ ...settings, webhook_url: localUrl });
  };

  const onTest = () => {
    testWebhook(localUrl);
  };

  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-lg">
        {/* Cabeçalho do Card */}
        <div className="flex items-center space-x-3 pb-6 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <FiBell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              Disparo Automático de Alertas via Webhook
            </h3>
            <p className="text-xs text-slate-400">
              Receba notificações instantâneas no Discord, Slack ou ZapVoice quando o servidor ultrapassar os limites definidos.
            </p>
          </div>
        </div>

        {/* Sliders de Limites */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {/* Limite Conexões */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200">
                Conexões de Banco
              </label>
              <input
                type="checkbox"
                checked={settings.alert_pool_enabled}
                onChange={(e) => handleChange('alert_pool_enabled', e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-cyan-400">
                {settings.alert_pool_threshold}%
              </span>
              <span className="text-xs text-slate-400">
                ~{Math.round((settings.alert_pool_threshold / 100) * 30)} de 30 conexões
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              disabled={!settings.alert_pool_enabled}
              value={settings.alert_pool_threshold}
              onChange={(e) => handleChange('alert_pool_threshold', parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500 cursor-pointer disabled:opacity-40"
            />
            <p className="text-[11px] text-slate-400">
              Dispara alerta caso a quantidade de conexões ativas ultrapasse este percentual do pool total.
            </p>
          </div>

          {/* Limite RAM */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200">
                Memória RAM (VPS)
              </label>
              <input
                type="checkbox"
                checked={settings.alert_ram_enabled}
                onChange={(e) => handleChange('alert_ram_enabled', e.target.checked)}
                className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
              />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-blue-400">
                {settings.alert_ram_threshold}%
              </span>
              <span className="text-xs text-slate-400">Carga Máxima de Memória</span>
            </div>
            <input
              type="range"
              min="30"
              max="100"
              step="5"
              disabled={!settings.alert_ram_enabled}
              value={settings.alert_ram_threshold}
              onChange={(e) => handleChange('alert_ram_threshold', parseInt(e.target.value, 10))}
              className="w-full accent-blue-500 cursor-pointer disabled:opacity-40"
            />
            <p className="text-[11px] text-slate-400">
              Notifica antes do servidor entrar em risco de Swap ou esgotamento de memória no container.
            </p>
          </div>

          {/* Limite CPU */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200">
                Processamento (CPU)
              </label>
              <input
                type="checkbox"
                checked={settings.alert_cpu_enabled}
                onChange={(e) => handleChange('alert_cpu_enabled', e.target.checked)}
                className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
              />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-purple-400">
                {settings.alert_cpu_threshold}%
              </span>
              <span className="text-xs text-slate-400">Carga de Processador</span>
            </div>
            <input
              type="range"
              min="30"
              max="100"
              step="5"
              disabled={!settings.alert_cpu_enabled}
              value={settings.alert_cpu_threshold}
              onChange={(e) => handleChange('alert_cpu_threshold', parseInt(e.target.value, 10))}
              className="w-full accent-purple-500 cursor-pointer disabled:opacity-40"
            />
            <p className="text-[11px] text-slate-400">
              Dispara quando as rotinas de fila ou requisições causarem alta concorrência contínua.
            </p>
          </div>
        </div>

        {/* Intervalo e Tráfego Normalizado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 mt-6 border-t border-slate-800">
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 space-y-2">
            <div className="flex items-center space-x-2 text-slate-200 text-xs font-semibold">
              <FiClock className="w-4 h-4 text-amber-400" />
              <span>Cooldown Anti-Spam (Minutos)</span>
            </div>
            <input
              type="number"
              min="1"
              max="1440"
              value={settings.cooldown_minutes}
              onChange={(e) => handleChange('cooldown_minutes', parseInt(e.target.value || 1, 10))}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[11px] text-slate-400">
              Tempo mínimo de espera entre dois alertas consecutivos para evitar sobrecarga de mensagens.
            </p>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-1 pr-4">
              <span className="text-xs font-semibold text-slate-200 block">
                Notificar quando o tráfego normalizar
              </span>
              <span className="text-[11px] text-slate-400 block">
                Envia uma mensagem de alívio assim que todos os índices voltarem a patamares seguros.
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.notify_normalized}
              onChange={(e) => handleChange('notify_normalized', e.target.checked)}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0"
            />
          </div>
        </div>

        {/* Destino do Alerta (URL do Webhook) */}
        <div className="pt-6 mt-6 border-t border-slate-800 space-y-3">
          <label className="text-xs font-semibold text-slate-200 block">
            URL do Webhook de Destino
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              placeholder="https://discord.com/api/webhooks/... ou https://seu-endpoint.com/webhook"
              value={localUrl}
              onChange={handleUrlChange}
              className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <button
              type="button"
              onClick={onTest}
              disabled={isTesting || !localUrl.trim()}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-slate-700 cursor-pointer shadow-md"
            >
              {isTesting ? (
                <>
                  <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Testando...</span>
                </>
              ) : (
                <>
                  <FiSend className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Testar Webhook</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Botão de Salvar */}
        <div className="pt-6 mt-6 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-cyan-600/20 cursor-pointer"
          >
            {isSaving ? (
              <>
                <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <FiSave className="w-3.5 h-3.5" />
                <span>Salvar Configurações</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

import React from 'react';
import { FiCpu, FiCopy, FiChevronDown } from 'react-icons/fi';

export default function AgentFlowSection({
  formData,
  handleChange,
  testingWebhook,
  handleTestWebhook,
  setShowMemoryLogsTable,
  setMemoryLogsPage,
  fetchMemoryLogs,
  testingChatWebhook,
  handleTestChatWebhook,
  setShowChatLogsTable,
  setChatLogsPage,
  fetchChatLogs,
}) {
  return (
    <div className="space-y-4 mb-8 bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
      {/* Cabeçalho Unificado do AgentFlow */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-lg">
            <FiCpu className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              AgentFlow (Agente de IA)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Configure os webhooks do AgentFlow para sincronização de memória e mensagens das conversas.
            </p>
          </div>
        </div>
      </div>

      {/* Grid com os 2 Webhooks unificados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        {/* Coluna 1: Webhook de Memória do Agente */}
        <div className="space-y-3 flex flex-col justify-between p-3.5 bg-white/60 dark:bg-[#111827]/40 rounded-xl border border-gray-100 dark:border-white/5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded">
                <FiCopy className="h-4 w-4" />
              </span>
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200">
                Webhook de Memória do Agente
              </h4>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">
                URL do Webhook (POST)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  name="AGENT_MEMORY_WEBHOOK_URL"
                  value={formData?.AGENT_MEMORY_WEBHOOK_URL || ''}
                  onChange={handleChange}
                  placeholder="https://seu-agentflow.com/webhooks/memory/memoria"
                  className="flex-1 p-2.5 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-mono text-xs bg-white dark:bg-[#111827] text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  disabled={testingWebhook || !formData?.AGENT_MEMORY_WEBHOOK_URL}
                  onClick={handleTestWebhook}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {testingWebhook ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Testar'
                  )}
                </button>
              </div>
              <p className="text-[9px] text-gray-400 px-1">
                Sincroniza o contexto e a memória do agente de IA com o AgentFlow.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-white/5">
            <button
              type="button"
              onClick={() => {
                setShowMemoryLogsTable(true);
                setMemoryLogsPage(0);
                fetchMemoryLogs();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-cyan-600 dark:text-cyan-400 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/5 transition-all shadow-sm cursor-pointer"
            >
              <FiChevronDown className="h-3.5 w-3.5 transform -rotate-90 text-cyan-500" />
              Logs de Sincronização de Memória
            </button>
          </div>
        </div>

        {/* Coluna 2: Webhook de Integração de Mensagens */}
        <div className="space-y-3 flex flex-col justify-between p-3.5 bg-white/60 dark:bg-[#111827]/40 rounded-xl border border-gray-100 dark:border-white/5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </span>
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200">
                Webhook de Integração de Mensagens (AgentFlow)
              </h4>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">
                URL do Webhook (POST)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  name="CHAT_MESSAGES_WEBHOOK_URL"
                  value={formData?.CHAT_MESSAGES_WEBHOOK_URL || ''}
                  onChange={handleChange}
                  placeholder="https://seu-agentflow.com/webhooks/receive/whatsapp"
                  className="flex-1 p-2.5 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-xs bg-white dark:bg-[#111827] text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  disabled={testingChatWebhook || !formData?.CHAT_MESSAGES_WEBHOOK_URL}
                  onClick={handleTestChatWebhook}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {testingChatWebhook ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Testar'
                  )}
                </button>
              </div>
              <p className="text-[9px] text-gray-400 px-1">
                Dispara o JSON de toda nova mensagem (entrada do cliente ou saída do agente) para este endereço.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-white/5">
            <button
              type="button"
              onClick={() => {
                setShowChatLogsTable(true);
                setChatLogsPage(0);
                fetchChatLogs();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 transition-all shadow-sm cursor-pointer"
            >
              <FiChevronDown className="h-3.5 w-3.5 transform -rotate-90 text-indigo-500" />
              Logs de Integração de Mensagens
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { FiTrash2 } from 'react-icons/fi';
import SearchableFunnelSelect from './SearchableFunnelSelect';

export default function TriggerButtonItem({
  btn,
  action,
  funnels = [],
  onActionTypeChange,
  onFunnelChange,
  onToggleAi,
  onRemove
}) {
  const currentAction = action || { type: 'none', funnel_id: '', enable_ai: false };

  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🔘</span>
          <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{btn}</span>
        </div>
        <button
          type="button"
          onClick={() => onRemove(btn)}
          className="p-1 text-slate-400 hover:text-red-500 transition cursor-pointer"
          title="Remover botão desta lista"
        >
          <FiTrash2 size={15} />
        </button>
      </div>

      {/* Tipo de Ação */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onActionTypeChange(btn, 'none')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
            currentAction.type === 'none'
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white border-slate-300 dark:border-slate-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          ⚪ Nenhum
        </button>

        <button
          type="button"
          onClick={() => onActionTypeChange(btn, 'interaction')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
            currentAction.type === 'interaction'
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border-slate-200 dark:border-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/20'
          }`}
        >
          🔥 Interação
        </button>

        <button
          type="button"
          onClick={() => onActionTypeChange(btn, 'block')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
            currentAction.type === 'block'
              ? 'bg-red-500 text-white border-red-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20'
          }`}
        >
          🚫 Bloqueio
        </button>
      </div>

      {/* Campos condicionais se Interação ou Bloqueio */}
      {currentAction.type !== 'none' && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-2.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              {currentAction.type === 'interaction' ? 'Funil a ser disparado (Obrigatório):' : 'Funil opcional após bloquear:'}
            </label>
            <SearchableFunnelSelect
              value={currentAction.funnel_id || ''}
              onChange={(funnelId) => onFunnelChange(btn, funnelId ? String(funnelId) : '')}
              funnels={funnels}
              placeholder={currentAction.type === 'interaction' ? 'Digite o nome do funil para buscar...' : 'Digite para buscar um funil opcional...'}
              emptyLabel={currentAction.type === 'block' ? 'Nenhum funil (apenas bloquear)' : null}
            />
          </div>

          {/* Toggle Agente de IA */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={Boolean(currentAction.enable_ai)}
              onChange={() => onToggleAi(btn)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              Ativar Agente de IA neste contato após clicar no botão
            </span>
          </label>
        </div>
      )}
    </div>
  );
}

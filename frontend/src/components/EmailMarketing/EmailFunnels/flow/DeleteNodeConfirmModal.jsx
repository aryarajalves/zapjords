import React from 'react';
import { FiTrash2, FiAlertTriangle } from 'react-icons/fi';

const NODE_LABELS = {
  emailNode: 'Disparo de E-mail',
  delayNode: 'Delay / Espera',
  tagNode: 'Aplicar Etiqueta (Tag)',
  conditionNode: 'Condição / Filtro',
  splitNode: 'Divisor Teste A/B',
  webhookNode: 'Disparo de Webhook',
  kanbanNode: 'Mover no Kanban',
  whatsappNode: 'Disparo no WhatsApp',
  waitUntilNode: 'Aguardar Até Data/Hora',
  subFunnelNode: 'Executar Sub-Funil',
  triggerNode: 'Gatilho de Início'
};

export default function DeleteNodeConfirmModal({ node, onCancel, onConfirm }) {
  if (!node) return null;

  const nodeLabel = NODE_LABELS[node.type] || 'Nó do Funil';
  const nodeSubDetail =
    node.data?.subject ||
    node.data?.tag ||
    (node.data?.days != null || node.data?.hours != null || node.data?.minutes != null
      ? `${node.data?.days || 0}d ${node.data?.hours || 0}h ${node.data?.minutes || 0}m`
      : null);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-node-modal-title"
      className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-md bg-[#0e131f] border border-rose-500/30 rounded-2xl p-6 shadow-2xl shadow-rose-950/50 text-white relative flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho com Ícone de Alerta */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-400 shrink-0">
            <FiAlertTriangle size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="delete-node-modal-title" className="text-base font-bold text-white tracking-tight">
              Excluir Nó do Funil?
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Tem certeza que deseja remover este bloco? Todas as conexões ligadas a ele serão desfeitas.
            </p>
          </div>
        </div>

        {/* Card do Nó a ser excluído */}
        <div className="p-3.5 bg-slate-900/90 border border-white/10 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg shrink-0">
            <FiTrash2 size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-rose-200 uppercase tracking-wide truncate">
              {nodeLabel}
            </p>
            {nodeSubDetail && (
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {nodeSubDetail}
              </p>
            )}
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              ID: {node.id}
            </p>
          </div>
        </div>

        {/* Ações: Apenas 1 botão Cancelar + 1 botão Ação Principal (conforme RULE[experiencia-usuario]) */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FiTrash2 size={14} /> Sim, Excluir Nó
          </button>
        </div>
      </div>
    </div>
  );
}

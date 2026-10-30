import React from 'react';
import { Handle, Position } from 'reactflow';
import { FiZap, FiTag, FiShoppingBag, FiUserCheck } from 'react-icons/fi';

export default function EmailTriggerNode({ data }) {
  const triggerType = data.trigger_type || 'tag';
  const triggerConfig = data.trigger_config || {};

  return (
    <div className="w-72 bg-slate-900/95 border-2 border-blue-500 rounded-2xl shadow-xl shadow-blue-500/10 overflow-hidden text-white backdrop-blur-md">
      {/* Cabeçalho */}
      <div className="px-3.5 py-2.5 bg-blue-600/20 border-b border-blue-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400">
            <FiZap size={14} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Gatilho de Início</span>
        </div>
        <span className="text-[10px] font-bold bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full">INÍCIO</span>
      </div>

      {/* Corpo */}
      <div className="p-3.5 space-y-2.5 text-xs">
        <div>
          <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Tipo de Gatilho</label>
          <div className="flex items-center gap-2 p-2 bg-slate-800/80 rounded-xl border border-white/5">
            {triggerType === 'tag' && <FiTag className="text-emerald-400 shrink-0" size={14} />}
            {triggerType === 'webhook_status' && <FiShoppingBag className="text-purple-400 shrink-0" size={14} />}
            {triggerType === 'manual' && <FiUserCheck className="text-blue-400 shrink-0" size={14} />}
            <span className="font-semibold text-gray-200">
              {triggerType === 'tag' ? 'Ao Receber Etiqueta (Tag)' :
               triggerType === 'webhook_status' ? 'Ao Receber Webhook de Venda' : 'Disparo Manual / Lista'}
            </span>
          </div>
        </div>

        {triggerType === 'tag' && (
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Etiqueta Alvo</label>
            <div className="px-2.5 py-1.5 bg-slate-800/80 rounded-lg border border-white/5 font-mono text-emerald-400 font-bold text-xs truncate">
              {triggerConfig.tag || 'Nenhuma tag definida'}
            </div>
          </div>
        )}

        {triggerType === 'webhook_status' && (
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Status do Webhook</label>
            <div className="px-2.5 py-1.5 bg-slate-800/80 rounded-lg border border-white/5 font-mono text-purple-400 font-bold text-xs truncate">
              {triggerConfig.status || 'carrinho_abandonado'}
            </div>
          </div>
        )}
      </div>

      {/* Handle de Saída para o Próximo Passo */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3.5 !h-3.5 !bg-blue-500 !border-2 !border-slate-900 !bottom-[-7px]"
      />
    </div>
  );
}

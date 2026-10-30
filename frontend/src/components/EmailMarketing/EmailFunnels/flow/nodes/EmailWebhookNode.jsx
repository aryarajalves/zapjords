import React from 'react';
import { Handle, Position } from 'reactflow';
import { FiGlobe, FiTrash2, FiCopy } from 'react-icons/fi';

export default function EmailWebhookNode({ id, data }) {
  const url = data.url || '';
  const method = data.method || 'POST';

  const handleUrlChange = (e) => {
    data.onUpdateNode?.(id, { ...data, url: e.target.value });
  };

  const handleMethodChange = (e) => {
    data.onUpdateNode?.(id, { ...data, method: e.target.value });
  };

  const handleDelete = () => {
    data.onDeleteNode?.(id);
  };

  const handleDuplicate = () => {
    data.onDuplicateNode?.(id);
  };

  return (
    <div className="relative w-72 bg-slate-900/95 border-2 border-cyan-500 rounded-2xl shadow-xl shadow-cyan-500/10 text-white backdrop-blur-md">
      {/* Handle Entrada Superior */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-4.5 !h-4.5 !bg-cyan-500 !border-[2.5px] !border-white !shadow-[0_0_12px_rgba(6,182,212,0.95)] !top-[-9px] !left-1/2 -translate-x-1/2 !z-50 hover:!scale-125 !transition-transform !cursor-crosshair"
      />

      {/* Cabeçalho */}
      <div className="px-3.5 py-2.5 bg-cyan-600/20 border-b border-cyan-500/30 flex items-center justify-between rounded-t-[14px]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/20 rounded-lg text-cyan-400">
            <FiGlobe size={14} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">Disparo Webhook</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleDuplicate}
            className="p-1 text-gray-400 hover:text-cyan-400 hover:bg-white/10 rounded-lg transition-colors"
            title="Duplicar Nó"
          >
            <FiCopy size={13} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors"
            title="Excluir Nó"
          >
            <FiTrash2 size={13} />
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-3.5 space-y-2.5 text-xs rounded-b-[14px]">
        <div>
          <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Método HTTP</label>
          <select
            value={method}
            onChange={handleMethodChange}
            className="nodrag nopan w-full px-2.5 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 font-semibold"
          >
            <option value="POST">POST (Envio JSON com dados do lead)</option>
            <option value="GET">GET (Requisição de consulta)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">URL de Destino *</label>
          <input
            type="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="https://sua-api.com/webhook"
            className="nodrag nopan w-full px-2.5 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <p className="text-[10px] text-gray-400">
          Envia automaticamente <code className="text-cyan-300">email</code>, <code className="text-cyan-300">name</code> e <code className="text-cyan-300">tags</code> no body JSON.
        </p>
      </div>

      {/* Handle Saída Inferior */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-4.5 !h-4.5 !bg-cyan-500 !border-[2.5px] !border-white !shadow-[0_0_12px_rgba(6,182,212,0.95)] !bottom-[-9px] !left-1/2 -translate-x-1/2 !z-50 hover:!scale-125 !transition-transform !cursor-crosshair"
      />
    </div>
  );
}

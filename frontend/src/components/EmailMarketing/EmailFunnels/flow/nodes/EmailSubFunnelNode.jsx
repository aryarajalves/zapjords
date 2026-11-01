import React from 'react';
import { Handle, Position } from 'reactflow';
import { FiCornerUpRight, FiTrash2, FiCopy } from 'react-icons/fi';

export default function EmailSubFunnelNode({ id, data }) {
  const targetFunnelId = data.target_funnel_id || '';
  const exitCurrent = data.exit_current_funnel ?? true;
  const funnels = Array.isArray(data.funnels) ? data.funnels : [];

  const handleFunnelChange = (e) => {
    data.onUpdateNode?.(id, { ...data, target_funnel_id: e.target.value });
  };

  const handleExitChange = (e) => {
    data.onUpdateNode?.(id, { ...data, exit_current_funnel: e.target.checked });
  };

  const handleDelete = () => {
    data.onDeleteNode?.(id);
  };

  const handleDuplicate = () => {
    data.onDuplicateNode?.(id);
  };

  return (
    <div className="relative w-80 bg-slate-900/95 border-2 border-emerald-500 rounded-2xl shadow-xl shadow-emerald-500/10 text-white backdrop-blur-md">
      {/* Handle Entrada Superior */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-4.5 !h-4.5 !bg-emerald-500 !border-[2.5px] !border-white !shadow-[0_0_12px_rgba(16,185,129,0.95)] !top-[-9px] !left-1/2 -translate-x-1/2 !z-50 hover:!scale-125 !transition-transform !cursor-crosshair"
      />

      {/* Cabeçalho */}
      <div className="px-3.5 py-2.5 bg-emerald-600/20 border-b border-emerald-500/30 flex items-center justify-between rounded-t-[14px]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400">
            <FiCornerUpRight size={14} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Ir Para Outro Funil</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDuplicate}
            className="p-1 text-gray-400 hover:text-emerald-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Duplicar Nó"
          >
            <FiCopy size={13} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Excluir Nó"
          >
            <FiTrash2 size={13} />
          </button>
        </div>
      </div>

      {/* Configuração */}
      <div className="p-3.5 space-y-2.5 text-xs">
        <div>
          <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Selecionar Funil Destino *</label>
          <select
            value={targetFunnelId}
            onChange={handleFunnelChange}
            className="nodrag nopan w-full px-2.5 py-2 bg-slate-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
          >
            <option value="">Selecione um funil de e-mail...</option>
            {funnels.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 pt-1 text-[11px] text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={exitCurrent}
            onChange={handleExitChange}
            className="nodrag nopan rounded border-gray-600 bg-slate-800 text-emerald-500 focus:ring-0"
          />
          <span>Encerrar este funil após matricular</span>
        </label>
      </div>

      {/* Handle Saída Inferior (opcional se continuar no funil) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-4.5 !h-4.5 !bg-emerald-500 !border-[2.5px] !border-white !shadow-[0_0_12px_rgba(16,185,129,0.95)] !bottom-[-9px] !left-1/2 -translate-x-1/2 !z-50 hover:!scale-125 !transition-transform !cursor-crosshair"
      />
    </div>
  );
}

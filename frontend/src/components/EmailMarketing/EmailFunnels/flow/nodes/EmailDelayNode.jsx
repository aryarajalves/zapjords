import React from 'react';
import { Handle, Position } from 'reactflow';
import { FiClock, FiTrash2, FiCopy } from 'react-icons/fi';

export default function EmailDelayNode({ id, data }) {
  const delayValue = data.delay_value || 1;
  const delayUnit = data.delay_unit || 'hours';

  const handleValueChange = (e) => {
    data.onUpdateNode?.(id, { ...data, delay_value: Math.max(1, Number(e.target.value) || 1) });
  };

  const handleUnitChange = (e) => {
    data.onUpdateNode?.(id, { ...data, delay_unit: e.target.value });
  };

  const handleDelete = () => {
    data.onDeleteNode?.(id);
  };

  const handleDuplicate = () => {
    data.onDuplicateNode?.(id);
  };

  return (
    <div className="w-72 bg-slate-900/95 border-2 border-amber-500 rounded-2xl shadow-xl shadow-amber-500/10 overflow-hidden text-white backdrop-blur-md">
      {/* Handle Entrada Superior */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3.5 !h-3.5 !bg-amber-500 !border-2 !border-slate-900 !top-[-7px]"
      />

      {/* Cabeçalho */}
      <div className="px-3.5 py-2.5 bg-amber-600/20 border-b border-amber-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/20 rounded-lg text-amber-400">
            <FiClock size={14} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Tempo de Espera</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDuplicate}
            className="p-1 text-gray-400 hover:text-amber-400 hover:bg-white/10 rounded-lg transition-colors"
            title="Duplicar Nó"
          >
            <FiCopy size={13} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors"
            title="Excluir Nó"
          >
            <FiTrash2 size={13} />
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-3.5 grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Aguardar</label>
          <input
            type="number"
            min="1"
            value={delayValue}
            onChange={handleValueChange}
            className="nodrag nopan w-full px-2.5 py-2 bg-slate-800 border border-white/10 rounded-xl text-xs text-white font-bold text-center focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Unidade</label>
          <select
            value={delayUnit}
            onChange={handleUnitChange}
            className="nodrag nopan w-full px-2 py-2 bg-slate-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="minutes">Minutos</option>
            <option value="hours">Horas</option>
            <option value="days">Dias</option>
          </select>
        </div>
      </div>

      {/* Handle Saída Inferior */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3.5 !h-3.5 !bg-amber-500 !border-2 !border-slate-900 !bottom-[-7px]"
      />
    </div>
  );
}

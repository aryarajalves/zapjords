import React from 'react';
import { Handle, Position } from 'reactflow';
import { FiCalendar, FiTrash2, FiCopy } from 'react-icons/fi';

export default function EmailWaitUntilNode({ id, data }) {
  const waitMode = data.wait_mode || 'time_window';
  const startTime = data.start_time || '08:00';
  const endTime = data.end_time || '18:00';
  const weekdaysOnly = data.weekdays_only ?? true;

  const handleUpdate = (fields) => {
    data.onUpdateNode?.(id, { ...data, ...fields });
  };

  const handleDelete = () => {
    data.onDeleteNode?.(id);
  };

  const handleDuplicate = () => {
    data.onDuplicateNode?.(id);
  };

  return (
    <div className="relative w-80 bg-slate-900/95 border-2 border-orange-500 rounded-2xl shadow-xl shadow-orange-500/10 text-white backdrop-blur-md">
      {/* Handle Entrada Superior */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-4.5 !h-4.5 !bg-orange-500 !border-[2.5px] !border-white !shadow-[0_0_12px_rgba(249,115,22,0.95)] !top-[-9px] !left-1/2 -translate-x-1/2 !z-50 hover:!scale-125 !transition-transform !cursor-crosshair"
      />

      {/* Cabeçalho */}
      <div className="px-3.5 py-2.5 bg-orange-600/20 border-b border-orange-500/30 flex items-center justify-between rounded-t-[14px]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-500/20 rounded-lg text-orange-400">
            <FiCalendar size={14} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-orange-300">Esperar Horário / Dia</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDuplicate}
            className="p-1 text-gray-400 hover:text-orange-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
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
          <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Modo de Espera</label>
          <select
            value={waitMode}
            onChange={(e) => handleUpdate({ wait_mode: e.target.value })}
            className="nodrag nopan w-full px-2.5 py-1.5 bg-slate-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-semibold"
          >
            <option value="time_window">Janela de Horário Comercial</option>
            <option value="specific_time">Horário Exato no Próximo Dia</option>
          </select>
        </div>

        {waitMode === 'time_window' ? (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">A partir das</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleUpdate({ start_time: e.target.value })}
                className="nodrag nopan w-full px-2 py-1.5 bg-slate-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 text-center font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Até às</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => handleUpdate({ end_time: e.target.value })}
                className="nodrag nopan w-full px-2 py-1.5 bg-slate-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 text-center font-bold"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Disparar às</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => handleUpdate({ start_time: e.target.value })}
              className="nodrag nopan w-full px-2 py-1.5 bg-slate-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 text-center font-bold"
            />
          </div>
        )}

        <label className="flex items-center gap-2 pt-1 text-[11px] text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={weekdaysOnly}
            onChange={(e) => handleUpdate({ weekdays_only: e.target.checked })}
            className="nodrag nopan rounded border-gray-600 bg-slate-800 text-orange-500 focus:ring-0"
          />
          <span>Apenas em dias úteis (Seg a Sex)</span>
        </label>
      </div>

      {/* Handle Saída Inferior */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-4.5 !h-4.5 !bg-orange-500 !border-[2.5px] !border-white !shadow-[0_0_12px_rgba(249,115,22,0.95)] !bottom-[-9px] !left-1/2 -translate-x-1/2 !z-50 hover:!scale-125 !transition-transform !cursor-crosshair"
      />
    </div>
  );
}

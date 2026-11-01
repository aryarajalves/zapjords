import React from 'react';
import { Handle, Position } from 'reactflow';
import { FiPieChart, FiTrash2, FiCopy } from 'react-icons/fi';

export default function EmailSplitNode({ id, data }) {
  const splitRatio = data.split_ratio ?? 50;

  const handleRatioChange = (e) => {
    const val = Math.min(90, Math.max(10, Number(e.target.value) || 50));
    data.onUpdateNode?.(id, { ...data, split_ratio: val });
  };

  const handleDelete = () => {
    data.onDeleteNode?.(id);
  };

  const handleDuplicate = () => {
    data.onDuplicateNode?.(id);
  };

  return (
    <div className="relative w-80 bg-slate-900/95 border-2 border-cyan-500 rounded-2xl shadow-xl shadow-cyan-500/10 text-white backdrop-blur-md">
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
            <FiPieChart size={14} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">Divisor A/B (Split)</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDuplicate}
            className="p-1 text-gray-400 hover:text-cyan-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
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
      <div className="p-3.5 space-y-3 text-xs">
        <div>
          <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 mb-1">
            <span>Rota A: <strong className="text-cyan-300 font-extrabold">{splitRatio}%</strong></span>
            <span>Rota B: <strong className="text-fuchsia-300 font-extrabold">{100 - splitRatio}%</strong></span>
          </div>
          <input
            type="range"
            min="10"
            max="90"
            step="5"
            value={splitRatio}
            onChange={handleRatioChange}
            className="nodrag nopan w-full accent-cyan-500 cursor-pointer"
          />
        </div>

        {/* Indicadores Visuais das Duas Saídas */}
        <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[10px] font-bold">
          <div className="text-cyan-300 bg-cyan-500/10 px-2 py-1 rounded-lg border border-cyan-500/20 text-center">
            ROTA A ({splitRatio}%)
          </div>
          <div className="text-fuchsia-300 bg-fuchsia-500/10 px-2 py-1 rounded-lg border border-fuchsia-500/20 text-center">
            ROTA B ({100 - splitRatio}%)
          </div>
        </div>
      </div>

      {/* Saída Rota A (Esquerda) */}
      <Handle
        type="source"
        id="branch_a"
        position={Position.Bottom}
        style={{ left: '25%' }}
        className="!w-4.5 !h-4.5 !bg-cyan-500 !border-[2.5px] !border-white !shadow-[0_0_12px_rgba(6,182,212,0.95)] !bottom-[-9px] !z-50 hover:!scale-125 !transition-transform !cursor-crosshair"
      />

      {/* Saída Rota B (Direita) */}
      <Handle
        type="source"
        id="branch_b"
        position={Position.Bottom}
        style={{ left: '75%' }}
        className="!w-4.5 !h-4.5 !bg-fuchsia-500 !border-[2.5px] !border-white !shadow-[0_0_12px_rgba(217,70,239,0.95)] !bottom-[-9px] !z-50 hover:!scale-125 !transition-transform !cursor-crosshair"
      />
    </div>
  );
}

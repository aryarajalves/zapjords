import React from 'react';
import { Handle, Position } from 'reactflow';
import { FiTrello, FiTrash2, FiCopy } from 'react-icons/fi';

export default function EmailKanbanNode({ id, data }) {
  const stageName = data.stage_name || '';

  const handleStageChange = (e) => {
    data.onUpdateNode?.(id, { ...data, stage_name: e.target.value });
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
            <FiTrello size={14} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Mover no Kanban</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleDuplicate}
            className="p-1 text-gray-400 hover:text-amber-400 hover:bg-white/10 rounded-lg transition-colors"
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
      <div className="p-3.5 space-y-2.5 text-xs">
        <div>
          <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Coluna / Etapa de Destino *</label>
          <input
            type="text"
            value={stageName}
            onChange={handleStageChange}
            placeholder="Ex: Em Negociação ou Follow-up"
            className="nodrag nopan w-full px-2.5 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 font-medium"
          />
        </div>

        <p className="text-[10px] text-gray-400">
          Move ou cria o card da oportunidade do lead nesta etapa do Kanban do CRM.
        </p>
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

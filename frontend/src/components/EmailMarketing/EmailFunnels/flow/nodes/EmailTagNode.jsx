import React from 'react';
import { Handle, Position } from 'reactflow';
import { FiTag, FiTrash2, FiCopy } from 'react-icons/fi';
import EmailTagCombobox from '../../components/EmailTagCombobox';

export default function EmailTagNode({ id, data }) {
  const action = data.action || 'add';
  const tag = data.tag || '';

  const handleActionChange = (e) => {
    data.onUpdateNode?.(id, { ...data, action: e.target.value });
  };

  const handleTagChange = (newTag) => {
    data.onUpdateNode?.(id, { ...data, tag: newTag });
  };

  const handleDelete = () => {
    data.onDeleteNode?.(id);
  };

  const handleDuplicate = () => {
    data.onDuplicateNode?.(id);
  };

  return (
    <div className="relative w-72 bg-slate-900/95 border-2 border-emerald-500 rounded-2xl shadow-xl shadow-emerald-500/10 text-white backdrop-blur-md">
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
            <FiTag size={14} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Ação de Etiqueta</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDuplicate}
            className="p-1 text-gray-400 hover:text-emerald-400 hover:bg-white/10 rounded-lg transition-colors"
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
      <div className="p-3.5 space-y-2.5 text-xs rounded-b-[14px]">
        <div>
          <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Ação</label>
          <select
            value={action}
            onChange={handleActionChange}
            className="nodrag nopan w-full px-2.5 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="add">Adicionar Etiqueta ao Lead</option>
            <option value="remove">Remover Etiqueta do Lead</option>
          </select>
        </div>

        <div className="nodrag nopan">
          <EmailTagCombobox
            label="Nome da Etiqueta"
            value={tag}
            onChange={handleTagChange}
            placeholder="Selecione ou crie a tag..."
            multiple={false}
          />
        </div>
      </div>

      {/* Handle Saída Inferior */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-4.5 !h-4.5 !bg-emerald-500 !border-[2.5px] !border-white !shadow-[0_0_12px_rgba(16,185,129,0.95)] !bottom-[-9px] !left-1/2 -translate-x-1/2 !z-50 hover:!scale-125 !transition-transform !cursor-crosshair"
      />
    </div>
  );
}

import React from 'react';
import { Handle, Position } from 'reactflow';
import { FiMessageSquare, FiTrash2, FiCopy } from 'react-icons/fi';

export default function EmailWhatsAppNode({ id, data }) {
  const message = data.message || '';

  const handleMessageChange = (e) => {
    data.onUpdateNode?.(id, { ...data, message: e.target.value });
  };

  const handleDelete = () => {
    data.onDeleteNode?.(id);
  };

  const handleDuplicate = () => {
    data.onDuplicateNode?.(id);
  };

  return (
    <div className="w-72 bg-slate-900/95 border-2 border-emerald-500 rounded-2xl shadow-xl shadow-emerald-500/10 overflow-hidden text-white backdrop-blur-md">
      {/* Handle Entrada Superior */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3.5 !h-3.5 !bg-emerald-500 !border-2 !border-slate-900 !top-[-7px]"
      />

      {/* Cabeçalho */}
      <div className="px-3.5 py-2.5 bg-emerald-600/20 border-b border-emerald-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400">
            <FiMessageSquare size={14} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Mensagem WhatsApp</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleDuplicate}
            className="p-1 text-gray-400 hover:text-emerald-400 hover:bg-white/10 rounded-lg transition-colors"
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
          <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Texto da Mensagem *</label>
          <textarea
            rows={3}
            value={message}
            onChange={handleMessageChange}
            placeholder="Olá {{nome}}, vimos que você se interessou..."
            className="nodrag nopan w-full px-2.5 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none font-sans"
          />
        </div>

        <p className="text-[10px] text-gray-400">
          Dispara via API oficial se o lead possuir telefone válido cadastrado.
        </p>
      </div>

      {/* Handle Saída Inferior */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3.5 !h-3.5 !bg-emerald-500 !border-2 !border-slate-900 !bottom-[-7px]"
      />
    </div>
  );
}

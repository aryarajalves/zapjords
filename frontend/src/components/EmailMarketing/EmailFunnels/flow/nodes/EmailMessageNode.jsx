import React from 'react';
import { Handle, Position } from 'reactflow';
import { FiMail, FiTrash2, FiCopy } from 'react-icons/fi';

export default function EmailMessageNode({ id, data }) {
  const templates = data.templates || [];
  const selectedTemplateId = data.template_id;
  const subject = data.subject || '';

  const handleTemplateChange = (e) => {
    const tId = Number(e.target.value) || null;
    data.onUpdateNode?.(id, { ...data, template_id: tId });
  };

  const handleSubjectChange = (e) => {
    data.onUpdateNode?.(id, { ...data, subject: e.target.value });
  };

  const handleDelete = () => {
    data.onDeleteNode?.(id);
  };

  const handleDuplicate = () => {
    data.onDuplicateNode?.(id);
  };

  return (
    <div className="w-80 bg-slate-900/95 border-2 border-indigo-500 rounded-2xl shadow-xl shadow-indigo-500/10 overflow-hidden text-white backdrop-blur-md">
      {/* Handle Entrada Superior */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3.5 !h-3.5 !bg-indigo-500 !border-2 !border-slate-900 !top-[-7px]"
      />

      {/* Cabeçalho */}
      <div className="px-3.5 py-2.5 bg-indigo-600/20 border-b border-indigo-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400">
            <FiMail size={14} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Disparo de E-mail</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDuplicate}
            className="p-1 text-gray-400 hover:text-indigo-400 hover:bg-white/10 rounded-lg transition-colors"
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
      <div className="p-3.5 space-y-3 text-xs">
        <div>
          <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Template de E-mail *</label>
          <select
            value={selectedTemplateId || ''}
            onChange={handleTemplateChange}
            className="nodrag nopan w-full px-2.5 py-2 bg-slate-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">Selecione um template cadastrado...</option>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
            Assunto Personalizado (opcional)
          </label>
          <input
            type="text"
            value={subject}
            onChange={handleSubjectChange}
            placeholder="Deixe em branco para usar o do template"
            className="nodrag nopan w-full px-2.5 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Handle Saída Inferior */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3.5 !h-3.5 !bg-indigo-500 !border-2 !border-slate-900 !bottom-[-7px]"
      />
    </div>
  );
}

import React from 'react';
import { Handle, Position } from 'reactflow';
import { FiGitBranch, FiTrash2, FiCopy, FiCheckCircle, FiXCircle } from 'react-icons/fi';

export default function EmailConditionNode({ id, data }) {
  const conditionType = data.condition_type || 'has_tag';
  const tagName = data.tag_name || '';

  const handleConditionTypeChange = (e) => {
    data.onUpdateNode?.(id, { ...data, condition_type: e.target.value });
  };

  const handleTagNameChange = (e) => {
    data.onUpdateNode?.(id, { ...data, tag_name: e.target.value });
  };

  const handleDelete = () => {
    data.onDeleteNode?.(id);
  };

  const handleDuplicate = () => {
    data.onDuplicateNode?.(id);
  };

  return (
    <div className="relative w-80 bg-slate-900/95 border-2 border-violet-500 rounded-2xl shadow-xl shadow-violet-500/10 text-white backdrop-blur-md">
      {/* Handle Entrada Superior */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-4.5 !h-4.5 !bg-violet-500 !border-[2.5px] !border-white !shadow-[0_0_12px_rgba(139,92,246,0.95)] !top-[-9px] !left-1/2 -translate-x-1/2 !z-50 hover:!scale-125 !transition-transform !cursor-crosshair"
      />

      {/* Cabeçalho */}
      <div className="px-3.5 py-2.5 bg-violet-600/20 border-b border-violet-500/30 flex items-center justify-between rounded-t-[14px]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-violet-500/20 rounded-lg text-violet-400">
            <FiGitBranch size={14} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-violet-300">Condição (Se / Senão)</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDuplicate}
            className="p-1 text-gray-400 hover:text-violet-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
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
          <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Verificar se o Lead</label>
          <select
            value={conditionType}
            onChange={handleConditionTypeChange}
            className="nodrag nopan w-full px-2.5 py-1.5 bg-slate-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 font-semibold"
          >
            <option value="has_tag">Possui a Etiqueta / Tag</option>
            <option value="opened_email">Abriu o E-mail Anterior</option>
            <option value="clicked_link">Clicou em Algum Link</option>
          </select>
        </div>

        {conditionType === 'has_tag' && (
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Nome da Etiqueta *</label>
            <input
              type="text"
              value={tagName}
              onChange={handleTagNameChange}
              placeholder="Ex: interessado, boleto_gerado..."
              className="nodrag nopan w-full px-2.5 py-1.5 bg-slate-800 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />
          </div>
        )}

        {/* Indicadores Visuais das Duas Saídas */}
        <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[10px] font-bold">
          <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
            <FiCheckCircle size={12} />
            <span>SIM (Atende)</span>
          </div>
          <div className="flex items-center justify-end gap-1 text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20">
            <span>NÃO (Outro)</span>
            <FiXCircle size={12} />
          </div>
        </div>
      </div>

      {/* Saída 1: SIM (Esquerda) */}
      <Handle
        type="source"
        id="true"
        position={Position.Bottom}
        style={{ left: '25%' }}
        className="!w-4.5 !h-4.5 !bg-emerald-500 !border-[2.5px] !border-white !shadow-[0_0_12px_rgba(16,185,129,0.95)] !bottom-[-9px] !z-50 hover:!scale-125 !transition-transform !cursor-crosshair"
      />

      {/* Saída 2: NÃO (Direita) */}
      <Handle
        type="source"
        id="false"
        position={Position.Bottom}
        style={{ left: '75%' }}
        className="!w-4.5 !h-4.5 !bg-rose-500 !border-[2.5px] !border-white !shadow-[0_0_12px_rgba(244,63,94,0.95)] !bottom-[-9px] !z-50 hover:!scale-125 !transition-transform !cursor-crosshair"
      />
    </div>
  );
}

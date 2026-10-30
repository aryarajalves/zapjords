import React from 'react';
import { FiArrowUp, FiArrowDown, FiTrash2 } from 'react-icons/fi';

export default function EmailFunnelStepItem({
  step,
  index,
  totalSteps,
  templates,
  onUpdate,
  onMove,
  onRemove
}) {
  return (
    <div className="p-3 bg-slate-800/60 border border-white/10 rounded-xl flex items-center gap-3">
      <span className="w-6 h-6 rounded-full bg-slate-700 text-gray-300 text-xs font-bold flex items-center justify-center shrink-0">
        {index + 1}
      </span>

      {/* Conteúdo específico por tipo de passo */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {step.type === 'email' && (
          <>
            <div>
              <span className="text-[10px] text-gray-400 block mb-0.5">Template de E-mail</span>
              <select
                value={step.template_id || ''}
                onChange={(e) => onUpdate(index, 'template_id', Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
              >
                <option value="">Selecione um template...</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block mb-0.5">Assunto Customizado (opcional)</span>
              <input
                type="text"
                value={step.subject || ''}
                onChange={(e) => onUpdate(index, 'subject', e.target.value)}
                placeholder="Deixe em branco para usar o do template"
                className="w-full px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
              />
            </div>
          </>
        )}

        {step.type === 'delay' && (
          <>
            <div>
              <span className="text-[10px] text-amber-400 block mb-0.5">Tempo de Espera</span>
              <input
                type="number"
                min="1"
                value={step.delay_value || 1}
                onChange={(e) => onUpdate(index, 'delay_value', Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
              />
            </div>
            <div>
              <span className="text-[10px] text-amber-400 block mb-0.5">Unidade</span>
              <select
                value={step.delay_unit || 'hours'}
                onChange={(e) => onUpdate(index, 'delay_unit', e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
              >
                <option value="minutes">Minutos</option>
                <option value="hours">Horas</option>
                <option value="days">Dias</option>
              </select>
            </div>
          </>
        )}

        {step.type === 'tag_action' && (
          <>
            <div>
              <span className="text-[10px] text-emerald-400 block mb-0.5">Ação</span>
              <select
                value={step.action || 'add'}
                onChange={(e) => onUpdate(index, 'action', e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
              >
                <option value="add">Adicionar Etiqueta ao Lead</option>
                <option value="remove">Remover Etiqueta do Lead</option>
              </select>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 block mb-0.5">Nome da Etiqueta</span>
              <input
                type="text"
                value={step.tag || ''}
                onChange={(e) => onUpdate(index, 'tag', e.target.value)}
                placeholder="Ex: recebeu_passo_1"
                className="w-full px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
              />
            </div>
          </>
        )}
      </div>

      {/* Ações de Reordenação e Exclusão */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onMove(index, -1)}
          className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
          title="Subir"
        >
          <FiArrowUp size={13} />
        </button>
        <button
          type="button"
          disabled={index === totalSteps - 1}
          onClick={() => onMove(index, 1)}
          className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
          title="Descer"
        >
          <FiArrowDown size={13} />
        </button>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-1 text-rose-400 hover:text-rose-300 ml-1"
          title="Remover passo"
        >
          <FiTrash2 size={13} />
        </button>
      </div>
    </div>
  );
}

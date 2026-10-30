import React from 'react';
import { FiZap, FiShield, FiPlus, FiMail, FiClock, FiTag, FiMousePointer } from 'react-icons/fi';
import EmailTagCombobox from '../components/EmailTagCombobox';

export default function EmailFunnelSidebar({
  name,
  setName,
  description,
  setDescription,
  triggerType,
  setTriggerType,
  triggerTag,
  setTriggerTag,
  triggerWebhookStatus,
  setTriggerWebhookStatus,
  stopOnPurchase,
  setStopOnPurchase,
  stopTagsInput,
  setStopTagsInput,
  onAddNode
}) {
  return (
    <div className="w-80 bg-slate-900/90 border-r border-white/10 p-5 flex flex-col gap-5 overflow-y-auto z-10 backdrop-blur-md shrink-0">
      
      {/* Nome e Descrição */}
      <div className="space-y-3">
        <div>
          <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Nome do Funil *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Boas-vindas ou Recuperação Pix"
            className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-semibold"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Descrição</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Objetivo da régua"
            className="w-full px-3 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Gatilho de Entrada: apenas Tag por enquanto */}
      <div className="p-3.5 bg-slate-800/50 border border-white/5 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <FiZap /> Gatilho de Entrada
          </div>
          <span className="text-[9px] font-bold uppercase bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
            Por Tag
          </span>
        </div>

        <div className="p-2 bg-slate-900/60 rounded-xl border border-white/5 text-[11px] text-gray-300 flex items-center gap-2">
          <FiTag className="text-emerald-400 shrink-0" size={13} />
          <span>Inicia quando o lead receber a etiqueta:</span>
        </div>

        {/* Dropdown com Tags dos Contatos + Criação de Tag */}
        <EmailTagCombobox
          label="Nome da Etiqueta *"
          value={triggerTag}
          onChange={setTriggerTag}
          placeholder="Selecione ou digite uma tag..."
          multiple={false}
        />
      </div>

      {/* Interrupção Inteligente */}
      <div className="p-3.5 bg-purple-950/20 border border-purple-500/20 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
          <FiShield /> Parada Inteligente
        </div>

        <label className="flex items-start gap-2 cursor-pointer text-xs text-gray-300">
          <input
            type="checkbox"
            checked={stopOnPurchase}
            onChange={(e) => setStopOnPurchase(e.target.checked)}
            className="mt-0.5 rounded border-gray-600 bg-slate-800 text-purple-600 focus:ring-0"
          />
          <span>Interromper fluxo em <strong>Compra Aprovada</strong></span>
        </label>

        {/* Dropdown Multi-Tag com Tags dos Contatos + Criação de Tag */}
        <EmailTagCombobox
          label="Stop Tags (interromper se possuir):"
          value={stopTagsInput}
          onChange={(tags) => setStopTagsInput(Array.isArray(tags) ? tags.join(', ') : tags)}
          placeholder="Selecione ou crie stop tags..."
          multiple={true}
        />
      </div>

      {/* Dica do Botão Direito */}
      <div className="p-2.5 bg-blue-950/20 border border-blue-500/20 rounded-xl text-[11px] text-blue-300/90 flex items-center gap-2">
        <FiMousePointer className="text-blue-400 shrink-0" size={14} />
        <span>Clique com o <strong>botão direito no canvas</strong> para adicionar novos nós onde desejar!</span>
      </div>

      {/* Adicionar Novos Nós ao Canvas */}
      <div className="space-y-2 pt-1 border-t border-white/5">
        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
          + Adicionar Nós ao Fluxo
        </label>
        
        <button
          type="button"
          onClick={() => onAddNode('email')}
          className="w-full px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
        >
          <FiMail size={14} className="text-indigo-400" /> + Envio de E-mail
        </button>

        <button
          type="button"
          onClick={() => onAddNode('delay')}
          className="w-full px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
        >
          <FiClock size={14} className="text-amber-400" /> + Tempo de Espera (Delay)
        </button>

        <button
          type="button"
          onClick={() => onAddNode('tag')}
          className="w-full px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
        >
          <FiTag size={14} className="text-emerald-400" /> + Ação de Etiqueta
        </button>
      </div>

    </div>
  );
}

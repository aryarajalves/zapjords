import React, { useState, useEffect } from 'react';
import { FiX, FiMail, FiClock, FiTag, FiCheck, FiShield } from 'react-icons/fi';
import EmailFunnelStepItem from './components/EmailFunnelStepItem';

export default function EmailFunnelEditorModal({ funnel, templates, onClose, onSave }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('tag');
  const [triggerTag, setTriggerTag] = useState('');
  const [triggerWebhookStatus, setTriggerWebhookStatus] = useState('carrinho_abandonado');
  const [stopTagsInput, setStopTagsInput] = useState('');
  const [stopOnPurchase, setStopOnPurchase] = useState(true);
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    if (funnel) {
      setName(funnel.name || '');
      setDescription(funnel.description || '');
      setTriggerType(funnel.trigger_type || 'tag');
      const trigConf = funnel.trigger_config || {};
      setTriggerTag(trigConf.tag || '');
      setTriggerWebhookStatus(trigConf.status || 'carrinho_abandonado');
      setStopTagsInput(Array.isArray(funnel.stop_tags) ? funnel.stop_tags.join(', ') : '');
      setStopOnPurchase(funnel.stop_on_purchase ?? true);
      setSteps(Array.isArray(funnel.steps) ? funnel.steps : []);
    } else {
      setName('');
      setDescription('');
      setTriggerType('tag');
      setTriggerTag('');
      setTriggerWebhookStatus('carrinho_abandonado');
      setStopTagsInput('');
      setStopOnPurchase(true);
      setSteps([
        { id: `step_${Date.now()}_1`, type: 'email', template_id: templates[0]?.id || null, subject: '' },
        { id: `step_${Date.now()}_2`, type: 'delay', delay_value: 24, delay_unit: 'hours' },
        { id: `step_${Date.now()}_3`, type: 'email', template_id: templates[0]?.id || null, subject: '' }
      ]);
    }
  }, [funnel, templates]);

  const addStep = (type) => {
    const id = `step_${Date.now()}`;
    if (type === 'email') {
      setSteps([...steps, { id, type: 'email', template_id: templates[0]?.id || null, subject: '' }]);
    } else if (type === 'delay') {
      setSteps([...steps, { id, type: 'delay', delay_value: 2, delay_unit: 'hours' }]);
    } else if (type === 'tag_action') {
      setSteps([...steps, { id, type: 'tag_action', action: 'add', tag: '' }]);
    }
  };

  const updateStep = (index, key, value) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [key]: value };
    setSteps(newSteps);
  };

  const removeStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const moveStep = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    const newSteps = [...steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIndex];
    newSteps[targetIndex] = temp;
    setSteps(newSteps);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const stopTags = stopTagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const trigger_config = {};
    if (triggerType === 'tag') trigger_config.tag = triggerTag.trim();
    if (triggerType === 'webhook_status') trigger_config.status = triggerWebhookStatus;

    onSave({
      name: name.trim(),
      description: description.trim(),
      trigger_type: triggerType,
      trigger_config,
      stop_tags: stopTags,
      stop_on_purchase: stopOnPurchase,
      steps
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-800/50">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            {funnel ? 'Editar Funil de E-mail' : 'Novo Funil de E-mail Marketing'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <FiX size={18} />
          </button>
        </div>

        {/* Corpo com scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Dados Principais */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Nome do Funil *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Boas-vindas Novos Clientes ou Recuperação de Pix"
                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Descrição (opcional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Objetivo desta régua de relacionamento"
                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Gatilho de Entrada */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-white/5 space-y-3">
            <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider">⚡ Gatilho de Entrada</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-gray-400 block mb-1">Quando iniciar o funil?</span>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="tag">Quando o lead receber uma Etiqueta (Tag)</option>
                  <option value="webhook_status">Quando ocorrer um Evento de Webhook</option>
                  <option value="manual">Disparo Manual / Lista de Contatos</option>
                </select>
              </div>

              {triggerType === 'tag' && (
                <div>
                  <span className="text-[11px] text-gray-400 block mb-1">Nome da Etiqueta</span>
                  <input
                    type="text"
                    value={triggerTag}
                    onChange={(e) => setTriggerTag(e.target.value)}
                    placeholder="Ex: lead_capturado ou interessado"
                    className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {triggerType === 'webhook_status' && (
                <div>
                  <span className="text-[11px] text-gray-400 block mb-1">Status do Webhook</span>
                  <select
                    value={triggerWebhookStatus}
                    onChange={(e) => setTriggerWebhookStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="carrinho_abandonado">Carrinho Abandonado</option>
                    <option value="pix_gerado">Pix Gerado</option>
                    <option value="cartao_recusado">Cartão Recusado</option>
                    <option value="boleto_impresso">Boleto Impresso</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Interrupção Inteligente */}
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
              <FiShield /> Interrupção Inteligente
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-200">
              <input
                type="checkbox"
                checked={stopOnPurchase}
                onChange={(e) => setStopOnPurchase(e.target.checked)}
                className="rounded border-gray-600 bg-slate-800 text-purple-600 focus:ring-0"
              />
              Interromper funil automaticamente se o lead comprar o produto (Compra Aprovada)
            </label>

            <div>
              <span className="text-[11px] text-gray-400 block mb-1">Etiquetas de Parada (Stop Tags) - separadas por vírgula:</span>
              <input
                type="text"
                value={stopTagsInput}
                onChange={(e) => setStopTagsInput(e.target.value)}
                placeholder="Ex: comprou, cliente_vip, descadastro"
                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Passos do Funil */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Passos da Régua ({steps.length})
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => addStep('email')}
                  className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <FiMail size={12} /> + E-mail
                </button>
                <button
                  type="button"
                  onClick={() => addStep('delay')}
                  className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <FiClock size={12} /> + Delay
                </button>
                <button
                  type="button"
                  onClick={() => addStep('tag_action')}
                  className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <FiTag size={12} /> + Tag
                </button>
              </div>
            </div>

            {/* Lista dos Blocos com EmailFunnelStepItem */}
            <div className="space-y-2">
              {steps.map((st, idx) => (
                <EmailFunnelStepItem
                  key={st.id || idx}
                  step={st}
                  index={idx}
                  totalSteps={steps.length}
                  templates={templates}
                  onUpdate={updateStep}
                  onMove={moveStep}
                  onRemove={removeStep}
                />
              ))}
            </div>
          </div>

          {/* Rodapé com botão Salvar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
            >
              <FiCheck size={14} /> Salvar Funil
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

import React from 'react';
import { FiMail, FiSend, FiInbox, FiEdit3 } from 'react-icons/fi';
import SearchableSelect from '../../SearchableSelect';

export default function EmailMarketingTriggerSection({
  mapping,
  mIndex,
  updateMapping,
  emailTemplates = [],
  emailFunnels = []
}) {
  const isEmailActive = Boolean(
    mapping.email_active || 
    mapping.email_template_id || 
    mapping.email_funnel_id
  );

  const handleToggleActive = () => {
    const nextState = !isEmailActive;
    updateMapping(mIndex, {
      email_active: nextState,
      // se estiver desativando e o usuário quiser limpar
      ...(!nextState ? { email_template_id: null, email_funnel_id: null, email_subject: '' } : {})
    });
  };

  const templateOptions = (emailTemplates || []).map(t => ({
    value: t.id,
    label: `${t.name || 'Sem nome'}${t.subject ? ` (${t.subject})` : ''}`
  }));

  const funnelOptions = (emailFunnels || []).map(f => ({
    value: f.id,
    label: `${f.is_active ? '🟢 ' : '⚪ '}${f.name || 'Sem nome'}${f.trigger_tag ? ` [Tag: ${f.trigger_tag}]` : ''}`
  }));

  return (
    <div className="bg-gray-50/50 dark:bg-white/[0.02] p-4 rounded-2xl border border-gray-100 dark:border-white/5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
          <FiMail className="text-purple-400" size={13} /> 3. Disparo por E-mail Marketing (Opcional)
        </h4>
        <button
          type="button"
          onClick={handleToggleActive}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isEmailActive ? 'bg-purple-600' : 'bg-gray-700'
          }`}
          title={isEmailActive ? 'Desativar disparo por e-mail' : 'Ativar disparo por e-mail'}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isEmailActive ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {isEmailActive ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Template de E-mail */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <FiSend size={11} className="text-purple-400" /> Template de E-mail
              </label>
              <SearchableSelect
                options={templateOptions}
                value={mapping.email_template_id}
                onChange={(val) => {
                  const tpl = emailTemplates.find(t => String(t.id) === String(val));
                  updateMapping(mIndex, {
                    email_template_id: val ? Number(val) : null,
                    email_active: true,
                    // Se não tiver assunto personalizado ainda, pré-preenche com o do template
                    email_subject: mapping.email_subject || (tpl?.subject || '')
                  });
                }}
                placeholder="Selecione um Template de E-mail..."
                allowNone
              />
            </div>

            {/* Funil de E-mail Marketing */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <FiInbox size={11} className="text-indigo-400" /> Funil de E-mail Marketing
              </label>
              <SearchableSelect
                options={funnelOptions}
                value={mapping.email_funnel_id}
                onChange={(val) => {
                  updateMapping(mIndex, {
                    email_funnel_id: val ? Number(val) : null,
                    email_active: true
                  });
                }}
                placeholder="Matricular em um Funil de E-mail..."
                allowNone
              />
            </div>
          </div>

          {/* Assunto Personalizado */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <FiEdit3 size={11} className="text-gray-400" /> Assunto do E-mail (Opcional - sobrescreve o template)
              </label>
              {mapping.email_subject && (
                <span className="text-[10px] text-purple-400 font-mono">Personalizado</span>
              )}
            </div>
            <input
              type="text"
              value={mapping.email_subject || ''}
              onChange={(e) => updateMapping(mIndex, 'email_subject', e.target.value)}
              className="w-full bg-white dark:bg-[#0b1120] border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 transition-all outline-none shadow-inner"
              placeholder="Ex: Seu acesso ao treinamento chegou! (suporta {{nome}})"
            />
          </div>

          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-[11px] text-purple-300 leading-relaxed">
            ℹ️ O e-mail será enviado para o endereço informado no checkout do webhook utilizando suas credenciais configuradas de E-mail Marketing.
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-gray-500 italic">
          Ative para disparar um e-mail individual ou matricular o cliente em um Funil de E-mail Marketing automaticamente quando este evento ocorrer.
        </p>
      )}
    </div>
  );
}

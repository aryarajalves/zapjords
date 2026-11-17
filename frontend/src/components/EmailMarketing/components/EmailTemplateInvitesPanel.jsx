import React from 'react';
import { FiKey } from 'react-icons/fi';
import PlatformInviteSection from '../../../pages/Integrations/components/MappingsConfig/PlatformInviteSection';
import BussolaInviteSection from '../../../pages/Integrations/components/MappingsConfig/BussolaInviteSection';

export default function EmailTemplateInvitesPanel({ formData, setFormData }) {
  const virtualMapping = {
    ...formData,
    auto_create_invite: true,
    bussola_auto_create_invite: true
  };

  const handleUpdateMapping = (_index, field, value) => {
    // Ignora os toggles booleanos virtuais porque no template a geração é automática pela presença da variável
    if (field === 'auto_create_invite' || field === 'bussola_auto_create_invite') {
      return;
    }
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-4 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-900/60">
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
        <FiKey className="shrink-0 mt-0.5 text-blue-500" size={16} />
        <div>
          <p className="font-bold">Configuração de Acessos do Template</p>
          <p className="mt-0.5 opacity-90">
            Sempre que este template tiver <code className="font-mono font-bold">{'{{link_cadastro}}'}</code> ou{' '}
            <code className="font-mono font-bold">{'{{link_bussola}}'}</code>, o sistema gerará o link único do aluno usando exatamente os cursos, cargo e validade definidos aqui.
          </p>
        </div>
      </div>

      <PlatformInviteSection
        mapping={virtualMapping}
        mIndex={0}
        updateMapping={handleUpdateMapping}
      />

      <BussolaInviteSection
        mapping={virtualMapping}
        mIndex={0}
        updateMapping={handleUpdateMapping}
        hideCustomApiKey={true}
      />
    </div>
  );
}

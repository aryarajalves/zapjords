import React from 'react';
import { FiKey } from 'react-icons/fi';
import PlatformInviteSection from '../../../pages/Integrations/components/MappingsConfig/PlatformInviteSection';
import BussolaInviteSection from '../../../pages/Integrations/components/MappingsConfig/BussolaInviteSection';

export const DEFAULT_BULK_INVITE_CONFIG = {
  invite_role: 'aluno',
  invite_duration_hours: 0,
  invite_course_access: [],
  bussola_invite_role: 'client',
  bussola_validity_type: 'never'
};

export function detectBulkInviteTokens(contacts = [], templateParams = {}, templateComponents = []) {
  const chunks = [];

  if (templateParams && typeof templateParams === 'object') {
    Object.values(templateParams).forEach(v => {
      if (v) chunks.push(String(v).toLowerCase());
    });
  }

  (templateComponents || []).forEach(comp => {
    if (comp && Array.isArray(comp.parameters)) {
      comp.parameters.forEach(p => {
        const text = typeof p === 'object' ? p?.text : p;
        if (text) chunks.push(String(text).toLowerCase());
      });
    }
  });

  (contacts || []).forEach(c => {
    if (!c || typeof c !== 'object') return;
    if (c.vars && typeof c.vars === 'object') {
      Object.values(c.vars).forEach(v => {
        if (v) chunks.push(String(v).toLowerCase());
      });
    }
    if (Array.isArray(c.components)) {
      c.components.forEach(comp => {
        if (comp && Array.isArray(comp.parameters)) {
          comp.parameters.forEach(p => {
            const text = typeof p === 'object' ? p?.text : p;
            if (text) chunks.push(String(text).toLowerCase());
          });
        }
      });
    }
  });

  const joined = chunks.join(' ');
  return {
    hasPlatformLink: joined.includes('{{link_cadastro}}') || joined.includes('{{invite_url}}'),
    hasBussolaLink: joined.includes('{{link_bussola}}')
  };
}

export default function BulkInviteConfigSection({
  contacts = [],
  templateParams = {},
  templateComponents = [],
  inviteConfig = DEFAULT_BULK_INVITE_CONFIG,
  setInviteConfig
}) {
  const { hasPlatformLink, hasBussolaLink } = detectBulkInviteTokens(
    contacts,
    templateParams,
    templateComponents
  );

  if (!hasPlatformLink && !hasBussolaLink) {
    return null;
  }

  const virtualMapping = {
    ...DEFAULT_BULK_INVITE_CONFIG,
    ...inviteConfig,
    auto_create_invite: true,
    bussola_auto_create_invite: true
  };

  const handleUpdateMapping = (_index, field, value) => {
    if (field === 'auto_create_invite' || field === 'bussola_auto_create_invite') {
      return;
    }
    setInviteConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="p-6 bg-slate-900/40 rounded-[2rem] border border-white/10 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <FiKey size={16} />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-white">
            Acessos & Convites Automáticos
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Detectamos variáveis de convite neste disparo. Configure abaixo os cursos, cargo e validade que serão gerados individualmente para cada contato.
          </p>
        </div>
      </div>

      {hasPlatformLink && (
        <PlatformInviteSection
          mapping={virtualMapping}
          mIndex={0}
          updateMapping={handleUpdateMapping}
          compact={true}
        />
      )}

      {hasBussolaLink && (
        <BussolaInviteSection
          mapping={virtualMapping}
          mIndex={0}
          updateMapping={handleUpdateMapping}
          hideCustomApiKey={true}
          compact={true}
        />
      )}
    </div>
  );
}

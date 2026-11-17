import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BulkInviteConfigSection, { detectBulkInviteTokens } from './BulkInviteConfigSection';
import { VAR_OPTIONS } from '../../RecipientSelector/utils';

vi.mock('../../../pages/Integrations/components/MappingsConfig/PlatformInviteSection', () => ({
  __esModule: true,
  default: ({ mapping, updateMapping }) => (
    <div data-testid="mock-platform-invite">
      <span>Role: {mapping.invite_role}</span>
      <button
        type="button"
        onClick={() => updateMapping(0, 'invite_course_access', [{ course_id: 3, access_duration: '1_year' }])}
      >
        Selecionar Curso Anual
      </button>
    </div>
  )
}));

vi.mock('../../../pages/Integrations/components/MappingsConfig/BussolaInviteSection', () => ({
  __esModule: true,
  default: ({ mapping, updateMapping, hideCustomApiKey }) => (
    <div data-testid="mock-bussola-invite">
      <span>HideKey: {String(Boolean(hideCustomApiKey))}</span>
      <span>Validity: {mapping.bussola_validity_type}</span>
      <button
        type="button"
        onClick={() => updateMapping(0, 'bussola_validity_type', '72h')}
      >
        Alterar Validade 72h
      </button>
    </div>
  )
}));

describe('BulkInviteConfigSection & VAR_OPTIONS Unit Tests', () => {
  it('VAR_OPTIONS contém {{link_cadastro}} e {{link_bussola}}', () => {
    const values = VAR_OPTIONS.map(o => o.value);
    expect(values).toContain('{{link_cadastro}}');
    expect(values).toContain('{{link_bussola}}');
  });

  it('detectBulkInviteTokens identifica variáveis nos parâmetros e contatos', () => {
    expect(detectBulkInviteTokens([], { BODY_1: '{{nome}}' })).toEqual({
      hasPlatformLink: false,
      hasBussolaLink: false
    });

    expect(
      detectBulkInviteTokens(
        [{ phone: '5511999999999', vars: { BODY_2: '{{link_bussola}}' } }],
        { BODY_1: '{{link_cadastro}}' }
      )
    ).toEqual({
      hasPlatformLink: true,
      hasBussolaLink: true
    });
  });

  it('não renderiza painel quando nenhuma variável de convite foi usada (Caminho A)', () => {
    render(
      <BulkInviteConfigSection
        contacts={[]}
        templateParams={{ BODY_1: '{{primeiro_nome}}' }}
        setInviteConfig={vi.fn()}
      />
    );
    expect(screen.queryByText(/Acessos & Convites Automáticos/i)).not.toBeInTheDocument();
  });

  it('renderiza painéis de Área de Membros e Bússola (sem API Key) e atualiza inviteConfig', () => {
    let state = {
      invite_role: 'aluno',
      invite_duration_hours: 0,
      invite_course_access: [],
      bussola_invite_role: 'client',
      bussola_validity_type: 'never'
    };
    const setInviteConfig = vi.fn((updater) => {
      state = typeof updater === 'function' ? updater(state) : updater;
    });

    render(
      <BulkInviteConfigSection
        contacts={[]}
        templateParams={{ BODY_1: '{{link_cadastro}}', BODY_2: '{{link_bussola}}' }}
        inviteConfig={state}
        setInviteConfig={setInviteConfig}
      />
    );

    expect(screen.getByText(/Acessos & Convites Automáticos/i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-platform-invite')).toBeInTheDocument();
    expect(screen.getByTestId('mock-bussola-invite')).toHaveTextContent('HideKey: true');

    fireEvent.click(screen.getByRole('button', { name: /Selecionar Curso Anual/i }));
    expect(state.invite_course_access).toEqual([{ course_id: 3, access_duration: '1_year' }]);

    fireEvent.click(screen.getByRole('button', { name: /Alterar Validade 72h/i }));
    expect(state.bussola_validity_type).toBe('72h');
  });
});

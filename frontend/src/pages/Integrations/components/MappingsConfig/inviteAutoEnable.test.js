import { describe, it, expect } from 'vitest';
import { applyInviteAutoEnable } from './inviteAutoEnable';

describe('applyInviteAutoEnable', () => {
  it('ativa auto_create_invite ao mapear link_cadastro em variables_mapping', () => {
    const prev = { auto_create_invite: false, bussola_auto_create_invite: false, variables_mapping: [] };
    const next = { ...prev, variables_mapping: [{ key: '1', type: 'body', value: 'link_cadastro' }] };

    const res = applyInviteAutoEnable(prev, next, 'variables_mapping');
    expect(res.mapping.auto_create_invite).toBe(true);
    expect(res.mapping.bussola_auto_create_invite).toBe(false);
    expect(res.enabledPlatform).toBe(true);
    expect(res.enabledBussola).toBe(false);
  });

  it('ativa bussola_auto_create_invite ao mapear link_bussola em variables_mapping', () => {
    const prev = { auto_create_invite: false, bussola_auto_create_invite: false, variables_mapping: [] };
    const next = { ...prev, variables_mapping: [{ key: '2', type: 'body', value: 'link_bussola' }] };

    const res = applyInviteAutoEnable(prev, next, 'variables_mapping');
    expect(res.mapping.bussola_auto_create_invite).toBe(true);
    expect(res.mapping.auto_create_invite).toBe(false);
    expect(res.enabledBussola).toBe(true);
    expect(res.enabledPlatform).toBe(false);
  });

  it('ativa ambos quando link_cadastro e link_bussola estão mapeados no mesmo gatilho', () => {
    const prev = { auto_create_invite: false, bussola_auto_create_invite: false, variables_mapping: [] };
    const next = {
      ...prev,
      variables_mapping: [
        { key: '1', type: 'body', value: 'link_cadastro' },
        { key: '2', type: 'body', value: 'link_bussola' },
      ],
    };

    const res = applyInviteAutoEnable(prev, next, 'variables_mapping');
    expect(res.mapping.auto_create_invite).toBe(true);
    expect(res.mapping.bussola_auto_create_invite).toBe(true);
    expect(res.enabledPlatform).toBe(true);
    expect(res.enabledBussola).toBe(true);
  });

  it('não reativa o toggle quando o usuário desliga manualmente na aba Avançado', () => {
    const prev = {
      auto_create_invite: true,
      bussola_auto_create_invite: true,
      variables_mapping: [{ key: '1', value: 'link_cadastro' }, { key: '2', value: 'link_bussola' }],
    };
    const next = { ...prev, auto_create_invite: false };

    const res = applyInviteAutoEnable(prev, next, 'auto_create_invite');
    expect(res.mapping.auto_create_invite).toBe(false);
    expect(res.enabledPlatform).toBe(false);
  });

  it('ativa automaticamente quando detecta {{link_bussola}} em custom_text ou followup_variables_mapping', () => {
    const prev = { auto_create_invite: false, bussola_auto_create_invite: false, custom_text: '' };
    const nextText = { ...prev, custom_text: 'Acesse aqui: {{link_bussola}}' };
    const resText = applyInviteAutoEnable(prev, nextText, 'custom_text');
    expect(resText.mapping.bussola_auto_create_invite).toBe(true);
    expect(resText.enabledBussola).toBe(true);

    const nextFollowup = { ...prev, followup_variables_mapping: [{ key: '1', value: 'invite_url' }] };
    const resFollowup = applyInviteAutoEnable(prev, nextFollowup, 'followup_variables_mapping');
    expect(resFollowup.mapping.auto_create_invite).toBe(true);
    expect(resFollowup.enabledPlatform).toBe(true);
  });
});

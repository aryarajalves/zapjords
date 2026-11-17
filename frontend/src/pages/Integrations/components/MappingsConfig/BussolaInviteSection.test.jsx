import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BussolaInviteSection from './BussolaInviteSection';
import * as AuthContext from '../../../../AuthContext';

vi.mock('../../../../contexts/ClientContext', () => ({
  useClient: () => ({ activeClient: { id: 1 } }),
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('BussolaInviteSection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza o cabeçalho e checkbox desativado por padrão', () => {
    const updateMapping = vi.fn();
    render(
      <BussolaInviteSection
        mapping={{ bussola_auto_create_invite: false }}
        mIndex={0}
        updateMapping={updateMapping}
      />
    );

    expect(screen.getByText(/Criação Automática de Acesso \(App Bússola Astrológica\)/i)).toBeInTheDocument();
    expect(screen.getByText(/{{link_bussola}}/i)).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(updateMapping).toHaveBeenCalledWith(0, 'bussola_auto_create_invite', true);
  });

  it('exibe opções de papel, validade e api key quando ativo', () => {
    const updateMapping = vi.fn();
    render(
      <BussolaInviteSection
        mapping={{
          bussola_auto_create_invite: true,
          bussola_invite_role: 'client',
          bussola_validity_type: 'never',
          bussola_custom_api_key: ''
        }}
        mIndex={0}
        updateMapping={updateMapping}
      />
    );

    expect(screen.getByText(/Aluno \(Padrão\)/i)).toBeInTheDocument();
    const adminBtn = screen.getByText(/Administrador/i);
    expect(adminBtn).toBeInTheDocument();

    fireEvent.click(adminBtn);
    expect(updateMapping).toHaveBeenCalledWith(0, 'bussola_invite_role', 'admin');

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '24h' } });
    expect(updateMapping).toHaveBeenCalledWith(0, 'bussola_validity_type', '24h');

    const apiKeyInput = screen.getByPlaceholderText(/Deixe em branco para usar a chave padrão das Configurações/i);
    fireEvent.change(apiKeyInput, { target: { value: 'chave_custom_123' } });
    expect(updateMapping).toHaveBeenCalledWith(0, 'bussola_custom_api_key', 'chave_custom_123');
  });

  it('gera link de teste com sucesso ao clicar no botão Testar Geração de Link', async () => {
    const fetchSpy = vi.spyOn(AuthContext, 'fetchWithAuth').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Conexão com a API da Bússola estabelecida com sucesso!',
        invite_url: 'https://bussolaappfront.aryaraj.shop/cadastro?token=tok123',
      }),
    });

    render(
      <BussolaInviteSection
        mapping={{
          bussola_auto_create_invite: true,
          bussola_invite_role: 'admin',
          bussola_validity_type: '48h',
          bussola_custom_api_key: '',
        }}
        mIndex={0}
        updateMapping={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Testar Geração de Link/i }));

    await waitFor(() => {
      expect(screen.getByText(/Link gerado: https:\/\/bussolaappfront\.aryaraj\.shop\/cadastro\?token=tok123/i)).toBeInTheDocument();
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/settings/test-bussola-connection'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          api_url: null,
          api_key: null,
          role: 'admin',
          validity_type: '48h',
        }),
      }),
      1
    );
  });

  it('exibe mensagem de erro quando o teste de geração de link falha', async () => {
    vi.spyOn(AuthContext, 'fetchWithAuth').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        status: 401,
        error: 'Chave inválida',
      }),
    });

    render(
      <BussolaInviteSection
        mapping={{
          bussola_auto_create_invite: true,
          bussola_invite_role: 'client',
          bussola_validity_type: 'never',
          bussola_custom_api_key: 'chave_errada',
        }}
        mIndex={0}
        updateMapping={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Testar Geração de Link/i }));

    await waitFor(() => {
      expect(screen.getByText(/Chave inválida/i)).toBeInTheDocument();
    });
  });

  it('oculta o campo de API Key personalizada quando hideCustomApiKey é true', () => {
    render(
      <BussolaInviteSection
        mapping={{
          bussola_auto_create_invite: true,
          bussola_invite_role: 'client',
          bussola_validity_type: 'never',
        }}
        mIndex={0}
        updateMapping={vi.fn()}
        hideCustomApiKey={true}
      />
    );

    expect(screen.queryByText(/API Key Personalizada da Bússola/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Deixe em branco para usar a chave padrão das Configurações/i)).not.toBeInTheDocument();
  });
});

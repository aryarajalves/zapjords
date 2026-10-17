import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BussolaInviteSection from './BussolaInviteSection';

describe('BussolaInviteSection', () => {
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
});

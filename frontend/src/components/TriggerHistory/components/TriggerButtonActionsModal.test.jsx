import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TriggerButtonActionsModal from './TriggerButtonActionsModal';

// Mocks
vi.mock('../../../AuthContext', () => ({
  fetchWithAuth: vi.fn()
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../../../hooks/useScrollLock', () => ({
  default: vi.fn()
}));

vi.mock('../../../contexts/ClientContext', () => ({
  useClient: () => ({ activeClient: { id: 14, name: 'Crassus' } })
}));

import { fetchWithAuth } from '../../../AuthContext';
import { toast } from 'react-hot-toast';

describe('TriggerButtonActionsModal Component', () => {
  const mockTrigger = {
    id: 123,
    template_name: 'template_convite|convite_outubro',
    button_actions: {
      'Me conta': {
        type: 'interaction',
        funnel_id: 10,
        enable_ai: false
      }
    }
  };

  const mockInfoResponse = {
    trigger_id: 123,
    template_name: 'template_convite|convite_outubro',
    template_buttons: ['Me conta', 'Sair da lista'],
    button_actions: {
      'Me conta': {
        type: 'interaction',
        funnel_id: 10,
        enable_ai: false
      }
    },
    funnels: [
      { id: 10, name: 'Funil Convite Aceito', is_active: true },
      { id: 20, name: 'Funil Descadastro', is_active: true }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve carregar informações dos botões e exibir na tela', async () => {
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => mockInfoResponse
    });

    render(
      <TriggerButtonActionsModal
        trigger={mockTrigger}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    expect(screen.getByText(/Carregando botões do template e funis/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Me conta')).toBeInTheDocument();
      expect(screen.getByText('Sair da lista')).toBeInTheDocument();
    });

    expect(screen.getByText(/Conectar Funis e Ações aos Botões/i)).toBeInTheDocument();
  });

  it('deve permitir alterar tipo de ação para interação e selecionar funil', async () => {
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => mockInfoResponse
    });

    render(
      <TriggerButtonActionsModal
        trigger={mockTrigger}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Sair da lista')).toBeInTheDocument();
    });

    // Clicar em "Bloqueio" para o botão "Sair da lista"
    const blockButtons = screen.getAllByRole('button', { name: /Bloqueio/i });
    fireEvent.click(blockButtons[1]); // segundo botão é 'Sair da lista'

    await waitFor(() => {
      expect(screen.getByText(/Funil opcional após bloquear:/i)).toBeInTheDocument();
    });
  });

  it('deve permitir adicionar novo botão customizado', async () => {
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => mockInfoResponse
    });

    render(
      <TriggerButtonActionsModal
        trigger={mockTrigger}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Me conta')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Nome de outro botão do template/i);
    const addButton = screen.getByRole('button', { name: /Adicionar/i });

    fireEvent.change(input, { target: { value: 'Quero Saber Mais' } });
    fireEvent.click(addButton);

    expect(screen.getByText('Quero Saber Mais')).toBeInTheDocument();
  });

  it('deve validar campo de funil obrigatório em ação de interação ao salvar', async () => {
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockInfoResponse,
        button_actions: {}
      })
    });

    render(
      <TriggerButtonActionsModal
        trigger={mockTrigger}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Me conta')).toBeInTheDocument();
    });

    // Mudar "Me conta" para Interação
    const interactionButtons = screen.getAllByRole('button', { name: /Interação/i });
    fireEvent.click(interactionButtons[0]);

    // Clicar em salvar sem selecionar funil
    const saveButton = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(saveButton);

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Selecione um funil para a ação de interação')
    );
  });

  it('deve salvar com sucesso quando os campos estiverem válidos', async () => {
    fetchWithAuth
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockInfoResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          button_actions: {
            'Me conta': { type: 'interaction', funnel_id: 10, enable_ai: false }
          }
        })
      });

    const onSavedMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <TriggerButtonActionsModal
        trigger={mockTrigger}
        onClose={onCloseMock}
        onSaved={onSavedMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Me conta')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Ações dos botões atualizadas com sucesso!');
      expect(onSavedMock).toHaveBeenCalled();
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('deve fechar o modal ao clicar no botão fechar ou cancelar', async () => {
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => mockInfoResponse
    });

    const onCloseMock = vi.fn();

    render(
      <TriggerButtonActionsModal
        trigger={mockTrigger}
        onClose={onCloseMock}
        onSaved={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Me conta')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelButton);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});

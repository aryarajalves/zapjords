import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TriggerButtonsActions from './TriggerButtonsActions';

describe('TriggerButtonsActions Component', () => {
  it('deve retornar null quando não houver buttonActions e nem onConfigure', () => {
    const { container } = render(<TriggerButtonsActions buttonActions={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('deve exibir botão de "Conectar Funis aos Botões" quando não houver ações mas houver template', () => {
    const onConfigureMock = vi.fn();
    const mockTrigger = { id: 50, template_name: 'promo_template' };

    render(
      <TriggerButtonsActions
        buttonActions={{}}
        trigger={mockTrigger}
        onConfigure={onConfigureMock}
      />
    );

    const button = screen.getByRole('button', { name: /Conectar Funis aos Botões/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onConfigureMock).toHaveBeenCalledWith(mockTrigger);
  });

  it('deve renderizar botões configurados e botão de edição', () => {
    const onConfigureMock = vi.fn();
    const mockTrigger = { id: 50, template_name: 'promo_template' };
    const mockActions = {
      'Sim, quero': { type: 'interaction', funnel_id: 1, funnel_name: 'Funil Boas Vindas' },
      'Não quero': { type: 'block', funnel_id: 2, funnel_name: 'Funil Descadastro' }
    };

    render(
      <TriggerButtonsActions
        buttonActions={mockActions}
        trigger={mockTrigger}
        onConfigure={onConfigureMock}
      />
    );

    expect(screen.getByText('Sim, quero')).toBeInTheDocument();
    expect(screen.getByText(/🔥 Interação: Funil Boas Vindas/i)).toBeInTheDocument();
    expect(screen.getByText('Não quero')).toBeInTheDocument();
    expect(screen.getByText(/🚫 Bloqueio: Funil Descadastro/i)).toBeInTheDocument();

    const editButton = screen.getByRole('button', { name: /Configurar Botões/i });
    expect(editButton).toBeInTheDocument();

    fireEvent.click(editButton);
    expect(onConfigureMock).toHaveBeenCalledWith(mockTrigger);
  });
});

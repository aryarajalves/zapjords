import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DeleteNodeConfirmModal from './DeleteNodeConfirmModal';

describe('DeleteNodeConfirmModal Component', () => {
  it('não renderiza nada quando node é null', () => {
    const { container } = render(
      <DeleteNodeConfirmModal node={null} onCancel={() => {}} onConfirm={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza corretamente informações do nó de disparo de e-mail', () => {
    const nodeMock = {
      id: 'node_test_1',
      type: 'emailNode',
      data: {
        subject: 'Assunto do E-mail de Teste'
      }
    };

    render(
      <DeleteNodeConfirmModal
        node={nodeMock}
        onCancel={() => {}}
        onConfirm={() => {}}
      />
    );

    expect(screen.getByText('Excluir Nó do Funil?')).toBeInTheDocument();
    expect(screen.getByText(/Disparo de E-mail/i)).toBeInTheDocument();
    expect(screen.getByText('Assunto do E-mail de Teste')).toBeInTheDocument();
    expect(screen.getByText(/ID: node_test_1/i)).toBeInTheDocument();
  });

  it('chama onCancel ao clicar no botão Cancelar', () => {
    const onCancelMock = vi.fn();
    const nodeMock = {
      id: 'node_test_2',
      type: 'delayNode',
      data: { days: 2, hours: 0, minutes: 0 }
    };

    render(
      <DeleteNodeConfirmModal
        node={nodeMock}
        onCancel={onCancelMock}
        onConfirm={() => {}}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    fireEvent.click(cancelButton);

    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });

  it('chama onConfirm ao clicar no botão Sim, Excluir Nó', () => {
    const onConfirmMock = vi.fn();
    const nodeMock = {
      id: 'node_test_3',
      type: 'tagNode',
      data: { tag: 'vip' }
    };

    render(
      <DeleteNodeConfirmModal
        node={nodeMock}
        onCancel={() => {}}
        onConfirm={onConfirmMock}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /sim, excluir nó/i });
    fireEvent.click(confirmButton);

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
  });

  it('possui exatamente 2 botões (1 de ação e 1 para fechar/cancelar) respeitando as diretrizes de UX', () => {
    const nodeMock = {
      id: 'node_test_4',
      type: 'webhookNode',
      data: {}
    };

    render(
      <DeleteNodeConfirmModal
        node={nodeMock}
        onCancel={() => {}}
        onConfirm={() => {}}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });
});

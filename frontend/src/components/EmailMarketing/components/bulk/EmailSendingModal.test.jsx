import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmailSendingModal from './EmailSendingModal';
import EmailBulkTab from '../../EmailBulkTab';

vi.mock('../../../../contexts/ClientContext', () => ({
  useClient: () => ({ activeClient: { id: 14, name: 'Cliente - Crassus' } })
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('EmailSendingModal & EmailBulkTab Loading Popup Unit Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('não renderiza quando isOpen é false', () => {
    render(<EmailSendingModal isOpen={false} recipientCount={5} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('exibe popup centralizado com título, campanha e quantidade de contatos no modo imediato e agendado', () => {
    const { rerender } = render(
      <EmailSendingModal
        isOpen={true}
        sendMode="immediate"
        recipientCount={12}
        campaignTitle="Boas-vindas AstroWake"
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Enviando E-mails...')).toBeInTheDocument();
    expect(screen.getByText(/Campanha: Boas-vindas AstroWake/i)).toBeInTheDocument();
    expect(screen.getByText(/Processando e enviando para 12 contato\(s\)\./i)).toBeInTheDocument();

    rerender(
      <EmailSendingModal
        isOpen={true}
        sendMode="scheduled"
        recipientCount={3}
        campaignTitle="Lembrete"
      />
    );

    expect(screen.getByText('Agendando Disparo de E-mails...')).toBeInTheDocument();
    expect(screen.getByText(/Preparando agendamento para 3 contato\(s\)\./i)).toBeInTheDocument();
  });

  it('EmailBulkTab abre o EmailSendingModal enquanto a requisição /email/send-bulk está pendente e fecha ao concluir', async () => {
    let resolveSend;
    const sendPromise = new Promise((resolve) => {
      resolveSend = resolve;
    });

    global.fetch = vi.fn((url) => {
      if (url.includes('/email/templates')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 9, name: 'Boas Vinda', subject: 'Olá' }])
        });
      }
      if (url.includes('/leads/filters')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ tags: ['Compra Aprovada'] })
        });
      }
      if (url.includes('/email/preview-recipients')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ recipients: [{ id: 1, email: 'teste@astrowake.com', name: 'Teste', tags: 'Compra Aprovada' }] })
        });
      }
      if (url.includes('/email/send-bulk')) {
        return sendPromise;
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<EmailBulkTab onNavigateHistory={vi.fn()} />);

    const submitBtn = await screen.findByRole('button', { name: /Iniciar Disparo em Massa \(1 E-mails\)/i });
    await waitFor(() => expect(submitBtn).not.toBeDisabled());

    fireEvent.click(submitBtn);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Processando e enviando para 1 contato\(s\)\./i)).toBeInTheDocument();

    resolveSend({
      ok: true,
      json: () => Promise.resolve({ status: 'success', message: 'Disparo concluído!' })
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});

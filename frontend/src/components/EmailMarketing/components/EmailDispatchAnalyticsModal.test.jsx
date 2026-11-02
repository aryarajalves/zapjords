import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import EmailDispatchAnalyticsModal from './EmailDispatchAnalyticsModal';

describe('EmailDispatchAnalyticsModal', () => {
  const mockDispatch = {
    id: 10,
    title: 'Newsletter Semanal #1',
    subject: 'Assunto da Edição',
    total_contacts: 100,
    total_sent: 90,
    total_failed: 2,
    total_opened: 45,
    total_clicks: 18
  };

  const mockAnalyticsData = {
    dispatch_id: 10,
    title: 'Newsletter Semanal #1',
    subject: 'Assunto da Edição',
    kpis: {
      total_contacts: 100,
      total_sent: 90,
      total_delivered: 88,
      total_failed: 2,
      total_opened: 45,
      total_clicks: 18,
      open_rate: 50.0,
      click_rate: 20.0,
      click_to_open_rate: 40.0
    },
    top_clicked_links: [
      { url: 'https://exemplo.com/artigo-1', clicks: 12, percentage: 66.7 },
      { url: 'https://exemplo.com/oferta', clicks: 6, percentage: 33.3 }
    ],
    contacts_performance: [
      {
        email: 'leitor1@teste.com',
        name: 'Leitor 1',
        status: 'clicked',
        opened: true,
        clicked: true,
        opened_at: '2026-11-02T10:00:00Z',
        clicked_at: '2026-11-02T10:05:00Z'
      },
      {
        email: 'leitor2@teste.com',
        name: 'Leitor 2',
        status: 'opened',
        opened: true,
        clicked: false,
        opened_at: '2026-11-02T10:02:00Z',
        clicked_at: null
      }
    ]
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('não renderiza nada se dispatch for nulo', () => {
    const { container } = render(<EmailDispatchAnalyticsModal dispatch={null} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  test('renderiza os KPIs principais e carrega dados de analytics via fetch', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockAnalyticsData
    });

    render(<EmailDispatchAnalyticsModal dispatch={mockDispatch} onClose={vi.fn()} />);

    expect(screen.getByText(/Métricas da Newsletter \/ Disparo/i)).toBeInTheDocument();
    expect(screen.getByText(/Newsletter Semanal #1/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('50%')).toBeInTheDocument(); // Taxa de abertura
      expect(screen.getByText('20%')).toBeInTheDocument(); // Taxa de cliques (CTR)
    });

    expect(screen.getByText('https://exemplo.com/artigo-1')).toBeInTheDocument();
    expect(screen.getByText(/12 cliques/i)).toBeInTheDocument();

    expect(screen.getByText('leitor1@teste.com')).toBeInTheDocument();
    expect(screen.getByText('leitor2@teste.com')).toBeInTheDocument();
  });

  test('filtra contatos por status e chama onClose ao clicar em Fechar', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockAnalyticsData
    });
    const onCloseMock = vi.fn();

    render(<EmailDispatchAnalyticsModal dispatch={mockDispatch} onClose={onCloseMock} />);

    await waitFor(() => {
      expect(screen.getByText('leitor1@teste.com')).toBeInTheDocument();
    });

    const btnClicked = screen.getByRole('button', { name: /Clicaram/i });
    fireEvent.click(btnClicked);

    expect(screen.getByText('leitor1@teste.com')).toBeInTheDocument();
    expect(screen.queryByText('leitor2@teste.com')).not.toBeInTheDocument();

    const btnClose = screen.getByRole('button', { name: /^Fechar$/i });
    fireEvent.click(btnClose);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import React from 'react';
import TeamPerformance from './index';

// Mocks
const mockFetchWithAuth = vi.fn();
vi.mock('../../AuthContext', () => ({
  fetchWithAuth: (...args) => mockFetchWithAuth(...args),
}));

vi.mock('../../contexts/ClientContext', () => ({
  useClient: () => ({ activeClient: { id: 1, name: 'Empresa Teste' } }),
}));

vi.mock('../../config', () => ({
  API_URL: 'http://localhost:8000/api',
  WS_URL: 'ws://localhost:8000',
}));

// Mock WebSocket
let mockWsInstance;
global.WebSocket = vi.fn(function () {
  mockWsInstance = {
    send: vi.fn(),
    close: vi.fn(),
    onopen: null,
    onmessage: null,
    onerror: null,
    onclose: null,
  };
  return mockWsInstance;
});

describe('TeamPerformance Component', () => {
  const mockSellers = [
    { id: 10, full_name: 'Carlos Vendedor', email: 'carlos@empresa.com', role: 'vendedor' },
    { id: 11, full_name: 'Mariana Atendente', email: 'mariana@empresa.com', role: 'vendedor' },
  ];

  const mockSummary = {
    period: 'today',
    metrics: {
      today: { unique_contacts: 8, total_messages: 24 },
      this_week: { unique_contacts: 35, total_messages: 110 },
      this_month: { unique_contacts: 140, total_messages: 450 },
      selected_period: { unique_contacts: 8, total_messages: 24 },
    },
    sellers_breakdown: [
      {
        seller_id: 10,
        name: 'Carlos Vendedor',
        email: 'carlos@empresa.com',
        role: 'vendedor',
        unique_contacts: 5,
        total_messages: 15,
        avg_messages_per_contact: 3.0,
        last_message_at: '2026-11-02T10:00:00Z',
      },
      {
        seller_id: 11,
        name: 'Mariana Atendente',
        email: 'mariana@empresa.com',
        role: 'vendedor',
        unique_contacts: 3,
        total_messages: 9,
        avg_messages_per_contact: 3.0,
        last_message_at: '2026-11-02T09:45:00Z',
      },
    ],
  };

  const mockContacts = {
    total: 2,
    total_pages: 1,
    page: 1,
    items: [
      {
        conversation_id: 101,
        contact_name: 'Cliente João Silva',
        phone: '5511998877665',
        seller_id: 10,
        seller_name: 'Carlos Vendedor',
        messages_count: 4,
        last_message_at: '2026-11-02T10:00:00Z',
      },
      {
        conversation_id: 102,
        contact_name: 'Cliente Maria Souza',
        phone: '5511991122334',
        seller_id: 11,
        seller_name: 'Mariana Atendente',
        messages_count: 2,
        last_message_at: '2026-11-02T09:45:00Z',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchWithAuth.mockImplementation((url) => {
      if (url.includes('/team-performance/sellers')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ sellers: mockSellers }),
        });
      }
      if (url.includes('/team-performance/summary')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockSummary,
        });
      }
      if (url.includes('/team-performance/contacts')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockContacts,
        });
      }
      return Promise.reject(new Error(`Rota desconhecida: ${url}`));
    });
  });

  it('deve renderizar a tela de Desempenho da Equipe e carregar os cartões de métricas', async () => {
    render(<TeamPerformance onNavigateToChat={vi.fn()} />);

    expect(screen.getByText('Desempenho da Equipe')).toBeInTheDocument();
    expect(screen.getByText('Acesso Admin')).toBeInTheDocument();

    await waitFor(() => {
      const contactsCards = screen.getAllByText('8 contatos');
      expect(contactsCards.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('35 contatos')).toBeInTheDocument();
      expect(screen.getByText('140 contatos')).toBeInTheDocument();
    });
  });

  it('deve listar os vendedores no ranking e os contatos na tabela', async () => {
    render(<TeamPerformance onNavigateToChat={vi.fn()} />);

    await waitFor(() => {
      const carlosMatches = screen.getAllByText(/Carlos Vendedor/);
      expect(carlosMatches.length).toBeGreaterThanOrEqual(1);
      const marianaMatches = screen.getAllByText(/Mariana Atendente/);
      expect(marianaMatches.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Cliente João Silva')).toBeInTheDocument();
      expect(screen.getByText('Cliente Maria Souza')).toBeInTheDocument();
    });
  });

  it('deve acionar onNavigateToChat com o ID correto da conversa ao clicar em Abrir no Chat', async () => {
    const mockNavigate = vi.fn();
    render(<TeamPerformance onNavigateToChat={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByTestId('open-chat-btn-101')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('open-chat-btn-101'));
    expect(mockNavigate).toHaveBeenCalledWith(101);
  });

  it('deve permitir alterar o período para 7 dias', async () => {
    render(<TeamPerformance onNavigateToChat={vi.fn()} />);

    const btn7d = screen.getByTestId('period-btn-7days');
    fireEvent.click(btn7d);

    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining('period=7days'),
        expect.anything(),
        1
      );
    });
  });

  it('deve exibir o badge de conexão WebSocket e assinar o cliente ativo', async () => {
    render(<TeamPerformance onNavigateToChat={vi.fn()} />);

    const badge = screen.getByTestId('ws-status-badge');
    expect(badge).toBeInTheDocument();

    // Quando o socket abre
    act(() => {
      mockWsInstance?.onopen?.();
    });

    await waitFor(() => {
      expect(screen.getByText('Tempo Real Ativo')).toBeInTheDocument();
    });
  });
});

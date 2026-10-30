import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import EmailFunnelsTab from '../EmailFunnelsTab';
import EmailFunnelEditorModal from '../EmailFunnelEditorModal';
import EmailFunnelExecutionsModal from '../EmailFunnelExecutionsModal';
import EmailFunnelFlowBuilder from '../flow/EmailFunnelFlowBuilder';

// Mock contexts
vi.mock('../../../../contexts/ClientContext', () => ({
  useClient: () => ({
    activeClient: { id: 1, name: 'Empresa Teste' }
  })
}));

vi.mock('../../../contexts/ClientContext', () => ({
  useClient: () => ({
    activeClient: { id: 1, name: 'Empresa Teste' }
  })
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock config
vi.mock('../../../../config', () => ({
  API_URL: 'http://localhost:8000/api',
  WEBHOOK_BASE_URL: 'https://webhook.zapvoice.test'
}));

vi.mock('../../../config', () => ({
  API_URL: 'http://localhost:8000/api',
  WEBHOOK_BASE_URL: 'https://webhook.zapvoice.test'
}));

// Mock ResizeObserver para ReactFlow no ambiente JSDOM
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('Email Funnels Component Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake_token');
    localStorage.setItem('client_id', '1');
  });

  it('renders EmailFunnelsTab with header, button and list', async () => {
    global.fetch = vi.fn((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/email/funnels')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id: 1,
                name: 'Funil Boas-Vindas',
                description: 'Boas vindas aos novos clientes',
                trigger_type: 'tag',
                trigger_config: { tag: 'lead_novo' },
                stop_tags: ['comprou'],
                stop_on_purchase: true,
                is_active: true,
                steps_count: 3,
                total_enrolled: 10,
                total_completed: 4
              }
            ])
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });

    render(<EmailFunnelsTab />);

    expect(screen.getByText(/Funis & Réguas de E-mail Marketing/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Novo Funil de E-mail/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Funil Boas-Vindas')).toBeInTheDocument();
    });

    expect(screen.getByText(/Ver Leads \(20\/pág\)/i)).toBeInTheDocument();
  });

  it('renders EmailFunnelExecutionsModal with 20 items per page pagination', async () => {
    const mockFunnel = {
      id: 1,
      name: 'Funil Boas-Vindas',
      steps: [{ type: 'email' }, { type: 'delay' }]
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              {
                id: 101,
                contact_email: 'lead@exemplo.com',
                contact_name: 'Lead Teste',
                current_step_index: 0,
                status: 'active'
              }
            ],
            total: 1,
            page: 1,
            page_size: 20,
            total_pages: 1
          })
      })
    );

    render(<EmailFunnelExecutionsModal funnel={mockFunnel} onClose={vi.fn()} />);

    expect(screen.getByText(/Leads no Funil:/i)).toBeInTheDocument();
    expect(screen.getByText(/Mostrando 20 contatos por página/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Buscar por e-mail ou nome.../i)).toBeInTheDocument();
    expect(screen.getByText(/Página/i, { selector: 'div' })).toBeInTheDocument();
    expect(screen.getByText(/20 por página/i)).toBeInTheDocument();
  });

  it('renders EmailFunnelFlowBuilder canvas with controls, nodes and sidebar', () => {
    const mockTemplates = [
      { id: 1, name: 'Template Boas Vindas', subject: 'Seja bem vindo' }
    ];

    render(
      <EmailFunnelFlowBuilder
        funnel={null}
        templates={mockTemplates}
        onBack={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/Voltar para Lista/i)).toBeInTheDocument();
    expect(screen.getByText(/Salvar Fluxo/i)).toBeInTheDocument();
    expect(screen.getByText(/Exportar JSON/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Adicionar Nós ao Fluxo/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Envio de E-mail/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Tempo de Espera \(Delay\)/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Ação de Etiqueta/i)).toBeInTheDocument();
  });

  it('renders and duplicates flow nodes with nodrag nopan inputs', () => {
    const mockTemplates = [
      { id: 1, name: 'Template Boas Vindas', subject: 'Seja bem vindo' }
    ];

    render(
      <EmailFunnelFlowBuilder
        funnel={{
          id: 1,
          name: 'Funil Teste Duplicação',
          trigger_type: 'tag',
          trigger_config: { tag: 'vip' },
          steps: [
            { id: 'step_1', type: 'email', template_id: 1, subject: 'Assunto Teste' },
            { id: 'step_2', type: 'delay', delay_value: 2, delay_unit: 'hours' },
            { id: 'step_3', type: 'tag_action', action: 'add', tag: 'lead_passo_1' }
          ]
        }}
        templates={mockTemplates}
        onBack={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Valida títulos dos nós
    expect(screen.getByText(/Gatilho de Início/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Disparo de E-mail/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Tempo de Espera/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/Ação de Etiqueta/i).length).toBeGreaterThanOrEqual(2);

    // Valida botões de duplicar
    const duplicateButtons = screen.getAllByTitle(/Duplicar Nó/i);
    expect(duplicateButtons.length).toBeGreaterThanOrEqual(3);
  });

  it('starts fresh funnel with ONLY trigger node and renders EmailContextMenu on right-click', () => {
    const mockTemplates = [
      { id: 1, name: 'Template Boas Vindas', subject: 'Seja bem vindo' }
    ];

    render(
      <EmailFunnelFlowBuilder
        funnel={null}
        templates={mockTemplates}
        onBack={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Valida que começa limpo apenas com o nó de Início (Gatilho)
    expect(screen.getByText(/Gatilho de Início/i)).toBeInTheDocument();
    expect(screen.queryByText(/Tempo de Espera/i, { selector: 'span.text-amber-300' })).toBeNull();

    // Valida texto com instrução do botão direito
    expect(screen.getByText(/Clique com o botão direito para adicionar nós/i)).toBeInTheDocument();
  });
});

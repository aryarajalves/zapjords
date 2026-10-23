import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import KanbanSection from '../KanbanSection';

vi.mock('../../../../../contexts/ClientContext', () => ({
  useClient: () => ({
    activeClient: { id: 1, name: 'Cliente Teste' }
  })
}));

const mockFetch = (url) => {
  if (url.includes('/board')) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        stages: [
          { id: 1001, name: 'Lead', stage_type: 'initial' },
          { id: 1002, name: 'Venda Fechada', stage_type: 'won' },
          { id: 1003, name: 'Desistência', stage_type: 'lost' }
        ]
      })
    });
  }
  if (url.includes('/crm/pipelines')) {
    return Promise.resolve({
      ok: true,
      json: async () => [
        { id: 10, name: 'Pipeline Vendas', is_default: true },
        { id: 20, name: 'Pipeline High Ticket', is_default: false }
      ]
    });
  }
  if (url.includes('/crm/products')) {
    return Promise.resolve({
      ok: true,
      json: async () => [
        { id: 101, name: 'Mentoria Elite', price: 1500.0 }
      ]
    });
  }
  return Promise.resolve({ ok: false });
};

vi.mock('../../../../../AuthContext', () => ({
  fetchWithAuth: vi.fn((url) => mockFetch(url))
}));

describe('KanbanSection', () => {
  const defaultMapping = {
    kanban_active: false,
    kanban_pipeline_id: null,
    kanban_stage_id: null,
    kanban_product_name: '',
    kanban_value: 0,
    kanban_lost_reason: ''
  };

  const updateMappingMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o cabeçalho do Kanban e o toggle desligado inicialmente', () => {
    render(
      <KanbanSection
        mapping={defaultMapping}
        mIndex={0}
        updateMapping={updateMappingMock}
      />
    );

    expect(screen.getByText('Kanban de Vendas (CRM)')).toBeDefined();
    const toggle = screen.getByTestId('kanban-active-toggle');
    expect(toggle.checked).toBe(false);
    expect(screen.queryByTestId('kanban-config-fields')).toBeNull();
  });

  it('permite ativar o toggle chamando updateMapping', () => {
    render(
      <KanbanSection
        mapping={defaultMapping}
        mIndex={0}
        updateMapping={updateMappingMock}
      />
    );

    const toggle = screen.getByTestId('kanban-active-toggle');
    fireEvent.click(toggle);

    expect(updateMappingMock).toHaveBeenCalledWith(0, 'kanban_active', true);
  });

  it('exibe os campos de configuração quando kanban_active é true', async () => {
    const activeMapping = {
      ...defaultMapping,
      kanban_active: true,
      kanban_pipeline_id: 10,
      kanban_stage_id: 1001
    };

    render(
      <KanbanSection
        mapping={activeMapping}
        mIndex={0}
        updateMapping={updateMappingMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Pipeline Vendas (Padrão)')).toBeDefined();
    });

    expect(screen.getByTestId('kanban-config-fields')).toBeDefined();
    expect(screen.getByTestId('kanban-pipeline-select')).toBeDefined();
    expect(screen.getByTestId('kanban-stage-select')).toBeDefined();
    expect(screen.getByTestId('kanban-product-select')).toBeDefined();
    expect(screen.getByTestId('kanban-value-input')).toBeDefined();
  });

  it('exibe o produto com o preço formatado e preenche o valor estimado ao selecionar', async () => {
    const activeMapping = {
      ...defaultMapping,
      kanban_active: true,
      kanban_pipeline_id: 10,
      kanban_stage_id: 1001,
      kanban_value: 0
    };

    render(
      <KanbanSection
        mapping={activeMapping}
        mIndex={0}
        updateMapping={updateMappingMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Mentoria Elite \(R\$ 1\.500,00\)/)).toBeDefined();
    });

    const productSelect = screen.getByTestId('kanban-product-select');
    fireEvent.change(productSelect, { target: { value: 'Mentoria Elite' } });

    expect(updateMappingMock).toHaveBeenCalledWith(0, 'kanban_product_name', 'Mentoria Elite');
    expect(updateMappingMock).toHaveBeenCalledWith(0, 'kanban_value', 1500.0);
  });

  it('exibe campo de motivo da desistência quando o estágio selecionado é do tipo lost', async () => {
    const lostMapping = {
      ...defaultMapping,
      kanban_active: true,
      kanban_pipeline_id: 10,
      kanban_stage_id: 1003
    };

    render(
      <KanbanSection
        mapping={lostMapping}
        mIndex={0}
        updateMapping={updateMappingMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('kanban-lost-reason-container')).toBeDefined();
    }, { timeout: 3000 });

    const lostInput = screen.getByTestId('kanban-lost-reason-input');
    fireEvent.change(lostInput, { target: { value: 'Achou muito caro' } });
    expect(updateMappingMock).toHaveBeenCalledWith(0, 'kanban_lost_reason', 'Achou muito caro');
  });
});

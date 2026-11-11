import React from 'react';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import IntegrationsTable from './components/IntegrationsTable';
import { useIntegrationsTableFilter } from './hooks/useIntegrationsTableFilter';
import { useIntegrations } from './hooks/useIntegrations';
import { toast } from 'react-hot-toast';

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    promise: vi.fn()
  }
}));

vi.mock('../../../AuthContext', () => ({
  fetchWithAuth: vi.fn()
}));

describe('Webhook Integrations Pinning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('IntegrationsTable Pinning Render & Actions', () => {
    it('renderiza ícone e badge de fixado para itens com is_pinned=true', () => {
      const onTogglePin = vi.fn();
      const mockIntegrations = [
        {
          id: 'int-1',
          name: 'Integração Fixada VIP',
          platform: 'hotmart',
          is_pinned: true,
          mappings: [],
          history_count: 10
        },
        {
          id: 'int-2',
          name: 'Integração Normal',
          platform: 'kiwify',
          is_pinned: false,
          mappings: [],
          history_count: 5
        }
      ];

      render(
        <IntegrationsTable
          loading={false}
          filteredIntegrations={mockIntegrations}
          paginatedIntegrations={mockIntegrations}
          listPageSize={5}
          setListPageSize={vi.fn()}
          listCurrentPage={1}
          setListCurrentPage={vi.fn()}
          safePage={1}
          totalPages={1}
          filterPlatform=""
          totalIntegrationsCount={2}
          onOpenHistory={vi.fn()}
          onOpenDispatchHistory={vi.fn()}
          onOpenTestModal={vi.fn()}
          onOpenEditModal={vi.fn()}
          onOpenDeleteModal={vi.fn()}
          onTogglePin={onTogglePin}
          pinningId={null}
        />
      );

      // Verifica presença do badge Fixado
      expect(screen.getByText('Fixado')).toBeDefined();

      // Clica no botão de fixar/desafixar
      const pinButtons = screen.getAllByRole('button', { name: /fixar/i });
      expect(pinButtons.length).toBeGreaterThan(0);
      fireEvent.click(pinButtons[0]);
      expect(onTogglePin).toHaveBeenCalledWith(mockIntegrations[0]);
    });
  });

  describe('useIntegrationsTableFilter Pinned Sorting', () => {
    it('ordena integrações fixadas no topo e as mais recentemente fixadas primeiro', () => {
      const items = [
        { id: 1, name: 'Normal 1', is_pinned: false, history_count: 50 },
        { id: 2, name: 'Fixada Recente', is_pinned: true, pinned_at: '2026-11-11T10:00:00Z', history_count: 5 },
        { id: 3, name: 'Normal 2', is_pinned: false, history_count: 100 },
        { id: 4, name: 'Fixada Antiga', is_pinned: true, pinned_at: '2026-11-11T08:00:00Z', history_count: 2 }
      ];

      const { result } = renderHook(() => useIntegrationsTableFilter(items, []));

      // As duas primeiras devem ser as fixadas, com a mais recente no topo
      expect(result.current.sortedIntegrations[0].name).toBe('Fixada Recente');
      expect(result.current.sortedIntegrations[1].name).toBe('Fixada Antiga');
      // Em seguida as normais, por histórico decrescente
      expect(result.current.sortedIntegrations[2].name).toBe('Normal 2');
      expect(result.current.sortedIntegrations[3].name).toBe('Normal 1');
    });
  });

  describe('useIntegrations Max 5 Pinned Enforcement', () => {
    it('impede fixar mais de 5 itens e exibe mensagem de erro no toast', async () => {
      const activeClient = { id: 1, name: 'Client Test' };
      const { result } = renderHook(() => useIntegrations(activeClient));

      // Simula 5 integrações já fixadas
      act(() => {
        result.current.setIntegrations([
          { id: '1', name: 'Pin 1', is_pinned: true },
          { id: '2', name: 'Pin 2', is_pinned: true },
          { id: '3', name: 'Pin 3', is_pinned: true },
          { id: '4', name: 'Pin 4', is_pinned: true },
          { id: '5', name: 'Pin 5', is_pinned: true },
          { id: '6', name: 'Pin 6', is_pinned: false }
        ]);
      });

      // Tenta fixar a 6ª integração
      await act(async () => {
        await result.current.handleTogglePin({ id: '6', name: 'Pin 6', is_pinned: false });
      });

      expect(toast.error).toHaveBeenCalledWith('Você já atingiu o limite de 5 integrações fixadas no topo.');
    });
  });
});

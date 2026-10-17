import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIntegrationsSocket } from './useIntegrationsSocket';

describe('useIntegrationsSocket hook', () => {
  let mockWebSocketInstance;
  let originalWebSocket;

  beforeEach(() => {
    mockWebSocketInstance = {
      send: vi.fn(),
      close: vi.fn(),
      readyState: 1 // OPEN
    };
    originalWebSocket = global.WebSocket;
    global.WebSocket = vi.fn(function () {
      return mockWebSocketInstance;
    });
    global.WebSocket.OPEN = 1;
    localStorage.setItem('token', 'fake-jwt-token');
  });

  afterEach(() => {
    global.WebSocket = originalWebSocket;
    vi.restoreAllMocks();
  });

  it('deve subscrever o cliente com subscribe_client ao abrir a conexão WS', () => {
    const activeClient = { id: 42 };

    renderHook(() =>
      useIntegrationsSocket({
        activeClient,
        fetchIntegrations: vi.fn()
      })
    );

    expect(global.WebSocket).toHaveBeenCalled();

    // Simula o evento onopen do WebSocket
    act(() => {
      mockWebSocketInstance.onopen();
    });

    expect(mockWebSocketInstance.send).toHaveBeenCalledWith(
      JSON.stringify({
        event: 'subscribe_client',
        client_id: 42
      })
    );
  });

  it('deve atualizar o contador de histórico e notificar callback visual ao receber webhook_history_update com is_new: true', () => {
    const activeClient = { id: 42 };
    const setIntegrations = vi.fn();
    const onRecentHistoryUpdate = vi.fn();
    const fetchIntegrations = vi.fn();

    renderHook(() =>
      useIntegrationsSocket({
        activeClient,
        setIntegrations,
        onRecentHistoryUpdate,
        fetchIntegrations
      })
    );

    const wsEvent = {
      data: JSON.stringify({
        event: 'webhook_history_update',
        data: {
          history_id: 101,
          integration_id: 'uuid-integration-1',
          client_id: 42,
          is_new: true,
          status: 'pending',
          event_type: 'compra_aprovada'
        }
      })
    };

    act(() => {
      mockWebSocketInstance.onmessage(wsEvent);
    });

    expect(setIntegrations).toHaveBeenCalled();
    // Testa o callback do setIntegrations para garantir incremento otimista (+1)
    const updater = setIntegrations.mock.calls[0][0];
    const prevList = [
      { id: 'uuid-integration-1', history_count: 5 },
      { id: 'uuid-integration-2', history_count: 0 }
    ];
    const nextList = updater(prevList);
    expect(nextList[0].history_count).toBe(6);
    expect(nextList[1].history_count).toBe(0);

    expect(onRecentHistoryUpdate).toHaveBeenCalledWith('uuid-integration-1');
    expect(fetchIntegrations).toHaveBeenCalledWith(true);
  });

  it('deve inserir novo registro no topo do histórico se o modal estiver aberto para a integração correspondente', () => {
    const activeClient = { id: 42 };
    const setWebhookHistory = vi.fn();
    const fetchHistory = vi.fn();

    renderHook(() =>
      useIntegrationsSocket({
        activeClient,
        isHistoryModalOpen: true,
        historyIntegrationId: 'uuid-integration-1',
        setWebhookHistory,
        fetchHistory
      })
    );

    const wsEvent = {
      data: JSON.stringify({
        event: 'webhook_history_update',
        data: {
          history_id: 555,
          integration_id: 'uuid-integration-1',
          client_id: 42,
          is_new: true,
          status: 'pending',
          event_type: 'pix_gerado',
          processed_data: { name: 'João Teste' }
        }
      })
    };

    act(() => {
      mockWebSocketInstance.onmessage(wsEvent);
    });

    expect(setWebhookHistory).toHaveBeenCalled();
    const updater = setWebhookHistory.mock.calls[0][0];
    const prevHistory = [{ id: 100, event_type: 'antigo' }];
    const nextHistory = updater(prevHistory);

    expect(nextHistory).toHaveLength(2);
    expect(nextHistory[0].id).toBe(555);
    expect(nextHistory[0].event_type).toBe('pix_gerado');
    expect(fetchHistory).toHaveBeenCalledWith('uuid-integration-1', '', '', true);
  });

  it('deve remover itens do histórico e re-sincronizar ao receber webhook_history_deleted', () => {
    const activeClient = { id: 42 };
    const setWebhookHistory = vi.fn();
    const fetchIntegrations = vi.fn();

    renderHook(() =>
      useIntegrationsSocket({
        activeClient,
        isHistoryModalOpen: true,
        historyIntegrationId: 'uuid-integration-1',
        setWebhookHistory,
        fetchIntegrations
      })
    );

    const wsEvent = {
      data: JSON.stringify({
        event: 'webhook_history_deleted',
        data: {
          history_ids: [100, 200],
          integration_id: 'uuid-integration-1',
          client_id: 42
        }
      })
    };

    act(() => {
      mockWebSocketInstance.onmessage(wsEvent);
    });

    expect(setWebhookHistory).toHaveBeenCalled();
    const updater = setWebhookHistory.mock.calls[0][0];
    const prevHistory = [{ id: 100 }, { id: 300 }];
    const nextHistory = updater(prevHistory);

    expect(nextHistory).toHaveLength(1);
    expect(nextHistory[0].id).toBe(300);
    expect(fetchIntegrations).toHaveBeenCalledWith(true);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTeamPerformanceWebSocket } from './useTeamPerformanceWebSocket';

describe('useTeamPerformanceWebSocket Hook', () => {
  let mockSocketInstance;

  beforeEach(() => {
    vi.useFakeTimers();
    mockSocketInstance = {
      send: vi.fn(),
      close: vi.fn(),
      onopen: null,
      onmessage: null,
      onerror: null,
      onclose: null,
    };
    global.WebSocket = vi.fn(function () {
      return mockSocketInstance;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('deve conectar ao WebSocket e assinar eventos do cliente ativo via subscribe_client', () => {
    const onUpdate = vi.fn();
    const activeClient = { id: 14 };

    const { result } = renderHook(() =>
      useTeamPerformanceWebSocket({ activeClient, onNewMessageOrUpdate: onUpdate })
    );

    expect(global.WebSocket).toHaveBeenCalled();
    expect(result.current.isWsConnected).toBe(false);

    // Simula abertura da conexão WebSocket
    act(() => {
      mockSocketInstance.onopen();
    });

    expect(result.current.isWsConnected).toBe(true);
    expect(mockSocketInstance.send).toHaveBeenCalledWith(
      JSON.stringify({
        event: 'subscribe_client',
        client_id: 14,
      })
    );
  });

  it('deve disparar onNewMessageOrUpdate ao receber evento new_message do cliente', () => {
    const onUpdate = vi.fn();
    const activeClient = { id: 14 };

    renderHook(() =>
      useTeamPerformanceWebSocket({ activeClient, onNewMessageOrUpdate: onUpdate })
    );

    act(() => {
      mockSocketInstance.onopen();
    });

    // Simula mensagem 'new_message' via WebSocket
    act(() => {
      mockSocketInstance.onmessage({
        data: JSON.stringify({
          event: 'new_message',
          data: { client_id: 14, content: 'Oi vendedor!' },
        }),
      });
    });

    // Antes do debounce (400ms), ainda não deve ter chamado
    expect(onUpdate).not.toHaveBeenCalled();

    // Avança o tempo do debounce
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it('não deve disparar onNewMessageOrUpdate se o evento for de outro cliente', () => {
    const onUpdate = vi.fn();
    const activeClient = { id: 14 };

    renderHook(() =>
      useTeamPerformanceWebSocket({ activeClient, onNewMessageOrUpdate: onUpdate })
    );

    act(() => {
      mockSocketInstance.onopen();
    });

    // Simula mensagem de outro client_id (99)
    act(() => {
      mockSocketInstance.onmessage({
        data: JSON.stringify({
          event: 'new_message',
          data: { client_id: 99, content: 'Outra conversa' },
        }),
      });
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('deve atualizar isWsConnected para false no onclose e no onerror', () => {
    const onUpdate = vi.fn();
    const activeClient = { id: 14 };

    const { result } = renderHook(() =>
      useTeamPerformanceWebSocket({ activeClient, onNewMessageOrUpdate: onUpdate })
    );

    act(() => {
      mockSocketInstance.onopen();
    });
    expect(result.current.isWsConnected).toBe(true);

    act(() => {
      mockSocketInstance.onclose();
    });
    expect(result.current.isWsConnected).toBe(false);
  });
});

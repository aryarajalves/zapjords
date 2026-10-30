import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKanbanWebSocketSync } from '../useKanbanWebSocketSync';

class MockWebSocket {
    static instances = [];
    constructor(url) {
        this.url = url;
        this.sentMessages = [];
        this.readyState = 1; // OPEN
        MockWebSocket.instances.push(this);
        setTimeout(() => {
            if (this.onopen) this.onopen();
        }, 0);
    }
    send(data) {
        this.sentMessages.push(data);
    }
    close() {
        this.readyState = 3; // CLOSED
        if (this.onclose) this.onclose({ code: 1000, reason: 'Normal' });
    }
    triggerMessage(data) {
        if (this.onmessage) {
            this.onmessage({ data: JSON.stringify(data) });
        }
    }
}

describe('useKanbanWebSocketSync Hook', () => {
    let originalWebSocket;

    beforeEach(() => {
        MockWebSocket.instances = [];
        originalWebSocket = global.WebSocket;
        global.WebSocket = MockWebSocket;
        vi.useFakeTimers();
    });

    afterEach(() => {
        global.WebSocket = originalWebSocket;
        vi.useRealTimers();
    });

    it('deve conectar ao WebSocket e enviar subscribe_client ao abrir conexão', async () => {
        const activeClient = { id: 10, name: 'Cliente Teste' };
        const onRefreshBoard = vi.fn();

        const { result } = renderHook(() =>
            useKanbanWebSocketSync({
                activeClient,
                selectedPipelineId: 1,
                onRefreshBoard
            })
        );

        expect(MockWebSocket.instances.length).toBe(1);
        const ws = MockWebSocket.instances[0];

        // Aguarda onopen disparar
        act(() => {
            vi.advanceTimersByTime(10);
        });

        expect(result.current.isWsConnected).toBe(true);
        expect(ws.sentMessages.length).toBe(1);
        const subMsg = JSON.parse(ws.sentMessages[0]);
        expect(subMsg.event).toBe('subscribe_client');
        expect(subMsg.client_id).toBe(10);
    });

    it('deve atualizar currentTime ao receber evento kanban_followup_tick via WebSocket', async () => {
        const activeClient = { id: 10 };
        const onRefreshBoard = vi.fn();

        const { result } = renderHook(() =>
            useKanbanWebSocketSync({
                activeClient,
                selectedPipelineId: 1,
                onRefreshBoard
            })
        );

        const ws = MockWebSocket.instances[0];
        act(() => {
            vi.advanceTimersByTime(10);
        });

        const targetTimestamp = 1750000000000;
        const targetIso = new Date(targetTimestamp).toISOString();

        act(() => {
            ws.triggerMessage({
                event: 'kanban_followup_tick',
                client_id: 10,
                data: {
                    server_time: targetIso
                }
            });
        });

        expect(result.current.currentTime).toBe(targetTimestamp);
    });

    it('deve chamar onRefreshBoard ao receber crm_board_updated para a pipeline selecionada', async () => {
        const activeClient = { id: 10 };
        const onRefreshBoard = vi.fn();

        renderHook(() =>
            useKanbanWebSocketSync({
                activeClient,
                selectedPipelineId: 2,
                onRefreshBoard
            })
        );

        const ws = MockWebSocket.instances[0];
        act(() => {
            vi.advanceTimersByTime(10);
        });

        act(() => {
            ws.triggerMessage({
                event: 'crm_board_updated',
                client_id: 10,
                data: {
                    pipeline_id: 2,
                    action: 'move_deal'
                }
            });
        });

        expect(onRefreshBoard).toHaveBeenCalledTimes(1);
    });

    it('não deve disparar onRefreshBoard se o evento crm_board_updated for de outra pipeline', async () => {
        const activeClient = { id: 10 };
        const onRefreshBoard = vi.fn();

        renderHook(() =>
            useKanbanWebSocketSync({
                activeClient,
                selectedPipelineId: 2,
                onRefreshBoard
            })
        );

        const ws = MockWebSocket.instances[0];
        act(() => {
            vi.advanceTimersByTime(10);
        });

        act(() => {
            ws.triggerMessage({
                event: 'crm_board_updated',
                client_id: 10,
                data: {
                    pipeline_id: 999, // Outra pipeline
                    action: 'move_deal'
                }
            });
        });

        expect(onRefreshBoard).not.toHaveBeenCalled();
    });
});

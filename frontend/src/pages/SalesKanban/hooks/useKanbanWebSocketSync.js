import { useEffect, useState, useRef } from 'react';
import { WS_URL } from '../../../config';

/**
 * useKanbanWebSocketSync
 * Hook responsável pela sincronização em tempo real do Kanban via WebSocket:
 * 1. Atualização contínua do tempo de follow-up (countdown / tempo excedido) sem F5.
 * 2. Atualização automática do quadro quando oportunidades são criadas/movidas.
 */
export function useKanbanWebSocketSync({
    activeClient,
    selectedPipelineId,
    onRefreshBoard
}) {
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const [isWsConnected, setIsWsConnected] = useState(false);
    const lastTickRef = useRef(Date.now());
    const onRefreshBoardRef = useRef(onRefreshBoard);

    useEffect(() => {
        onRefreshBoardRef.current = onRefreshBoard;
    }, [onRefreshBoard]);

    // Timer local de alta precisão a cada 1 segundo para fluidez contínua do relógio
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!activeClient?.id) return;

        let ws = null;
        let reconnectTimeout = null;
        let isDisposed = false;

        const connect = () => {
            if (isDisposed) return;
            try {
                const wsBase = WS_URL.endsWith('/ws') ? WS_URL : `${WS_URL}/ws`;
                const token = localStorage.getItem('token') || '';
                const wsUrl = token ? `${wsBase}?token=${token}` : wsBase;

                ws = new WebSocket(wsUrl);

                ws.onopen = () => {
                    setIsWsConnected(true);
                    // Assina o cliente ativo no WebSocket
                    ws.send(JSON.stringify({
                        event: 'subscribe_client',
                        client_id: activeClient.id
                    }));
                };

                ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        const evtName = message.event || message.type;
                        const data = message.data || message.payload || {};

                        // Se veio timestamp do servidor em kanban_followup_tick ou system_stats, sincroniza
                        if (evtName === 'kanban_followup_tick' || evtName === 'system_stats') {
                            const serverTimeStr = data.server_time || message.server_time;
                            if (serverTimeStr) {
                                const parsed = new Date(serverTimeStr).getTime();
                                if (!isNaN(parsed)) {
                                    setCurrentTime(parsed);
                                    lastTickRef.current = parsed;
                                }
                            }
                        }

                        // Se o quadro foi atualizado por outro operador ou webhook
                        if (evtName === 'crm_board_updated') {
                            if (!data.pipeline_id || String(data.pipeline_id) === String(selectedPipelineId)) {
                                if (onRefreshBoardRef.current) {
                                    onRefreshBoardRef.current();
                                }
                            }
                        }
                    } catch (err) {
                        console.error('Erro ao processar mensagem WS no Kanban:', err);
                    }
                };

                ws.onerror = () => {
                    setIsWsConnected(false);
                };

                ws.onclose = () => {
                    setIsWsConnected(false);
                    if (!isDisposed) {
                        reconnectTimeout = setTimeout(connect, 3000);
                    }
                };
            } catch (err) {
                console.error('Falha ao instanciar WebSocket no Kanban:', err);
                setIsWsConnected(false);
                if (!isDisposed) {
                    reconnectTimeout = setTimeout(connect, 5000);
                }
            }
        };

        connect();

        return () => {
            isDisposed = true;
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            if (ws) {
                ws.close();
            }
        };
    }, [activeClient?.id, selectedPipelineId]);

    return {
        currentTime,
        isWsConnected
    };
}

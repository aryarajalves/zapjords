import { useEffect, useRef, useState } from 'react';
import { WS_URL } from '../../../config';

/**
 * Hook responsável pela sincronização em tempo real da tela de Desempenho da Equipe via WebSocket.
 * Escuta eventos de 'new_message' e 'conversation_updated' e aciona a atualização automática dos dados.
 */
export function useTeamPerformanceWebSocket({ activeClient, onNewMessageOrUpdate }) {
  const [isWsConnected, setIsWsConnected] = useState(false);
  const debounceTimerRef = useRef(null);
  const onUpdateRef = useRef(onNewMessageOrUpdate);

  useEffect(() => {
    onUpdateRef.current = onNewMessageOrUpdate;
  }, [onNewMessageOrUpdate]);

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
          // Assina os eventos deste cliente
          ws.send(
            JSON.stringify({
              event: 'subscribe_client',
              client_id: activeClient.id,
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            const evtName = message.event || message.type;
            const payload = message.data || message.payload || message;

            // Filtra por client_id se fornecido no payload
            if (payload?.client_id && String(payload.client_id) !== String(activeClient.id)) {
              return;
            }

            // Quando houver nova mensagem ou atualização de conversa, dispara refresh com debounce
            if (
              evtName === 'new_message' ||
              evtName === 'conversation_updated' ||
              evtName === 'chat_message'
            ) {
              if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
              }
              debounceTimerRef.current = setTimeout(() => {
                if (onUpdateRef.current) {
                  onUpdateRef.current();
                }
              }, 400);
            }
          } catch (err) {
            console.error('Erro ao processar mensagem do WebSocket em TeamPerformance:', err);
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
        console.error('Falha ao conectar WebSocket em TeamPerformance:', err);
        setIsWsConnected(false);
        if (!isDisposed) {
          reconnectTimeout = setTimeout(connect, 5000);
        }
      }
    };

    connect();

    return () => {
      isDisposed = true;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close();
      }
    };
  }, [activeClient?.id]);

  return { isWsConnected };
}

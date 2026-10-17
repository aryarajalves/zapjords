import { useEffect, useRef } from 'react';
import { WS_URL } from '../../../config';

/**
 * Hook para gerenciar conexão WebSocket e atualizações em tempo real
 * de disparos, reenvios em lote, contadores e histórico de webhooks.
 * Utiliza referências mutáveis para garantir conexão persistente e evitar reconexões desnecessárias.
 */
export function useIntegrationsSocket({
  activeClient,
  isPipelineModalOpen,
  selectedDispatchId,
  isDispatchHistoryModalOpen,
  isHistoryModalOpen,
  historyIntegrationId,
  fetchIntegrations,
  setIntegrations,
  onRecentHistoryUpdate,
  setBulkResendProgress,
  setSelectedDispatch,
  setDispatchHistory,
  setWebhookHistory,
  fetchHistory,
  webhookHistoryStatusFilter,
  webhookHistorySearch,
  bulkResendProgress
}) {
  // Mantém referências sempre atualizadas para callbacks e estados sem precisar reconectar o socket
  const propsRef = useRef({});
  propsRef.current = {
    activeClient,
    isPipelineModalOpen,
    selectedDispatchId,
    isDispatchHistoryModalOpen,
    isHistoryModalOpen,
    historyIntegrationId,
    fetchIntegrations,
    setIntegrations,
    onRecentHistoryUpdate,
    setBulkResendProgress,
    setSelectedDispatch,
    setDispatchHistory,
    setWebhookHistory,
    fetchHistory,
    webhookHistoryStatusFilter,
    webhookHistorySearch,
    bulkResendProgress
  };

  // WebSocket para atualizações em tempo real persistente por cliente
  useEffect(() => {
    let ws;
    let reconnectTimeout;
    let isMounted = true;

    const connect = () => {
      const currentClient = propsRef.current.activeClient;
      if (!currentClient || !isMounted) return;

      const wsBase = WS_URL.endsWith('/ws') ? WS_URL : `${WS_URL}/ws`;
      const wsToken = localStorage.getItem('token');
      const wsFinalUrl = wsToken ? `${wsBase}?token=${wsToken}` : wsBase;

      try {
        ws = new WebSocket(wsFinalUrl);

        ws.onopen = () => {
          const clientId = propsRef.current.activeClient?.id;
          if (clientId && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              event: 'subscribe_client',
              client_id: clientId
            }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (!message || !message.event) return;

            const currentProps = propsRef.current;
            const currentClientId = currentProps.activeClient?.id;

            // 1. Progresso de reenvio em lote de webhooks
            if (message.event === 'bulk_progress' && message.data?.type === 'webhook_resend') {
              if (currentProps.setBulkResendProgress) currentProps.setBulkResendProgress(message.data);
            }

            // 2. Progresso de disparos e funis
            if (message.event === 'trigger_progress' || message.event === 'bulk_progress') {
              const data = message.data || {};
              const triggerId = data.id || data.trigger_id;

              if (currentProps.isPipelineModalOpen && currentProps.selectedDispatchId === triggerId && currentProps.setSelectedDispatch) {
                currentProps.setSelectedDispatch(prev => ({ ...prev, ...data }));
              }

              if (currentProps.isDispatchHistoryModalOpen && currentProps.setDispatchHistory) {
                currentProps.setDispatchHistory(prev => {
                  const list = Array.isArray(prev) ? prev : [];
                  const index = list.findIndex(item => item.id === triggerId);
                  if (index !== -1) {
                    const newHistory = [...list];
                    const existingItem = newHistory[index];
                    const mappedData = {
                      status: data.status !== undefined ? data.status : existingItem.status,
                      total_sent: data.sent !== undefined ? data.sent : (data.total_sent !== undefined ? data.total_sent : existingItem.total_sent),
                      total_failed: data.failed !== undefined ? data.failed : (data.total_failed !== undefined ? data.total_failed : existingItem.total_failed),
                      total_contacts: data.total_contacts !== undefined ? data.total_contacts : (data.total !== undefined ? data.total : existingItem.total_contacts),
                      total_delivered: data.delivered !== undefined ? data.delivered : (data.total_delivered !== undefined ? data.total_delivered : existingItem.total_delivered),
                      total_read: data.read !== undefined ? data.read : (data.total_read !== undefined ? data.total_read : existingItem.total_read),
                      total_interactions: data.interactions !== undefined ? data.interactions : (data.total_interactions !== undefined ? data.total_interactions : existingItem.total_interactions),
                      total_blocked: data.blocked !== undefined ? data.blocked : (data.total_blocked !== undefined ? data.total_blocked : existingItem.total_blocked),
                      total_cost: data.cost !== undefined ? data.cost : (data.total_cost !== undefined ? data.total_cost : existingItem.total_cost),
                      total_memory_sent: data.memory_sent !== undefined ? data.memory_sent : (data.total_memory_sent !== undefined ? data.total_memory_sent : existingItem.total_memory_sent)
                    };
                    newHistory[index] = { ...existingItem, ...data, ...mappedData };
                    return newHistory;
                  }
                  return list;
                });
              }

              if (['completed', 'failed', 'cancelled'].includes(data.status)) {
                if (currentProps.fetchIntegrations) currentProps.fetchIntegrations(true);
              }
            }

            // 3. Atualização em tempo real de Histórico de Webhook (Novo dado, status ou deduplicação)
            if (message.event === 'webhook_history_update') {
              const data = message.data || {};
              if (data.client_id && currentClientId && String(data.client_id) !== String(currentClientId)) {
                return;
              }

              // Atualização imediata da contagem e destaque visual na tabela
              if (data.is_new) {
                if (currentProps.setIntegrations && data.integration_id) {
                  currentProps.setIntegrations(prev => (prev || []).map(item => {
                    if (String(item.id) === String(data.integration_id)) {
                      return {
                        ...item,
                        history_count: (item.history_count || 0) + 1
                      };
                    }
                    return item;
                  }));
                }

                if (currentProps.onRecentHistoryUpdate && data.integration_id) {
                  currentProps.onRecentHistoryUpdate(data.integration_id);
                }

                if (currentProps.fetchIntegrations) {
                  currentProps.fetchIntegrations(true);
                }
              }

              // Atualização do modal de histórico (se aberto para esta integração)
              if (currentProps.isHistoryModalOpen && String(currentProps.historyIntegrationId) === String(data.integration_id) && currentProps.setWebhookHistory) {
                currentProps.setWebhookHistory(prev => {
                  const list = Array.isArray(prev) ? prev : [];
                  const index = list.findIndex(item => String(item.id) === String(data.history_id));
                  if (index !== -1) {
                    const updated = [...list];
                    const existing = updated[index];
                    updated[index] = {
                      ...existing,
                      status: data.status !== undefined ? data.status : existing.status,
                      processed_data: data.processed_data !== undefined ? data.processed_data : existing.processed_data,
                      error_message: data.error_message !== undefined ? data.error_message : existing.error_message,
                      duplicate_count: data.duplicate_count !== undefined ? data.duplicate_count : existing.duplicate_count
                    };
                    return updated;
                  } else {
                    const newItem = {
                      id: data.history_id,
                      integration_id: data.integration_id,
                      event_type: data.event_type || 'outros',
                      status: data.status || 'pending',
                      processed_data: data.processed_data || {},
                      payload: data.payload || data.processed_data || {},
                      error_message: data.error_message || null,
                      duplicate_count: data.duplicate_count || 0,
                      created_at: data.created_at || new Date().toISOString()
                    };
                    return [newItem, ...list];
                  }
                });

                if (currentProps.fetchHistory) {
                  currentProps.fetchHistory(
                    currentProps.historyIntegrationId,
                    currentProps.webhookHistoryStatusFilter || '',
                    currentProps.webhookHistorySearch || '',
                    true
                  );
                }
              }
            }

            // 4. Status de webhook individual atualizado
            if (message.event === 'webhook_status_update') {
              const data = message.data || {};
              if (currentProps.isHistoryModalOpen && String(currentProps.historyIntegrationId) === String(data.integration_id) && currentProps.setWebhookHistory) {
                currentProps.setWebhookHistory(prev => (prev || []).map(item => {
                  if (String(item.id) === String(data.history_id)) {
                    return {
                      ...item,
                      status: data.status !== undefined ? data.status : item.status,
                      error_message: data.error_message !== undefined ? data.error_message : item.error_message,
                      duplicate_count: data.duplicate_count !== undefined ? data.duplicate_count : item.duplicate_count
                    };
                  }
                  return item;
                }));
              }
            }

            // 5. Exclusão de itens do histórico
            if (message.event === 'webhook_history_deleted') {
              const data = message.data || {};
              const deletedIds = new Set((data.history_ids || []).map(String));
              if (currentProps.isHistoryModalOpen && String(currentProps.historyIntegrationId) === String(data.integration_id) && currentProps.setWebhookHistory) {
                currentProps.setWebhookHistory(prev => (prev || []).filter(item => !deletedIds.has(String(item.id))));
              }
              if (currentProps.fetchIntegrations) {
                currentProps.fetchIntegrations(true);
              }
            }

            // 6. Histórico de webhook limpo
            if (message.event === 'webhook_history_cleared') {
              const data = message.data || {};
              if (currentProps.setIntegrations && data.integration_id) {
                currentProps.setIntegrations(prev => (prev || []).map(item => {
                  if (String(item.id) === String(data.integration_id)) {
                    return { ...item, history_count: 0 };
                  }
                  return item;
                }));
              }
              if (currentProps.isHistoryModalOpen && String(currentProps.historyIntegrationId) === String(data.integration_id) && currentProps.setWebhookHistory) {
                currentProps.setWebhookHistory([]);
              }
              if (currentProps.fetchIntegrations) {
                currentProps.fetchIntegrations(true);
              }
            }

            // 7. Webhook capturado genericamente
            if (message.event === 'webhook_caught') {
              const dataClientId = message.data?.client_id;
              if (!dataClientId || String(dataClientId) === String(currentClientId)) {
                if (currentProps.fetchIntegrations) currentProps.fetchIntegrations(true);
              }
            }
          } catch (e) {
            console.error('Erro ao processar mensagem WebSocket em useIntegrationsSocket:', e);
          }
        };

        ws.onclose = () => {
          if (isMounted) reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          if (ws) ws.close();
        };
      } catch (err) {
        console.error('Erro ao conectar WebSocket em useIntegrationsSocket:', err);
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [activeClient?.id]);

  // Limpeza automática do progresso de reenvio
  useEffect(() => {
    if (bulkResendProgress?.status === 'completed' || bulkResendProgress?.status === 'failed') {
      const timer = setTimeout(() => {
        setBulkResendProgress(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [bulkResendProgress?.status, setBulkResendProgress]);
}

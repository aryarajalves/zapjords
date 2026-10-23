import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../../config';
import { fetchWithAuth } from '../../../AuthContext';

export function useInfrastructure() {
  const [metrics, setMetrics] = useState(null);
  const [settings, setSettings] = useState({
    alert_pool_enabled: true,
    alert_pool_threshold: 75,
    alert_ram_enabled: true,
    alert_ram_threshold: 80,
    alert_cpu_enabled: true,
    alert_cpu_threshold: 85,
    cooldown_minutes: 15,
    webhook_url: '',
    notify_normalized: true,
  });

  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  const isMountedRef = useRef(true);

  const fetchMetrics = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      const res = await fetchWithAuth(`${API_URL}/infra/metrics`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Falha ao buscar métricas de infraestrutura.');
      }
      const data = await res.json();
      if (isMountedRef.current) {
        setMetrics(data);
      }
      if (isManualRefresh) {
        toast.success('Métricas atualizadas com sucesso!');
      }
    } catch (err) {
      if (isManualRefresh) {
        toast.error(err.message || 'Erro ao atualizar métricas.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingMetrics(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoadingSettings(true);
      const res = await fetchWithAuth(`${API_URL}/infra/settings`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Falha ao buscar configurações de alerta.');
      }
      const data = await res.json();
      if (isMountedRef.current) {
        setSettings({
          alert_pool_enabled: data.alert_pool_enabled ?? true,
          alert_pool_threshold: data.alert_pool_threshold ?? 75,
          alert_ram_enabled: data.alert_ram_enabled ?? true,
          alert_ram_threshold: data.alert_ram_threshold ?? 80,
          alert_cpu_enabled: data.alert_cpu_enabled ?? true,
          alert_cpu_threshold: data.alert_cpu_threshold ?? 85,
          cooldown_minutes: data.cooldown_minutes ?? 15,
          webhook_url: data.webhook_url || '',
          notify_normalized: data.notify_normalized ?? true,
        });
      }
    } catch (err) {
      // Falha silenciosa ou log
      console.warn('Erro ao carregar configurações de alerta:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingSettings(false);
      }
    }
  }, []);

  const saveSettings = async (customSettings = null) => {
    const payload = customSettings || settings;
    try {
      setIsSavingSettings(true);
      const res = await fetchWithAuth(`${API_URL}/infra/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Falha ao salvar configurações.');
      }

      const updated = await res.json();
      if (isMountedRef.current) {
        setSettings(prev => ({ ...prev, ...updated }));
      }
      toast.success('Configurações salvas com sucesso!');
      return true;
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar configurações.');
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsSavingSettings(false);
      }
    }
  };

  const testWebhook = async (url) => {
    const webhookToTest = url || settings.webhook_url;
    if (!webhookToTest || !webhookToTest.trim()) {
      toast.error('Informe uma URL de Webhook antes de disparar o teste.');
      return false;
    }

    try {
      setIsTestingWebhook(true);
      const res = await fetchWithAuth(`${API_URL}/infra/test-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_url: webhookToTest }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Falha ao testar webhook.');
      }

      const result = await res.json();
      toast.success(result.message || 'Webhook de teste disparado com sucesso!');
      return true;
    } catch (err) {
      toast.error(err.message || 'Erro ao enviar webhook de teste.');
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsTestingWebhook(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchMetrics();
    fetchSettings();

    // Polling suave a cada 20 segundos para manter os dados atualizados
    const timer = setInterval(() => {
      fetchMetrics(false);
    }, 20000);

    return () => {
      isMountedRef.current = false;
      clearInterval(timer);
    };
  }, [fetchMetrics, fetchSettings]);

  return {
    metrics,
    settings,
    setSettings,
    isLoadingMetrics,
    isLoadingSettings,
    isRefreshing,
    isSavingSettings,
    isTestingWebhook,
    fetchMetrics,
    saveSettings,
    testWebhook,
  };
}

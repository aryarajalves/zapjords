import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../../config';
import { useClient } from '../../../contexts/ClientContext';

export function useEmailFunnels() {
  const { activeClient } = useClient();
  const [funnels, setFunnels] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFunnel, setEditingFunnel] = useState(null);
  const [executionsModalOpen, setExecutionsModalOpen] = useState(false);
  const [activeFunnelForExecutions, setActiveFunnelForExecutions] = useState(null);
  const [deleteConfirmFunnel, setDeleteConfirmFunnel] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Client-ID': activeClient?.id ? String(activeClient.id) : ''
    };
  }, [activeClient]);

  const fetchFunnels = useCallback(async () => {
    if (!activeClient) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/email/funnels`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setFunnels(Array.isArray(data) ? data : []);
      } else {
        toast.error('Erro ao carregar funis de e-mail');
      }
    } catch (err) {
      console.error('Erro ao carregar funis de e-mail:', err);
      toast.error('Erro ao carregar funis de e-mail');
    } finally {
      setLoading(false);
    }
  }, [activeClient, getHeaders]);

  const fetchTemplates = useCallback(async () => {
    if (!activeClient) return;
    try {
      const res = await fetch(`${API_URL}/email/templates`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTemplates(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao buscar templates:', err);
    }
  }, [activeClient, getHeaders]);

  useEffect(() => {
    fetchFunnels();
    fetchTemplates();
  }, [fetchFunnels, fetchTemplates]);

  const handleToggleStatus = async (funnelId) => {
    try {
      const res = await fetch(`${API_URL}/email/funnels/${funnelId}/toggle-status`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'Status atualizado!');
        fetchFunnels();
      } else {
        toast.error('Erro ao alterar status do funil');
      }
    } catch (err) {
      toast.error('Erro ao alterar status do funil');
    }
  };

  const handleDeleteFunnel = async () => {
    if (!deleteConfirmFunnel) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/email/funnels/${deleteConfirmFunnel.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        toast.success('Funil excluído com sucesso!');
        setDeleteConfirmFunnel(null);
        fetchFunnels();
      } else {
        toast.error('Erro ao excluir funil');
      }
    } catch (err) {
      toast.error('Erro ao excluir funil');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveFunnel = async (funnelData) => {
    try {
      const isEdit = Boolean(editingFunnel && editingFunnel.id);
      const endpoint = isEdit
        ? `${API_URL}/email/funnels/${editingFunnel.id}`
        : `${API_URL}/email/funnels`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(funnelData)
      });

      if (res.ok) {
        toast.success(isEdit ? 'Funil atualizado com sucesso!' : 'Funil criado com sucesso!');
        setEditorOpen(false);
        setEditingFunnel(null);
        fetchFunnels();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.detail || 'Erro ao salvar funil');
      }
    } catch (err) {
      toast.error('Erro ao salvar funil');
    }
  };

  return {
    funnels,
    templates,
    loading,
    editorOpen,
    setEditorOpen,
    editingFunnel,
    setEditingFunnel,
    executionsModalOpen,
    setExecutionsModalOpen,
    activeFunnelForExecutions,
    setActiveFunnelForExecutions,
    deleteConfirmFunnel,
    setDeleteConfirmFunnel,
    deleting,
    fetchFunnels,
    handleToggleStatus,
    handleDeleteFunnel,
    handleSaveFunnel
  };
}

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiUsers, FiClock, FiSearch, FiChevronLeft, FiChevronRight, FiCheckCircle, FiAlertCircle, FiShield } from 'react-icons/fi';
import { API_URL } from '../../../config';
import { useClient } from '../../../contexts/ClientContext';

export default function EmailFunnelExecutionsModal({ funnel, onClose }) {
  const { activeClient } = useClient();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Client-ID': activeClient?.id ? String(activeClient.id) : ''
    };
  }, [activeClient]);

  const fetchExecutions = useCallback(async (targetPage = page) => {
    if (!funnel || !activeClient) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: targetPage,
        page_size: pageSize
      });
      if (search.trim()) params.append('search', search.trim());
      if (filterStatus) params.append('status', filterStatus);

      const res = await fetch(`${API_URL}/email/funnels/${funnel.id}/executions?${params.toString()}`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotalPages(data.total_pages || 1);
        setTotalCount(data.total || 0);
        setPage(data.page || 1);
      }
    } catch (err) {
      console.error('Erro ao buscar execuções:', err);
    } finally {
      setLoading(false);
    }
  }, [funnel, activeClient, search, filterStatus, pageSize, page, getHeaders]);

  useEffect(() => {
    fetchExecutions(1);
  }, [fetchExecutions]);

  if (!funnel) return null;

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Ativo</span>;
      case 'waiting_delay':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1"><FiClock size={12} /> Aguardando Delay</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1"><FiCheckCircle size={12} /> Concluído</span>;
      case 'stopped_purchase':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1"><FiShield size={12} /> Compra Aprovada</span>;
      case 'stopped_tag':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">Stop Tag</span>;
      case 'failed':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1"><FiAlertCircle size={12} /> Falhou</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-500/10 text-gray-400 border border-gray-500/20">{status}</span>;
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[999999] w-screen h-screen bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
              <FiUsers size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Leads no Funil: <span className="text-blue-400">{funnel.name}</span>
              </h2>
              <p className="text-xs text-gray-400">
                Mostrando 20 contatos por página • Total de {totalCount} contatos inscritos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Fechar"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Filtros Rápidos */}
        <div className="px-6 py-3 border-b border-white/10 bg-slate-900/50 flex flex-wrap items-center gap-3 justify-between">
          <div className="relative flex-1 min-w-[220px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Buscar por e-mail ou nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Todos os status</option>
              <option value="active">Ativo</option>
              <option value="waiting_delay">Aguardando Delay</option>
              <option value="completed">Concluído</option>
              <option value="stopped_purchase">Compra Aprovada</option>
              <option value="stopped_tag">Stop Tag</option>
              <option value="failed">Falha</option>
            </select>
          </div>
        </div>

        {/* Tabela de Leads */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-xs">Carregando contatos...</div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-xs">Nenhum contato encontrado com os filtros atuais.</div>
          ) : (
            <div className="border border-white/10 rounded-xl overflow-hidden bg-slate-800/30">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-800/80 text-gray-400 border-b border-white/10">
                    <th className="py-2.5 px-4 font-semibold">Contato</th>
                    <th className="py-2.5 px-4 font-semibold">Etapa Atual</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold">Próximo Disparo / Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((it) => (
                    <tr key={it.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{it.contact_email}</div>
                        {it.contact_name && <div className="text-[11px] text-gray-400">{it.contact_name}</div>}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        Passo {it.current_step_index + 1} de {funnel.steps?.length || 0}
                      </td>
                      <td className="py-3 px-4">{renderStatusBadge(it.status)}</td>
                      <td className="py-3 px-4 text-gray-400 text-[11px]">
                        {it.status === 'waiting_delay' && it.scheduled_for ? (
                          <span className="text-amber-300">Agendado para: {new Date(it.scheduled_for).toLocaleString('pt-BR')}</span>
                        ) : it.stop_reason ? (
                          <span className="text-gray-400 italic">{it.stop_reason}</span>
                        ) : (
                          <span>Passo anterior finalizado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rodapé Paginado de 20 por vez */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 bg-slate-800/50 text-xs text-gray-400">
          <div>
            Página <span className="text-white font-bold">{page}</span> de <span className="text-white font-bold">{totalPages}</span> (20 por página)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchExecutions(page - 1)}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-white/10 rounded-lg text-white font-medium flex items-center gap-1 transition-colors"
            >
              <FiChevronLeft size={14} /> Anterior
            </button>
            <button
              onClick={() => fetchExecutions(page + 1)}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-white/10 rounded-lg text-white font-medium flex items-center gap-1 transition-colors"
            >
              Próximo <FiChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

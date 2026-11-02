import React, { useState, useEffect } from 'react';
import {
  FiX,
  FiBarChart2,
  FiMail,
  FiCheckCircle,
  FiEye,
  FiMousePointer,
  FiExternalLink,
  FiSearch,
  FiUsers,
  FiAlertCircle,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { API_URL } from '../../../config';

export default function EmailDispatchAnalyticsModal({ dispatch, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [contactFilter, setContactFilter] = useState('all'); // 'all', 'opened', 'clicked', 'failed'
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const fetchAnalytics = async () => {
    if (!dispatch?.id) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const activeClientId = localStorage.getItem('activeClientId') || '';
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Client-ID': activeClientId
      };

      let res = await fetch(`${API_URL}/email-marketing/dispatches/${dispatch.id}/analytics`, { headers });
      if (!res.ok) {
        res = await fetch(`${API_URL}/email/dispatches/${dispatch.id}/analytics`, { headers });
      }

      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.detail || 'Não foi possível carregar as métricas deste disparo.');
      }
    } catch (err) {
      console.error('Erro ao buscar analytics de e-mail:', err);
      setError('Erro de conexão ao carregar métricas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    setCurrentPage(1);
  }, [dispatch]);

  if (!dispatch) return null;

  const kpis = data?.kpis || {
    total_contacts: dispatch.total_contacts || 0,
    total_sent: dispatch.total_sent || 0,
    total_delivered: dispatch.total_sent || 0,
    total_failed: dispatch.total_failed || 0,
    total_opened: dispatch.total_opened || 0,
    total_clicks: dispatch.total_clicks || 0,
    open_rate: dispatch.total_sent > 0 ? Math.round(((dispatch.total_opened || 0) / dispatch.total_sent) * 100) : 0,
    click_rate: dispatch.total_sent > 0 ? Math.round(((dispatch.total_clicks || 0) / dispatch.total_sent) * 100) : 0,
    click_to_open_rate: dispatch.total_opened > 0 ? Math.round(((dispatch.total_clicks || 0) / dispatch.total_opened) * 100) : 0
  };

  // Filtragem de contatos
  const allContacts = data?.contacts_performance || [];
  const filteredContacts = allContacts.filter(c => {
    const matchSearch =
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    if (contactFilter === 'opened') return c.opened;
    if (contactFilter === 'clicked') return c.clicked;
    if (contactFilter === 'failed') return c.status === 'failed' || !!c.failure_reason;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / pageSize));
  const paginatedContacts = filteredContacts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const topLinks = data?.top_clicked_links || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FiBarChart2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Métricas da Newsletter / Disparo
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                  ID #{dispatch.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-md">
                {dispatch.title} — <span className="text-slate-300">"{dispatch.subject}"</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              title="Atualizar métricas"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            >
              <FiRefreshCw size={15} className={loading ? 'animate-spin text-blue-400' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-slate-200">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <FiAlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Grid de 4 KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* KPI 1: Total Enviados */}
            <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Total Enviados</span>
                <FiMail className="text-blue-400" />
              </div>
              <div className="text-2xl font-black text-white">{kpis.total_sent}</div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <FiUsers size={11} /> {kpis.total_contacts} contatos no público
              </div>
            </div>

            {/* KPI 2: Entregues */}
            <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Entregues</span>
                <FiCheckCircle className="text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">{kpis.total_delivered}</div>
              <div className="text-[11px] text-emerald-500/80 mt-1">
                {kpis.total_failed > 0 ? `⚠️ ${kpis.total_failed} falhas` : '100% de sucesso'}
              </div>
            </div>

            {/* KPI 3: Taxa de Abertura */}
            <div className="bg-gradient-to-br from-slate-800/80 to-blue-950/30 border border-blue-500/30 p-4 rounded-xl">
              <div className="flex items-center justify-between text-blue-300 text-xs mb-1">
                <span className="font-semibold">Taxa de Abertura</span>
                <FiEye className="text-blue-400" />
              </div>
              <div className="text-2xl font-black text-blue-400">{kpis.open_rate}%</div>
              <div className="text-[11px] text-slate-300 mt-1">
                {kpis.total_opened} {kpis.total_opened === 1 ? 'leitor abriu' : 'leitores abriram'}
              </div>
            </div>

            {/* KPI 4: CTR / Taxa de Cliques */}
            <div className="bg-gradient-to-br from-slate-800/80 to-indigo-950/30 border border-indigo-500/30 p-4 rounded-xl">
              <div className="flex items-center justify-between text-indigo-300 text-xs mb-1">
                <span className="font-semibold">Taxa de Cliques (CTR)</span>
                <FiMousePointer className="text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-indigo-400">{kpis.click_rate}%</div>
              <div className="text-[11px] text-slate-300 mt-1">
                {kpis.total_clicks} {kpis.total_clicks === 1 ? 'clique total' : 'cliques totais'}
              </div>
            </div>
          </div>

          {/* Barra de Conversão do Funil da Campanha */}
          <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">Funil de Engajamento da Newsletter</span>
              <span className="text-slate-400 text-[11px]">
                CTOR (Cliques / Aberturas): <strong className="text-white">{kpis.click_to_open_rate || 0}%</strong>
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${Math.min(100, Math.max(kpis.open_rate, 4))}%` }}
                className="bg-blue-500 h-full transition-all"
                title={`Aberturas: ${kpis.open_rate}%`}
              />
              <div
                style={{ width: `${Math.min(100, Math.max(kpis.click_rate, 2))}%` }}
                className="bg-indigo-500 h-full transition-all"
                title={`Cliques: ${kpis.click_rate}%`}
              />
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Aberturas ({kpis.open_rate}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Cliques ({kpis.click_rate}%)
              </span>
            </div>
          </div>

          {/* Seção de Links Mais Clicados */}
          <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FiExternalLink className="text-indigo-400" /> Links Mais Clicados da Edição
              </h3>
              <span className="text-[11px] text-slate-400">
                {topLinks.length} {topLinks.length === 1 ? 'link monitorado' : 'links monitorados'}
              </span>
            </div>

            {topLinks.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center italic">
                Nenhum clique registrado nos links desta edição até o momento.
              </p>
            ) : (
              <div className="space-y-2.5">
                {topLinks.map((link, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline truncate max-w-lg flex items-center gap-1"
                        title={link.url}
                      >
                        <FiExternalLink size={12} /> {link.url}
                      </a>
                      <span className="font-bold text-white shrink-0 ml-2">
                        {link.clicks} {link.clicks === 1 ? 'clique' : 'cliques'} ({link.percentage}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, Math.max(link.percentage, 5))}%` }}
                        className="bg-indigo-500 h-full rounded-full transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seção de Desempenho por Contato */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-center">
              {/* Filtros em Abas */}
              <div className="flex gap-1 bg-slate-900/60 p-1 rounded-xl text-xs w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => { setContactFilter('all'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    contactFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos ({allContacts.length})
                </button>
                <button
                  type="button"
                  onClick={() => { setContactFilter('opened'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    contactFilter === 'opened'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  👁️ Abertos ({allContacts.filter(c => c.opened).length})
                </button>
                <button
                  type="button"
                  onClick={() => { setContactFilter('clicked'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    contactFilter === 'clicked'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🖱️ Clicaram ({allContacts.filter(c => c.clicked).length})
                </button>
              </div>

              {/* Busca de contato */}
              <div className="relative w-full sm:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
                <input
                  type="text"
                  placeholder="Buscar por e-mail ou nome..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Tabela de Destinatários */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Destinatário</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Abertura</th>
                    <th className="px-4 py-3">Clique em Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedContacts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-500">
                        Nenhum contato encontrado com os critérios selecionados.
                      </td>
                    </tr>
                  ) : (
                    paginatedContacts.map((contact, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-all">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{contact.name || contact.email}</div>
                          <div className="text-[11px] text-slate-400">{contact.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          {contact.clicked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[11px] font-semibold">
                              <FiMousePointer size={10} /> Clicou no Link
                            </span>
                          ) : contact.opened ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] font-semibold">
                              <FiEye size={10} /> Abriu o E-mail
                            </span>
                          ) : contact.status === 'failed' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-semibold" title={contact.failure_reason}>
                              ❌ Falhou
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                              <FiCheckCircle size={10} /> Entregue
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                          {contact.opened_at ? new Date(contact.opened_at).toLocaleString('pt-BR') : '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                          {contact.clicked_at ? new Date(contact.clicked_at).toLocaleString('pt-BR') : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação da Tabela */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/40 border-t border-slate-800 text-xs text-slate-400">
                <span>
                  Página {currentPage} de {totalPages} ({filteredContacts.length} contatos)
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FiChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé com 1 botão Fechar */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

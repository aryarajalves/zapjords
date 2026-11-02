import React, { useState, useEffect, useCallback } from 'react';
import { FiUsers, FiMessageSquare, FiCalendar, FiClock } from 'react-icons/fi';
import { fetchWithAuth } from '../../AuthContext';
import { API_URL } from '../../config';
import { useClient } from '../../contexts/ClientContext';
import PerformanceHeader from './components/PerformanceHeader';
import MetricCard from './components/MetricCard';
import SellersTable from './components/SellersTable';
import ContactsTable from './components/ContactsTable';
import { useTeamPerformanceWebSocket } from './hooks/useTeamPerformanceWebSocket';

export default function TeamPerformance({ onNavigateToChat }) {
  const { activeClient } = useClient();
  const [sellers, setSellers] = useState([]);
  const [selectedSellerId, setSelectedSellerId] = useState(null);
  const [period, setPeriod] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [summaryData, setSummaryData] = useState(null);
  const [contactsData, setContactsData] = useState({ items: [], total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Carregar lista de vendedores da equipe
  useEffect(() => {
    let isMounted = true;
    if (!activeClient?.id) return;

    fetchWithAuth(`${API_URL}/team-performance/sellers`, {}, activeClient.id)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (isMounted && data?.sellers) {
          setSellers(data.sellers);
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar vendedores da equipe:', err);
      });

    return () => { isMounted = false; };
  }, [activeClient?.id]);

  // Carregar métricas de resumo
  const fetchSummary = useCallback(async () => {
    if (!activeClient?.id) return;
    setLoadingSummary(true);
    try {
      const q = new URLSearchParams({ period });
      if (selectedSellerId) q.append('seller_id', selectedSellerId);
      if (period === 'custom' && startDate) q.append('start_date', startDate);
      if (period === 'custom' && endDate) q.append('end_date', endDate);

      const res = await fetchWithAuth(
        `${API_URL}/team-performance/summary?${q.toString()}`,
        {},
        activeClient.id
      );
      if (res.ok) {
        const data = await res.json();
        setSummaryData(data);
      }
    } catch (err) {
      console.error('Erro ao carregar resumo de desempenho:', err);
    } finally {
      setLoadingSummary(false);
    }
  }, [activeClient?.id, period, selectedSellerId, startDate, endDate]);

  // Carregar lista de contatos conversados
  const fetchContacts = useCallback(async () => {
    if (!activeClient?.id) return;
    setLoadingContacts(true);
    try {
      const q = new URLSearchParams({
        period,
        page: String(page),
        page_size: '15',
      });
      if (selectedSellerId) q.append('seller_id', selectedSellerId);
      if (search.trim()) q.append('search', search.trim());
      if (period === 'custom' && startDate) q.append('start_date', startDate);
      if (period === 'custom' && endDate) q.append('end_date', endDate);

      const res = await fetchWithAuth(
        `${API_URL}/team-performance/contacts?${q.toString()}`,
        {},
        activeClient.id
      );
      if (res.ok) {
        const data = await res.json();
        setContactsData(data || { items: [], total: 0, total_pages: 1 });
      }
    } catch (err) {
      console.error('Erro ao carregar contatos atendidos:', err);
    } finally {
      setLoadingContacts(false);
    }
  }, [activeClient?.id, period, selectedSellerId, search, page, startDate, endDate]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Sincronização em tempo real via WebSocket
  const handleRealtimeUpdate = useCallback(() => {
    fetchSummary();
    fetchContacts();
  }, [fetchSummary, fetchContacts]);

  const { isWsConnected } = useTeamPerformanceWebSocket({
    activeClient,
    onNewMessageOrUpdate: handleRealtimeUpdate,
  });

  // Resetar página ao mudar filtros de vendedor ou busca
  const handleSelectSeller = (id) => {
    setSelectedSellerId(id);
    setPage(1);
  };

  const handleSelectPeriod = (newPeriod) => {
    setPeriod(newPeriod);
    setPage(1);
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
  };

  const metrics = summaryData?.metrics || {};

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Cabeçalho e Filtros com Status do WebSocket */}
      <PerformanceHeader
        sellers={sellers}
        selectedSellerId={selectedSellerId}
        onSelectSeller={handleSelectSeller}
        period={period}
        onSelectPeriod={handleSelectPeriod}
        onRefresh={() => {
          fetchSummary();
          fetchContacts();
        }}
        loading={loadingSummary || loadingContacts}
        isWsConnected={isWsConnected}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {/* Cartões de Métricas (Hoje, 7 Dias, Este Mês, Período Selecionado) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Atendimentos Hoje"
          value={`${metrics.today?.unique_contacts ?? 0} contatos`}
          subtitle={`${metrics.today?.total_messages ?? 0} mensagens enviadas`}
          icon={FiClock}
          color="blue"
        />
        <MetricCard
          title="Últimos 7 Dias"
          value={`${metrics.this_week?.unique_contacts ?? 0} contatos`}
          subtitle={`${metrics.this_week?.total_messages ?? 0} mensagens enviadas`}
          icon={FiCalendar}
          color="emerald"
        />
        <MetricCard
          title="Este Mês"
          value={`${metrics.this_month?.unique_contacts ?? 0} contatos`}
          subtitle={`${metrics.this_month?.total_messages ?? 0} mensagens enviadas`}
          icon={FiUsers}
          color="purple"
        />
        <MetricCard
          title="Filtro Ativo"
          value={`${metrics.selected_period?.unique_contacts ?? 0} contatos`}
          subtitle={`${metrics.selected_period?.total_messages ?? 0} mensagens no período`}
          icon={FiMessageSquare}
          color="amber"
        />
      </div>

      {/* Ranking / Breakdown de Vendedores */}
      <SellersTable
        sellersBreakdown={summaryData?.sellers_breakdown || []}
        selectedSellerId={selectedSellerId}
        onSelectSeller={handleSelectSeller}
      />

      {/* Lista de Contatos com Ação de Abrir no Chat */}
      <ContactsTable
        contacts={contactsData.items || []}
        total={contactsData.total || 0}
        page={page}
        pageSize={15}
        totalPages={contactsData.total_pages || 1}
        onPageChange={setPage}
        search={search}
        onSearchChange={handleSearchChange}
        onNavigateToChat={onNavigateToChat}
        loading={loadingContacts}
      />
    </div>
  );
}

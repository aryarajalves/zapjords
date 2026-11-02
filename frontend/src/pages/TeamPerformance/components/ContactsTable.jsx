import React from 'react';
import { FiMessageSquare, FiExternalLink, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function ContactsTable({
  contacts = [],
  total = 0,
  page = 1,
  pageSize = 15,
  totalPages = 1,
  onPageChange,
  search = '',
  onSearchChange,
  onNavigateToChat,
  loading = false,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/60 dark:bg-[#131b2e]/60 backdrop-blur-md shadow-sm">
      {/* Header da Tabela com Busca */}
      <div className="p-4 border-b border-gray-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FiMessageSquare className="text-emerald-500" size={18} />
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Contatos Conversados no Período
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total de {total} contato(s) atendido(s)
            </p>
          </div>
        </div>

        {/* Campo de Busca */}
        <div className="relative min-w-[240px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            data-testid="search-contacts-input"
            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a233a] pl-9 pr-3 py-1.5 text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Conteúdo */}
      {contacts.length === 0 ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
          {loading ? 'Carregando contatos...' : 'Nenhum contato encontrado com os filtros aplicados.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 dark:bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/5">
              <tr>
                <th className="px-5 py-3">Contato / Lead</th>
                <th className="px-5 py-3">Telefone</th>
                <th className="px-5 py-3">Atendido Por</th>
                <th className="px-5 py-3">Mensagens Enviadas</th>
                <th className="px-5 py-3">Última Mensagem</th>
                <th className="px-5 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {contacts.map((c) => (
                <tr
                  key={c.conversation_id}
                  className="transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.03]"
                >
                  {/* Nome do Contato */}
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {c.contact_name}
                    </div>
                    <span className="text-[11px] text-gray-400">ID Conversa: #{c.conversation_id}</span>
                  </td>

                  {/* Telefone */}
                  <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300 font-mono text-xs">
                    {c.phone || '—'}
                  </td>

                  {/* Atendido Por */}
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {c.seller_name}
                    </span>
                  </td>

                  {/* Mensagens Enviadas */}
                  <td className="px-5 py-3.5 font-semibold text-gray-800 dark:text-gray-200">
                    {c.messages_count} msgs
                  </td>

                  {/* Última Mensagem */}
                  <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                    {c.last_message_at
                      ? new Date(c.last_message_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </td>

                  {/* Ação: Abrir no Chat */}
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => onNavigateToChat && onNavigateToChat(c.conversation_id)}
                      data-testid={`open-chat-btn-${c.conversation_id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer hover:shadow-blue-500/25"
                    >
                      <FiExternalLink size={12} />
                      Abrir no Chat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Página {page} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-40 cursor-pointer"
            >
              <FiChevronLeft size={16} />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-40 cursor-pointer"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

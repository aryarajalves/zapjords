import React from 'react';
import { FiUsers, FiMessageSquare, FiTrendingUp, FiFilter } from 'react-icons/fi';

export default function SellersTable({
  sellersBreakdown = [],
  onSelectSeller,
  selectedSellerId,
}) {
  if (!sellersBreakdown || sellersBreakdown.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/60 dark:bg-[#131b2e]/60 backdrop-blur-md p-8 text-center">
        <FiUsers size={36} className="mx-auto text-gray-400 mb-2" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Nenhuma atividade de atendimento registrada no período selecionado.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Quando os vendedores enviarem mensagens pelo Chat, os dados aparecerão aqui automaticamente.
        </p>
      </div>
    );
  }

  const maxContacts = Math.max(...sellersBreakdown.map((s) => s.unique_contacts || 0), 1);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/60 dark:bg-[#131b2e]/60 backdrop-blur-md shadow-sm">
      <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiTrendingUp className="text-blue-500" size={18} />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            Ranking de Atendimento da Equipe
          </h2>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {sellersBreakdown.length} atendente(s) com envios
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/50 dark:bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/5">
            <tr>
              <th className="px-5 py-3">Vendedor / Atendente</th>
              <th className="px-5 py-3">Contatos Únicos</th>
              <th className="px-5 py-3">Mensagens Enviadas</th>
              <th className="px-5 py-3">Média Msgs/Contato</th>
              <th className="px-5 py-3">Última Mensagem</th>
              <th className="px-5 py-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {sellersBreakdown.map((item, idx) => {
              const isSelected = selectedSellerId === item.seller_id;
              const contactRatio = Math.round(((item.unique_contacts || 0) / maxContacts) * 100);

              return (
                <tr
                  key={item.seller_id || idx}
                  className={`transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.03] ${
                    isSelected ? 'bg-blue-50/50 dark:bg-blue-500/10' : ''
                  }`}
                >
                  {/* Vendedor */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                        {(item.name || 'V')[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {item.email || item.role}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contatos Únicos */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900 dark:text-white text-base">
                        {item.unique_contacts}
                      </span>
                      <div className="w-20 bg-gray-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${contactRatio}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Total de Mensagens */}
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      <FiMessageSquare size={12} />
                      {item.total_messages} msgs
                    </span>
                  </td>

                  {/* Média */}
                  <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300 font-medium">
                    {item.avg_messages_per_contact} msgs/lead
                  </td>

                  {/* Última Mensagem */}
                  <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                    {item.last_message_at
                      ? new Date(item.last_message_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </td>

                  {/* Ação */}
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectSeller(isSelected ? null : item.seller_id)}
                      data-testid={`filter-seller-btn-${item.seller_id}`}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <FiFilter size={12} />
                      {isSelected ? 'Filtro Ativo' : 'Ver Contatos'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

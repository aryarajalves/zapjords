import React, { useState } from 'react';
import { FiX, FiMail, FiCheckCircle, FiXCircle, FiSearch, FiChevronLeft, FiChevronRight, FiUsers } from 'react-icons/fi';

export default function EmailDispatchContactsModal({ dispatch, onClose }) {
  if (!dispatch) return null;

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const contacts = Array.isArray(dispatch.contacts_list) ? dispatch.contacts_list : [];

  const filteredContacts = contacts.filter(c => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const email = (c.email || c.to || '').toLowerCase();
    const name = (c.name || '').toLowerCase();
    return email.includes(q) || name.includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, filteredContacts.length);
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

  return (
    <div
      data-testid="email-dispatch-contacts-modal"
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/40">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                <FiUsers size={18} />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-white text-base truncate">
                Contatos do Disparo: {dispatch.title}
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              Assunto: {dispatch.subject}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition"
            title="Fechar"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Métricas Resumidas + Campo de Busca */}
        <div className="p-4 border-b border-gray-100 dark:border-white/5 space-y-3 bg-gray-50/20 dark:bg-slate-900/40">
          <div className="flex items-center gap-3 text-xs">
            <span className="px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg font-bold">
              🚀 Total: {dispatch.total_contacts || contacts.length}
            </span>
            <span className="px-2.5 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg font-bold">
              ✅ Enviados: {dispatch.total_sent || 0}
            </span>
            {(dispatch.total_failed > 0 || (dispatch.total_contacts - dispatch.total_sent) > 0) && (
              <span className="px-2.5 py-1 bg-red-500/10 text-red-500 rounded-lg font-bold">
                ❌ Falhas: {dispatch.total_failed || (dispatch.total_contacts - dispatch.total_sent)}
              </span>
            )}
          </div>

          <div className="relative">
            <FiSearch className="absolute left-3 top-2.5 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Buscar por e-mail ou nome do contato..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Lista de Contatos Paginada (20 por vez) */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-gray-100 dark:divide-gray-800 space-y-1">
          {paginatedContacts.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              Nenhum contato encontrado para os termos da busca.
            </div>
          ) : (
            paginatedContacts.map((contact, idx) => {
              const email = contact.email || contact.to || 'Sem e-mail';
              const name = contact.name || '';
              const isFailed = contact.status === 'failed' || Boolean(contact.error);
              const isSent = contact.status === 'sent' || (!isFailed && contact.message_id);

              return (
                <div key={contact.id || `${email}-${idx}`} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FiMail className="text-gray-400 shrink-0" size={14} />
                    <div className="truncate">
                      <div className="font-bold text-gray-800 dark:text-gray-200 truncate">{email}</div>
                      {name && name !== 'Sem nome' && (
                        <div className="text-[11px] text-gray-400 truncate">{name}</div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {isFailed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-500 rounded-md font-semibold text-[11px]" title={contact.error || 'Falha no envio'}>
                        <FiXCircle size={12} /> Falhou
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-md font-semibold text-[11px]">
                        <FiCheckCircle size={12} /> Enviado
                      </span>
                    )}
                    {contact.sent_at && (
                      <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
                        {new Date(contact.sent_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé com Paginação (20 contatos por vez) */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-slate-800/40">
          <div>
            Exibindo <span className="font-bold text-gray-700 dark:text-gray-200">{filteredContacts.length > 0 ? startIndex + 1 : 0}</span> a{' '}
            <span className="font-bold text-gray-700 dark:text-gray-200">{endIndex}</span> de{' '}
            <span className="font-bold text-gray-700 dark:text-gray-200">{filteredContacts.length}</span> contatos
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <FiChevronLeft size={14} /> Anterior
            </button>
            <span className="px-1.5 font-semibold text-gray-700 dark:text-gray-300">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Próximo <FiChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

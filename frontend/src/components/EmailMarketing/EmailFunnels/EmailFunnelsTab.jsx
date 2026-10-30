import React from 'react';
import { createPortal } from 'react-dom';
import { FiPlus, FiFilter, FiPlay, FiPause, FiEdit2, FiTrash2, FiUsers, FiClock, FiMail, FiCheckCircle, FiShield } from 'react-icons/fi';
import { useEmailFunnels } from './useEmailFunnels';
import EmailFunnelEditorModal from './EmailFunnelEditorModal';
import EmailFunnelExecutionsModal from './EmailFunnelExecutionsModal';
import EmailFunnelFlowBuilder from './flow/EmailFunnelFlowBuilder';

export default function EmailFunnelsTab() {
  const {
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
    handleToggleStatus,
    handleDeleteFunnel,
    handleSaveFunnel
  } = useEmailFunnels();

  return (
    <div className="space-y-6">
      
      {/* Barra Superior */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-white/10 backdrop-blur-md">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FiFilter className="text-blue-400" /> Funis & Réguas de E-mail Marketing
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Crie fluxos sequenciais automatizados com múltiplos e-mails, delays e cancelamento inteligente por compra ou tag.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingFunnel(null);
            setEditorOpen(true);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all shrink-0"
        >
          <FiPlus size={16} /> Novo Funil de E-mail
        </button>
      </div>

      {/* Grid de Funis */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">Carregando funis de e-mail...</div>
      ) : funnels.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/40 border border-white/5 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-3">
            <FiMail size={24} />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Nenhum funil de e-mail criado ainda</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto mb-4">
            Automatize sua comunicação disparando sequências de e-mails personalizadas com tempos de espera configuráveis.
          </p>
          <button
            onClick={() => {
              setEditingFunnel(null);
              setEditorOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs inline-flex items-center gap-2 transition-all"
          >
            <FiPlus size={14} /> Criar Primeiro Funil
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {funnels.map((funnel) => (
            <div
              key={funnel.id}
              className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-blue-500/30 transition-all shadow-lg group"
            >
              <div>
                {/* Cabeçalho do Card */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                      {funnel.name}
                    </h3>
                    {funnel.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{funnel.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleStatus(funnel.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 shrink-0 ${
                      funnel.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20'
                    }`}
                    title="Alternar Ativo/Pausado"
                  >
                    {funnel.is_active ? <FiPlay size={10} /> : <FiPause size={10} />}
                    {funnel.is_active ? 'Ativo' : 'Pausado'}
                  </button>
                </div>

                {/* Gatilho e Parada Inteligente */}
                <div className="space-y-1.5 mb-4 text-[11px]">
                  <div className="flex items-center gap-1.5 text-blue-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    Gatilho: <span className="text-gray-300">
                      {funnel.trigger_type === 'tag'
                        ? `Etiqueta '${funnel.trigger_config?.tag || 'Sem tag'}'`
                        : funnel.trigger_type === 'webhook_status'
                        ? `Status '${funnel.trigger_config?.status || 'Webhook'}'`
                        : 'Disparo Manual'}
                    </span>
                  </div>

                  {funnel.stop_on_purchase && (
                    <div className="flex items-center gap-1 text-purple-400 text-[10px]">
                      <FiShield size={11} /> Cancela em Compra Aprovada
                    </div>
                  )}

                  {Array.isArray(funnel.stop_tags) && funnel.stop_tags.length > 0 && (
                    <div className="text-[10px] text-gray-400 line-clamp-1">
                      Stop tags: {funnel.stop_tags.join(', ')}
                    </div>
                  )}
                </div>

                {/* Métricas Rápidas */}
                <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-slate-800/50 rounded-xl border border-white/5 mb-4 text-center">
                  <div>
                    <div className="text-[10px] text-gray-400">Passos</div>
                    <div className="text-xs font-bold text-white">{funnel.steps_count || funnel.steps?.length || 0}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400">Inscritos</div>
                    <div className="text-xs font-bold text-blue-400">{funnel.total_enrolled || 0}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400">Concluídos</div>
                    <div className="text-xs font-bold text-emerald-400">{funnel.total_completed || 0}</div>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/5">
                <button
                  onClick={() => {
                    setActiveFunnelForExecutions(funnel);
                    setExecutionsModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all flex-1 justify-center"
                >
                  <FiUsers size={13} /> Ver Leads (20/pág)
                </button>

                <button
                  onClick={() => {
                    setEditingFunnel(funnel);
                    setEditorOpen(true);
                  }}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Editar Funil"
                >
                  <FiEdit2 size={14} />
                </button>

                <button
                  onClick={() => setDeleteConfirmFunnel(funnel)}
                  className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Excluir Funil"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Flow Builder em Canvas de Nós (React Flow) */}
      {editorOpen && (
        <EmailFunnelFlowBuilder
          funnel={editingFunnel}
          templates={templates}
          onBack={() => {
            setEditorOpen(false);
            setEditingFunnel(null);
          }}
          onSave={handleSaveFunnel}
          onDelete={(f) => {
            setDeleteConfirmFunnel(f);
            setEditorOpen(false);
          }}
        />
      )}

      {/* Modal de Execuções (Leads Paginados em 20 por vez) */}
      {executionsModalOpen && activeFunnelForExecutions && (
        <EmailFunnelExecutionsModal
          funnel={activeFunnelForExecutions}
          onClose={() => {
            setExecutionsModalOpen(false);
            setActiveFunnelForExecutions(null);
          }}
        />
      )}

      {/* Modal de Confirmação de Deleção Centralizado (Tela Inteira via Portal) */}
      {deleteConfirmFunnel && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] w-screen h-screen bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/20 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95 fade-in duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <FiTrash2 size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">Excluir Funil de E-mail?</h3>
              <p className="text-xs text-gray-400">
                Tem certeza que deseja apagar o funil <strong className="text-white">"{deleteConfirmFunnel.name}"</strong>? Todas as execuções associadas serão excluídas permanentemente.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteConfirmFunnel(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteFunnel}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-500/20"
              >
                {deleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
    FiX, 
    FiClock, 
    FiCheckCircle, 
    FiAlertCircle, 
    FiMessageSquare, 
    FiMail, 
    FiArrowRight, 
    FiCalendar, 
    FiDollarSign, 
    FiUser, 
    FiPhone,
    FiRefreshCw
} from 'react-icons/fi';
import { apiRequestJson } from '../utils/kanbanApiActions';
import { formatBrasiliaDateTime } from '../utils/kanbanDateUtils';

export function LeadHistoryModal({ isOpen, onClose, deal, clientId }) {
    const [historyData, setHistoryData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen || !deal?.id) {
            setHistoryData(null);
            setError(null);
            return;
        }

        let isMounted = true;
        const fetchHistory = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                const headers = {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                    ...(clientId ? { 'X-Client-ID': String(clientId) } : {})
                };

                const data = await apiRequestJson(
                    `/api/crm/deals/${deal.id}/history`,
                    'GET',
                    headers,
                    undefined,
                    'Não foi possível carregar a linha do tempo deste lead.'
                );
                if (isMounted) {
                    setHistoryData(data);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || 'Não foi possível carregar a linha do tempo deste lead.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchHistory();

        return () => {
            isMounted = false;
        };
    }, [isOpen, deal?.id, clientId]);

    if (!isOpen || !deal) return null;

    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const getTimelineBadge = (item) => {
        switch (item.type) {
            case 'won':
                return {
                    icon: <FiCheckCircle className="text-emerald-400" size={16} />,
                    bgColor: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
                    dotColor: 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                };
            case 'lost':
                return {
                    icon: <FiAlertCircle className="text-rose-400" size={16} />,
                    bgColor: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
                    dotColor: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                };
            case 'stage_change':
                return {
                    icon: <FiArrowRight className="text-blue-400" size={16} />,
                    bgColor: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
                    dotColor: 'bg-blue-400'
                };
            case 'email_dispatch':
                return {
                    icon: <FiMail className="text-purple-400" size={16} />,
                    bgColor: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
                    dotColor: 'bg-purple-400'
                };
            case 'whatsapp_dispatch':
                return {
                    icon: <FiMessageSquare className="text-teal-400" size={16} />,
                    bgColor: 'bg-teal-500/20 border-teal-500/40 text-teal-300',
                    dotColor: 'bg-teal-400'
                };
            case 'created':
            default:
                return {
                    icon: <FiClock className="text-amber-400" size={16} />,
                    bgColor: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
                    dotColor: 'bg-amber-400'
                };
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
            data-testid="lead-history-modal"
        >
            <div 
                className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header do Modal */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/40">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                <FiClock size={18} />
                            </span>
                            <div className="min-w-0">
                                <h3 className="text-base font-black text-white truncate">
                                    Histórico de Atividades do Lead
                                </h3>
                                <p className="text-xs text-slate-400 truncate">
                                    Linha do tempo completa de movimentações, mensagens e eventos
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Botão de Fechar único (Regra de Popups) */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title="Fechar janela"
                        aria-label="Fechar janela"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Resumo Rápido do Contato */}
                <div className="px-5 py-3.5 bg-slate-800/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-white flex items-center gap-1.5">
                            <FiUser size={13} className="text-blue-400" />
                            {deal.contact_name || 'Sem Nome'}
                        </span>
                        <span className="text-slate-400 font-mono flex items-center gap-1">
                            <FiPhone size={12} className="text-slate-500" />
                            {deal.contact_phone}
                        </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {deal.product_name && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold text-[11px]">
                                {deal.product_name}
                            </span>
                        )}
                        <span className="font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <FiDollarSign size={12} />
                            {formatCurrency(deal.value)}
                        </span>
                    </div>
                </div>

                {/* Corpo com a Linha do Tempo */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar bg-slate-900/60">
                    {isLoading ? (
                        <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
                            <FiRefreshCw className="animate-spin text-blue-400" size={28} />
                            <p className="text-xs font-semibold">Carregando histórico do lead...</p>
                        </div>
                    ) : error ? (
                        <div className="py-12 flex flex-col items-center justify-center text-rose-400 space-y-2 text-center">
                            <FiAlertCircle size={28} />
                            <p className="text-xs font-semibold">{error}</p>
                        </div>
                    ) : !historyData?.timeline || historyData.timeline.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-2 text-center">
                            <FiClock size={28} />
                            <p className="text-xs font-semibold">Nenhuma atividade registrada para este lead ainda.</p>
                        </div>
                    ) : (
                        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-white/10 before:to-transparent">
                            {historyData.timeline.map((item) => {
                                const badge = getTimelineBadge(item);
                                return (
                                    <div key={item.id} className="relative group">
                                        {/* Bolinha na linha da timeline */}
                                        <div className={`absolute -left-[19px] top-1.5 w-3 h-3 rounded-full border-2 border-slate-900 ${badge.dotColor}`} />

                                        {/* Card do Evento */}
                                        <div className="bg-slate-950/60 border border-white/5 hover:border-white/15 rounded-2xl p-3.5 space-y-1.5 transition-all">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`p-1.5 rounded-lg border ${badge.bgColor}`}>
                                                        {badge.icon}
                                                    </span>
                                                    <h4 className="text-xs font-bold text-white">
                                                        {item.title}
                                                    </h4>
                                                </div>

                                                <span className="text-[10px] font-mono text-slate-400 shrink-0 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg">
                                                    <FiCalendar size={10} className="text-slate-500" />
                                                    {formatBrasiliaDateTime(item.timestamp)}
                                                </span>
                                            </div>

                                            {item.description && (
                                                <p className="text-xs text-slate-300 pl-8 leading-relaxed">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Rodapé com Botão Único de Fechar */}
                <div className="p-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-white/10 hover:border-white/20 cursor-pointer"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}

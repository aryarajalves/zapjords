import React, { useState, useEffect } from 'react';
import { FiX, FiClock, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { fetchWithAuth } from '../../../AuthContext';
import { API_URL } from '../../../config';
import { useClient } from '../../../contexts/ClientContext';

export default function FollowUpChatBanner({ selectedConvo }) {
    const { activeClient } = useClient();
    const [pendingFollowup, setPendingFollowup] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const phone = selectedConvo?.phone;

    useEffect(() => {
        if (!phone || !activeClient?.id) {
            setPendingFollowup(null);
            return;
        }

        let isMounted = true;
        const checkPendingFollowup = async () => {
            try {
                const res = await fetchWithAuth(
                    `${API_URL}/triggers/contacts/${phone}/pending-followup`,
                    {},
                    activeClient.id
                );
                if (res.ok && isMounted) {
                    const data = await res.json();
                    if (data.has_pending_followup && data.pending_followups?.length > 0) {
                        setPendingFollowup(data.pending_followups[0]);
                    } else {
                        setPendingFollowup(null);
                    }
                }
            } catch (err) {
                // Silencioso em caso de falha de conexão
                if (isMounted) setPendingFollowup(null);
            }
        };

        checkPendingFollowup();
        return () => { isMounted = false; };
    }, [phone, activeClient?.id]);

    const handleConfirmCancel = async () => {
        if (!phone || !activeClient?.id) return;
        setIsCancelling(true);
        try {
            const res = await fetchWithAuth(
                `${API_URL}/triggers/contacts/${phone}/cancel-followups`,
                { method: 'POST' },
                activeClient.id
            );
            if (res.ok) {
                toast.success("Follow-up cancelado com sucesso para este contato!");
                setPendingFollowup(null);
                setShowCancelModal(false);
            } else {
                const data = await res.json();
                toast.error(data.detail || "Erro ao cancelar follow-up.");
            }
        } catch (err) {
            toast.error("Erro ao cancelar follow-up.");
        } finally {
            setIsCancelling(false);
        }
    };

    if (!pendingFollowup) return null;

    const formatScheduled = (dtStr) => {
        if (!dtStr) return 'Em breve';
        try {
            const d = new Date(dtStr);
            return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        } catch (e) {
            return dtStr;
        }
    };

    return (
        <>
            <div className="bg-purple-600/10 border-b border-purple-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-purple-400 font-medium animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
                    <span>
                        Follow-up agendado: <strong className="text-purple-300">{pendingFollowup.template_name}</strong> 
                        <span className="ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-300 uppercase">
                            Etapa #{pendingFollowup.step_number || 1}
                        </span>
                        <span className="ml-2 text-slate-400">
                            (Envio previsto: {formatScheduled(pendingFollowup.scheduled_time)})
                        </span>
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowCancelModal(true)}
                        className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 rounded-lg transition text-[11px] font-bold flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                        <FiX size={13} />
                        Cancelar Follow-up
                    </button>
                </div>
            </div>

            {/* Modal de Confirmação de Cancelamento */}
            {showCancelModal && (
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div 
                        className="bg-slate-900 border border-rose-500/30 w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 text-rose-400 mb-4">
                            <FiAlertCircle size={28} />
                            <h3 className="text-lg font-black uppercase tracking-wider text-white">
                                Cancelar Follow-up
                            </h3>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed mb-6">
                            Tem certeza que deseja cancelar os follow-ups pendentes para este contato? 
                            Ele não receberá mais os próximos disparos automáticos desta sequência.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={() => setShowCancelModal(false)}
                                disabled={isCancelling}
                                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all border border-white/5"
                            >
                                Manter Agendado
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmCancel}
                                disabled={isCancelling}
                                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2"
                            >
                                {isCancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

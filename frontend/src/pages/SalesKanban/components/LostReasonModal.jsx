import React, { useState } from 'react';
import { FiX, FiAlertCircle } from 'react-icons/fi';

const QUICK_REASONS = [
    'Preço alto / Sem orçamento',
    'Sem interesse no momento',
    'Comprou de concorrente',
    'Não responde / Sumiu',
    'Prazo de entrega / Condições',
    'Outro motivo'
];

export function LostReasonModal({
    isOpen,
    deal,
    onClose,
    onConfirm,
    isSaving = false
}) {
    const [reason, setReason] = useState(deal?.lost_reason || '');

    if (!isOpen || !deal) return null;

    const handleSelectQuick = (q) => {
        setReason(q);
    };

    const handleConfirm = (e) => {
        if (e) e.preventDefault();
        onConfirm(reason.trim());
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div
                className="bg-slate-900 border border-rose-500/30 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up max-h-[92vh] flex flex-col my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5 bg-rose-500/10 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                            <FiAlertCircle size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white">
                                Motivo da Desistência
                            </h3>
                            <p className="text-xs text-rose-300/80">
                                Movendo {deal.contact_name || deal.contact_phone} para Desistência
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                    >
                        <FiX size={16} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleConfirm} className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                    <div>
                        <label className="block text-xs font-bold text-slate-300 mb-2">
                            Selecione ou digite o motivo da perda:
                        </label>

                        {/* Chips de seleção rápida */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {QUICK_REASONS.map((q) => {
                                const isSelected = reason === q;
                                return (
                                    <button
                                        type="button"
                                        key={q}
                                        onClick={() => handleSelectQuick(q)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                            isSelected
                                                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                                                : 'bg-slate-950/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/5'
                                        }`}
                                    >
                                        {q}
                                    </button>
                                );
                            })}
                        </div>

                        <textarea
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ex: Achou o valor acima do planejado no momento, pediu para retomar contato no próximo mês..."
                            className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-rose-500 transition-all resize-none"
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/25 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {isSaving ? 'Salvando...' : 'Confirmar Desistência'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

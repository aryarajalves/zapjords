import React from 'react';
import { FiSend, FiRefreshCw, FiCalendar, FiRepeat } from 'react-icons/fi';

export default function BulkTemplateFooter({
    selectedCount = 0,
    selectedTemplateName,
    isSubmitting = false,
    dispatchMode = 'immediate',
    onClose,
    onSend
}) {
    const getButtonIconAndText = () => {
        if (isSubmitting) {
            return (
                <>
                    <FiRefreshCw className="animate-spin" size={13} />
                    <span>Processando...</span>
                </>
            );
        }
        if (dispatchMode === 'recurring') {
            return (
                <>
                    <FiRepeat size={13} />
                    <span>Salvar Disparo Recorrente</span>
                </>
            );
        }
        if (dispatchMode === 'scheduled') {
            return (
                <>
                    <FiCalendar size={13} />
                    <span>Agendar Disparo Template</span>
                </>
            );
        }
        return (
            <>
                <FiSend size={13} />
                <span>Iniciar Disparo Template</span>
            </>
        );
    };

    const getFooterSubtitle = () => {
        if (selectedCount === 0) return 'Nenhum contato selecionado.';
        if (dispatchMode === 'recurring') {
            return `${selectedCount} contato(s) configurados para a recorrência.`;
        }
        if (dispatchMode === 'scheduled') {
            return `${selectedCount} contato(s) receberão o template na data agendada.`;
        }
        return `${selectedCount} contato(s) receberão o template.`;
    };

    return (
        <div className="px-6 py-4 border-t border-white/10 bg-[#1e293b]/50 flex items-center justify-between">
            <span className="text-xs text-slate-400">
                {getFooterSubtitle()}
            </span>

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    onClick={onSend}
                    disabled={isSubmitting || !selectedTemplateName || selectedCount === 0}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 shadow-lg shadow-teal-900/30 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                    {getButtonIconAndText()}
                </button>
            </div>
        </div>
    );
}

import React from 'react';
import { FiX, FiSend } from 'react-icons/fi';

export default function BulkTemplateHeader({
    selectedCount = 0,
    onClose,
    isSubmitting = false
}) {
    return (
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1e293b]/50">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <FiSend size={18} />
                </div>
                <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>Disparo de Template</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-medium">
                            {selectedCount} selecionado(s)
                        </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                        Dispare um template aprovado da Meta com automação de botões e follow-up
                    </p>
                </div>
            </div>
            <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                title="Fechar"
            >
                <FiX size={18} />
            </button>
        </div>
    );
}

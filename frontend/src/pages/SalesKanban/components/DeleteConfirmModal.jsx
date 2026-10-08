import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

export function DeleteConfirmModal({ isOpen, title, message, onConfirm, onCancel, isProcessing }) {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={(e) => e.stopPropagation()} // Impede fechamento por clique externo
        >
            <div 
                className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl p-6 text-center space-y-4 animate-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                    <FiAlertTriangle size={24} />
                </div>

                <div>
                    <h3 className="text-base font-black text-white">
                        {title || 'Confirmar Exclusão?'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                        {message || 'Esta ação não poderá ser desfeita.'}
                    </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isProcessing}
                        className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {isProcessing ? 'Excluindo...' : 'Sim, Excluir'}
                    </button>
                </div>
            </div>
        </div>
    );
}

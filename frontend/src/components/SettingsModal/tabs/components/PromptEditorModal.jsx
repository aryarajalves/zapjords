import React from 'react';
import { FiMinimize2, FiSave, FiRotateCcw, FiX } from 'react-icons/fi';

export default function PromptEditorModal({
    isOpen,
    onClose,
    promptName,
    promptText,
    setPromptText,
    onSave,
    onRestoreDefault,
    isSaving
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
            <div 
                className="bg-[#0f172a] border border-blue-500/30 rounded-2xl w-full h-[90vh] max-w-5xl flex flex-col p-6 shadow-2xl relative text-gray-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Cabeçalho */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs uppercase tracking-wider font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                                Editor em Tela Cheia
                            </span>
                            <h2 className="text-lg font-bold text-white">
                                {promptName || 'Prompt de Instruções de Vendas'}
                            </h2>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Defina as diretrizes, argumentos comerciais, objeções e tom de voz que o Copiloto de IA deve utilizar.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {onRestoreDefault && (
                            <button
                                type="button"
                                onClick={onRestoreDefault}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-all font-semibold"
                            >
                                <FiRotateCcw size={13} />
                                Restaurar Padrão
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            title="Minimizar tela cheia"
                        >
                            <FiMinimize2 size={18} />
                        </button>
                    </div>
                </div>

                {/* Área da Textarea Ampla */}
                <div className="flex-1 py-4 flex flex-col min-h-0">
                    <textarea
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        placeholder="Insira as diretrizes detalhadas de atendimento do seu negócio ou produto..."
                        className="w-full flex-1 p-4 bg-[#1e293b]/70 border border-white/10 rounded-xl text-sm font-mono text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 custom-scrollbar leading-relaxed resize-none"
                    />
                </div>

                {/* Rodapé */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10 shrink-0">
                    <div className="text-xs text-gray-400 flex items-center gap-3">
                        <span>* O ZapVoice injeta automaticamente histórico do lead e kanban no final deste prompt.</span>
                        <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-gray-300">
                            {promptText?.length || 0} caracteres
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                        >
                            Fechar Tela Cheia
                        </button>
                        <button
                            type="button"
                            disabled={isSaving}
                            onClick={onSave}
                            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                        >
                            <FiSave size={14} />
                            <span>{isSaving ? 'Salvando...' : 'Salvar Prompt'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

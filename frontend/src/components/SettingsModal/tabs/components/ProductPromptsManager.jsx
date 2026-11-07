import React, { useState } from 'react';
import { 
    FiPlus, FiTrash2, FiStar, FiMaximize2, 
    FiRotateCcw, FiCheck, FiTag, FiFileText, FiSave 
} from 'react-icons/fi';
import PromptEditorModal from './PromptEditorModal';

export default function ProductPromptsManager({
    presets,
    activePresetId,
    setActivePresetId,
    onSavePreset,
    onCreatePreset,
    onDeletePreset,
    onSetDefaultPreset,
    onRestoreDefault,
    defaultPromptBase,
    isSaving
}) {
    const [isMaximized, setIsMaximized] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProductName, setNewProductName] = useState('');
    const [newProductPrompt, setNewProductPrompt] = useState('');

    const currentPreset = presets.find(p => p.id === activePresetId) || presets[0] || null;

    const handleOpenCreateModal = () => {
        setNewProductName('');
        setNewProductPrompt(defaultPromptBase || '');
        setIsCreateModalOpen(true);
    };

    const handleConfirmCreate = async () => {
        if (!newProductName.trim()) return;
        await onCreatePreset({
            name: newProductName.trim(),
            product_identifier: newProductName.trim(),
            prompt_text: newProductPrompt.trim() || defaultPromptBase,
            is_default: false
        });
        setIsCreateModalOpen(false);
    };

    return (
        <div className="space-y-4">
            {/* Header com Abas de Produtos */}
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <FiTag size={13} className="text-blue-400" />
                    Prompts Personalizados por Produto / Objetivo
                </label>
                <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-all"
                >
                    <FiPlus size={13} />
                    <span>Novo Produto</span>
                </button>
            </div>

            {/* Carrossel de Abas/Pills dos Produtos */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {presets.map((preset) => {
                    const isSelected = preset.id === activePresetId;
                    return (
                        <button
                            key={preset.id}
                            type="button"
                            onClick={() => setActivePresetId(preset.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                                isSelected
                                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                                    : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {preset.is_default && <FiStar size={12} className="text-amber-300 fill-amber-300" />}
                            <span>{preset.name}</span>
                        </button>
                    );
                })}
            </div>

            {/* Painel do Prompt Ativo */}
            {currentPreset && (
                <div className="p-4 bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <input
                                type="text"
                                value={currentPreset.name}
                                onChange={(e) => onSavePreset(currentPreset.id, { name: e.target.value }, false)}
                                className="px-3 py-1.5 bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-white/10 rounded-lg text-xs font-bold text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
                                placeholder="Nome do Produto / Contexto"
                            />
                            {currentPreset.is_default ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                    <FiStar size={11} className="fill-amber-400" /> Padrão Comercial
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => onSetDefaultPreset(currentPreset.id)}
                                    className="text-[11px] text-gray-400 hover:text-amber-400 hover:underline flex items-center gap-1"
                                    title="Tornar este prompt o padrão geral"
                                >
                                    <FiStar size={11} /> Definir Padrão
                                </button>
                            )}
                        </div>

                        {/* Ações do Prompt */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => onRestoreDefault(currentPreset.id)}
                                className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                                title="Restaurar prompt padrão de vendas neste produto"
                            >
                                <FiRotateCcw size={12} />
                                Restaurar Padrão de Vendas
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsMaximized(true)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-gray-200 bg-gray-800/80 hover:bg-gray-700/80 border border-white/10 rounded-xl transition-all shadow-sm"
                                title="Maximizar para tela cheia e editar com mais espaço"
                            >
                                <FiMaximize2 size={13} className="text-blue-400" />
                                <span>Maximizar Editor</span>
                            </button>

                            {presets.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => onDeletePreset(currentPreset.id)}
                                    className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                                    title="Excluir este prompt de produto"
                                >
                                    <FiTrash2 size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Textarea Inline */}
                    <div className="space-y-1">
                        <textarea
                            rows={7}
                            value={currentPreset.prompt_text}
                            onChange={(e) => onSavePreset(currentPreset.id, { prompt_text: e.target.value }, false)}
                            className="w-full px-4 py-3 bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-mono text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 custom-scrollbar leading-relaxed"
                            placeholder="Instruções de atendimento específicas para este produto..."
                        />
                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                            <span>* O atendente poderá alternar diretamente no chat para este produto a qualquer momento.</span>
                            <span>{currentPreset.prompt_text?.length || 0} caracteres</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Maximizado em Tela Cheia */}
            {currentPreset && (
                <PromptEditorModal
                    isOpen={isMaximized}
                    onClose={() => setIsMaximized(false)}
                    promptName={`Produto: ${currentPreset.name}`}
                    promptText={currentPreset.prompt_text}
                    setPromptText={(val) => onSavePreset(currentPreset.id, { prompt_text: val }, false)}
                    onSave={() => onSavePreset(currentPreset.id, { prompt_text: currentPreset.prompt_text }, true)}
                    onRestoreDefault={() => onRestoreDefault(currentPreset.id)}
                    isSaving={isSaving}
                />
            )}

            {/* Modal de Criação de Novo Produto */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div 
                        className="bg-[#0f172a] border border-blue-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <FiPlus className="text-blue-400" />
                            Cadastrar Prompt para Novo Produto
                        </h3>
                        <p className="text-xs text-gray-400">
                            Crie um conjunto de instruções específico para um produto (ex: Mentoria, Bússola, Curso, etc).
                        </p>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-300">Nome do Produto / Contexto:</label>
                            <input
                                type="text"
                                value={newProductName}
                                onChange={(e) => setNewProductName(e.target.value)}
                                placeholder="Ex: Bússola Astrológica"
                                className="w-full px-3 py-2 bg-[#1e293b] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={!newProductName.trim()}
                                onClick={handleConfirmCreate}
                                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                            >
                                Criar Prompt do Produto
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import React from 'react';
import { FiX, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import { BsTrello } from 'react-icons/bs';
import { useChatCrmDeal } from './hooks/useChatCrmDeal';

export default function AddChatToCrmModal({ isOpen, onClose, selectedConvo }) {
    const {
        pipelines,
        selectedPipelineId,
        setSelectedPipelineId,
        stages,
        selectedStageId,
        setSelectedStageId,
        products,
        selectedProductId,
        handleProductChange,
        contactName,
        setContactName,
        contactPhone,
        value,
        setValue,
        lostReason,
        setLostReason,
        notes,
        setNotes,
        existingDeal,
        currentStageName,
        isTargetLost,
        targetStageName,
        isLoading,
        isSaving,
        handleSave
    } = useChatCrmDeal({ isOpen, selectedConvo, onClose });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                {/* Cabeçalho */}
                <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-600/10 text-blue-500 border border-blue-500/20">
                            <BsTrello size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                {existingDeal ? 'Mover Etapa no Kanban' : 'Adicionar ao Kanban de Vendas'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {selectedConvo?.contact_name || contactPhone}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {/* Banner de Etapa Atual */}
                {existingDeal && currentStageName && (
                    <div className="px-5 py-2.5 bg-blue-500/10 border-b border-blue-500/20 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-500 dark:text-gray-400">Etapa Atual:</span>
                            <span className="px-2 py-0.5 rounded-md font-bold bg-blue-500/20 border border-blue-500/30">
                                {currentStageName}
                            </span>
                        </div>
                        <span className="text-[11px] font-semibold text-blue-500">
                            ➔ Sugerida: {targetStageName}
                        </span>
                    </div>
                )}

                {/* Formulário */}
                <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
                    {isLoading ? (
                        <div className="py-8 text-center text-sm text-gray-500">
                            Carregando dados do CRM...
                        </div>
                    ) : (
                        <>
                            {/* Pipeline e Coluna de Destino */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Pipeline de Vendas *
                                    </label>
                                    <select
                                        value={selectedPipelineId}
                                        onChange={(e) => setSelectedPipelineId(e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1e293b] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        required
                                    >
                                        {pipelines.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Coluna de Destino *
                                    </label>
                                    <select
                                        value={selectedStageId}
                                        onChange={(e) => setSelectedStageId(e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1e293b] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium"
                                        required
                                    >
                                        {stages.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} {s.stage_type === 'won' ? '🏆 (Ganho)' : s.stage_type === 'lost' ? '❌ (Perdido)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Produto e Valor */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Produto (Catálogo)
                                    </label>
                                    <select
                                        value={selectedProductId}
                                        onChange={(e) => handleProductChange(e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1e293b] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    >
                                        <option value="">Nenhum produto</option>
                                        {products.map(prod => (
                                            <option key={prod.id} value={prod.id}>
                                                {prod.name} (R$ {Number(prod.price || 0).toFixed(2)})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Valor Estimado (R$)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <FiDollarSign size={13} />
                                        </div>
                                        <input
                                            type="text"
                                            value={value}
                                            onChange={(e) => setValue(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1e293b] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Campo Condicional: Motivo da Desistência */}
                            {isTargetLost && (
                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 space-y-1.5 animate-in fade-in duration-200">
                                    <label className="flex items-center gap-1.5 text-xs font-bold text-red-500">
                                        <FiAlertCircle size={14} />
                                        Motivo da Desistência *
                                    </label>
                                    <input
                                        type="text"
                                        value={lostReason}
                                        onChange={(e) => setLostReason(e.target.value)}
                                        placeholder="Ex: Preço alto, optou por concorrente, sem tempo..."
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-red-500/30 bg-white dark:bg-[#1e293b] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                        required={isTargetLost}
                                    />
                                </div>
                            )}

                            {/* Notas da Oportunidade */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Notas da Oportunidade
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                    placeholder="Anotações internas sobre a conversa..."
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1e293b] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                                />
                            </div>
                        </>
                    )}

                    {/* Rodapé / Ações */}
                    <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || isLoading}
                            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer font-medium"
                        >
                            {isSaving ? 'Salvando...' : existingDeal ? `Mover para "${targetStageName}"` : 'Adicionar ao Kanban'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

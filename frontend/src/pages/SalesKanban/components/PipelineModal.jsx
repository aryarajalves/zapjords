import React, { useState, useEffect } from 'react';
import { FiX, FiTag, FiBox, FiDollarSign } from 'react-icons/fi';

export function PipelineModal({ isOpen, onClose, onSave, pipelineToEdit }) {
    const [name, setName] = useState('');
    const [productName, setProductName] = useState('');
    const [associatedTags, setAssociatedTags] = useState('');
    const [defaultValue, setDefaultValue] = useState('0.00');
    const [isDefault, setIsDefault] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (pipelineToEdit) {
            setName(pipelineToEdit.name || '');
            setProductName(pipelineToEdit.product_name || '');
            setAssociatedTags(pipelineToEdit.associated_tags || '');
            setDefaultValue(String(pipelineToEdit.default_value ?? '0.00'));
            setIsDefault(pipelineToEdit.is_default || false);
        } else {
            setName('');
            setProductName('');
            setAssociatedTags('');
            setDefaultValue('0.00');
            setIsDefault(false);
        }
    }, [pipelineToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSaving(true);
        try {
            const numVal = parseFloat(String(defaultValue).replace(',', '.')) || 0.0;
            await onSave({
                name: name.trim(),
                product_name: productName.trim() || null,
                associated_tags: associatedTags.trim() || null,
                default_value: numVal,
                is_default: isDefault
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-950/40">
                    <div>
                        <h2 className="text-lg font-black text-white">
                            {pipelineToEdit ? 'Editar Pipeline de Produto' : 'Novo Pipeline de Vendas'}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Configure o funil de vendas associado ao seu produto e etiquetas.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all cursor-pointer"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                            Nome do Pipeline <span className="text-rose-400">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Mentoria Elite, Curso High Ticket"
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none focus:border-blue-500 transition-all font-bold"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <FiBox className="text-blue-400" />
                            Nome do Produto no Webhook (Plataformas)
                        </label>
                        <input
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            placeholder="Ex: Mentoria Elite 2026 (como vem na Hotmart/Kiwify)"
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none focus:border-blue-500 transition-all font-medium"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                            Quando chegar um webhook com este produto, o lead entrará automaticamente neste pipeline.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <FiDollarSign className="text-emerald-400" />
                            Valor Padrão da Venda (R$)
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-xs font-bold">
                                R$
                            </span>
                            <input
                                type="text"
                                value={defaultValue}
                                onChange={(e) => setDefaultValue(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-white text-xs outline-none focus:border-blue-500 transition-all font-mono"
                            />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                            Preço sugerido automaticamente para novos leads ou oportunidades deste curso/produto.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <FiTag className="text-purple-400" />
                            Etiquetas Vinculadas (separadas por vírgula)
                        </label>
                        <input
                            type="text"
                            value={associatedTags}
                            onChange={(e) => setAssociatedTags(e.target.value)}
                            placeholder="Ex: interesse_mentoria, lead_black, vip"
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none focus:border-blue-500 transition-all font-medium"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                            Ao aplicar qualquer uma dessas etiquetas a um contato no Chat ou Funil, ele entra automaticamente neste Kanban.
                        </p>
                    </div>

                    <div className="pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isDefault}
                                onChange={(e) => setIsDefault(e.target.checked)}
                                className="w-4 h-4 rounded border-white/20 bg-slate-950 text-blue-600 focus:ring-0 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-slate-300">
                                Definir como Pipeline padrão do sistema
                            </span>
                        </label>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || !name.trim()}
                            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {isSaving ? 'Salvando...' : 'Salvar Pipeline'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

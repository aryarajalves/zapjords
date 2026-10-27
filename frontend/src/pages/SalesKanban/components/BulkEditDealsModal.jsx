import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiTag, FiEdit2, FiCheck, FiInfo } from 'react-icons/fi';

export function BulkEditDealsModal({
    isOpen,
    onClose,
    onSave,
    selectedCount = 0,
    products = []
}) {
    const [updateProduct, setUpdateProduct] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [productName, setProductName] = useState('');

    const [updateValue, setUpdateValue] = useState(false);
    const [value, setValue] = useState('');

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setUpdateProduct(false);
            setSelectedProductId('');
            setProductName('');
            setUpdateValue(false);
            setValue('');
            setIsSaving(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleProductSelect = (e) => {
        const prodIdStr = e.target.value;
        setSelectedProductId(prodIdStr);

        if (!prodIdStr) {
            setProductName('');
            return;
        }

        if (prodIdStr === '__custom__') {
            setProductName('');
            return;
        }

        const found = products.find(p => String(p.id) === prodIdStr);
        if (found) {
            setProductName(found.name);
            // Se o usuário ainda não definiu um valor personalizado e o produto tem preço oficial
            if (updateValue && (!value || Number(value) === 0) && found.price) {
                setValue(Number(found.price).toFixed(2));
            }
        }
    };

    const handleUseOfficialPrice = () => {
        const found = products.find(p => String(p.id) === selectedProductId);
        if (found && found.price) {
            setValue(Number(found.price).toFixed(2));
            setUpdateValue(true);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!updateProduct && !updateValue) {
            return;
        }

        try {
            setIsSaving(true);
            const numProdId = selectedProductId && selectedProductId !== '__custom__' ? Number(selectedProductId) : null;
            const parsedValue = updateValue ? Math.max(0, parseFloat(value.replace(',', '.') || 0)) : null;

            await onSave({
                update_product: updateProduct,
                product_id: numProdId,
                product_name: updateProduct ? (productName.trim() || null) : null,
                update_value: updateValue,
                value: parsedValue
            });
        } finally {
            setIsSaving(false);
        }
    };

    const selectedCatalogProduct = products.find(p => String(p.id) === selectedProductId);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={(e) => e.stopPropagation()} // Impede fechamento por clique fora
        >
            <div
                className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Cabeçalho */}
                <div className="p-5 border-b border-white/5 bg-slate-950/40">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                            <FiEdit2 size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white">
                                Editar Contatos em Massa
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Aplicar alterações para <strong className="text-blue-400 font-bold">{selectedCount} {selectedCount === 1 ? 'lead selecionado' : 'leads selecionados'}</strong>.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Alerta Informativo */}
                    <div className="p-3 rounded-2xl bg-slate-800/40 border border-white/5 text-xs text-slate-400 flex items-start gap-2.5">
                        <FiInfo size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                        <span>
                            Apenas os campos marcados abaixo serão atualizados. Contatos não afetados manterão seus dados originais.
                        </span>
                    </div>

                    {/* SEÇÃO 1: PRODUTO DE INTERESSE */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                        updateProduct ? 'bg-slate-850 border-blue-500/30' : 'bg-slate-950/20 border-white/5'
                    }`}>
                        <div className="flex items-center justify-between mb-3">
                            <label className="flex items-center gap-2 text-xs font-black text-white cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={updateProduct}
                                    onChange={(e) => setUpdateProduct(e.target.checked)}
                                    className="w-4 h-4 rounded border-white/20 bg-slate-800 text-blue-500 focus:ring-0 cursor-pointer accent-blue-500"
                                />
                                <span>Alterar Produto de Interesse</span>
                            </label>
                            {updateProduct && (
                                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                                    Ativo
                                </span>
                            )}
                        </div>

                        {updateProduct && (
                            <div className="space-y-3 pt-1 animate-fade-in">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                                        Selecione o Produto do Catálogo:
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedProductId}
                                            onChange={handleProductSelect}
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500 transition-all cursor-pointer appearance-none"
                                        >
                                            <option value="">(Nenhum / Deixar sem produto vinculado)</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} {p.price ? `- R$ ${Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
                                                </option>
                                            ))}
                                            <option value="__custom__">✨ Outro produto (Digitar nome livre)</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                            ▼
                                        </div>
                                    </div>
                                </div>

                                {selectedProductId === '__custom__' && (
                                    <div className="animate-fade-in">
                                        <label className="text-[11px] font-bold text-slate-400 block mb-1">
                                            Nome do Produto:
                                        </label>
                                        <input
                                            type="text"
                                            value={productName}
                                            onChange={(e) => setProductName(e.target.value)}
                                            placeholder="Ex: Treinamento VIP 2026"
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* SEÇÃO 2: PREÇO / VALOR (R$) */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                        updateValue ? 'bg-slate-850 border-emerald-500/30' : 'bg-slate-950/20 border-white/5'
                    }`}>
                        <div className="flex items-center justify-between mb-3">
                            <label className="flex items-center gap-2 text-xs font-black text-white cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={updateValue}
                                    onChange={(e) => setUpdateValue(e.target.checked)}
                                    className="w-4 h-4 rounded border-white/20 bg-slate-800 text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500"
                                />
                                <span>Alterar Preço / Valor da Venda (R$)</span>
                            </label>
                            {updateValue && (
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    Ativo
                                </span>
                            )}
                        </div>

                        {updateValue && (
                            <div className="space-y-2 pt-1 animate-fade-in">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-400">
                                        <FiDollarSign size={14} />
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={value}
                                        onChange={(e) => setValue(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 outline-none focus:border-emerald-500 transition-all"
                                    />
                                </div>

                                {selectedCatalogProduct && selectedCatalogProduct.price && (
                                    <button
                                        type="button"
                                        onClick={handleUseOfficialPrice}
                                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                        <FiTag size={10} />
                                        <span>Usar preço oficial de tabela ({selectedCatalogProduct.name}: R$ {Number(selectedCatalogProduct.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Botões de Ação (Apenas 1 botão de cancelar como exige a regra) */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || (!updateProduct && !updateValue)}
                            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <FiCheck size={14} />
                            <span>{isSaving ? 'Salvando...' : `Aplicar aos ${selectedCount} Leads`}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

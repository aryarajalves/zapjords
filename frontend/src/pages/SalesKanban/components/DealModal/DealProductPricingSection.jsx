import React from 'react';
import { FiTag } from 'react-icons/fi';

export function DealProductPricingSection({
    products = [],
    productId,
    onProductChange,
    originalValue,
    setOriginalValue,
    value,
    setValue,
    discountAmount,
    discountPct
}) {
    const safeProducts = Array.isArray(products) ? products : [];

    return (
        <div className="bg-slate-950/60 border border-amber-500/20 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                    <FiTag size={13} className="text-amber-400" />
                    Produto da Empresa
                </label>
                {safeProducts.length === 0 && (
                    <span className="text-[10px] text-slate-400">
                        Nenhum produto cadastrado no catálogo
                    </span>
                )}
            </div>

            <select
                value={productId}
                onChange={(e) => onProductChange(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none focus:border-amber-500 transition-all font-bold cursor-pointer"
            >
                <option value="">Selecione um produto (ou personalize abaixo)...</option>
                {safeProducts.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                        {p.name} — R$ {Number(p.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </option>
                ))}
            </select>

            {/* Valores: Preço Padrão e Valor Real Vendido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Preço de Tabela (R$)
                    </label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">R$</span>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={originalValue}
                            onChange={(e) => setOriginalValue(e.target.value)}
                            placeholder="0,00"
                            className="w-full bg-slate-900 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-slate-300 text-xs font-bold outline-none focus:border-amber-500 transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Valor Real da Venda (R$)
                    </label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">R$</span>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder="0,00"
                            className="w-full bg-slate-900 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-emerald-400 text-xs font-black outline-none focus:border-emerald-500 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Indicação de Desconto */}
            {discountAmount > 0 && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                    <span>🏷️ Desconto Aplicado:</span>
                    <span>
                        - R$ {discountAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({discountPct}% OFF)
                    </span>
                </div>
            )}
        </div>
    );
}

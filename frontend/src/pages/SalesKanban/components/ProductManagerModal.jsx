import React, { useState } from 'react';
import { FiX, FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiPackage, FiCheck } from 'react-icons/fi';

export function ProductManagerModal({
    isOpen,
    onClose,
    products,
    onCreateProduct,
    onUpdateProduct,
    onDeleteProduct
}) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const safeProducts = Array.isArray(products) ? products : [];

    if (!isOpen) return null;

    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const handleOpenCreate = () => {
        setEditingProduct(null);
        setName('');
        setPrice('');
        setDescription('');
        setIsFormOpen(true);
    };

    const handleOpenEdit = (prod) => {
        setEditingProduct(prod);
        setName(prod.name || '');
        setPrice(String(prod.price || ''));
        setDescription(prod.description || '');
        setIsFormOpen(true);
    };

    const handleCancelForm = () => {
        setIsFormOpen(false);
        setEditingProduct(null);
        setName('');
        setPrice('');
        setDescription('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) return;

        const numPrice = parseFloat(String(price).replace(',', '.')) || 0.0;
        setIsSaving(true);
        try {
            if (editingProduct) {
                await onUpdateProduct(editingProduct.id, {
                    name: trimmedName,
                    price: numPrice,
                    description: description.trim() || null
                });
            } else {
                await onCreateProduct({
                    name: trimmedName,
                    price: numPrice,
                    description: description.trim() || null
                });
            }
            handleCancelForm();
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmDelete = async (id) => {
        try {
            await onDeleteProduct(id);
            setDeletingId(null);
        } catch {
            // Toast já exibido no hook
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-scale-up max-h-[92vh] flex flex-col my-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-950/40 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            <FiPackage size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white flex items-center gap-2">
                                Produtos da Empresa
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
                                    {safeProducts.length} {safeProducts.length === 1 ? 'produto' : 'produtos'}
                                </span>
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Cadastre os produtos e preços de tabela para associar aos leads no Kanban.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all cursor-pointer"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                    {/* Botão de Adicionar / Formulário */}
                    {!isFormOpen ? (
                        <button
                            type="button"
                            onClick={handleOpenCreate}
                            className="w-full flex items-center justify-center gap-2 p-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-dashed border-amber-500/30 hover:border-amber-500/50 rounded-2xl text-xs font-black transition-all cursor-pointer"
                        >
                            <FiPlus size={16} />
                            <span>+ Cadastrar Novo Produto</span>
                        </button>
                    ) : (
                        <form onSubmit={handleSubmit} className="bg-slate-950/70 border border-amber-500/30 rounded-2xl p-4 space-y-3 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                                    {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleCancelForm}
                                    className="text-slate-500 hover:text-white text-xs cursor-pointer"
                                >
                                    Cancelar
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        Nome do Produto <span className="text-rose-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ex: Astrowake, Mentoria VIP"
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-500 transition-all font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        Preço Padrão (R$) <span className="text-rose-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                                            R$
                                        </span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            placeholder="1497,00"
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-emerald-400 text-xs font-black outline-none focus:border-amber-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-1">
                                    Descrição Rápida (Opcional)
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Ex: Formação completa com 12 meses de acesso"
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-500 transition-all font-medium"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={handleCancelForm}
                                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving || !name.trim()}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    <FiCheck size={14} />
                                    <span>{isSaving ? 'Salvando...' : (editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto')}</span>
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Lista de Produtos */}
                    <div className="space-y-2">
                        {safeProducts.length === 0 ? (
                            <div className="text-center py-8 bg-slate-950/30 border border-white/5 rounded-2xl p-6">
                                <p className="text-sm font-bold text-slate-300">Nenhum produto cadastrado</p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Cadastre seus produtos com valor padrão para agilizar o preenchimento de leads no Kanban.
                                </p>
                            </div>
                        ) : (
                            safeProducts.map(prod => (
                                <div
                                    key={prod.id}
                                    className="flex items-center justify-between p-3.5 bg-slate-950/40 hover:bg-slate-950 border border-white/5 hover:border-white/15 rounded-2xl transition-all"
                                >
                                    <div className="min-w-0 flex-1 pr-3">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-xs font-black text-white truncate">
                                                {prod.name}
                                            </h4>
                                            <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                                                {formatCurrency(prod.price)}
                                            </span>
                                        </div>
                                        {prod.description && (
                                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                                {prod.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        {deletingId === prod.id ? (
                                            <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 p-1 rounded-xl">
                                                <span className="text-[10px] text-rose-300 font-bold px-1.5">
                                                    Excluir?
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleConfirmDelete(prod.id)}
                                                    className="px-2 py-1 bg-rose-500 text-white text-[10px] font-black rounded-lg cursor-pointer hover:bg-rose-600 transition-colors"
                                                >
                                                    Sim
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingId(null)}
                                                    className="px-2 py-1 bg-white/10 text-slate-300 text-[10px] font-bold rounded-lg cursor-pointer hover:bg-white/20 transition-colors"
                                                >
                                                    Não
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEdit(prod)}
                                                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                                                    title="Editar Produto"
                                                >
                                                    <FiEdit2 size={13} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingId(prod.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                                                    title="Excluir Produto"
                                                >
                                                    <FiTrash2 size={13} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-slate-950/40 flex justify-end shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}

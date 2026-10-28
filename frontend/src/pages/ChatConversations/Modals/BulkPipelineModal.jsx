import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiLayers, FiDollarSign, FiTag } from 'react-icons/fi';
import { BsTrello } from 'react-icons/bs';
import { toast } from 'react-hot-toast';
import { fetchWithAuth } from '../../../AuthContext';
import { API_URL } from '../../../config';

export default function BulkPipelineModal({
    isOpen,
    onClose,
    selectedCount = 0,
    selectAllPages = false,
    selectedConvoIds = [],
    excludedConvoIds = [],
    filterParams = {},
    activeClientId,
    pipelines = [],
    onSuccess
}) {
    const [selectedPipelineId, setSelectedPipelineId] = useState('');
    const [stages, setStages] = useState([]);
    const [selectedStageId, setSelectedStageId] = useState('');
    const [products, setProducts] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [productName, setProductName] = useState('');
    const [customValue, setCustomValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Resetar campos e inicializar pipeline ao abrir o modal
    useEffect(() => {
        if (!isOpen) {
            setSelectedProductId('');
            setProductName('');
            setCustomValue('');
            setIsSubmitting(false);
            return;
        }

        if (pipelines.length > 0 && !selectedPipelineId) {
            setSelectedPipelineId(String(pipelines[0].id));
        }
    }, [isOpen, pipelines]);

    // Buscar estágios quando a pipeline muda
    useEffect(() => {
        if (!selectedPipelineId || !activeClientId) {
            setStages([]);
            setSelectedStageId('');
            return;
        }

        const fetchStages = async () => {
            try {
                const res = await fetchWithAuth(
                    `${API_URL}/crm/stages?pipeline_id=${selectedPipelineId}`,
                    {},
                    activeClientId
                );
                if (res.ok) {
                    const data = await res.json();
                    setStages(Array.isArray(data) ? data : []);
                    if (Array.isArray(data) && data.length > 0) {
                        setSelectedStageId(String(data[0].id));
                    } else {
                        setSelectedStageId('');
                    }
                }
            } catch (err) {
                console.error('Erro ao buscar estágios da pipeline:', err);
            }
        };

        fetchStages();
    }, [selectedPipelineId, activeClientId]);

    // Carregar catálogo de produtos criados no CRM
    useEffect(() => {
        if (!isOpen || !activeClientId) {
            setProducts([]);
            return;
        }

        const fetchProducts = async () => {
            try {
                const res = await fetchWithAuth(
                    `${API_URL}/crm/products`,
                    {},
                    activeClientId
                );
                if (res.ok) {
                    const data = await res.json();
                    setProducts(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error('Erro ao buscar produtos cadastrados:', err);
            }
        };

        fetchProducts();
    }, [isOpen, activeClientId]);

    if (!isOpen) return null;

    // Ao selecionar um produto, vincula o nome e sugere automaticamente o preço oficial
    const handleProductSelect = (e) => {
        const prodIdStr = e.target.value;
        setSelectedProductId(prodIdStr);

        if (!prodIdStr) {
            setProductName('');
            return;
        }

        const found = products.find(p => String(p.id) === prodIdStr);
        if (found) {
            setProductName(found.name || '');
            if (found.price !== undefined && found.price !== null) {
                setCustomValue(Number(found.price).toFixed(2));
            }
        }
    };

    const selectedProductObj = products.find(p => String(p.id) === selectedProductId);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!activeClientId) {
            toast.error('Nenhum cliente ativo selecionado.');
            return;
        }

        if (!selectedPipelineId) {
            toast.error('Selecione uma pipeline de vendas.');
            return;
        }

        setIsSubmitting(true);
        try {
            const numProdId = selectedProductId ? Number(selectedProductId) : undefined;
            const parsedValue = customValue ? parseFloat(String(customValue).replace(',', '.')) : undefined;

            const payload = {
                select_all_pages: selectAllPages,
                ids: selectAllPages ? [] : selectedConvoIds,
                excluded_ids: excludedConvoIds,
                ...filterParams,
                pipeline_id: Number(selectedPipelineId),
                stage_id: selectedStageId ? Number(selectedStageId) : undefined,
                product_id: numProdId,
                product_name: productName.trim() || (selectedProductObj?.name ?? undefined),
                value: parsedValue
            };

            const res = await fetchWithAuth(
                `${API_URL}/crm/deals/bulk-add-contacts`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                },
                activeClientId
            );

            if (res.ok) {
                const data = await res.json();
                toast.success(data.message || 'Contatos adicionados ao Kanban com sucesso!');
                window.dispatchEvent(new CustomEvent('reload-chat-messages'));
                if (onSuccess) onSuccess(data);
                onClose();
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.detail || 'Erro ao adicionar contatos à pipeline.');
            }
        } catch (err) {
            toast.error('Erro de conexão ao adicionar contatos ao Kanban.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            data-testid="bulk-pipeline-modal"
        >
            <div 
                className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Cabeçalho */}
                <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-purple-600/10 text-purple-500 border border-purple-500/20">
                            <BsTrello size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                Adicionar ao Kanban de Vendas
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {selectedCount} {selectedCount === 1 ? 'contato selecionado' : 'contatos selecionados'}
                                {selectAllPages && ' (todas as páginas)'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition cursor-pointer"
                        title="Fechar"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {/* Formulário com seleção de pipelines e produtos já criados */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
                    {/* Pipeline de Vendas */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Selecione a Pipeline de Vendas *
                        </label>
                        <select
                            value={selectedPipelineId}
                            onChange={e => setSelectedPipelineId(e.target.value)}
                            data-testid="bulk-pipeline-select"
                            className="w-full bg-gray-50 dark:bg-[#1e293b] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            required
                        >
                            {pipelines.map(pipe => (
                                <option key={pipe.id} value={String(pipe.id)}>
                                    {pipe.name} {pipe.product_name ? `(${pipe.product_name})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Etapa / Coluna Inicial */}
                    {stages.length > 0 && (
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Etapa / Coluna Inicial
                            </label>
                            <select
                                value={selectedStageId}
                                onChange={e => setSelectedStageId(e.target.value)}
                                data-testid="bulk-stage-select"
                                className="w-full bg-gray-50 dark:bg-[#1e293b] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            >
                                {stages.map(stg => (
                                    <option key={stg.id} value={String(stg.id)}>
                                        {stg.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Seleção de Produtos Já Criados */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Produto de Venda (Opcional)
                        </label>
                        <select
                            value={selectedProductId}
                            onChange={handleProductSelect}
                            data-testid="bulk-product-select"
                            className="w-full bg-gray-50 dark:bg-[#1e293b] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        >
                            <option value="">(Nenhum produto / Padrão da Pipeline)</option>
                            {products.map(prod => (
                                <option key={prod.id} value={String(prod.id)}>
                                    {prod.name} {prod.price ? `- R$ ${Number(prod.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                                </option>
                            ))}
                        </select>

                        {/* Indicador de Preço Oficial do Produto Selecionado */}
                        {selectedProductObj && (
                            <div className="mt-2 flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                                <span className="flex items-center gap-1.5">
                                    <FiTag size={13} />
                                    <span>Valor do Produto Cadastrado:</span>
                                </span>
                                <span className="font-bold font-mono">
                                    R$ {Number(selectedProductObj.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Valor da Oportunidade */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Valor da Oportunidade (R$ - Opcional)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-400 text-xs font-medium">R$</span>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                value={customValue}
                                onChange={e => setCustomValue(e.target.value)}
                                data-testid="bulk-opportunity-value-input"
                                className="w-full bg-gray-50 dark:bg-[#1e293b] border border-gray-200 dark:border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-mono"
                            />
                        </div>
                    </div>

                    {/* Rodapé com 1 botão de fechar e 1 de confirmação */}
                    <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            data-testid="bulk-pipeline-submit-btn"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition shadow-lg shadow-purple-600/25 disabled:opacity-50 cursor-pointer"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    <span>Adicionando...</span>
                                </>
                            ) : (
                                <>
                                    <FiCheck size={14} />
                                    <span>Adicionar ao Kanban</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

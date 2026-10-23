import React, { useState, useEffect, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { FiTrello, FiColumns, FiPackage, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import { useClient } from '../../../contexts/ClientContext';
import { resolveUrl } from '../../../config';
import NodeHeader from '../components/NodeHeader';

export default function KanbanNode({ id, data }) {
    const { activeClient } = useClient();
    const clientId = activeClient?.id;

    const pipelineId = data.pipeline_id || null;
    const stageId = data.stage_id || null;
    const productName = data.product_name || '';
    const dealValue = data.value !== undefined ? data.value : '';
    const lostReason = data.lost_reason || '';

    const [pipelines, setPipelines] = useState([]);
    const [stages, setStages] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            'X-Client-ID': clientId ? String(clientId) : ''
        };
    }, [clientId]);

    const updateNodeData = (updates) => {
        if (data.onChange) {
            data.onChange(id, { ...data, ...updates });
        }
    };

    // 1. Carregar Pipelines e Produtos
    useEffect(() => {
        if (!clientId) return;
        setLoading(true);

        const fetchMeta = async () => {
            try {
                const [pipeRes, prodRes] = await Promise.all([
                    fetch(resolveUrl('/api/crm/pipelines'), { headers: getAuthHeaders() }),
                    fetch(resolveUrl('/api/crm/products'), { headers: getAuthHeaders() })
                ]);

                if (pipeRes.ok) {
                    const pipeData = await pipeRes.json();
                    setPipelines(pipeData);
                    // Se não tiver pipeline selecionado, seleciona o padrão ou o primeiro
                    if (!pipelineId && pipeData.length > 0) {
                        const defaultPipe = pipeData.find(p => p.is_default) || pipeData[0];
                        updateNodeData({ pipeline_id: defaultPipe.id });
                    }
                }

                if (prodRes.ok) {
                    const prodData = await prodRes.json();
                    setProducts(prodData);
                }
            } catch (err) {
                console.error('Erro ao carregar dados do CRM para o KanbanNode:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMeta();
    }, [clientId, getAuthHeaders]);

    // 2. Carregar Estágios quando o pipeline for selecionado
    useEffect(() => {
        if (!clientId || !pipelineId) {
            setStages([]);
            return;
        }

        const fetchStages = async () => {
            try {
                const res = await fetch(resolveUrl(`/api/crm/pipelines/${pipelineId}/board`), {
                    headers: getAuthHeaders()
                });
                if (res.ok) {
                    const boardData = await res.json();
                    const availableStages = boardData.stages || [];
                    setStages(availableStages);

                    // Se não tiver estágio selecionado, ou o estágio selecionado não pertencer a este pipeline
                    const stageExists = availableStages.some(s => s.id === Number(stageId));
                    if ((!stageId || !stageExists) && availableStages.length > 0) {
                        updateNodeData({ stage_id: availableStages[0].id });
                    }
                }
            } catch (err) {
                console.error('Erro ao carregar estágios do pipeline:', err);
            }
        };

        fetchStages();
    }, [clientId, pipelineId, getAuthHeaders]);

    const selectedStage = stages.find(s => s.id === Number(stageId));
    const isLostStage = selectedStage?.stage_type === 'lost' || (selectedStage?.name && selectedStage.name.toLowerCase().includes('desist'));

    const handleProductChange = (e) => {
        const selectedProdName = e.target.value;
        const prod = products.find(p => p.name === selectedProdName);
        if (prod) {
            updateNodeData({
                product_name: prod.name,
                value: dealValue === '' || dealValue === 0 ? prod.price : dealValue
            });
        } else {
            updateNodeData({ product_name: selectedProdName });
        }
    };

    return (
        <div className="px-4 py-3 shadow-lg rounded-2xl bg-white dark:bg-gray-800 border-2 border-blue-500 min-w-[310px] max-w-[360px] transition-all hover:shadow-2xl hover:border-blue-400">
            {/* Porta de Entrada */}
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500" />

            <NodeHeader
                label="Kanban de Vendas"
                icon={FiTrello}
                colorClass="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                onDelete={() => data.onDelete && data.onDelete(id)}
                onDuplicate={() => data.onDuplicate && data.onDuplicate(id)}
                isStart={data.isStart}
            />

            <div className="space-y-2.5 mt-2.5 px-0.5 nodrag nowheel">
                {/* 1. Seleção de Pipeline */}
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <FiTrello size={10} className="text-blue-500" /> Pipeline de Vendas
                    </label>
                    <select
                        value={pipelineId || ''}
                        onChange={(e) => updateNodeData({ pipeline_id: Number(e.target.value) })}
                        disabled={loading || pipelines.length === 0}
                        className="w-full text-xs p-2 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 outline-none focus:border-blue-500 nodrag font-bold"
                    >
                        {pipelines.map(pipe => (
                            <option key={pipe.id} value={pipe.id}>
                                {pipe.name} {pipe.product_name ? `(${pipe.product_name})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 2. Seleção de Coluna / Estágio */}
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <FiColumns size={10} className="text-emerald-500" /> Coluna de Destino
                    </label>
                    <select
                        value={stageId || ''}
                        onChange={(e) => updateNodeData({ stage_id: Number(e.target.value) })}
                        disabled={stages.length === 0}
                        className="w-full text-xs p-2 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 outline-none focus:border-blue-500 nodrag font-bold"
                    >
                        {stages.map(st => (
                            <option key={st.id} value={st.id}>
                                {st.name} {st.stage_type === 'won' ? '🎉 (Ganho)' : st.stage_type === 'lost' ? '❌ (Perdido)' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 3. Seleção de Produto (Opcional) */}
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <FiPackage size={10} className="text-amber-500" /> Produto de Interesse (Opcional)
                    </label>
                    <select
                        value={productName}
                        onChange={handleProductChange}
                        className="w-full text-xs p-2 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 outline-none focus:border-blue-500 nodrag"
                    >
                        <option value="">Nenhum produto selecionado</option>
                        {products.map(p => (
                            <option key={p.id} value={p.name}>
                                {p.name} (R$ {Number(p.price || 0).toFixed(2)})
                            </option>
                        ))}
                    </select>
                </div>

                {/* 4. Valor da Oportunidade (Opcional) */}
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <FiDollarSign size={10} className="text-emerald-500" /> Valor Estimado (R$)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={dealValue}
                        onChange={(e) => updateNodeData({ value: e.target.value })}
                        placeholder="0.00"
                        className="w-full text-xs p-2 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 outline-none focus:border-blue-500 nodrag"
                    />
                </div>

                {/* 5. Motivo de Desistência (Aparece se a coluna for Desistência / Lost) */}
                {isLostStage && (
                    <div className="flex flex-col gap-1 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                        <label className="text-[10px] font-black text-rose-400 uppercase tracking-wider flex items-center gap-1">
                            <FiAlertCircle size={10} /> Motivo da Desistência
                        </label>
                        <input
                            type="text"
                            value={lostReason}
                            onChange={(e) => updateNodeData({ lost_reason: e.target.value })}
                            placeholder="Ex: Não respondeu ao follow-up"
                            className="w-full text-xs p-1.5 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-rose-500/30 outline-none focus:border-rose-500 nodrag"
                        />
                    </div>
                )}
            </div>

            {/* Porta de Saída */}
            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500" />
        </div>
    );
}

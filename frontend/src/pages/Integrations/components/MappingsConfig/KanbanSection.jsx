import React, { useState, useEffect } from 'react';
import { FiTrello, FiAlertCircle } from 'react-icons/fi';
import { API_URL } from '../../../../config';
import { fetchWithAuth } from '../../../../AuthContext';
import { useClient } from '../../../../contexts/ClientContext';

export default function KanbanSection({ mapping, mIndex, updateMapping }) {
  const { activeClient } = useClient();
  const isKanbanActive = Boolean(mapping.kanban_active);

  const [pipelines, setPipelines] = useState([]);
  const [stages, setStages] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Carregar pipelines e catálogo de produtos
  useEffect(() => {
    if (!activeClient?.id || !isKanbanActive) return;

    let isMounted = true;
    setLoading(true);

    const loadMeta = async () => {
      try {
        const [pipeRes, prodRes] = await Promise.all([
          fetchWithAuth(`${API_URL}/crm/pipelines`, {}, activeClient.id),
          fetchWithAuth(`${API_URL}/crm/products`, {}, activeClient.id)
        ]);

        if (pipeRes.ok) {
          const pipeData = await pipeRes.json();
          if (isMounted) {
            setPipelines(pipeData);
            if (!mapping.kanban_pipeline_id && pipeData.length > 0) {
              const defaultPipe = pipeData.find(p => p.is_default) || pipeData[0];
              updateMapping(mIndex, 'kanban_pipeline_id', defaultPipe.id);
            }
          }
        }

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          if (isMounted) {
            setProducts(prodData);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados do CRM para integração:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadMeta();
    return () => { isMounted = false; };
  }, [isKanbanActive, activeClient?.id]);

  // 2. Carregar estágios do pipeline selecionado
  useEffect(() => {
    if (!activeClient?.id || !mapping.kanban_pipeline_id || !isKanbanActive) {
      setStages([]);
      return;
    }

    let isMounted = true;
    const loadStages = async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}/crm/pipelines/${mapping.kanban_pipeline_id}/board`, {}, activeClient.id);
        if (res.ok) {
          const boardData = await res.json();
          const availableStages = boardData.stages || [];
          if (isMounted) {
            setStages(availableStages);
            const stageExists = availableStages.some(s => s.id === Number(mapping.kanban_stage_id));
            if ((!mapping.kanban_stage_id || !stageExists) && availableStages.length > 0) {
              updateMapping(mIndex, 'kanban_stage_id', availableStages[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao carregar estágios do CRM:', err);
      }
    };

    loadStages();
    return () => { isMounted = false; };
  }, [mapping.kanban_pipeline_id, isKanbanActive, activeClient?.id]);

  const handleProductChange = (e) => {
    const selectedProdName = e.target.value;
    updateMapping(mIndex, 'kanban_product_name', selectedProdName);

    if (selectedProdName) {
      const prod = products.find(p => p.name === selectedProdName);
      const productPrice = prod?.price !== undefined ? prod.price : prod?.base_price;
      if (prod && productPrice !== undefined) {
        updateMapping(mIndex, 'kanban_value', Number(productPrice));
      }
    }
  };

  const currentStage = stages.find(s => s.id === Number(mapping.kanban_stage_id));
  const isLostStage = currentStage?.stage_type === 'lost' || 
    (currentStage?.name && (currentStage.name.toLowerCase().includes('desist') || currentStage.name.toLowerCase().includes('perdid')));

  return (
    <div className="pt-6 border-t border-gray-50 dark:border-slate-800">
      <div className="bg-blue-500/5 dark:bg-blue-500/[0.03] border border-blue-500/10 rounded-2xl p-5 space-y-4">
        {/* Cabeçalho do Card */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
              <FiTrello size={16} />
            </div>
            <div>
              <h5 className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight">
                Kanban de Vendas (CRM)
              </h5>
              <p className="text-[9px] text-gray-500">
                Mova o contato para uma coluna específica ou crie um novo lead no Kanban usando o telefone para busca
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isKanbanActive}
              onChange={(e) => updateMapping(mIndex, 'kanban_active', e.target.checked)}
              data-testid="kanban-active-toggle"
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Formulário de Configuração do Kanban */}
        {isKanbanActive && (
          <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 duration-300" data-testid="kanban-config-fields">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pipeline */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">
                  Pipeline de Vendas *
                </label>
                <select
                  value={mapping.kanban_pipeline_id || ''}
                  onChange={(e) => updateMapping(mIndex, 'kanban_pipeline_id', Number(e.target.value))}
                  disabled={loading || pipelines.length === 0}
                  className="w-full bg-white dark:bg-[#0b1120] border border-gray-100 dark:border-white/5 rounded-lg px-3 py-2 text-[11px] font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-1 focus:ring-blue-500/30 shadow-inner"
                  data-testid="kanban-pipeline-select"
                >
                  {pipelines.length === 0 ? (
                    <option value="">Carregando pipelines...</option>
                  ) : (
                    pipelines.map(pipe => (
                      <option key={pipe.id} value={pipe.id}>
                        {pipe.name} {pipe.is_default ? '(Padrão)' : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Coluna / Estágio de Destino */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">
                  Coluna de Destino *
                </label>
                <select
                  value={mapping.kanban_stage_id || ''}
                  onChange={(e) => updateMapping(mIndex, 'kanban_stage_id', Number(e.target.value))}
                  disabled={stages.length === 0}
                  className="w-full bg-white dark:bg-[#0b1120] border border-gray-100 dark:border-white/5 rounded-lg px-3 py-2 text-[11px] font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-1 focus:ring-blue-500/30 shadow-inner"
                  data-testid="kanban-stage-select"
                >
                  {stages.length === 0 ? (
                    <option value="">Nenhuma coluna disponível</option>
                  ) : (
                    stages.map(stage => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name} {stage.stage_type === 'won' ? '🏆 (Ganho)' : stage.stage_type === 'lost' ? '❌ (Perdido)' : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Produto do Catálogo */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">
                  Produto (Catálogo Oficial)
                </label>
                <select
                  value={mapping.kanban_product_name || ''}
                  onChange={handleProductChange}
                  className="w-full bg-white dark:bg-[#0b1120] border border-gray-100 dark:border-white/5 rounded-lg px-3 py-2 text-[11px] font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-1 focus:ring-blue-500/30 shadow-inner"
                  data-testid="kanban-product-select"
                >
                  <option value="">Nenhum produto selecionado</option>
                  {products.map(prod => {
                    const priceVal = Number(prod.price !== undefined ? prod.price : (prod.base_price || 0));
                    return (
                      <option key={prod.id} value={prod.name}>
                        {prod.name} (R$ {priceVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Valor Estimado / Negociado */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">
                  Valor Estimado (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={mapping.kanban_value !== undefined && mapping.kanban_value !== null ? mapping.kanban_value : ''}
                  onChange={(e) => updateMapping(mIndex, 'kanban_value', e.target.value === '' ? 0.0 : parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="w-full bg-white dark:bg-[#0b1120] border border-gray-100 dark:border-white/5 rounded-lg px-3 py-2 text-[11px] font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-1 focus:ring-blue-500/30 shadow-inner"
                  data-testid="kanban-value-input"
                />
              </div>
            </div>

            {/* Motivo da Desistência Condicional */}
            {isLostStage && (
              <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl space-y-1.5 animate-in fade-in duration-200" data-testid="kanban-lost-reason-container">
                <label className="text-[9px] font-black text-red-500 dark:text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FiAlertCircle size={12} /> Motivo da Desistência *
                </label>
                <input
                  type="text"
                  value={mapping.kanban_lost_reason || ''}
                  onChange={(e) => updateMapping(mIndex, 'kanban_lost_reason', e.target.value)}
                  placeholder="Ex: Preço alto, optou por concorrente, sem tempo..."
                  className="w-full bg-white dark:bg-[#0b1120] border border-red-500/30 rounded-lg px-3 py-2 text-[11px] font-medium text-gray-700 dark:text-gray-200 outline-none focus:ring-1 focus:ring-red-500/50"
                  data-testid="kanban-lost-reason-input"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { FiTrello, FiCheckSquare, FiSquare, FiLayers, FiRefreshCw } from 'react-icons/fi';
import { fetchWithAuth } from '../../../AuthContext';
import { API_URL } from '../../../config';
import TemplateVariablesSection from './TemplateVariablesSection';

export default function KanbanSelector({
    activeClient,
    selectedPipelines = [],
    setSelectedPipelines,
    selectedStages = [],
    setSelectedStages,
    onLoadContacts,
    isProcessing,
    actionButtonLabel = "Carregar Contatos do Kanban",
    accentColor = "indigo", // "indigo" para destinatários ou "red" para exclusão
    templateVariables = [],
    kanbanVariables = {},
    setKanbanVariables,
    activeDropdown = null,
    setActiveDropdown
}) {
    const [pipelines, setPipelines] = useState([]);
    const [loadingPipelines, setLoadingPipelines] = useState(false);

    useEffect(() => {
        if (activeClient) {
            loadPipelines();
        }
    }, [activeClient]);

    const loadPipelines = async () => {
        if (!activeClient) return;
        setLoadingPipelines(true);
        try {
            const res = await fetchWithAuth(`${API_URL}/crm/pipelines`, {}, activeClient.id);
            if (res.ok) {
                const data = await res.json();
                setPipelines(data || []);
            }
        } catch (err) {
            console.error("Erro ao carregar pipelines do CRM:", err);
        } finally {
            setLoadingPipelines(false);
        }
    };

    const togglePipeline = (pipeId) => {
        const idNum = Number(pipeId);
        setSelectedPipelines(prev => {
            const isSelected = prev.includes(idNum);
            if (isSelected) {
                // Remove o pipeline e também desmarca todas as etapas vinculadas a ele
                const pipeObj = pipelines.find(p => p.id === idNum);
                const stageIdsToRemove = (pipeObj?.stages || []).map(s => s.id);
                if (setSelectedStages) {
                    setSelectedStages(currentStages => currentStages.filter(stId => !stageIdsToRemove.includes(stId)));
                }
                return prev.filter(id => id !== idNum);
            } else {
                return [...prev, idNum];
            }
        });
    };

    const toggleSelectAllPipelines = () => {
        if (selectedPipelines.length === pipelines.length) {
            setSelectedPipelines([]);
            if (setSelectedStages) setSelectedStages([]);
        } else {
            setSelectedPipelines(pipelines.map(p => p.id));
        }
    };

    const toggleStage = (stageId) => {
        const idNum = Number(stageId);
        setSelectedStages(prev =>
            prev.includes(idNum) ? prev.filter(id => id !== idNum) : [...prev, idNum]
        );
    };

    const selectAllStagesOfPipeline = (pipeObj) => {
        const stageIds = (pipeObj.stages || []).map(s => s.id);
        const allSelected = stageIds.every(id => selectedStages.includes(id));

        if (allSelected) {
            setSelectedStages(prev => prev.filter(id => !stageIds.includes(id)));
        } else {
            setSelectedStages(prev => [...new Set([...prev, ...stageIds])]);
        }
    };

    const isAllPipelinesSelected = pipelines.length > 0 && selectedPipelines.length === pipelines.length;

    const isRedTheme = accentColor === "red";
    const btnClasses = isRedTheme
        ? "from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-900/20"
        : "from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-900/20";

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Cabeçalho de Seleção de Pipelines */}
            <div className="p-6 bg-slate-900/60 border border-white/10 rounded-3xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className={`p-2.5 rounded-xl border ${isRedTheme ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                            <FiTrello size={18} />
                        </span>
                        <div>
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                Selecione os Funis / Pipelines
                                <span className="text-[11px] font-normal text-slate-400">
                                    ({selectedPipelines.length} de {pipelines.length} selecionado{selectedPipelines.length !== 1 ? 's' : ''})
                                </span>
                            </h4>
                            <p className="text-xs text-slate-400">
                                Marque um ou mais pipelines para puxar os contatos dos cards do CRM.
                            </p>
                        </div>
                    </div>

                    {pipelines.length > 0 && (
                        <button
                            type="button"
                            onClick={toggleSelectAllPipelines}
                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                        >
                            {isAllPipelinesSelected ? <FiCheckSquare size={13} className="text-emerald-400" /> : <FiSquare size={13} />}
                            {isAllPipelinesSelected ? "Desmarcar Todos" : "Selecionar Todos os Funis"}
                        </button>
                    )}
                </div>

                {/* Lista de Pipelines */}
                {loadingPipelines ? (
                    <div className="py-8 text-center text-slate-500 text-xs font-medium animate-pulse">
                        Carregando pipelines de vendas...
                    </div>
                ) : pipelines.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-xs">
                        Nenhum pipeline de vendas encontrado para o cliente selecionado.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
                        {pipelines.map(pipe => {
                            const isSelected = selectedPipelines.includes(pipe.id);
                            return (
                                <div
                                    key={pipe.id}
                                    onClick={() => togglePipeline(pipe.id)}
                                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                        isSelected
                                            ? isRedTheme
                                                ? 'bg-rose-500/10 border-rose-500/40 text-white shadow-lg shadow-rose-950/20'
                                                : 'bg-indigo-500/10 border-indigo-500/40 text-white shadow-lg shadow-indigo-950/20'
                                            : 'bg-black/30 border-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                            isSelected
                                                ? isRedTheme ? 'bg-rose-500 border-rose-500 text-white' : 'bg-indigo-600 border-indigo-600 text-white'
                                                : 'border-white/20 bg-white/5'
                                        }`}>
                                            {isSelected && <FiCheckSquare size={13} />}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold leading-tight text-white">{pipe.name}</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                                                <span>{(pipe.stages || []).length} colunas</span>
                                                {pipe.product_name && <span>• {pipe.product_name}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono text-slate-500">
                                        {pipe.deals_count || 0} cards
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Configuração de Colunas / Estágios por Pipeline Selecionado */}
            {selectedPipelines.length > 0 && (
                <div className="p-6 bg-slate-900/60 border border-white/10 rounded-3xl space-y-5 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                        <span className={`p-2.5 rounded-xl border ${isRedTheme ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                            <FiLayers size={18} />
                        </span>
                        <div>
                            <h4 className="text-sm font-bold text-white">
                                Filtrar por Colunas Específicas
                            </h4>
                            <p className="text-xs text-slate-400">
                                Se nenhuma coluna de um funil for marcada, <strong>todas as colunas</strong> daquele funil serão processadas automaticamente.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {pipelines.filter(p => selectedPipelines.includes(p.id)).map(pipe => {
                            const pipeStages = pipe.stages || [];
                            const pipeStageIds = pipeStages.map(s => s.id);
                            const selectedInPipe = pipeStageIds.filter(id => selectedStages.includes(id));
                            const isAllPipeStagesSelected = pipeStages.length > 0 && selectedInPipe.length === pipeStages.length;

                            return (
                                <div key={pipe.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                                            {pipe.name}
                                            <span className="text-[10px] font-normal text-slate-400">
                                                ({selectedInPipe.length === 0 ? "Todas as colunas ativas" : `${selectedInPipe.length} coluna(s) marcada(s)`})
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => selectAllStagesOfPipeline(pipe)}
                                            className="text-[10px] font-semibold text-slate-400 hover:text-indigo-400 underline transition-colors cursor-pointer"
                                        >
                                            {isAllPipeStagesSelected ? "Limpar seleção do funil" : "Marcar todas as colunas"}
                                        </button>
                                    </div>

                                    {pipeStages.length === 0 ? (
                                        <div className="text-[11px] text-slate-500 italic">Nenhuma coluna configurada neste funil.</div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {pipeStages.map(st => {
                                                const isStSelected = selectedStages.includes(st.id);
                                                return (
                                                    <button
                                                        key={st.id}
                                                        type="button"
                                                        onClick={() => toggleStage(st.id)}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer ${
                                                            isStSelected
                                                                ? isRedTheme
                                                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                                                                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-sm'
                                                                : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/15 hover:text-slate-200'
                                                        }`}
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isStSelected ? (isRedTheme ? 'bg-rose-400' : 'bg-indigo-400') : 'bg-slate-500'}`}></span>
                                                        {st.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Template Variables para Kanban */}
            {templateVariables && templateVariables.length > 0 && setKanbanVariables && (
                <TemplateVariablesSection
                    templateVariables={templateVariables}
                    variables={kanbanVariables}
                    setVariables={setKanbanVariables}
                    activeDropdown={activeDropdown}
                    setActiveDropdown={setActiveDropdown}
                    accentColor={accentColor}
                />
            )}

            {/* Botão de Ação */}
            <button
                type="button"
                onClick={onLoadContacts}
                disabled={selectedPipelines.length === 0 || isProcessing}
                className={`w-full py-5 bg-gradient-to-r ${btnClasses} text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer`}
            >
                {isProcessing ? (
                    <>
                        <FiRefreshCw size={16} className="animate-spin" />
                        Buscando Oportunidades do Kanban...
                    </>
                ) : (
                    <>
                        <FiTrello size={16} />
                        {actionButtonLabel}
                    </>
                )}
            </button>
        </div>
    );
}

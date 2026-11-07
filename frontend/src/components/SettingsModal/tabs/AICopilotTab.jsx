import React, { useState, useEffect } from 'react';
import { 
    FiSave, FiDollarSign, FiCheck, FiEye, FiEyeOff,
    FiRefreshCw, FiSliders
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { fetchWithAuth } from '../../../AuthContext';
import { API_URL } from '../../../config';
import { useClient } from '../../../contexts/ClientContext';
import AICopilotFinancialView from './components/AICopilotFinancialView';
import ProductPromptsManager from './components/ProductPromptsManager';
import { useProductPrompts } from './hooks/useProductPrompts';

export default function AICopilotTab() {
    const { activeClient } = useClient();
    const [subTab, setSubTab] = useState('settings'); // 'settings' | 'financial'
    
    // Estados de Modelos & Conexão
    const [models, setModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState('gpt-6.1-sol');
    const [apiKey, setApiKey] = useState('');
    const [hasApiKey, setHasApiKey] = useState(false);
    const [isEnvKey, setIsEnvKey] = useState(false);
    const [maskedApiKey, setMaskedApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [temperature, setTemperature] = useState(0.7);
    const [usdToBrl, setUsdToBrl] = useState(5.70);
    const isReasoningModel = selectedModel.includes('gpt-5') || selectedModel.includes('gpt-6');
    const [defaultPromptBase, setDefaultPromptBase] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Estados Financeiros
    const [financialData, setFinancialData] = useState(null);
    const [isLoadingFinancial, setIsLoadingFinancial] = useState(false);

    // Hook de Gestão de Prompts por Produto
    const {
        promptPresets,
        activePresetId,
        setActivePresetId,
        loadPrompts,
        handleSavePresetLocal,
        handleCreatePreset,
        handleDeletePreset,
        handleSetDefaultPreset,
        handleRestoreDefaultPreset
    } = useProductPrompts({
        activeClientId: activeClient?.id,
        defaultPromptBase,
        onTriggerSaveAll: () => handleSaveSettings()
    });

    // Carregar configurações, modelos e prompts por produto
    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const [resModels, resSettings] = await Promise.all([
                fetchWithAuth(`${API_URL}/ai/models`, {}, activeClient?.id),
                fetchWithAuth(`${API_URL}/ai/settings`, {}, activeClient?.id)
            ]);

            if (resModels.ok) {
                const dataM = await resModels.json();
                setModels(dataM.models || []);
            }

            if (resSettings.ok) {
                const dataS = await resSettings.json();
                setSelectedModel(dataS.model || 'gpt-6.1-sol');
                setHasApiKey(dataS.has_api_key);
                setIsEnvKey(Boolean(dataS.is_env_key));
                setMaskedApiKey(dataS.masked_api_key || '');
                setDefaultPromptBase(dataS.default_prompt || '');
                setTemperature(dataS.temperature ?? 0.7);
                setUsdToBrl(dataS.usd_to_brl ?? 5.70);
            }

            await loadPrompts();
        } catch (err) {
            console.error('Erro ao carregar configurações de IA:', err);
            toast.error('Não foi possível carregar as configurações de IA.');
        } finally {
            setIsLoading(false);
        }
    };

    // Carregar dados financeiros
    const loadFinancial = async () => {
        setIsLoadingFinancial(true);
        try {
            const res = await fetchWithAuth(`${API_URL}/ai/financial?limit=30`, {}, activeClient?.id);
            if (res.ok) {
                const data = await res.json();
                setFinancialData(data);
            }
        } catch (err) {
            console.error('Erro ao carregar financeiro de IA:', err);
        } finally {
            setIsLoadingFinancial(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, [activeClient?.id]);

    useEffect(() => {
        if (subTab === 'financial') {
            loadFinancial();
        }
    }, [subTab, activeClient?.id]);

    // Salvar configurações gerais e prompt ativo
    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            const curPreset = promptPresets.find(p => p.id === activePresetId);
            const payload = {
                model: selectedModel,
                system_prompt: curPreset?.prompt_text || '',
                temperature: Number(temperature),
                usd_to_brl: Number(usdToBrl)
            };

            if (apiKey.trim()) {
                payload.api_key = apiKey.trim();
            }

            const res = await fetchWithAuth(`${API_URL}/ai/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }, activeClient?.id);

            // Sincroniza o preset de produto ativo no banco
            if (curPreset) {
                await fetchWithAuth(`${API_URL}/ai/prompts/${curPreset.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: curPreset.name,
                        prompt_text: curPreset.prompt_text,
                        is_default: curPreset.is_default
                    })
                }, activeClient?.id);
            }

            if (res.ok) {
                const updated = await res.json();
                toast.success('Configurações de IA salvas com sucesso!');
                setApiKey('');
                setHasApiKey(updated.has_api_key);
                setIsEnvKey(Boolean(updated.is_env_key));
                setMaskedApiKey(updated.masked_api_key || '');
            } else {
                const errData = await res.json();
                toast.error(errData.detail || 'Falha ao salvar configurações.');
            }
        } catch (err) {
            console.error('Erro ao salvar configurações de IA:', err);
            toast.error('Erro interno ao salvar configurações.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                <FiRefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                <p className="text-sm">Carregando configurações de inteligência artificial...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Sub-navegação */}
            <div className="flex border-b border-gray-100 dark:border-white/5 gap-4">
                <button type="button" onClick={() => setSubTab('settings')} className={`flex items-center gap-2 pb-3 px-2 text-sm font-semibold transition-all relative ${subTab === 'settings' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                    <FiSliders className="w-4 h-4" /><span>Configurações & Modelo</span>
                </button>
                <button type="button" onClick={() => setSubTab('financial')} className={`flex items-center gap-2 pb-3 px-2 text-sm font-semibold transition-all relative ${subTab === 'financial' ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                    <FiDollarSign className="w-4 h-4" /><span>Consumo & Financeiro</span>
                </button>
            </div>

            {/* ABA 1: CONFIGURAÇÕES */}
            {subTab === 'settings' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Seletor de Modelo com Alto Contraste */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Modelo de Inteligência Artificial (LLM)
                        </label>
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                            className="w-full px-4 py-3 bg-[#0f172a] text-white border border-gray-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-inner"
                        >
                            {[
                                { gen: 'GPT-6', label: '🌟 Geração GPT-6 (Fronteira & Raciocínio Profundo)', color: '#93c5fd', filter: m => m.generation === 'GPT-6' },
                                { gen: 'GPT-5', label: '🧠 Geração GPT-5 & GPT-5.6', color: '#f472b6', filter: m => m.generation.includes('GPT-5') },
                                { gen: 'GPT-4', label: '⚡ Geração GPT-4 & Modelos Ágeis', color: '#fbbf24', filter: m => !m.generation.includes('GPT-6') && !m.generation.includes('GPT-5') }
                            ].map(group => (
                                <optgroup key={group.gen} label={group.label} style={{ backgroundColor: '#1e293b', color: group.color, fontWeight: 'bold' }}>
                                    {models.filter(group.filter).map(m => (
                                        <option key={m.id} value={m.id} style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                                            {m.name} — {m.badge} (${m.input_per_million}/1M in, ${m.output_per_million}/1M out)
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        {(() => {
                            const cur = models.find(m => m.id === selectedModel);
                            if (!cur) return null;
                            return (
                                <div className="p-3 bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between">
                                    <span>{cur.description}</span>
                                    <span className="font-mono font-bold bg-blue-500/20 px-2 py-0.5 rounded text-[10px]">
                                        Janela: {cur.context_window}
                                    </span>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Chave de API OpenAI */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Chave de API OpenAI (sk-...)
                            </label>
                            {hasApiKey && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                    <FiCheck size={12} />
                                    {isEnvKey ? 'Chave Ativa via .env do Servidor' : `Chave Configurada (${maskedApiKey})`}
                                </span>
                            )}
                        </div>
                        <div className="relative">
                            <input
                                type={showApiKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder={hasApiKey ? (isEnvKey ? 'Chave do .env ativa (digite para sobrescrever)...' : 'Digite para alterar a chave atual...') : 'sk-proj-...'}
                                className="w-full px-4 py-2.5 pr-10 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-mono text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                {showApiKey ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                        {isEnvKey && (
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                ✨ A chave configurada no arquivo <code className="font-mono bg-emerald-500/10 px-1 py-0.5 rounded">.env</code> do servidor já está ativa por padrão.
                            </p>
                        )}
                    </div>

                    {/* Gerenciador de Prompts por Produto com Maximizar */}
                    <ProductPromptsManager
                        presets={promptPresets}
                        activePresetId={activePresetId}
                        setActivePresetId={setActivePresetId}
                        onSavePreset={handleSavePresetLocal}
                        onCreatePreset={handleCreatePreset}
                        onDeletePreset={handleDeletePreset}
                        onSetDefaultPreset={handleSetDefaultPreset}
                        onRestoreDefault={handleRestoreDefaultPreset}
                        defaultPromptBase={defaultPromptBase}
                        isSaving={isSaving}
                    />

                    {/* Parâmetros Adicionais (Temperatura e Dólar) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Temperatura / Criatividade: {isReasoningModel ? '1.0 (Fixado pelo Modelo)' : temperature}
                                </label>
                                {isReasoningModel && (
                                    <span className="text-[10px] text-amber-500 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded">
                                        Padrão OpenAI
                                    </span>
                                )}
                            </div>
                            <input
                                type="range"
                                min="0.0"
                                max="1.2"
                                step="0.1"
                                disabled={isReasoningModel}
                                value={isReasoningModel ? 1.0 : temperature}
                                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                className={`w-full accent-blue-500 ${isReasoningModel ? 'opacity-40 cursor-not-allowed' : ''}`}
                            />
                            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                {isReasoningModel ? (
                                    <span className="text-amber-400/90">* Os modelos GPT-5 e GPT-6 utilizam temperatura fixa 1.0 exigida pela OpenAI para manter o raciocínio estável.</span>
                                ) : (
                                    <>
                                        <span>0.0 (Mais Preciso/Objetivo)</span>
                                        <span>1.2 (Mais Criativo)</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                                Taxa de Conversão Dólar (R$ / USD)
                            </label>
                            <input
                                type="number"
                                step="0.05"
                                value={usdToBrl}
                                onChange={(e) => setUsdToBrl(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-mono text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Botão de Salvar Geral */}
                    <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex justify-end">
                        <button
                            type="button"
                            disabled={isSaving}
                            onClick={handleSaveSettings}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Salvando...</span>
                                </>
                            ) : (
                                <>
                                    <FiSave className="w-4 h-4" />
                                    <span>Salvar Configurações de IA</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* ABA 2: FINANCEIRO & CONSUMO */}
            {subTab === 'financial' && (
                <AICopilotFinancialView
                    financialData={financialData}
                    isLoadingFinancial={isLoadingFinancial}
                    onRefresh={loadFinancial}
                />
            )}
        </div>
    );
}

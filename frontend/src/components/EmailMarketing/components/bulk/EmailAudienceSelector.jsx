import React, { useState, useEffect } from 'react';
import { FiUsers, FiTrello, FiFileText, FiTag } from 'react-icons/fi';
import { API_URL } from '../../../../config';
import SearchableTagSelect from './SearchableTagSelect';

export default function EmailAudienceSelector({
  audienceType,
  setAudienceType,
  availableTags,
  selectedTag,
  onSelectTag,
  selectedPipeline,
  setSelectedPipeline,
  selectedStage,
  setSelectedStage,
  manualText,
  setManualText,
  onManualChange,
  activeClient,
  getHeaders
}) {
  const [pipelines, setPipelines] = useState([]);
  const [stages, setStages] = useState([]);
  const [loadingPipelines, setLoadingPipelines] = useState(false);

  useEffect(() => {
    if (audienceType === 'kanban' && activeClient) {
      fetchPipelines();
    }
  }, [audienceType, activeClient]);

  useEffect(() => {
    if (selectedPipeline) {
      fetchStages(selectedPipeline);
    } else {
      setStages([]);
      setSelectedStage('');
    }
  }, [selectedPipeline]);

  const fetchPipelines = async () => {
    try {
      setLoadingPipelines(true);
      const res = await fetch(`${API_URL}/crm/pipelines`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPipelines(data || []);
        if (data && data.length > 0 && !selectedPipeline) {
          setSelectedPipeline(String(data[0].id));
        }
      }
    } catch (err) {
      console.error("Erro ao carregar pipelines:", err);
    } finally {
      setLoadingPipelines(false);
    }
  };

  const fetchStages = async (pipelineId) => {
    try {
      const res = await fetch(`${API_URL}/crm/pipelines/${pipelineId}/board`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setStages(data.stages || []);
      }
    } catch (err) {
      console.error("Erro ao carregar etapas do funil:", err);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setManualText(content);
        if (onManualChange) onManualChange(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      {/* Botões de Seleção do Tipo de Audiência */}
      <div>
        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
          Origem dos Destinatários (Audiência)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setAudienceType('tags')}
            className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              audienceType === 'tags'
                ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/30'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            <FiTag className="text-sm" /> Contatos & Etiquetas
          </button>

          <button
            type="button"
            onClick={() => setAudienceType('kanban')}
            className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              audienceType === 'kanban'
                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/30'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            <FiTrello className="text-sm" /> Kanban de Vendas
          </button>

          <button
            type="button"
            onClick={() => setAudienceType('manual')}
            className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              audienceType === 'manual'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/30'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            <FiFileText className="text-sm" /> Importar CSV / Lista
          </button>
        </div>
      </div>

      {/* Conteúdo Dinâmico por Tipo */}
      {audienceType === 'tags' && (
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <FiTag className="text-blue-500" /> Etiqueta da Aba de Contatos (Opcional)
          </label>
          <SearchableTagSelect
            tags={availableTags}
            selectedTag={selectedTag}
            onSelect={onSelectTag}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Filtra contatos salvos que possuam e-mail válido e a etiqueta selecionada (ou todos se vazio).
          </p>
        </div>
      )}

      {audienceType === 'kanban' && (
        <div className="space-y-3 p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200/50 dark:border-indigo-800/40">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Selecione o Funil / Pipeline *
              </label>
              <select
                value={selectedPipeline}
                onChange={e => setSelectedPipeline(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-white"
              >
                {loadingPipelines ? (
                  <option value="">Carregando funis...</option>
                ) : pipelines.length === 0 ? (
                  <option value="">Nenhum funil encontrado</option>
                ) : (
                  pipelines.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Etapa do Funil (Opcional)
              </label>
              <select
                value={selectedStage}
                onChange={e => setSelectedStage(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-white"
              >
                <option value="">Todas as etapas do funil</option>
                {stages.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400">
            Serão selecionados os cards do Kanban que possuem o campo de e-mail preenchido.
          </p>
        </div>
      )}

      {audienceType === 'manual' && (
        <div className="space-y-3 p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/50 dark:border-emerald-800/40">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Cole os contatos ou faça upload de um CSV (um por linha: <code>nome, email</code> ou apenas <code>email</code>)
            </label>
            <label className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg cursor-pointer transition-colors">
              Subir CSV / TXT
              <input
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
          <textarea
            rows={4}
            placeholder="Exemplo:&#10;Carlos Silva, carlos@email.com&#10;maria@empresa.com.br&#10;João Pereira, joao@gmail.com"
            value={manualText}
            onChange={e => {
              setManualText(e.target.value);
              if (onManualChange) onManualChange(e.target.value);
            }}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-mono text-gray-800 dark:text-white"
          />
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Formato aceito: linha por linha. Pode conter o nome antes do e-mail separado por vírgula.
          </p>
        </div>
      )}
    </div>
  );
}

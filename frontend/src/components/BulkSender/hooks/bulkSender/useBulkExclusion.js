import { useState } from 'react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { fetchWithAuth } from '../../../../AuthContext';
import { API_URL } from '../../../../config';

export function useBulkExclusion({ activeClient, setIsWorking, setWorkingMessage }) {
    const [exclusionList, setExclusionList] = useState([]);
    const [exclusionMode, setExclusionMode] = useState("manual");
    const [exclusionText, setExclusionText] = useState("");
    const [exclusionAvailableTags, setExclusionAvailableTags] = useState([]);
    const [isLoadingExclusionTags, setIsLoadingExclusionTags] = useState(false);
    const [selectedExclusionTag, setSelectedExclusionTag] = useState([]);
    const [configuredExclusionTags, setConfiguredExclusionTags] = useState([]);
    const [exclusionTagMode, setExclusionTagMode] = useState("OR");
    const [exclusionCsvData, setExclusionCsvData] = useState(null);
    const [exclusionColSelector, setExclusionColSelector] = useState(false);
    const [exclusionSelectedCol, setExclusionSelectedCol] = useState(null);
    const [selectedExclusionPipelines, setSelectedExclusionPipelines] = useState([]);
    const [selectedExclusionStages, setSelectedExclusionStages] = useState([]);

    const loadExclusionTags = async () => {
        if (!activeClient) return;
        setIsLoadingExclusionTags(true);
        try {
            const res = await fetchWithAuth(`${API_URL}/leads/filters`, {}, activeClient.id);
            if (res.ok) {
                const data = await res.json();
                setExclusionAvailableTags(data.tags || []);
            } else {
                setExclusionAvailableTags([]);
            }
        } catch (err) {
            console.error("Erro tags exclusão:", err);
            setExclusionAvailableTags([]);
        } finally {
            setIsLoadingExclusionTags(false);
        }
    };

    const handleSaveExclusion = () => {
        const nums = exclusionText.split('\n').map(n => n.trim().replace(/\D/g, '')).filter(n => n.length >= 8);
        setExclusionList(prev => [...new Set([...prev, ...nums])]);
        setExclusionText("");
        toast.success(`${nums.length} números adicionados à exclusão.`);
    };

    const clearExclusionList = () => {
        setExclusionList([]);
        setConfiguredExclusionTags([]);
        setSelectedExclusionTag([]);
        setSelectedExclusionPipelines([]);
        setSelectedExclusionStages([]);
        toast.success("Lista de exclusão limpa!");
    };

    const handleExclusionFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            if (data.length > 0) {
                setExclusionCsvData({ headers: data[0], rows: data.slice(1) });
                setExclusionColSelector(true);
            }
        };
        reader.readAsBinaryString(file);
    };

    const confirmExclusionColumn = () => {
        if (exclusionSelectedCol === null || !exclusionCsvData) return;
        const nums = exclusionCsvData.rows.map(r => String(r[exclusionSelectedCol] || '').replace(/\D/g, '')).filter(n => n.length >= 8);
        setExclusionList(prev => [...new Set([...prev, ...nums])]);
        setExclusionColSelector(false);
        setExclusionCsvData(null);
        toast.success(`${nums.length} números importados para exclusão.`);
    };

    const loadExclusionContactsByTag = async () => {
        const tags = Array.isArray(selectedExclusionTag) ? selectedExclusionTag : (selectedExclusionTag ? [selectedExclusionTag] : []);
        if (tags.length === 0) return;
        setIsWorking(true);
        setWorkingMessage(`Buscando contatos com as etiquetas: ${tags.join(', ')}...`);
        try {
            const tagParams = tags.map(t => `tag=${encodeURIComponent(t)}`).join('&');
            const res = await fetchWithAuth(`${API_URL}/leads?${tagParams}&tag_mode=${exclusionTagMode}&limit=10000`, {}, activeClient.id);
            if (res && res.ok) {
                const data = await res.json();
                const nums = (data.items || []).map(l => String(l.phone || '').replace(/\D/g, '')).filter(n => n.length >= 8);
                if (nums.length > 0) {
                    setExclusionList(prev => [...new Set([...prev, ...nums])]);
                    setConfiguredExclusionTags(prev => [...new Set([...prev, ...tags])]);
                    toast.success(`${[...new Set(nums)].length} contatos únicos adicionados à exclusão.`);
                    setSelectedExclusionTag([]); // Limpa a seleção após adicionar
                } else {
                    toast.success("Nenhum contato encontrado com as etiquetas selecionadas.");
                }
            } else {
                toast.error("Erro ao buscar contatos por etiqueta.");
            }
        } catch (err) {
            toast.error("Erro ao buscar contatos por etiqueta.");
        } finally {
            setIsWorking(false);
        }
    };

    const loadExclusionContactsByKanban = async () => {
        if (!selectedExclusionPipelines || selectedExclusionPipelines.length === 0) {
            return toast.error("Selecione pelo menos um funil do Kanban para exclusão");
        }
        if (!activeClient) return;

        setIsWorking(true);
        setWorkingMessage("Buscando contatos dos funis selecionados para exclusão...");

        try {
            const res = await fetchWithAuth(`${API_URL}/crm/deals/contacts-query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pipeline_ids: selectedExclusionPipelines,
                    stage_ids: selectedExclusionStages.length > 0 ? selectedExclusionStages : null
                })
            }, activeClient.id);

            if (res && res.ok) {
                const data = await res.json();
                const nums = (data.items || []).map(d => String(d.phone || '').replace(/\D/g, '')).filter(n => n.length >= 8);
                if (nums.length > 0) {
                    setExclusionList(prev => [...new Set([...prev, ...nums])]);
                    toast.success(`${[...new Set(nums)].length} contatos únicos do Kanban adicionados à exclusão.`);
                } else {
                    toast.success("Nenhum contato encontrado nas colunas selecionadas do Kanban.");
                }
            } else {
                toast.error("Erro ao buscar contatos do Kanban para exclusão.");
            }
        } catch (err) {
            console.error("Erro ao buscar contatos do Kanban:", err);
            toast.error("Erro ao buscar contatos do Kanban para exclusão.");
        } finally {
            setIsWorking(false);
        }
    };

    const resetExclusion = () => {
        setExclusionList([]);
        setConfiguredExclusionTags([]);
        setSelectedExclusionTag([]);
        setSelectedExclusionPipelines([]);
        setSelectedExclusionStages([]);
        setExclusionText("");
    };

    return {
        exclusionList, setExclusionList,
        exclusionMode, setExclusionMode,
        exclusionText, setExclusionText,
        exclusionAvailableTags, setExclusionAvailableTags,
        isLoadingExclusionTags,
        selectedExclusionTag, setSelectedExclusionTag,
        configuredExclusionTags, setConfiguredExclusionTags,
        exclusionTagMode, setExclusionTagMode,
        exclusionCsvData, setExclusionCsvData,
        exclusionColSelector, setExclusionColSelector,
        exclusionSelectedCol, setExclusionSelectedCol,
        loadExclusionTags,
        handleSaveExclusion,
        clearExclusionList,
        handleExclusionFileUpload,
        confirmExclusionColumn,
        loadExclusionContactsByTag,
        selectedExclusionPipelines, setSelectedExclusionPipelines,
        selectedExclusionStages, setSelectedExclusionStages,
        loadExclusionContactsByKanban,
        resetExclusion
    };
}

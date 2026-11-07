import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { fetchWithAuth } from '../../../../AuthContext';
import { API_URL } from '../../../../config';

export function useProductPrompts({ activeClientId, defaultPromptBase, onTriggerSaveAll }) {
    const [promptPresets, setPromptPresets] = useState([]);
    const [activePresetId, setActivePresetId] = useState(null);

    const loadPrompts = async () => {
        try {
            const res = await fetchWithAuth(`${API_URL}/ai/prompts`, {}, activeClientId);
            if (res.ok) {
                const data = await res.json();
                const list = data.prompts || [];
                setPromptPresets(list);
                if (list.length > 0) {
                    const def = list.find(p => p.is_default) || list[0];
                    setActivePresetId(def.id);
                }
            }
        } catch (err) {
            console.error('Erro ao carregar prompts:', err);
        }
    };

    const handleSavePresetLocal = (presetId, updates, persistImmediate = false) => {
        setPromptPresets(prev => prev.map(p => p.id === presetId ? { ...p, ...updates } : p));
        if (persistImmediate && onTriggerSaveAll) {
            onTriggerSaveAll();
        }
    };

    const handleCreatePreset = async (data) => {
        try {
            const res = await fetchWithAuth(`${API_URL}/ai/prompts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }, activeClientId);

            if (res.ok) {
                const json = await res.json();
                const created = json.preset;
                setPromptPresets(prev => [...prev, created]);
                setActivePresetId(created.id);
                toast.success(`Prompt para "${created.name}" cadastrado!`);
            } else {
                const err = await res.json();
                toast.error(err.detail || 'Falha ao criar prompt de produto.');
            }
        } catch (e) {
            toast.error('Erro ao conectar ao servidor.');
        }
    };

    const handleDeletePreset = async (presetId) => {
        try {
            const res = await fetchWithAuth(`${API_URL}/ai/prompts/${presetId}`, {
                method: 'DELETE'
            }, activeClientId);

            if (res.ok) {
                const remaining = promptPresets.filter(p => p.id !== presetId);
                setPromptPresets(remaining);
                if (activePresetId === presetId && remaining.length > 0) {
                    setActivePresetId(remaining[0].id);
                }
                toast.success('Prompt de produto excluído.');
            } else {
                const err = await res.json();
                toast.error(err.detail || 'Não foi possível excluir o prompt.');
            }
        } catch (e) {
            toast.error('Erro ao excluir prompt.');
        }
    };

    const handleSetDefaultPreset = async (presetId) => {
        try {
            const res = await fetchWithAuth(`${API_URL}/ai/prompts/${presetId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_default: true })
            }, activeClientId);

            if (res.ok) {
                setPromptPresets(prev => prev.map(p => ({
                    ...p,
                    is_default: p.id === presetId
                })));
                toast.success('Prompt padrão de vendas atualizado!');
            }
        } catch (e) {
            toast.error('Erro ao definir prompt padrão.');
        }
    };

    const handleRestoreDefaultPreset = (presetId) => {
        if (defaultPromptBase) {
            setPromptPresets(prev => prev.map(p => p.id === presetId ? { ...p, prompt_text: defaultPromptBase } : p));
            toast.success('Prompt padrão de fábrica restaurado!');
        }
    };

    return {
        promptPresets,
        setPromptPresets,
        activePresetId,
        setActivePresetId,
        loadPrompts,
        handleSavePresetLocal,
        handleCreatePreset,
        handleDeletePreset,
        handleSetDefaultPreset,
        handleRestoreDefaultPreset
    };
}

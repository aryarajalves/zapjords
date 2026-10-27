import { useState } from 'react';
import { fetchWithAuth } from '../../../../AuthContext';
import { API_URL } from '../../../../config';

export function useBulkDataLoaders({ activeClient }) {
    const [templates, setTemplates] = useState([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
    const [chatwootLabels, setChatwootLabels] = useState([]);
    const [isLoadingChatwootLabels, setIsLoadingChatwootLabels] = useState(false);
    const [funnels, setFunnels] = useState([]);
    const [isLoadingFunnels, setIsLoadingFunnels] = useState(false);
    const [whatsappProfile, setWhatsappProfile] = useState(null);

    const loadTemplates = async () => {
        if (!activeClient) return;
        setIsLoadingTemplates(true);
        try {
            const res = await fetchWithAuth(`${API_URL}/whatsapp/templates?include_paused=false`, {}, activeClient.id);
            if (res && res.ok) {
                const data = await res.json();
                setTemplates(data || []);
            } else {
                setTemplates([]);
            }
        } catch (error) {
            console.error("Erro ao carregar templates:", error);
            setTemplates([]);
        } finally {
            setIsLoadingTemplates(false);
        }
    };

    const loadChatwootLabels = async () => {
        if (!activeClient) {
            setChatwootLabels([]);
            return;
        }
        setIsLoadingChatwootLabels(true);
        try {
            // 1. Carregar etiquetas da base de leads / contatos (CRM)
            let leadsTags = [];
            try {
                const resLeads = await fetchWithAuth(`${API_URL}/leads/filters`, {}, activeClient.id);
                if (resLeads && resLeads.ok) {
                    const data = await resLeads.json();
                    leadsTags = Array.isArray(data?.tags) ? data.tags : [];
                }
            } catch (errLeads) {
                console.error("Erro ao carregar tags de leads:", errLeads);
            }

            // 2. Carregar etiquetas de chat existentes
            let chatLabels = [];
            try {
                const resChat = await fetchWithAuth(`${API_URL}/chat/labels`, {}, activeClient.id);
                if (resChat && resChat.ok) {
                    const dataChat = await resChat.json();
                    chatLabels = Array.isArray(dataChat) ? dataChat : [];
                }
            } catch (errChat) {
                console.error("Erro ao carregar etiquetas de chat:", errChat);
            }

            // Unifica e deduplica de forma canônica
            const uniqueMap = new Map();
            [...leadsTags, ...chatLabels].forEach(tag => {
                const name = typeof tag === 'object' ? (tag.title || tag.name || tag.value || tag.label) : tag;
                if (name && typeof name === 'string' && name.trim()) {
                    const clean = name.trim();
                    const key = clean.toLowerCase();
                    if (!uniqueMap.has(key)) {
                        uniqueMap.set(key, clean);
                    }
                }
            });

            const combinedList = Array.from(uniqueMap.values())
                .sort((a, b) => a.localeCompare(b))
                .map(title => ({
                    id: title,
                    title: title,
                    name: title,
                    value: title,
                    label: title
                }));

            setChatwootLabels(combinedList);
        } catch (error) {
            console.error("Erro ao carregar etiquetas:", error);
            setChatwootLabels([]);
        } finally {
            setIsLoadingChatwootLabels(false);
        }
    };

    const loadFunnels = async () => {
        if (!activeClient) return;
        setIsLoadingFunnels(true);
        try {
            const res = await fetchWithAuth(`${API_URL}/funnels`, {}, activeClient.id);
            if (res && res.ok) {
                const data = await res.json();
                setFunnels(data || []);
            } else {
                setFunnels([]);
            }
        } catch (error) {
            console.error("Erro ao carregar funis:", error);
            setFunnels([]);
        } finally {
            setIsLoadingFunnels(false);
        }
    };

    const loadWhatsAppProfile = async () => {
        if (!activeClient) return;
        try {
            const res = await fetchWithAuth(`${API_URL}/whatsapp/profile`, {}, activeClient.id);
            if (res && res.ok) {
                const data = await res.json();
                setWhatsappProfile(data || null);
            }
        } catch (error) {
            console.error("Erro ao carregar perfil do WhatsApp:", error);
        }
    };

    return {
        templates, setTemplates, isLoadingTemplates,
        chatwootLabels, setChatwootLabels, isLoadingChatwootLabels,
        funnels, setFunnels, isLoadingFunnels,
        whatsappProfile, setWhatsappProfile,
        loadTemplates,
        loadChatwootLabels,
        loadFunnels,
        loadWhatsAppProfile
    };
}

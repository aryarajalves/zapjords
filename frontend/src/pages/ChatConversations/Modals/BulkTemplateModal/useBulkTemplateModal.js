import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { fetchWithAuth } from '../../../../AuthContext';
import { API_URL } from '../../../../config';

export function useBulkTemplateModal({
    isOpen,
    activeClientId,
    selectedConvoIds = [],
    selectAllPages = false,
    excludedConvoIds = [],
    filterParams = {}
}) {
    const [activeTab, setActiveTab] = useState('template');
    const [templates, setTemplates] = useState([]);
    const [funnels, setFunnels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Destinatários
    const [recipients, setRecipients] = useState([]);
    const [loadingRecipients, setLoadingRecipients] = useState(false);

    // Template selecionado
    const [selectedTemplateName, setSelectedTemplateName] = useState('');
    const [templateParams, setTemplateParams] = useState({});
    const [buttonActions, setButtonActions] = useState({});

    // Configuração de envio
    const [delaySeconds, setDelaySeconds] = useState(5);
    const [concurrency, setConcurrency] = useState(1);

    // Agendamento e Recorrência
    const [dispatchMode, setDispatchMode] = useState('immediate');
    const [scheduledDateTime, setScheduledDateTime] = useState('');
    const [recurrenceFrequency, setRecurrenceFrequency] = useState('weekly');
    const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState([0]);
    const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState('1');
    const [recurrenceTime, setRecurrenceTime] = useState('09:00');

    // Follow-up
    const [isFollowupEnabled, setIsFollowupEnabled] = useState(false);
    const [followups, setFollowups] = useState([]);
    const [stopTags, setStopTags] = useState([]);

    // Controla dropdown do seletor
    const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);

    useEffect(() => {
        if (isOpen && activeClientId) {
            setActiveTab('template');
            loadInitialData();
            loadRecipients();
        } else {
            setSelectedTemplateName('');
            setTemplateParams({});
            setButtonActions({});
            setIsTemplateSelectorOpen(false);
            setIsFollowupEnabled(false);
            setFollowups([]);
            setStopTags([]);
            setDelaySeconds(5);
            setConcurrency(1);
            setDispatchMode('immediate');
            setScheduledDateTime('');
            setRecurrenceFrequency('weekly');
            setRecurrenceDaysOfWeek([0]);
            setRecurrenceDayOfMonth('1');
            setRecurrenceTime('09:00');
            setRecipients([]);
        }
    }, [isOpen, activeClientId]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [tplRes, funRes] = await Promise.all([
                fetchWithAuth(`${API_URL}/whatsapp/templates?include_paused=false`, {}, activeClientId),
                fetchWithAuth(`${API_URL}/funnels`, {}, activeClientId)
            ]);

            if (tplRes.ok) {
                const tplData = await tplRes.json();
                const approvedOnly = (Array.isArray(tplData) ? tplData : []).filter(
                    t => !t.status || String(t.status).toUpperCase() === 'APPROVED'
                );
                setTemplates(approvedOnly);
            }

            if (funRes.ok) {
                const funData = await funRes.json();
                setFunnels(
                    (funData || [])
                        .filter(f => f.is_active !== false && !f.is_archived)
                        .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
                );
            }
        } catch (err) {
            console.error('Erro ao carregar dados do modal de template:', err);
            toast.error('Erro ao carregar templates ou funis.');
        } finally {
            setLoading(false);
        }
    };

    const loadRecipients = async () => {
        setLoadingRecipients(true);
        try {
            const payload = {
                select_all_pages: selectAllPages,
                ids: !selectAllPages ? selectedConvoIds : undefined,
                excluded_ids: selectAllPages && excludedConvoIds.length > 0 ? excludedConvoIds : undefined,
                ...filterParams
            };
            const res = await fetchWithAuth(
                `${API_URL}/chat/conversations/bulk-template/recipients`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                },
                activeClientId
            );
            if (res.ok) {
                const data = await res.json();
                setRecipients(data.recipients || []);
            }
        } catch (err) {
            console.error('Erro ao buscar lista de destinatários:', err);
        } finally {
            setLoadingRecipients(false);
        }
    };

    const selectedTemplateObj = useMemo(() => {
        return templates.find(t => t.name === selectedTemplateName) || null;
    }, [templates, selectedTemplateName]);

    const templateButtons = useMemo(() => {
        if (!selectedTemplateObj?.components) return [];
        const btnComp = selectedTemplateObj.components.find(c => c.type === 'BUTTONS');
        if (!btnComp?.buttons) return [];
        return btnComp.buttons
            .filter(b => b.type === 'QUICK_REPLY')
            .map(b => b.text);
    }, [selectedTemplateObj]);

    const previewText = useMemo(() => {
        if (!selectedTemplateObj) return '';
        const bodyComp = selectedTemplateObj.components?.find(c => c.type === 'BODY');
        if (!bodyComp?.text) return '';
        let text = bodyComp.text;
        const matches = [...text.matchAll(/\{\{(\d+)\}\}/g)];
        matches.forEach(m => {
            const num = parseInt(m[1]);
            const val = templateParams[`BODY_${num - 1}`];
            if (val !== undefined && val !== '') {
                text = text.replace(m[0], val);
            }
        });
        return text;
    }, [selectedTemplateObj, templateParams]);

    return {
        activeTab,
        setActiveTab,
        templates,
        funnels,
        loading,
        isSubmitting,
        setIsSubmitting,
        recipients,
        loadingRecipients,
        loadRecipients,
        selectedTemplateName,
        setSelectedTemplateName,
        templateParams,
        setTemplateParams,
        buttonActions,
        setButtonActions,
        delaySeconds,
        setDelaySeconds,
        concurrency,
        setConcurrency,
        dispatchMode,
        setDispatchMode,
        scheduledDateTime,
        setScheduledDateTime,
        recurrenceFrequency,
        setRecurrenceFrequency,
        recurrenceDaysOfWeek,
        setRecurrenceDaysOfWeek,
        recurrenceDayOfMonth,
        setRecurrenceDayOfMonth,
        recurrenceTime,
        setRecurrenceTime,
        isFollowupEnabled,
        setIsFollowupEnabled,
        followups,
        setFollowups,
        stopTags,
        setStopTags,
        isTemplateSelectorOpen,
        setIsTemplateSelectorOpen,
        selectedTemplateObj,
        templateButtons,
        previewText
    };
}

import React, { useState, useEffect, useMemo } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { fetchWithAuth } from '../../../../AuthContext';
import { API_URL } from '../../../../config';
import { buildComponentsPayload } from '../../../../components/BulkSender/utils/payloadBuilder';

import BulkTemplateHeader from './BulkTemplateHeader';
import BulkTemplateTabs from './BulkTemplateTabs';
import BulkTemplateTabMessage from './BulkTemplateTabMessage';
import BulkTemplateTabSettings from './BulkTemplateTabSettings';
import BulkTemplateTabRecipients from './BulkTemplateTabRecipients';
import BulkTemplateFooter from './BulkTemplateFooter';

export default function BulkTemplateModal({
    isOpen,
    onClose,
    source = 'chat',
    dealIds = [],
    selectedCount = 0,
    selectAllPages = false,
    selectedConvoIds = [],
    excludedConvoIds = [],
    filterParams = {},
    activeClientId,
    onSuccess,
    chatwootLabels = []
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
    const [dispatchMode, setDispatchMode] = useState('immediate'); // 'immediate' | 'scheduled' | 'recurring'
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

    const resetModalState = () => {
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
    };

    useEffect(() => {
        if (isOpen && activeClientId) {
            setActiveTab('template');
            loadInitialData();
            loadRecipients();
        } else {
            resetModalState();
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
                source,
                deal_ids: dealIds,
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

    if (!isOpen) return null;

    const handleSend = async () => {
        if (!selectedTemplateObj) {
            return toast.error('Por favor, selecione um template.');
        }

        let formattedFollowups = [];
        if (isFollowupEnabled && followups.length > 0) {
            for (let i = 0; i < followups.length; i++) {
                const fu = followups[i];
                if (!fu.template_name) {
                    return toast.error(`Selecione o template para a etapa #${i + 1} de follow-up.`);
                }
                const fuTpl = templates.find(t => t.name === fu.template_name);
                formattedFollowups.push({
                    template_name: fu.template_name,
                    language: fu.language || fuTpl?.language || 'pt_BR',
                    schedule_type: fu.schedule_type || 'relative',
                    relative_delay_hours: fu.schedule_type === 'fixed' ? null : (parseInt(fu.relative_delay_hours) || 24),
                    scheduled_time: fu.schedule_type === 'fixed' && fu.scheduled_time ? new Date(fu.scheduled_time).toISOString() : null,
                    button_actions: fu.button_actions && Object.keys(fu.button_actions).length > 0 ? fu.button_actions : null,
                    stop_tags: stopTags || [],
                    components: fuTpl ? buildComponentsPayload(fuTpl, {}) : []
                });
            }
        }

        if (dispatchMode === 'scheduled' && !scheduledDateTime) {
            return toast.error('Selecione a data e o horário para o agendamento.');
        }

        const isRecurring = dispatchMode === 'recurring';
        const loadingMessage = isRecurring
            ? 'Configurando disparo recorrente...'
            : dispatchMode === 'scheduled'
                ? 'Agendando disparo do template...'
                : 'Iniciando disparo do template...';

        setIsSubmitting(true);
        const loadingToast = toast.loading(loadingMessage);

        try {
            const componentsPayload = buildComponentsPayload(selectedTemplateObj, templateParams);

            const payload = {
                source,
                deal_ids: dealIds,
                select_all_pages: selectAllPages,
                ids: !selectAllPages ? selectedConvoIds : undefined,
                excluded_ids: selectAllPages && excludedConvoIds.length > 0 ? excludedConvoIds : undefined,
                ...filterParams,
                template_name: selectedTemplateObj.name,
                language: selectedTemplateObj.language || 'pt_BR',
                components: componentsPayload,
                button_actions: Object.keys(buttonActions).length > 0 ? buttonActions : null,
                delay_seconds: delaySeconds,
                concurrency_limit: concurrency,
                is_recurring: isRecurring,
                recurrence_frequency: isRecurring ? recurrenceFrequency : undefined,
                recurrence_days_of_week: isRecurring && recurrenceFrequency === 'weekly' ? recurrenceDaysOfWeek : undefined,
                recurrence_day_of_month: isRecurring && recurrenceFrequency === 'monthly' ? recurrenceDayOfMonth : undefined,
                recurrence_time: isRecurring ? recurrenceTime : undefined,
                scheduled_time: dispatchMode === 'scheduled' && scheduledDateTime ? new Date(scheduledDateTime).toISOString() : undefined,
                is_followup_enabled: !isRecurring ? isFollowupEnabled : false,
                followups: !isRecurring && formattedFollowups.length > 0 ? formattedFollowups : null
            };

            const res = await fetchWithAuth(
                `${API_URL}/chat/conversations/bulk-template`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                },
                activeClientId
            );

            if (res.ok) {
                const data = await res.json();
                toast.dismiss(loadingToast);
                toast.success(data.message || `Template "${selectedTemplateObj.name}" disparado com sucesso!`);
                if (onSuccess) onSuccess();
                onClose();
            } else {
                const errData = await res.json().catch(() => ({}));
                toast.dismiss(loadingToast);
                toast.error(errData.detail || 'Falha ao disparar template em massa.');
            }
        } catch (err) {
            console.error('Erro na requisição de bulk-template:', err);
            toast.dismiss(loadingToast);
            toast.error('Erro de conexão ao disparar template.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

            <div className="relative w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] min-h-[550px] max-h-[92vh] z-10 animate-in fade-in zoom-in-95 duration-200">
                {/* Header do Modal */}
                <BulkTemplateHeader
                    selectedCount={selectedCount}
                    onClose={onClose}
                    isSubmitting={isSubmitting}
                />

                {/* Abas de Navegação */}
                <BulkTemplateTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    recipientCount={recipients.length || selectedCount}
                />

                {/* Conteúdo com Scroll da Aba Ativa */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                            <FiRefreshCw className="animate-spin text-teal-500" size={28} />
                            <span className="text-sm">Carregando dados...</span>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'template' && (
                                <BulkTemplateTabMessage
                                    templates={templates}
                                    selectedTemplateName={selectedTemplateName}
                                    setSelectedTemplateName={setSelectedTemplateName}
                                    selectedTemplateObj={selectedTemplateObj}
                                    templateParams={templateParams}
                                    setTemplateParams={setTemplateParams}
                                    setButtonActions={setButtonActions}
                                    previewText={previewText}
                                    isTemplateSelectorOpen={isTemplateSelectorOpen}
                                    setIsTemplateSelectorOpen={setIsTemplateSelectorOpen}
                                />
                            )}

                            {activeTab === 'settings' && (
                                <BulkTemplateTabSettings
                                    selectedTemplateObj={selectedTemplateObj}
                                    templateButtons={templateButtons}
                                    buttonActions={buttonActions}
                                    setButtonActions={setButtonActions}
                                    funnels={funnels}
                                    delaySeconds={delaySeconds}
                                    setDelaySeconds={setDelaySeconds}
                                    concurrency={concurrency}
                                    setConcurrency={setConcurrency}
                                    dispatchMode={dispatchMode}
                                    setDispatchMode={setDispatchMode}
                                    scheduledDateTime={scheduledDateTime}
                                    setScheduledDateTime={setScheduledDateTime}
                                    recurrenceFrequency={recurrenceFrequency}
                                    setRecurrenceFrequency={setRecurrenceFrequency}
                                    recurrenceDaysOfWeek={recurrenceDaysOfWeek}
                                    setRecurrenceDaysOfWeek={setRecurrenceDaysOfWeek}
                                    recurrenceDayOfMonth={recurrenceDayOfMonth}
                                    setRecurrenceDayOfMonth={setRecurrenceDayOfMonth}
                                    recurrenceTime={recurrenceTime}
                                    setRecurrenceTime={setRecurrenceTime}
                                    isFollowupEnabled={isFollowupEnabled}
                                    setIsFollowupEnabled={setIsFollowupEnabled}
                                    followups={followups}
                                    setFollowups={setFollowups}
                                    stopTags={stopTags}
                                    setStopTags={setStopTags}
                                    templates={templates}
                                    chatwootLabels={chatwootLabels}
                                />
                            )}

                            {activeTab === 'recipients' && (
                                <BulkTemplateTabRecipients
                                    recipients={recipients}
                                    loading={loadingRecipients}
                                    onRefresh={loadRecipients}
                                    selectedCount={selectedCount}
                                    selectAllPages={selectAllPages}
                                />
                            )}
                        </>
                    )}
                </div>

                {/* Footer do Modal */}
                <BulkTemplateFooter
                    selectedCount={selectedCount}
                    selectedTemplateName={selectedTemplateName}
                    isSubmitting={isSubmitting}
                    dispatchMode={dispatchMode}
                    onClose={onClose}
                    onSend={handleSend}
                />
            </div>
        </div>
    );
}

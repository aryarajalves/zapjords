import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { fetchWithAuth } from '../../../../AuthContext';
import { API_URL } from '../../../../config';
import { normalizePhone } from '../../../../utils/phoneFilters';

export const useKanbanRecipients = ({
    activeClient,
    templateVariables = [],
    kanbanVariables = {},
    setContacts,
    setIsProcessing,
    setWorkingMessage,
    setShowList,
    setIsValidated
}) => {
    const [selectedKanbanPipelines, setSelectedKanbanPipelines] = useState([]);
    const [selectedKanbanStages, setSelectedKanbanStages] = useState([]);

    const loadContactsFromKanban = async () => {
        if (!selectedKanbanPipelines || selectedKanbanPipelines.length === 0) {
            return toast.error("Selecione pelo menos um funil do Kanban primeiro");
        }
        if (!activeClient) {
            return toast.error("Selecione um cliente primeiro");
        }

        if (templateVariables && templateVariables.length > 0) {
            for (const v of templateVariables) {
                const val = kanbanVariables[v.key];
                if (!val || val.trim() === '') {
                    toast.error(`Faltou preencher a variável: ${v.label}`, {
                        icon: '⚠️',
                        duration: 4000
                    });
                    return;
                }
            }
        }

        setWorkingMessage("Buscando contatos dos funis selecionados no Kanban...");
        setIsProcessing(true);

        try {
            const res = await fetchWithAuth(`${API_URL}/crm/deals/contacts-query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pipeline_ids: selectedKanbanPipelines,
                    stage_ids: selectedKanbanStages.length > 0 ? selectedKanbanStages : null
                })
            }, activeClient.id);

            if (res && res.ok) {
                const data = await res.json();
                const items = data.items || [];

                if (items.length === 0) {
                    setIsProcessing(false);
                    return toast.error("Nenhum contato encontrado nos funis/colunas selecionadas");
                }

                const incoming = items.map(deal => {
                    const phone = normalizePhone(deal.phone);
                    const vars = {};
                    if (Array.isArray(templateVariables)) {
                        templateVariables.forEach(v => {
                            let val = kanbanVariables ? (kanbanVariables[v.key] || '') : '';
                            if (val) {
                                const nameStr = String(deal.name || '');
                                val = val.replace(/\{\{nome\}\}/gi, nameStr);
                                val = val.replace(/\{\{primeiro_nome\}\}/gi, nameStr.split(' ')[0] || '');
                                val = val.replace(/\{\{email\}\}/gi, String(deal.email || ''));
                                val = val.replace(/\{\{telefone\}\}/gi, String(deal.phone || ''));
                                val = val.replace(/\{\{produto\}\}/gi, String(deal.product_name || ''));
                                val = val.replace(/\{\{valor\}\}/gi, deal.value ? String(deal.value) : '');
                            } else {
                                // Fallback inteligente caso não tenha preenchido regra manual
                                const keyLower = (v.label || v.name || v.key || '').toLowerCase();
                                if (keyLower.includes('nome') || keyLower.includes('name')) {
                                    val = deal.name || '';
                                } else if (keyLower.includes('produto') || keyLower.includes('product')) {
                                    val = deal.product_name || '';
                                } else if (keyLower.includes('valor') || keyLower.includes('price')) {
                                    val = deal.value ? String(deal.value) : '';
                                }
                            }
                            vars[v.key] = val;
                        });
                    }

                    return {
                        phone,
                        name: deal.name,
                        email: deal.email,
                        product_name: deal.product_name,
                        vars,
                        status: 'pending',
                        window_open: false,
                        deal_id: deal.deal_id
                    };
                }).filter(c => c.phone && c.phone.length >= 8);

                setContacts(prev => {
                    const existingPhones = new Set(prev.map(c => normalizePhone(c.phone)));
                    const seenInBatch = new Set();
                    const uniqueIncoming = incoming.filter(c => {
                        if (existingPhones.has(c.phone) || seenInBatch.has(c.phone)) return false;
                        seenInBatch.add(c.phone);
                        return true;
                    });

                    const duplicatesCount = incoming.length - uniqueIncoming.length;
                    if (duplicatesCount > 0) {
                        toast.success(`${uniqueIncoming.length} novos contatos do Kanban adicionados (${duplicatesCount} duplicados ignorados)`, {
                            icon: 'ℹ️'
                        });
                    } else {
                        toast.success(`${uniqueIncoming.length} contatos do Kanban carregados com sucesso!`);
                    }

                    return [...prev, ...uniqueIncoming];
                });

                setShowList(true);
                setIsValidated(false);
            } else {
                toast.error("Erro ao consultar contatos do Kanban");
            }
        } catch (err) {
            console.error("Erro ao carregar contatos do Kanban:", err);
            toast.error("Erro ao conectar com o servidor para carregar contatos do Kanban");
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        selectedKanbanPipelines,
        setSelectedKanbanPipelines,
        selectedKanbanStages,
        setSelectedKanbanStages,
        loadContactsFromKanban
    };
};

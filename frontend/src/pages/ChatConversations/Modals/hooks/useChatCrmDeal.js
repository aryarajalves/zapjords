import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { resolveUrl } from '../../../../config';
import { useClient } from '../../../../contexts/ClientContext';

export function useChatCrmDeal({ isOpen, selectedConvo, onClose }) {
    const { activeClient } = useClient();
    const clientId = activeClient?.id;

    const [pipelines, setPipelines] = useState([]);
    const [selectedPipelineId, setSelectedPipelineId] = useState('');
    const [stages, setStages] = useState([]);
    const [selectedStageId, setSelectedStageId] = useState('');
    const [products, setProducts] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [selectedProductName, setSelectedProductName] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [value, setValue] = useState('0.00');
    const [lostReason, setLostReason] = useState('');
    const [notes, setNotes] = useState('');
    const [existingDeal, setExistingDeal] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            'X-Client-ID': clientId ? String(clientId) : ''
        };
    }, [clientId]);

    // Carregar pipelines e catálogo de produtos ao abrir
    useEffect(() => {
        if (!isOpen || !clientId) return;

        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const [pipeRes, prodRes] = await Promise.all([
                    fetch(resolveUrl('/api/crm/pipelines'), { headers: getAuthHeaders() }),
                    fetch(resolveUrl('/api/crm/products'), { headers: getAuthHeaders() })
                ]);

                if (pipeRes.ok) {
                    const pipeData = await pipeRes.json();
                    setPipelines(pipeData);
                    if (pipeData.length > 0 && !selectedPipelineId) {
                        const defaultPipe = pipeData.find(p => p.is_default) || pipeData[0];
                        setSelectedPipelineId(String(defaultPipe.id));
                    }
                }

                if (prodRes.ok) {
                    const prodData = await prodRes.json();
                    setProducts(prodData.filter(p => p.is_active));
                }
            } catch (err) {
                console.error('Erro ao carregar dados iniciais do CRM:', err);
                toast.error('Erro ao conectar com o CRM');
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, [isOpen, clientId, getAuthHeaders]);

    // Verificar se o contato já possui oportunidade existente
    useEffect(() => {
        if (!isOpen || !clientId || !selectedConvo?.phone) return;

        const checkExistingDeal = async () => {
            try {
                const digits = selectedConvo.phone.replace(/\D/g, '');
                const res = await fetch(resolveUrl(`/api/crm/deals/by-phone/${digits}`), {
                    headers: getAuthHeaders()
                });
                if (res.ok) {
                    const deal = await res.json();
                    if (deal && deal.id) {
                        setExistingDeal(deal);
                        setSelectedPipelineId(String(deal.pipeline_id));
                        if (deal.product_name) setSelectedProductName(deal.product_name);
                        if (deal.product_id) setSelectedProductId(String(deal.product_id));
                        if (deal.value !== undefined) setValue(String(deal.value));
                        if (deal.lost_reason) setLostReason(deal.lost_reason);
                        if (deal.notes) setNotes(deal.notes);
                    } else {
                        setExistingDeal(null);
                    }
                }
            } catch (err) {
                console.error('Erro ao buscar deal existente:', err);
            }
        };

        checkExistingDeal();
    }, [isOpen, clientId, selectedConvo?.phone, getAuthHeaders]);

    // Preencher dados básicos do contato
    useEffect(() => {
        if (selectedConvo && isOpen) {
            setContactName(selectedConvo.contact_name || '');
            setContactPhone(selectedConvo.phone || '');
            setContactEmail(selectedConvo.email || '');
            if (!existingDeal) {
                setValue('0.00');
                setLostReason('');
                setNotes('');
                setSelectedProductId('');
                setSelectedProductName('');
            }
        }
    }, [selectedConvo, isOpen, existingDeal]);

    // Carregar estágios e sugerir próxima etapa
    useEffect(() => {
        if (!selectedPipelineId || !clientId) {
            setStages([]);
            setSelectedStageId('');
            return;
        }

        const loadStages = async () => {
            try {
                const res = await fetch(resolveUrl(`/api/crm/stages?pipeline_id=${selectedPipelineId}`), {
                    headers: getAuthHeaders()
                });
                if (res.ok) {
                    const stageList = await res.json();
                    setStages(stageList);

                    if (stageList.length > 0) {
                        if (existingDeal && String(existingDeal.pipeline_id) === String(selectedPipelineId)) {
                            const currentIdx = stageList.findIndex(s => s.id === existingDeal.stage_id);
                            if (currentIdx !== -1 && currentIdx + 1 < stageList.length) {
                                setSelectedStageId(String(stageList[currentIdx + 1].id));
                            } else {
                                setSelectedStageId(String(existingDeal.stage_id));
                            }
                        } else {
                            setSelectedStageId(String(stageList[0].id));
                        }
                    }
                }
            } catch (err) {
                console.error('Erro ao carregar estágios:', err);
            }
        };

        loadStages();
    }, [selectedPipelineId, clientId, existingDeal, getAuthHeaders]);

    const currentStageName = useMemo(() => {
        if (!existingDeal || !stages.length) return null;
        const s = stages.find(stg => stg.id === existingDeal.stage_id);
        return s?.name || null;
    }, [existingDeal, stages]);

    const isTargetLost = useMemo(() => {
        if (!selectedStageId || !stages.length) return false;
        const stg = stages.find(s => String(s.id) === String(selectedStageId));
        return stg?.stage_type === 'lost' || (stg?.name && stg.name.toLowerCase().includes('desist'));
    }, [selectedStageId, stages]);

    const targetStageName = useMemo(() => {
        const stg = stages.find(s => String(s.id) === String(selectedStageId));
        return stg?.name || 'Próxima Etapa';
    }, [selectedStageId, stages]);

    const handleProductChange = (prodId) => {
        setSelectedProductId(prodId);
        if (!prodId) {
            setSelectedProductName('');
            return;
        }
        const prod = products.find(p => String(p.id) === String(prodId));
        if (prod) {
            setSelectedProductName(prod.name);
            if (prod.price !== undefined && Number(prod.price) > 0) {
                setValue(String(prod.price));
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const digits = contactPhone.replace(/\D/g, '');
        if (digits.length < 8) {
            toast.error('Número de telefone inválido');
            return;
        }
        if (!selectedPipelineId || !selectedStageId) {
            toast.error('Selecione o pipeline e a coluna');
            return;
        }
        if (isTargetLost && !lostReason.trim()) {
            toast.error('Informe o motivo da desistência');
            return;
        }

        setIsSaving(true);
        try {
            const numVal = parseFloat(String(value).replace(',', '.')) || 0.0;
            const payload = {
                pipeline_id: Number(selectedPipelineId),
                stage_id: Number(selectedStageId),
                contact_phone: digits,
                contact_name: contactName.trim() || 'Sem Nome',
                contact_email: contactEmail.trim() || null,
                product_id: selectedProductId ? Number(selectedProductId) : null,
                product_name: selectedProductName || null,
                value: numVal,
                lost_reason: isTargetLost ? lostReason.trim() : null,
                notes: notes.trim() || null
            };

            const res = await fetch(resolveUrl('/api/crm/deals/move-contact'), {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success(`Lead ${existingDeal ? 'movido' : 'adicionado'} para "${targetStageName}" no Kanban! 🚀`);
                window.dispatchEvent(new CustomEvent('reload-chat-messages', { detail: { convoId: selectedConvo?.id } }));
                if (onClose) onClose();
            } else {
                const errData = await res.json().catch(() => ({}));
                toast.error(errData.detail || 'Erro ao atualizar oportunidade');
            }
        } catch (err) {
            console.error('Erro ao mover lead no CRM:', err);
            toast.error('Erro de conexão ao salvar no CRM');
        } finally {
            setIsSaving(false);
        }
    };

    return {
        pipelines,
        selectedPipelineId,
        setSelectedPipelineId,
        stages,
        selectedStageId,
        setSelectedStageId,
        products,
        selectedProductId,
        handleProductChange,
        contactName,
        setContactName,
        contactPhone,
        setContactPhone,
        value,
        setValue,
        lostReason,
        setLostReason,
        notes,
        setNotes,
        existingDeal,
        currentStageName,
        isTargetLost,
        targetStageName,
        isLoading,
        isSaving,
        handleSave
    };
}

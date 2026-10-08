import React, { useState, useEffect, useCallback } from 'react';
import { FiX, FiDollarSign, FiLayers, FiCheckCircle } from 'react-icons/fi';
import { BsTrello } from 'react-icons/bs';
import { toast } from 'react-hot-toast';
import { resolveUrl } from '../../../config';
import { useClient } from '../../../contexts/ClientContext';

export default function AddChatToCrmModal({ isOpen, onClose, selectedConvo }) {
    const { activeClient } = useClient();
    const clientId = activeClient?.id;

    const [pipelines, setPipelines] = useState([]);
    const [selectedPipelineId, setSelectedPipelineId] = useState('');
    const [stages, setStages] = useState([]);
    const [selectedStageId, setSelectedStageId] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [title, setTitle] = useState('');
    const [value, setValue] = useState('0.00');
    const [notes, setNotes] = useState('');
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

    // Buscar lista de pipelines quando o modal abrir
    useEffect(() => {
        if (!isOpen || !clientId) return;

        const loadPipelines = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(resolveUrl('/api/crm/pipelines'), {
                    headers: getAuthHeaders()
                });
                if (res.ok) {
                    const data = await res.json();
                    setPipelines(data);
                    if (data.length > 0) {
                        const defaultPipe = data.find(p => p.is_default) || data[0];
                        setSelectedPipelineId(String(defaultPipe.id));
                    }
                } else {
                    toast.error('Erro ao carregar pipelines do CRM');
                }
            } catch (err) {
                console.error('Erro ao carregar pipelines:', err);
                toast.error('Erro de conexão ao carregar CRM');
            } finally {
                setIsLoading(false);
            }
        };

        loadPipelines();
    }, [isOpen, clientId, getAuthHeaders]);

    // Buscar estágios quando o pipeline for selecionado
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
                    const data = await res.json();
                    setStages(data);
                    if (data.length > 0) {
                        setSelectedStageId(String(data[0].id));
                    }
                }
            } catch (err) {
                console.error('Erro ao carregar estágios:', err);
            }
        };

        loadStages();
    }, [selectedPipelineId, clientId, getAuthHeaders]);

    // Preencher valor padrão do produto ao selecionar o pipeline
    useEffect(() => {
        if (!selectedPipelineId || pipelines.length === 0) return;
        const currentPipe = pipelines.find(p => String(p.id) === String(selectedPipelineId));
        if (currentPipe && currentPipe.default_value && Number(currentPipe.default_value) > 0) {
            setValue(String(currentPipe.default_value));
        }
    }, [selectedPipelineId, pipelines]);

    // Preencher dados do contato
    useEffect(() => {
        if (selectedConvo && isOpen) {
            const name = selectedConvo.contact_name || '';
            const phone = selectedConvo.phone || '';
            setContactName(name);
            setContactPhone(phone);
            setContactEmail(selectedConvo.email || '');
            setTitle(name ? `Negócio: ${name}` : `Lead: ${phone}`);
            setValue('0.00');
            setNotes('');
        }
    }, [selectedConvo, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const digits = contactPhone.replace(/\D/g, '');
        if (digits.length < 8) {
            toast.error('Número de telefone inválido');
            return;
        }
        if (!selectedPipelineId || !selectedStageId) {
            toast.error('Selecione um pipeline e uma coluna');
            return;
        }

        setIsSaving(true);
        try {
            const numVal = parseFloat(value.replace(',', '.')) || 0.0;
            const payload = {
                pipeline_id: Number(selectedPipelineId),
                stage_id: Number(selectedStageId),
                contact_phone: digits,
                contact_name: contactName.trim() || 'Sem Nome',
                contact_email: contactEmail.trim() || null,
                title: title.trim() || `Negócio com ${contactName || digits}`,
                value: numVal,
                notes: notes.trim() || null,
                status: 'open'
            };

            const res = await fetch(resolveUrl('/api/crm/deals'), {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success('Contato adicionado ao Kanban de Vendas!');
                onClose();
            } else {
                const errData = await res.json().catch(() => ({}));
                toast.error(errData.detail || 'Erro ao adicionar oportunidade');
            }
        } catch (err) {
            console.error('Erro ao salvar no CRM:', err);
            toast.error('Erro de conexão ao salvar');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Cabeçalho */}
                <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-600/10 text-blue-500 border border-blue-500/20">
                            <BsTrello size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                Adicionar ao Kanban de Vendas
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Crie uma oportunidade de venda para este contato
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {isLoading ? (
                        <div className="py-8 text-center text-sm text-gray-500">
                            Carregando funis de venda...
                        </div>
                    ) : (
                        <>
                            {/* Pipeline / Funil */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Funil / Produto *
                                    </label>
                                    <select
                                        value={selectedPipelineId}
                                        onChange={(e) => setSelectedPipelineId(e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1e293b] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        required
                                    >
                                        {pipelines.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} {p.product_name ? `(${p.product_name})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Coluna / Etapa *
                                    </label>
                                    <select
                                        value={selectedStageId}
                                        onChange={(e) => setSelectedStageId(e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1e293b] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        required
                                    >
                                        {stages.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Título do Card */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Título da Oportunidade
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ex: Lead WhatsApp: Nome do Cliente"
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1e293b] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            {/* Contato & Valor */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Nome do Contato
                                    </label>
                                    <input
                                        type="text"
                                        value={contactName}
                                        onChange={(e) => setContactName(e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1e293b] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Valor Estimado (R$)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <FiDollarSign size={13} />
                                        </div>
                                        <input
                                            type="text"
                                            value={value}
                                            onChange={(e) => setValue(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1e293b] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Notas / Observação */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Notas da Negociação
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Detalhes, objeções, interesse do lead..."
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1e293b] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                                />
                            </div>
                        </>
                    )}

                    {/* Rodapé / Ações */}
                    <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || isLoading}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                            {isSaving ? 'Salvando...' : 'Adicionar ao Funil'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

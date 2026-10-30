import React, { useState, useEffect } from 'react';
import { FiX, FiTrash2, FiMessageSquare } from 'react-icons/fi';
import { DealProductPricingSection } from './DealModal/DealProductPricingSection';
import { DealPipelineStageSection } from './DealModal/DealPipelineStageSection';
import { DealFollowupSection } from './DealModal/DealFollowupSection';

const CHANNEL_OPTIONS = [
    { id: 'whatsapp', label: '💬 WhatsApp' },
    { id: 'kiwify', label: '🥝 Kiwify' },
    { id: 'hotmart', label: '🔥 Hotmart' },
    { id: 'eduzz', label: '🟡 Eduzz' },
    { id: 'checkout_jords', label: '⚡ Checkout Jords' },
    { id: 'bussola_quiz', label: '🧭 Bússola Quiz' },
    { id: 'yayforms', label: '📝 Formulário / YayForms' },
    { id: 'elementor', label: '🌐 Site / Elementor' },
    { id: 'instagram', label: '📸 Instagram Direct' },
    { id: 'facebook_ads', label: '📢 Facebook Ads' },
    { id: 'google_ads', label: '🎯 Google Ads' },
    { id: 'indicacao', label: '🤝 Indicação' },
    { id: 'prospeccao', label: '📞 Prospecção Ativa' },
    { id: 'outro', label: '✨ Outro Canal (Personalizado)' }
];

export function DealModal({
    isOpen,
    onClose,
    onSave,
    onDelete,
    dealToEdit,
    stages = [],
    pipelineId,
    initialStageId,
    defaultDealValue,
    products = [],
    onOpenChat
}) {
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [title, setTitle] = useState('');
    const [productId, setProductId] = useState('');
    const [productName, setProductName] = useState('');
    const [originalValue, setOriginalValue] = useState('0.00');
    const [value, setValue] = useState('0.00');
    const [channel, setChannel] = useState('whatsapp');
    const [customChannel, setCustomChannel] = useState('');
    const [stageId, setStageId] = useState('');
    const [status, setStatus] = useState('open');
    const [lostReason, setLostReason] = useState('');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Follow-up individual
    const [useCustomFollowup, setUseCustomFollowup] = useState(false);
    const [customDelayValue, setCustomDelayValue] = useState('');
    const [customDelayUnit, setCustomDelayUnit] = useState('hours');

    useEffect(() => {
        if (dealToEdit) {
            setContactName(dealToEdit.contact_name || '');
            setContactPhone(dealToEdit.contact_phone || '');
            setContactEmail(dealToEdit.contact_email || '');
            setTitle(dealToEdit.title || '');
            
            setProductId(dealToEdit.product_id ? String(dealToEdit.product_id) : '');
            setProductName(dealToEdit.product_name || '');
            setOriginalValue(String(dealToEdit.original_value || dealToEdit.value || '0.00'));
            setValue(String(dealToEdit.value || '0.00'));

            const existingChannel = (dealToEdit.channel || 'whatsapp').toLowerCase();
            const isKnown = CHANNEL_OPTIONS.some(c => c.id === existingChannel);
            if (isKnown) {
                setChannel(existingChannel);
                setCustomChannel('');
            } else {
                setChannel('outro');
                setCustomChannel(dealToEdit.channel || '');
            }

            setStageId(dealToEdit.stage_id || (stages[0]?.id || ''));
            setStatus(dealToEdit.status || 'open');
            setLostReason(dealToEdit.lost_reason || '');
            setNotes(dealToEdit.notes || '');

            const hasCustomFo = dealToEdit.custom_followup_delay_value !== null &&
                dealToEdit.custom_followup_delay_value !== undefined &&
                Number(dealToEdit.custom_followup_delay_value) > 0;
            setUseCustomFollowup(hasCustomFo);
            setCustomDelayValue(hasCustomFo ? String(dealToEdit.custom_followup_delay_value) : '');
            setCustomDelayUnit(dealToEdit.custom_followup_delay_unit || 'hours');
        } else {
            setContactName('');
            setContactPhone('');
            setContactEmail('');
            setTitle('');
            setProductId('');
            setProductName('');
            const initialVal = defaultDealValue && Number(defaultDealValue) > 0 ? String(defaultDealValue) : '0.00';
            setOriginalValue(initialVal);
            setValue(initialVal);
            setChannel('whatsapp');
            setCustomChannel('');
            setStageId(initialStageId || (stages[0]?.id || ''));
            setStatus('open');
            setLostReason('');
            setNotes('');
            setUseCustomFollowup(false);
            setCustomDelayValue('');
            setCustomDelayUnit('hours');
        }
    }, [dealToEdit, initialStageId, stages, isOpen, defaultDealValue]);

    if (!isOpen) return null;

    const handleProductChange = (selectedId) => {
        setProductId(selectedId);
        if (!selectedId) {
            setProductName('');
            return;
        }
        const safeList = Array.isArray(products) ? products : [];
        const found = safeList.find(p => String(p.id) === String(selectedId));
        if (found) {
            setProductName(found.name);
            const prodPriceStr = String(found.price || '0.00');
            setOriginalValue(prodPriceStr);
            setValue(prodPriceStr);
        }
    };

    const numOrig = parseFloat(String(originalValue).replace(',', '.')) || 0.0;
    const numReal = parseFloat(String(value).replace(',', '.')) || 0.0;
    const discountAmount = numOrig > numReal ? (numOrig - numReal) : 0;
    const discountPct = numOrig > 0 && discountAmount > 0 ? Math.round((discountAmount / numOrig) * 100) : 0;
    const selectedStage = stages.find(s => String(s.id) === String(stageId));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const digits = contactPhone.replace(/\D/g, '');
        if (digits.length < 8) return;

        setIsSaving(true);
        try {
            const finalChannel = channel === 'outro' ? (customChannel.trim() || 'Outro') : channel;
            const isDesistenciaStage = (selectedStage && (
                selectedStage.stage_type === 'lost' ||
                selectedStage.name.toLowerCase().includes('desistencia') ||
                selectedStage.name.toLowerCase().includes('desistência')
            )) || status === 'lost';

            const payload = {
                pipeline_id: pipelineId,
                stage_id: Number(stageId),
                contact_phone: digits,
                contact_name: contactName.trim() || 'Sem Nome',
                contact_email: contactEmail.trim() || null,
                title: title.trim() || `Oportunidade - ${contactName.trim() || digits}`,
                product_id: productId ? Number(productId) : null,
                product_name: productName.trim() || null,
                original_value: numOrig,
                value: numReal,
                channel: finalChannel,
                status: isDesistenciaStage ? 'lost' : status,
                lost_reason: isDesistenciaStage ? (lostReason.trim() || null) : null,
                notes: notes.trim() || null,
                custom_followup_delay_value: useCustomFollowup && Number(customDelayValue) > 0 ? Number(customDelayValue) : null,
                custom_followup_delay_unit: useCustomFollowup && Number(customDelayValue) > 0 ? customDelayUnit : null
            };
            await onSave(payload);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up max-h-[92vh] flex flex-col my-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-950/40 shrink-0">
                    <div className="min-w-0 flex-1 pr-3">
                        <h2 className="text-lg font-black text-white truncate">
                            {dealToEdit ? (dealToEdit.contact_name || 'Detalhes da Oportunidade') : 'Nova Oportunidade'}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Dados do lead, produto selecionado e valor real negociado.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {dealToEdit && onOpenChat && (
                            <button
                                type="button"
                                onClick={() => onOpenChat(dealToEdit.contact_phone, dealToEdit.contact_name)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                title="Abrir conversa no ZapVoice"
                            >
                                <FiMessageSquare size={13} />
                                <span className="hidden sm:inline">Conversar no ZapVoice</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all cursor-pointer"
                        >
                            <FiX size={18} />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                    {/* Linha 1: Contato */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1.5">
                                Nome do Lead / Contato
                            </label>
                            <input
                                type="text"
                                value={contactName}
                                onChange={(e) => setContactName(e.target.value)}
                                placeholder="Ex: João da Silva"
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none focus:border-blue-500 transition-all font-bold"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1.5">
                                WhatsApp / Telefone <span className="text-rose-400">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={contactPhone}
                                onChange={(e) => setContactPhone(e.target.value)}
                                placeholder="Ex: 5511999998888"
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none focus:border-blue-500 transition-all font-mono"
                            />
                        </div>
                    </div>

                    {/* Linha 2: Produto da Empresa e Precificação */}
                    <DealProductPricingSection
                        products={products}
                        productId={productId}
                        onProductChange={handleProductChange}
                        originalValue={originalValue}
                        setOriginalValue={setOriginalValue}
                        value={value}
                        setValue={setValue}
                        discountAmount={discountAmount}
                        discountPct={discountPct}
                    />

                    {/* Linha 3: Canal, Estágio e Status */}
                    <DealPipelineStageSection
                        channel={channel}
                        setChannel={setChannel}
                        customChannel={customChannel}
                        setCustomChannel={setCustomChannel}
                        stageId={stageId}
                        setStageId={setStageId}
                        stages={stages}
                        status={status}
                        setStatus={setStatus}
                        lostReason={lostReason}
                        setLostReason={setLostReason}
                        channelOptions={CHANNEL_OPTIONS}
                    />

                    {/* Linha 4: Prazo de Follow-up Individual */}
                    <DealFollowupSection
                        useCustomFollowup={useCustomFollowup}
                        setUseCustomFollowup={setUseCustomFollowup}
                        customDelayValue={customDelayValue}
                        setCustomDelayValue={setCustomDelayValue}
                        customDelayUnit={customDelayUnit}
                        setCustomDelayUnit={setCustomDelayUnit}
                        selectedStage={selectedStage}
                    />

                    <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                            E-mail (Opcional)
                        </label>
                        <input
                            type="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            placeholder="joao@exemplo.com"
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                            Anotações da Negociação
                        </label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ex: Cliente tem interesse na turma de novembro. Pediu desconto no Pix..."
                            className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-blue-500 transition-all resize-none"
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5 shrink-0">
                        {dealToEdit ? (
                            <button
                                type="button"
                                onClick={() => onDelete(dealToEdit.id, dealToEdit.contact_name)}
                                className="flex items-center gap-1.5 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                                <FiTrash2 size={14} />
                                <span>Excluir</span>
                            </button>
                        ) : <div />}

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving || !contactPhone.trim()}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                            >
                                {isSaving ? 'Salvando...' : 'Salvar Oportunidade'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

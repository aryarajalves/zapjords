import React, { useState, useEffect } from 'react';
import { FiX, FiTrash2, FiGlobe, FiTag, FiDollarSign, FiMessageSquare } from 'react-icons/fi';

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
    stages,
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        const digits = contactPhone.replace(/\D/g, '');
        if (digits.length < 8) return;

        setIsSaving(true);
        try {
            const finalChannel = channel === 'outro' ? (customChannel.trim() || 'Outro') : channel;
            const selectedStage = stages.find(s => String(s.id) === String(stageId));
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
                notes: notes.trim() || null
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
                                onClick={() => onOpenChat(dealToEdit.contact_phone)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                title="Conversar no WhatsApp"
                            >
                                <FiMessageSquare size={13} />
                                <span className="hidden sm:inline">WhatsApp</span>
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

                    {/* Linha 2: Produto da Empresa */}
                    <div className="bg-slate-950/60 border border-amber-500/20 rounded-2xl p-3.5 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                                <FiTag size={13} className="text-amber-400" />
                                Produto da Empresa
                            </label>
                            {(!Array.isArray(products) || products.length === 0) && (
                                <span className="text-[10px] text-slate-400">
                                    Nenhum produto cadastrado no catálogo
                                </span>
                            )}
                        </div>

                        <select
                            value={productId}
                            onChange={(e) => handleProductChange(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none focus:border-amber-500 transition-all font-bold cursor-pointer"
                        >
                            <option value="">Selecione um produto (ou personalize abaixo)...</option>
                            {(Array.isArray(products) ? products : []).map(p => (
                                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                                    {p.name} — R$ {Number(p.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </option>
                            ))}
                        </select>

                        {/* Valores: Preço Padrão e Valor Real Vendido */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                                    Preço de Tabela (R$)
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={originalValue}
                                        onChange={(e) => setOriginalValue(e.target.value)}
                                        placeholder="0,00"
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-slate-300 text-xs font-bold outline-none focus:border-amber-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                    Valor Real da Venda (R$)
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={value}
                                        onChange={(e) => setValue(e.target.value)}
                                        placeholder="0,00"
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-emerald-400 text-xs font-black outline-none focus:border-emerald-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Indicação de Desconto */}
                        {discountAmount > 0 && (
                            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                                <span>🏷️ Desconto Aplicado:</span>
                                <span>
                                    - R$ {discountAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({discountPct}% OFF)
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Linha 3: Canal e Estágio */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                                <FiGlobe className="text-blue-400" />
                                Canal de Origem <span className="text-rose-400">*</span>
                            </label>
                            <select
                                value={channel}
                                onChange={(e) => setChannel(e.target.value)}
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none focus:border-blue-500 transition-all font-bold cursor-pointer"
                            >
                                {CHANNEL_OPTIONS.map((opt) => (
                                    <option key={opt.id} value={opt.id} className="bg-slate-900 text-white">
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1.5">
                                Coluna / Estágio <span className="text-rose-400">*</span>
                            </label>
                            <select
                                value={stageId}
                                onChange={(e) => setStageId(e.target.value)}
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none focus:border-blue-500 transition-all font-bold cursor-pointer"
                            >
                                {stages.map(stg => (
                                    <option key={stg.id} value={stg.id} className="bg-slate-900 text-white">
                                        {stg.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Status da Oportunidade */}
                    <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                            Status da Oportunidade
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none focus:border-blue-500 transition-all font-bold cursor-pointer"
                        >
                            <option value="open">Em Aberto / Negociação</option>
                            <option value="won">Ganho 🎉 (Venda Fechada)</option>
                            <option value="lost">Perdido ❌</option>
                        </select>
                    </div>

                    {/* Campo de Motivo da Desistência do Lead */}
                    {(() => {
                        const currentStage = stages.find(s => String(s.id) === String(stageId));
                        const isDesistencia = (currentStage && (
                            currentStage.stage_type === 'lost' ||
                            currentStage.name.toLowerCase().includes('desistencia') ||
                            currentStage.name.toLowerCase().includes('desistência')
                        )) || status === 'lost';

                        if (!isDesistencia) return null;

                        return (
                            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 space-y-2 animate-fade-in">
                                <label className="block text-xs font-bold text-rose-300">
                                    Motivo da Desistência do Lead
                                </label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {[
                                        'Preço alto / Sem orçamento',
                                        'Sem interesse no momento',
                                        'Comprou de concorrente',
                                        'Não responde / Sumiu',
                                        'Outro motivo'
                                    ].map((q) => (
                                        <button
                                            type="button"
                                            key={q}
                                            onClick={() => setLostReason(q)}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                                lostReason === q
                                                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                                                    : 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
                                            }`}
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    rows={2}
                                    value={lostReason}
                                    onChange={(e) => setLostReason(e.target.value)}
                                    placeholder="Descreva o motivo da desistência do lead..."
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white text-xs outline-none focus:border-rose-500 transition-all resize-none font-medium"
                                />
                            </div>
                        );
                    })()}

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

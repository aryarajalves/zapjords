import React, { useState, useEffect } from 'react';
import { FiX, FiTrash2, FiDollarSign } from 'react-icons/fi';

export function DealModal({
    isOpen,
    onClose,
    onSave,
    onDelete,
    dealToEdit,
    stages,
    pipelineId,
    initialStageId,
    defaultDealValue
}) {
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [title, setTitle] = useState('');
    const [value, setValue] = useState('0.00');
    const [stageId, setStageId] = useState('');
    const [status, setStatus] = useState('open');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (dealToEdit) {
            setContactName(dealToEdit.contact_name || '');
            setContactPhone(dealToEdit.contact_phone || '');
            setContactEmail(dealToEdit.contact_email || '');
            setTitle(dealToEdit.title || '');
            setValue(String(dealToEdit.value || '0.00'));
            setStageId(dealToEdit.stage_id || (stages[0]?.id || ''));
            setStatus(dealToEdit.status || 'open');
            setNotes(dealToEdit.notes || '');
        } else {
            setContactName('');
            setContactPhone('');
            setContactEmail('');
            setTitle('');
            setValue(defaultDealValue !== undefined && defaultDealValue !== null && Number(defaultDealValue) > 0 ? String(defaultDealValue) : '0.00');
            setStageId(initialStageId || (stages[0]?.id || ''));
            setStatus('open');
            setNotes('');
        }
    }, [dealToEdit, initialStageId, stages, isOpen, defaultDealValue]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const digits = contactPhone.replace(/\D/g, '');
        if (digits.length < 8) return;

        setIsSaving(true);
        try {
            const numVal = parseFloat(value.replace(',', '.')) || 0.0;
            const payload = {
                pipeline_id: pipelineId,
                stage_id: Number(stageId),
                contact_phone: digits,
                contact_name: contactName.trim() || 'Sem Nome',
                contact_email: contactEmail.trim() || null,
                title: title.trim() || `Oportunidade - ${contactName.trim() || digits}`,
                value: numVal,
                status,
                notes: notes.trim() || null
            };
            await onSave(payload);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-950/40">
                    <div>
                        <h2 className="text-lg font-black text-white">
                            {dealToEdit ? 'Editar Oportunidade' : 'Nova Oportunidade'}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Preencha os dados do lead para acompanhar a negociação no Kanban.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all cursor-pointer"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1.5">
                                Valor da Venda (R$)
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-xs font-bold">
                                    R$
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder="0,00"
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-emerald-400 text-xs font-black outline-none focus:border-blue-500 transition-all"
                                />
                            </div>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
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

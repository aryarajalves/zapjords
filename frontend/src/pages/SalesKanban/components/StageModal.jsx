import React, { useState, useEffect } from 'react';
import { FiX, FiTrash2, FiLayers, FiCheck } from 'react-icons/fi';

const COLOR_OPTIONS = [
    { id: 'blue', label: 'Azul', bg: 'bg-blue-500', border: 'border-blue-400' },
    { id: 'amber', label: 'Âmbar', bg: 'bg-amber-500', border: 'border-amber-400' },
    { id: 'emerald', label: 'Verde Esmeralda', bg: 'bg-emerald-500', border: 'border-emerald-400' },
    { id: 'rose', label: 'Rosa / Vermelho', bg: 'bg-rose-500', border: 'border-rose-400' },
    { id: 'purple', label: 'Roxo', bg: 'bg-purple-500', border: 'border-purple-400' },
    { id: 'slate', label: 'Cinza Ardósia', bg: 'bg-slate-500', border: 'border-slate-400' },
    { id: 'indigo', label: 'Índigo', bg: 'bg-indigo-500', border: 'border-indigo-400' },
    { id: 'cyan', label: 'Ciano', bg: 'bg-cyan-500', border: 'border-cyan-400' }
];

const STAGE_TYPES = [
    { id: 'in_progress', label: 'Em Negociação / Andamento' },
    { id: 'initial', label: 'Etapa Inicial / Entrada' },
    { id: 'won', label: 'Venda Concluída (Ganho 🎉)' },
    { id: 'lost', label: 'Perdido (Não Fechou ❌)' }
];

const TRIGGER_OPTIONS = [
    { id: '', label: 'Nenhum (Movimentação Manual / Geral)' },
    { id: 'carrinho_abandonado', label: 'Carrinho Abandonado' },
    { id: 'pix_gerado,boleto_gerado', label: 'Aguardando Pagamento (Pix / Boleto)' },
    { id: 'compra_aprovada', label: 'Compra Aprovada (Venda Fechada)' }
];

export function StageModal({ isOpen, onClose, onSave, onDelete, stageToEdit, pipelineId }) {
    const [name, setName] = useState('');
    const [color, setColor] = useState('blue');
    const [stageType, setStageType] = useState('in_progress');
    const [webhookEventTrigger, setWebhookEventTrigger] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (stageToEdit) {
            setName(stageToEdit.name || '');
            setColor(stageToEdit.color || 'blue');
            setStageType(stageToEdit.stage_type || 'in_progress');
            setWebhookEventTrigger(stageToEdit.webhook_event_trigger || '');
        } else {
            setName('');
            setColor('blue');
            setStageType('in_progress');
            setWebhookEventTrigger('');
        }
    }, [stageToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSaving(true);
        try {
            const payload = {
                pipeline_id: pipelineId,
                name: name.trim(),
                color,
                stage_type: stageType,
                webhook_event_trigger: webhookEventTrigger.trim() || null
            };
            await onSave(payload, stageToEdit?.id);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
                {/* Cabeçalho */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-950/40">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <FiLayers size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-white">
                                {stageToEdit ? 'Editar Coluna do CRM' : 'Nova Coluna do CRM'}
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Crie ou personalize etapas do funil de vendas.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all cursor-pointer"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                            Nome da Coluna / Etapa <span className="text-rose-400">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Proposta Enviada, Follow-up 3 dias..."
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none focus:border-blue-500 transition-all font-bold"
                        />
                    </div>

                    {/* Paleta de Cores */}
                    <div>
                        <label className="block text-xs font-bold text-slate-300 mb-2">
                            Cor da Coluna
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {COLOR_OPTIONS.map((c) => {
                                const isSelected = color === c.id;
                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setColor(c.id)}
                                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                            isSelected
                                                ? `${c.border} bg-white/10 text-white shadow-lg`
                                                : 'border-white/5 bg-slate-950/60 text-slate-400 hover:bg-white/5'
                                        }`}
                                    >
                                        <span className={`w-3.5 h-3.5 rounded-full ${c.bg} shrink-0 flex items-center justify-center`}>
                                            {isSelected && <FiCheck size={10} className="text-white" />}
                                        </span>
                                        <span className="truncate text-[11px]">{c.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tipo de Estágio */}
                    <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                            Comportamento da Etapa
                        </label>
                        <select
                            value={stageType}
                            onChange={(e) => setStageType(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none focus:border-blue-500 transition-all font-bold cursor-pointer"
                        >
                            {STAGE_TYPES.map((st) => (
                                <option key={st.id} value={st.id} className="bg-slate-900 text-white">
                                    {st.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Gatilho Opcional de Webhook */}
                    <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                            Gatilho Automático de Webhook (Opcional)
                        </label>
                        <select
                            value={webhookEventTrigger}
                            onChange={(e) => setWebhookEventTrigger(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none focus:border-blue-500 transition-all font-medium cursor-pointer"
                        >
                            {TRIGGER_OPTIONS.map((tr) => (
                                <option key={tr.id} value={tr.id} className="bg-slate-900 text-white">
                                    {tr.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-[10px] text-slate-500 mt-1">
                            Se selecionado, novos leads recebidos com este status entram automaticamente nesta coluna.
                        </p>
                    </div>

                    {/* Rodapé / Ações */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        {stageToEdit ? (
                            <button
                                type="button"
                                onClick={() => onDelete(stageToEdit.id, stageToEdit.name)}
                                className="flex items-center gap-1.5 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                                <FiTrash2 size={14} />
                                <span>Excluir Coluna</span>
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
                                disabled={isSaving || !name.trim()}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                            >
                                {isSaving ? 'Salvando...' : (stageToEdit ? 'Salvar Coluna' : 'Criar Coluna')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

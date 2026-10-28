import React, { useState } from 'react';
import { FiPlus, FiTag, FiX, FiCheckCircle, FiShield, FiAlertTriangle, FiLayers } from 'react-icons/fi';
import FollowUpItem from './FollowUpItem';

export default function FollowUpSection({
    isFollowupEnabled = false,
    setIsFollowupEnabled,
    followups = [],
    setFollowups,
    stopTags = [],
    setStopTags,
    templates = [],
    funnels = [],
    chatwootLabels = [],
    stepNumber = '03'
}) {
    const [tagInput, setTagInput] = useState('');
    const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

    const handleToggle = () => {
        const nextState = !isFollowupEnabled;
        setIsFollowupEnabled(nextState);
        if (nextState && followups.length === 0) {
            // Adiciona a primeira etapa padrão de 24h
            setFollowups([
                {
                    id: Date.now(),
                    template_name: '',
                    language: 'pt_BR',
                    schedule_type: 'relative',
                    relative_delay_hours: 24,
                    scheduled_time: null,
                    button_actions: {}
                }
            ]);
        }
    };

    const handleAddStep = () => {
        const nextStepNum = followups.length + 1;
        const prevHours = followups[followups.length - 1]?.relative_delay_hours || 24;
        setFollowups(prev => [
            ...prev,
            {
                id: Date.now(),
                template_name: '',
                language: 'pt_BR',
                schedule_type: 'relative',
                relative_delay_hours: prevHours + 24,
                scheduled_time: null,
                button_actions: {}
            }
        ]);
    };

    const handleUpdateStep = (index, updated) => {
        setFollowups(prev => {
            const next = [...prev];
            next[index] = updated;
            return next;
        });
    };

    const handleRemoveStep = (index) => {
        setFollowups(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddStopTag = (tagToAdd) => {
        const clean = String(tagToAdd || '').trim();
        if (!clean) return;
        if (!stopTags.includes(clean)) {
            setStopTags(prev => [...prev, clean]);
        }
        setTagInput('');
    };

    const handleRemoveStopTag = (tagToRemove) => {
        setStopTags(prev => prev.filter(t => t !== tagToRemove));
    };

    // Opções de etiquetas disponíveis (chatwootLabels não selecionadas), filtradas pelo texto digitado
    const filteredLabelOptions = (chatwootLabels || [])
        .map(l => (typeof l === 'object' ? (l.title || l.name || l.value || l.label) : l))
        .filter(name => name && typeof name === 'string' && !stopTags.includes(name))
        .filter(name => !tagInput.trim() || name.toLowerCase().includes(tagInput.trim().toLowerCase()));

    return (
        <section className="bg-slate-900/60 backdrop-blur-md rounded-[2.5rem] p-10 shadow-2xl border border-white/5 h-fit relative overflow-hidden group/followup">
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-violet-600/10 blur-3xl rounded-full" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-indigo-600/10 blur-3xl rounded-full" />

            {/* Header com Badge 03 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
                <h2 className="text-2xl font-black text-white flex items-center gap-4">
                    <span className="p-3 bg-violet-500/10 text-violet-400 rounded-2xl border border-violet-500/20 shadow-xl shadow-violet-500/10 font-mono text-xl">
                        {stepNumber}
                    </span>
                    Sequência de Follow-up
                </h2>

                <label className="flex items-center gap-3 cursor-pointer self-start sm:self-auto bg-slate-950/40 px-4 py-2 rounded-2xl border border-white/5">
                    <span className="text-xs font-bold text-slate-300">
                        {isFollowupEnabled ? 'Ativado' : 'Desativado'}
                    </span>
                    <input
                        type="checkbox"
                        checked={isFollowupEnabled}
                        onChange={handleToggle}
                        className="sr-only"
                    />
                    <div className={`w-12 h-6 rounded-full p-1 transition-all ${isFollowupEnabled ? 'bg-violet-600' : 'bg-slate-800'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${isFollowupEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                </label>
            </div>

            <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6 relative z-10">
                Configure envios automáticos para contatos que <strong className="text-white">receberam a mensagem</strong> anterior.
                Caso o contato interaja, clique em um botão ou receba uma etiqueta de parada, o follow-up é cancelado automaticamente.
            </p>

            {isFollowupEnabled && (
                <div className="space-y-8 relative z-10 animate-in fade-in duration-300">
                    {/* Alerta de Regras de Envio e Cancelamento */}
                    <div className="p-4 rounded-2xl bg-violet-500/5 border border-violet-500/20 space-y-2">
                        <div className="flex items-center gap-2 text-violet-400 text-xs font-bold">
                            <FiShield size={14} />
                            <span>Regras Automáticas de Qualificação e Parada</span>
                        </div>
                        <ul className="text-[11px] text-slate-400 space-y-1 ml-5 list-disc">
                            <li><strong className="text-slate-200">Apenas recebidos:</strong> O follow-up só é enviado se a mensagem anterior foi entregue ou lida. Falhas são ignoradas.</li>
                            <li><strong className="text-slate-200">Clique em Botão:</strong> Se o contato clicar em qualquer botão do template, os follow-ups são cancelados para ele.</li>
                            <li><strong className="text-slate-200">Etiqueta de Parada:</strong> Se o contato tiver ou receber uma das etiquetas abaixo, o follow-up é interrompido.</li>
                        </ul>
                    </div>

                    {/* Gestão de Etiquetas de Parada */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <FiTag size={12} className="text-violet-400" />
                            Etiquetas de Parada (Interrompem o envio)
                        </label>

                        {/* Input de tag com Dropdown */}
                        <div className="relative">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Clique para ver etiquetas ou digite para filtrar..."
                                    value={tagInput}
                                    onChange={(e) => {
                                        setTagInput(e.target.value);
                                        setIsTagDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsTagDropdownOpen(true)}
                                    onClick={() => setIsTagDropdownOpen(true)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddStopTag(tagInput);
                                            setIsTagDropdownOpen(false);
                                        }
                                    }}
                                    className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleAddStopTag(tagInput);
                                        setIsTagDropdownOpen(false);
                                    }}
                                    className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-violet-900/30 shrink-0"
                                >
                                    <FiPlus size={14} />
                                    Adicionar
                                </button>
                            </div>

                            {/* Dropdown com a lista de etiquetas disponíveis */}
                            {isTagDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsTagDropdownOpen(false)}
                                    />
                                    <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 max-h-56 overflow-y-auto p-2 space-y-1">
                                        {/* Opção para adicionar tag personalizada se digitou algo que não existe */}
                                        {tagInput.trim() && !filteredLabelOptions.some(opt => opt.toLowerCase() === tagInput.trim().toLowerCase()) && (
                                            <button
                                                type="button"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handleAddStopTag(tagInput);
                                                    setIsTagDropdownOpen(false);
                                                }}
                                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-violet-400 hover:bg-violet-500/10 flex items-center gap-2 border border-violet-500/20 mb-1 transition-all"
                                            >
                                                <FiPlus size={13} />
                                                Adicionar &quot;{tagInput.trim()}&quot;
                                            </button>
                                        )}

                                        {filteredLabelOptions.map((labelName) => (
                                            <button
                                                key={labelName}
                                                type="button"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handleAddStopTag(labelName);
                                                    setIsTagDropdownOpen(false);
                                                }}
                                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/5 flex items-center justify-between group transition-colors"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <FiTag size={12} className="text-violet-400" />
                                                    {labelName}
                                                </span>
                                                <span className="text-[10px] text-slate-500 group-hover:text-violet-400 font-bold uppercase">
                                                    + Adicionar
                                                </span>
                                            </button>
                                        ))}

                                        {filteredLabelOptions.length === 0 && !tagInput.trim() && (
                                            <div className="px-4 py-3 text-center text-xs text-slate-500 italic">
                                                Nenhuma etiqueta cadastrada no momento
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Lista de etiquetas de parada ativas */}
                        {stopTags.length > 0 ? (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {stopTags.map(tag => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20"
                                    >
                                        <FiTag size={11} className="text-rose-400" />
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveStopTag(tag)}
                                            className="hover:text-white p-0.5 rounded-full hover:bg-rose-500/30 transition-all"
                                            title={`Remover etiqueta ${tag}`}
                                        >
                                            <FiX size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[11px] text-slate-500 italic">
                                Nenhuma etiqueta de parada cadastrada. Adicione etiquetas para cancelar o follow-up quando o lead fechar negócio ou mudar de status.
                            </p>
                        )}
                    </div>

                    {/* Lista de Etapas de Follow-up */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <FiLayers size={12} className="text-violet-400" />
                                Etapas da Sequência ({followups.length})
                            </label>

                            <button
                                type="button"
                                onClick={handleAddStep}
                                className="px-3.5 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                                <FiPlus size={13} />
                                Adicionar Follow-up
                            </button>
                        </div>

                        {followups.map((fu, idx) => (
                            <FollowUpItem
                                key={fu.id || idx}
                                followup={fu}
                                index={idx}
                                templates={templates}
                                funnels={funnels}
                                onUpdate={(updated) => handleUpdateStep(idx, updated)}
                                onRemove={() => handleRemoveStep(idx)}
                            />
                        ))}

                        {followups.length === 0 && (
                            <div className="text-center py-8 border border-dashed border-white/10 rounded-3xl p-6">
                                <p className="text-xs text-slate-400 mb-3">
                                    Nenhuma etapa de follow-up criada ainda.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleAddStep}
                                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold inline-flex items-center gap-2 transition-all shadow-lg shadow-violet-900/30"
                                >
                                    <FiPlus size={14} />
                                    Adicionar Primeira Etapa
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

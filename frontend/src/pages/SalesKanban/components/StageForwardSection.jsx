import React from 'react';
import { FiArrowRight } from 'react-icons/fi';

export function StageForwardSection({
    forwardEnabled,
    setForwardEnabled,
    forwardToPipelineId,
    setForwardToPipelineId,
    forwardToStageId,
    setForwardToStageId,
    otherPipelines = [],
    targetStages = []
}) {
    return (
        <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        <FiArrowRight size={14} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-white block">
                            Avançar para outro Pipeline
                        </label>
                        <p className="text-[10px] text-slate-400 leading-tight">
                            Ao entrar nesta coluna, envia o contato para outro pipeline automaticamente.
                        </p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                        type="checkbox"
                        checked={forwardEnabled}
                        data-testid="stage-forward-toggle"
                        aria-label="Ativar avanço para outro pipeline"
                        onChange={(e) => {
                            const checked = e.target.checked;
                            setForwardEnabled(checked);
                            if (checked && !forwardToPipelineId && otherPipelines.length > 0) {
                                setForwardToPipelineId(otherPipelines[0].id);
                                if (otherPipelines[0].stages?.length > 0) {
                                    setForwardToStageId(otherPipelines[0].stages[0].id);
                                }
                            }
                        }}
                        className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
            </div>

            {forwardEnabled && (
                <div className="pt-2 border-t border-white/5 space-y-2.5 animate-fade-in">
                    {otherPipelines.length === 0 ? (
                        <p className="text-[11px] text-amber-400 font-medium">
                            ⚠️ Crie outro pipeline primeiro para poder configurar o encaminhamento automático.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-300 mb-1">
                                    Pipeline Destino
                                </label>
                                <select
                                    value={forwardToPipelineId || ''}
                                    onChange={(e) => {
                                        const newPipeId = Number(e.target.value);
                                        setForwardToPipelineId(newPipeId);
                                        const pipe = otherPipelines.find(p => p.id === newPipeId);
                                        if (pipe?.stages?.length > 0) {
                                            setForwardToStageId(pipe.stages[0].id);
                                        } else {
                                            setForwardToStageId('');
                                        }
                                    }}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-2 text-white text-xs outline-none focus:border-emerald-500 font-bold cursor-pointer"
                                >
                                    {otherPipelines.map(p => (
                                        <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                                            {p.name} {p.product_name ? `(${p.product_name})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-300 mb-1">
                                    Coluna de Destino
                                </label>
                                <select
                                    value={forwardToStageId || ''}
                                    onChange={(e) => setForwardToStageId(Number(e.target.value))}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-2 text-white text-xs outline-none focus:border-emerald-500 font-bold cursor-pointer"
                                >
                                    {targetStages.length === 0 ? (
                                        <option value="" disabled>Nenhuma coluna no destino</option>
                                    ) : (
                                        targetStages.map(st => (
                                            <option key={st.id} value={st.id} className="bg-slate-900 text-white">
                                                {st.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

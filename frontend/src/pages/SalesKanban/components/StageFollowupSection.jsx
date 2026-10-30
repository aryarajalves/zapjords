import React from 'react';
import { FiClock } from 'react-icons/fi';

export function StageFollowupSection({
    isFollowup,
    setIsFollowup,
    followupDelayValue,
    setFollowupDelayValue,
    followupDelayUnit,
    setFollowupDelayUnit
}) {
    const unitLabel = followupDelayUnit === 'hours'
        ? (Number(followupDelayValue) === 1 ? 'hora' : 'horas')
        : followupDelayUnit === 'days'
        ? (Number(followupDelayValue) === 1 ? 'dia' : 'dias')
        : (Number(followupDelayValue) === 1 ? 'minuto' : 'minutos');

    return (
        <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                        <FiClock size={14} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-white block">
                            Coluna de Follow-up
                        </label>
                        <p className="text-[10px] text-slate-400 leading-tight">
                            Indica contatos que aguardam retorno e sinaliza quando o prazo for ultrapassado.
                        </p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                        type="checkbox"
                        checked={isFollowup}
                        onChange={(e) => setIsFollowup(e.target.checked)}
                        className="sr-only peer"
                        data-testid="stage-followup-toggle"
                        aria-label="Ativar coluna de follow-up"
                    />
                    <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
            </div>

            {isFollowup && (
                <div className="pt-2 border-t border-white/5 space-y-2 animate-fade-in">
                    <label className="block text-[10px] font-bold text-slate-300">
                        Tempo Limite de Follow-up por Contato
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <input
                                type="number"
                                min="1"
                                max="999"
                                value={followupDelayValue}
                                onChange={(e) => setFollowupDelayValue(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-500 font-bold"
                                placeholder="Ex: 3"
                                data-testid="stage-followup-value-input"
                            />
                        </div>
                        <div>
                            <select
                                value={followupDelayUnit}
                                onChange={(e) => setFollowupDelayUnit(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-2 text-white text-xs outline-none focus:border-amber-500 font-bold cursor-pointer"
                                data-testid="stage-followup-unit-select"
                            >
                                <option value="hours" className="bg-slate-900 text-white">Horas</option>
                                <option value="days" className="bg-slate-900 text-white">Dias</option>
                                <option value="minutes" className="bg-slate-900 text-white">Minutos</option>
                            </select>
                        </div>
                    </div>
                    <p className="text-[10px] text-amber-300/80 font-medium leading-relaxed">
                        💡 Após <span className="font-bold text-amber-200">{followupDelayValue} {unitLabel}</span> nesta coluna, o card do contato exibirá um alerta indicando que precisa de Follow-up.
                    </p>
                </div>
            )}
        </div>
    );
}

import React from 'react';
import { FiClock, FiCheckCircle } from 'react-icons/fi';

const UNIT_LABELS = {
    minutes: 'minutos',
    hours: 'horas',
    days: 'dias'
};

const UNIT_SINGULAR_LABELS = {
    minutes: 'minuto',
    hours: 'hora',
    days: 'dia'
};

export function DealFollowupSection({
    useCustomFollowup,
    setUseCustomFollowup,
    customDelayValue,
    setCustomDelayValue,
    customDelayUnit,
    setCustomDelayUnit,
    selectedStage
}) {
    const stageHasFollowup = Boolean(selectedStage?.is_followup);
    const stageVal = selectedStage?.followup_delay_value || 3;
    const stageUnit = selectedStage?.followup_delay_unit || 'hours';
    const stageUnitText = stageVal === 1
        ? (UNIT_SINGULAR_LABELS[stageUnit] || stageUnit)
        : (UNIT_LABELS[stageUnit] || stageUnit);

    const quickPresets = [
        { label: '30 min', val: 30, unit: 'minutes' },
        { label: '2 horas', val: 2, unit: 'hours' },
        { label: '24 horas', val: 24, unit: 'hours' },
        { label: '3 dias', val: 3, unit: 'days' }
    ];

    const handleToggle = (checked) => {
        setUseCustomFollowup(checked);
        if (checked && (!customDelayValue || Number(customDelayValue) <= 0)) {
            // Se ativou e não tem valor, inicializa com o da etapa ou 24 horas
            setCustomDelayValue(stageHasFollowup ? stageVal : 24);
            setCustomDelayUnit(stageHasFollowup ? stageUnit : 'hours');
        }
    };

    return (
        <div className="bg-slate-950/60 border border-cyan-500/20 rounded-2xl p-3.5 space-y-3">
            {/* Header & Toggle */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <FiClock size={14} />
                    </div>
                    <div>
                        <span className="text-xs font-black text-cyan-300 block">
                            Prazo de Follow-up Individual
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                            Personalize o tempo limite deste contato independente da coluna
                        </span>
                    </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0 pt-0.5">
                    <input
                        type="checkbox"
                        checked={useCustomFollowup}
                        onChange={(e) => handleToggle(e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
            </div>

            {/* Quando customizado está ATIVADO */}
            {useCustomFollowup ? (
                <div className="space-y-2.5 pt-1 animate-fade-in">
                    <div className="grid grid-cols-2 gap-2.5">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                Prazo Personalizado
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={customDelayValue}
                                onChange={(e) => setCustomDelayValue(e.target.value)}
                                placeholder="Ex: 2"
                                className="w-full bg-slate-900 border border-cyan-500/40 rounded-xl px-3 py-2 text-white text-xs font-bold outline-none focus:border-cyan-400 transition-all font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                Unidade de Tempo
                            </label>
                            <select
                                value={customDelayUnit}
                                onChange={(e) => setCustomDelayUnit(e.target.value)}
                                className="w-full bg-slate-900 border border-cyan-500/40 rounded-xl px-3 py-2 text-white text-xs font-bold outline-none focus:border-cyan-400 transition-all cursor-pointer"
                            >
                                <option value="minutes">Minutos</option>
                                <option value="hours">Horas</option>
                                <option value="days">Dias</option>
                            </select>
                        </div>
                    </div>

                    {/* Atalhos Rápidos */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="text-[10px] text-slate-400 font-bold mr-1">Atalhos:</span>
                        {quickPresets.map((preset) => (
                            <button
                                type="button"
                                key={preset.label}
                                onClick={() => {
                                    setCustomDelayValue(preset.val);
                                    setCustomDelayUnit(preset.unit);
                                }}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                    Number(customDelayValue) === preset.val && customDelayUnit === preset.unit
                                        ? 'bg-cyan-500 text-slate-950 font-black shadow-sm shadow-cyan-500/30'
                                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/5'
                                }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-cyan-300/90 bg-cyan-950/40 border border-cyan-500/20 rounded-xl px-3 py-1.5">
                        <FiCheckCircle size={12} className="shrink-0 text-cyan-400" />
                        <span>
                            Este lead será cobrado para follow-up após <strong>{customDelayValue || '0'} {customDelayUnit === 'hours' ? 'horas' : customDelayUnit === 'days' ? 'dias' : 'minutos'}</strong> nesta etapa.
                        </span>
                    </div>
                </div>
            ) : (
                /* Quando customizado está DESATIVADO: Exibe regra da coluna */
                <div className="text-[11px] text-slate-400 bg-slate-900/60 rounded-xl px-3 py-2 border border-white/5 flex items-center justify-between">
                    <span>
                        {stageHasFollowup ? (
                            <>⏱️ Usando padrão da coluna: <strong>{stageVal} {stageUnitText}</strong></>
                        ) : (
                            <>ℹ️ A coluna atual não possui prazo automático de follow-up.</>
                        )}
                    </span>
                    <button
                        type="button"
                        onClick={() => handleToggle(true)}
                        className="text-cyan-400 hover:text-cyan-300 text-[11px] font-bold underline cursor-pointer"
                    >
                        Personalizar
                    </button>
                </div>
            )}
        </div>
    );
}

import React from 'react';
import { FiClock, FiCalendar, FiTrash2, FiZap, FiSlash, FiMinus, FiCpu, FiMessageSquare } from 'react-icons/fi';
import { extractTemplateButtons } from '../hooks/bulkSender/templateUtils';

const TYPE_OPTIONS = [
    { value: 'none', label: 'Nenhum', icon: FiMinus, color: 'slate' },
    { value: 'interaction', label: 'Interação', icon: FiZap, color: 'emerald' },
    { value: 'block', label: 'Bloqueio', icon: FiSlash, color: 'rose' }
];

const COLOR = {
    slate: { border: 'border-slate-500/20', text: 'text-slate-400', bg: 'bg-slate-500/10' },
    emerald: { border: 'border-emerald-500/20', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    rose: { border: 'border-rose-500/20', text: 'text-rose-400', bg: 'bg-rose-500/10' }
};

export default function FollowUpItem({
    followup,
    index,
    templates = [],
    funnels = [],
    onUpdate,
    onRemove
}) {
    const selectedTpl = templates.find(t => t.name === followup.template_name);
    const templateButtons = selectedTpl ? extractTemplateButtons(selectedTpl) : [];

    const handleTemplateChange = (e) => {
        const tplName = e.target.value;
        const tpl = templates.find(t => t.name === tplName);
        onUpdate({
            ...followup,
            template_name: tplName,
            language: tpl?.language || 'pt_BR',
            button_actions: {}
        });
    };

    const handleScheduleTypeChange = (type) => {
        onUpdate({
            ...followup,
            schedule_type: type,
            relative_delay_hours: type === 'relative' ? (followup.relative_delay_hours || 24) : null,
            scheduled_time: type === 'fixed' ? (followup.scheduled_time || '') : null
        });
    };

    const handleRelativeHoursChange = (hours) => {
        onUpdate({
            ...followup,
            relative_delay_hours: Math.max(1, parseInt(hours) || 1)
        });
    };

    const handleFixedDateChange = (val) => {
        onUpdate({
            ...followup,
            scheduled_time: val
        });
    };

    const handleButtonActionChange = (btnText, field, value) => {
        const currentActions = followup.button_actions || {};
        const currentBtn = currentActions[btnText] || { type: 'none', funnel_id: null, activate_agent: false };
        const updatedBtn = { ...currentBtn, [field]: value };
        if (field === 'type' && value === 'none') {
            updatedBtn.funnel_id = null;
            updatedBtn.activate_agent = false;
        }
        onUpdate({
            ...followup,
            button_actions: {
                ...currentActions,
                [btnText]: updatedBtn
            }
        });
    };

    return (
        <div className="bg-slate-950/60 rounded-3xl p-6 border border-white/10 space-y-6 relative group transition-all hover:border-violet-500/30">
            {/* Header da Etapa */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30 font-black text-xs flex items-center justify-center">
                        #{index + 1}
                    </span>
                    <div>
                        <h4 className="text-sm font-black text-white tracking-wide">
                            Follow-up Etapa {index + 1}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            Disparo subsequente automático
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onRemove}
                    className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all text-xs font-bold flex items-center gap-1.5"
                    title="Remover esta etapa de follow-up"
                >
                    <FiTrash2 size={13} />
                    <span className="hidden sm:inline text-[10px] uppercase tracking-wider">Remover</span>
                </button>
            </div>

            {/* Seleção do Template */}
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <FiMessageSquare size={12} className="text-violet-400" />
                    Template do WhatsApp
                </label>
                <select
                    value={followup.template_name || ''}
                    onChange={handleTemplateChange}
                    className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs font-bold outline-none focus:border-violet-500 transition-all"
                >
                    <option value="">Selecione o template do follow-up...</option>
                    {templates.map(t => (
                        <option key={t.id || t.name} value={t.name}>
                            {t.name} ({t.category || 'MARKETING'}) - {t.language || 'pt_BR'}
                        </option>
                    ))}
                </select>
            </div>

            {/* Agendamento */}
            <div className="space-y-3 pt-2 border-t border-white/5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <FiClock size={12} className="text-violet-400" />
                    Momento do Disparo
                </label>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => handleScheduleTypeChange('relative')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${followup.schedule_type === 'relative' ? 'bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-900/30' : 'bg-slate-900/80 text-slate-400 border-white/5 hover:text-white'}`}
                    >
                        <FiClock size={12} />
                        Tempo Relativo
                    </button>
                    <button
                        type="button"
                        onClick={() => handleScheduleTypeChange('fixed')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${followup.schedule_type === 'fixed' ? 'bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-900/30' : 'bg-slate-900/80 text-slate-400 border-white/5 hover:text-white'}`}
                    >
                        <FiCalendar size={12} />
                        Data e Hora Fixa
                    </button>
                </div>

                {followup.schedule_type === 'relative' ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min="1"
                                max="720"
                                value={followup.relative_delay_hours || 24}
                                onChange={(e) => handleRelativeHoursChange(e.target.value)}
                                className="w-24 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-black text-sm outline-none focus:border-violet-500 text-center"
                            />
                            <span className="text-xs text-slate-300 font-bold">horas após o disparo anterior</span>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {[12, 24, 48, 72].map(h => (
                                <button
                                    key={h}
                                    type="button"
                                    onClick={() => handleRelativeHoursChange(h)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${followup.relative_delay_hours === h ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' : 'bg-slate-900 text-slate-400 border-white/5 hover:text-white'}`}
                                >
                                    {h >= 24 ? `${h / 24} dia${h / 24 > 1 ? 's' : ''} (${h}h)` : `${h} horas`}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <input
                        type="datetime-local"
                        value={followup.scheduled_time || ''}
                        onChange={(e) => handleFixedDateChange(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs font-bold outline-none focus:border-violet-500"
                    />
                )}
            </div>

            {/* Ações dos Botões deste Template (se houver botões) */}
            {templateButtons.length > 0 && (
                <div className="space-y-4 pt-3 border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <FiZap size={12} className="text-violet-400" />
                            Ações dos Botões do Template
                        </label>
                        <span className="text-[9px] text-slate-500 font-medium">
                            Clicar cancela os próximos follow-ups
                        </span>
                    </div>

                    <div className="space-y-3">
                        {templateButtons.map((btnText) => {
                            const btnConfig = (followup.button_actions || {})[btnText] || { type: 'none', funnel_id: null, activate_agent: false };
                            const activeOpt = TYPE_OPTIONS.find(o => o.value === btnConfig.type) || TYPE_OPTIONS[0];
                            const c = COLOR[activeOpt.color];

                            return (
                                <div key={btnText} className={`p-4 rounded-2xl border transition-all ${btnConfig.type !== 'none' ? `bg-slate-900/90 ${c.border}` : 'bg-slate-900/40 border-white/5'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white font-bold text-xs truncate max-w-[200px]">
                                            {btnText}
                                        </span>

                                        <div className="flex gap-1">
                                            {TYPE_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => handleButtonActionChange(btnText, 'type', opt.value)}
                                                    className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border transition-all ${btnConfig.type === opt.value ? `${COLOR[opt.color].bg} ${COLOR[opt.color].text} ${COLOR[opt.color].border}` : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                                                >
                                                    <opt.icon size={11} />
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {btnConfig.type === 'interaction' && (
                                        <div className="pt-3 border-t border-white/5 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={btnConfig.funnel_id || ''}
                                                    onChange={(e) => handleButtonActionChange(btnText, 'funnel_id', e.target.value ? parseInt(e.target.value) : null)}
                                                    className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                                                >
                                                    <option value="">Nenhum funil (apenas registrar clique)</option>
                                                    {funnels.map(f => (
                                                        <option key={f.id} value={f.id}>{f.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer text-[10px] text-slate-400 font-bold">
                                                <input
                                                    type="checkbox"
                                                    checked={!!btnConfig.activate_agent}
                                                    onChange={(e) => handleButtonActionChange(btnText, 'activate_agent', e.target.checked)}
                                                    className="rounded border-white/10 bg-slate-950 text-emerald-500 focus:ring-0"
                                                />
                                                <FiCpu size={12} className="text-emerald-400" />
                                                Ativar Agente de IA ao clicar
                                            </label>
                                        </div>
                                    )}

                                    {btnConfig.type === 'block' && (
                                        <div className="pt-2 border-t border-white/5 text-[10px] text-rose-400/90 font-medium">
                                            ⚠️ O contato será bloqueado e não receberá mais nenhuma mensagem.
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

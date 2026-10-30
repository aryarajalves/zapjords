import React from 'react';
import { FiCalendar, FiClock, FiRepeat, FiZap, FiX } from 'react-icons/fi';

export default function BulkTemplateScheduling({
    dispatchMode = 'immediate',
    setDispatchMode,
    scheduledDateTime = '',
    setScheduledDateTime,
    recurrenceFrequency = 'weekly',
    setRecurrenceFrequency,
    recurrenceDaysOfWeek = [0],
    setRecurrenceDaysOfWeek,
    recurrenceDayOfMonth = '1',
    setRecurrenceDayOfMonth,
    recurrenceTime = '09:00',
    setRecurrenceTime
}) {
    const weekDays = [
        { label: 'S', name: 'Segunda', id: 0 },
        { label: 'T', name: 'Terça', id: 1 },
        { label: 'Q', name: 'Quarta', id: 2 },
        { label: 'Q', name: 'Quinta', id: 3 },
        { label: 'S', name: 'Sexta', id: 4 },
        { label: 'S', name: 'Sábado', id: 5 },
        { label: 'D', name: 'Domingo', id: 6 }
    ];

    const toggleDayOfWeek = (dayId) => {
        if (recurrenceDaysOfWeek.includes(dayId)) {
            if (recurrenceDaysOfWeek.length > 1) {
                setRecurrenceDaysOfWeek(recurrenceDaysOfWeek.filter(d => d !== dayId));
            }
        } else {
            setRecurrenceDaysOfWeek([...recurrenceDaysOfWeek, dayId].sort((a, b) => a - b));
        }
    };

    const nowMin = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

    return (
        <div className="bg-slate-900/60 rounded-xl p-4 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FiCalendar className="text-teal-400" />
                    <span>Programação e Agendamento do Disparo</span>
                </h4>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                    {dispatchMode === 'immediate' && 'Envio Imediato'}
                    {dispatchMode === 'scheduled' && 'Agendamento Único'}
                    {dispatchMode === 'recurring' && 'Disparo Recorrente'}
                </span>
            </div>

            {/* Seletores dos 3 Modos de Disparo */}
            <div className="grid grid-cols-3 gap-2">
                <button
                    type="button"
                    onClick={() => setDispatchMode('immediate')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        dispatchMode === 'immediate'
                            ? 'bg-teal-500/15 border-teal-500/40 text-teal-300 shadow-sm shadow-teal-950/40'
                            : 'bg-slate-950/50 border-white/5 text-slate-400 hover:text-white hover:bg-slate-950/80'
                    }`}
                >
                    <FiZap size={16} className={dispatchMode === 'immediate' ? 'text-teal-400' : 'text-slate-400'} />
                    <span className="mt-1">Imediato</span>
                    <span className="text-[9px] text-slate-500 font-normal">Disparar agora</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setDispatchMode('scheduled');
                        if (!scheduledDateTime) {
                            const inOneHour = new Date(Date.now() + 3600000 - new Date().getTimezoneOffset() * 60000)
                                .toISOString()
                                .slice(0, 16);
                            setScheduledDateTime(inOneHour);
                        }
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        dispatchMode === 'scheduled'
                            ? 'bg-blue-500/15 border-blue-500/40 text-blue-300 shadow-sm shadow-blue-950/40'
                            : 'bg-slate-950/50 border-white/5 text-slate-400 hover:text-white hover:bg-slate-950/80'
                    }`}
                >
                    <FiCalendar size={16} className={dispatchMode === 'scheduled' ? 'text-blue-400' : 'text-slate-400'} />
                    <span className="mt-1">Agendar Futuro</span>
                    <span className="text-[9px] text-slate-500 font-normal">Uma única vez</span>
                </button>

                <button
                    type="button"
                    onClick={() => setDispatchMode('recurring')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        dispatchMode === 'recurring'
                            ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 shadow-sm shadow-indigo-950/40'
                            : 'bg-slate-950/50 border-white/5 text-slate-400 hover:text-white hover:bg-slate-950/80'
                    }`}
                >
                    <FiRepeat size={16} className={dispatchMode === 'recurring' ? 'text-indigo-400' : 'text-slate-400'} />
                    <span className="mt-1">Recorrente</span>
                    <span className="text-[9px] text-slate-500 font-normal">Periódico</span>
                </button>
            </div>

            {/* Painel: Agendamento Futuro */}
            {dispatchMode === 'scheduled' && (
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-blue-500/20 space-y-2 animate-in fade-in duration-150">
                    <label className="text-xs text-blue-300 font-semibold flex items-center gap-1.5">
                        <FiClock size={13} />
                        <span>Data e Horário do Disparo</span>
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="datetime-local"
                            min={nowMin}
                            value={scheduledDateTime}
                            onChange={(e) => setScheduledDateTime(e.target.value)}
                            className="flex-1 px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                        />
                        {scheduledDateTime && (
                            <button
                                type="button"
                                onClick={() => setScheduledDateTime('')}
                                className="px-2.5 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-white/10"
                                title="Limpar data agendada"
                            >
                                <FiX size={14} />
                            </button>
                        )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                        O disparo será registrado no sistema e começará automaticamente na data e hora selecionadas.
                    </p>
                </div>
            )}

            {/* Painel: Disparo Recorrente */}
            {dispatchMode === 'recurring' && (
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-indigo-500/20 space-y-3 animate-in fade-in duration-150">
                    <div className="space-y-1.5">
                        <label className="text-xs text-indigo-300 font-semibold block">
                            Frequência da Recorrência
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {['weekly', 'monthly', 'daily'].map((freq) => (
                                <button
                                    key={freq}
                                    type="button"
                                    onClick={() => setRecurrenceFrequency(freq)}
                                    className={`py-1.5 rounded-lg text-[11px] font-bold uppercase transition ${
                                        recurrenceFrequency === freq
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
                                    }`}
                                >
                                    {freq === 'weekly' && 'Semanal'}
                                    {freq === 'monthly' && 'Mensal'}
                                    {freq === 'daily' && 'Diário'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dias da Semana se Semanal */}
                    {recurrenceFrequency === 'weekly' && (
                        <div className="space-y-1.5">
                            <label className="text-[11px] text-slate-400 block">
                                Dias da Semana:
                            </label>
                            <div className="flex items-center gap-1.5">
                                {weekDays.map((d) => {
                                    const isSelected = recurrenceDaysOfWeek.includes(d.id);
                                    return (
                                        <button
                                            key={d.id}
                                            type="button"
                                            onClick={() => toggleDayOfWeek(d.id)}
                                            className={`flex-1 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center border ${
                                                isSelected
                                                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                                                    : 'bg-slate-900 text-slate-400 border-white/5 hover:border-white/20'
                                            }`}
                                            title={d.name}
                                        >
                                            {d.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Dias do Mês se Mensal */}
                    {recurrenceFrequency === 'monthly' && (
                        <div className="space-y-1">
                            <label className="text-[11px] text-slate-400 block">
                                Dias do Mês (separados por vírgula):
                            </label>
                            <input
                                type="text"
                                value={recurrenceDayOfMonth}
                                onChange={(e) => setRecurrenceDayOfMonth(e.target.value)}
                                placeholder="Ex: 1, 15, 30"
                                className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    )}

                    {/* Horário do Disparo Recorrente */}
                    <div className="space-y-1">
                        <label className="text-[11px] text-slate-400 flex items-center gap-1">
                            <FiClock size={11} />
                            <span>Horário de Execução:</span>
                        </label>
                        <input
                            type="time"
                            value={recurrenceTime}
                            onChange={(e) => setRecurrenceTime(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

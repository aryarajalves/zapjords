import React from 'react';
import { FiClock, FiUsers, FiZap, FiCheckCircle, FiAlertCircle, FiCalendar } from 'react-icons/fi';

const ScheduleListView = ({ currentDate, events, onSelectEvent }) => {
    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // Ordenar cronologicamente
    const sortedEvents = [...events].sort((a, b) => new Date(a.start) - new Date(b.start));

    if (sortedEvents.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-gray-800">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                    <FiCalendar size={28} />
                </div>
                <h3 className="font-bold text-base text-gray-800 dark:text-gray-100 mb-1">
                    Nenhum disparo agendado
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                    Não há disparos programados para o mês de <span className="capitalize">{monthName}</span>.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 bg-white dark:bg-gray-800">
            {sortedEvents.map(event => {
                const eventDate = new Date(event.start);
                const dayFormatted = eventDate.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    weekday: 'short'
                });
                const timeStr = eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const isBulk = event.type === 'bulk';
                const isCompleted = event.status === 'completed';

                return (
                    <button
                        key={event.id}
                        type="button"
                        onClick={() => onSelectEvent(event)}
                        className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all hover:shadow-md active:scale-[0.99] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/70 dark:bg-gray-900/40 ${
                            isBulk
                                ? 'border-purple-200 dark:border-purple-900/40 hover:border-purple-400'
                                : 'border-blue-200 dark:border-blue-900/40 hover:border-blue-400'
                        } ${isCompleted ? 'opacity-70' : ''}`}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                                isBulk
                                    ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-300'
                                    : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300'
                            }`}>
                                <span className="text-[10px] font-black uppercase leading-none">
                                    {eventDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                                </span>
                                <span className="text-sm font-extrabold leading-tight">
                                    {eventDate.getDate()}
                                </span>
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                                        <FiClock size={12} className="text-gray-400" />
                                        {timeStr}
                                    </span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md flex items-center gap-1 ${
                                        isBulk
                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                    }`}>
                                        {isBulk ? <FiUsers size={10} /> : <FiZap size={10} />}
                                        {isBulk ? 'Massa' : 'Único'}
                                    </span>
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                    {event.template_name || event.funnel_name || 'Disparo sem nome'}
                                </h4>
                            </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200 dark:border-gray-800">
                            {event.contact_count && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    {event.contact_count} contatos
                                </span>
                            )}
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                                isCompleted
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            }`}>
                                {isCompleted ? <FiCheckCircle size={11} /> : <FiAlertCircle size={11} />}
                                {isCompleted ? 'Concluído' : 'Pendente'}
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

export default ScheduleListView;

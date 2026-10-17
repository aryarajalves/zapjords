import React from 'react';
import { FiClock, FiUsers, FiZap, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const DailyAgenda = ({ selectedDay, currentDate, dayEvents, onSelectEvent }) => {
    const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay);
    const dateFormatted = dateObj.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    return (
        <div className="sm:hidden border-t border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/60 p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 capitalize">
                        {dateFormatted}
                    </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                    {dayEvents.length} {dayEvents.length === 1 ? 'disparo' : 'disparos'}
                </span>
            </div>

            {dayEvents.length === 0 ? (
                <div className="py-4 px-3 text-center rounded-xl bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700/80">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Nenhum disparo agendado para este dia.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {dayEvents.map(event => {
                        const eventDate = new Date(event.start);
                        const timeStr = eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                        const isBulk = event.type === 'bulk';
                        const isCompleted = event.status === 'completed';

                        return (
                            <button
                                key={event.id}
                                type="button"
                                onClick={() => onSelectEvent(event)}
                                className={`w-full text-left p-3 rounded-xl border transition-all active:scale-[0.99] flex flex-col gap-1.5 shadow-sm bg-white dark:bg-gray-800 ${
                                    isBulk
                                        ? 'border-purple-200 dark:border-purple-800/50 hover:border-purple-400'
                                        : 'border-blue-200 dark:border-blue-800/50 hover:border-blue-400'
                                } ${isCompleted ? 'opacity-70' : ''}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs font-bold">
                                        <FiClock size={12} className="text-gray-400" />
                                        <span className="text-gray-800 dark:text-gray-100">{timeStr}</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold flex items-center gap-1 ${
                                            isBulk
                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                        }`}>
                                            {isBulk ? <FiUsers size={10} /> : <FiZap size={10} />}
                                            {isBulk ? 'Massa' : 'Único'}
                                        </span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                        isCompleted
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                    }`}>
                                        {isCompleted ? <FiCheckCircle size={10} /> : <FiAlertCircle size={10} />}
                                        {isCompleted ? 'Concluído' : 'Pendente'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-gray-900 dark:text-white truncate">
                                        {event.template_name || event.funnel_name || 'Disparo sem nome'}
                                    </span>
                                    {event.contact_count && (
                                        <span className="text-[11px] text-gray-500 dark:text-gray-400 shrink-0 ml-2">
                                            {event.contact_count} contatos
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DailyAgenda;

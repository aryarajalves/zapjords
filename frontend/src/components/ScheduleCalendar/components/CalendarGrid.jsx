import React from 'react';
import { FiUsers, FiZap } from 'react-icons/fi';

const CalendarGrid = ({
    currentDate,
    events,
    getDaysInMonth,
    getFirstDayOfMonth,
    setSelectedEvent,
    selectedDay = 1,
    setSelectedDay = () => {}
}) => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Preenchimento vazio antes do dia 1
    for (let i = 0; i < firstDay; i++) {
        days.push(
            <div
                key={`empty-${i}`}
                className="min-h-[52px] sm:h-32 bg-gray-50/40 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-700/50"
            />
        );
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEvents = events.filter(e => {
            const d = new Date(e.start);
            return d.getDate() === day &&
                d.getMonth() === currentDate.getMonth() &&
                d.getFullYear() === currentDate.getFullYear();
        }).sort((a, b) => new Date(a.start) - new Date(b.start));

        const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
        const isToday = new Date().toISOString().split('T')[0] === dateStr;
        const isSelected = selectedDay === day;

        days.push(
            <div
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`min-h-[52px] sm:h-32 border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 sm:p-2 cursor-pointer sm:cursor-default overflow-y-auto hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-all group relative ${
                    isSelected
                        ? 'ring-2 ring-blue-500 bg-blue-50/30 dark:bg-blue-900/20 z-10'
                        : isToday
                        ? 'ring-1 ring-blue-400/50'
                        : ''
                }`}
            >
                <div className="flex items-center justify-between">
                    <span
                        className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                            isToday
                                ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                                : isSelected
                                ? 'bg-blue-100 dark:bg-blue-800/70 text-blue-600 dark:text-blue-300 font-extrabold'
                                : 'text-gray-700 dark:text-gray-400'
                        }`}
                    >
                        {day}
                    </span>
                    {dayEvents.length > 0 && (
                        <span className="hidden sm:inline-block text-[10px] text-gray-400 font-bold">
                            {dayEvents.length}
                        </span>
                    )}
                </div>

                {/* Mobile: Indicador compacto de eventos para não achatar texto em 45px */}
                {dayEvents.length > 0 && (
                    <div className="sm:hidden flex items-center justify-center mt-1">
                        <span className={`inline-flex items-center justify-center px-1.5 h-4 min-w-[16px] text-[9px] font-black rounded-full shadow-xs ${
                            isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                        }`}>
                            {dayEvents.length}
                        </span>
                    </div>
                )}

                {/* Desktop: Pílulas completas de eventos */}
                <div className="hidden sm:block space-y-1 mt-1">
                    {dayEvents.map(event => (
                        <button
                            key={event.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                            }}
                            className={`w-full text-left text-[10px] px-2 py-1 rounded border overflow-hidden truncate flex items-center gap-1 shadow-sm transition-all hover:scale-[1.02]
                                bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800
                                ${event.type === 'bulk'
                                    ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800'
                                    : ''}
                                ${event.status === 'completed' ? 'opacity-60 saturate-50' : ''}
                            `}
                        >
                            {event.type === 'bulk' ? <FiUsers size={10} /> : <FiZap size={10} />}
                            <span className="font-semibold">{new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="truncate ml-1">
                                {event.template_name
                                    ? event.template_name
                                    : (event.funnel_name ? event.funnel_name : `${event.contact_count} contatos`)}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto">
            {days}
        </div>
    );
};

export default CalendarGrid;

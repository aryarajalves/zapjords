import React from 'react';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiList } from 'react-icons/fi';

const CalendarHeader = ({
    currentDate,
    eventsCount,
    loading,
    handlePrevMonth,
    handleNextMonth,
    setCurrentDate,
    viewMode = 'calendar',
    setViewMode = () => {}
}) => {
    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3 sm:p-4 gap-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/80">
            <div className="flex items-center justify-between sm:justify-start gap-2">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white capitalize truncate">
                        {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        <span className="text-xs sm:text-sm font-normal text-gray-500 ml-1.5">({eventsCount})</span>
                    </h2>
                    {loading && (
                        <div
                            className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full ml-1 shrink-0"
                            data-testid="loading-spinner"
                        />
                    )}
                </div>

                {/* Alternador de Modo de Visualização no Mobile */}
                <div className="flex sm:hidden p-0.5 bg-gray-200 dark:bg-gray-800 rounded-xl border border-gray-300/60 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={() => setViewMode('calendar')}
                        data-testid="btn-view-calendar"
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            viewMode === 'calendar'
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400'
                        }`}
                        title="Visualização em Calendário"
                    >
                        <FiCalendar size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        data-testid="btn-view-list"
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            viewMode === 'list'
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400'
                        }`}
                        title="Visualização em Lista"
                    >
                        <FiList size={14} />
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2">
                {/* No Desktop: Alternador de visualização Mês / Lista */}
                <div className="hidden sm:flex p-0.5 bg-gray-200 dark:bg-gray-800 rounded-xl border border-gray-300/60 dark:border-gray-700 mr-2">
                    <button
                        type="button"
                        onClick={() => setViewMode('calendar')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            viewMode === 'calendar'
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        <FiCalendar size={13} />
                        <span>Mês</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            viewMode === 'list'
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        <FiList size={13} />
                        <span>Lista</span>
                    </button>
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                    <button
                        onClick={handlePrevMonth}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300 transition"
                        aria-label="Mês anterior"
                    >
                        <FiChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
                    >
                        Hoje
                    </button>
                    <button
                        onClick={handleNextMonth}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300 transition"
                        aria-label="Próximo mês"
                    >
                        <FiChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CalendarHeader;

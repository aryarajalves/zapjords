import React, { useState } from 'react';
import { useCalendarEvents } from './hooks/useCalendarEvents';
import CalendarHeader from './components/CalendarHeader';
import WeekDaysHeader from './components/WeekDaysHeader';
import CalendarGrid from './components/CalendarGrid';
import DailyAgenda from './components/DailyAgenda';
import ScheduleListView from './components/ScheduleListView';
import EventDetailsModal from './components/EventDetailsModal';
import ConfirmModal from '../ConfirmModal';

const ScheduleCalendar = ({ refreshKey }) => {
    const {
        activeClient,
        currentDate,
        setCurrentDate,
        events,
        setEvents,
        loading,
        selectedEvent,
        setSelectedEvent,
        confirmDelete,
        setConfirmDelete,
        isEditing,
        setIsEditing,
        editDate,
        setEditDate,
        editTime,
        setEditTime,
        isSaving,
        getDaysInMonth,
        getFirstDayOfMonth,
        handlePrevMonth,
        handleNextMonth,
        confirmDeleteAction,
        requestDelete,
        handleUpdateEvent
    } = useCalendarEvents(refreshKey);

    const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
    const [selectedDay, setSelectedDay] = useState(new Date().getDate());

    // Disparos do dia selecionado (para exibição na agenda diária no mobile)
    const selectedDayEvents = events.filter(e => {
        const d = new Date(e.start);
        return d.getDate() === selectedDay &&
            d.getMonth() === currentDate.getMonth() &&
            d.getFullYear() === currentDate.getFullYear();
    }).sort((a, b) => new Date(a.start) - new Date(b.start));

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header do Calendário com alternador Mês / Lista */}
            <CalendarHeader
                currentDate={currentDate}
                eventsCount={events.length}
                loading={loading}
                handlePrevMonth={handlePrevMonth}
                handleNextMonth={handleNextMonth}
                setCurrentDate={setCurrentDate}
                viewMode={viewMode}
                setViewMode={setViewMode}
            />

            {viewMode === 'calendar' ? (
                <div className="flex flex-col flex-1 overflow-y-auto">
                    {/* Dias da Semana Header */}
                    <WeekDaysHeader />

                    {/* Grid de Dias */}
                    <CalendarGrid
                        currentDate={currentDate}
                        events={events}
                        getDaysInMonth={getDaysInMonth}
                        getFirstDayOfMonth={getFirstDayOfMonth}
                        setSelectedEvent={setSelectedEvent}
                        selectedDay={selectedDay}
                        setSelectedDay={setSelectedDay}
                    />

                    {/* Agenda Diária Interativa (Mobile) */}
                    <DailyAgenda
                        selectedDay={selectedDay}
                        currentDate={currentDate}
                        dayEvents={selectedDayEvents}
                        onSelectEvent={setSelectedEvent}
                    />
                </div>
            ) : (
                <ScheduleListView
                    currentDate={currentDate}
                    events={events}
                    onSelectEvent={setSelectedEvent}
                />
            )}

            {/* Modal de Detalhes do Evento */}
            {selectedEvent && (
                <EventDetailsModal
                    selectedEvent={selectedEvent}
                    setSelectedEvent={setSelectedEvent}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    editDate={editDate}
                    setEditDate={setEditDate}
                    editTime={editTime}
                    setEditTime={setEditTime}
                    isSaving={isSaving}
                    handleUpdateEvent={handleUpdateEvent}
                    requestDelete={requestDelete}
                    activeClient={activeClient}
                    setEvents={setEvents}
                />
            )}

            {/* Modal de Confirmação de Exclusão */}
            <ConfirmModal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={confirmDeleteAction}
                title="Confirmar Exclusão"
                message={confirmDelete?.event?.status === 'pending'
                    ? "Tem certeza que deseja cancelar este agendamento pendente? Ele não será enviado."
                    : "Tem certeza que deseja remover este registro do histórico? Essa ação é irreversível."}
                confirmText={confirmDelete?.event?.status === 'pending' ? "Cancelar Agendamento" : "Excluir"}
                isDangerous={true}
            />
        </div>
    );
};

export default ScheduleCalendar;

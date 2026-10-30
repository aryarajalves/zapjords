import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BulkTemplateScheduling from './BulkTemplateScheduling';

describe('BulkTemplateScheduling Component', () => {
    it('renderiza os 3 modos de envio: Imediato, Agendar Futuro e Recorrente', () => {
        render(
            <BulkTemplateScheduling
                dispatchMode="immediate"
                setDispatchMode={vi.fn()}
            />
        );

        expect(screen.getByText('Imediato')).toBeInTheDocument();
        expect(screen.getByText('Agendar Futuro')).toBeInTheDocument();
        expect(screen.getByText('Recorrente')).toBeInTheDocument();
        expect(screen.getByText('Envio Imediato')).toBeInTheDocument();
    });

    it('exibe campo de data/hora quando o modo for "scheduled" (Agendar Futuro)', () => {
        const setScheduledDateTime = vi.fn();
        render(
            <BulkTemplateScheduling
                dispatchMode="scheduled"
                setDispatchMode={vi.fn()}
                scheduledDateTime="2026-11-01T14:30"
                setScheduledDateTime={setScheduledDateTime}
            />
        );

        expect(screen.getByText('Data e Horário do Disparo')).toBeInTheDocument();
        expect(screen.getByText('Agendamento Único')).toBeInTheDocument();
    });

    it('exibe opções de frequência, dias da semana e horário quando o modo for "recurring" (Recorrente)', () => {
        const setRecurrenceDaysOfWeek = vi.fn();
        render(
            <BulkTemplateScheduling
                dispatchMode="recurring"
                setDispatchMode={vi.fn()}
                recurrenceFrequency="weekly"
                setRecurrenceFrequency={vi.fn()}
                recurrenceDaysOfWeek={[0, 2]}
                setRecurrenceDaysOfWeek={setRecurrenceDaysOfWeek}
                recurrenceTime="09:00"
                setRecurrenceTime={vi.fn()}
            />
        );

        expect(screen.getByText('Frequência da Recorrência')).toBeInTheDocument();
        expect(screen.getByText('Semanal')).toBeInTheDocument();
        expect(screen.getByText('Mensal')).toBeInTheDocument();
        expect(screen.getByText('Diário')).toBeInTheDocument();
        expect(screen.getByText('Horário de Execução:')).toBeInTheDocument();

        // Clica no dia da semana Quinta (id 3)
        const thursdayBtn = screen.getByTitle('Quinta');
        fireEvent.click(thursdayBtn);
        expect(setRecurrenceDaysOfWeek).toHaveBeenCalledWith([0, 2, 3]);
    });
});

import { describe, it, expect } from 'vitest';
import { EVENT_TYPES, PLATFORM_EVENT_TYPES, BODY_VAR_OPTIONS } from './constants';
import { PLATFORM_OPTIONS } from './components/IntegrationFormModal/constants';
import { EVENT_HINTS } from './components/MappingsConfig/MappingItem/eventHints';

describe('Formulario Personalizado Integration Constants and Platform Configuration', () => {
  it('should include Formulario Personalizado in PLATFORM_OPTIONS with proper label', () => {
    const platform = PLATFORM_OPTIONS.find(p => p.value === 'formulario_personalizado');
    expect(platform).toBeDefined();
    expect(platform?.label).toBe('Formulário Personalizado');
  });

  it('should include formulario and booking reminder events in EVENT_TYPES', () => {
    const formEvent = EVENT_TYPES.find(e => e.value === 'formulario');
    expect(formEvent).toBeDefined();
    expect(formEvent?.label).toBe('Formulário');

    const morningEvent = EVENT_TYPES.find(e => e.value === 'booking_reminder_morning');
    expect(morningEvent).toBeDefined();
    expect(morningEvent?.label).toBe('Lembrete de Agendamento (Manhã do Dia)');

    const beforeMeetingEvent = EVENT_TYPES.find(e => e.value === 'booking_reminder_before_meeting');
    expect(beforeMeetingEvent).toBeDefined();
    expect(beforeMeetingEvent?.label).toBe('Lembrete de Agendamento (Antes da Reunião)');
  });

  it('should define allowed event types for formulario_personalizado platform including booking reminders', () => {
    expect(PLATFORM_EVENT_TYPES.formulario_personalizado).toBeDefined();
    expect(PLATFORM_EVENT_TYPES.formulario_personalizado).toContain('formulario');
    expect(PLATFORM_EVENT_TYPES.formulario_personalizado).toContain('form_submission');
    expect(PLATFORM_EVENT_TYPES.formulario_personalizado).toContain('booking_reminder_morning');
    expect(PLATFORM_EVENT_TYPES.formulario_personalizado).toContain('booking_reminder_before_meeting');
    expect(PLATFORM_EVENT_TYPES.formulario_personalizado).toContain('outros');
  });

  it('should include Formulario and Booking variables in BODY_VAR_OPTIONS', () => {
    const varKeys = BODY_VAR_OPTIONS.map(v => v.value);
    expect(varKeys).toContain('form_id');
    expect(varKeys).toContain('form_slug');
    expect(varKeys).toContain('form_title');
    expect(varKeys).toContain('formatted_datetime');
    expect(varKeys).toContain('scheduled_for');
    expect(varKeys).toContain('reminder_label');
    expect(varKeys).toContain('minutes_before');
    expect(varKeys).toContain('scheduled_datetime');
  });

  it('should define descriptive hints for formulario and booking reminder events', () => {
    expect(EVENT_HINTS.formulario).toBeDefined();
    expect(EVENT_HINTS.formulario).toContain('Formulário Personalizado');

    expect(EVENT_HINTS.booking_reminder_morning).toBeDefined();
    expect(EVENT_HINTS.booking_reminder_morning).toContain('manhã');

    expect(EVENT_HINTS.booking_reminder_before_meeting).toBeDefined();
    expect(EVENT_HINTS.booking_reminder_before_meeting).toContain('minutos antes');
  });
});

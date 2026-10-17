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

  it('should include formulario in EVENT_TYPES', () => {
    const formEvent = EVENT_TYPES.find(e => e.value === 'formulario');
    expect(formEvent).toBeDefined();
    expect(formEvent?.label).toBe('Formulário');
  });

  it('should define allowed event types for formulario_personalizado platform', () => {
    expect(PLATFORM_EVENT_TYPES.formulario_personalizado).toBeDefined();
    expect(PLATFORM_EVENT_TYPES.formulario_personalizado).toContain('formulario');
    expect(PLATFORM_EVENT_TYPES.formulario_personalizado).toContain('form_submission');
    expect(PLATFORM_EVENT_TYPES.formulario_personalizado).toContain('outros');
  });

  it('should include Formulario variables in BODY_VAR_OPTIONS', () => {
    const varKeys = BODY_VAR_OPTIONS.map(v => v.value);
    expect(varKeys).toContain('form_id');
    expect(varKeys).toContain('form_slug');
    expect(varKeys).toContain('form_title');
  });

  it('should define descriptive hint for formulario event mentioning Formulario Personalizado', () => {
    expect(EVENT_HINTS.formulario).toBeDefined();
    expect(EVENT_HINTS.formulario).toContain('Formulário Personalizado');
  });
});

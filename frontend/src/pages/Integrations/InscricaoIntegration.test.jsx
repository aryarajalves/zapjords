import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EVENT_TYPES, PLATFORM_EVENT_TYPES } from './constants';
import { EVENT_HINTS } from './components/MappingsConfig/MappingItem/eventHints';
import TriggerTabContent from './components/MappingsConfig/MappingItem/TriggerTabContent';

describe('Inscrição Trigger Integration', () => {
  it('should include inscricao in EVENT_TYPES with label Inscrição', () => {
    const inscricaoEvent = EVENT_TYPES.find(e => e.value === 'inscricao');
    expect(inscricaoEvent).toBeDefined();
    expect(inscricaoEvent?.label).toBe('Inscrição');
  });

  it('should include inscricao in PLATFORM_EVENT_TYPES for platform outra', () => {
    expect(PLATFORM_EVENT_TYPES.outra).toBeDefined();
    expect(PLATFORM_EVENT_TYPES.outra).toContain('inscricao');
  });

  it('should include inscricao in other form/capture platforms', () => {
    expect(PLATFORM_EVENT_TYPES.formulario_personalizado).toContain('inscricao');
    expect(PLATFORM_EVENT_TYPES.elementor).toContain('inscricao');
    expect(PLATFORM_EVENT_TYPES.yayforms).toContain('inscricao');
    expect(PLATFORM_EVENT_TYPES.zapgroup).toContain('inscricao');
  });

  it('should have an informative hint in EVENT_HINTS for inscricao', () => {
    expect(EVENT_HINTS.inscricao).toBeDefined();
    expect(EVENT_HINTS.inscricao).toContain('inscrição');
  });

  it('should render allowedEvents containing Inscrição when platform is outra in TriggerTabContent', () => {
    const allowedEvents = EVENT_TYPES.filter(e => PLATFORM_EVENT_TYPES.outra.includes(e.value));
    const inscricaoOption = allowedEvents.find(e => e.value === 'inscricao');
    expect(inscricaoOption).toBeDefined();
    expect(inscricaoOption.label).toBe('Inscrição');

    const mockMapping = {
      event_type: 'inscricao',
      template_id: null,
      variables_mapping: []
    };

    render(
      <TriggerTabContent
        mapping={mockMapping}
        mIndex={0}
        updateMapping={vi.fn()}
        templates={[]}
        funnels={[]}
        discoveredProducts={[]}
        platform="outra"
        allowedEvents={allowedEvents}
        selectedTpl={null}
        templateButtons={[]}
        integrationId="test-id"
        onGoToButtonsTab={vi.fn()}
      />
    );

    // O SearchableSelect exibe o label do valor atual ('Inscrição')
    expect(screen.getByText('Inscrição')).toBeInTheDocument();
  });
});

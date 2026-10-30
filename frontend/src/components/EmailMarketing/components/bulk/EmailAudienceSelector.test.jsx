import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import EmailAudienceSelector from './EmailAudienceSelector';

describe('EmailAudienceSelector Component', () => {
  const defaultProps = {
    audienceType: 'tags',
    setAudienceType: vi.fn(),
    availableTags: ['vip', 'promo', 'leads_novos'],
    selectedTag: '',
    onSelectTag: vi.fn(),
    selectedPipeline: '',
    setSelectedPipeline: vi.fn(),
    selectedStage: '',
    setSelectedStage: vi.fn(),
    manualText: '',
    setManualText: vi.fn(),
    onManualChange: vi.fn(),
    activeClient: { id: 1, name: 'Empresa Teste' },
    getHeaders: vi.fn(() => ({ Authorization: 'Bearer test' }))
  };

  it('renderiza os 3 botões de tipo de audiência', () => {
    render(<EmailAudienceSelector {...defaultProps} />);

    expect(screen.getByText(/Contatos & Etiquetas/i)).toBeInTheDocument();
    expect(screen.getByText(/Kanban de Vendas/i)).toBeInTheDocument();
    expect(screen.getByText(/Importar CSV \/ Lista/i)).toBeInTheDocument();
  });

  it('permite alternar para modo Kanban ao clicar', () => {
    render(<EmailAudienceSelector {...defaultProps} />);

    fireEvent.click(screen.getByText(/Kanban de Vendas/i));
    expect(defaultProps.setAudienceType).toHaveBeenCalledWith('kanban');
  });

  it('permite alternar para modo Manual / CSV ao clicar', () => {
    render(<EmailAudienceSelector {...defaultProps} />);

    fireEvent.click(screen.getByText(/Importar CSV \/ Lista/i));
    expect(defaultProps.setAudienceType).toHaveBeenCalledWith('manual');
  });

  it('renderiza textarea quando o tipo é manual', () => {
    render(<EmailAudienceSelector {...defaultProps} audienceType="manual" />);

    expect(screen.getByPlaceholderText(/carlos@email.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Subir CSV \/ TXT/i)).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TemplateSelectionSection from './TemplateSelectionSection';

// Mocks de componentes filhos e utilitários
vi.mock('../common/TemplatePreview', () => ({
  default: () => <div data-testid="template-preview-mock">Template Preview Mock</div>,
}));

vi.mock('../common/MediaHeaderUploader', () => ({
  default: () => <div data-testid="media-header-mock">Media Header Mock</div>,
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../AuthContext', () => ({
  fetchWithAuth: vi.fn(),
}));

vi.mock('../../../config', () => ({
  API_URL: 'http://localhost:8000',
}));

describe('TemplateSelectionSection', () => {
  const mockTemplates = [
    {
      name: 'compra_aprovada_astrowake',
      category: 'MARKETING',
      status: 'APPROVED',
      language: 'pt_BR',
      components: [{ type: 'BODY', text: 'Olá {{1}}' }]
    },
    {
      name: 'lembrete_consulta',
      category: 'UTILITY',
      status: 'APPROVED',
      language: 'pt_BR',
      components: [{ type: 'BODY', text: 'Lembrete de consulta' }]
    }
  ];

  const defaultProps = {
    selectedTemplate: 'compra_aprovada_astrowake',
    templates: mockTemplates,
    isLoadingTemplates: false,
    templateSearch: '',
    setTemplateSearch: vi.fn(),
    isTemplateDropdownOpen: false,
    setIsTemplateDropdownOpen: vi.fn(),
    handleTemplateChange: vi.fn(),
    selectedTemplateObj: mockTemplates[0],
    templateParams: {},
    handleParamChange: vi.fn(),
    openExpansion: false,
  };

  it('renderiza o badge e botão Resetar Janela de 24h com classes responsivas e sem quebra', () => {
    render(<TemplateSelectionSection {...defaultProps} />);

    // Nome do template com truncate
    const templateNameEl = screen.getByText('compra_aprovada_astrowake');
    expect(templateNameEl).toBeDefined();
    expect(templateNameEl.className).toContain('truncate');

    // Categoria do template
    expect(screen.getByText('MARKETING')).toBeDefined();

    // Botão Resetar Janela de 24h
    const resetBtn = screen.getByRole('button', { name: /Resetar Janela de 24h/i });
    expect(resetBtn).toBeDefined();

    // Verifica que o botão contém as classes anti-estrangulamento e responsivas
    expect(resetBtn.className).toContain('shrink-0');
    expect(resetBtn.className).toContain('whitespace-nowrap');
    expect(resetBtn.className).toContain('cursor-pointer');
  });

  it('abre o modal de confirmação ao clicar no botão Resetar Janela de 24h', () => {
    render(<TemplateSelectionSection {...defaultProps} />);

    const resetBtn = screen.getByRole('button', { name: /Resetar Janela de 24h/i });
    fireEvent.click(resetBtn);

    // O ConfirmationDialog deve ser exibido com o título e mensagem
    expect(screen.getByText('Zerar Janela de 24h')).toBeDefined();
    expect(screen.getByText(/Deseja zerar a restrição de 24h para o template "compra_aprovada_astrowake"?/i)).toBeDefined();
    expect(screen.getByText('Sim, Zerar Restrição')).toBeDefined();
  });

  it('chama setIsTemplateDropdownOpen ao clicar no dropdown de seleção', () => {
    const setIsTemplateDropdownOpen = vi.fn();
    render(
      <TemplateSelectionSection
        {...defaultProps}
        setIsTemplateDropdownOpen={setIsTemplateDropdownOpen}
      />
    );

    const trigger = screen.getByText('compra_aprovada_astrowake (Marketing)').closest('div');
    if (trigger) {
      fireEvent.click(trigger);
      expect(setIsTemplateDropdownOpen).toHaveBeenCalled();
    }
  });
});

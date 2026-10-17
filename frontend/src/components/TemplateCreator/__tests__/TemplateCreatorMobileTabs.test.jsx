import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TemplateCreator from '../index';
import { useTemplateCreator } from '../hooks/useTemplateCreator';

// Mock dos hooks e subcomponentes
vi.mock('../hooks/useTemplateCreator');
vi.mock('../components/TemplateForm', () => ({
    default: () => <div data-testid="mock-template-form">Template Form Mock</div>
}));
vi.mock('../components/TemplateList', () => ({
    default: () => <div data-testid="mock-template-list">Template List Mock</div>
}));
vi.mock('../components/Modals', () => ({
    default: () => <div data-testid="mock-modals" />
}));
vi.mock('../components/TemplateGuide', () => ({
    default: () => <div data-testid="mock-guide" />
}));
vi.mock('../components/TemplateAssistant', () => ({
    default: () => <div data-testid="mock-assistant" />
}));

describe('TemplateCreator - Sistema de Abas Mobile', () => {
    const mockLogic = {
        editingId: null,
        templates: [
            { id: 1, name: 'template_1', is_archived: false },
            { id: 2, name: 'template_2', is_archived: false },
            { id: 3, name: 'template_3', is_archived: true }
        ],
        loading: false,
        isGuideOpen: false,
        setIsGuideOpen: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useTemplateCreator.mockReturnValue(mockLogic);
    });

    it('renderiza os botões das abas mobile com o badge de contagem correta', () => {
        render(<TemplateCreator onSuccess={vi.fn()} refreshKey={1} />);

        const createTab = screen.getByTestId('tab-create-template');
        const listTab = screen.getByTestId('tab-my-templates');

        expect(createTab).toBeInTheDocument();
        expect(createTab).toHaveTextContent('Criar Template');

        expect(listTab).toBeInTheDocument();
        expect(listTab).toHaveTextContent('Meus Templates');
        // Apenas 2 templates não arquivados
        expect(listTab).toHaveTextContent('2');
    });

    it('inicia na aba de criação por padrão (formulário visível, lista oculta no mobile)', () => {
        render(<TemplateCreator onSuccess={vi.fn()} refreshKey={1} />);

        const formWrapper = screen.getByTestId('mock-template-form').parentElement;
        const listWrapper = screen.getByTestId('mock-template-list').parentElement;

        expect(formWrapper.className).toContain('block');
        expect(listWrapper.className).toContain('hidden');
    });

    it('alterna para a lista ao clicar na aba "Meus Templates"', () => {
        render(<TemplateCreator onSuccess={vi.fn()} refreshKey={1} />);

        const listTab = screen.getByTestId('tab-my-templates');
        fireEvent.click(listTab);

        const formWrapper = screen.getByTestId('mock-template-form').parentElement;
        const listWrapper = screen.getByTestId('mock-template-list').parentElement;

        expect(formWrapper.className).toContain('hidden');
        expect(listWrapper.className).toContain('block');
    });

    it('retorna para o formulário ao clicar na aba "Criar Template"', () => {
        render(<TemplateCreator onSuccess={vi.fn()} refreshKey={1} />);

        // Muda para a lista
        fireEvent.click(screen.getByTestId('tab-my-templates'));
        // Volta para a criação
        fireEvent.click(screen.getByTestId('tab-create-template'));

        const formWrapper = screen.getByTestId('mock-template-form').parentElement;
        const listWrapper = screen.getByTestId('mock-template-list').parentElement;

        expect(formWrapper.className).toContain('block');
        expect(listWrapper.className).toContain('hidden');
    });

    it('muda automaticamente para aba de edição quando logic.editingId é ativado', () => {
        const { rerender } = render(<TemplateCreator onSuccess={vi.fn()} refreshKey={1} />);

        // Simula que o usuário estava na aba da lista
        fireEvent.click(screen.getByTestId('tab-my-templates'));
        expect(screen.getByTestId('mock-template-form').parentElement.className).toContain('hidden');

        // Usuário clicou em Editar em algum template da lista
        useTemplateCreator.mockReturnValue({
            ...mockLogic,
            editingId: 1
        });

        rerender(<TemplateCreator onSuccess={vi.fn()} refreshKey={1} />);

        // A aba deve voltar a ser a de formulário e o texto deve ser "Editar Template"
        const createTab = screen.getByTestId('tab-create-template');
        expect(createTab).toHaveTextContent('Editar Template');

        const formWrapper = screen.getByTestId('mock-template-form').parentElement;
        expect(formWrapper.className).toContain('block');
    });

    it('preserva as classes de desktop (lg:block lg:col-span-8 e lg:col-span-4)', () => {
        render(<TemplateCreator onSuccess={vi.fn()} refreshKey={1} />);

        const formWrapper = screen.getByTestId('mock-template-form').parentElement;
        const listWrapper = screen.getByTestId('mock-template-list').parentElement;

        expect(formWrapper.className).toContain('lg:block');
        expect(formWrapper.className).toContain('lg:col-span-8');

        expect(listWrapper.className).toContain('lg:block');
        expect(listWrapper.className).toContain('lg:col-span-4');
    });
});

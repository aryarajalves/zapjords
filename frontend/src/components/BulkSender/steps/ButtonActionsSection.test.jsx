import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ButtonActionsSection from './ButtonActionsSection';

describe('ButtonActionsSection Component Tests', () => {
    const mockButtons = ['Me conta', 'Sair da lista'];
    const mockFunnels = [
        { id: 1, name: 'Funil de Vendas' },
        { id: 2, name: 'Funil de Despedida' }
    ];

    it('retorna null se não houver botões no template', () => {
        const { container } = render(
            <ButtonActionsSection
                templateButtons={[]}
                buttonActions={{}}
                setButtonActions={vi.fn()}
                funnels={mockFunnels}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renderiza a enumeração do cabeçalho da seção (badge 03) e título', () => {
        render(
            <ButtonActionsSection
                templateButtons={mockButtons}
                buttonActions={{}}
                setButtonActions={vi.fn()}
                funnels={mockFunnels}
                stepNumber="03"
            />
        );

        expect(screen.getByText('03')).toBeInTheDocument();
        expect(screen.getByText('Ação dos Botões (Template Principal)')).toBeInTheDocument();
    });

    it('renderiza a enumeração individual dos botões (#1 e #2)', () => {
        render(
            <ButtonActionsSection
                templateButtons={mockButtons}
                buttonActions={{}}
                setButtonActions={vi.fn()}
                funnels={mockFunnels}
            />
        );

        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('Me conta')).toBeInTheDocument();

        expect(screen.getByText('#2')).toBeInTheDocument();
        expect(screen.getByText('Sair da lista')).toBeInTheDocument();
    });

    it('permite alternar ação do botão para Interação ou Bloqueio', () => {
        const setButtonActions = vi.fn();
        render(
            <ButtonActionsSection
                templateButtons={mockButtons}
                buttonActions={{}}
                setButtonActions={setButtonActions}
                funnels={mockFunnels}
            />
        );

        const interactionBtns = screen.getAllByRole('button', { name: /interação/i });
        fireEvent.click(interactionBtns[0]);

        expect(setButtonActions).toHaveBeenCalled();
    });

    it('permite alternar o agente de IA', () => {
        const setButtonActions = vi.fn();
        render(
            <ButtonActionsSection
                templateButtons={mockButtons}
                buttonActions={{ 'Me conta': { type: 'interaction', funnel_id: 1, activate_agent: false } }}
                setButtonActions={setButtonActions}
                funnels={mockFunnels}
            />
        );

        const aiBtn = screen.getAllByRole('button', { name: /ativar agente de ia/i })[0];
        fireEvent.click(aiBtn);

        expect(setButtonActions).toHaveBeenCalled();
    });

    it('não aplica overflow-hidden na section para evitar corte do dropdown de funis e define z-20', () => {
        const { container } = render(
            <ButtonActionsSection
                templateButtons={mockButtons}
                buttonActions={{}}
                setButtonActions={vi.fn()}
                funnels={mockFunnels}
            />
        );

        const section = container.querySelector('section');
        expect(section).toBeInTheDocument();
        expect(section.className).not.toContain('overflow-hidden');
        expect(section.className).toContain('z-20');

        // Camada interna para brilhos deve ter overflow-hidden
        const innerGlowWrapper = container.querySelector('.rounded-\\[2\\.5rem\\].overflow-hidden');
        expect(innerGlowWrapper).toBeInTheDocument();
    });
});

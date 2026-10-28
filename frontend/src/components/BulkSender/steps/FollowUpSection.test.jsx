import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FollowUpSection from './FollowUpSection';

describe('FollowUpSection Component Tests', () => {
    const mockTemplates = [
        {
            name: 'template_oferta',
            category: 'MARKETING',
            language: 'pt_BR',
            components: [
                {
                    type: 'BUTTONS',
                    buttons: [
                        { type: 'QUICK_REPLY', text: 'Quero Desconto' },
                        { type: 'QUICK_REPLY', text: 'Não tenho interesse' }
                    ]
                }
            ]
        }
    ];

    const mockFunnels = [
        { id: 10, name: 'Funil Black Friday' }
    ];

    it('deve renderizar o cabeçalho com badge 03 e estar desativado inicialmente', () => {
        render(
            <FollowUpSection
                isFollowupEnabled={false}
                setIsFollowupEnabled={vi.fn()}
                followups={[]}
                setFollowups={vi.fn()}
                stopTags={[]}
                setStopTags={vi.fn()}
                templates={mockTemplates}
                funnels={mockFunnels}
            />
        );

        expect(screen.getByText('03')).toBeDefined();
        expect(screen.getByText('Sequência de Follow-up')).toBeDefined();
        expect(screen.getByText('Desativado')).toBeDefined();
    });

    it('deve chamar setIsFollowupEnabled(true) e inicializar primeira etapa ao clicar no toggle', () => {
        const setIsFollowupEnabled = vi.fn();
        const setFollowups = vi.fn();

        render(
            <FollowUpSection
                isFollowupEnabled={false}
                setIsFollowupEnabled={setIsFollowupEnabled}
                followups={[]}
                setFollowups={setFollowups}
                stopTags={[]}
                setStopTags={vi.fn()}
                templates={mockTemplates}
                funnels={mockFunnels}
            />
        );

        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);

        expect(setIsFollowupEnabled).toHaveBeenCalledWith(true);
        expect(setFollowups).toHaveBeenCalled();
    });

    it('quando ativado, deve exibir regras de qualificação, gerenciador de tags e etapas', () => {
        const followups = [
            {
                id: 1,
                template_name: 'template_oferta',
                language: 'pt_BR',
                schedule_type: 'relative',
                relative_delay_hours: 24,
                button_actions: {}
            }
        ];

        render(
            <FollowUpSection
                isFollowupEnabled={true}
                setIsFollowupEnabled={vi.fn()}
                followups={followups}
                setFollowups={vi.fn()}
                stopTags={['comprou']}
                setStopTags={vi.fn()}
                templates={mockTemplates}
                funnels={mockFunnels}
                chatwootLabels={['vip', 'duvidas']}
            />
        );

        expect(screen.getByText('Ativado')).toBeDefined();
        expect(screen.getByText('Regras Automáticas de Qualificação e Parada')).toBeDefined();
        expect(screen.getByText('comprou')).toBeDefined();
        expect(screen.getByText('Follow-up Etapa 1')).toBeDefined();
        expect(screen.getByText('Quero Desconto')).toBeDefined();
        expect(screen.getByText('Não tenho interesse')).toBeDefined();
    });

    it('ao clicar ou focar no input de etiquetas de parada, deve abrir o dropdown com as opções', () => {
        const setStopTags = vi.fn();

        render(
            <FollowUpSection
                isFollowupEnabled={true}
                setIsFollowupEnabled={vi.fn()}
                followups={[]}
                setFollowups={vi.fn()}
                stopTags={[]}
                setStopTags={setStopTags}
                templates={mockTemplates}
                funnels={mockFunnels}
                chatwootLabels={['vip', 'duvidas']}
            />
        );

        const input = screen.getByPlaceholderText(/ver etiquetas ou digite para filtrar/i);
        fireEvent.focus(input);

        // Deve exibir as opções no dropdown
        expect(screen.getByText('vip')).toBeDefined();
        expect(screen.getByText('duvidas')).toBeDefined();

        // Clicar em uma opção deve chamar setStopTags
        fireEvent.mouseDown(screen.getByText('vip'));
        expect(setStopTags).toHaveBeenCalled();
    });

    it('deve permitir adicionar nova etiqueta personalizada via botão Adicionar', () => {
        const setStopTags = vi.fn();

        render(
            <FollowUpSection
                isFollowupEnabled={true}
                setIsFollowupEnabled={vi.fn()}
                followups={[]}
                setFollowups={vi.fn()}
                stopTags={[]}
                setStopTags={setStopTags}
                templates={mockTemplates}
                funnels={mockFunnels}
            />
        );

        const input = screen.getByPlaceholderText(/ver etiquetas ou digite para filtrar/i);
        fireEvent.change(input, { target: { value: 'cliente_fechado' } });

        const addBtn = screen.getByText('Adicionar');
        fireEvent.click(addBtn);

        expect(setStopTags).toHaveBeenCalled();
    });

    it('deve chamar setFollowups ao clicar em Adicionar Follow-up', () => {
        const setFollowups = vi.fn();

        render(
            <FollowUpSection
                isFollowupEnabled={true}
                setIsFollowupEnabled={vi.fn()}
                followups={[
                    {
                        id: 1,
                        template_name: 'template_oferta',
                        language: 'pt_BR',
                        schedule_type: 'relative',
                        relative_delay_hours: 24,
                        button_actions: {}
                    }
                ]}
                setFollowups={setFollowups}
                stopTags={[]}
                setStopTags={vi.fn()}
                templates={mockTemplates}
                funnels={mockFunnels}
            />
        );

        const addStepBtn = screen.getByText('Adicionar Follow-up');
        fireEvent.click(addStepBtn);

        expect(setFollowups).toHaveBeenCalled();
    });

    it('deve exibir seletor de funil pesquisável quando a ação do botão for bloqueio no follow-up', () => {
        const followups = [
            {
                id: 1,
                template_name: 'template_oferta',
                language: 'pt_BR',
                schedule_type: 'relative',
                relative_delay_hours: 24,
                button_actions: {
                    'Não tenho interesse': { type: 'block', funnel_id: null, activate_agent: false }
                }
            }
        ];

        render(
            <FollowUpSection
                isFollowupEnabled={true}
                setIsFollowupEnabled={vi.fn()}
                followups={followups}
                setFollowups={vi.fn()}
                stopTags={[]}
                setStopTags={vi.fn()}
                templates={mockTemplates}
                funnels={mockFunnels}
            />
        );

        // Deve exibir o seletor de funil mesmo sendo bloqueio
        expect(screen.getByText('Funil a disparar —')).toBeDefined();
        expect(screen.getByText('Nenhum funil (apenas bloquear contato)')).toBeDefined();
        expect(screen.getByText(/O contato será adicionado à lista de bloqueados automaticamente/i)).toBeDefined();

        // Ao clicar para abrir o dropdown de funil, deve listar o funil disponível
        const funnelTrigger = screen.getByText('Nenhum funil (apenas bloquear contato)');
        fireEvent.click(funnelTrigger);
        expect(screen.getByText('Funil Black Friday')).toBeDefined();
    });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FollowUpTemplateSelect from './FollowUpTemplateSelect';

describe('FollowUpTemplateSelect Component Tests', () => {
    const mockTemplates = [
        {
            name: 'template_comum',
            category: 'MARKETING',
            language: 'pt_BR',
            is_pinned: false
        },
        {
            name: 'template_vip_destaque',
            category: 'UTILITY',
            language: 'pt_BR',
            is_pinned: true
        },
        {
            name: 'template_promo',
            category: 'MARKETING',
            language: 'pt_BR',
            is_pinned: false
        }
    ];

    it('deve renderizar placeholder quando nenhum template estiver selecionado', () => {
        render(
            <FollowUpTemplateSelect
                selectedTemplateName=""
                templates={mockTemplates}
                onSelectTemplate={vi.fn()}
            />
        );

        expect(screen.getByText('Selecione o template do follow-up...')).toBeDefined();
    });

    it('deve exibir o nome do template selecionado e badge de fixado se for pinned', () => {
        render(
            <FollowUpTemplateSelect
                selectedTemplateName="template_vip_destaque"
                templates={mockTemplates}
                onSelectTemplate={vi.fn()}
            />
        );

        expect(screen.getByText('template_vip_destaque')).toBeDefined();
        expect(screen.getByText('📌 Fixado')).toBeDefined();
    });

    it('ao abrir dropdown, deve destacar templates fixados no topo', () => {
        render(
            <FollowUpTemplateSelect
                selectedTemplateName=""
                templates={mockTemplates}
                onSelectTemplate={vi.fn()}
            />
        );

        const trigger = screen.getByRole('button');
        fireEvent.click(trigger);

        expect(screen.getByText('Templates Fixados (1)')).toBeDefined();
        expect(screen.getByText('Outros Templates (2)')).toBeDefined();
    });

    it('deve filtrar templates em tempo real ao digitar na busca', () => {
        render(
            <FollowUpTemplateSelect
                selectedTemplateName=""
                templates={mockTemplates}
                onSelectTemplate={vi.fn()}
            />
        );

        const trigger = screen.getByRole('button');
        fireEvent.click(trigger);

        const searchInput = screen.getByPlaceholderText('Digitar para filtrar templates...');
        fireEvent.change(searchInput, { target: { value: 'promo' } });

        expect(screen.getByText('template_promo')).toBeDefined();
        expect(screen.queryByText('template_comum')).toBeNull();
    });

    it('deve chamar onSelectTemplate ao clicar em um template da lista', () => {
        const onSelect = vi.fn();
        render(
            <FollowUpTemplateSelect
                selectedTemplateName=""
                templates={mockTemplates}
                onSelectTemplate={onSelect}
            />
        );

        const trigger = screen.getByRole('button');
        fireEvent.click(trigger);

        const item = screen.getByText('template_promo');
        fireEvent.click(item);

        expect(onSelect).toHaveBeenCalledWith('template_promo', 'pt_BR');
    });
});

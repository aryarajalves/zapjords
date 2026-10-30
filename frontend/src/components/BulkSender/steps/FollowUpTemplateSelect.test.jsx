import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FollowUpTemplateSelect from './FollowUpTemplateSelect';

describe('FollowUpTemplateSelect Component Tests', () => {
    const mockTemplates = [
        {
            id: '10',
            name: 'bussola_antiga',
            created_at: '2026-08-01T10:00:00Z',
            status: 'APPROVED',
            category: 'MARKETING'
        },
        {
            id: '50',
            name: 'template_criado_por_ultimo',
            created_at: '2026-10-28T12:00:00Z',
            status: 'APPROVED',
            category: 'MARKETING'
        },
        {
            id: '30',
            name: 'template_intermediario',
            created_at: '2026-09-15T15:00:00Z',
            status: 'APPROVED',
            category: 'MARKETING'
        },
        {
            id: '99',
            name: 'template_fixado_importante',
            created_at: '2026-07-01T10:00:00Z',
            is_pinned: true,
            status: 'APPROVED',
            category: 'MARKETING'
        }
    ];

    it('renderiza os templates ordenando os criados por último primeiro (e fixados no topo)', () => {
        const onSelect = vi.fn();
        render(
            <FollowUpTemplateSelect
                templates={mockTemplates}
                selectedTemplateName=""
                onSelectTemplate={onSelect}
                placeholder="Selecione um template..."
            />
        );

        // Abre o dropdown
        const trigger = screen.getByText('Selecione um template...');
        fireEvent.click(trigger);

        // Deve exibir os fixados destacados
        expect(screen.getByText(/templates fixados/i)).toBeInTheDocument();
        expect(screen.getByText('template_fixado_importante')).toBeInTheDocument();

        // Pega todos os botões de opção dentro do container de opções
        const optionButtons = screen.getAllByRole('button');
        const optionTexts = optionButtons.map(b => b.textContent || '');

        // O template criado por último (28/10/2026) deve aparecer antes do intermediário (15/09) e da antiga (01/08)
        const idxUltimo = optionTexts.findIndex(t => t.includes('template_criado_por_ultimo'));
        const idxIntermediario = optionTexts.findIndex(t => t.includes('template_intermediario'));
        const idxAntiga = optionTexts.findIndex(t => t.includes('bussola_antiga'));

        expect(idxUltimo).toBeGreaterThan(-1);
        expect(idxIntermediario).toBeGreaterThan(-1);
        expect(idxAntiga).toBeGreaterThan(-1);

        expect(idxUltimo).toBeLessThan(idxIntermediario);
        expect(idxIntermediario).toBeLessThan(idxAntiga);
    });

    it('permite filtrar templates pela busca e selecionar um template', () => {
        const onSelect = vi.fn();
        render(
            <FollowUpTemplateSelect
                templates={mockTemplates}
                selectedTemplateName=""
                onSelectTemplate={onSelect}
            />
        );

        fireEvent.click(screen.getByText(/selecione o template/i));

        const searchInput = screen.getByPlaceholderText(/digitar para filtrar/i);
        fireEvent.change(searchInput, { target: { value: 'ultimo' } });

        expect(screen.getByText('template_criado_por_ultimo')).toBeInTheDocument();
        expect(screen.queryByText('bussola_antiga')).not.toBeInTheDocument();

        fireEvent.click(screen.getByText('template_criado_por_ultimo'));
        expect(onSelect).toHaveBeenCalledWith('template_criado_por_ultimo', 'pt_BR');
    });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchableFunnelSelect from './SearchableFunnelSelect';

describe('SearchableFunnelSelect Component Tests', () => {
    const mockFunnels = [
        { id: 1, name: 'Funil Onboarding', tag: 'lead', is_pinned: false },
        { id: 2, name: 'Funil Black Friday', tag: 'promo', is_pinned: true },
        { id: 3, name: 'Funil Despedida / Opt-out', tag: 'cancelamento', is_pinned: false }
    ];

    it('deve renderizar emptyLabel quando nenhum funil estiver selecionado', () => {
        render(
            <SearchableFunnelSelect
                value={null}
                onChange={vi.fn()}
                funnels={mockFunnels}
                emptyLabel="Nenhum funil (apenas registrar clique)"
            />
        );

        expect(screen.getByText('Nenhum funil (apenas registrar clique)')).toBeDefined();
    });

    it('deve exibir o nome do funil selecionado com tag e badge de fixado', () => {
        render(
            <SearchableFunnelSelect
                value={2}
                onChange={vi.fn()}
                funnels={mockFunnels}
            />
        );

        expect(screen.getByText('Funil Black Friday')).toBeDefined();
        expect(screen.getByText('promo')).toBeDefined();
        expect(screen.getByText('📌')).toBeDefined();
    });

    it('ao abrir o seletor, deve priorizar funis fixados no topo', () => {
        render(
            <SearchableFunnelSelect
                value={null}
                onChange={vi.fn()}
                funnels={mockFunnels}
            />
        );

        const trigger = screen.getByTitle('Clique para pesquisar ou trocar de funil');
        fireEvent.click(trigger);

        expect(screen.getByText('Fixados (1)')).toBeDefined();
        expect(screen.getByText('Outros Funis (2)')).toBeDefined();
    });

    it('deve filtrar funis em tempo real ao digitar na busca', () => {
        render(
            <SearchableFunnelSelect
                value={null}
                onChange={vi.fn()}
                funnels={mockFunnels}
            />
        );

        const trigger = screen.getByTitle('Clique para pesquisar ou trocar de funil');
        fireEvent.click(trigger);

        const searchInput = screen.getByPlaceholderText('Pesquisar funil por nome ou tag...');
        fireEvent.change(searchInput, { target: { value: 'Despedida' } });

        expect(screen.getByText('Funil Despedida / Opt-out')).toBeDefined();
        expect(screen.queryByText('Funil Onboarding')).toBeNull();
    });

    it('deve chamar onChange com o ID selecionado', () => {
        const handleChange = vi.fn();
        render(
            <SearchableFunnelSelect
                value={null}
                onChange={handleChange}
                funnels={mockFunnels}
            />
        );

        const trigger = screen.getByTitle('Clique para pesquisar ou trocar de funil');
        fireEvent.click(trigger);

        const item = screen.getByText('Funil Despedida / Opt-out');
        fireEvent.click(item);

        expect(handleChange).toHaveBeenCalledWith(3);
    });
});

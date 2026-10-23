import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { KanbanCard } from '../components/KanbanCard';

const mockDeal = {
    id: 101,
    contact_name: 'Lucas Silva',
    contact_phone: '5511999998888',
    channel: 'kiwify',
    title: 'Oportunidade Curso',
    product_name: 'Mentoria Elite',
    original_value: 5000.0,
    value: 4200.0,
    status: 'open',
    notes: 'Negociação avançada'
};

describe('KanbanCard Component', () => {
    it('renderiza o nome da pessoa em destaque de primeira', () => {
        render(
            <KanbanCard
                deal={mockDeal}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onOpenChat={vi.fn()}
            />
        );

        const nameEl = screen.getByText('Lucas Silva');
        expect(nameEl).toBeInTheDocument();
        expect(nameEl.className).toContain('font-black');
    });

    it('renderiza o preço do produto e badge de desconto de primeira', () => {
        render(
            <KanbanCard
                deal={mockDeal}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onOpenChat={vi.fn()}
            />
        );

        // Preço real com desconto em destaque
        expect(screen.getByText(/4\.200/)).toBeInTheDocument();
        // Preço de tabela original riscado
        expect(screen.getByText(/5\.000/)).toBeInTheDocument();
        expect(screen.getByText('Desconto')).toBeInTheDocument();
    });

    it('renderiza a tag do produto e canal de origem', () => {
        render(
            <KanbanCard
                deal={mockDeal}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onOpenChat={vi.fn()}
            />
        );

        expect(screen.getByText('Mentoria Elite')).toBeInTheDocument();
        expect(screen.getByText('Kiwify')).toBeInTheDocument();
    });

    it('dispara onEdit ao clicar no card para ver todas as informações', () => {
        const handleEdit = vi.fn();
        render(
            <KanbanCard
                deal={mockDeal}
                onEdit={handleEdit}
                onDelete={vi.fn()}
                onOpenChat={vi.fn()}
            />
        );

        const card = screen.getByTitle('Clique para ver todas as informações do lead');
        fireEvent.click(card);

        expect(handleEdit).toHaveBeenCalledWith(mockDeal);
    });

    it('dispara onOpenChat ao clicar no botão de WhatsApp sem disparar onEdit', () => {
        const handleEdit = vi.fn();
        const handleOpenChat = vi.fn();
        render(
            <KanbanCard
                deal={mockDeal}
                onEdit={handleEdit}
                onDelete={vi.fn()}
                onOpenChat={handleOpenChat}
            />
        );

        const chatBtn = screen.getByTitle('Conversar no WhatsApp');
        fireEvent.click(chatBtn);

        expect(handleOpenChat).toHaveBeenCalledWith('5511999998888');
        expect(handleEdit).not.toHaveBeenCalled();
    });
});

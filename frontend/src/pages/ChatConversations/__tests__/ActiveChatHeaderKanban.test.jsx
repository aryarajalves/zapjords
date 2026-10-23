import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ActiveChatHeader from '../components/ActiveChatHeader';

describe('ActiveChatHeader Kanban Button Tests', () => {
    it('renderiza o botão de Kanban e dispara onOpenCrm ao clicar', () => {
        const onOpenCrmMock = vi.fn();
        const selectedConvo = {
            id: 123,
            contact_name: 'Lucas Silva',
            phone: '5511988887777',
            status: 'open'
        };
        const engineMock = {
            timeLeft24h: 'Janela Aberta'
        };

        render(
            <ActiveChatHeader
                selectedConvo={selectedConvo}
                engine={engineMock}
                onOpenCrm={onOpenCrmMock}
            />
        );

        const kanbanBtn = screen.getByTestId('chat-header-kanban-btn');
        expect(kanbanBtn).toBeInTheDocument();
        expect(kanbanBtn).toHaveAttribute('title', 'Kanban de Vendas (Mover de Etapa)');

        fireEvent.click(kanbanBtn);
        expect(onOpenCrmMock).toHaveBeenCalledTimes(1);
    });
});

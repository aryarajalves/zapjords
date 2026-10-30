import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatHeaderNav from './ChatHeaderNav';

describe('ChatHeaderNav Component', () => {
    const defaultProps = {
        activeClient: { id: 1, name: 'Crassus' },
        user: { role: 'admin' },
        onClose: vi.fn(),
        onNavigate: vi.fn()
    };

    it('renderiza o título do painel e os atalhos de navegação incluindo o botão Kanban', () => {
        render(<ChatHeaderNav {...defaultProps} />);

        expect(screen.getByText('Painel de Atendimento')).toBeInTheDocument();
        expect(screen.getByText('Cliente: Crassus')).toBeInTheDocument();

        // Botões de navegação
        expect(screen.getByText('Integração Webhook')).toBeInTheDocument();
        expect(screen.getByText('Disparo em Massa')).toBeInTheDocument();
        expect(screen.getByText('Histórico de Disparos')).toBeInTheDocument();
        expect(screen.getByText('Funis')).toBeInTheDocument();
        expect(screen.getByText('Kanban')).toBeInTheDocument();
        expect(screen.getByText('Contatos')).toBeInTheDocument();
    });

    it('ao clicar no botão Kanban chama onNavigate com "sales_kanban"', () => {
        const onNavigate = vi.fn();
        render(<ChatHeaderNav {...defaultProps} onNavigate={onNavigate} />);

        const kanbanBtn = screen.getByText('Kanban');
        fireEvent.click(kanbanBtn);

        expect(onNavigate).toHaveBeenCalledWith('sales_kanban');
    });

    it('ao clicar no botão de fechar (X) chama onClose', () => {
        const onClose = vi.fn();
        render(<ChatHeaderNav {...defaultProps} onClose={onClose} />);

        const closeBtn = screen.getByTitle('Fechar painel de atendimento');
        fireEvent.click(closeBtn);

        expect(onClose).toHaveBeenCalled();
    });

    it('usuário com role "vendedor" não vê os botões de atalho no header', () => {
        render(<ChatHeaderNav {...defaultProps} user={{ role: 'vendedor' }} />);

        expect(screen.queryByText('Kanban')).not.toBeInTheDocument();
        expect(screen.queryByText('Disparo em Massa')).not.toBeInTheDocument();
        expect(screen.queryByText('Funis')).not.toBeInTheDocument();
    });
});

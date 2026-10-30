import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BulkTemplateTabRecipients from './BulkTemplateTabRecipients';

describe('BulkTemplateTabRecipients Component', () => {
    const mockRecipients = [
        {
            id: 1,
            conversation_id: 101,
            name: 'Carlos Silva',
            phone: '5511999998888',
            formatted_phone: '+55 (11) 99999-8888',
            labels: ['Cliente VIP', 'Prioritário'],
            has_active_funnel: true
        },
        {
            id: 2,
            conversation_id: 102,
            name: 'Mariana Costa',
            phone: '5521988887777',
            formatted_phone: '+55 (21) 98888-7777',
            labels: ['Lead Novo'],
            has_active_funnel: false
        }
    ];

    it('renderiza contatos com nome, telefone formatado e etiquetas', () => {
        render(
            <BulkTemplateTabRecipients
                recipients={mockRecipients}
                loading={false}
                selectedCount={2}
            />
        );

        expect(screen.getByText('Carlos Silva')).toBeInTheDocument();
        expect(screen.getByText('+55 (11) 99999-8888')).toBeInTheDocument();
        expect(screen.getByText('Cliente VIP')).toBeInTheDocument();
        expect(screen.getByText('Funil Ativo')).toBeInTheDocument();

        expect(screen.getByText('Mariana Costa')).toBeInTheDocument();
        expect(screen.getByText('+55 (21) 98888-7777')).toBeInTheDocument();
        expect(screen.getByText('Lead Novo')).toBeInTheDocument();
    });

    it('filtra contatos por nome ou telefone através do campo de busca', () => {
        render(
            <BulkTemplateTabRecipients
                recipients={mockRecipients}
                loading={false}
                selectedCount={2}
            />
        );

        const searchInput = screen.getByPlaceholderText(/buscar destinatário/i);
        fireEvent.change(searchInput, { target: { value: 'Mariana' } });

        expect(screen.getByText('Mariana Costa')).toBeInTheDocument();
        expect(screen.queryByText('Carlos Silva')).not.toBeInTheDocument();
    });

    it('exibe estado de carregamento quando loading for true', () => {
        render(
            <BulkTemplateTabRecipients
                recipients={[]}
                loading={true}
                selectedCount={0}
            />
        );

        expect(screen.getByText(/carregando lista de contatos/i)).toBeInTheDocument();
    });
});

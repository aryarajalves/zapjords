import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddChatToCrmModal from '../AddChatToCrmModal';
import { toast } from 'react-hot-toast';

vi.mock('../../../../contexts/ClientContext', () => ({
    useClient: () => ({
        activeClient: { id: 1, name: 'Cliente Teste' }
    })
}));

vi.mock('react-hot-toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn()
    }
}));

const mockPipelines = [
    {
        id: 1,
        name: 'Funil Principal',
        product_name: 'Produto Top',
        default_value: 497.0,
        is_default: true
    }
];

const mockStages = [
    { id: 10, name: 'Etapa 1: Contato Inicial', pipeline_id: 1 },
    { id: 11, name: 'Etapa 2: Proposta Enviada', pipeline_id: 1 }
];

describe('AddChatToCrmModal Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn().mockImplementation((url) => {
            const strUrl = String(url);
            if (strUrl.includes('/api/crm/pipelines')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockPipelines)
                });
            }
            if (strUrl.includes('/api/crm/stages')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockStages)
                });
            }
            if (strUrl.includes('/api/crm/deals')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ id: 999, status: 'open' })
                });
            }
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({})
            });
        });
    });

    it('não renderiza quando isOpen é false', () => {
        const { container } = render(
            <AddChatToCrmModal
                isOpen={false}
                onClose={vi.fn()}
                selectedConvo={{ contact_name: 'Maria', phone: '5511988887777' }}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renderiza o modal com os dados do contato preenchidos', async () => {
        render(
            <AddChatToCrmModal
                isOpen={true}
                onClose={vi.fn()}
                selectedConvo={{ contact_name: 'Maria Santos', phone: '5511988887777', email: 'maria@email.com' }}
            />
        );

        expect(screen.getByText('Adicionar ao Kanban de Vendas')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByDisplayValue('Maria Santos')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Etapa 1: Contato Inicial')).toBeInTheDocument();
        });
    });

    it('submete com sucesso e chama toast.success', async () => {
        const onCloseMock = vi.fn();
        render(
            <AddChatToCrmModal
                isOpen={true}
                onClose={onCloseMock}
                selectedConvo={{ contact_name: 'João Silva', phone: '5511999991111' }}
            />
        );

        await waitFor(() => {
            expect(screen.getByDisplayValue('João Silva')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Etapa 1: Contato Inicial')).toBeInTheDocument();
        });

        const submitBtn = screen.getByText('Adicionar ao Funil');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/crm/deals'),
                expect.objectContaining({
                    method: 'POST'
                })
            );
            expect(toast.success).toHaveBeenCalledWith('Contato adicionado ao Kanban de Vendas!');
            expect(onCloseMock).toHaveBeenCalled();
        });
    });

    it('preenche o campo de valor automaticamente quando o pipeline possui default_value', async () => {
        render(
            <AddChatToCrmModal
                isOpen={true}
                onClose={vi.fn()}
                selectedConvo={{ contact_name: 'Lead Novo', phone: '5511999992222' }}
            />
        );

        await waitFor(() => {
            const valueInput = screen.getByPlaceholderText('0.00');
            expect(valueInput).toBeInTheDocument();
            expect(valueInput.value).toBe('497');
        });
    });
});


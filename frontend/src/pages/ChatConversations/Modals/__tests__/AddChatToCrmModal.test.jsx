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
        name: 'Pipeline Geral de Vendas',
        product_name: 'Mentoria Elite',
        default_value: 5000.0,
        is_default: true
    }
];

const mockStages = [
    { id: 10, name: 'Prospect', pipeline_id: 1, stage_type: 'initial' },
    { id: 11, name: 'Lead', pipeline_id: 1, stage_type: 'in_progress' },
    { id: 12, name: 'Desistência', pipeline_id: 1, stage_type: 'lost' }
];

const mockProducts = [
    { id: 101, name: 'Mentoria Elite', price: 5000.0, is_active: true },
    { id: 102, name: 'Curso Gravado', price: 997.0, is_active: true }
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
            if (strUrl.includes('/api/crm/products')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockProducts)
                });
            }
            if (strUrl.includes('/api/crm/stages')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockStages)
                });
            }
            if (strUrl.includes('/api/crm/deals/by-phone')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(null)
                });
            }
            if (strUrl.includes('/api/crm/deals/move-contact')) {
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

    it('renderiza o modal de adicionar quando não há deal existente', async () => {
        render(
            <AddChatToCrmModal
                isOpen={true}
                onClose={vi.fn()}
                selectedConvo={{ contact_name: 'Maria Santos', phone: '5511988887777' }}
            />
        );

        expect(screen.getByText('Adicionar ao Kanban de Vendas')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Pipeline Geral de Vendas')).toBeInTheDocument();
            expect(screen.getByText('Prospect')).toBeInTheDocument();
        });
    });

    it('renderiza banner de etapa atual e sugere próxima etapa quando já tem deal', async () => {
        global.fetch = vi.fn().mockImplementation((url) => {
            const strUrl = String(url);
            if (strUrl.includes('/api/crm/pipelines')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPipelines) });
            }
            if (strUrl.includes('/api/crm/products')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockProducts) });
            }
            if (strUrl.includes('/api/crm/stages')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStages) });
            }
            if (strUrl.includes('/api/crm/deals/by-phone')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        id: 55,
                        pipeline_id: 1,
                        stage_id: 10, // Prospect
                        product_name: 'Mentoria Elite',
                        value: 5000.0,
                        status: 'open'
                    })
                });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(
            <AddChatToCrmModal
                isOpen={true}
                onClose={vi.fn()}
                selectedConvo={{ contact_name: 'Carlos Lima', phone: '5511977776666' }}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Mover Etapa no Kanban')).toBeInTheDocument();
            expect(screen.getByText('Etapa Atual:')).toBeInTheDocument();
            // Sugerida: Lead (próxima etapa após Prospect)
            expect(screen.getByText(/Sugerida:\s*Lead/i)).toBeInTheDocument();
        });
    });

    it('submete movimentação chamando move-contact e exibe toast de sucesso', async () => {
        const onCloseMock = vi.fn();
        render(
            <AddChatToCrmModal
                isOpen={true}
                onClose={onCloseMock}
                selectedConvo={{ contact_name: 'João Silva', phone: '5511999991111' }}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Prospect')).toBeInTheDocument();
        });

        const submitBtn = screen.getByRole('button', { name: /Adicionar ao Kanban/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/crm/deals/move-contact'),
                expect.objectContaining({
                    method: 'POST'
                })
            );
            expect(toast.success).toHaveBeenCalled();
            expect(onCloseMock).toHaveBeenCalled();
        });
    });
});

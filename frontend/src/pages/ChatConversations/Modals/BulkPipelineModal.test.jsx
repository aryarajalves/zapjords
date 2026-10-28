import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BulkPipelineModal from './BulkPipelineModal';

// Mock do fetchWithAuth
vi.mock('../../../AuthContext', () => ({
    fetchWithAuth: vi.fn()
}));

import { fetchWithAuth } from '../../../AuthContext';

describe('BulkPipelineModal', () => {
    const mockPipelines = [
        { id: 10, name: 'Pipeline Vendas Outubro', product_name: 'Mentoria' },
        { id: 20, name: 'Pipeline Suporte', product_name: null }
    ];

    const mockProducts = [
        { id: 501, name: 'Mentoria VIP 2026', price: 1497.00, is_active: true },
        { id: 502, name: 'Curso Astrologia Básica', price: 497.00, is_active: true }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        fetchWithAuth.mockImplementation(async (url) => {
            if (url.includes('/crm/stages')) {
                return {
                    ok: true,
                    json: async () => [
                        { id: 101, name: 'Prospect', order_index: 0 },
                        { id: 102, name: 'Lead', order_index: 1 }
                    ]
                };
            }
            if (url.includes('/crm/products')) {
                return {
                    ok: true,
                    json: async () => mockProducts
                };
            }
            return { ok: true, json: async () => [] };
        });
    });

    it('não renderiza quando isOpen é false', () => {
        const { container } = render(
            <BulkPipelineModal
                isOpen={false}
                onClose={vi.fn()}
                pipelines={mockPipelines}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renderiza título, pipelines disponíveis e não exibe abas de criação de nova pipeline', async () => {
        render(
            <BulkPipelineModal
                isOpen={true}
                onClose={vi.fn()}
                selectedCount={5}
                pipelines={mockPipelines}
                activeClientId={1}
            />
        );

        expect(screen.getByText('Adicionar ao Kanban de Vendas')).toBeInTheDocument();
        expect(screen.getByText(/5 contatos selecionados/)).toBeInTheDocument();
        // Não deve ter abas de alternar para nova pipeline
        expect(screen.queryByTestId('tab-existing-pipeline')).not.toBeInTheDocument();
        expect(screen.queryByTestId('tab-new-pipeline')).not.toBeInTheDocument();
        expect(screen.getByTestId('bulk-pipeline-select')).toBeInTheDocument();

        // Aguarda carregar estágios e produtos via fetchWithAuth
        await waitFor(() => {
            expect(fetchWithAuth).toHaveBeenCalledWith(
                expect.stringContaining('/crm/stages?pipeline_id=10'),
                {},
                1
            );
            expect(fetchWithAuth).toHaveBeenCalledWith(
                expect.stringContaining('/crm/products'),
                {},
                1
            );
        });
    });

    it('carrega os produtos cadastrados e preenche automaticamente o valor ao selecionar um produto', async () => {
        render(
            <BulkPipelineModal
                isOpen={true}
                onClose={vi.fn()}
                selectedCount={3}
                pipelines={mockPipelines}
                activeClientId={1}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('bulk-product-select')).toBeInTheDocument();
        });

        const productSelect = screen.getByTestId('bulk-product-select');
        expect(productSelect).toBeInTheDocument();

        // Selecionar o produto "Mentoria VIP 2026"
        fireEvent.change(productSelect, { target: { value: '501' } });

        // Deve preencher o input de valor da oportunidade com o preço do produto (1497.00)
        const valueInput = screen.getByTestId('bulk-opportunity-value-input');
        expect(valueInput.value).toBe('1497.00');

        // Deve exibir o badge com o valor do produto cadastrado
        expect(screen.getByText(/Valor do Produto Cadastrado:/i)).toBeInTheDocument();
        expect(screen.getAllByText(/1\.497,00/).length).toBeGreaterThan(0);
    });

    it('permite editar o valor manualmente mantendo o produto selecionado', async () => {
        render(
            <BulkPipelineModal
                isOpen={true}
                onClose={vi.fn()}
                selectedCount={2}
                pipelines={mockPipelines}
                activeClientId={1}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('bulk-product-select')).toBeInTheDocument();
        });

        // Selecionar o produto "Curso Astrologia Básica" (497.00)
        fireEvent.change(screen.getByTestId('bulk-product-select'), { target: { value: '502' } });

        const valueInput = screen.getByTestId('bulk-opportunity-value-input');
        expect(valueInput.value).toBe('497.00');

        // Usuário concede um desconto especial e altera para 397.00
        fireEvent.change(valueInput, { target: { value: '397.00' } });
        expect(valueInput.value).toBe('397.00');
    });

    it('envia requisição de bulk-add-contacts com pipeline, estágio, produto e valor selecionados', async () => {
        fetchWithAuth.mockImplementation(async (url) => {
            if (url.includes('/crm/stages')) {
                return {
                    ok: true,
                    json: async () => [{ id: 101, name: 'Prospect', order_index: 0 }]
                };
            }
            if (url.includes('/crm/products')) {
                return {
                    ok: true,
                    json: async () => mockProducts
                };
            }
            if (url.includes('/crm/deals/bulk-add-contacts')) {
                return {
                    ok: true,
                    json: async () => ({ message: 'Contatos adicionados com sucesso!', count: 3 })
                };
            }
            return { ok: false };
        });

        const onClose = vi.fn();
        const onSuccess = vi.fn();

        render(
            <BulkPipelineModal
                isOpen={true}
                onClose={onClose}
                selectedCount={3}
                selectedConvoIds={[1, 2, 3]}
                pipelines={mockPipelines}
                activeClientId={1}
                onSuccess={onSuccess}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('bulk-stage-select')).toBeInTheDocument();
            expect(screen.getByTestId('bulk-product-select')).toBeInTheDocument();
        });

        // Seleciona produto 501
        fireEvent.change(screen.getByTestId('bulk-product-select'), { target: { value: '501' } });

        const submitBtn = screen.getByTestId('bulk-pipeline-submit-btn');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(fetchWithAuth).toHaveBeenCalledWith(
                expect.stringContaining('/crm/deals/bulk-add-contacts'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('"pipeline_id":10')
                }),
                1
            );
            // Verifica que o payload continha product_id 501 e value 1497
            const callArgs = fetchWithAuth.mock.calls.find(c => c[0].includes('/crm/deals/bulk-add-contacts'));
            const sentPayload = JSON.parse(callArgs[1].body);
            expect(sentPayload.pipeline_id).toBe(10);
            expect(sentPayload.product_id).toBe(501);
            expect(sentPayload.product_name).toBe('Mentoria VIP 2026');
            expect(sentPayload.value).toBe(1497);

            expect(onSuccess).toHaveBeenCalled();
            expect(onClose).toHaveBeenCalled();
        });
    });
});

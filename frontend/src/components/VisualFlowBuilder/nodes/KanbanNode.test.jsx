import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import KanbanNode from './KanbanNode';
import { useClient } from '../../../contexts/ClientContext';

vi.mock('../../../contexts/ClientContext');

const mockClient = { id: 1, name: 'Cliente Teste' };
const mockPipelines = [
    { id: 10, name: 'Pipeline Geral de Vendas', product_name: 'Mentoria Elite', is_default: true },
    { id: 20, name: 'Funil Curso Python', product_name: 'Curso Python', is_default: false }
];

const mockStages = [
    { id: 101, name: 'Prospect', stage_type: 'initial' },
    { id: 102, name: 'Lead', stage_type: 'normal' },
    { id: 103, name: 'Venda', stage_type: 'won' },
    { id: 104, name: 'Desistencia', stage_type: 'lost' }
];

const mockProducts = [
    { id: 1, name: 'Mentoria Elite', price: 5000.0 },
    { id: 2, name: 'Curso Python', price: 297.0 }
];

describe('KanbanNode Component', () => {
    const mockOnChange = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnDuplicate = vi.fn();

    const baseData = {
        pipeline_id: 10,
        stage_id: 101,
        product_name: '',
        value: '',
        lost_reason: '',
        onChange: mockOnChange,
        onDelete: mockOnDelete,
        onDuplicate: mockOnDuplicate,
        isStart: false
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useClient.mockReturnValue({ activeClient: mockClient });
        global.fetch = vi.fn().mockImplementation((url) => {
            const strUrl = String(url);
            if (strUrl.includes('/api/crm/pipelines') && !strUrl.includes('/board')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockPipelines)
                });
            }
            if (strUrl.includes('/board')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ stages: mockStages })
                });
            }
            if (strUrl.includes('/api/crm/products')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockProducts)
                });
            }
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([])
            });
        });
    });

    it('renderiza o cabeçalho e os campos do KanbanNode', async () => {
        render(
            <ReactFlowProvider>
                <KanbanNode id="node-1" data={baseData} />
            </ReactFlowProvider>
        );

        expect(screen.getByText('Kanban de Vendas')).toBeInTheDocument();
        expect(screen.getByText('Pipeline de Vendas')).toBeInTheDocument();
        expect(screen.getByText('Coluna de Destino')).toBeInTheDocument();
        expect(screen.getByText('Produto de Interesse (Opcional)')).toBeInTheDocument();
        expect(screen.getByText('Valor Estimado (R$)')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText(/Pipeline Geral de Vendas/)).toBeInTheDocument();
        });
    });

    it('permite selecionar produto e preenche o valor sugerido', async () => {
        render(
            <ReactFlowProvider>
                <KanbanNode id="node-1" data={baseData} />
            </ReactFlowProvider>
        );

        await waitFor(() => {
            expect(screen.getByText(/Mentoria Elite \(R\$ 5000.00\)/)).toBeInTheDocument();
        });

        const productSelect = screen.getAllByRole('combobox')[2]; // Terceiro select: Produto
        fireEvent.change(productSelect, { target: { value: 'Mentoria Elite' } });

        expect(mockOnChange).toHaveBeenCalledWith('node-1', expect.objectContaining({
            product_name: 'Mentoria Elite',
            value: 5000.0
        }));
    });

    it('exibe o campo de motivo da desistência quando o estágio for perdido / desistencia', async () => {
        const lostData = {
            ...baseData,
            stage_id: 104,
            lost_reason: 'Sem orçamento'
        };

        render(
            <ReactFlowProvider>
                <KanbanNode id="node-1" data={lostData} />
            </ReactFlowProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Motivo da Desistência')).toBeInTheDocument();
        });

        const reasonInput = screen.getByPlaceholderText('Ex: Não respondeu ao follow-up');
        expect(reasonInput).toBeInTheDocument();
        expect(reasonInput.value).toBe('Sem orçamento');

        fireEvent.change(reasonInput, { target: { value: 'Preço alto' } });
        expect(mockOnChange).toHaveBeenCalledWith('node-1', expect.objectContaining({
            lost_reason: 'Preço alto'
        }));
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SalesKanban from '../index';

// Mock de Contextos e APIs
vi.mock('../../../contexts/ClientContext', () => ({
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
        client_id: 1,
        name: 'Funil Curso Python',
        product_name: 'Curso Python',
        associated_tags: 'aluno-python,lead-python',
        is_default: true,
        stages_count: 3,
        deals_count: 2,
        total_value: 1500.0
    },
    {
        id: 2,
        client_id: 1,
        name: 'Funil Mentoria VIP',
        product_name: 'Mentoria VIP',
        associated_tags: 'vip',
        is_default: false,
        stages_count: 2,
        deals_count: 0,
        total_value: 0.0
    }
];

const mockBoard = {
    pipeline: mockPipelines[0],
    stages: [
        {
            id: 10,
            pipeline_id: 1,
            client_id: 1,
            name: 'Novo Lead',
            order_index: 0,
            color: 'blue',
            stage_type: 'initial',
            total_deals: 1,
            percentage: 33.3,
            total_value: 500.0,
            deals: [
                {
                    id: 101,
                    pipeline_id: 1,
                    stage_id: 10,
                    client_id: 1,
                    contact_name: 'Carlos Oliveira',
                    contact_phone: '5511999998888',
                    channel: 'kiwify',
                    title: 'Oportunidade Curso',
                    value: 500.0,
                    status: 'open',
                    notes: 'Interessado no módulo 2'
                }
            ]
        },
        {
            id: 11,
            pipeline_id: 1,
            client_id: 1,
            name: 'Fechado (Ganho)',
            order_index: 1,
            color: 'emerald',
            stage_type: 'won',
            total_deals: 1,
            percentage: 33.3,
            total_value: 1000.0,
            deals: [
                {
                    id: 102,
                    pipeline_id: 1,
                    stage_id: 11,
                    client_id: 1,
                    contact_name: 'Mariana Silva',
                    contact_phone: '5511977776666',
                    channel: 'whatsapp',
                    title: 'Compra Confirmada',
                    value: 1000.0,
                    status: 'won',
                    notes: 'Pago via Pix'
                }
            ]
        },
        {
            id: 12,
            pipeline_id: 1,
            client_id: 1,
            name: 'Desistencia',
            order_index: 2,
            color: 'rose',
            stage_type: 'lost',
            total_deals: 1,
            percentage: 33.3,
            total_value: 0.0,
            deals: [
                {
                    id: 103,
                    pipeline_id: 1,
                    stage_id: 12,
                    client_id: 1,
                    contact_name: 'Lucas Ferreira',
                    contact_phone: '5511966665555',
                    channel: 'whatsapp',
                    title: 'Oportunidade Curso',
                    value: 0.0,
                    status: 'lost',
                    lost_reason: 'Preço alto / Sem orçamento',
                    notes: 'Desistiu'
                }
            ]
        }
    ],
    total_deals: 3,
    total_value: 1500.0,
    total_won_value: 1000.0,
    total_won_deals: 1,
    conversion_rate: 33.33
};

describe('SalesKanban Component Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn().mockImplementation((url) => {
            const strUrl = String(url);
            if (strUrl.includes('/api/crm/pipelines') && !strUrl.includes('/board')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockPipelines)
                });
            }
            if (strUrl.includes('/api/crm/products')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([])
                });
            }
            if (strUrl.includes('/board')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockBoard)
                });
            }
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({})
            });
        });
    });

    it('renderiza o cabeçalho do Kanban e as métricas do pipeline selecionado', async () => {
        render(<SalesKanban onViewChange={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText(/Funil Curso Python/)).toBeInTheDocument();
        });

        // Verifica métricas de total
        expect(screen.getByText('Total em Negociação')).toBeInTheDocument();
        expect(screen.getByText('Vendas Fechadas (Ganho)')).toBeInTheDocument();
    });

    it('renderiza as colunas e os cards de oportunidade com seus canais de origem', async () => {
        render(<SalesKanban onViewChange={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Novo Lead')).toBeInTheDocument();
            expect(screen.getByText('Fechado (Ganho)')).toBeInTheDocument();
        });

        // Verifica os cards de lead e seus canais
        expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
        expect(screen.getByText('Kiwify')).toBeInTheDocument();
        expect(screen.getByText('Mariana Silva')).toBeInTheDocument();
        expect(screen.getAllByText('WhatsApp').length).toBeGreaterThanOrEqual(1);
    });

    it('abre o modal de criar oportunidade com campo de Canal de Origem', async () => {
        render(<SalesKanban onViewChange={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Novo Lead')).toBeInTheDocument();
        });

        const newDealBtn = screen.getByText('Nova Oportunidade');
        fireEvent.click(newDealBtn);

        expect(screen.getByRole('heading', { name: 'Nova Oportunidade' })).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Ex: João da Silva')).toBeInTheDocument();
        expect(screen.getByText('Canal de Origem')).toBeInTheDocument();
    });

    it('abre o modal de novo funil ao clicar em "Novo Pipeline"', async () => {
        render(<SalesKanban onViewChange={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Novo Pipeline')).toBeInTheDocument();
        });

        const newPipelineBtn = screen.getByText('Novo Pipeline');
        fireEvent.click(newPipelineBtn);

        expect(screen.getByText('Novo Pipeline de Vendas')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Ex: Mentoria Elite, Curso High Ticket')).toBeInTheDocument();
        expect(screen.getByText('Valor Padrão da Venda (R$)')).toBeInTheDocument();
        const defaultValueInput = screen.getByPlaceholderText('0.00');
        expect(defaultValueInput).toBeInTheDocument();
        fireEvent.change(defaultValueInput, { target: { value: '297.00' } });
        expect(defaultValueInput.value).toBe('297.00');
    });

    it('abre o modal de criar nova coluna ao clicar no botão "+ Nova Coluna"', async () => {
        render(<SalesKanban onViewChange={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('+ Nova Coluna')).toBeInTheDocument();
        });

        const newStageBtn = screen.getByText('+ Nova Coluna');
        fireEvent.click(newStageBtn);

        expect(screen.getByText('Nova Coluna do CRM')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Ex: Proposta Enviada/)).toBeInTheDocument();
        expect(screen.getByText('Cor da Coluna')).toBeInTheDocument();
        expect(screen.getByText('Comportamento da Etapa')).toBeInTheDocument();
    });

    it('filtra cards através da barra de pesquisa por nome ou canal', async () => {
        render(<SalesKanban onViewChange={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Buscar por nome, telefone ou e-mail...');
        fireEvent.change(searchInput, { target: { value: 'Kiwify' } });

        // Carlos (canal Kiwify) deve estar visível, Mariana deve sumir
        expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
        expect(screen.queryByText('Mariana Silva')).not.toBeInTheDocument();
    });

    it('exibe o motivo da desistência no card e o campo de motivo no modal de oportunidade', async () => {
        render(<SalesKanban onViewChange={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Lucas Ferreira')).toBeInTheDocument();
        });

        // Motivo exibido no card
        expect(screen.getByText('Motivo da Desistência:')).toBeInTheDocument();
        expect(screen.getByText('Preço alto / Sem orçamento')).toBeInTheDocument();

        // Abre modal de nova oportunidade e seleciona Desistencia
        const newDealBtn = screen.getByText('Nova Oportunidade');
        fireEvent.click(newDealBtn);

        const stageSelect = screen.getByDisplayValue('Novo Lead');
        fireEvent.change(stageSelect, { target: { value: '12' } });

        expect(screen.getByText('Motivo da Desistência do Lead')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Descreva o motivo da desistência do lead...')).toBeInTheDocument();
    });

    it('exibe o card de Taxa de Conversão, a barra de Distribuição do Funil e porcentagens nas colunas', async () => {
        render(<SalesKanban onViewChange={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
        });

        // Valida card de conversão
        expect(screen.getByText('Taxa de Conversão')).toBeInTheDocument();
        expect(screen.getByText(/33[.,]33%/)).toBeInTheDocument();
        expect(screen.getByText('1 de 3 convertidos')).toBeInTheDocument();

        // Valida seção de distribuição do funil
        expect(screen.getByText('Distribuição do Funil')).toBeInTheDocument();
        expect(screen.getByText('3 leads totais')).toBeInTheDocument();

        // Valida badges de porcentagem nas colunas (ex: 1 (33.3%))
        const columnBadges = screen.getAllByText('1 (33.3%)');
        expect(columnBadges.length).toBeGreaterThan(0);
    });
});

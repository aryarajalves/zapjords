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
            window_open_deals: 1,
            window_open_percentage: 100.0,
            unread_deals: 1,
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
                    product_id: 1,
                    product_name: 'Curso Python',
                    title: 'Oportunidade Curso',
                    value: 500.0,
                    status: 'open',
                    notes: 'Interessado no módulo 2',
                    window_open: true,
                    window_remaining_seconds: 72000,
                    unread_count: 2
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
    conversion_rate: 33.33,
    total_window_open_deals: 1,
    window_open_percentage: 33.3,
    total_unread_deals: 1
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
                    json: () => Promise.resolve([
                        { id: 1, name: 'Curso Python', price: 500.0 }
                    ])
                });
            }
            if (strUrl.includes('/board')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockBoard)
                });
            }
            if (strUrl.includes('/api/crm/deals/bulk-delete')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ message: '2 contatos removidos do Kanban.', count: 2 })
                });
            }
            if (strUrl.includes('/api/crm/deals/bulk-update')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ message: '2 contatos atualizados com sucesso!', count: 2 })
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

    it('permite selecionar cards individuais e exibe a barra de ações em massa', async () => {
        render(<SalesKanban onViewChange={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
        });

        // Inicialmente a barra não deve estar presente
        expect(screen.queryByTestId('kanban-bulk-actions-bar')).not.toBeInTheDocument();

        // Clica no checkbox do primeiro lead
        const checkboxes = screen.getAllByTitle('Selecionar lead para ações em massa');
        fireEvent.click(checkboxes[0]);

        // Barra de ações em massa deve aparecer com contagem
        expect(screen.getByTestId('kanban-bulk-actions-bar')).toBeInTheDocument();
        expect(screen.getByText('1 lead selecionado')).toBeInTheDocument();
        expect(screen.getByText('Editar Produto e Preço')).toBeInTheDocument();
        expect(screen.getByText('Remover Selecionados')).toBeInTheDocument();

        // Clica no checkbox do segundo lead
        fireEvent.click(checkboxes[1]);
        expect(screen.getByText('2 leads selecionados')).toBeInTheDocument();
    });

    it('abre o modal de confirmação de exclusão individual ao clicar na lixeira do card', async () => {
        render(<SalesKanban onViewChange={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByTitle('Remover contato do Kanban');
        fireEvent.click(deleteButtons[0]);

        // Modal de confirmação deve abrir centralizado
        expect(screen.getByText('Excluir Oportunidade?')).toBeInTheDocument();
        expect(screen.getByText(/Tem certeza que deseja excluir o lead "Carlos Oliveira"/)).toBeInTheDocument();
        expect(screen.getByText('Sim, Excluir')).toBeInTheDocument();
    });

    it('abre o modal de confirmação em massa e executa a exclusão ao confirmar', async () => {
        render(<SalesKanban onViewChange={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
        });

        const checkboxes = screen.getAllByTitle('Selecionar lead para ações em massa');
        fireEvent.click(checkboxes[0]);
        fireEvent.click(checkboxes[1]);

        const bulkDeleteBtn = screen.getByText('Remover Selecionados');
        fireEvent.click(bulkDeleteBtn);

        // Modal de confirmação em massa deve abrir
        expect(screen.getByText('Remover 2 Contatos?')).toBeInTheDocument();
        expect(screen.getByText(/Tem certeza que deseja remover os 2 contatos selecionados deste Kanban\?/)).toBeInTheDocument();

        const confirmBtn = screen.getByText('Sim, Excluir');
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/crm/deals/bulk-delete'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ deal_ids: [101, 102] })
                })
            );
        });
    });

    it('abre o modal de edição em massa e permite atualizar produto e preço dos selecionados', async () => {
        render(<SalesKanban onViewChange={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
        });

        const checkboxes = screen.getAllByTitle('Selecionar lead para ações em massa');
        fireEvent.click(checkboxes[0]);

        const bulkEditBtn = screen.getByText('Editar Produto e Preço');
        fireEvent.click(bulkEditBtn);

        // Modal de edição em massa aberto
        expect(screen.getByText('Editar Contatos em Massa')).toBeInTheDocument();
        expect(screen.getByText(/Aplicar alterações para/)).toBeInTheDocument();

        // Ativa produto
        const productCheckbox = screen.getByLabelText(/Alterar Produto de Interesse/);
        fireEvent.click(productCheckbox);

        // Ativa preço
        const priceCheckbox = screen.getByLabelText(/Alterar Preço \/ Valor da Venda/);
        fireEvent.click(priceCheckbox);

        const priceInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(priceInput, { target: { value: '750.00' } });

        const submitBtn = screen.getByText(/Aplicar aos 1 Leads/);
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/crm/deals/bulk-update'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('"update_value":true')
                })
            );
        });
    });

    it('permite selecionar todos os leads de uma única coluna pelo checkbox do cabeçalho da coluna', async () => {
        render(<SalesKanban onViewChange={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
        });

        // Checkbox da coluna 'Novo Lead'
        const colNovoLeadCheckbox = screen.getByLabelText('Selecionar todos os leads da coluna Novo Lead');
        expect(colNovoLeadCheckbox).toBeInTheDocument();
        expect(colNovoLeadCheckbox.checked).toBe(false);

        // Marca todos da coluna Novo Lead
        fireEvent.click(colNovoLeadCheckbox);

        expect(screen.getByTestId('kanban-bulk-actions-bar')).toBeInTheDocument();
        expect(screen.getByText('1 lead selecionado')).toBeInTheDocument();
        expect(colNovoLeadCheckbox.checked).toBe(true);

        // Marca também a coluna 'Fechado (Ganho)'
        const colWonCheckbox = screen.getByLabelText('Selecionar todos os leads da coluna Fechado (Ganho)');
        fireEvent.click(colWonCheckbox);

        expect(screen.getByText('2 leads selecionados')).toBeInTheDocument();
        expect(colWonCheckbox.checked).toBe(true);

        // Desmarca a coluna 'Novo Lead'
        fireEvent.click(colNovoLeadCheckbox);

        expect(screen.getByText('1 lead selecionado')).toBeInTheDocument();
        expect(colNovoLeadCheckbox.checked).toBe(false);
        expect(colWonCheckbox.checked).toBe(true);
    });

    it('mantém o botão global de Selecionar Todos os leads do quadro e Desmarcar Todos', async () => {
        render(<SalesKanban onViewChange={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
        });

        // Clica na coluna Novo Lead para abrir a barra
        const colNovoLeadCheckbox = screen.getByLabelText('Selecionar todos os leads da coluna Novo Lead');
        fireEvent.click(colNovoLeadCheckbox);

        expect(screen.getByText('1 lead selecionado')).toBeInTheDocument();

        // Clica no botão global Selecionar Todos (3)
        const selectAllGlobalBtn = screen.getByText('Selecionar Todos (3)');
        fireEvent.click(selectAllGlobalBtn);

        expect(screen.getByText('3 leads selecionados')).toBeInTheDocument();

        // Clica em Desmarcar Todos
        const deselectAllBtn = screen.getByText('Desmarcar Todos');
        fireEvent.click(deselectAllBtn);

        expect(screen.queryByTestId('kanban-bulk-actions-bar')).not.toBeInTheDocument();
    });

    it('restaura o último pipeline selecionado salvo no localStorage mesmo se não for o padrão', async () => {
        // Simula que o usuário selecionou anteriormente a pipeline ID 2 ('Funil Mentoria VIP')
        localStorage.setItem('kanban_selected_pipeline_1', '2');

        render(<SalesKanban onViewChange={vi.fn()} />);

        // Deve carregar o board da pipeline 2 ao invés da pipeline 1 (que é a padrão)
        await waitFor(() => {
            const select = screen.getByTestId('kanban-pipeline-select');
            expect(select.value).toBe('2');
        });
    });

    it('salva a seleção de pipeline no localStorage quando o usuário altera o dropdown', async () => {
        localStorage.clear();

        render(<SalesKanban onViewChange={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByTestId('kanban-pipeline-select')).toBeInTheDocument();
        });

        const select = screen.getByTestId('kanban-pipeline-select');
        fireEvent.change(select, { target: { value: '2' } });

        await waitFor(() => {
            expect(localStorage.getItem('kanban_selected_pipeline_1')).toBe('2');
        });
    });

    it('exibe porcentagens de janela 24h aberta no cabeçalho geral, nas colunas e permite filtrar por Janela 24h ou Não lidas', async () => {
        render(<SalesKanban onViewChange={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
        });

        // Resumo geral de Janela 24h na barra de Distribuição do Funil
        const summaryBadge = screen.getByTestId('board-window-24h-summary');
        expect(summaryBadge).toBeInTheDocument();
        expect(summaryBadge.textContent).toContain('33.3% (1/3)');

        // Indicador de Janela 24h na coluna Novo Lead (stage 10)
        const stage10WindowStats = screen.getByTestId('stage-window-24h-stats-10');
        expect(stage10WindowStats).toBeInTheDocument();
        expect(stage10WindowStats.textContent).toContain('1/1 (100%)');

        // Filtra apenas cards com Janela 24h Aberta
        const filterWindowBtn = screen.getByTestId('kanban-filter-window-24h-btn');
        fireEvent.click(filterWindowBtn);

        expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
        expect(screen.queryByText('Mariana Silva')).not.toBeInTheDocument();

        // Desativa filtro de Janela 24h e ativa filtro de Não lidas
        fireEvent.click(filterWindowBtn);
        expect(screen.getByText('Mariana Silva')).toBeInTheDocument();

        const filterUnreadBtn = screen.getByTestId('kanban-filter-unread-btn');
        fireEvent.click(filterUnreadBtn);

        expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
        expect(screen.queryByText('Mariana Silva')).not.toBeInTheDocument();
    });

    it('não deve exibir o botão "Sincronizar" no cabeçalho do Kanban', async () => {
        render(<SalesKanban onViewChange={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
        });

        expect(screen.queryByText(/Sincronizar/i)).not.toBeInTheDocument();
    });

    it('permite filtrar contatos sem produto, com produto e por tipo de produto no Kanban', async () => {
        render(<SalesKanban onViewChange={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
            expect(screen.getByText('Mariana Silva')).toBeInTheDocument();
        });

        const productSelect = screen.getByTestId('kanban-filter-product-select');
        expect(productSelect).toBeInTheDocument();

        // 1. Filtrar por "Sem produto atribuído"
        fireEvent.change(productSelect, { target: { value: 'without_product' } });
        await waitFor(() => {
            expect(screen.getByText('Mariana Silva')).toBeInTheDocument();
            expect(screen.getByText('Lucas Ferreira')).toBeInTheDocument();
            expect(screen.queryByText('Carlos Oliveira')).not.toBeInTheDocument();
        });

        // 2. Filtrar por "Com produto atribuído"
        fireEvent.change(productSelect, { target: { value: 'with_product' } });
        await waitFor(() => {
            expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
            expect(screen.queryByText('Mariana Silva')).not.toBeInTheDocument();
            expect(screen.queryByText('Lucas Ferreira')).not.toBeInTheDocument();
        });

        // 3. Filtrar pelo tipo de produto específico (prod_1 -> Curso Python)
        fireEvent.change(productSelect, { target: { value: 'prod_1' } });
        await waitFor(() => {
            expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
            expect(screen.queryByText('Mariana Silva')).not.toBeInTheDocument();
            expect(screen.queryByText('Lucas Ferreira')).not.toBeInTheDocument();
        });

        // 4. Voltar para "Todos os produtos"
        fireEvent.change(productSelect, { target: { value: 'all' } });
        await waitFor(() => {
            expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
            expect(screen.getByText('Mariana Silva')).toBeInTheDocument();
            expect(screen.getByText('Lucas Ferreira')).toBeInTheDocument();
        });
    });

    it('NÃO atualiza nada nem chama PATCH quando o card é movido e solto na mesma coluna', async () => {
        render(<SalesKanban onViewChange={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
        });

        // Carlos Oliveira está no estágio 10 (Novo Lead, id: 10)
        const stage10Column = screen.getByTestId('kanban-column-10');
        expect(stage10Column).toBeInTheDocument();

        const patchCallsBefore = global.fetch.mock.calls.filter(call => 
            call[0]?.includes('/api/crm/deals/') && call[1]?.method === 'PATCH'
        ).length;

        // Simula soltar o card no mesmo estágio (stage 10)
        fireEvent.drop(stage10Column, {
            dataTransfer: {
                getData: (key) => {
                    if (key === 'dealId') return '101';
                    if (key === 'sourceStageId') return '10';
                    return '';
                }
            }
        });

        const patchCallsAfter = global.fetch.mock.calls.filter(call => 
            call[0]?.includes('/api/crm/deals/') && call[1]?.method === 'PATCH'
        ).length;

        // Nenhuma requisição PATCH foi realizada
        expect(patchCallsAfter).toBe(patchCallsBefore);
        expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
    });
});

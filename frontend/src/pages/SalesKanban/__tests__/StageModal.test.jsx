import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StageModal } from '../components/StageModal';

describe('StageModal Component', () => {
    const mockPipelines = [
        {
            id: 1,
            name: 'Pipeline Geral de Vendas',
            product_name: 'Produto Base',
            stages: [
                { id: 101, name: 'Novos Leads' },
                { id: 102, name: 'Venda Fechada' }
            ]
        },
        {
            id: 2,
            name: 'Pipeline Onboarding VIP',
            product_name: 'Mentoria VIP',
            stages: [
                { id: 201, name: 'Boas-Vindas' },
                { id: 202, name: 'Onboarding Concluído' }
            ]
        }
    ];

    test('não renderiza nada se isOpen for false', () => {
        const { container } = render(
            <StageModal
                isOpen={false}
                onClose={vi.fn()}
                onSave={vi.fn()}
                pipelineId={1}
                pipelines={mockPipelines}
            />
        );
        expect(container).toBeEmptyDOMElement();
    });

    test('renderiza formulário de criação de coluna corretamente', () => {
        render(
            <StageModal
                isOpen={true}
                onClose={vi.fn()}
                onSave={vi.fn()}
                pipelineId={1}
                pipelines={mockPipelines}
            />
        );

        expect(screen.getByText('Nova Coluna do CRM')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Ex: Proposta Enviada/i)).toBeInTheDocument();
        expect(screen.getByText('Avançar para outro Pipeline')).toBeInTheDocument();
    });

    test('permite ativar auto-avanço de pipeline e submeter payload com pipeline e stage de destino', async () => {
        const onSave = vi.fn();
        render(
            <StageModal
                isOpen={true}
                onClose={vi.fn()}
                onSave={onSave}
                pipelineId={1}
                pipelines={mockPipelines}
            />
        );

        // Preenche o nome da coluna
        const nameInput = screen.getByPlaceholderText(/Ex: Proposta Enviada/i);
        fireEvent.change(nameInput, { target: { value: 'Venda Concluída' } });

        // Ativa o toggle de avançar para outro pipeline
        const toggleCheckbox = screen.getByTestId('stage-forward-toggle');
        fireEvent.click(toggleCheckbox);

        // Verifica que os selects de pipeline destino e coluna destino aparecem
        expect(screen.getByText('Pipeline Destino')).toBeInTheDocument();
        expect(screen.getByText('Coluna de Destino')).toBeInTheDocument();

        // O pipeline 2 deve ser selecionado como o primeiro destino disponível
        expect(screen.getByDisplayValue(/Pipeline Onboarding VIP/i)).toBeInTheDocument();

        // Clica no botão de submeter
        const submitBtn = screen.getByRole('button', { name: /Criar Coluna/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(onSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Venda Concluída',
                    pipeline_id: 1,
                    forward_to_pipeline_id: 2,
                    forward_to_stage_id: 201
                }),
                undefined
            );
        });
    });

    test('carrega dados pré-existentes de auto-avanço ao editar estágio', async () => {
        const onSave = vi.fn();
        const stageToEdit = {
            id: 102,
            name: 'Venda Aprovada',
            color: 'emerald',
            stage_type: 'won',
            webhook_event_trigger: 'compra_aprovada',
            forward_to_pipeline_id: 2,
            forward_to_stage_id: 202
        };

        render(
            <StageModal
                isOpen={true}
                onClose={vi.fn()}
                onSave={onSave}
                stageToEdit={stageToEdit}
                pipelineId={1}
                pipelines={mockPipelines}
            />
        );

        expect(screen.getByText('Editar Coluna do CRM')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Venda Aprovada')).toBeInTheDocument();

        // O checkbox deve estar ativo
        const toggleCheckbox = screen.getByTestId('stage-forward-toggle');
        expect(toggleCheckbox).toBeChecked();

        // Deve exibir os campos selecionados
        expect(screen.getByDisplayValue(/Pipeline Onboarding VIP/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('Onboarding Concluído')).toBeInTheDocument();

        // Submete edição
        const submitBtn = screen.getByRole('button', { name: /Salvar Coluna/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(onSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Venda Aprovada',
                    pipeline_id: 1,
                    stage_type: 'won',
                    forward_to_pipeline_id: 2,
                    forward_to_stage_id: 202
                }),
                102
            );
        });
    });

    test('permite ativar coluna de follow-up com tempo e unidade personalizados', async () => {
        const onSave = vi.fn();
        render(
            <StageModal
                isOpen={true}
                onClose={vi.fn()}
                onSave={onSave}
                pipelineId={1}
                pipelines={mockPipelines}
            />
        );

        // Preenche nome
        const nameInput = screen.getByPlaceholderText(/Ex: Proposta Enviada/i);
        fireEvent.change(nameInput, { target: { value: 'Aguardando Follow-up' } });

        // Ativa o toggle de follow-up
        const followupToggle = screen.getByTestId('stage-followup-toggle');
        expect(followupToggle).not.toBeChecked();
        fireEvent.click(followupToggle);
        expect(followupToggle).toBeChecked();

        // Altera o tempo para 4 horas
        const valueInput = screen.getByTestId('stage-followup-value-input');
        fireEvent.change(valueInput, { target: { value: '4' } });

        // Submete formulário
        const submitBtn = screen.getByRole('button', { name: /Criar Coluna/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(onSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Aguardando Follow-up',
                    is_followup: true,
                    followup_delay_value: 4,
                    followup_delay_unit: 'hours'
                }),
                undefined
            );
        });
    });
});

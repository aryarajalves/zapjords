import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PipelineFilterControl from './PipelineFilterControl';

describe('PipelineFilterControl', () => {
    const mockPipelines = [
        {
            id: 1,
            name: 'Funil Comercial',
            stages: [
                { id: 10, name: 'Lead Inicial', order_index: 0 },
                { id: 11, name: 'Negociação', order_index: 1 }
            ]
        },
        {
            id: 2,
            name: 'Pós Venda',
            stages: [
                { id: 20, name: 'Onboarding', order_index: 0 }
            ]
        }
    ];

    it('renderiza inativo por padrão e chama setFilterNoPipeline(true) ao clicar no botão negativo', () => {
        const setFilterNoPipeline = vi.fn();
        const setFilterNotInPipelineId = vi.fn();

        render(
            <PipelineFilterControl
                filterNoPipeline={false}
                setFilterNoPipeline={setFilterNoPipeline}
                filterNotInPipelineId={null}
                setFilterNotInPipelineId={setFilterNotInPipelineId}
                pipelines={mockPipelines}
            />
        );

        const btn = screen.getByTestId('filter-pipeline-toggle-btn');
        expect(btn).toHaveTextContent('Sem Kanban');
        fireEvent.click(btn);

        expect(setFilterNoPipeline).toHaveBeenCalledWith(true);
        expect(setFilterNotInPipelineId).toHaveBeenCalledWith(null);
    });

    it('renderiza ativo negativo quando filterNoPipeline=true com select e opções', () => {
        const setFilterNoPipeline = vi.fn();
        const setFilterNotInPipelineId = vi.fn();

        render(
            <PipelineFilterControl
                filterNoPipeline={true}
                setFilterNoPipeline={setFilterNoPipeline}
                filterNotInPipelineId={null}
                setFilterNotInPipelineId={setFilterNotInPipelineId}
                pipelines={mockPipelines}
            />
        );

        expect(screen.getByTestId('filter-pipeline-toggle-btn')).toHaveTextContent('Sem Nenhuma Pipeline');
        expect(screen.getByTestId('filter-pipeline-select')).toBeInTheDocument();
        expect(screen.getByText('🚫 Em Nenhuma Pipeline (Geral - Sem CRM)')).toBeInTheDocument();
        expect(screen.getByText('🚫 Fora da pipeline: Funil Comercial')).toBeInTheDocument();
        expect(screen.getByText('🚫 Fora da pipeline: Pós Venda')).toBeInTheDocument();
    });

    it('ativa filtro positivo ao clicar no botão "No Kanban"', () => {
        const setFilterInPipeline = vi.fn();
        const setFilterPipelineId = vi.fn();
        const setFilterPipelineStageId = vi.fn();
        const setFilterNoPipeline = vi.fn();
        const setFilterNotInPipelineId = vi.fn();

        render(
            <PipelineFilterControl
                filterNoPipeline={false}
                setFilterNoPipeline={setFilterNoPipeline}
                filterNotInPipelineId={null}
                setFilterNotInPipelineId={setFilterNotInPipelineId}
                filterInPipeline={false}
                setFilterInPipeline={setFilterInPipeline}
                filterPipelineId={null}
                setFilterPipelineId={setFilterPipelineId}
                filterPipelineStageId={null}
                setFilterPipelineStageId={setFilterPipelineStageId}
                pipelines={mockPipelines}
            />
        );

        const posBtn = screen.getByTestId('filter-in-pipeline-toggle-btn');
        expect(posBtn).toHaveTextContent('No Kanban');
        fireEvent.click(posBtn);

        expect(setFilterInPipeline).toHaveBeenCalledWith(true);
        expect(setFilterPipelineId).toHaveBeenCalledWith(null);
        expect(setFilterPipelineStageId).toHaveBeenCalledWith(null);
    });

    it('permite selecionar uma pipeline específica e coluna/etapa no modo positivo', () => {
        const setFilterInPipeline = vi.fn();
        const setFilterPipelineId = vi.fn();
        const setFilterPipelineStageId = vi.fn();

        render(
            <PipelineFilterControl
                filterNoPipeline={false}
                setFilterNoPipeline={vi.fn()}
                filterNotInPipelineId={null}
                setFilterNotInPipelineId={vi.fn()}
                filterInPipeline={false}
                setFilterInPipeline={setFilterInPipeline}
                filterPipelineId={1}
                setFilterPipelineId={setFilterPipelineId}
                filterPipelineStageId={null}
                setFilterPipelineStageId={setFilterPipelineStageId}
                pipelines={mockPipelines}
            />
        );

        // Verifica que o seletor de pipeline aparece
        const pipeSelect = screen.getByTestId('filter-in-pipeline-select');
        expect(pipeSelect).toBeInTheDocument();
        expect(screen.getByText('📂 Funil Comercial')).toBeInTheDocument();

        // Verifica que o seletor de coluna da pipeline selecionada aparece
        const stageSelect = screen.getByTestId('filter-in-stage-select');
        expect(stageSelect).toBeInTheDocument();
        expect(screen.getByText('📍 Lead Inicial')).toBeInTheDocument();
        expect(screen.getByText('📍 Negociação')).toBeInTheDocument();

        // Seleciona a etapa 'Negociação' (id 11)
        fireEvent.change(stageSelect, { target: { value: '11' } });
        expect(setFilterPipelineStageId).toHaveBeenCalledWith(11);
    });

    it('ao clicar no botão de limpar (X), desativa ambos os filtros positivo e negativo', () => {
        const setFilterNoPipeline = vi.fn();
        const setFilterNotInPipelineId = vi.fn();
        const setFilterInPipeline = vi.fn();
        const setFilterPipelineId = vi.fn();
        const setFilterPipelineStageId = vi.fn();

        render(
            <PipelineFilterControl
                filterNoPipeline={false}
                setFilterNoPipeline={setFilterNoPipeline}
                filterNotInPipelineId={null}
                setFilterNotInPipelineId={setFilterNotInPipelineId}
                filterInPipeline={false}
                setFilterInPipeline={setFilterInPipeline}
                filterPipelineId={1}
                setFilterPipelineId={setFilterPipelineId}
                filterPipelineStageId={10}
                setFilterPipelineStageId={setFilterPipelineStageId}
                pipelines={mockPipelines}
            />
        );

        const clearBtn = screen.getByTestId('filter-pipeline-clear-btn');
        fireEvent.click(clearBtn);

        expect(setFilterNoPipeline).toHaveBeenCalledWith(false);
        expect(setFilterNotInPipelineId).toHaveBeenCalledWith(null);
        expect(setFilterInPipeline).toHaveBeenCalledWith(false);
        expect(setFilterPipelineId).toHaveBeenCalledWith(null);
        expect(setFilterPipelineStageId).toHaveBeenCalledWith(null);
    });
});

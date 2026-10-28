import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PipelineFilterControl from './PipelineFilterControl';

describe('PipelineFilterControl', () => {
    const mockPipelines = [
        { id: 1, name: 'Funil Comercial' },
        { id: 2, name: 'Pós Venda' }
    ];

    it('renderiza inativo por padrão e chama setFilterNoPipeline(true) ao clicar', () => {
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
        expect(btn).toHaveTextContent('Sem Pipeline no Kanban');
        fireEvent.click(btn);

        expect(setFilterNoPipeline).toHaveBeenCalledWith(true);
        expect(setFilterNotInPipelineId).toHaveBeenCalledWith(null);
    });

    it('renderiza ativo quando filterNoPipeline=true com select e opções das pipelines', () => {
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

        expect(screen.getByTestId('filter-pipeline-toggle-btn')).toHaveTextContent('Sem Nenhuma Pipeline (Kanban)');
        expect(screen.getByTestId('filter-pipeline-select')).toBeInTheDocument();
        expect(screen.getByText('🚫 Em Nenhuma Pipeline (Geral - Sem CRM)')).toBeInTheDocument();
        expect(screen.getByText('🚫 Fora da pipeline: Funil Comercial')).toBeInTheDocument();
        expect(screen.getByText('🚫 Fora da pipeline: Pós Venda')).toBeInTheDocument();
    });

    it('permite selecionar uma pipeline específica no dropdown', () => {
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

        const select = screen.getByTestId('filter-pipeline-select');
        fireEvent.change(select, { target: { value: '2' } });

        expect(setFilterNoPipeline).toHaveBeenCalledWith(false);
        expect(setFilterNotInPipelineId).toHaveBeenCalledWith(2);
    });

    it('ao clicar no botão de limpar (X), desativa ambos os filtros', () => {
        const setFilterNoPipeline = vi.fn();
        const setFilterNotInPipelineId = vi.fn();

        render(
            <PipelineFilterControl
                filterNoPipeline={false}
                setFilterNoPipeline={setFilterNoPipeline}
                filterNotInPipelineId={1}
                setFilterNotInPipelineId={setFilterNotInPipelineId}
                pipelines={mockPipelines}
            />
        );

        const clearBtn = screen.getByTestId('filter-pipeline-clear-btn');
        fireEvent.click(clearBtn);

        expect(setFilterNoPipeline).toHaveBeenCalledWith(false);
        expect(setFilterNotInPipelineId).toHaveBeenCalledWith(null);
    });
});

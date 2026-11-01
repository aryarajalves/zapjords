import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import KanbanSelector from './KanbanSelector';
import * as AuthContext from '../../../AuthContext';

describe('KanbanSelector (Multi-Pipeline & Multi-Stage)', () => {
    const mockPipelines = [
        {
            id: 1,
            name: 'Funil Perpétuo',
            deals_count: 10,
            stages: [
                { id: 101, name: 'Lead' },
                { id: 102, name: 'Boleto' }
            ]
        },
        {
            id: 2,
            name: 'Mentoria High Ticket',
            deals_count: 5,
            stages: [
                { id: 201, name: 'Aplicação' },
                { id: 202, name: 'Fechamento' }
            ]
        }
    ];

    beforeEach(() => {
        vi.spyOn(AuthContext, 'fetchWithAuth').mockResolvedValue({
            ok: true,
            json: async () => mockPipelines
        });
    });

    it('deve listar os pipelines e permitir selecionar múltiplos pipelines', async () => {
        const setSelectedPipelines = vi.fn();
        const setSelectedStages = vi.fn();

        render(
            <KanbanSelector
                activeClient={{ id: 1 }}
                selectedPipelines={[]}
                setSelectedPipelines={setSelectedPipelines}
                selectedStages={[]}
                setSelectedStages={setSelectedStages}
                onLoadContacts={vi.fn()}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Funil Perpétuo')).toBeInTheDocument();
            expect(screen.getByText('Mentoria High Ticket')).toBeInTheDocument();
        });

        // Clica no primeiro pipeline
        fireEvent.click(screen.getByText('Funil Perpétuo'));
        expect(setSelectedPipelines).toHaveBeenCalled();
    });

    it('deve exibir as colunas dos pipelines selecionados e permitir marcar estágios específicos', async () => {
        const setSelectedStages = vi.fn();

        render(
            <KanbanSelector
                activeClient={{ id: 1 }}
                selectedPipelines={[1, 2]}
                setSelectedPipelines={vi.fn()}
                selectedStages={[]}
                setSelectedStages={setSelectedStages}
                onLoadContacts={vi.fn()}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Boleto')).toBeInTheDocument();
            expect(screen.getByText('Aplicação')).toBeInTheDocument();
        });

        // Clica na etapa Boleto
        fireEvent.click(screen.getByText('Boleto'));
        expect(setSelectedStages).toHaveBeenCalled();
    });

    it('deve disparar onLoadContacts ao clicar no botão de carregar contatos', async () => {
        const onLoad = vi.fn();

        render(
            <KanbanSelector
                activeClient={{ id: 1 }}
                selectedPipelines={[1]}
                setSelectedPipelines={vi.fn()}
                selectedStages={[]}
                setSelectedStages={vi.fn()}
                onLoadContacts={onLoad}
                actionButtonLabel="Carregar Contatos do Kanban"
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Carregar Contatos do Kanban')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Carregar Contatos do Kanban'));
        expect(onLoad).toHaveBeenCalled();
    });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import KanbanSelector from './KanbanSelector';

describe('KanbanSelector - Template Variables', () => {
    it('renderiza a seção de variáveis quando templateVariables são fornecidas', () => {
        const templateVariables = [
            { key: '1', label: 'Nome do Lead' },
            { key: '2', label: 'Nome do Produto' }
        ];
        const kanbanVariables = { '1': '{{nome}}' };
        const setKanbanVariables = vi.fn();

        render(
            <KanbanSelector
                activeClient={{ id: 1 }}
                selectedPipelines={[1]}
                setSelectedPipelines={vi.fn()}
                selectedStages={[]}
                setSelectedStages={vi.fn()}
                onLoadContacts={vi.fn()}
                isProcessing={false}
                templateVariables={templateVariables}
                kanbanVariables={kanbanVariables}
                setKanbanVariables={setKanbanVariables}
                activeDropdown={null}
                setActiveDropdown={vi.fn()}
            />
        );

        expect(screen.getByText('Variáveis do Template')).toBeInTheDocument();
        expect(screen.getByText('Nome do Lead')).toBeInTheDocument();
        expect(screen.getByText('Nome do Produto')).toBeInTheDocument();
    });
});

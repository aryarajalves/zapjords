import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatStatusFilterPopover from './ChatStatusFilterPopover';

describe('ChatStatusFilterPopover', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        filterWindowOpen: false,
        setFilterWindowOpen: vi.fn(),
        filterTemplate24h: false,
        setFilterTemplate24h: vi.fn(),
        filterUnread: false,
        setFilterUnread: vi.fn(),
        filterHasNote: false,
        setFilterHasNote: vi.fn(),
        filterUrgent: false,
        setFilterUrgent: vi.fn(),
        filterHasReplied: false,
        setFilterHasReplied: vi.fn(),
        filterHasActiveFunnel: false,
        setFilterHasActiveFunnel: vi.fn(),
        filterLastMessageRead: false,
        setFilterLastMessageRead: vi.fn(),
        filterLastMessageUnread: false,
        setFilterLastMessageUnread: vi.fn(),
        filterNoPipeline: false,
        setFilterNoPipeline: vi.fn(),
        filterNotInPipelineId: null,
        setFilterNotInPipelineId: vi.fn(),
        filterInPipeline: false,
        setFilterInPipeline: vi.fn(),
        filterPipelineId: null,
        setFilterPipelineId: vi.fn(),
        filterPipelineStageId: null,
        setFilterPipelineStageId: vi.fn(),
        pipelines: []
    };

    it('não renderiza o popover se isOpen for false', () => {
        const { container } = render(<ChatStatusFilterPopover {...defaultProps} isOpen={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('renderiza o popover com as seções organizadas quando isOpen for true', () => {
        render(<ChatStatusFilterPopover {...defaultProps} />);

        expect(screen.getByText('Filtros de Status')).toBeInTheDocument();
        expect(screen.getByText('Mensagens & Leitura')).toBeInTheDocument();
        expect(screen.getByText('Atendimento & Automação')).toBeInTheDocument();
        expect(screen.getByText('CRM Kanban de Vendas')).toBeInTheDocument();

        // Checar itens
        expect(screen.getByText('Não lidas')).toBeInTheDocument();
        expect(screen.getByText('Janela 24h')).toBeInTheDocument();
        expect(screen.getByText('Template 24h')).toBeInTheDocument();
        expect(screen.getByText('Urgentes')).toBeInTheDocument();
    });

    it('permite selecionar múltiplos filtros sem fechar o popover', () => {
        const setUnread = vi.fn();
        const setWindow = vi.fn();
        const setReplied = vi.fn();

        render(
            <ChatStatusFilterPopover
                {...defaultProps}
                setFilterUnread={setUnread}
                setFilterWindowOpen={setWindow}
                setFilterHasReplied={setReplied}
            />
        );

        // Clica em "Não lidas"
        fireEvent.click(screen.getByText('Não lidas'));
        expect(setUnread).toHaveBeenCalledWith(true);

        // Clica em "Janela 24h"
        fireEvent.click(screen.getByText('Janela 24h'));
        expect(setWindow).toHaveBeenCalledWith(true);

        // Clica em "Respondeu"
        fireEvent.click(screen.getByText('Respondeu'));
        expect(setReplied).toHaveBeenCalledWith(true);

        // O onClose NÃO deve ser chamado ao alternar filtros
        expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('exibe badge de contagem e botão Limpar quando houver filtros ativos', () => {
        const handleClearWindow = vi.fn();
        const handleClearUnread = vi.fn();

        render(
            <ChatStatusFilterPopover
                {...defaultProps}
                filterWindowOpen={true}
                filterUnread={true}
                setFilterWindowOpen={handleClearWindow}
                setFilterUnread={handleClearUnread}
            />
        );

        expect(screen.getByText('2 ativos')).toBeInTheDocument();
        const clearBtn = screen.getByText('Limpar');
        expect(clearBtn).toBeInTheDocument();

        fireEvent.click(clearBtn);
        expect(handleClearWindow).toHaveBeenCalledWith(false);
        expect(handleClearUnread).toHaveBeenCalledWith(false);
    });

    it('dispara onClose ao clicar no botão Concluir', () => {
        const handleClose = vi.fn();
        render(<ChatStatusFilterPopover {...defaultProps} onClose={handleClose} />);

        const submitBtn = screen.getByText(/Concluir/i);
        fireEvent.click(submitBtn);

        expect(handleClose).toHaveBeenCalledTimes(1);
    });
});

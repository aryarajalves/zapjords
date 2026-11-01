import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KanbanCard } from '../components/KanbanCard';
import { LeadHistoryModal } from '../components/LeadHistoryModal';
import { formatBrasiliaDateTime, formatBrasiliaDate } from '../utils/kanbanDateUtils';
import * as kanbanApiActions from '../utils/kanbanApiActions';

vi.mock('../utils/kanbanApiActions', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        apiRequestJson: vi.fn()
    };
});

describe('kanbanDateUtils', () => {
    it('formata data e hora no horário oficial de Brasília', () => {
        // 2026-10-30T17:30:00Z -> 14:30 no horário de Brasília (UTC-3)
        const dateUtc = '2026-10-30T17:30:00Z';
        const formatted = formatBrasiliaDateTime(dateUtc);
        expect(formatted).toContain('30/10/2026');
        expect(formatted).toContain('14:30');
    });

    it('retorna string vazia para valores nulos ou inválidos', () => {
        expect(formatBrasiliaDateTime(null)).toBe('');
        expect(formatBrasiliaDateTime(undefined)).toBe('');
        expect(formatBrasiliaDateTime('invalid-date')).toBe('');
        expect(formatBrasiliaDate(null)).toBe('');
    });
});

describe('KanbanCard - Novas Funcionalidades de Data e Histórico', () => {
    const mockDeal = {
        id: 99,
        contact_name: 'Roberto Vendas',
        contact_phone: '5511988887777',
        channel: 'whatsapp',
        value: 2500.0,
        status: 'open',
        stage_entered_at: '2026-10-30T18:00:00Z' // 15:00 em Brasília
    };

    it('exibe a data e horário de entrada na etapa no horário de Brasília', () => {
        render(
            <KanbanCard
                deal={mockDeal}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onOpenChat={vi.fn()}
                onOpenHistory={vi.fn()}
            />
        );

        const stageTimeEl = screen.getByTestId('deal-stage-entered-99');
        expect(stageTimeEl).toBeInTheDocument();
        expect(stageTimeEl.textContent).toContain('Na etapa:');
        expect(stageTimeEl.textContent).toContain('30/10/2026 às 15:00');
    });

    it('exibe a data e horário da venda quando o deal é ganho', () => {
        const wonDeal = {
            ...mockDeal,
            status: 'won',
            won_at: '2026-10-30T19:45:00Z' // 16:45 em Brasília
        };

        render(
            <KanbanCard
                deal={wonDeal}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onOpenChat={vi.fn()}
                onOpenHistory={vi.fn()}
            />
        );

        const wonBadge = screen.getByTestId('deal-won-time-99');
        expect(wonBadge).toBeInTheDocument();
        expect(wonBadge.textContent).toContain('Venda:');
        expect(wonBadge.textContent).toContain('30/10/2026 às 16:45');
    });

    it('dispara onOpenHistory ao clicar no botão de histórico do card', () => {
        const handleOpenHistory = vi.fn();
        render(
            <KanbanCard
                deal={mockDeal}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onOpenChat={vi.fn()}
                onOpenHistory={handleOpenHistory}
            />
        );

        const historyBtn = screen.getByTitle('Ver histórico e linha do tempo do lead');
        expect(historyBtn).toBeInTheDocument();

        fireEvent.click(historyBtn);
        expect(handleOpenHistory).toHaveBeenCalledWith(mockDeal);
    });
});

describe('LeadHistoryModal Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockDeal = {
        id: 15,
        contact_name: 'Mariana Souza',
        contact_phone: '5511977776666',
        product_name: 'Curso Avançado',
        value: 1200.0
    };

    it('renderiza o modal e carrega a timeline via API', async () => {
        vi.mocked(kanbanApiActions.apiRequestJson).mockResolvedValueOnce({
            deal_id: 15,
            contact_name: 'Mariana Souza',
            contact_phone: '5511977776666',
            timeline: [
                {
                    id: 'act_1',
                    type: 'won',
                    title: '🎉 Venda Concretizada!',
                    description: 'Venda confirmada no valor de R$ 1.200,00',
                    timestamp: '2026-10-30T19:00:00Z'
                },
                {
                    id: 'trg_1',
                    type: 'whatsapp_dispatch',
                    title: '💬 WhatsApp: Boas-vindas',
                    description: 'Status: Delivered',
                    timestamp: '2026-10-30T17:00:00Z'
                },
                {
                    id: 'act_2',
                    type: 'stage_change',
                    title: 'Movido para Proposta',
                    description: "De 'Lead' para 'Proposta'",
                    timestamp: '2026-10-30T16:00:00Z'
                }
            ]
        });

        const handleClose = vi.fn();
        render(
            <LeadHistoryModal
                isOpen={true}
                onClose={handleClose}
                deal={mockDeal}
                clientId={1}
            />
        );

        expect(screen.getByTestId('lead-history-modal')).toBeInTheDocument();
        expect(screen.getByText('Mariana Souza')).toBeInTheDocument();
        expect(screen.getByText('5511977776666')).toBeInTheDocument();

        // Esperar carregar dados da API
        await waitFor(() => {
            expect(screen.getByText('🎉 Venda Concretizada!')).toBeInTheDocument();
            expect(screen.getByText('💬 WhatsApp: Boas-vindas')).toBeInTheDocument();
            expect(screen.getByText('Movido para Proposta')).toBeInTheDocument();
        });

        // Fechar pelo botão de fechar
        const closeBtn = screen.getByRole('button', { name: 'Fechar' });
        fireEvent.click(closeBtn);
        expect(handleClose).toHaveBeenCalled();
    });
});

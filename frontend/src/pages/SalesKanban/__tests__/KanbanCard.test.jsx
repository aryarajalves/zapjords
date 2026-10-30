import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { KanbanCard } from '../components/KanbanCard';

const mockDeal = {
    id: 101,
    contact_name: 'Lucas Silva',
    contact_phone: '5511999998888',
    channel: 'kiwify',
    title: 'Oportunidade Curso',
    product_name: 'Mentoria Elite',
    original_value: 5000.0,
    value: 4200.0,
    status: 'open',
    notes: 'Negociação avançada'
};

describe('KanbanCard Component', () => {
    it('renderiza o nome da pessoa em destaque de primeira', () => {
        render(
            <KanbanCard
                deal={mockDeal}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onOpenChat={vi.fn()}
            />
        );

        const nameEl = screen.getByText('Lucas Silva');
        expect(nameEl).toBeInTheDocument();
        expect(nameEl.className).toContain('font-black');
    });

    it('renderiza o preço do produto e badge de desconto de primeira', () => {
        render(
            <KanbanCard
                deal={mockDeal}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onOpenChat={vi.fn()}
            />
        );

        // Preço real com desconto em destaque
        expect(screen.getByText(/4\.200/)).toBeInTheDocument();
        // Preço de tabela original riscado
        expect(screen.getByText(/5\.000/)).toBeInTheDocument();
        expect(screen.getByText('Desconto')).toBeInTheDocument();
    });

    it('renderiza a tag do produto e canal de origem', () => {
        render(
            <KanbanCard
                deal={mockDeal}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onOpenChat={vi.fn()}
            />
        );

        expect(screen.getByText('Mentoria Elite')).toBeInTheDocument();
        expect(screen.getByText('Kiwify')).toBeInTheDocument();
    });

    it('dispara onEdit ao clicar no card para ver todas as informações', () => {
        const handleEdit = vi.fn();
        render(
            <KanbanCard
                deal={mockDeal}
                onEdit={handleEdit}
                onDelete={vi.fn()}
                onOpenChat={vi.fn()}
            />
        );

        const card = screen.getByTitle('Clique para ver todas as informações do lead');
        fireEvent.click(card);

        expect(handleEdit).toHaveBeenCalledWith(mockDeal);
    });

    it('dispara onOpenChat ao clicar no botão de chat do ZapVoice sem disparar onEdit', () => {
        const handleEdit = vi.fn();
        const handleOpenChat = vi.fn();
        render(
            <KanbanCard
                deal={mockDeal}
                onEdit={handleEdit}
                onDelete={vi.fn()}
                onOpenChat={handleOpenChat}
            />
        );

        const chatBtn = screen.getByTitle('Abrir conversa no ZapVoice');
        fireEvent.click(chatBtn);

        expect(handleOpenChat).toHaveBeenCalledWith('5511999998888', 'Lucas Silva');
        expect(handleEdit).not.toHaveBeenCalled();
    });

    it('dispara onDelete ao clicar no botão de lixeira sem abrir o card de edição', () => {
        const handleEdit = vi.fn();
        const handleDelete = vi.fn();
        render(
            <KanbanCard
                deal={mockDeal}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onOpenChat={vi.fn()}
            />
        );

        const deleteBtn = screen.getByTitle('Remover contato do Kanban');
        fireEvent.click(deleteBtn);

        expect(handleDelete).toHaveBeenCalledWith(101, 'Lucas Silva');
        expect(handleEdit).not.toHaveBeenCalled();
    });

    it('dispara onToggleSelect ao clicar no checkbox de seleção sem abrir o card de edição', () => {
        const handleEdit = vi.fn();
        const handleToggleSelect = vi.fn();
        render(
            <KanbanCard
                deal={mockDeal}
                onEdit={handleEdit}
                onDelete={vi.fn()}
                onOpenChat={vi.fn()}
                isSelected={false}
                onToggleSelect={handleToggleSelect}
            />
        );

        const checkbox = screen.getByTitle('Selecionar lead para ações em massa');
        fireEvent.click(checkbox);

        expect(handleToggleSelect).toHaveBeenCalledWith(101);
        expect(handleEdit).not.toHaveBeenCalled();
    });

    it('aplica estilo de destaque e anel neon quando isSelected=true', () => {
        render(
            <KanbanCard
                deal={mockDeal}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onOpenChat={vi.fn()}
                isSelected={true}
                onToggleSelect={vi.fn()}
            />
        );

        const card = screen.getByTitle('Clique para ver todas as informações do lead');
        expect(card.className).toContain('border-blue-500/80');
        expect(card.className).toContain('ring-1 ring-blue-500/40');
    });

    it('exibe alerta de follow-up vencido e borda em âmbar quando a coluna é de follow-up e o prazo expirou', () => {
        const stageFollowup = {
            id: 1,
            is_followup: true,
            followup_delay_value: 3,
            followup_delay_unit: 'hours'
        };

        // Deal que entrou há 5 horas (vencido)
        const pastDate = new Date(Date.now() - 5 * 3600 * 1000).toISOString();
        const overdueDeal = {
            ...mockDeal,
            id: 201,
            stage_entered_at: pastDate,
            needs_followup: true
        };

        render(
            <KanbanCard
                deal={overdueDeal}
                stage={stageFollowup}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onOpenChat={vi.fn()}
            />
        );

        // Deve exibir o badge chamativo de alerta
        expect(screen.getByText(/⚠️ Precisa de Follow-up/i)).toBeInTheDocument();
        const badge = screen.getByTestId('deal-followup-overdue-201');
        expect(badge).toBeInTheDocument();

        // O card deve ter borda em âmbar
        const card = screen.getByTitle('Clique para ver todas as informações do lead');
        expect(card.className).toContain('border-amber-500/60');
    });

    it('exibe indicador sutil de tempo restante quando o prazo de follow-up não expirou', () => {
        const stageFollowup = {
            id: 1,
            is_followup: true,
            followup_delay_value: 3,
            followup_delay_unit: 'hours'
        };

        // Deal que entrou há apenas 30 minutos (no prazo)
        const recentDate = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const pendingDeal = {
            ...mockDeal,
            id: 202,
            stage_entered_at: recentDate,
            needs_followup: false
        };

        render(
            <KanbanCard
                deal={pendingDeal}
                stage={stageFollowup}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onOpenChat={vi.fn()}
            />
        );

        expect(screen.getByText(/Follow-up no prazo/i)).toBeInTheDocument();
        expect(screen.getByText(/restam/i)).toBeInTheDocument();
        expect(screen.queryByText(/⚠️ Precisa de Follow-up/i)).not.toBeInTheDocument();
    });

    it('não exibe indicadores de follow-up se a coluna não for de follow-up', () => {
        const normalStage = {
            id: 2,
            is_followup: false
        };

        render(
            <KanbanCard
                deal={mockDeal}
                stage={normalStage}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onOpenChat={vi.fn()}
            />
        );

        expect(screen.queryByText(/Precisa de Follow-up/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Follow-up no prazo/i)).not.toBeInTheDocument();
    });

    it('atualiza o contador de follow-up automaticamente quando currentTime avança além do prazo limite', () => {
        const stageFollowup = {
            id: 1,
            is_followup: true,
            followup_delay_value: 10,
            followup_delay_unit: 'minutes'
        };

        const baseTime = 1700000000000;
        // Entrou 8 minutos antes (restam 2 minutos)
        const enteredDate = new Date(baseTime - 8 * 60 * 1000).toISOString();
        const deal = {
            ...mockDeal,
            id: 203,
            stage_entered_at: enteredDate
        };

        const { rerender } = render(
            <KanbanCard
                deal={deal}
                stage={stageFollowup}
                currentTime={baseTime}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onOpenChat={vi.fn()}
            />
        );

        // Primeiro momento: no prazo
        expect(screen.getByText(/Follow-up no prazo/i)).toBeInTheDocument();
        expect(screen.getByText(/restam 2m/i)).toBeInTheDocument();

        // Avança currentTime via WebSocket/timer em 5 minutos (total decorrido = 13 minutos > 10 minutos limite)
        const advancedTime = baseTime + 5 * 60 * 1000;
        rerender(
            <KanbanCard
                deal={deal}
                stage={stageFollowup}
                currentTime={advancedTime}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onOpenChat={vi.fn()}
            />
        );

        // Agora deve mudar automaticamente para alerta vencido
        expect(screen.getByText(/⚠️ Precisa de Follow-up/i)).toBeInTheDocument();
        expect(screen.getByText(/\+3m/i)).toBeInTheDocument();
    });

    it('exibe a bolinha verde de mensagens não lidas e o badge de janela de 24h aberta no card', () => {
        const now = Date.now();
        const futureExpiry = new Date(now + 14 * 3600 * 1000 + 30 * 60 * 1000).toISOString();
        const dealWithWindowAndUnread = {
            ...mockDeal,
            id: 301,
            unread_count: 4,
            window_open: true,
            window_expires_at: futureExpiry,
            window_remaining_seconds: 14 * 3600 + 1800
        };

        render(
            <KanbanCard
                deal={dealWithWindowAndUnread}
                currentTime={now}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onOpenChat={vi.fn()}
            />
        );

        // Badge verde de não lidas no topo do card
        const unreadBadge = screen.getByTestId('deal-unread-badge-301');
        expect(unreadBadge).toBeInTheDocument();
        expect(unreadBadge.textContent).toBe('4');

        // Badge de janela 24h aberta com contagem regressiva
        const windowBadge = screen.getByTestId('deal-window-open-badge-301');
        expect(windowBadge).toBeInTheDocument();
        expect(windowBadge.textContent).toContain('Janela 24h');
        expect(windowBadge.textContent).toContain('14h 30m');
    });
});

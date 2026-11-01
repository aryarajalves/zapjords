import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import DispatchStatsBar from './DispatchStatsBar';
import DispatchPagination from './DispatchPagination';
import DispatchModalHeader from './DispatchModalHeader';
import DispatchModalFooter from './DispatchModalFooter';
import DispatchTableRow from './DispatchTableRow';

describe('DispatchHistoryModal subcomponents', () => {
  describe('DispatchStatsBar', () => {
    it('não renderiza nada se dispatchStats for nulo', () => {
      const { container } = render(<DispatchStatsBar dispatchStats={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('renderiza corretamente os 5 cards com valores e porcentagens formatados', () => {
      const stats = {
        total_dispatches: 1250,
        delivered: 1100,
        delivered_pct: 88,
        read: 950,
        read_pct: 76,
        interactions: 320,
        interactions_pct: 25.6,
        total_cost: 154.80
      };

      render(<DispatchStatsBar dispatchStats={stats} />);

      expect(screen.getByText('Total de Disparos')).toBeInTheDocument();
      expect(screen.getByText('1.250')).toBeInTheDocument();

      expect(screen.getByText('Entregues')).toBeInTheDocument();
      expect(screen.getByText('1.100')).toBeInTheDocument();
      expect(screen.getByText('88%')).toBeInTheDocument();

      expect(screen.getByText('Abertura')).toBeInTheDocument();
      expect(screen.getByText('950')).toBeInTheDocument();
      expect(screen.getByText('76%')).toBeInTheDocument();

      expect(screen.getByText('Interações')).toBeInTheDocument();
      expect(screen.getByText('320')).toBeInTheDocument();
      expect(screen.getByText('25.6%')).toBeInTheDocument();

      expect(screen.getByText('Investimento')).toBeInTheDocument();
      expect(screen.getByText('R$ 154,80')).toBeInTheDocument();
    });
  });

  describe('DispatchModalHeader', () => {
    it('renderiza o título com o nome da integração', () => {
      render(
        <DispatchModalHeader
          integrationName="Checkout Hotmart"
        />
      );

      expect(screen.getByText(/Histórico de Disparos: Checkout Hotmart/i)).toBeInTheDocument();
    });
  });

  describe('DispatchPagination', () => {
    it('chama setDispatchPage ao clicar no botão da página', () => {
      const setPageMock = vi.fn();
      render(
        <DispatchPagination
          dispatchLimit={20}
          setDispatchLimit={() => {}}
          dispatchPage={1}
          setDispatchPage={setPageMock}
          dispatchTotal={45}
          totalPages={3}
        />
      );

      const buttons = screen.getAllByRole('button');
      // O último botão é o "próximo"
      const nextBtn = buttons[buttons.length - 1];
      fireEvent.click(nextBtn);

      expect(setPageMock).toHaveBeenCalled();
    });
  });

  describe('DispatchModalFooter', () => {
    it('dispara onRefresh e onClose ao clicar nos respectivos botões', () => {
      const onRefreshMock = vi.fn();
      const onCloseMock = vi.fn();

      render(<DispatchModalFooter onRefresh={onRefreshMock} onClose={onCloseMock} />);

      const refreshBtn = screen.getByRole('button', { name: /Atualizar Fila/i });
      fireEvent.click(refreshBtn);
      expect(onRefreshMock).toHaveBeenCalledTimes(1);

      const closeBtn = screen.getByRole('button', { name: /Fechar Painel/i });
      fireEvent.click(closeBtn);
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('DispatchTableRow', () => {
    it('renderiza badge E-MAIL e ícone correspondente quando sent_as é EMAIL', () => {
      const emailItem = {
        id: 777,
        contact_name: "Cliente E-mail",
        contact_phone: "cliente@exemplo.com",
        event_type: "compra_aprovada",
        sent_as: "EMAIL",
        template_name: "E-mail: Acesso Confirmado",
        status: "completed",
        total_sent: 1,
        total_delivered: 1,
        total_failed: 0
      };

      render(
        <table>
          <tbody>
            <DispatchTableRow
              item={emailItem}
              selectedDispatchIds={[]}
              handleToggleSelectDispatch={vi.fn()}
              setSelectedDispatch={vi.fn()}
              setIsPipelineModalOpen={vi.fn()}
              handlePlayDispatch={vi.fn()}
              isPlaying={{}}
              setConfirmDeleteDispatch={vi.fn()}
              isCancelling={{}}
              fetchChildren={vi.fn()}
            />
          </tbody>
        </table>
      );

      expect(screen.getByText('E-MAIL')).toBeInTheDocument();
      expect(screen.getByText('E-mail: Acesso Confirmado')).toBeInTheDocument();
      expect(screen.getByText('Cliente E-mail')).toBeInTheDocument();
      expect(screen.getByText('cliente@exemplo.com')).toBeInTheDocument();
      expect(screen.getByText('COMPRA APROVADA')).toBeInTheDocument();
    });
  });
});

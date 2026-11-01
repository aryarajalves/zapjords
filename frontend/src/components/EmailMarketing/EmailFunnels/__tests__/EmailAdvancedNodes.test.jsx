import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EmailConditionNode from '../flow/nodes/EmailConditionNode';
import EmailSplitNode from '../flow/nodes/EmailSplitNode';
import EmailWaitUntilNode from '../flow/nodes/EmailWaitUntilNode';
import EmailSubFunnelNode from '../flow/nodes/EmailSubFunnelNode';
import EmailFunnelSidebar from '../flow/EmailFunnelSidebar';
import EmailContextMenu from '../flow/EmailContextMenu';

// Mock do reactflow
vi.mock('reactflow', () => ({
  Handle: ({ id, type, position }) => (
    <div data-testid={`handle-${type}-${id || position}`} />
  ),
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' }
}));

describe('Email Advanced Flow Nodes Suite', () => {
  it('renderiza EmailConditionNode com opções de condição e handles de Sim/Não', () => {
    const onUpdateNode = vi.fn();
    const onDeleteNode = vi.fn();
    const onDuplicateNode = vi.fn();

    render(
      <EmailConditionNode
        id="c1"
        data={{
          condition_type: 'has_tag',
          tag_name: 'vip',
          onUpdateNode,
          onDeleteNode,
          onDuplicateNode
        }}
      />
    );

    expect(screen.getByText(/Condição \(Se \/ Senão\)/i)).toBeInTheDocument();
    expect(screen.getByText(/SIM \(Atende\)/i)).toBeInTheDocument();
    expect(screen.getByText(/NÃO \(Outro\)/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('vip')).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Ex: interessado/i);
    fireEvent.change(input, { target: { value: 'comprador' } });
    expect(onUpdateNode).toHaveBeenCalledWith('c1', expect.objectContaining({ tag_name: 'comprador' }));
  });

  it('renderiza EmailSplitNode com slider de porcentagem e saídas A e B', () => {
    const onUpdateNode = vi.fn();

    render(
      <EmailSplitNode
        id="s1"
        data={{
          split_ratio: 60,
          onUpdateNode
        }}
      />
    );

    expect(screen.getByText(/Divisor A\/B \(Split\)/i)).toBeInTheDocument();
    expect(screen.getByText(/ROTA A \(60%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/ROTA B \(40%\)/i)).toBeInTheDocument();

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '70' } });
    expect(onUpdateNode).toHaveBeenCalledWith('s1', expect.objectContaining({ split_ratio: 70 }));
  });

  it('renderiza EmailWaitUntilNode com horários e opções de dias úteis', () => {
    const onUpdateNode = vi.fn();

    render(
      <EmailWaitUntilNode
        id="w1"
        data={{
          wait_mode: 'time_window',
          start_time: '09:00',
          end_time: '18:00',
          weekdays_only: true,
          onUpdateNode
        }}
      />
    );

    expect(screen.getByText(/Esperar Horário \/ Dia/i)).toBeInTheDocument();
    expect(screen.getByText(/Apenas em dias úteis/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();
  });

  it('renderiza EmailSubFunnelNode com dropdown de seleção de funis', () => {
    const onUpdateNode = vi.fn();
    const mockFunnels = [
      { id: 10, name: 'Funil Nutrição VIP' },
      { id: 20, name: 'Funil Recuperação Pix' }
    ];

    render(
      <EmailSubFunnelNode
        id="sub1"
        data={{
          target_funnel_id: '10',
          exit_current_funnel: true,
          funnels: mockFunnels,
          onUpdateNode
        }}
      />
    );

    expect(screen.getByText(/Ir Para Outro Funil/i)).toBeInTheDocument();
    expect(screen.getByText('Funil Nutrição VIP')).toBeInTheDocument();
    expect(screen.getByText('Funil Recuperação Pix')).toBeInTheDocument();
  });

  it('renderiza novos nós na Sidebar e no ContextMenu', () => {
    const onAddNode = vi.fn();

    render(
      <EmailFunnelSidebar
        name="Teste"
        setName={vi.fn()}
        description=""
        setDescription={vi.fn()}
        triggerType="tag"
        setTriggerType={vi.fn()}
        triggerTag=""
        setTriggerTag={vi.fn()}
        triggerWebhookStatus="carrinho_abandonado"
        setTriggerWebhookStatus={vi.fn()}
        stopOnPurchase={true}
        setStopOnPurchase={vi.fn()}
        stopTagsInput=""
        setStopTagsInput={vi.fn()}
        onAddNode={onAddNode}
      />
    );

    expect(screen.getByText(/\+ Condição \(Se \/ Senão\)/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Divisor A\/B \(Split\)/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Esperar Horário \/ Dia/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Ir Para Outro Funil/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/\+ Condição \(Se \/ Senão\)/i));
    expect(onAddNode).toHaveBeenCalledWith('condition');
  });
});

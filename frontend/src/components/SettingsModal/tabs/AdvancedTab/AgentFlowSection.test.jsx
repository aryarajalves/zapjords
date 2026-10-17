import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AgentFlowSection from './AgentFlowSection';

describe('AgentFlowSection', () => {
  const defaultFormData = {
    AGENT_MEMORY_WEBHOOK_URL: 'https://agentbackcrassos.aryaraj.shop/webhooks/memory/memoria',
    CHAT_MESSAGES_WEBHOOK_URL: 'https://agentbackcrassos.aryaraj.shop/webhooks/receive/whatsapp'
  };

  it('renderiza o cabeçalho unificado do AgentFlow e os 2 webhooks no mesmo painel', () => {
    render(
      <AgentFlowSection
        formData={defaultFormData}
        handleChange={vi.fn()}
        testingWebhook={false}
        handleTestWebhook={vi.fn()}
        setShowMemoryLogsTable={vi.fn()}
        setMemoryLogsPage={vi.fn()}
        fetchMemoryLogs={vi.fn()}
        testingChatWebhook={false}
        handleTestChatWebhook={vi.fn()}
        setShowChatLogsTable={vi.fn()}
        setChatLogsPage={vi.fn()}
        fetchChatLogs={vi.fn()}
      />
    );

    expect(screen.getByText('AgentFlow (Agente de IA)')).toBeDefined();
    expect(screen.getByText('Webhook de Memória do Agente')).toBeDefined();
    expect(screen.getByText('Webhook de Integração de Mensagens (AgentFlow)')).toBeDefined();
    expect(screen.getByDisplayValue('https://agentbackcrassos.aryaraj.shop/webhooks/memory/memoria')).toBeDefined();
    expect(screen.getByDisplayValue('https://agentbackcrassos.aryaraj.shop/webhooks/receive/whatsapp')).toBeDefined();
  });

  it('aciona handleTestWebhook ao clicar no botão testar da memória', () => {
    const handleTestWebhook = vi.fn();
    render(
      <AgentFlowSection
        formData={defaultFormData}
        handleChange={vi.fn()}
        testingWebhook={false}
        handleTestWebhook={handleTestWebhook}
        setShowMemoryLogsTable={vi.fn()}
        setMemoryLogsPage={vi.fn()}
        fetchMemoryLogs={vi.fn()}
        testingChatWebhook={false}
        handleTestChatWebhook={vi.fn()}
        setShowChatLogsTable={vi.fn()}
        setChatLogsPage={vi.fn()}
        fetchChatLogs={vi.fn()}
      />
    );

    const testButtons = screen.getAllByText('Testar');
    fireEvent.click(testButtons[0]);
    expect(handleTestWebhook).toHaveBeenCalledTimes(1);
  });

  it('aciona handleTestChatWebhook ao clicar no botão testar das mensagens', () => {
    const handleTestChatWebhook = vi.fn();
    render(
      <AgentFlowSection
        formData={defaultFormData}
        handleChange={vi.fn()}
        testingWebhook={false}
        handleTestWebhook={vi.fn()}
        setShowMemoryLogsTable={vi.fn()}
        setMemoryLogsPage={vi.fn()}
        fetchMemoryLogs={vi.fn()}
        testingChatWebhook={false}
        handleTestChatWebhook={handleTestChatWebhook}
        setShowChatLogsTable={vi.fn()}
        setChatLogsPage={vi.fn()}
        fetchChatLogs={vi.fn()}
      />
    );

    const testButtons = screen.getAllByText('Testar');
    fireEvent.click(testButtons[1]);
    expect(handleTestChatWebhook).toHaveBeenCalledTimes(1);
  });
});

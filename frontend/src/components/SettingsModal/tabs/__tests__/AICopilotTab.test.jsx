import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AICopilotTab from '../AICopilotTab';

vi.mock('../../../../AuthContext', () => ({
    fetchWithAuth: (url, opts, clientId) => global.fetch(url, opts)
}));

vi.mock('../../../../contexts/ClientContext', () => ({
    useClient: () => ({ activeClient: { id: 1 } })
}));

vi.mock('react-hot-toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn()
    }
}));

const mockModels = {
    models: [
        {
            id: 'gpt-6.1-sol',
            name: 'GPT-6.1 Sol',
            generation: 'GPT-6',
            badge: 'Recomendado',
            description: 'Inteligência avançada e custo equilibrado',
            input_per_million: 2.0,
            output_per_million: 10.0,
            context_window: '500k tokens'
        },
        {
            id: 'gpt-5.6-terra',
            name: 'GPT-5.6 Terra',
            generation: 'GPT-5.6',
            badge: 'Equilibrado',
            description: 'Modelo equilibrado 5.6',
            input_per_million: 2.0,
            output_per_million: 12.0,
            context_window: '128k tokens'
        }
    ]
};

const mockSettings = {
    model: 'gpt-6.1-sol',
    has_api_key: true,
    masked_api_key: 'sk-...4567',
    system_prompt: 'Prompt de vendas base',
    default_prompt: 'Prompt padrão de fábrica',
    temperature: 0.7,
    usd_to_brl: 5.70
};

const mockPrompts = {
    prompts: [
        {
            id: 1,
            name: 'Geral (Vendas)',
            product_identifier: 'Geral',
            prompt_text: 'Prompt de vendas base',
            is_default: true
        }
    ]
};

const mockFinancial = {
    summary: {
        total_calls: 15,
        total_tokens: 3200,
        total_cost_usd: 0.0125,
        total_cost_brl: 0.07125,
        avg_cost_usd: 0.00083,
        avg_cost_brl: 0.00475
    },
    by_model: [
        {
            model: 'gpt-6.1-sol',
            model_name: 'GPT-6.1 Sol',
            calls: 10,
            tokens: 2500,
            cost_usd: 0.0100
        }
    ],
    recent_logs: [
        {
            id: 1,
            created_at: '2026-11-07T10:00:00Z',
            model: 'gpt-6.1-sol',
            model_name: 'GPT-6.1 Sol',
            contact_name: 'Stella',
            prompt_tokens: 150,
            completion_tokens: 50,
            total_tokens: 200,
            cost_usd: 0.0008,
            cost_brl: 0.0045,
            question_preview: 'Qual o valor do plano?'
        }
    ]
};

describe('AICopilotTab Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn((url) => {
            if (url.includes('/ai/models')) {
                return Promise.resolve({ ok: true, json: async () => mockModels });
            }
            if (url.includes('/ai/settings')) {
                return Promise.resolve({ ok: true, json: async () => mockSettings });
            }
            if (url.includes('/ai/prompts')) {
                return Promise.resolve({ ok: true, json: async () => mockPrompts });
            }
            if (url.includes('/ai/financial')) {
                return Promise.resolve({ ok: true, json: async () => mockFinancial });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });
    });

    it('renderiza as configurações de modelo e prompts sem input manual de chave da OpenAI', async () => {
        render(<AICopilotTab />);

        expect(screen.getByText(/Carregando configurações de inteligência artificial/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText(/Modelo de Inteligência Artificial \(LLM\)/i)).toBeInTheDocument();
            expect(screen.getByDisplayValue('Prompt de vendas base')).toBeInTheDocument();
            // Garante que o input manual de Chave de API não existe mais na tela
            expect(screen.queryByPlaceholderText(/sk-proj/i)).not.toBeInTheDocument();
            expect(screen.queryByText(/Chave de API OpenAI/i)).not.toBeInTheDocument();
        });
    });

    it('alterna para a sub-aba de Consumo & Financeiro e exibe as métricas de custo', async () => {
        render(<AICopilotTab />);

        await waitFor(() => {
            expect(screen.getByText(/Consumo & Financeiro/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Consumo & Financeiro/i));

        await waitFor(() => {
            expect(screen.getByText(/Resumo de Consumo de Tokens/i)).toBeInTheDocument();
            expect(screen.getByText(/Total Gasto \(USD\)/i)).toBeInTheDocument();
            expect(screen.getByText('15')).toBeInTheDocument();
        });
    });

    it('restaura o prompt padrão de vendas ao clicar no botão de restaurar', async () => {
        render(<AICopilotTab />);

        await waitFor(() => {
            expect(screen.getByText(/Restaurar Padrão de Vendas/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Restaurar Padrão de Vendas/i));

        await waitFor(() => {
            expect(screen.getByDisplayValue('Prompt padrão de fábrica')).toBeInTheDocument();
        });
    });

    it('exibe e permite ajustar taxa de conversão USD para BRL', async () => {
        render(<AICopilotTab />);

        await waitFor(() => {
            expect(screen.getByText(/Taxa de Conversão Dólar/i)).toBeInTheDocument();
            expect(screen.getByDisplayValue('5.7')).toBeInTheDocument();
        });
    });
});

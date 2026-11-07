import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FloatingAIChat from '../FloatingAIChat';

vi.mock('../../contexts/ClientContext', () => ({
    useClient: () => ({ activeClient: { id: 1 } })
}));

vi.mock('react-hot-toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn()
    }
}));

describe('FloatingAIChat Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn((url) => {
            if (url.includes('/ai/settings')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ model: 'gpt-6.1-sol' })
                });
            }
            if (url.includes('/ai/prompts')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ prompts: [{ id: 1, name: 'Geral', is_default: true }] })
                });
            }
            if (url.includes('/ai/chat')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        reply: '"Olá Stella, temos uma condição especial para você hoje!"',
                        model: 'gpt-6.1-sol',
                        usage: { total_tokens: 120, cost_usd: 0.0005, cost_brl: 0.00285 }
                    })
                });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });
    });

    it('não renderiza nada se nenhuma conversa estiver aberta (selectedConvo null)', () => {
        const { container } = render(<FloatingAIChat selectedConvo={null} onInsertMessage={vi.fn()} />);
        expect(container.firstChild).toBeNull();
        expect(screen.queryByTitle(/Abrir Copiloto de Vendas com IA/i)).not.toBeInTheDocument();
    });

    it('inicia como botão flutuante e abre o painel ao ser clicado quando há conversa aberta', async () => {
        const convo = { id: 1, contact_name: 'Lead Teste' };
        render(<FloatingAIChat selectedConvo={convo} onInsertMessage={vi.fn()} />);

        const openBtn = screen.getByTitle(/Abrir Copiloto de Vendas com IA/i);
        expect(openBtn).toBeInTheDocument();

        fireEvent.click(openBtn);

        expect(screen.getByText('Copiloto Comercial')).toBeInTheDocument();
        expect(screen.getByText('Lead Teste')).toBeInTheDocument();
    });

    it('exibe o lead ativo e @ do Instagram no contexto', async () => {
        const convo = { id: 42, contact_name: 'Stella Vendas', phone: '5511999998888', instagram: '@stellavendas' };
        render(<FloatingAIChat selectedConvo={convo} onInsertMessage={vi.fn()} />);

        fireEvent.click(screen.getByTitle(/Abrir Copiloto de Vendas com IA/i));

        expect(screen.getByText('Stella Vendas')).toBeInTheDocument();
        expect(screen.getByText('(@stellavendas)')).toBeInTheDocument();
    });

    it('envia mensagem, recebe resposta e aciona o callback de inserção no chat', async () => {
        const handleInsert = vi.fn();
        const convo = { id: 42, contact_name: 'Stella Vendas', phone: '5511999998888' };
        render(<FloatingAIChat selectedConvo={convo} onInsertMessage={handleInsert} />);

        fireEvent.click(screen.getByTitle(/Abrir Copiloto de Vendas com IA/i));

        const input = screen.getByPlaceholderText(/Pergunte ao Copiloto IA.../i);
        fireEvent.change(input, { target: { value: 'Sugerir resposta para Stella' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        await waitFor(() => {
            expect(screen.getByText(/"Olá Stella, temos uma condição especial para você hoje!"/i)).toBeInTheDocument();
            expect(screen.getByText(/R\$ 0,0029/i)).toBeInTheDocument();
        });

        // Clicar no botão Inserir
        const insertBtn = screen.getByTitle(/Inserir diretamente na caixa de texto do WhatsApp/i);
        fireEvent.click(insertBtn);

        expect(handleInsert).toHaveBeenCalledWith('Olá Stella, temos uma condição especial para você hoje!');
    });
});

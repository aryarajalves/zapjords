import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BulkTemplateModal from './BulkTemplateModal';

vi.mock('../../../../AuthContext', () => ({
    fetchWithAuth: vi.fn()
}));

import { fetchWithAuth } from '../../../../AuthContext';

describe('BulkTemplateModal Component Tests', () => {
    const mockTemplates = [
        {
            name: 'aviso_promocional',
            language: 'pt_BR',
            status: 'APPROVED',
            category: 'MARKETING',
            components: [
                { type: 'BODY', text: 'Olá {{1}}, aproveite nosso desconto exclusivo!' },
                {
                    type: 'BUTTONS',
                    buttons: [
                        { type: 'QUICK_REPLY', text: 'Quero Aproveitar' },
                        { type: 'QUICK_REPLY', text: 'Não tenho interesse' }
                    ]
                }
            ]
        }
    ];

    const mockFunnels = [
        { id: 10, name: 'Funil de Vendas Quente', is_pinned: true },
        { id: 20, name: 'Funil de Descadastro', is_pinned: false }
    ];

    const mockRecipients = [
        {
            id: 101,
            conversation_id: 101,
            name: 'Carlos Eduardo',
            phone: '5511999998888',
            formatted_phone: '+55 (11) 99999-8888',
            labels: ['VIP'],
            has_active_funnel: false
        },
        {
            id: 102,
            conversation_id: 102,
            name: 'Diana Prince',
            phone: '5511988887777',
            formatted_phone: '+55 (11) 98888-7777',
            labels: ['Lead Quente'],
            has_active_funnel: true
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        fetchWithAuth.mockImplementation(async (url) => {
            if (url.includes('/whatsapp/templates')) {
                return {
                    ok: true,
                    json: async () => mockTemplates
                };
            }
            if (url.includes('/funnels')) {
                return {
                    ok: true,
                    json: async () => mockFunnels
                };
            }
            if (url.includes('/chat/conversations/bulk-template/recipients')) {
                return {
                    ok: true,
                    json: async () => ({
                        total: mockRecipients.length,
                        recipients: mockRecipients
                    })
                };
            }
            if (url.includes('/chat/conversations/bulk-template')) {
                return {
                    ok: true,
                    json: async () => ({
                        status: 'ok',
                        trigger_id: 88,
                        message: 'Disparo iniciado com sucesso!'
                    })
                };
            }
            return { ok: true, json: async () => [] };
        });
    });

    it('não deve renderizar quando isOpen for false', () => {
        const { container } = render(
            <BulkTemplateModal
                isOpen={false}
                onClose={vi.fn()}
                selectedCount={5}
                activeClientId={1}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renderiza o cabeçalho, as abas de navegação e carrega os dados iniciais', async () => {
        render(
            <BulkTemplateModal
                isOpen={true}
                onClose={vi.fn()}
                selectedCount={2}
                activeClientId={1}
                selectedConvoIds={[101, 102]}
            />
        );

        expect(screen.getByText(/disparo de template/i)).toBeInTheDocument();
        expect(screen.getByText('2 selecionado(s)')).toBeInTheDocument();

        // Abas
        expect(screen.getByText('Template & Mensagem')).toBeInTheDocument();
        expect(screen.getByText('Ações & Envio')).toBeInTheDocument();
        expect(screen.getByText('Contatos')).toBeInTheDocument();

        // Aguarda carregar dados
        await waitFor(() => {
            expect(fetchWithAuth).toHaveBeenCalledWith(
                expect.stringContaining('/whatsapp/templates'),
                expect.anything(),
                1
            );
            expect(fetchWithAuth).toHaveBeenCalledWith(
                expect.stringContaining('/chat/conversations/bulk-template/recipients'),
                expect.anything(),
                1
            );
        });
    });

    it('permite alternar entre abas, selecionar template, configurar botões e disparar', async () => {
        const onSuccess = vi.fn();
        const onClose = vi.fn();

        render(
            <BulkTemplateModal
                isOpen={true}
                onClose={onClose}
                selectedCount={2}
                selectedConvoIds={[101, 102]}
                activeClientId={1}
                onSuccess={onSuccess}
            />
        );

        // Aguarda carregar os templates
        await waitFor(() => {
            expect(screen.getByText(/escolha o template/i)).toBeInTheDocument();
        });

        // 1. Aba Mensagem: Seleciona o template
        const templateSelectorBtn = screen.getByText(/selecione o template\.\.\./i);
        fireEvent.click(templateSelectorBtn);

        const option = await screen.findByText('aviso_promocional');
        fireEvent.click(option);

        // 2. Alterna para a aba de Contatos e valida que os contatos foram listados
        fireEvent.click(screen.getByText('Contatos'));
        await waitFor(() => {
            expect(screen.getByText('Carlos Eduardo')).toBeInTheDocument();
            expect(screen.getByText('Diana Prince')).toBeInTheDocument();
            expect(screen.getByText('+55 (11) 99999-8888')).toBeInTheDocument();
        });

        // 3. Alterna para a aba Ações & Envio e configura os botões
        fireEvent.click(screen.getByText('Ações & Envio'));
        await waitFor(() => {
            expect(screen.getByText(/ação dos botões do template/i)).toBeInTheDocument();
            expect(screen.getAllByText('Quero Aproveitar').length).toBeGreaterThanOrEqual(1);
        });

        // Configura o botão 1 como Interação
        const interactionBtns = screen.getAllByRole('button', { name: /interação/i });
        fireEvent.click(interactionBtns[0]);

        // Configura o botão 2 como Bloqueio
        const blockBtns = screen.getAllByRole('button', { name: /bloqueio/i });
        fireEvent.click(blockBtns[1]);

        // Clica no botão de iniciar disparo
        const submitBtn = screen.getByRole('button', { name: /iniciar disparo template/i });
        fireEvent.click(submitBtn);

        // Valida que o endpoint de backend foi chamado com o payload esperado
        await waitFor(() => {
            expect(fetchWithAuth).toHaveBeenCalledWith(
                expect.stringContaining('/chat/conversations/bulk-template'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('"template_name":"aviso_promocional"')
                }),
                1
            );
            expect(onSuccess).toHaveBeenCalled();
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('permite configurar agendamento para o futuro e envia scheduled_time', async () => {
        const onSuccess = vi.fn();
        const onClose = vi.fn();

        render(
            <BulkTemplateModal
                isOpen={true}
                onClose={onClose}
                selectedCount={1}
                selectedConvoIds={[101]}
                activeClientId={1}
                onSuccess={onSuccess}
            />
        );

        await waitFor(() => {
            expect(screen.getByText(/escolha o template/i)).toBeInTheDocument();
        });

        // Seleciona template
        fireEvent.click(screen.getByText(/selecione o template\.\.\./i));
        const option = await screen.findByText('aviso_promocional');
        fireEvent.click(option);

        // Vai para aba Ações & Envio
        fireEvent.click(screen.getByText('Ações & Envio'));

        // Clica no modo "Agendar Futuro"
        fireEvent.click(screen.getByText('Agendar Futuro'));

        // Valida que o botão mudou para "Agendar Disparo Template"
        const scheduleBtn = screen.getByRole('button', { name: /agendar disparo template/i });
        expect(scheduleBtn).toBeInTheDocument();

        fireEvent.click(scheduleBtn);

        await waitFor(() => {
            expect(fetchWithAuth).toHaveBeenCalledWith(
                expect.stringContaining('/chat/conversations/bulk-template'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('"scheduled_time"')
                }),
                1
            );
        });
    });

    it('permite configurar disparo recorrente semanal e envia is_recurring true', async () => {
        const onSuccess = vi.fn();
        const onClose = vi.fn();

        render(
            <BulkTemplateModal
                isOpen={true}
                onClose={onClose}
                selectedCount={1}
                selectedConvoIds={[101]}
                activeClientId={1}
                onSuccess={onSuccess}
            />
        );

        await waitFor(() => {
            expect(screen.getByText(/escolha o template/i)).toBeInTheDocument();
        });

        // Seleciona template
        fireEvent.click(screen.getByText(/selecione o template\.\.\./i));
        const option = await screen.findByText('aviso_promocional');
        fireEvent.click(option);

        // Vai para aba Ações & Envio
        fireEvent.click(screen.getByText('Ações & Envio'));

        // Clica no modo "Recorrente"
        fireEvent.click(screen.getByText('Recorrente'));

        // Valida que o botão mudou para "Salvar Disparo Recorrente"
        const recurringBtn = screen.getByRole('button', { name: /salvar disparo recorrente/i });
        expect(recurringBtn).toBeInTheDocument();

        fireEvent.click(recurringBtn);

        await waitFor(() => {
            expect(fetchWithAuth).toHaveBeenCalledWith(
                expect.stringContaining('/chat/conversations/bulk-template'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('"is_recurring":true')
                }),
                1
            );
        });
    });
});

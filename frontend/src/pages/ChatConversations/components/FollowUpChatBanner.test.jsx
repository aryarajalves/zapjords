import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FollowUpChatBanner from './FollowUpChatBanner';

vi.mock('../../../contexts/ClientContext', () => ({
    useClient: () => ({ activeClient: { id: 1 } })
}));

vi.mock('../../../AuthContext', () => ({
    fetchWithAuth: vi.fn()
}));

import { fetchWithAuth } from '../../../AuthContext';

describe('FollowUpChatBanner Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('não deve renderizar banner quando não houver follow-up agendado', async () => {
        fetchWithAuth.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ has_pending_followup: false, pending_followups: [] })
        });

        const { container } = render(
            <FollowUpChatBanner selectedConvo={{ phone: '5511999999999' }} />
        );

        await waitFor(() => {
            expect(container.firstChild).toBeNull();
        });
    });

    it('deve exibir informações do follow-up agendado quando houver pendência', async () => {
        fetchWithAuth.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                has_pending_followup: true,
                pending_followups: [
                    {
                        trigger_id: 101,
                        template_name: 'lembrete_carrinho',
                        step_number: 1,
                        scheduled_time: '2026-10-30T10:00:00Z'
                    }
                ]
            })
        });

        render(
            <FollowUpChatBanner selectedConvo={{ phone: '5511999999999' }} />
        );

        await waitFor(() => {
            expect(screen.getByText('lembrete_carrinho')).toBeDefined();
            expect(screen.getByText('Etapa #1')).toBeDefined();
            expect(screen.getByText('Cancelar Follow-up')).toBeDefined();
        });
    });

    it('ao clicar em Cancelar Follow-up, deve abrir modal de confirmação e chamar endpoint de cancelamento', async () => {
        fetchWithAuth.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                has_pending_followup: true,
                pending_followups: [
                    {
                        trigger_id: 101,
                        template_name: 'lembrete_carrinho',
                        step_number: 1,
                        scheduled_time: '2026-10-30T10:00:00Z'
                    }
                ]
            })
        });

        render(
            <FollowUpChatBanner selectedConvo={{ phone: '5511999999999' }} />
        );

        await waitFor(() => {
            expect(screen.getByText('Cancelar Follow-up')).toBeDefined();
        });

        fireEvent.click(screen.getByText('Cancelar Follow-up'));

        expect(screen.getByText('Confirmar Cancelamento')).toBeDefined();

        fetchWithAuth.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, message: 'Cancelado' })
        });

        fireEvent.click(screen.getByText('Confirmar Cancelamento'));

        await waitFor(() => {
            expect(fetchWithAuth).toHaveBeenCalledWith(
                expect.stringContaining('/triggers/contacts/5511999999999/cancel-followups'),
                expect.objectContaining({ method: 'POST' }),
                1
            );
        });
    });
});

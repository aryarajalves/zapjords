// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import React from 'react';
import { render, waitFor, screen, cleanup } from '@testing-library/react';
import { AuthProvider, useAuth, fetchWithAuth } from './AuthContext';
import * as tokenUtils from './utils/tokenUtils';

vi.mock('react-hot-toast', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    }
}));

const TestConsumer = () => {
    const { user, loading, isAuthenticated } = useAuth();
    if (loading) return <div>Carregando...</div>;
    return (
        <div>
            <div data-testid="auth-status">{isAuthenticated ? 'Autenticado' : 'Nao Autenticado'}</div>
            <div data-testid="user-email">{user?.email || 'Nenhum'}</div>
        </div>
    );
};

describe('AuthContext - Proteção contra Sessão e Token Expirado', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('deve identificar token expirado ao inicializar, limpar storage e não chamar /auth/me', async () => {
        const tokenExpiradoDoLog = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjcmFzc3VzcmpAaG90bWFpbC5jb20iLCJyb2xlIjoidmVuZGVkb3IiLCJleHAiOjE3OTM5MjY2MzJ9.QzlBPW-RaSqSQeof0MppET7GNwxOhB_wMrepUdaeOTg";
        localStorage.setItem('token', tokenExpiradoDoLog);

        const sessionExpiredSpy = vi.spyOn(tokenUtils, 'handleSessionExpired');

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('auth-status').textContent).toBe('Nao Autenticado');
        });

        // Garante que o utilitário de expiração foi acionado e /auth/me NÃO foi chamado
        expect(sessionExpiredSpy).toHaveBeenCalled();
        expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining('/auth/me'), expect.anything());
        expect(localStorage.getItem('token')).toBeNull();
    });

    it('fetchWithAuth deve barrar preventivamente requisições se o token estiver expirado', async () => {
        const tokenExpirado = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0ZUBob3RtYWlsLmNvbSIsInJvbGUiOiJ2ZW5kZWRvciIsImV4cCI6MTcwMDAwMDAwMH0.mock";
        localStorage.setItem('token', tokenExpirado);

        const sessionExpiredSpy = vi.spyOn(tokenUtils, 'handleSessionExpired');

        await expect(fetchWithAuth('http://localhost:8000/api/contacts')).rejects.toThrow('Sessão expirada. Faça login novamente.');

        expect(sessionExpiredSpy).toHaveBeenCalled();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('deve deslogar o usuário em tempo real quando o evento zapvoice:session_expired for disparado', async () => {
        // Simula usuário inicialmente autenticado
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 1, email: 'ativo@teste.com', role: 'admin' })
        });

        const tokenValido = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdGl2b0B0ZXN0ZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE5OTk5OTk5OTl9.mock";
        localStorage.setItem('token', tokenValido);

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('auth-status').textContent).toBe('Autenticado');
            expect(screen.getByTestId('user-email').textContent).toBe('ativo@teste.com');
        });

        // Dispara o evento de expiração de sessão
        window.dispatchEvent(new CustomEvent('zapvoice:session_expired', { detail: { reason: 'Expirou' } }));

        await waitFor(() => {
            expect(screen.getByTestId('auth-status').textContent).toBe('Nao Autenticado');
            expect(screen.getByTestId('user-email').textContent).toBe('Nenhum');
        });
    });
});

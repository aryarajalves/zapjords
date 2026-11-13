// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { parseJwt, isTokenExpired, handleSessionExpired } from './tokenUtils';
import { toast } from 'react-hot-toast';

vi.mock('react-hot-toast', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    }
}));

describe('tokenUtils', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const createTestJwt = (payload) => {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const body = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        return `${header}.${body}.mockSignature`;
    };

    describe('parseJwt', () => {
        it('deve retornar null para valores nulos, vazios ou inválidos', () => {
            expect(parseJwt(null)).toBeNull();
            expect(parseJwt('')).toBeNull();
            expect(parseJwt('invalid-string')).toBeNull();
            expect(parseJwt('header.corrupted-body-not-base64.signature')).toBeNull();
        });

        it('deve decodificar corretamente um payload JWT', () => {
            const token = createTestJwt({ sub: 'user@teste.com', role: 'admin', exp: 1999999999 });
            const payload = parseJwt(token);

            expect(payload).not.toBeNull();
            expect(payload.sub).toBe('user@teste.com');
            expect(payload.role).toBe('admin');
            expect(payload.exp).toBe(1999999999);
        });

        it('deve decodificar o token real do log com role vendedor', () => {
            const tokenDoLog = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjcmFzc3VzcmpAaG90bWFpbC5jb20iLCJyb2xlIjoidmVuZGVkb3IiLCJleHAiOjE3OTM5MjY2MzJ9.QzlBPW-RaSqSQeof0MppET7GNwxOhB_wMrepUdaeOTg";
            const payload = parseJwt(tokenDoLog);

            expect(payload).not.toBeNull();
            expect(payload.sub).toBe('crassusrj@hotmail.com');
            expect(payload.role).toBe('vendedor');
            expect(payload.exp).toBe(1793926632);
        });
    });

    describe('isTokenExpired', () => {
        it('deve retornar true para tokens nulos ou sem exp', () => {
            expect(isTokenExpired(null)).toBe(true);
            expect(isTokenExpired('')).toBe(true);
            const tokenSemExp = createTestJwt({ sub: 'sem_exp@teste.com' });
            expect(isTokenExpired(tokenSemExp)).toBe(true);
        });

        it('deve retornar true para o token expirado do log', () => {
            const tokenDoLog = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjcmFzc3VzcmpAaG90bWFpbC5jb20iLCJyb2xlIjoidmVuZGVkb3IiLCJleHAiOjE3OTM5MjY2MzJ9.QzlBPW-RaSqSQeof0MppET7GNwxOhB_wMrepUdaeOTg";
            expect(isTokenExpired(tokenDoLog)).toBe(true);
        });

        it('deve retornar false para token no futuro', () => {
            const expFuturo = Math.floor(Date.now() / 1000) + 3600; // +1 hora
            const tokenValido = createTestJwt({ sub: 'valido@teste.com', exp: expFuturo });
            expect(isTokenExpired(tokenValido)).toBe(false);
        });

        it('deve respeitar a margem de bufferSeconds', () => {
            // Expira em 3 segundos. Com buffer padrão de 5s, já é considerado expirado
            const expEm3Segundos = Math.floor(Date.now() / 1000) + 3;
            const tokenQuaseExpirando = createTestJwt({ sub: 'buffer@teste.com', exp: expEm3Segundos });
            expect(isTokenExpired(tokenQuaseExpirando, 5)).toBe(true);
            // Com buffer de 0s, ainda não expirou
            expect(isTokenExpired(tokenQuaseExpirando, 0)).toBe(false);
        });
    });

    describe('handleSessionExpired', () => {
        it('deve limpar o localStorage e disparar toast e evento global', () => {
            localStorage.setItem('token', 'token-antigo');
            localStorage.setItem('currentView', 'chat');

            const eventListener = vi.fn();
            window.addEventListener('zapvoice:session_expired', eventListener);

            handleSessionExpired('Sessão expirou no teste');

            expect(localStorage.getItem('token')).toBeNull();
            expect(localStorage.getItem('currentView')).toBeNull();
            expect(toast.error).toHaveBeenCalledWith('Sessão expirou no teste', expect.objectContaining({
                id: 'session-expired-global'
            }));
            expect(eventListener).toHaveBeenCalledTimes(1);

            window.removeEventListener('zapvoice:session_expired', eventListener);
        });
    });
});

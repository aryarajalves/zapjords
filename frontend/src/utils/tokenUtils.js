import { toast } from 'react-hot-toast';

/**
 * Decodifica o payload de um token JWT sem validar a assinatura criptográfica.
 * Suporta Base64Url (RFC 7519) e caracteres especiais UTF-8.
 *
 * @param {string|null} token
 * @returns {object|null}
 */
export function parseJwt(token) {
    if (!token || typeof token !== 'string') return null;
    try {
        const parts = token.trim().split('.');
        if (parts.length < 2) return null;

        // Converte Base64Url para Base64 convencional
        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }

        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

/**
 * Verifica se um token JWT expirou ou se é inválido.
 *
 * @param {string|null} token
 * @param {number} bufferSeconds - Margem de tolerância em segundos (default: 5s)
 * @returns {boolean}
 */
export function isTokenExpired(token, bufferSeconds = 5) {
    if (!token) return true;
    const payload = parseJwt(token);
    if (!payload || typeof payload.exp !== 'number') return true;

    const nowInSeconds = Math.floor(Date.now() / 1000);
    return nowInSeconds >= (payload.exp - bufferSeconds);
}

/**
 * Trava de debounce para evitar que múltiplos componentes ou WebSockets
 * disparem o logout e alertas repetidos ao mesmo tempo.
 */
let isHandlingExpiration = false;

/**
 * Encerra a sessão expirada de forma centralizada:
 * 1. Remove tokens do localStorage
 * 2. Emite toast de aviso explicativo
 * 3. Notifica a aplicação via evento global `zapvoice:session_expired`
 *
 * @param {string} reason
 */
export function handleSessionExpired(reason = "Sua sessão expirou. Faça login novamente para continuar.") {
    if (isHandlingExpiration) return;
    isHandlingExpiration = true;

    try {
        localStorage.removeItem('token');
        localStorage.removeItem('currentView');
    } catch (e) {
        console.error("Erro ao limpar localStorage na expiração da sessão:", e);
    }

    try {
        toast.error(reason, {
            id: 'session-expired-global',
            duration: 6000
        });
    } catch (e) {
        console.error("Erro ao emitir toast de expiração:", e);
    }

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('zapvoice:session_expired', {
            detail: { reason }
        }));
    }

    setTimeout(() => {
        isHandlingExpiration = false;
    }, 4000);
}

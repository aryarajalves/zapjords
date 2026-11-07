import { describe, it, expect } from 'vitest';
import { extractCleanMessageToSend } from '../aiMessageExtractor';

describe('aiMessageExtractor - extractCleanMessageToSend', () => {
    it('extrai corretamente mensagem em blockquote (>) descartando cabeçalho e dica (caso imagem 01/03)', () => {
        const raw = `Você pode responder:

> Oie, Aryaraj! 😊 Tudo bem?
>
> Sobre a comunidade de astrologia que te contei: teremos encontros ao vivo comigo a cada 15 dias, convidados e uma ferramenta para ajudar na leitura do mapa astral. 🔮
>
> Quer que eu te explique como funciona a condição de embaixador?

**Dica:** A mensagem retoma a conversa sem pressionar e oferece um próximo passo simples para ele responder.`;

        const clean = extractCleanMessageToSend(raw);

        expect(clean).toContain('Oie, Aryaraj! 😊 Tudo bem?');
        expect(clean).toContain('Quer que eu te explique como funciona a condição de embaixador?');
        expect(clean).not.toContain('Você pode responder:');
        expect(clean).not.toContain('**Dica:**');
        expect(clean).not.toContain('A mensagem retoma a conversa');
        expect(clean).not.toContain('>');
    });

    it('extrai mensagem entre aspas duplas descartando introdução e dica posterior', () => {
        const raw = `Não há registro de envio do link ou fechamento. O CRM mostra R$ 67.

**Mensagem para enviar:**

"Aryaraj, oiee! 😊 Passando para saber: você quer que eu te conte mais sobre a comunidade de astrologia ou prefere receber as informações da live?"

**Dica:** A pergunta retoma os dois assuntos já apresentados e deixa o contato escolher por onde continuar.`;

        const clean = extractCleanMessageToSend(raw);

        expect(clean).toBe('Aryaraj, oiee! 😊 Passando para saber: você quer que eu te conte mais sobre a comunidade de astrologia ou prefere receber as informações da live?');
        expect(clean).not.toContain('Mensagem para enviar');
        expect(clean).not.toContain('**Dica:**');
        expect(clean).not.toContain('Não há registro de envio');
    });

    it('extrai mensagem com delimitador [MENSAGEM]...[/MENSAGEM]', () => {
        const raw = `Aqui está o que falar:
[MENSAGEM]
Olá Maria, segue o seu link exclusivo para finalizar a matrícula: https://exemplo.com/checkout
[/MENSAGEM]
**Dica rápida:** Link enviado direto.`;

        const clean = extractCleanMessageToSend(raw);
        expect(clean).toBe('Olá Maria, segue o seu link exclusivo para finalizar a matrícula: https://exemplo.com/checkout');
    });

    it('retorna texto original limpo se não houver dicas ou citações', () => {
        const raw = 'Olá Carlos, já confirmei o seu pagamento e liberei o seu acesso!';
        expect(extractCleanMessageToSend(raw)).toBe(raw);
    });

    it('lida com entradas nulas ou vazias sem quebrar', () => {
        expect(extractCleanMessageToSend('')).toBe('');
        expect(extractCleanMessageToSend(null)).toBe('');
        expect(extractCleanMessageToSend(undefined)).toBe('');
    });
});

/**
 * Utilitário para extrair estritamente a mensagem de resposta destinada ao cliente,
 * descartando cabeçalhos ("Você pode responder:"), blocos de explicação ("**Dica:**")
 * e marcadores de formatação (> ou aspas).
 */

export function extractCleanMessageToSend(rawText) {
    if (!rawText || typeof rawText !== 'string') return '';

    let text = rawText.trim();

    // 1. Se contiver tags explícitas [MENSAGEM] ... [/MENSAGEM]
    const tagMatch = text.match(/\[MENSAGEM\]([\s\S]*?)\[\/MENSAGEM\]/i);
    if (tagMatch && tagMatch[1].trim().length > 5) {
        return cleanQuotesAndEscapes(tagMatch[1].trim());
    }

    // 2. Descartar seções de Dica/Explicação no final do texto
    const dicaSplitRegex = /(?:\n\s*|\n\n\s*)(?:\*\*)?(?:dica(?:\s+r[aá]pida)?|explica[cç][aã]o|por\s+que\s+funciona|estrat[eé]gia|observa[cç][aã]o|nota)(?:\*\*)?\s*:\s*[\s\S]*$/i;
    text = text.replace(dicaSplitRegex, '').trim();

    // 3. Se contiver blockquote markdown com '>' (linhas que iniciam com >)
    const lines = text.split('\n');
    const quoteLines = [];
    let insideQuote = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('>')) {
            insideQuote = true;
            quoteLines.push(line.replace(/^>\s?/, ''));
        } else if (insideQuote) {
            if (line === '') {
                quoteLines.push('');
            } else {
                break;
            }
        }
    }

    if (quoteLines.length > 0 && quoteLines.join('\n').trim().length > 10) {
        return cleanQuotesAndEscapes(quoteLines.join('\n').trim());
    }

    // 4. Se contiver texto entre aspas duplas completas ("..." ou “...”)
    const quotesMatch = text.match(/["“]([\s\S]+?)["”]/);
    if (quotesMatch && quotesMatch[1].trim().length > 10) {
        return cleanQuotesAndEscapes(quotesMatch[1].trim());
    }

    // 5. Remover prefixos conversacionais no início (ex: "Você pode responder:", "Mensagem para enviar:")
    const prefixRegex = /^(?:voc[eê]\s+pode\s+responder|mensagem\s+(?:para\s+enviar|sugerida)|sugest[aã]o(?:\s+de\s+resposta)?|aqui\s+est[aá]\s+(?:uma\s+op[cç][aã]o|a\s+resposta)|op[cç][aã]o(?:\s+\d+)?|resposta)(?:\*\*)?\s*:\s*/i;
    text = text.replace(prefixRegex, '').trim();

    return cleanQuotesAndEscapes(text);
}

function cleanQuotesAndEscapes(str) {
    if (!str) return '';
    let res = str.trim();
    if ((res.startsWith('"') && res.endsWith('"')) || (res.startsWith('“') && res.endsWith('”'))) {
        res = res.slice(1, -1).trim();
    }
    return res;
}

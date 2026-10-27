import React from 'react';

/**
 * Extrai todos os índices de variáveis (ex: {{1}}, {{2}}) de um texto.
 * Retorna array único ordenado com os identificadores (ex: ['1', '2']).
 */
export const extractVariableIndexes = (text) => {
    if (!text || typeof text !== 'string') return [];
    const matches = text.match(/\{\{(\d+)\}\}/g) || [];
    const ids = matches.map(m => m.replace(/\D/g, ''));
    return Array.from(new Set(ids)).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
};

/**
 * Converte formatação padrão do WhatsApp (*bold*, _italic_, ~strike~, ```code```) em elementos React.
 */
export const formatWhatsAppMarkdown = (content, keyPrefix = 'md') => {
    if (!content || typeof content !== 'string') return content;

    // Divide em blocos mantendo a quebra de linha
    const lines = content.split('\n');

    return lines.map((line, lineIndex) => {
        // Regex para tokens: ```code```, *bold*, _italic_, ~strike~
        const tokenRegex = /(```[\s\S]*?```|\*[^\s*](?:[^*]*?[^\s*])?\*|_[^\s_](?:[^_]*?[^\s_])?_|~[^\s~](?:[^~]*?[^\s~])?~)/g;
        const segments = line.split(tokenRegex);

        const renderedLine = segments.map((seg, segIndex) => {
            const key = `${keyPrefix}-${lineIndex}-${segIndex}`;

            if (!seg) return null;

            // Monospace / Code: ```código```
            if (seg.startsWith('```') && seg.endsWith('```') && seg.length >= 6) {
                const codeContent = seg.slice(3, -3);
                return (
                    <code key={key} className="bg-black/30 dark:bg-black/40 text-emerald-300 px-1 py-0.5 rounded font-mono text-[12px]">
                        {codeContent}
                    </code>
                );
            }

            // Bold: *texto*
            if (seg.startsWith('*') && seg.endsWith('*') && seg.length > 2) {
                return (
                    <strong key={key} className="font-bold text-white">
                        {seg.slice(1, -1)}
                    </strong>
                );
            }

            // Italic: _texto_
            if (seg.startsWith('_') && seg.endsWith('_') && seg.length > 2) {
                return (
                    <em key={key} className="italic">
                        {seg.slice(1, -1)}
                    </em>
                );
            }

            // Strikethrough: ~texto~
            if (seg.startsWith('~') && seg.endsWith('~') && seg.length > 2) {
                return (
                    <del key={key} className="line-through opacity-75">
                        {seg.slice(1, -1)}
                    </del>
                );
            }

            return <span key={key}>{seg}</span>;
        });

        return (
            <React.Fragment key={`${keyPrefix}-line-${lineIndex}`}>
                {renderedLine}
                {lineIndex < lines.length - 1 && <br />}
            </React.Fragment>
        );
    });
};

/**
 * Renderiza texto com substituição de variáveis {{1}} e markdown do WhatsApp.
 */
export const renderWhatsAppTextWithVariables = (text, testValues = {}, keyPrefix = 'wa') => {
    if (!text || typeof text !== 'string') return null;

    // Divide por tokens de variáveis {{N}}
    const parts = text.split(/(\{\{\d+\}\})/g);

    return parts.map((part, index) => {
        const varMatch = part.match(/^\{\{(\d+)\}\}$/);

        if (varMatch) {
            const varId = varMatch[1];
            const customVal = testValues[varId];

            if (customVal && customVal.trim() !== '') {
                return (
                    <span
                        key={`${keyPrefix}-var-${index}`}
                        className="text-emerald-300 font-semibold bg-emerald-500/10 px-1 rounded transition-colors"
                        title={`Variável {{${varId}}}`}
                    >
                        {customVal}
                    </span>
                );
            }

            return (
                <span
                    key={`${keyPrefix}-var-${index}`}
                    className="inline-block text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded mx-0.5 align-middle select-none animate-pulse"
                >
                    {`{{${varId}}}`}
                </span>
            );
        }

        return (
            <React.Fragment key={`${keyPrefix}-txt-${index}`}>
                {formatWhatsAppMarkdown(part, `${keyPrefix}-${index}`)}
            </React.Fragment>
        );
    });
};

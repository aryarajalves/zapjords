import React, { useMemo } from 'react';
import { FiEye, FiImage, FiVideo, FiFile, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

/**
 * BulkTemplatePreviewBox
 * Renderiza a pré-visualização interativa no estilo WhatsApp,
 * interpolando variáveis preenchidas em tempo real e destacando mídias e botões.
 */
export default function BulkTemplatePreviewBox({
    selectedTemplate,
    templateParams = {},
    headerVars = [],
    bodyVars = []
}) {
    if (!selectedTemplate) return null;

    const components = selectedTemplate.components || [];
    const headerComp = components.find(c => c.type === 'HEADER');
    const bodyComp = components.find(c => c.type === 'BODY');
    const footerComp = components.find(c => c.type === 'FOOTER');
    const buttonsComp = components.find(c => c.type === 'BUTTONS');

    const isMediaHeader = headerComp && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerComp.format);
    const mediaUrl = templateParams['HEADER_0'] || '';

    const totalVars = headerVars.length + bodyVars.length;
    const filledVarsCount = [...headerVars.map(n => `HEADER_${n - 1}`), ...bodyVars.map(n => `BODY_${n - 1}`)]
        .filter(k => Boolean(templateParams[k]?.trim())).length;

    // Interpolação de texto do Header se for TEXT
    const headerText = useMemo(() => {
        if (!headerComp || headerComp.format !== 'TEXT' || !headerComp.text) return '';
        let text = headerComp.text;
        headerVars.forEach(num => {
            const val = templateParams[`HEADER_${num - 1}`];
            if (val) {
                text = text.replace(`{{${num}}}`, val);
            }
        });
        return text;
    }, [headerComp, templateParams, headerVars]);

    // Interpolação do Corpo em partes para destacar variáveis preenchidas vs pendentes
    const bodyRenderParts = useMemo(() => {
        const text = bodyComp?.text || '';
        if (!text) return null;

        const regex = /\{\{(\d+)\}\}/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push({
                    type: 'text',
                    content: text.substring(lastIndex, match.index)
                });
            }

            const varNum = parseInt(match[1]);
            const key = `BODY_${varNum - 1}`;
            const val = templateParams[key];

            if (val !== undefined && val !== '') {
                parts.push({
                    type: 'variable-filled',
                    content: val,
                    varNum
                });
            } else {
                parts.push({
                    type: 'variable-empty',
                    content: match[0],
                    varNum
                });
            }

            lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
            parts.push({
                type: 'text',
                content: text.substring(lastIndex)
            });
        }

        return parts;
    }, [bodyComp, templateParams]);

    return (
        <div className="bg-slate-900/60 rounded-xl p-4 border border-white/10 space-y-3">
            {/* Topo: Título e Status de Variáveis */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FiEye className="text-violet-400" size={14} />
                    <span className="text-xs font-bold text-white">Pré-visualização do Template</span>
                </div>
                <div className="flex items-center gap-2">
                    {totalVars > 0 ? (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                            filledVarsCount === totalVars
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                        }`}>
                            {filledVarsCount === totalVars ? (
                                <>
                                    <FiCheckCircle size={10} />
                                    <span>{totalVars} variáveis preenchidas</span>
                                </>
                            ) : (
                                <>
                                    <FiAlertCircle size={10} />
                                    <span>{filledVarsCount}/{totalVars} variáveis preenchidas</span>
                                </>
                            )}
                        </span>
                    ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 border border-white/10 text-slate-400 flex items-center gap-1">
                            <FiCheckCircle size={10} className="text-teal-400" />
                            <span>Sem variáveis</span>
                        </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono">
                        {selectedTemplate.language || 'pt_BR'}
                    </span>
                </div>
            </div>

            {/* Balão de Mensagem Estilo WhatsApp */}
            <div className="bg-slate-950/80 rounded-xl border border-white/10 overflow-hidden shadow-inner">
                {/* Mídia do Cabeçalho se aplicável */}
                {isMediaHeader && (
                    <div className="p-3 bg-slate-900/40 border-b border-white/5">
                        {mediaUrl ? (
                            headerComp.format === 'IMAGE' ? (
                                <div className="rounded-lg overflow-hidden max-h-48 flex items-center justify-center bg-black/40 border border-white/5">
                                    <img src={mediaUrl} alt="Mídia de Cabeçalho" className="max-h-48 object-contain w-full" />
                                </div>
                            ) : headerComp.format === 'VIDEO' ? (
                                <div className="rounded-lg overflow-hidden max-h-48 bg-black/40 border border-white/5 flex flex-col items-center justify-center p-3 text-slate-300 gap-1.5">
                                    <FiVideo size={28} className="text-amber-400" />
                                    <span className="text-[11px] font-mono truncate max-w-full text-slate-400">{mediaUrl}</span>
                                </div>
                            ) : (
                                <div className="rounded-lg bg-black/40 border border-white/5 flex items-center gap-3 p-3 text-slate-300">
                                    <FiFile size={24} className="text-blue-400 shrink-0" />
                                    <span className="text-xs truncate font-medium text-slate-200">{mediaUrl.split('/').pop() || 'documento.pdf'}</span>
                                </div>
                            )
                        ) : (
                            <div className="rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 p-3 flex items-center justify-center gap-2 text-amber-300 text-xs">
                                <FiImage size={14} />
                                <span>Mídia do cabeçalho ({headerComp.format}) não selecionada</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Texto do Cabeçalho (se TEXT) */}
                {headerText && (
                    <div className="px-4 pt-3 text-xs font-bold text-white border-b border-white/5 pb-2">
                        {headerText}
                    </div>
                )}

                {/* Corpo da Mensagem */}
                <div className="p-4 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {bodyRenderParts && bodyRenderParts.length > 0 ? (
                        bodyRenderParts.map((part, idx) => {
                            if (part.type === 'variable-filled') {
                                return (
                                    <span
                                        key={idx}
                                        className="bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded font-medium border border-emerald-500/30"
                                        title={`Valor definido para {{${part.varNum}}}`}
                                    >
                                        {part.content}
                                    </span>
                                );
                            }
                            if (part.type === 'variable-empty') {
                                return (
                                    <span
                                        key={idx}
                                        className="bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded font-mono font-bold border border-amber-500/30 animate-pulse"
                                        title={`Variável {{${part.varNum}}} pendente`}
                                    >
                                        {part.content}
                                    </span>
                                );
                            }
                            return <span key={idx}>{part.content}</span>;
                        })
                    ) : (
                        <span className="text-slate-500 italic">Nenhum texto no corpo do template.</span>
                    )}
                </div>

                {/* Rodapé (Footer) se houver */}
                {footerComp?.text && (
                    <div className="px-4 pb-3 text-[11px] text-slate-400 italic">
                        {footerComp.text}
                    </div>
                )}

                {/* Botões do Template se houver */}
                {buttonsComp?.buttons && buttonsComp.buttons.length > 0 && (
                    <div className="border-t border-white/5 bg-slate-900/30 p-2 flex flex-col gap-1.5">
                        {buttonsComp.buttons.map((btn, bIdx) => (
                            <div
                                key={bIdx}
                                className="w-full py-1.5 px-3 rounded-lg bg-slate-800/80 border border-white/10 text-center text-xs font-medium text-teal-300 flex items-center justify-center gap-1.5"
                            >
                                <span>{btn.text}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

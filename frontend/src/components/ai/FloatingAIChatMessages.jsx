import React from 'react';
import { FiCopy, FiCornerDownLeft, FiCheck, FiRefreshCw } from 'react-icons/fi';

export default function FloatingAIChatMessages({
    messages,
    copiedIndex,
    handleCopy,
    handleInsert,
    isLoading,
    messagesEndRef,
    usdToBrl = 5.7
}) {
    // Helper para formatar o custo em Reais (BRL)
    const formatCostBrl = (costBrl, costUsd) => {
        const val = (costBrl !== undefined && costBrl !== null)
            ? Number(costBrl)
            : (costUsd ? Number(costUsd) * (Number(usdToBrl) || 5.7) : 0);
        return `R$ ${val.toFixed(4).replace('.', ',')}`;
    };

    return (
        <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar text-xs">
            {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                    <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                        <div 
                            className={`max-w-[88%] rounded-2xl p-3 leading-relaxed ${
                                isUser 
                                    ? 'bg-blue-600 text-white rounded-tr-none' 
                                    : 'bg-slate-800/90 text-gray-200 border border-white/10 rounded-tl-none shadow-md'
                            }`}
                        >
                            <p className="whitespace-pre-wrap">{msg.content}</p>

                            {!isUser && idx > 0 && (
                                <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] gap-2">
                                    <div className="flex items-center gap-1.5 text-gray-400 font-mono flex-wrap">
                                        {msg.usage && (
                                            <>
                                                <span>⚡ {msg.usage.total_tokens} tok</span>
                                                <span>•</span>
                                                <span className="text-emerald-400 font-semibold" title="Custo convertido em Reais">
                                                    {formatCostBrl(msg.usage.cost_brl, msg.usage.cost_usd)}
                                                </span>
                                                {msg.usage.cost_usd !== undefined && (
                                                    <span className="text-gray-500">
                                                        (${Number(msg.usage.cost_usd).toFixed(4)})
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(msg.content, idx)}
                                            className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded flex items-center gap-1 transition-colors"
                                            title="Copiar resposta"
                                        >
                                            {copiedIndex === idx ? <FiCheck size={11} className="text-emerald-400" /> : <FiCopy size={11} />}
                                            <span>{copiedIndex === idx ? 'Copiado!' : 'Copiar'}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleInsert(msg.content)}
                                            className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-cyan-300 border border-blue-400/30 rounded flex items-center gap-1 transition-colors"
                                            title="Inserir diretamente na caixa de texto do WhatsApp"
                                        >
                                            <FiCornerDownLeft size={11} />
                                            <span>Inserir</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {isLoading && (
                <div className="flex items-center gap-2 p-3 bg-slate-800/60 border border-white/5 rounded-2xl max-w-[70%]">
                    <FiRefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span className="text-gray-400 italic text-[11px]">Gerando resposta com IA...</span>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );
}

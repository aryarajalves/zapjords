import React, { useState, useEffect, useRef } from 'react';
import { 
    FiCpu, FiX, FiMinus, FiSend, 
    FiTrash2, FiMaximize2,
    FiUserCheck, FiTag
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { fetchWithAuth } from '../../AuthContext';
import { API_URL } from '../../config';
import { useClient } from '../../contexts/ClientContext';
import FloatingAIChatMessages from './FloatingAIChatMessages';
import { extractCleanMessageToSend } from './aiMessageExtractor';

export default function FloatingAIChat({ selectedConvo, onInsertMessage }) {
    if (!selectedConvo) return null;

    const { activeClient } = useClient();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeModel, setActiveModel] = useState('gpt-6.1-sol');
    const [usdToBrl, setUsdToBrl] = useState(5.7);
    const [includeContext, setIncludeContext] = useState(true);
    const [copiedIndex, setCopiedIndex] = useState(null);

    // Presets de Prompts por Produto
    const [presets, setPresets] = useState([]);
    const [selectedPromptId, setSelectedPromptId] = useState(null);

    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Olá! Sou o seu Copiloto de Vendas com IA. Posso analisar o histórico do lead, sugerir respostas persuasivas e ajudar no fechamento. Como posso te apoiar agora?'
        }
    ]);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Carregar configurações de modelo e prompts por produto
    useEffect(() => {
        const fetchSettingsAndPrompts = async () => {
            try {
                const [resSettings, resPrompts] = await Promise.all([
                    fetchWithAuth(`${API_URL}/ai/settings`, {}, activeClient?.id),
                    fetchWithAuth(`${API_URL}/ai/prompts`, {}, activeClient?.id)
                ]);

                if (resSettings.ok) {
                    const data = await resSettings.json();
                    if (data.model) setActiveModel(data.model);
                    if (data.usd_to_brl) setUsdToBrl(Number(data.usd_to_brl));
                }

                if (resPrompts.ok) {
                    const dataP = await resPrompts.json();
                    const list = dataP.prompts || [];
                    setPresets(list);
                    const def = list.find(p => p.is_default) || list[0];
                    if (def && !selectedPromptId) {
                        setSelectedPromptId(def.id);
                    }
                }
            } catch (err) {
                console.error('Erro ao buscar dados de IA:', err);
            }
        };

        if (isOpen) {
            fetchSettingsAndPrompts();
        }
    }, [isOpen, activeClient?.id]);

    useEffect(() => {
        if (isOpen && !isMinimized) {
            messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
        }
    }, [messages, isOpen, isMinimized]);

    const handleSendMessage = async (customPrompt = null) => {
        const textToSend = customPrompt || inputMessage;
        if (!textToSend.trim() || isLoading) return;

        const userMsg = { role: 'user', content: textToSend.trim() };
        setMessages(prev => [...prev, userMsg]);
        if (!customPrompt) setInputMessage('');
        setIsLoading(true);

        try {
            const historyPayload = messages
                .filter(m => m.role === 'user' || m.role === 'assistant')
                .map(m => ({ role: m.role, content: m.content }));

            const payload = {
                message: textToSend.trim(),
                history: historyPayload,
                conversation_id: (includeContext && selectedConvo?.id) ? selectedConvo.id : null,
                prompt_id: selectedPromptId || null
            };

            const res = await fetchWithAuth(
                `${API_URL}/ai/chat`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                },
                activeClient?.id
            );

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: data.reply,
                        usage: data.usage,
                        model: data.model
                    }
                ]);
            } else {
                const err = await res.json();
                throw new Error(err.detail || 'Erro ao processar mensagem com a IA.');
            }
        } catch (err) {
            toast.error(err.message || 'Falha ao comunicar com a IA.');
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: `⚠️ Não foi possível obter resposta: ${err.message}. Verifique sua Chave de API nas Configurações.`
                }
            ]);
        } finally {
            setIsLoading(false);
            if (!customPrompt) inputRef.current?.focus();
        }
    };

    const handleCopy = (text, idx) => {
        const cleanText = extractCleanMessageToSend(text);
        navigator.clipboard.writeText(cleanText);
        setCopiedIndex(idx);
        toast.success('Resposta copiada para a área de transferência!');
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleInsert = (text) => {
        const cleanText = extractCleanMessageToSend(text);
        if (onInsertMessage) {
            onInsertMessage(cleanText);
            toast.success('Inserido na caixa de mensagem do chat!');
        } else {
            handleCopy(cleanText, null);
        }
    };

    const handleClearChat = () => {
        setMessages([
            {
                role: 'assistant',
                content: 'Histórico limpo. Como posso te auxiliar com as negociações?'
            }
        ]);
        toast.success('Conversa reiniciada.');
    };

    // Botão Flutuante (Fechado)
    if (!isOpen) {
        return (
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full shadow-2xl shadow-indigo-500/40 border border-white/20 transition-all transform hover:scale-105 active:scale-95 group cursor-pointer"
                title="Abrir Copiloto de Vendas com IA"
            >
                <div className="relative">
                    <FiCpu className="w-5 h-5 animate-pulse text-cyan-300" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                </div>
                <span className="text-xs font-bold tracking-wide">Copiloto IA</span>
            </button>
        );
    }

    return (
        <div 
            className={`fixed bottom-5 right-5 z-40 w-[380px] sm:w-[420px] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden font-sans text-gray-100 ${
                isMinimized ? 'h-14' : 'h-[560px] max-h-[85vh]'
            }`}
        >
            {/* Header do Widget */}
            <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-cyan-400">
                        <FiCpu size={16} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-white tracking-wide">Copiloto Comercial</h3>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-cyan-400/30">
                                {activeModel}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 text-gray-400">
                    <button
                        type="button"
                        onClick={handleClearChat}
                        className="p-1.5 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                        title="Limpar conversa"
                    >
                        <FiTrash2 size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-1.5 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title={isMinimized ? "Expandir" : "Minimizar"}
                    >
                        {isMinimized ? <FiMaximize2 size={14} /> : <FiMinus size={14} />}
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title="Fechar Copiloto"
                    >
                        <FiX size={16} />
                    </button>
                </div>
            </div>

            {/* Corpo (Apenas se não minimizado) */}
            {!isMinimized && (
                <>
                    {/* Seletor Rápido de Prompt de Produto */}
                    {presets.length > 0 && (
                        <div className="px-3 py-1.5 bg-indigo-950/40 border-b border-white/5 flex items-center justify-between text-[11px] shrink-0">
                            <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                                <FiTag size={12} />
                                <span>Produto:</span>
                            </div>
                            <select
                                value={selectedPromptId || ''}
                                onChange={(e) => setSelectedPromptId(e.target.value ? Number(e.target.value) : null)}
                                style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                                className="px-2 py-0.5 bg-[#0f172a] text-white border border-indigo-500/30 rounded-lg text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[240px] truncate cursor-pointer"
                            >
                                {presets.map(p => (
                                    <option key={p.id} value={p.id} style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                                        {p.name} {p.is_default ? '⭐' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Card de Contexto do Lead Ativo */}
                    <div className="px-3 py-2 bg-slate-950/60 border-b border-white/5 flex items-center justify-between text-[11px] shrink-0">
                        <div className="flex items-center gap-2 truncate pr-2">
                            <FiUserCheck className={selectedConvo ? 'text-emerald-400' : 'text-gray-500'} size={14} />
                            {selectedConvo ? (
                                <span className="truncate">
                                    <strong className="text-white">{selectedConvo.contact_name || selectedConvo.phone}</strong>
                                    {selectedConvo.instagram && <span className="text-pink-400 ml-1">({selectedConvo.instagram})</span>}
                                </span>
                            ) : (
                                <span className="text-gray-400">Nenhum lead em foco</span>
                            )}
                        </div>

                        <label className="flex items-center gap-1.5 text-[10px] text-gray-400 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={includeContext}
                                onChange={(e) => setIncludeContext(e.target.checked)}
                                className="accent-blue-500 rounded"
                            />
                            <span>Injetar dados</span>
                        </label>
                    </div>

                    {/* Mensagens da Conversa */}
                    <FloatingAIChatMessages
                        messages={messages}
                        copiedIndex={copiedIndex}
                        handleCopy={handleCopy}
                        handleInsert={handleInsert}
                        isLoading={isLoading}
                        messagesEndRef={messagesEndRef}
                        usdToBrl={usdToBrl}
                    />

                    {/* Chips de Perguntas Rápidas */}
                    <div className="px-3 py-1.5 bg-slate-950/40 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleSendMessage('Analise a conversa deste lead e sugira a melhor mensagem de resposta persuasiva para conduzir ao fechamento.')}
                            className="whitespace-nowrap px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] text-gray-300 font-medium transition-all flex items-center gap-1 disabled:opacity-50"
                        >
                            <span>💡 Sugerir Resposta</span>
                        </button>
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleSendMessage('Como posso contornar as principais objeções deste cliente de forma amigável e convincente?')}
                            className="whitespace-nowrap px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] text-gray-300 font-medium transition-all flex items-center gap-1 disabled:opacity-50"
                        >
                            <span>🛡️ Quebrar Objeção</span>
                        </button>
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleSendMessage('Faça um resumo executivo dos pontos principais deste lead e qual a dor ou interesse dele.')}
                            className="whitespace-nowrap px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] text-gray-300 font-medium transition-all flex items-center gap-1 disabled:opacity-50"
                        >
                            <span>📋 Resumir Lead</span>
                        </button>
                    </div>

                    {/* Campo de Entrada de Mensagem */}
                    <div className="p-2.5 bg-slate-900 border-t border-white/10 shrink-0">
                        <div className="flex items-center gap-2 bg-slate-950/80 border border-white/10 rounded-xl p-1.5 focus-within:border-blue-500/60 focus-within:ring-1 focus-within:ring-blue-500/50">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="Pergunte ao Copiloto IA..."
                                className="flex-1 bg-transparent px-2 text-xs text-white placeholder-gray-500 focus:outline-none"
                            />
                            <button
                                type="button"
                                disabled={isLoading || !inputMessage.trim()}
                                onClick={() => handleSendMessage()}
                                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-all"
                            >
                                <FiSend size={13} />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

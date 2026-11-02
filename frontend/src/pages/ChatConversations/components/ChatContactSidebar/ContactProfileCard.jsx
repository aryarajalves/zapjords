import React, { useState, useEffect, useRef } from 'react';
import { FiShare2, FiUser, FiMessageSquare, FiEdit2, FiCheck, FiX, FiLoader } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../../../config';
import { fetchWithAuth } from '../../../../AuthContext';

export default function ContactProfileCard({
    selectedConvo,
    setSelectedConvo,
    timeLeft24h,
    handleClose24hWindow,
    getFirstName,
    onShareContact,
    userMessagesCount = 0,
    agentMessagesCount = 0,
    totalMessagesCount = 0,
    setConversations
}) {
    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState('');
    const [isSavingName, setIsSavingName] = useState(false);
    const prevConvoIdRef = useRef(selectedConvo?.id);

    useEffect(() => {
        if (prevConvoIdRef.current !== selectedConvo?.id) {
            prevConvoIdRef.current = selectedConvo?.id;
            setIsEditingName(false);
            setEditName(selectedConvo?.contact_name || '');
        }
    }, [selectedConvo?.id]);

    const handleStartEditName = () => {
        setEditName(selectedConvo?.contact_name || '');
        setIsEditingName(true);
    };

    const handleCancelEditName = () => {
        setIsEditingName(false);
        setEditName(selectedConvo?.contact_name || '');
    };

    const handleSaveContactName = async () => {
        const trimmed = editName.trim();
        if (!trimmed) {
            toast.error('O nome do contato não pode ser vazio');
            return;
        }
        if (!selectedConvo?.id) return;

        setIsSavingName(true);
        try {
            const res = await fetchWithAuth(`${API_URL}/chat/conversations/${selectedConvo.id}/contact-name`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contact_name: trimmed })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || 'Falha ao atualizar o nome do contato');
            }

            const data = await res.json();
            const updatedName = data.contact_name || trimmed;

            // 1. Atualizar a conversa atual selecionada
            setSelectedConvo?.(prev => (prev ? { ...prev, contact_name: updatedName } : prev));

            // 2. Atualizar na lista lateral de conversas se disponível
            setConversations?.(prev => (prev || []).map(c => 
                (c.id === selectedConvo.id || c.phone === selectedConvo.phone)
                    ? { ...c, contact_name: updatedName }
                    : c
            ));

            // 3. Emitir evento global para que a aba Contatos (Leads) e o Kanban sincronizem em tempo real
            window.dispatchEvent(new CustomEvent('contact-name-updated', {
                detail: {
                    id: selectedConvo.id,
                    phone: selectedConvo.phone,
                    name: updatedName
                }
            }));

            toast.success('Nome do contato atualizado com sucesso!');
            setIsEditingName(false);
        } catch (error) {
            toast.error(error.message || 'Erro ao atualizar o nome do contato');
        } finally {
            setIsSavingName(false);
        }
    };

    const isWindowClosed = !timeLeft24h || timeLeft24h === 'Janela Fechada' || String(timeLeft24h).toLowerCase().includes('fechada');

    return (
        <div className="text-center space-y-2.5 pb-4 border-b border-gray-200 dark:border-white/5">
            <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto flex items-center justify-center text-white text-xl font-bold shadow-md">
                {getFirstName(selectedConvo.contact_name || selectedConvo.phone || 'C')[0]}
            </div>

            {/* Nome do Contato com edição inline e sincronização */}
            {isEditingName ? (
                <div
                    className="flex items-center gap-1.5 justify-center px-2 py-0.5"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveContactName();
                            } else if (e.key === 'Escape') {
                                e.preventDefault();
                                handleCancelEditName();
                            }
                        }}
                        disabled={isSavingName}
                        autoFocus
                        placeholder="Nome do contato"
                        data-testid="edit-contact-name-input"
                        className="w-full text-center text-sm font-semibold px-2 py-1 bg-gray-100 dark:bg-white/10 border border-blue-500 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSaveContactName();
                        }}
                        disabled={isSavingName || !editName.trim()}
                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition cursor-pointer disabled:opacity-40 shrink-0"
                        title="Salvar nome (Enter)"
                        data-testid="save-contact-name-btn"
                    >
                        {isSavingName ? <FiLoader className="animate-spin" size={14} /> : <FiCheck size={14} />}
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCancelEditName();
                        }}
                        disabled={isSavingName}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition cursor-pointer shrink-0"
                        title="Cancelar (Esc)"
                        data-testid="cancel-contact-name-btn"
                    >
                        <FiX size={14} />
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-center gap-1.5 group/name">
                    <div
                        className="font-bold text-gray-800 dark:text-gray-100 text-sm break-words cursor-pointer hover:text-blue-500 transition-colors"
                        onClick={handleStartEditName}
                        title="Clique para editar o nome do contato"
                        data-testid="contact-name-display"
                    >
                        {selectedConvo.contact_name || 'Sem Nome'}
                    </div>
                    <button
                        type="button"
                        onClick={handleStartEditName}
                        className="p-1 text-gray-400 hover:text-blue-500 opacity-60 group-hover/name:opacity-100 transition-opacity cursor-pointer rounded"
                        title="Editar nome do contato"
                        data-testid="edit-contact-name-btn"
                    >
                        <FiEdit2 size={13} />
                    </button>
                </div>
            )}

            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {selectedConvo.phone}
            </div>
            <div className="text-[11px] text-gray-400">
                ID da Conversa: #{selectedConvo.id}
            </div>

            {/* Contabilização de Mensagens (Usuário vs Agente) */}
            <div className="pt-2 text-left space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider px-0.5">
                    <span>Mensagens</span>
                    <span className="text-[10px] font-mono text-gray-400">
                        {totalMessagesCount || (userMessagesCount + agentMessagesCount)} total
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {/* Mensagens enviadas pelo Usuário/Cliente */}
                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-400">
                            <FiUser size={13} />
                            <span>Usuário</span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between">
                            <span className="text-base font-bold text-white tracking-tight" data-testid="user-messages-count">
                                {userMessagesCount}
                            </span>
                            <span className="text-[10px] text-blue-300/70">enviadas</span>
                        </div>
                    </div>

                    {/* Mensagens enviadas pelo Agente/Atendente */}
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-400">
                            <FiMessageSquare size={13} />
                            <span>Agente</span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between">
                            <span className="text-base font-bold text-white tracking-tight" data-testid="agent-messages-count">
                                {agentMessagesCount}
                            </span>
                            <span className="text-[10px] text-purple-300/70">enviadas</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Botão de Compartilhar Contato (Estilo WhatsApp) */}
            {onShareContact && (
                <div className="pt-1 flex flex-col items-center">
                    <button
                        type="button"
                        onClick={onShareContact}
                        className="flex flex-col items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 group transition-all cursor-pointer"
                        title="Compartilhar contato com outra conversa"
                    >
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 shadow-sm transition-all">
                            <FiShare2 size={16} />
                        </div>
                        <span className="text-xs font-semibold">Compartilhar</span>
                    </button>
                </div>
            )}

            <div className="flex flex-col items-center gap-1.5 mt-1">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                    isWindowClosed
                        ? 'bg-red-500/15 text-red-500 dark:text-red-400 border-red-500/30'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                }`}>
                    <span className={`w-2 h-2 rounded-full ${isWindowClosed ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                    <span className={isWindowClosed ? 'text-red-500 dark:text-red-400' : ''}>
                        {isWindowClosed ? 'Janela 24h: Janela Fechada' : `Janela 24h: ${timeLeft24h}`}
                    </span>
                </div>

                {!isWindowClosed && handleClose24hWindow && (
                    <button
                        type="button"
                        onClick={() => handleClose24hWindow(selectedConvo, setSelectedConvo)}
                        className="text-[10px] text-red-500 hover:text-red-600 hover:underline flex items-center gap-1 font-medium transition cursor-pointer mt-0.5"
                        title="Encerrar a janela de 24h deste contato para realizar testes"
                    >
                        🚫 Encerrar Janela 24h (Teste)
                    </button>
                )}
            </div>
        </div>
    );
}

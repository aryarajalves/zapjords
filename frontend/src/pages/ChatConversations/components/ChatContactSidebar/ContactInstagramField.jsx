import React, { useState, useEffect } from 'react';
import { FiEdit2, FiCheck, FiX, FiLoader, FiExternalLink } from 'react-icons/fi';
import { FaInstagram } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../../../config';
import { fetchWithAuth } from '../../../../AuthContext';

export default function ContactInstagramField({
    selectedConvo,
    setSelectedConvo,
    setConversations
}) {
    const [isEditingInstagram, setIsEditingInstagram] = useState(false);
    const [editInstagram, setEditInstagram] = useState('');
    const [isSavingInstagram, setIsSavingInstagram] = useState(false);

    useEffect(() => {
        setEditInstagram(selectedConvo?.instagram || '');
        setIsEditingInstagram(false);
    }, [selectedConvo?.id, selectedConvo?.instagram]);

    const handleStartEditInstagram = () => {
        setEditInstagram(selectedConvo?.instagram || '');
        setIsEditingInstagram(true);
    };

    const handleCancelEditInstagram = () => {
        setIsEditingInstagram(false);
        setEditInstagram(selectedConvo?.instagram || '');
    };

    const handleSaveContactInstagram = async () => {
        if (!selectedConvo?.id) return;
        setIsSavingInstagram(true);
        try {
            const res = await fetchWithAuth(
                `${API_URL}/chat/conversations/${selectedConvo.id}/instagram`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ instagram: editInstagram })
                },
                selectedConvo.client_id
            );

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || 'Falha ao atualizar o Instagram');
            }

            const data = await res.json();
            const updatedInsta = data.instagram;

            setSelectedConvo?.(prev => (prev ? { ...prev, instagram: updatedInsta } : prev));

            setConversations?.(prev => (prev || []).map(c =>
                (c.id === selectedConvo.id || c.phone === selectedConvo.phone)
                    ? { ...c, instagram: updatedInsta }
                    : c
            ));

            window.dispatchEvent(new CustomEvent('contact-instagram-updated', {
                detail: {
                    id: selectedConvo.id,
                    phone: selectedConvo.phone,
                    instagram: updatedInsta
                }
            }));

            toast.success(updatedInsta ? 'Instagram atualizado com sucesso!' : 'Instagram removido com sucesso!');
            setIsEditingInstagram(false);
        } catch (error) {
            toast.error(error.message || 'Erro ao atualizar o Instagram');
        } finally {
            setIsSavingInstagram(false);
        }
    };

    return (
        <div className="pt-0.5">
            {isEditingInstagram ? (
                <div
                    className="flex items-center gap-1.5 justify-center px-2 py-0.5"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="relative flex items-center w-full max-w-[200px]">
                        <span className="absolute left-2.5 text-pink-500 font-bold text-xs select-none">@</span>
                        <input
                            type="text"
                            value={editInstagram}
                            onChange={(e) => setEditInstagram(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveContactInstagram();
                                } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    handleCancelEditInstagram();
                                }
                            }}
                            disabled={isSavingInstagram}
                            autoFocus
                            placeholder="usuario_instagram"
                            data-testid="edit-contact-instagram-input"
                            className="w-full pl-6 pr-2 py-1 text-center text-xs font-medium bg-gray-100 dark:bg-white/10 border border-pink-500/60 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSaveContactInstagram();
                        }}
                        disabled={isSavingInstagram}
                        className="p-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 transition cursor-pointer disabled:opacity-40 shrink-0"
                        title="Salvar Instagram (Enter)"
                        data-testid="save-contact-instagram-btn"
                    >
                        {isSavingInstagram ? <FiLoader className="animate-spin" size={13} /> : <FiCheck size={13} />}
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCancelEditInstagram();
                        }}
                        disabled={isSavingInstagram}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition cursor-pointer shrink-0"
                        title="Cancelar (Esc)"
                        data-testid="cancel-contact-instagram-btn"
                    >
                        <FiX size={13} />
                    </button>
                </div>
            ) : selectedConvo?.instagram ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-500/30 text-gray-800 dark:text-gray-200 group/insta shadow-xs hover:border-pink-500/50 transition">
                    <FaInstagram className="text-pink-500 shrink-0" size={13} />
                    <a
                        href={`https://instagram.com/${selectedConvo.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-0.5 tracking-tight"
                        title={`Abrir perfil @${selectedConvo.instagram} no Instagram`}
                        data-testid="contact-instagram-link"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span>@{selectedConvo.instagram}</span>
                        <FiExternalLink size={10} className="opacity-70 group-hover/insta:opacity-100" />
                    </a>
                    <button
                        type="button"
                        onClick={handleStartEditInstagram}
                        className="p-0.5 text-gray-400 hover:text-pink-500 opacity-60 group-hover/insta:opacity-100 transition-opacity cursor-pointer rounded ml-0.5"
                        title="Editar Instagram"
                        data-testid="edit-contact-instagram-btn"
                    >
                        <FiEdit2 size={11} />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={handleStartEditInstagram}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-dashed border-gray-300 dark:border-white/20 text-gray-500 dark:text-gray-400 hover:border-pink-500/50 hover:text-pink-500 dark:hover:text-pink-400 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-pink-500/5 text-xs transition cursor-pointer group"
                    title="Adicionar Instagram do contato"
                    data-testid="add-contact-instagram-btn"
                >
                    <FaInstagram size={12} className="text-gray-400 group-hover:text-pink-500 transition-colors" />
                    <span>Adicionar @instagram</span>
                </button>
            )}
        </div>
    );
}

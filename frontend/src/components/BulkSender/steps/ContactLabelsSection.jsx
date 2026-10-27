import React, { useState, useEffect } from 'react';
import { FiUserCheck, FiTag, FiX, FiPlus } from 'react-icons/fi';
import { useClient } from '../../../contexts/ClientContext';
import { fetchWithAuth } from '../../../AuthContext';
import { API_URL } from '../../../config';

const ContactLabelsSection = ({
    chatwootLabels = [],
    selectedContactLabels = [],
    setSelectedContactLabels
}) => {
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [localTags, setLocalTags] = useState([]);
    
    // Tentativa segura de acessar activeClient caso o hook useClient esteja disponível
    let activeClient = null;
    try {
        const clientCtx = useClient();
        activeClient = clientCtx?.activeClient;
    } catch {
        // Fallback seguro em ambientes de teste sem ClientProvider
    }

    // Carrega tags dos leads do CRM caso chatwootLabels venha vazio
    useEffect(() => {
        let isMounted = true;
        const fetchFallbackTags = async () => {
            if (chatwootLabels && chatwootLabels.length > 0) return;
            if (!activeClient?.id) return;
            try {
                const resLeads = await fetchWithAuth(`${API_URL}/leads/filters`, {}, activeClient.id);
                if (resLeads && resLeads.ok) {
                    const data = await resLeads.json();
                    if (isMounted && Array.isArray(data?.tags)) {
                        setLocalTags(data.tags);
                    }
                }
            } catch (err) {
                // Silencioso em fallback
            }
        };

        fetchFallbackTags();
        return () => { isMounted = false; };
    }, [chatwootLabels, activeClient?.id]);

    // Lista de tags unificada (prop prioritized, localTags como garantia)
    const sourceLabels = (chatwootLabels && chatwootLabels.length > 0) ? chatwootLabels : localTags;

    // Lista de tags normalizadas já selecionadas
    const selectedValues = (selectedContactLabels || []).map(l => (typeof l === 'object' ? (l.value || l.title || l.name) : l));

    // Opções disponíveis a partir de chatwootLabels / leads, excluindo já selecionadas
    const availableOptions = (sourceLabels || [])
        .map(lbl => (typeof lbl === 'object' ? (lbl.title || lbl.name || lbl.value || lbl.label) : lbl))
        .filter(name => name && typeof name === 'string' && !selectedValues.some(sv => String(sv).toLowerCase() === String(name).toLowerCase()));

    const handleAddTag = (tagName) => {
        const clean = String(tagName || '').trim().slice(0, 25);
        if (!clean) return;

        if (!selectedValues.some(sv => String(sv).toLowerCase() === clean.toLowerCase())) {
            const next = [...selectedValues, clean];
            setSelectedContactLabels(next);
        }
        setInputValue('');
        setIsOpen(false);
    };

    const handleRemoveTag = (tagToRemove) => {
        const next = selectedValues.filter(tag => tag !== tagToRemove);
        setSelectedContactLabels(next);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag(inputValue);
        }
    };

    const isSelected = selectedValues.length > 0;

    return (
        <div 
            id="contact-labels-section"
            className={`p-6 rounded-3xl transition-all border-2 relative ${
                isSelected 
                    ? 'bg-emerald-500/5 border-emerald-500/30 shadow-lg shadow-emerald-950/20' 
                    : 'bg-slate-800/10 border-white/5 hover:border-white/10'
            }`}
        >
            <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${
                    isSelected 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 scale-105' 
                        : 'bg-slate-800 text-slate-500'
                }`}>
                    <FiUserCheck size={22} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <div className={`text-base font-black tracking-tight ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                            Etiquetas do Contato
                        </div>
                        {isSelected && (
                            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                {selectedValues.length} {selectedValues.length === 1 ? 'etiqueta' : 'etiquetas'}
                            </span>
                        )}
                    </div>
                    <div className="text-[9px] text-emerald-400/90 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Aplica diretamente no contato (e não na conversa)
                    </div>
                </div>
            </div>

            {/* Tags selecionadas */}
            {selectedValues.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {selectedValues.map((tag) => (
                        <span
                            key={tag}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold transition-all hover:bg-emerald-500/25"
                        >
                            <FiTag size={12} className="text-emerald-400" />
                            <span className="truncate max-w-[180px]">{tag}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="p-0.5 hover:bg-emerald-500/30 rounded-full text-emerald-300 hover:text-white transition-colors"
                                title="Remover etiqueta"
                            >
                                <FiX size={12} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Input e Dropdown para adicionar tags */}
            <div className="relative">
                <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-2xl px-4 py-2.5 focus-within:border-emerald-500/40 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all relative z-50">
                    <FiTag size={16} className="text-slate-500" />
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value.slice(0, 25));
                            setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                        onKeyDown={handleKeyDown}
                        placeholder={selectedValues.length === 0 ? "Selecione ou digite uma etiqueta para o contato..." : "Adicionar outra etiqueta..."}
                        maxLength={25}
                        className="w-full bg-transparent outline-none text-sm text-white placeholder-slate-500 font-medium"
                    />
                    {inputValue.trim() && (
                        <button
                            type="button"
                            onClick={() => handleAddTag(inputValue)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                        >
                            <FiPlus size={14} /> Adicionar
                        </button>
                    )}
                </div>

                {/* Dropdown de sugestões */}
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 max-h-52 overflow-y-auto p-2 space-y-1">
                            {inputValue.trim() && !availableOptions.some(opt => opt.toLowerCase() === inputValue.trim().toLowerCase()) && (
                                <button
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); handleAddTag(inputValue); }}
                                    onClick={() => handleAddTag(inputValue)}
                                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-2 font-bold transition-colors"
                                >
                                    <FiPlus size={14} /> Criar etiqueta: &quot;{inputValue.trim().slice(0, 25)}&quot;
                                </button>
                            )}

                            {availableOptions
                                .filter(opt => !inputValue.trim() || opt.toLowerCase().includes(inputValue.toLowerCase()))
                                .slice(0, 15)
                                .map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onMouseDown={(e) => { e.preventDefault(); handleAddTag(opt); }}
                                        onClick={() => handleAddTag(opt)}
                                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between font-medium transition-colors"
                                    >
                                        <span className="flex items-center gap-2">
                                            <FiTag size={12} className="text-slate-500" />
                                            {opt}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-semibold uppercase">Selecionar</span>
                                    </button>
                                ))}

                            {availableOptions.filter(opt => !inputValue.trim() || opt.toLowerCase().includes(inputValue.toLowerCase())).length === 0 && !inputValue.trim() && (
                                <div className="text-center py-3 text-xs text-slate-500">
                                    Nenhuma etiqueta sugerida. Digite o nome da etiqueta.
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <div className="flex items-center justify-between mt-2.5 px-1">
                <span className="text-[9px] text-slate-500">
                    {inputValue.length}/25 caracteres
                </span>
                <span className="text-[9px] text-slate-500 italic">
                    A etiqueta será vinculada ao perfil do contato no CRM
                </span>
            </div>
        </div>
    );
};

export default ContactLabelsSection;

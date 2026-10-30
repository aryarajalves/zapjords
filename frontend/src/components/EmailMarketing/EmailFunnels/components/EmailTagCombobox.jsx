import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FiTag, FiSearch, FiChevronDown, FiX, FiPlus, FiCheck } from 'react-icons/fi';
import { API_URL } from '../../../../config';
import { useClient } from '../../../../contexts/ClientContext';

export default function EmailTagCombobox({
  value,
  onChange,
  multiple = false,
  placeholder = 'Selecione ou digite uma tag...',
  label
}) {
  const { activeClient } = useClient();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalização do valor atual
  const selectedList = useMemo(() => {
    if (multiple) {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string' && value.trim()) {
        return value.split(',').map((t) => t.trim()).filter(Boolean);
      }
      return [];
    }
    return typeof value === 'string' ? value.trim() : '';
  }, [value, multiple]);

  // Carregar tags dos contatos e do sistema
  useEffect(() => {
    if (!activeClient?.id) return;
    let isMounted = true;
    setLoading(true);

    const token = localStorage.getItem('token');
    const headers = {
      Authorization: `Bearer ${token}`,
      'X-Client-ID': String(activeClient.id)
    };

    Promise.allSettled([
      fetch(`${API_URL}/leads/filters`, { headers }).then((r) => (r.ok ? r.json() : {})),
      fetch(`${API_URL}/chat/labels/details`, { headers }).then((r) => (r.ok ? r.json() : []))
    ])
      .then(([leadsRes, labelsRes]) => {
        if (!isMounted) return;
        const tagSet = new Set();

        if (leadsRes.status === 'fulfilled' && leadsRes.value?.tags && Array.isArray(leadsRes.value.tags)) {
          leadsRes.value.tags.forEach((t) => {
            if (typeof t === 'string' && t.trim()) tagSet.add(t.trim());
          });
        }

        if (labelsRes.status === 'fulfilled' && Array.isArray(labelsRes.value)) {
          labelsRes.value.forEach((l) => {
            const name = typeof l === 'string' ? l : l.name || l.title;
            if (name && name.trim()) tagSet.add(name.trim());
          });
        }

        setAvailableTags(Array.from(tagSet).sort((a, b) => a.localeCompare(b)));
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeClient?.id]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Foco no campo de busca ao abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  // Lista de tags filtradas
  const filteredTags = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return availableTags;
    return availableTags.filter((t) => t.toLowerCase().includes(q));
  }, [availableTags, search]);

  const exactMatchExists = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return availableTags.some((t) => t.toLowerCase() === q);
  }, [availableTags, search]);

  // Manipular seleção no modo single
  const handleSelectSingle = (tag) => {
    onChange(tag);
    setIsOpen(false);
    setSearch('');
  };

  // Manipular seleção no modo multiple
  const handleToggleMultiple = (tag) => {
    const current = Array.isArray(selectedList) ? [...selectedList] : [];
    const index = current.indexOf(tag);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(tag);
    }
    onChange(current);
  };

  // Criar nova tag digitada pelo usuário
  const handleCreateNewTag = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const cleanTag = search.trim();
    if (!cleanTag) return;

    // Adiciona na lista local para não sumir
    if (!availableTags.includes(cleanTag)) {
      setAvailableTags((prev) => [...prev, cleanTag].sort((a, b) => a.localeCompare(b)));
    }

    if (multiple) {
      handleToggleMultiple(cleanTag);
    } else {
      handleSelectSingle(cleanTag);
    }
    setSearch('');
  };

  // Remover tag chip no modo multiple
  const handleRemoveChip = (e, tagToRemove) => {
    e.stopPropagation();
    if (!multiple) {
      onChange('');
      return;
    }
    const current = Array.isArray(selectedList) ? [...selectedList] : [];
    onChange(current.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="relative w-full text-left" ref={containerRef}>
      {label && (
        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
          {label}
        </label>
      )}

      {/* Botão de Disparo / Input Visual */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-h-[36px] px-3 py-1.5 bg-slate-800 border rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all ${
          isOpen ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-white/10 hover:border-white/20'
        }`}
      >
        <div className="flex-1 flex flex-wrap items-center gap-1.5 overflow-hidden">
          {multiple ? (
            Array.isArray(selectedList) && selectedList.length > 0 ? (
              selectedList.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded-lg text-[11px] font-semibold"
                >
                  <FiTag size={10} className="text-blue-400" />
                  {tag}
                  <button
                    type="button"
                    onClick={(e) => handleRemoveChip(e, tag)}
                    className="hover:text-white p-0.5"
                  >
                    <FiX size={11} />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500 flex items-center gap-1.5">
                <FiTag size={12} className="text-gray-500" /> {placeholder}
              </span>
            )
          ) : selectedList ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <FiTag size={12} className="text-emerald-400" />
              {selectedList}
            </span>
          ) : (
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <FiTag size={12} className="text-gray-500" /> {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-gray-400">
          {!multiple && selectedList && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 hover:text-white rounded"
              title="Limpar seleção"
            >
              <FiX size={12} />
            </button>
          )}
          <FiChevronDown
            size={14}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-400' : ''}`}
          />
        </div>
      </div>

      {/* Menu Dropdown Suspenso */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-white/15 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Campo de Busca */}
          <div className="p-2 border-b border-white/10 flex items-center gap-2 bg-slate-950/40">
            <FiSearch size={14} className="text-gray-400 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (!exactMatchExists && search.trim()) {
                    handleCreateNewTag(e);
                  } else if (filteredTags.length > 0) {
                    if (multiple) handleToggleMultiple(filteredTags[0]);
                    else handleSelectSingle(filteredTags[0]);
                  }
                }
              }}
              placeholder="Buscar ou digitar nova tag..."
              className="w-full bg-transparent text-xs text-white placeholder-gray-500 outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-gray-400 hover:text-white p-1"
              >
                <FiX size={12} />
              </button>
            )}
          </div>

          {/* Opção de Criar Nova Tag se não existir correspondência exata */}
          {search.trim() && !exactMatchExists && (
            <button
              type="button"
              onClick={handleCreateNewTag}
              className="w-full px-3 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border-b border-white/5 flex items-center gap-2 text-xs font-bold transition-colors text-left"
            >
              <FiPlus size={14} className="text-blue-400 shrink-0" />
              <span>
                Criar tag: <strong className="text-white underline">"{search.trim()}"</strong>
              </span>
            </button>
          )}

          {/* Lista de Tags dos Contatos */}
          <div className="max-h-52 overflow-y-auto p-1 space-y-0.5">
            {loading ? (
              <div className="py-4 text-center text-xs text-gray-500">Carregando tags dos contatos...</div>
            ) : filteredTags.length === 0 && !search.trim() ? (
              <div className="py-4 text-center text-xs text-gray-500">Nenhuma tag cadastrada ainda.</div>
            ) : filteredTags.length === 0 && search.trim() && exactMatchExists ? (
              <div className="py-4 text-center text-xs text-gray-500">Nenhuma tag encontrada.</div>
            ) : (
              filteredTags.map((tag) => {
                const isSelected = multiple
                  ? Array.isArray(selectedList) && selectedList.includes(tag)
                  : selectedList === tag;

                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (multiple) handleToggleMultiple(tag);
                      else handleSelectSingle(tag);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors text-left ${
                      isSelected
                        ? 'bg-blue-600/20 text-blue-300 font-bold'
                        : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <FiTag
                        size={12}
                        className={isSelected ? 'text-blue-400 shrink-0' : 'text-gray-500 shrink-0'}
                      />
                      <span className="truncate">{tag}</span>
                    </span>
                    {isSelected && <FiCheck size={14} className="text-blue-400 shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

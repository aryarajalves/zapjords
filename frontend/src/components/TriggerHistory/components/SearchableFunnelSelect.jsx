import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FiSearch, FiX, FiCheck, FiChevronDown, FiZap } from 'react-icons/fi';

const normalizeText = (text) =>
  String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export default function SearchableFunnelSelect({
  value,
  onChange,
  funnels = [],
  placeholder = 'Buscar funil por nome...',
  emptyLabel = null,
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedFunnel = useMemo(() => {
    if (!value) return null;
    return funnels.find((f) => String(f.id) === String(value)) || null;
  }, [value, funnels]);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtragem dos funis por texto digitado
  const filteredFunnels = useMemo(() => {
    if (!searchTerm.trim()) return funnels;
    const normSearch = normalizeText(searchTerm);
    return funnels.filter((f) => {
      const normName = normalizeText(f.name);
      const strId = String(f.id);
      return normName.includes(normSearch) || strId.includes(normSearch);
    });
  }, [funnels, searchTerm]);

  const handleSelect = (funnelId) => {
    onChange(funnelId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    setIsOpen(true);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full text-xs">
      {/* Estado 1: Funil Selecionado (quando o dropdown está fechado) */}
      {!isOpen && selectedFunnel ? (
        <div
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="flex items-center justify-between p-2.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/20 text-slate-800 dark:text-slate-100 cursor-pointer hover:border-blue-400 transition group shadow-sm"
          title="Clique para trocar de funil"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="p-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FiZap size={14} />
            </span>
            <span className="font-bold truncate">{selectedFunnel.name}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              #{selectedFunnel.id}
            </span>
            {selectedFunnel.is_active === false && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                (Inativo)
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-red-500 rounded transition cursor-pointer"
              title="Remover funil selecionado"
            >
              <FiX size={15} />
            </button>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold group-hover:underline">
              Trocar
            </span>
          </div>
        </div>
      ) : (
        /* Estado 2: Input de Busca com Dropdown */
        <div className="relative">
          <div className="relative flex items-center">
            <FiSearch className="absolute left-3 text-slate-400 pointer-events-none" size={14} />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-xs shadow-sm"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <FiX size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <FiChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          {/* Lista Flutuante de Opções Filtradas */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-30 divide-y divide-slate-100 dark:divide-slate-800 animate-fade-in">
              {/* Opção Vazia (opcional) */}
              {emptyLabel && (
                <button
                  type="button"
                  onClick={() => handleSelect('')}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/70 transition cursor-pointer ${
                    !value ? 'bg-slate-50 dark:bg-slate-800 text-blue-600 font-bold' : 'text-slate-500'
                  }`}
                >
                  <span>⚪ {emptyLabel}</span>
                  {!value && <FiCheck className="text-blue-600" size={14} />}
                </button>
              )}

              {filteredFunnels.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400 italic">
                  Nenhum funil encontrado para "{searchTerm}".
                </div>
              ) : (
                filteredFunnels.map((f) => {
                  const isSelected = String(f.id) === String(value);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleSelect(f.id)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-950/30 transition cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FiZap className="shrink-0 text-amber-500" size={12} />
                        <span className="truncate">{f.name}</span>
                        {f.is_active === false && (
                          <span className="text-[10px] text-amber-500 font-normal italic">
                            (Inativo)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          #{f.id}
                        </span>
                        {isSelected && <FiCheck className="text-blue-600 shrink-0" size={14} />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

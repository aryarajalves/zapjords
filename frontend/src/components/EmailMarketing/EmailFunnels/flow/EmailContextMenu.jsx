import React, { useEffect, useRef, useState } from 'react';
import { FiMail, FiClock, FiTag, FiSearch } from 'react-icons/fi';

export default function EmailContextMenu({ top, left, onClose, onAddNode }) {
  const [search, setSearch] = useState('');
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const items = [
    {
      type: 'email',
      title: 'Disparo de E-mail',
      desc: 'Enviar template cadastrado ao lead',
      icon: FiMail,
      colorClass: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 group-hover:bg-indigo-500/20',
      badge: 'Mensagem'
    },
    {
      type: 'delay',
      title: 'Tempo de Espera',
      desc: 'Pausa em minutos, horas ou dias',
      icon: FiClock,
      colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20 group-hover:bg-amber-500/20',
      badge: 'Delay'
    },
    {
      type: 'tag',
      title: 'Ação de Etiqueta',
      desc: 'Adicionar ou remover tag do lead',
      icon: FiTag,
      colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/20',
      badge: 'Tag'
    }
  ];

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      ref={menuRef}
      style={{ top: `${top}px`, left: `${left}px` }}
      className="fixed z-50 w-72 bg-slate-900/95 border border-white/15 rounded-2xl shadow-2xl p-2.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 text-white"
    >
      <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-white/10 mb-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
          Adicionar Nó ao Fluxo
        </span>
        <span className="text-[10px] bg-slate-800 text-gray-400 px-1.5 py-0.5 rounded border border-white/5">
          Botão Direito
        </span>
      </div>

      {/* Busca Rápida */}
      <div className="px-2 py-1.5 mb-2 bg-slate-950/60 border border-white/5 rounded-xl flex items-center gap-2">
        <FiSearch size={13} className="text-gray-500 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrar nós..."
          className="w-full bg-transparent text-xs text-white placeholder-gray-500 outline-none"
        />
      </div>

      {/* Lista de Nós */}
      <div className="space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              type="button"
              onClick={() => {
                onAddNode(item.type);
                onClose();
              }}
              className="w-full p-2 rounded-xl flex items-center gap-3 text-left hover:bg-slate-800 transition-all group border border-transparent hover:border-white/5"
            >
              <div className={`p-2 rounded-xl border transition-colors shrink-0 ${item.colorClass}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-200 group-hover:text-white truncate">
                    {item.title}
                  </span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase bg-slate-800 px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">{item.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

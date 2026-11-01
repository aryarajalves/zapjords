import React, { useEffect, useRef, useState } from 'react';
import {
  FiMail,
  FiClock,
  FiTag,
  FiSearch,
  FiGlobe,
  FiTrello,
  FiGitBranch,
  FiPieChart,
  FiCalendar,
  FiCornerUpRight
} from 'react-icons/fi';

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
      type: 'condition',
      title: 'Condição (Se / Senão)',
      desc: 'Bifurcação por tag ou interação',
      icon: FiGitBranch,
      colorClass: 'text-violet-400 bg-violet-500/10 border-violet-500/20 group-hover:bg-violet-500/20',
      badge: 'Lógica'
    },
    {
      type: 'split',
      title: 'Divisor A/B (Split)',
      desc: 'Dividir fluxo para testes A/B',
      icon: FiPieChart,
      colorClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 group-hover:bg-cyan-500/20',
      badge: 'Teste A/B'
    },
    {
      type: 'wait_until',
      title: 'Esperar Horário / Dia',
      desc: 'Disparo em horário comercial ou dia útil',
      icon: FiCalendar,
      colorClass: 'text-orange-400 bg-orange-500/10 border-orange-500/20 group-hover:bg-orange-500/20',
      badge: 'Agenda'
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
      type: 'sub_funnel',
      title: 'Ir Para Outro Funil',
      desc: 'Matricular lead em outra régua',
      icon: FiCornerUpRight,
      colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/20',
      badge: 'Fluxo'
    },
    {
      type: 'tag',
      title: 'Ação de Etiqueta',
      desc: 'Adicionar ou remover tag do lead',
      icon: FiTag,
      colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/20',
      badge: 'Tag'
    },
    {
      type: 'webhook',
      title: 'Disparo Webhook',
      desc: 'Requisição HTTP POST externa',
      icon: FiGlobe,
      colorClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 group-hover:bg-cyan-500/20',
      badge: 'Webhook'
    },
    {
      type: 'kanban',
      title: 'Mover no Kanban',
      desc: 'Atualizar etapa no CRM de Vendas',
      icon: FiTrello,
      colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20 group-hover:bg-amber-500/20',
      badge: 'CRM'
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

      <div className="relative mb-2">
        <FiSearch className="absolute left-2.5 top-2.5 text-gray-500" size={12} />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar nós..."
          className="w-full bg-slate-800/80 border border-white/10 rounded-xl pl-7 pr-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-medium"
        />
      </div>

      <div className="max-h-72 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
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
              className="w-full p-2 rounded-xl flex items-center justify-between hover:bg-white/5 transition-all text-left group cursor-pointer border border-transparent hover:border-white/5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-2 rounded-lg border transition-all ${item.colorClass}`}>
                  <Icon size={14} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-gray-200 group-hover:text-white truncate">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">{item.desc}</div>
                </div>
              </div>
              <span className="text-[9px] font-semibold text-gray-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 ml-2 shrink-0">
                {item.badge}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiZap, FiCheck } from 'react-icons/fi';
import { CONTACT_VARIABLES } from '../utils/emailHtmlParsers';

export default function TextBlockMaximizeModal({
  isOpen,
  onClose,
  activeBlock,
  onUpdateActiveBlock
}) {
  const textareaRef = useRef(null);

  if (!isOpen || !activeBlock || activeBlock.type !== 'text') return null;

  const handleInsertVariable = (code) => {
    const el = textareaRef.current;
    const currentVal = activeBlock.content || '';

    if (!el) {
      onUpdateActiveBlock('content', currentVal + (currentVal ? ' ' : '') + code);
      return;
    }

    const start = el.selectionStart ?? currentVal.length;
    const end = el.selectionEnd ?? currentVal.length;
    const newVal = currentVal.substring(0, start) + code + currentVal.substring(end);
    onUpdateActiveBlock('content', newVal);

    setTimeout(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + code.length;
    }, 0);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl h-[85vh] max-h-[800px] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
              <FiZap size={18} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Editar Texto do E-mail (Modo Expandido)</h3>
              <p className="text-[11px] text-gray-400">Escreva o conteúdo com mais espaço e adicione variáveis dinâmicas</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            title="Fechar"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Barra de Variáveis Rápidas */}
        <div className="px-6 py-3 border-b border-white/10 bg-slate-900/90 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold flex items-center gap-1 mr-1">
            <FiZap size={13} className="text-amber-400" /> Inserir Variável:
          </span>
          {CONTACT_VARIABLES.map(v => (
            <button
              key={v.code}
              type="button"
              onClick={() => handleInsertVariable(v.code)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-blue-600 text-gray-200 hover:text-white rounded-lg text-xs font-mono font-medium transition-all border border-white/10 hover:border-blue-500 shadow-sm"
              title={v.label}
            >
              {v.code} <span className="text-[10px] text-gray-400 font-sans ml-1">({v.label})</span>
            </button>
          ))}
        </div>

        {/* Textarea em Tela Cheia */}
        <div className="flex-1 p-6 flex flex-col min-h-0 bg-slate-950/60">
          <textarea
            ref={textareaRef}
            value={activeBlock.content || ''}
            onChange={e => onUpdateActiveBlock('content', e.target.value)}
            placeholder="Escreva seu e-mail aqui... Você pode usar quebras de linha e variáveis como {{primeiro_nome}}, {{email}}..."
            className="w-full flex-1 p-5 !bg-slate-900 border border-white/10 rounded-2xl !text-white text-base font-sans leading-relaxed focus:outline-none focus:!border-blue-500 focus:ring-2 focus:ring-blue-500/30 resize-none shadow-2xl selection:bg-blue-600 selection:text-white"
            style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
            autoFocus
          />
        </div>

        {/* Rodapé de Ações */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 bg-slate-950/60">
          <div className="text-xs text-gray-400">
            {activeBlock.content?.length || 0} caracteres | {activeBlock.content?.split(/\s+/).filter(Boolean).length || 0} palavras
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <FiCheck size={14} /> Concluir e Voltar
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

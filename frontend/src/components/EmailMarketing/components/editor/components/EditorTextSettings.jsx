import React, { useRef } from 'react';
import { FiMaximize2, FiZap } from 'react-icons/fi';
import { CONTACT_VARIABLES } from '../utils/emailHtmlParsers';

export default function EditorTextSettings({
  activeBlock,
  onUpdateActiveBlock,
  onOpenMaximizeModal
}) {
  const textareaRef = useRef(null);

  // Insere a tag na posição exata do cursor ou no final
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

    // Reposiciona o cursor após a inserção
    setTimeout(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + code.length;
    }, 0);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-gray-300 font-semibold flex items-center gap-1.5">
            Conteúdo do Texto:
          </label>
          <button
            type="button"
            onClick={onOpenMaximizeModal}
            className="flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/20 transition-all cursor-pointer"
            title="Maximizar editor de texto para tela cheia"
          >
            <FiMaximize2 size={12} />
            <span>Maximizar</span>
          </button>
        </div>

        <textarea
          ref={textareaRef}
          rows={7}
          value={activeBlock.content || ''}
          onChange={e => onUpdateActiveBlock('content', e.target.value)}
          placeholder="Digite seu texto aqui..."
          className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-sans leading-relaxed resize-y"
        />

        {/* Atalhos de Variáveis Rápidas abaixo do textarea */}
        <div className="mt-2 pt-2 border-t border-white/10">
          <div className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 flex items-center gap-1">
            <FiZap size={11} className="text-amber-400" /> Inserir Variável Dinâmica:
          </div>
          <div className="flex flex-wrap gap-1">
            {CONTACT_VARIABLES.map(v => (
              <button
                key={v.code}
                type="button"
                onClick={() => handleInsertVariable(v.code)}
                title={v.label}
                className="px-2 py-0.5 bg-slate-800 hover:bg-blue-600 hover:border-blue-500 text-gray-300 hover:text-white rounded text-[10px] font-mono transition-all border border-white/10"
              >
                {v.code}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">
          Tamanho da Fonte: {activeBlock.fontSize || 15}px
        </label>
        <input
          type="range"
          min="12"
          max="36"
          value={activeBlock.fontSize || 15}
          onChange={e => onUpdateActiveBlock('fontSize', Number(e.target.value))}
          className="w-full accent-blue-500 cursor-pointer"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Cor do Texto:</label>
        <input
          type="color"
          value={activeBlock.color || '#334155'}
          onChange={e => onUpdateActiveBlock('color', e.target.value)}
          className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Alinhamento:</label>
        <div className="flex gap-2">
          {['left', 'center', 'right', 'justify'].map(align => (
            <button
              key={align}
              type="button"
              onClick={() => onUpdateActiveBlock('textAlign', align)}
              className={`flex-1 py-1.5 text-xs rounded-lg font-semibold capitalize border ${
                (activeBlock.textAlign || 'left') === align
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-800 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {align === 'left' ? 'Esquerda' : align === 'center' ? 'Centro' : align === 'right' ? 'Direita' : 'Justificado'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

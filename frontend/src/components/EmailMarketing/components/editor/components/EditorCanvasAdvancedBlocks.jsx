import React from 'react';

/**
 * Renderizador de Blocos Avançados no Canvas Visual do Editor de E-mail:
 * - Countdown (Contador Regressivo)
 * - Callout (Destaque / Depoimento)
 * - Product Card (Vitrine de Oferta)
 * - Columns 3 (3 Colunas / Benefícios)
 * - Signature (Assinatura Pessoal)
 * - Spacer (Espaçador)
 * - HTML Embed (Código HTML)
 */
export default function EditorCanvasAdvancedBlocks({ block: b }) {
  if (b.type === 'countdown') {
    return (
      <div className="py-2 text-center select-none">
        <div 
          className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5"
          style={{ color: b.accentColor || '#ef4444' }}
        >
          <span>⏳</span> {b.title || 'A Oferta Termina Em:'}
        </div>
        <div className="inline-flex items-center gap-1.5">
          <div 
            className="rounded-lg p-2 min-w-[48px] text-center shadow-sm"
            style={{ backgroundColor: b.bgColor || '#0f172a', color: b.textColor || '#ffffff' }}
          >
            <div className="text-xl font-black leading-none">{b.days || '02'}</div>
            <div className="text-[9px] uppercase tracking-wider opacity-70 mt-1">Dias</div>
          </div>
          <span className="font-bold text-gray-500">:</span>
          <div 
            className="rounded-lg p-2 min-w-[48px] text-center shadow-sm"
            style={{ backgroundColor: b.bgColor || '#0f172a', color: b.textColor || '#ffffff' }}
          >
            <div className="text-xl font-black leading-none">{b.hours || '14'}</div>
            <div className="text-[9px] uppercase tracking-wider opacity-70 mt-1">Horas</div>
          </div>
          <span className="font-bold text-gray-500">:</span>
          <div 
            className="rounded-lg p-2 min-w-[48px] text-center shadow-sm"
            style={{ backgroundColor: b.bgColor || '#0f172a', color: b.textColor || '#ffffff' }}
          >
            <div className="text-xl font-black leading-none">{b.minutes || '35'}</div>
            <div className="text-[9px] uppercase tracking-wider opacity-70 mt-1">Min</div>
          </div>
          <span className="font-bold text-gray-500">:</span>
          <div 
            className="rounded-lg p-2 min-w-[48px] text-center shadow-sm"
            style={{ backgroundColor: b.bgColor || '#0f172a', color: b.accentColor || '#ef4444' }}
          >
            <div className="text-xl font-black leading-none animate-pulse">{b.seconds || '48'}</div>
            <div className="text-[9px] uppercase tracking-wider opacity-70 mt-1">Seg</div>
          </div>
        </div>
      </div>
    );
  }

  if (b.type === 'callout') {
    return (
      <div 
        className="rounded-r-xl p-4 my-1 transition-all"
        style={{ 
          backgroundColor: b.bgColor || '#f8fafc',
          borderLeft: `4px solid ${b.borderColor || '#3b82f6'}`,
          color: b.textColor || '#1e293b'
        }}
      >
        {b.title && (
          <div className="font-bold text-sm mb-1">{b.title}</div>
        )}
        <div className={`text-xs leading-relaxed ${b.author ? 'italic' : ''}`} style={{ whiteSpace: 'pre-wrap' }}>
          {b.text || 'Digite a mensagem de destaque ou depoimento...'}
        </div>
        {b.author && (
          <div className="mt-2 text-xs font-bold" style={{ color: b.borderColor || '#3b82f6' }}>
            — {b.author}
          </div>
        )}
      </div>
    );
  }

  if (b.type === 'product_card') {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white shadow-sm my-2 text-center p-4">
        {b.imageUrl && (
          <img 
            src={b.imageUrl} 
            alt={b.productTitle} 
            className="w-full max-h-48 object-contain rounded-xl mb-3 mx-auto"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <div className="text-base font-bold text-gray-900 mb-1">{b.productTitle || 'Oferta Exclusiva'}</div>
        {b.productDesc && (
          <div className="text-xs text-gray-500 mb-3" style={{ whiteSpace: 'pre-wrap' }}>{b.productDesc}</div>
        )}
        <div className="my-2">
          {b.originalPrice && (
            <span className="text-xs text-gray-400 line-through mr-2">{b.originalPrice}</span>
          )}
          {b.discountPrice && (
            <span className="text-xl font-black text-emerald-600">{b.discountPrice}</span>
          )}
        </div>
        <div className="mt-3">
          <span 
            className="inline-block px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md"
            style={{ backgroundColor: b.buttonBgColor || '#10b981' }}
          >
            {b.buttonText || 'Quero Comprar Agora'}
          </span>
        </div>
      </div>
    );
  }

  if (b.type === 'columns_3') {
    return (
      <div className="grid grid-cols-3 gap-2.5 my-2 text-center">
        <div className="p-2.5 bg-slate-50 border border-gray-100 rounded-xl">
          <div className="text-xl mb-1">{b.col1Icon || '⚡'}</div>
          <div className="font-bold text-xs text-gray-900 mb-0.5">{b.col1Title || 'Recurso 1'}</div>
          <div className="text-[10px] text-gray-500 leading-tight">{b.col1Text || 'Descrição curta'}</div>
        </div>
        <div className="p-2.5 bg-slate-50 border border-gray-100 rounded-xl">
          <div className="text-xl mb-1">{b.col2Icon || '🛡️'}</div>
          <div className="font-bold text-xs text-gray-900 mb-0.5">{b.col2Title || 'Recurso 2'}</div>
          <div className="text-[10px] text-gray-500 leading-tight">{b.col2Text || 'Descrição curta'}</div>
        </div>
        <div className="p-2.5 bg-slate-50 border border-gray-100 rounded-xl">
          <div className="text-xl mb-1">{b.col3Icon || '💬'}</div>
          <div className="font-bold text-xs text-gray-900 mb-0.5">{b.col3Title || 'Recurso 3'}</div>
          <div className="text-[10px] text-gray-500 leading-tight">{b.col3Text || 'Descrição curta'}</div>
        </div>
      </div>
    );
  }

  if (b.type === 'signature') {
    return (
      <div className="flex items-center gap-3.5 my-3 p-3 bg-slate-50/50 rounded-xl border border-gray-100">
        {b.avatarUrl ? (
          <img 
            src={b.avatarUrl} 
            alt={b.authorName} 
            className="w-12 h-12 rounded-full object-cover border-2 border-blue-500 shrink-0" 
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
            {(b.authorName || 'A')[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <div className="text-xl text-gray-800 italic font-serif leading-none mb-1">
            {b.signatureText || b.authorName || 'Assinatura'}
          </div>
          <div className="text-xs font-bold text-gray-900">{b.authorName || 'Seu Nome'}</div>
          <div className="text-[10px] text-gray-500">{b.authorRole || 'Especialista'}{b.company ? ` • ${b.company}` : ''}</div>
        </div>
      </div>
    );
  }

  if (b.type === 'spacer') {
    return (
      <div 
        className="w-full border border-dashed border-gray-200 dark:border-white/10 flex items-center justify-center text-[10px] text-gray-400 rounded-lg transition-all"
        style={{ height: `${b.height || 24}px` }}
      >
        Espaçador ({b.height || 24}px)
      </div>
    );
  }

  if (b.type === 'html_embed') {
    return (
      <div className="my-2 p-3 bg-slate-900 border border-dashed border-blue-500/30 rounded-xl">
        <div className="text-[10px] font-mono uppercase text-blue-400 mb-1 flex items-center justify-between">
          <span>&lt;/&gt; Bloco HTML Personalizado</span>
          <span className="text-[9px] text-gray-500">Preview</span>
        </div>
        <div 
          className="text-xs text-white overflow-hidden"
          dangerouslySetInnerHTML={{ __html: b.htmlCode || '<div class="text-gray-400 italic">Nenhum código HTML inserido.</div>' }}
        />
      </div>
    );
  }

  return null;
}

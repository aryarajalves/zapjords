import React from 'react';

/**
 * Painel de Configurações para Blocos Avançados no EditorRightSidebar:
 * - Countdown
 * - Callout
 * - Product Card
 * - Columns 3
 * - Signature
 * - Spacer
 * - HTML Embed
 */
export default function EditorAdvancedBlockSettings({
  activeBlock: b,
  onUpdateActiveBlock
}) {
  if (b.type === 'countdown') {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Título do Contador:</label>
          <input
            type="text"
            value={b.title || ''}
            onChange={(e) => onUpdateActiveBlock('title', e.target.value)}
            className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
            placeholder="Ex: A Oferta Termina Em:"
          />
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5">Dias:</label>
            <input
              type="text"
              value={b.days || '00'}
              onChange={(e) => onUpdateActiveBlock('days', e.target.value)}
              className="w-full p-1.5 bg-slate-800 border border-white/10 rounded text-center text-xs text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5">Horas:</label>
            <input
              type="text"
              value={b.hours || '00'}
              onChange={(e) => onUpdateActiveBlock('hours', e.target.value)}
              className="w-full p-1.5 bg-slate-800 border border-white/10 rounded text-center text-xs text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5">Minutos:</label>
            <input
              type="text"
              value={b.minutes || '00'}
              onChange={(e) => onUpdateActiveBlock('minutes', e.target.value)}
              className="w-full p-1.5 bg-slate-800 border border-white/10 rounded text-center text-xs text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5">Segundos:</label>
            <input
              type="text"
              value={b.seconds || '00'}
              onChange={(e) => onUpdateActiveBlock('seconds', e.target.value)}
              className="w-full p-1.5 bg-slate-800 border border-white/10 rounded text-center text-xs text-white font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Cor das Caixas:</label>
            <input
              type="color"
              value={b.bgColor || '#0f172a'}
              onChange={(e) => onUpdateActiveBlock('bgColor', e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Cor dos Números:</label>
            <input
              type="color"
              value={b.textColor || '#ffffff'}
              onChange={(e) => onUpdateActiveBlock('textColor', e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Cor Destaque:</label>
            <input
              type="color"
              value={b.accentColor || '#ef4444'}
              onChange={(e) => onUpdateActiveBlock('accentColor', e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
            />
          </div>
        </div>
      </div>
    );
  }

  if (b.type === 'callout') {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Título do Destaque (Opcional):</label>
          <input
            type="text"
            value={b.title || ''}
            onChange={(e) => onUpdateActiveBlock('title', e.target.value)}
            className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
            placeholder="Ex: Aviso Importante ou Depoimento"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Texto do Destaque:</label>
          <textarea
            rows={3}
            value={b.text || ''}
            onChange={(e) => onUpdateActiveBlock('text', e.target.value)}
            className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
            placeholder="Digite o conteúdo em destaque..."
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Autor / Fonte (Se for Depoimento):</label>
          <input
            type="text"
            value={b.author || ''}
            onChange={(e) => onUpdateActiveBlock('author', e.target.value)}
            className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
            placeholder="Ex: Maria Silva - Aluna da Mentoria"
          />
        </div>

        <div className="flex items-center gap-4 pt-1">
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Cor da Borda:</label>
            <input
              type="color"
              value={b.borderColor || '#3b82f6'}
              onChange={(e) => onUpdateActiveBlock('borderColor', e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Fundo do Box:</label>
            <input
              type="color"
              value={b.bgColor || '#f8fafc'}
              onChange={(e) => onUpdateActiveBlock('bgColor', e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
            />
          </div>
        </div>
      </div>
    );
  }

  if (b.type === 'product_card') {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Nome do Produto / Oferta:</label>
          <input
            type="text"
            value={b.productTitle || ''}
            onChange={(e) => onUpdateActiveBlock('productTitle', e.target.value)}
            className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Descrição Curta:</label>
          <textarea
            rows={2}
            value={b.productDesc || ''}
            onChange={(e) => onUpdateActiveBlock('productDesc', e.target.value)}
            className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">URL da Imagem do Produto:</label>
          <input
            type="text"
            value={b.imageUrl || ''}
            onChange={(e) => onUpdateActiveBlock('imageUrl', e.target.value)}
            placeholder="https://exemplo.com/produto.jpg"
            className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Preço Antigo (De):</label>
            <input
              type="text"
              value={b.originalPrice || ''}
              onChange={(e) => onUpdateActiveBlock('originalPrice', e.target.value)}
              placeholder="R$ 997,00"
              className="w-full p-1.5 bg-slate-800 border border-white/10 rounded text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Preço Oferta (Por):</label>
            <input
              type="text"
              value={b.discountPrice || ''}
              onChange={(e) => onUpdateActiveBlock('discountPrice', e.target.value)}
              placeholder="12x R$ 49,90"
              className="w-full p-1.5 bg-slate-800 border border-white/10 rounded text-xs text-white font-bold text-emerald-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Texto do Botão:</label>
          <input
            type="text"
            value={b.buttonText || ''}
            onChange={(e) => onUpdateActiveBlock('buttonText', e.target.value)}
            className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Link de Checkout / Compra:</label>
          <input
            type="text"
            value={b.buttonUrl || ''}
            onChange={(e) => onUpdateActiveBlock('buttonUrl', e.target.value)}
            placeholder="https://pay.hotmart.com/..."
            className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-[10px] text-gray-400 mb-1">Cor do Botão de Compra:</label>
          <input
            type="color"
            value={b.buttonBgColor || '#10b981'}
            onChange={(e) => onUpdateActiveBlock('buttonBgColor', e.target.value)}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
          />
        </div>
      </div>
    );
  }

  if (b.type === 'columns_3') {
    return (
      <div className="space-y-3">
        <div className="text-xs font-semibold text-blue-400 border-b border-white/10 pb-1">
          Coluna 1
        </div>
        <div className="grid grid-cols-4 gap-2">
          <input
            type="text"
            value={b.col1Icon || '⚡'}
            onChange={(e) => onUpdateActiveBlock('col1Icon', e.target.value)}
            className="p-1.5 bg-slate-800 border border-white/10 rounded text-center text-xs text-white"
            title="Ícone / Emoji"
          />
          <input
            type="text"
            value={b.col1Title || ''}
            onChange={(e) => onUpdateActiveBlock('col1Title', e.target.value)}
            className="col-span-3 p-1.5 bg-slate-800 border border-white/10 rounded text-xs text-white"
            placeholder="Título 1"
          />
        </div>
        <textarea
          rows={2}
          value={b.col1Text || ''}
          onChange={(e) => onUpdateActiveBlock('col1Text', e.target.value)}
          className="w-full p-1.5 bg-slate-800 border border-white/10 rounded text-xs text-white"
          placeholder="Descrição coluna 1..."
        />

        <div className="text-xs font-semibold text-blue-400 border-b border-white/10 pb-1 pt-2">
          Coluna 2
        </div>
        <div className="grid grid-cols-4 gap-2">
          <input
            type="text"
            value={b.col2Icon || '🛡️'}
            onChange={(e) => onUpdateActiveBlock('col2Icon', e.target.value)}
            className="p-1.5 bg-slate-800 border border-white/10 rounded text-center text-xs text-white"
          />
          <input
            type="text"
            value={b.col2Title || ''}
            onChange={(e) => onUpdateActiveBlock('col2Title', e.target.value)}
            className="col-span-3 p-1.5 bg-slate-800 border border-white/10 rounded text-xs text-white"
            placeholder="Título 2"
          />
        </div>
        <textarea
          rows={2}
          value={b.col2Text || ''}
          onChange={(e) => onUpdateActiveBlock('col2Text', e.target.value)}
          className="w-full p-1.5 bg-slate-800 border border-white/10 rounded text-xs text-white"
          placeholder="Descrição coluna 2..."
        />

        <div className="text-xs font-semibold text-blue-400 border-b border-white/10 pb-1 pt-2">
          Coluna 3
        </div>
        <div className="grid grid-cols-4 gap-2">
          <input
            type="text"
            value={b.col3Icon || '💬'}
            onChange={(e) => onUpdateActiveBlock('col3Icon', e.target.value)}
            className="p-1.5 bg-slate-800 border border-white/10 rounded text-center text-xs text-white"
          />
          <input
            type="text"
            value={b.col3Title || ''}
            onChange={(e) => onUpdateActiveBlock('col3Title', e.target.value)}
            className="col-span-3 p-1.5 bg-slate-800 border border-white/10 rounded text-xs text-white"
            placeholder="Título 3"
          />
        </div>
        <textarea
          rows={2}
          value={b.col3Text || ''}
          onChange={(e) => onUpdateActiveBlock('col3Text', e.target.value)}
          className="w-full p-1.5 bg-slate-800 border border-white/10 rounded text-xs text-white"
          placeholder="Descrição coluna 3..."
        />
      </div>
    );
  }

  if (b.type === 'signature') {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Nome do Especialista / Autor:</label>
          <input
            type="text"
            value={b.authorName || ''}
            onChange={(e) => onUpdateActiveBlock('authorName', e.target.value)}
            className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white font-bold"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Texto da Assinatura (Cursiva):</label>
          <input
            type="text"
            value={b.signatureText || ''}
            onChange={(e) => onUpdateActiveBlock('signatureText', e.target.value)}
            className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white italic"
            placeholder="Ex: Pedro Sobral"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Cargo / Especialidade:</label>
          <input
            type="text"
            value={b.authorRole || ''}
            onChange={(e) => onUpdateActiveBlock('authorRole', e.target.value)}
            className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
            placeholder="Ex: Fundador & Mentor de Tráfego"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Empresa / Projeto:</label>
          <input
            type="text"
            value={b.company || ''}
            onChange={(e) => onUpdateActiveBlock('company', e.target.value)}
            className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
            placeholder="Ex: Comunidade Sobral"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">URL da Foto / Avatar:</label>
          <input
            type="text"
            value={b.avatarUrl || ''}
            onChange={(e) => onUpdateActiveBlock('avatarUrl', e.target.value)}
            placeholder="https://exemplo.com/foto.jpg"
            className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
          />
        </div>
      </div>
    );
  }

  if (b.type === 'spacer') {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Altura do Espaço: <strong className="text-blue-400">{b.height || 24}px</strong>
          </label>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={b.height || 24}
            onChange={(e) => onUpdateActiveBlock('height', Number(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>
      </div>
    );
  }

  if (b.type === 'html_embed') {
    return (
      <div className="space-y-3">
        <div className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
          ⚠️ Insira trechos HTML válidos (tabelas, badges, texto formatado). Evite tags de script.
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Código HTML Puro:</label>
          <textarea
            rows={6}
            value={b.htmlCode || ''}
            onChange={(e) => onUpdateActiveBlock('htmlCode', e.target.value)}
            className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg font-mono text-[11px] text-emerald-300"
            placeholder="<table width='100%'>...</table>"
          />
        </div>
      </div>
    );
  }

  return null;
}

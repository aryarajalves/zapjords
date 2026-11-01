import React from 'react';

export default function EditorSocialSettings({ activeBlock, onUpdateActiveBlock }) {
  return (
    <>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Alinhamento:</label>
        <div className="flex gap-2">
          {['left', 'center', 'right'].map(align => (
            <button
              key={align}
              type="button"
              onClick={() => onUpdateActiveBlock('align', align)}
              className={`flex-1 py-1.5 text-xs rounded-lg font-semibold capitalize border ${
                activeBlock.align === align ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-white/10 text-gray-400'
              }`}
            >
              {align === 'left' ? 'Esquerda' : align === 'center' ? 'Centro' : 'Direita'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Formato dos Ícones:</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onUpdateActiveBlock('iconStyle', 'circle')}
            className={`flex-1 py-1.5 text-xs rounded-lg font-semibold border ${
              activeBlock.iconStyle === 'circle' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-white/10 text-gray-400'
            }`}
          >
            Círculo
          </button>
          <button
            type="button"
            onClick={() => onUpdateActiveBlock('iconStyle', 'square')}
            className={`flex-1 py-1.5 text-xs rounded-lg font-semibold border ${
              activeBlock.iconStyle === 'square' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-white/10 text-gray-400'
            }`}
          >
            Quadrado
          </button>
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-white/10">
        <div className="text-[11px] font-bold text-gray-400 uppercase">Redes Sociais & Links:</div>
        
        {/* Instagram */}
        <div>
          <label className="flex items-center gap-2 text-xs text-gray-300 mb-1">
            <input
              type="checkbox"
              checked={activeBlock.showInstagram !== false}
              onChange={e => onUpdateActiveBlock('showInstagram', e.target.checked)}
              className="rounded text-blue-500"
            />
            Instagram
          </label>
          {activeBlock.showInstagram !== false && (
            <input
              type="text"
              value={activeBlock.instagram || ''}
              onChange={e => onUpdateActiveBlock('instagram', e.target.value)}
              placeholder="https://instagram.com/seuperfil"
              className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
            />
          )}
        </div>

        {/* YouTube */}
        <div>
          <label className="flex items-center gap-2 text-xs text-gray-300 mb-1">
            <input
              type="checkbox"
              checked={activeBlock.showYoutube !== false}
              onChange={e => onUpdateActiveBlock('showYoutube', e.target.checked)}
              className="rounded text-blue-500"
            />
            YouTube
          </label>
          {activeBlock.showYoutube !== false && (
            <input
              type="text"
              value={activeBlock.youtube || ''}
              onChange={e => onUpdateActiveBlock('youtube', e.target.value)}
              placeholder="https://youtube.com/@seucanal"
              className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
            />
          )}
        </div>

        {/* Facebook */}
        <div>
          <label className="flex items-center gap-2 text-xs text-gray-300 mb-1">
            <input
              type="checkbox"
              checked={activeBlock.showFacebook !== false}
              onChange={e => onUpdateActiveBlock('showFacebook', e.target.checked)}
              className="rounded text-blue-500"
            />
            Facebook
          </label>
          {activeBlock.showFacebook !== false && (
            <input
              type="text"
              value={activeBlock.facebook || ''}
              onChange={e => onUpdateActiveBlock('facebook', e.target.value)}
              placeholder="https://facebook.com/suapagina"
              className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
            />
          )}
        </div>

        {/* Twitter / X */}
        <div>
          <label className="flex items-center gap-2 text-xs text-gray-300 mb-1">
            <input
              type="checkbox"
              checked={activeBlock.showTwitter !== false}
              onChange={e => onUpdateActiveBlock('showTwitter', e.target.checked)}
              className="rounded text-blue-500"
            />
            Twitter / X
          </label>
          {activeBlock.showTwitter !== false && (
            <input
              type="text"
              value={activeBlock.twitter || ''}
              onChange={e => onUpdateActiveBlock('twitter', e.target.value)}
              placeholder="https://x.com/seuperfil"
              className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
            />
          )}
        </div>

        {/* TikTok */}
        <div>
          <label className="flex items-center gap-2 text-xs text-gray-300 mb-1">
            <input
              type="checkbox"
              checked={activeBlock.showTiktok === true}
              onChange={e => onUpdateActiveBlock('showTiktok', e.target.checked)}
              className="rounded text-blue-500"
            />
            TikTok
          </label>
          {activeBlock.showTiktok === true && (
            <input
              type="text"
              value={activeBlock.tiktok || ''}
              onChange={e => onUpdateActiveBlock('tiktok', e.target.value)}
              placeholder="https://tiktok.com/@seuperfil"
              className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
            />
          )}
        </div>

        {/* Website */}
        <div>
          <label className="flex items-center gap-2 text-xs text-gray-300 mb-1">
            <input
              type="checkbox"
              checked={activeBlock.showWebsite !== false}
              onChange={e => onUpdateActiveBlock('showWebsite', e.target.checked)}
              className="rounded text-blue-500"
            />
            Website / Link
          </label>
          {activeBlock.showWebsite !== false && (
            <input
              type="text"
              value={activeBlock.website || ''}
              onChange={e => onUpdateActiveBlock('website', e.target.value)}
              placeholder="https://seusite.com.br"
              className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
            />
          )}
        </div>
      </div>
    </>
  );
}

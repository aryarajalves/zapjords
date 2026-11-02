import React from 'react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../../../../config';
import { useClient } from '../../../../../contexts/ClientContext';
import EditorTextSettings from './EditorTextSettings';
import EditorSocialSettings from './EditorSocialSettings';
import EditorListFooterSettings from './EditorListFooterSettings';
import EditorAdvancedBlockSettings from './EditorAdvancedBlockSettings';

export default function EditorRightSidebar({
  activeBlock,
  onUpdateActiveBlock,
  onOpenMaximizeModal
}) {
  const { activeClient } = useClient();

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const token = localStorage.getItem('token');
      const clientId = activeClient?.id || localStorage.getItem('activeClientId') || localStorage.getItem('client_id') || '1';
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      toast.loading("Enviando imagem...", { id: 'img-upload' });
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-Client-ID': String(clientId)
        },
        body: uploadFormData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erro no upload.");
      
      onUpdateActiveBlock('url', data.url);
      toast.success("Imagem enviada com sucesso!", { id: 'img-upload' });
    } catch (err) {
      toast.error(err.message || "Erro ao enviar imagem.", { id: 'img-upload' });
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const token = localStorage.getItem('token');
      const clientId = activeClient?.id || localStorage.getItem('activeClientId') || localStorage.getItem('client_id') || '1';
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      toast.loading("Enviando vídeo para o servidor...", { id: 'video-upload' });
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-Client-ID': String(clientId)
        },
        body: uploadFormData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erro no upload do vídeo.");
      
      onUpdateActiveBlock('url', data.url);
      if (!activeBlock.title || activeBlock.title === 'Assistir ao Vídeo Exclusivo') {
        onUpdateActiveBlock('title', file.name);
      }
      toast.success("Vídeo enviado e player atualizado!", { id: 'video-upload' });
    } catch (err) {
      toast.error(err.message || "Erro ao enviar vídeo.", { id: 'video-upload' });
    }
  };

  return (
    <div className="w-full lg:w-72 bg-slate-900 border-l border-white/10 p-4 shrink-0 overflow-y-auto">
      <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3 flex items-center justify-between">
        <span>Configuração do Bloco</span>
        <span className="text-[10px] text-gray-500 font-normal">{activeBlock?.type}</span>
      </div>

      {activeBlock ? (
        <div className="space-y-4">
          {activeBlock.type === 'text' && (
            <EditorTextSettings
              activeBlock={activeBlock}
              onUpdateActiveBlock={onUpdateActiveBlock}
              onOpenMaximizeModal={onOpenMaximizeModal}
            />
          )}

          {activeBlock.type === 'button' && (
            <>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Texto do Botão:</label>
                <input
                  type="text" value={activeBlock.text}
                  onChange={e => onUpdateActiveBlock('text', e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Link de Destino (URL):</label>
                <input
                  type="text" value={activeBlock.url}
                  onChange={e => onUpdateActiveBlock('url', e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Cor do Botão:</label>
                <input
                  type="color" value={activeBlock.bgColor}
                  onChange={e => onUpdateActiveBlock('bgColor', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                />
              </div>
            </>
          )}

          {activeBlock.type === 'image' && (
            <>
              <div className="space-y-2">
                <label className="block text-xs text-gray-400">Upload de Imagem (do computador):</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-xs text-gray-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-white/10">
                <label className="block text-xs text-gray-400 mb-1">OU URL Pública da Imagem:</label>
                <input
                  type="text" value={activeBlock.url}
                  onChange={e => onUpdateActiveBlock('url', e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
                />
              </div>

              {activeBlock.url && (
                <div className="pt-3 border-t border-white/10 space-y-2" data-testid="image-preview-panel">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-medium text-gray-300">Prévia da Mídia:</span>
                    <span className="text-[10px] text-emerald-400 font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      Carregada
                    </span>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-950/70 p-2 flex items-center justify-center min-h-[90px]">
                    <img
                      src={activeBlock.url}
                      alt="Pré-visualização da imagem"
                      data-testid="sidebar-image-preview"
                      className="w-full h-auto max-h-44 object-contain rounded-lg shadow-sm"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22150%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20150%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%2394a3b8%3Bfont-weight%3Abold%3Bfont-family%3Asans-serif%3Bfont-size%3A14pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22300%22%20height%3D%22150%22%20fill%3D%22%231e293b%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2260%22%20y%3D%2280%22%3EPr%C3%A9via%20da%20Imagem%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E";
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {activeBlock.type === 'columns_2' && (
            <>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Texto Coluna 1:</label>
                <textarea
                  rows={3} value={activeBlock.col1Text}
                  onChange={e => onUpdateActiveBlock('col1Text', e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Texto Coluna 2:</label>
                <textarea
                  rows={3} value={activeBlock.col2Text}
                  onChange={e => onUpdateActiveBlock('col2Text', e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
                />
              </div>
            </>
          )}

          {activeBlock.type === 'divider' && (
            <>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Espessura da Linha (Tamanho): {activeBlock.thickness || 1}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={activeBlock.thickness || 1}
                  onChange={e => onUpdateActiveBlock('thickness', Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Cor da Linha do Divisor:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={activeBlock.color || '#e2e8f0'}
                    onChange={e => onUpdateActiveBlock('color', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={activeBlock.color || '#e2e8f0'}
                    onChange={e => onUpdateActiveBlock('color', e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Espaçamento Vertical (Margem): {activeBlock.margin || 20}px
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={activeBlock.margin || 20}
                  onChange={e => onUpdateActiveBlock('margin', Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </>
          )}

          {activeBlock.type === 'video' && (
            <>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-300">Upload de Vídeo (do computador):</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="w-full text-xs text-gray-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-white/10">
                <label className="block text-xs text-gray-400 mb-1">OU URL Pública / Link do Vídeo:</label>
                <input
                  type="text"
                  value={activeBlock.url || ''}
                  onChange={e => onUpdateActiveBlock('url', e.target.value)}
                  placeholder="https://exemplo.com/meu-video.mp4"
                  className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Título / Legenda do Vídeo:</label>
                <input
                  type="text"
                  value={activeBlock.title || ''}
                  onChange={e => onUpdateActiveBlock('title', e.target.value)}
                  placeholder="Ex: Assistir ao Vídeo Exclusivo"
                  className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
                />
              </div>

              {activeBlock.url && (
                <div className="pt-3 border-t border-white/10 space-y-2" data-testid="video-preview-panel">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-medium text-gray-300">Prévia do Vídeo:</span>
                    <span className="text-[10px] text-blue-400 font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                      Player
                    </span>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-950/70 p-1">
                    <video
                      src={activeBlock.url}
                      controls
                      data-testid="sidebar-video-preview"
                      className="w-full max-h-44 rounded-lg bg-black object-contain"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {activeBlock.type === 'list' && (
            <EditorListFooterSettings activeBlock={activeBlock} onUpdateActiveBlock={onUpdateActiveBlock} />
          )}

          {activeBlock.type === 'social' && (
            <EditorSocialSettings activeBlock={activeBlock} onUpdateActiveBlock={onUpdateActiveBlock} />
          )}

          {activeBlock.type === 'footer' && (
            <EditorListFooterSettings activeBlock={activeBlock} onUpdateActiveBlock={onUpdateActiveBlock} />
          )}

          {/* Configurações dos Novos Blocos Avançados */}
          {['countdown', 'callout', 'product_card', 'columns_3', 'signature', 'spacer', 'html_embed'].includes(activeBlock.type) && (
            <EditorAdvancedBlockSettings activeBlock={activeBlock} onUpdateActiveBlock={onUpdateActiveBlock} />
          )}
        </div>
      ) : (
        <div className="text-xs text-gray-500 text-center py-8">
          Clique em qualquer bloco do e-mail para editar suas propriedades.
        </div>
      )}
    </div>
  );
}

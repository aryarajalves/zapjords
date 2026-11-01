import React from 'react';
import { FiArrowUp, FiArrowDown, FiTrash2, FiVideo } from 'react-icons/fi';

export default function EditorCanvas({
  blocks,
  activeBlockId,
  setActiveBlockId,
  onMoveBlock,
  onDeleteBlock,
  globalStyles
}) {
  return (
    <div 
      className="flex-1 p-6 overflow-y-auto flex justify-center transition-all"
      style={{ backgroundColor: globalStyles.outerBgColor }}
    >
      <div 
        className="w-full rounded-2xl shadow-2xl transition-all relative border border-black/10 self-start"
        style={{ 
          maxWidth: `${globalStyles.cardWidth}px`, 
          backgroundColor: globalStyles.cardBgColor,
          padding: `${globalStyles.padding}px`
        }}
      >
        {blocks.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl text-gray-400">
            Solte os blocos aqui para montar seu e-mail.
          </div>
        ) : (
          blocks.map((b, index) => {
            const isActive = b.id === activeBlockId;
            return (
              <div
                key={b.id}
                onClick={() => setActiveBlockId(b.id)}
                className={`relative group rounded-xl transition-all cursor-pointer mb-3 p-2 border-2 ${
                  isActive ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10' : 'border-transparent hover:border-gray-300/50'
                }`}
              >
                {/* Barra Flutuante de Ações do Bloco */}
                {isActive && (
                  <div className="absolute -top-3 right-2 bg-blue-600 text-white rounded-lg px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 shadow-lg z-20">
                    <button type="button" onClick={(e) => { e.stopPropagation(); onMoveBlock(index, -1); }} title="Mover para Cima">
                      <FiArrowUp />
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onMoveBlock(index, 1); }} title="Mover para Baixo">
                      <FiArrowDown />
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onDeleteBlock(b.id); }} className="text-red-300 hover:text-white" title="Excluir Bloco">
                      <FiTrash2 />
                    </button>
                  </div>
                )}

                {/* Renderização do Bloco */}
                {b.type === 'text' && (
                  <div style={{ color: b.color, fontSize: `${b.fontSize}px`, textAlign: b.textAlign, whiteSpace: 'pre-wrap' }}>
                    {b.content}
                  </div>
                )}

                {b.type === 'image' && (
                  <div style={{ textAlign: b.align }}>
                    <img src={b.url} alt={b.alt} style={{ maxWidth: '100%', borderRadius: `${b.borderRadius}px`, display: 'inline-block' }} />
                  </div>
                )}

                {b.type === 'button' && (
                  <div style={{ textAlign: b.align }}>
                    <span style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: b.bgColor, color: b.textColor, borderRadius: `${b.borderRadius}px`, fontWeight: 'bold' }}>
                      {b.text}
                    </span>
                  </div>
                )}

                {b.type === 'columns_2' && (
                  <div className="grid grid-cols-2 gap-4 text-slate-800 text-xs">
                    <div className="p-2 border border-dashed border-gray-300 rounded">{b.col1Text}</div>
                    <div className="p-2 border border-dashed border-gray-300 rounded">{b.col2Text}</div>
                  </div>
                )}

                {b.type === 'divider' && (
                  <hr style={{ border: 0, borderTop: `${b.thickness}px solid ${b.color}`, margin: `${b.margin}px 0` }} />
                )}

                {b.type === 'list' && (
                  <div style={{ color: b.color || '#334155', fontSize: `${b.fontSize || 15}px` }}>
                    <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: b.styleType === 'number' ? 'decimal' : 'none' }}>
                      {(b.items || []).map((item, i) => (
                        <li key={i} style={{ marginBottom: `${b.spacing || 8}px`, display: b.styleType === 'number' ? 'list-item' : 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          {b.styleType === 'bullet' && <span style={{ color: b.bulletColor || '#3b82f6', fontWeight: 'bold' }}>•</span>}
                          {b.styleType === 'arrow' && <span style={{ color: b.bulletColor || '#3b82f6', fontWeight: 'bold' }}>→</span>}
                          {b.styleType === 'check' && <span style={{ color: b.bulletColor || '#10b981', fontWeight: 'bold' }}>✓</span>}
                          <span style={{ flex: 1 }}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {b.type === 'social' && (
                  <div style={{ textAlign: b.align || 'center', padding: '10px 0' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      {b.showFacebook && (
                        <span style={{ display: 'inline-block', width: '36px', height: '36px', lineHeight: '36px', textAlign: 'center', backgroundColor: '#1877f2', color: '#fff', borderRadius: b.iconStyle === 'circle' ? '50%' : '8px', fontWeight: 'bold', fontSize: '14px' }}>f</span>
                      )}
                      {b.showInstagram && (
                        <span style={{ display: 'inline-block', width: '36px', height: '36px', lineHeight: '36px', textAlign: 'center', background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', color: '#fff', borderRadius: b.iconStyle === 'circle' ? '50%' : '8px', fontWeight: 'bold', fontSize: '13px' }}>ig</span>
                      )}
                      {b.showYoutube && (
                        <span style={{ display: 'inline-block', width: '36px', height: '36px', lineHeight: '36px', textAlign: 'center', backgroundColor: '#ff0000', color: '#fff', borderRadius: b.iconStyle === 'circle' ? '50%' : '8px', fontWeight: 'bold', fontSize: '12px' }}>yt</span>
                      )}
                      {b.showTwitter && (
                        <span style={{ display: 'inline-block', width: '36px', height: '36px', lineHeight: '36px', textAlign: 'center', backgroundColor: '#0f1419', color: '#fff', borderRadius: b.iconStyle === 'circle' ? '50%' : '8px', fontWeight: 'bold', fontSize: '13px' }}>𝕏</span>
                      )}
                      {b.showTiktok && (
                        <span style={{ display: 'inline-block', width: '36px', height: '36px', lineHeight: '36px', textAlign: 'center', backgroundColor: '#000000', color: '#fff', borderRadius: b.iconStyle === 'circle' ? '50%' : '8px', fontWeight: 'bold', fontSize: '12px' }}>tt</span>
                      )}
                      {b.showWebsite && (
                        <span style={{ display: 'inline-block', width: '36px', height: '36px', lineHeight: '36px', textAlign: 'center', backgroundColor: '#2563eb', color: '#fff', borderRadius: b.iconStyle === 'circle' ? '50%' : '8px', fontWeight: 'bold', fontSize: '14px' }}>🌐</span>
                      )}
                    </div>
                  </div>
                )}

                {b.type === 'footer' && (
                  <div style={{ textAlign: b.align || 'center', color: b.color || '#64748b', fontSize: `${b.fontSize || 11}px`, lineHeight: 1.5, borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '16px' }}>
                    {b.companyName && <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{b.companyName}</div>}
                    {b.address && <div style={{ marginBottom: '6px' }}>{b.address}</div>}
                    {b.customText && <div style={{ marginBottom: '6px', fontStyle: 'italic' }}>{b.customText}</div>}
                    <div style={{ marginTop: '6px', fontSize: '10px' }}>
                      Enviado para: <span style={{ textDecoration: 'underline' }}>{b.recipientEmail || '{{email}}'}</span>
                      {' • '}
                      <span style={{ color: '#2563eb', textDecoration: 'underline' }}>Cancelar inscrição</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

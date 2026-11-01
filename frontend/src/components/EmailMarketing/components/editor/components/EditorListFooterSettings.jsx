import React from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

export default function EditorListFooterSettings({ activeBlock, onUpdateActiveBlock }) {
  if (activeBlock.type === 'list') {
    const handleItemChange = (index, val) => {
      const items = [...(activeBlock.items || [])];
      items[index] = val;
      onUpdateActiveBlock('items', items);
    };

    const handleAddItem = () => {
      const items = [...(activeBlock.items || []), 'Novo item da lista...'];
      onUpdateActiveBlock('items', items);
    };

    const handleRemoveItem = (index) => {
      const items = (activeBlock.items || []).filter((_, i) => i !== index);
      onUpdateActiveBlock('items', items);
    };

    return (
      <>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Estilo do Marcador:</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'bullet', label: '• Ponto' },
              { id: 'arrow', label: '→ Seta' },
              { id: 'check', label: '✓ Check' },
              { id: 'number', label: '1. Número' }
            ].map(st => (
              <button
                key={st.id}
                type="button"
                onClick={() => onUpdateActiveBlock('styleType', st.id)}
                className={`py-1.5 px-2 text-xs rounded-lg font-semibold border ${
                  activeBlock.styleType === st.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-white/10 text-gray-400'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Tamanho da Fonte: {activeBlock.fontSize || 15}px</label>
          <input
            type="range"
            min="12"
            max="24"
            value={activeBlock.fontSize || 15}
            onChange={e => onUpdateActiveBlock('fontSize', Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Cor do Texto e Marcadores:</label>
          <div className="flex gap-4">
            <div>
              <span className="text-[10px] text-gray-500 block mb-1">Texto</span>
              <input
                type="color"
                value={activeBlock.color || '#334155'}
                onChange={e => onUpdateActiveBlock('color', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block mb-1">Marcador</span>
              <input
                type="color"
                value={activeBlock.bulletColor || '#3b82f6'}
                onChange={e => onUpdateActiveBlock('bulletColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-300 font-bold">
            <span>Itens da Lista:</span>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <FiPlus size={12} /> Adicionar
            </button>
          </div>
          {(activeBlock.items || []).map((item, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <input
                type="text"
                value={item}
                onChange={e => handleItemChange(index, e.target.value)}
                className="flex-1 p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
              />
              <button
                type="button"
                onClick={() => handleRemoveItem(index)}
                className="p-1.5 text-red-400 hover:text-red-300"
                title="Excluir item"
              >
                <FiTrash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (activeBlock.type === 'footer') {
    return (
      <>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Nome da Empresa / Emissor:</label>
          <input
            type="text"
            value={activeBlock.companyName || ''}
            onChange={e => onUpdateActiveBlock('companyName', e.target.value)}
            placeholder="Ex: Minha Empresa LTDA"
            className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Endereço Físico / CNPJ (Compliance):</label>
          <textarea
            rows={2}
            value={activeBlock.address || ''}
            onChange={e => onUpdateActiveBlock('address', e.target.value)}
            placeholder="Ex: Av. Paulista, 1000 - São Paulo, SP"
            className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Texto Institucional / Motivo do Envio:</label>
          <textarea
            rows={2}
            value={activeBlock.customText || ''}
            onChange={e => onUpdateActiveBlock('customText', e.target.value)}
            placeholder="Ex: Você recebeu este e-mail porque se cadastrou em nossa lista VIP."
            className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Link de Descadastro (Unsubscribe):</label>
          <input
            type="text"
            value={activeBlock.unsubscribeUrl || '{{unsubscribe_url}}'}
            onChange={e => onUpdateActiveBlock('unsubscribeUrl', e.target.value)}
            className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Alinhamento:</label>
          <div className="flex gap-2">
            {['left', 'center', 'right'].map(align => (
              <button
                key={align}
                type="button"
                onClick={() => onUpdateActiveBlock('align', align)}
                className={`flex-1 py-1 text-xs rounded-lg font-semibold capitalize border ${
                  (activeBlock.align || 'center') === align ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-white/10 text-gray-400'
                }`}
              >
                {align === 'left' ? 'Esquerda' : align === 'center' ? 'Centro' : 'Direita'}
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }

  return null;
}

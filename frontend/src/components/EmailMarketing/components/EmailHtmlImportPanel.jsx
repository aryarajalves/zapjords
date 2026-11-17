import React, { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiUpload, FiCode, FiEye, FiCopy, FiZap } from 'react-icons/fi';
import { CONTACT_VARIABLES } from '../EmailDragDropEditor';

export default function EmailHtmlImportPanel({ bodyHtml, onChangeHtml }) {
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const [showPreview, setShowPreview] = useState(true);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string' && content.trim()) {
        onChangeHtml(content);
        toast.success(`Arquivo "${file.name}" importado com sucesso!`);
      } else {
        toast.error('O arquivo selecionado está vazio.');
      }
    };
    reader.onerror = () => {
      toast.error('Erro ao ler o arquivo HTML.');
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handleInsertVariable = (varToken) => {
    const token = varToken.startsWith('{{') ? varToken : `{{${varToken}}}`;
    const textarea = textareaRef.current;

    if (!textarea) {
      onChangeHtml(`${bodyHtml || ''}${token}`);
      return;
    }

    const savedScrollTop = textarea.scrollTop;
    const start = textarea.selectionStart ?? (bodyHtml || '').length;
    const end = textarea.selectionEnd ?? (bodyHtml || '').length;
    const current = bodyHtml || '';
    const updated = current.slice(0, start) + token + current.slice(end);
    onChangeHtml(updated);

    requestAnimationFrame(() => {
      textarea.focus({ preventScroll: true });
      const nextPos = start + token.length;
      textarea.setSelectionRange(nextPos, nextPos);
      textarea.scrollTop = savedScrollTop;
    });
  };

  const handleCopyHtml = async () => {
    if (!bodyHtml?.trim()) {
      toast.error('Não há código HTML para copiar.');
      return;
    }
    try {
      await navigator.clipboard.writeText(bodyHtml);
      toast.success('Código HTML copiado!');
    } catch {
      toast.error('Não foi possível copiar o HTML.');
    }
  };

  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-950 text-white">
      {/* Barra de Ferramentas */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm,text/html"
            onChange={handleFileUpload}
            className="hidden"
            data-testid="html-file-input"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
          >
            <FiUpload size={13} /> Importar arquivo .html
          </button>
          <button
            type="button"
            onClick={handleCopyHtml}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-700"
          >
            <FiCopy size={13} /> Copiar HTML
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowPreview((prev) => !prev)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
            showPreview
              ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
              : 'bg-slate-800 text-gray-300 border-slate-700 hover:text-white'
          }`}
        >
          <FiEye size={13} /> {showPreview ? 'Ocultar Preview' : 'Mostrar Preview'}
        </button>
      </div>

      {/* Variáveis Dinâmicas */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 bg-slate-900/60 border-b border-slate-800">
        <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 mr-1">
          <FiZap size={12} /> Variáveis:
        </span>
        {CONTACT_VARIABLES.map((v) => {
          const codeText = v.code || `{{${v.key}}}`;
          return (
            <button
              key={codeText}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleInsertVariable(codeText)}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-gray-200 border border-slate-700 rounded-md text-[11px] font-mono transition-colors"
              title={v.label}
            >
              {codeText}
            </button>
          );
        })}
      </div>

      {/* Área Código + Preview */}
      <div className={`grid grid-cols-1 ${showPreview ? 'lg:grid-cols-2' : ''} min-h-[420px]`}>
        <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800">
          <div className="px-3 py-1.5 bg-slate-900/40 border-b border-slate-800 text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
            <FiCode size={12} className="text-blue-400" /> Código HTML
          </div>
          <textarea
            ref={textareaRef}
            value={bodyHtml || ''}
            onChange={(e) => onChangeHtml(e.target.value)}
            placeholder="Cole aqui o código HTML do seu e-mail ou clique em 'Importar arquivo .html'..."
            spellCheck={false}
            className="w-full flex-1 min-h-[380px] p-4 bg-slate-950 text-emerald-300 font-mono text-xs leading-relaxed resize-none focus:outline-none"
          />
        </div>

        {showPreview && (
          <div className="flex flex-col bg-slate-900/30">
            <div className="px-3 py-1.5 bg-slate-900/40 border-b border-slate-800 text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
              <FiEye size={12} className="text-purple-400" /> Preview ao Vivo
            </div>
            {bodyHtml?.trim() ? (
              <iframe
                title="Preview do E-mail HTML"
                srcDoc={bodyHtml}
                sandbox=""
                className="w-full flex-1 min-h-[380px] bg-white border-0"
              />
            ) : (
              <div className="flex-1 min-h-[380px] flex items-center justify-center p-6 text-center text-xs text-gray-500">
                Cole um código HTML ao lado ou importe um arquivo .html para visualizar o resultado aqui.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

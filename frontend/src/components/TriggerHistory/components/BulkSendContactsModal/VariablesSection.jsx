import React from 'react';
import MediaHeaderUploader from '../../../BulkSender/common/MediaHeaderUploader';

export default function VariablesSection({ variables, templateParams, handleParamChange }) {
  if (!variables || variables.length === 0) return null;

  return (
    <div className="space-y-4 border-t border-slate-800/60 pt-4">
      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
        Preencha as Variáveis
      </h4>
      {variables.map(v => {
        if (v.isMedia) {
          return (
            <MediaHeaderUploader
              key={v.key}
              format={v.format}
              templateParams={templateParams}
              handleParamChange={handleParamChange}
            />
          );
        }
        const currentVal = templateParams[v.key] || '';
        const isPrimeiroNome = currentVal === '{{primeiro_nome}}';
        const isNome = currentVal === '{{nome}}';
        const isTelefone = currentVal === '{{telefone}}';

        return (
          <div key={v.key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {v.label}
              </label>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleParamChange(v.key, '{{primeiro_nome}}')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border transition-all ${
                    isPrimeiroNome
                      ? 'bg-teal-500/25 text-teal-200 border-teal-400 shadow-sm shadow-teal-900/40 font-bold'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-teal-300 border-teal-500/30 hover:border-teal-400'
                  }`}
                  title="Substituir pelo primeiro nome do contato"
                >
                  +primeiro_nome
                </button>
                <button
                  type="button"
                  onClick={() => handleParamChange(v.key, '{{nome}}')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border transition-all ${
                    isNome
                      ? 'bg-slate-700 text-white border-white/40 shadow-sm font-bold'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-white/10 hover:border-slate-400'
                  }`}
                  title="Substituir pelo nome completo do contato"
                >
                  +nome
                </button>
                <button
                  type="button"
                  onClick={() => handleParamChange(v.key, '{{telefone}}')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border transition-all ${
                    isTelefone
                      ? 'bg-slate-700 text-white border-white/40 shadow-sm font-bold'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-white/10 hover:border-slate-400'
                  }`}
                  title="Substituir pelo telefone do contato"
                >
                  +telefone
                </button>
              </div>
            </div>
            <input
              type="text"
              className="w-full p-3 bg-black/40 border border-slate-800 rounded-2xl focus:border-blue-500/50 outline-none text-white text-xs font-bold transition-all shadow-inner placeholder:text-slate-700"
              placeholder={`Digite o valor para ${v.label}`}
              value={currentVal}
              onChange={(e) => handleParamChange(v.key, e.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
}

import React from 'react';
import { FiFileText, FiCheckCircle, FiInfo } from 'react-icons/fi';

/**
 * BulkTemplateVariablesInputs
 * Exibe a identificação clara de variáveis do template e permite definir seus valores.
 */
export default function BulkTemplateVariablesInputs({
    headerVars = [],
    bodyVars = [],
    templateParams = {},
    setTemplateParams
}) {
    const totalVars = headerVars.length + bodyVars.length;

    const handleParamChange = (key, value) => {
        setTemplateParams(prev => ({ ...prev, [key]: value }));
    };

    const handleSetQuickTag = (key, tag) => {
        // Substitui completamente o valor do campo pela variável selecionada (sem concatenar)
        setTemplateParams(prev => ({
            ...prev,
            [key]: tag
        }));
    };

    if (totalVars === 0) {
        return (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2.5 text-emerald-300 text-xs">
                <FiCheckCircle className="text-emerald-400 shrink-0" size={16} />
                <span>
                    <strong>Variáveis:</strong> Este template não requer variáveis de texto adicionais.
                </span>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/60 rounded-xl p-4 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                    <FiFileText className="text-emerald-400" />
                    <span>Variáveis do Template</span>
                </label>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium">
                    {totalVars} {totalVars === 1 ? 'variável encontrada' : 'variáveis encontradas'}
                </span>
            </div>

            <p className="text-[11px] text-slate-400">
                Defina o valor de cada variável ou utilize os atalhos rápidos dinâmicos:
            </p>

            <div className="space-y-3 pt-1">
                {/* Variáveis do Header de Texto se houver */}
                {headerVars.map(num => {
                    const key = `HEADER_${num - 1}`;
                    const val = templateParams[key] || '';
                    return (
                        <VariableItem
                            key={`header-${num}`}
                            label={`Cabeçalho {{${num}}}`}
                            paramKey={key}
                            value={val}
                            onChange={(v) => handleParamChange(key, v)}
                            onSetTag={(tag) => handleSetQuickTag(key, tag)}
                        />
                    );
                })}

                {/* Variáveis do Corpo */}
                {bodyVars.map(num => {
                    const key = `BODY_${num - 1}`;
                    const val = templateParams[key] || '';
                    return (
                        <VariableItem
                            key={`body-${num}`}
                            label={`Corpo {{${num}}}`}
                            paramKey={key}
                            value={val}
                            onChange={(v) => handleParamChange(key, v)}
                            onSetTag={(tag) => handleSetQuickTag(key, tag)}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function VariableItem({ label, paramKey, value, onChange, onSetTag }) {
    const isPrimeiroNome = value === '{{primeiro_nome}}';
    const isNome = value === '{{nome}}';
    const isTelefone = value === '{{telefone}}';
    const isProduto = value === '{{produto}}';
    const isValor = value === '{{valor}}';

    return (
        <div className="space-y-1.5 bg-slate-950/40 p-2.5 rounded-lg border border-white/5">
            <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-mono text-emerald-400 font-bold">{label}</span>
                <div className="flex items-center gap-1 flex-wrap">
                    <button
                        type="button"
                        onClick={() => onSetTag('{{primeiro_nome}}')}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                            isPrimeiroNome
                                ? 'bg-teal-500/25 text-teal-200 border-teal-400 shadow-sm shadow-teal-900/40 font-bold'
                                : 'bg-slate-800 hover:bg-slate-700 text-teal-300 border-teal-500/30 hover:border-teal-400'
                        }`}
                        title="Substituir por primeiro nome do contato"
                    >
                        +primeiro_nome
                    </button>
                    <button
                        type="button"
                        onClick={() => onSetTag('{{nome}}')}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                            isNome
                                ? 'bg-slate-700 text-white border-white/40 shadow-sm font-bold'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/10 hover:border-slate-400'
                        }`}
                        title="Substituir por nome completo do contato"
                    >
                        +nome
                    </button>
                    <button
                        type="button"
                        onClick={() => onSetTag('{{telefone}}')}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                            isTelefone
                                ? 'bg-slate-700 text-white border-white/40 shadow-sm font-bold'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/10 hover:border-slate-400'
                        }`}
                        title="Substituir por telefone do contato"
                    >
                        +telefone
                    </button>
                    <button
                        type="button"
                        onClick={() => onSetTag('{{produto}}')}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                            isProduto
                                ? 'bg-amber-500/25 text-amber-200 border-amber-400 shadow-sm font-bold'
                                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/30 hover:border-amber-400'
                        }`}
                        title="Substituir por produto da oportunidade (Kanban)"
                    >
                        +produto
                    </button>
                    <button
                        type="button"
                        onClick={() => onSetTag('{{valor}}')}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                            isValor
                                ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400 shadow-sm font-bold'
                                : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-emerald-500/30 hover:border-emerald-400'
                        }`}
                        title="Substituir por valor da oportunidade (Kanban)"
                    >
                        +valor
                    </button>
                </div>
            </div>
            <input
                type="text"
                placeholder={`Valor para ${label} (ex: {{primeiro_nome}} ou texto fixo)`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950/80 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
        </div>
    );
}

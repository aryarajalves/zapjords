import React, { useState } from 'react';
import { FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { VAR_OPTIONS } from '../utils';

export default function TemplateVariablesSection({
    templateVariables = [],
    variables = {},
    setVariables,
    activeDropdown,
    setActiveDropdown,
    accentColor = "indigo"
}) {
    const [expandedVars, setExpandedVars] = useState({});

    if (!templateVariables || templateVariables.length === 0) {
        return null;
    }

    const isRedTheme = accentColor === 'red';
    const accentText = isRedTheme ? 'text-red-400' : 'text-indigo-400';
    const accentBorderFocus = isRedTheme ? 'focus:border-red-500/50' : 'focus:border-indigo-500/50';
    const accentBgBadge = isRedTheme ? 'text-red-400/80' : 'text-indigo-400/80';
    const activeBtnClass = isRedTheme ? 'bg-red-500 text-white' : 'bg-indigo-500 text-white';

    return (
        <div className="space-y-4 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between px-1">
                <div className="space-y-0.5">
                    <h4 className={`text-[10px] font-black uppercase tracking-widest ${accentText}`}>Variáveis do Template</h4>
                    <p className="text-[8px] text-slate-500 font-bold uppercase">Configure os valores para este disparo</p>
                </div>
                <div className="text-[8px] font-black text-slate-600 bg-slate-800/50 px-2 py-1 rounded border border-white/5 uppercase tracking-widest">
                    Dica: Use {"{{nome}}"} ou {"{{telefone}}"}
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {templateVariables.map(v => (
                    <div key={v.key} className="space-y-2 group/var relative">
                        <div className="flex items-center justify-between ml-1">
                            <label className={`text-[9px] font-black text-slate-500 uppercase tracking-wider group-focus-within/var:${accentText} transition-colors`}>{v.label}</label>
                            <span className="text-[8px] text-slate-600 font-bold">
                                {variables[v.key] && !variables[v.key].includes('{{')
                                    ? <span className="text-amber-400/70">✏️ Valor fixo</span>
                                    : variables[v.key]
                                        ? <span className={accentBgBadge}>⚡ Dinâmico</span>
                                        : null
                                }
                            </span>
                        </div>
                        <div className="relative">
                            {expandedVars[v.key] ? (
                                <textarea
                                    rows={6}
                                    className={`w-full p-4 pr-12 bg-black/40 border border-white/5 rounded-2xl ${accentBorderFocus} outline-none text-white text-xs transition-all shadow-inner placeholder:text-slate-700 font-bold resize-y`}
                                    placeholder={`Valor para ${v.label}... (Texto fixo ou {{nome}} dinâmico)`}
                                    value={variables[v.key] || ''}
                                    onChange={(e) => setVariables(prev => ({ ...prev, [v.key]: e.target.value }))}
                                />
                            ) : (
                                <input
                                    type="text"
                                    className={`w-full p-4 pr-20 bg-black/40 border border-white/5 rounded-2xl ${accentBorderFocus} outline-none text-white text-xs transition-all shadow-inner placeholder:text-slate-700 font-bold`}
                                    placeholder={`Valor para ${v.label}... (Texto fixo ou {{nome}} dinâmico)`}
                                    value={variables[v.key] || ''}
                                    onChange={(e) => setVariables(prev => ({ ...prev, [v.key]: e.target.value }))}
                                />
                            )}
                            <div className={`absolute right-3 flex items-center gap-1 ${expandedVars[v.key] ? 'top-3' : 'top-1/2 -translate-y-1/2'}`}>
                                <button
                                    type="button"
                                    onClick={() => setExpandedVars(prev => ({ ...prev, [v.key]: !prev[v.key] }))}
                                    className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-blue-400 border border-white/5 transition-all cursor-pointer"
                                    title={expandedVars[v.key] ? 'Minimizar' : 'Expandir para texto longo'}
                                >
                                    {expandedVars[v.key] ? <FiMinimize2 size={12} /> : <FiMaximize2 size={12} />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveDropdown(activeDropdown === v.key ? null : v.key)}
                                    className={`p-2 rounded-xl transition-all cursor-pointer ${activeDropdown === v.key ? `${activeBtnClass} shadow-lg` : 'bg-slate-800 text-slate-400 hover:text-white border border-white/5'}`}
                                    title="Campos Mágicos"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Magic Dropdown */}
                        {activeDropdown === v.key && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)}></div>
                                <div className="absolute left-0 right-0 top-full mt-2 z-[60] bg-slate-900 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-3 bg-slate-800/50 border-b border-white/5 text-[8px] font-black text-slate-500 uppercase tracking-widest text-center">Campos Disponíveis do Lead</div>
                                    <div className="grid grid-cols-1 divide-y divide-white/5 max-h-64 overflow-y-auto premium-scrollbar">
                                        {VAR_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => {
                                                    setVariables(prev => ({ ...prev, [v.key]: opt.value }));
                                                    setActiveDropdown(null);
                                                }}
                                                className={`flex items-center gap-3 p-3 text-left transition-colors group/opt cursor-pointer ${isRedTheme ? 'hover:bg-red-500/10' : 'hover:bg-indigo-500/10'}`}
                                            >
                                                <span className="text-sm">{opt.icon}</span>
                                                <div className="flex-1">
                                                    <div className="text-[10px] font-black text-slate-200 uppercase tracking-wide group-hover/opt:text-white transition-colors">{opt.label}</div>
                                                    <div className="text-[8px] font-bold text-slate-600 font-mono">{opt.value}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

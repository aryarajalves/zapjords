import React from 'react';
import { FiZap, FiSlash, FiMinus } from 'react-icons/fi';
import SearchableFunnelSelect from '../../../../components/BulkSender/steps/SearchableFunnelSelect';

const TYPE_OPTIONS = [
    { value: 'none', label: 'Nenhum', icon: FiMinus, color: 'slate' },
    { value: 'interaction', label: 'Interação (👆)', icon: FiZap, color: 'emerald' },
    { value: 'block', label: 'Bloqueio (🚫)', icon: FiSlash, color: 'rose' },
];

const COLOR = {
    slate: { ring: 'ring-slate-500/30', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
    emerald: { ring: 'ring-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    rose: { ring: 'ring-rose-500/30', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
};

export default function BulkTemplateButtonsConfig({
    templateButtons = [],
    buttonActions = {},
    setButtonActions,
    funnels = []
}) {
    if (!templateButtons || templateButtons.length === 0) return null;

    const getAction = (btnText) =>
        buttonActions[btnText] || { type: 'none', funnel_id: null };

    const setType = (btnText, type) => {
        setButtonActions(prev => ({
            ...prev,
            [btnText]: {
                ...getAction(btnText),
                type,
                funnel_id: type === 'none' ? null : getAction(btnText).funnel_id
            }
        }));
    };

    const setFunnel = (btnText, funnel_id) => {
        setButtonActions(prev => ({
            ...prev,
            [btnText]: {
                ...getAction(btnText),
                funnel_id: funnel_id ? parseInt(funnel_id) : null
            }
        }));
    };

    return (
        <div className="bg-slate-900/60 rounded-xl p-4 border border-white/10 space-y-4">
            <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FiZap className="text-amber-400" />
                    <span>Ação dos Botões do Template</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                    Defina se cada botão aciona um funil como interação ou bloqueio.
                </p>
            </div>

            <div className="space-y-3">
                {templateButtons.map((btnText, idx) => {
                    const currentAction = getAction(btnText);
                    const currentType = currentAction.type || 'none';
                    const activeColor = COLOR[TYPE_OPTIONS.find(o => o.value === currentType)?.color || 'slate'];

                    return (
                        <div
                            key={btnText}
                            className="bg-slate-950/60 rounded-lg p-3 border border-white/5 space-y-3"
                        >
                            {/* Nome do Botão com Enumeração */}
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                                <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 text-[10px] font-mono border border-violet-500/30">
                                    #{idx + 1}
                                </span>
                                <span>{btnText}</span>
                            </div>

                            {/* Seletor de Tipo de Ação: Nenhum / Interação / Bloqueio */}
                            <div className="grid grid-cols-3 gap-1.5">
                                {TYPE_OPTIONS.map(opt => {
                                    const Icon = opt.icon;
                                    const isSelected = currentType === opt.value;
                                    const optColor = COLOR[opt.color];

                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setType(btnText, opt.value)}
                                            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                                                isSelected
                                                    ? `${optColor.bg} ${optColor.text} ${optColor.border} ring-1 ${optColor.ring} shadow-sm font-semibold`
                                                    : 'bg-slate-900/40 text-slate-400 border-white/5 hover:bg-slate-800/40 hover:text-slate-300'
                                            }`}
                                        >
                                            <Icon size={12} />
                                            <span>{opt.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Seletor de Funil para Interação E para Bloqueio */}
                            {(currentType === 'interaction' || currentType === 'block') && (
                                <div className="pt-1 border-t border-white/5">
                                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                                        Funil a disparar ao clicar ({currentType === 'interaction' ? 'Interação' : 'Bloqueio'}):
                                    </label>
                                    <SearchableFunnelSelect
                                        value={currentAction.funnel_id}
                                        onChange={(val) => setFunnel(btnText, val)}
                                        funnels={funnels}
                                        placeholder={`Pesquisar funil de ${currentType === 'interaction' ? 'interação' : 'bloqueio'}...`}
                                        emptyLabel="Nenhum funil (apenas registrar status)"
                                        theme={currentType === 'interaction' ? 'emerald' : 'rose'}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

import React from 'react';
import { FiSliders, FiRotateCcw, FiZap } from 'react-icons/fi';
import { extractVariableIndexes } from './formatters';

const DEFAULT_SAMPLE_VALUES = {
    '1': 'Arthur',
    '2': 'Plano Pro',
    '3': 'R$ 97,00',
    '4': 'https://zapvoice.com.br',
    '5': '123456'
};

const VariableInputs = ({ formData = {}, testValues = {}, setTestValues = () => {} }) => {
    // Coleta variáveis do cabeçalho e do corpo
    const headerVars = formData?.header_type === 'TEXT' ? extractVariableIndexes(formData?.header_text) : [];
    const bodyVars = extractVariableIndexes(formData?.body_text);
    const allVars = Array.from(new Set([...headerVars, ...bodyVars])).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    const handleValueChange = (varId, val) => {
        setTestValues(prev => ({
            ...prev,
            [varId]: val
        }));
    };

    const handleAutoFill = () => {
        const filled = {};
        allVars.forEach(v => {
            filled[v] = DEFAULT_SAMPLE_VALUES[v] || `Exemplo ${v}`;
        });
        setTestValues(filled);
    };

    const handleClear = () => {
        setTestValues({});
    };

    if (allVars.length === 0) {
        return (
            <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Nenhuma variável <code className="text-emerald-500 font-mono">{"{{1}}"}</code> encontrada no texto.
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                    Adicione variáveis no cabeçalho ou corpo para testar com valores reais.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <FiSliders className="text-blue-500 text-sm" />
                    <span className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                        Simulação de Variáveis ({allVars.length})
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={handleAutoFill}
                        className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-1 rounded-lg transition-colors"
                        title="Preencher com exemplos automáticos"
                    >
                        <FiZap size={12} />
                        Auto
                    </button>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors"
                        title="Limpar valores de teste"
                    >
                        <FiRotateCcw size={11} />
                        Limpar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {allVars.map(varId => (
                    <div key={varId} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/60 p-2 rounded-xl border border-gray-200 dark:border-gray-800">
                        <span className="shrink-0 text-[11px] font-mono font-black bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            {`{{${varId}}}`}
                        </span>
                        <input
                            type="text"
                            value={testValues[varId] || ''}
                            onChange={(e) => handleValueChange(varId, e.target.value)}
                            placeholder={`Valor de teste ${varId}`}
                            className="w-full text-xs bg-transparent border-none outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VariableInputs;

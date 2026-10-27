import React, { useState } from 'react';
import { FiSmartphone, FiMoon, FiSun, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import PhoneMockup from './PhoneMockup';
import VariableInputs from './VariableInputs';

const TemplateLivePreview = ({ logic = {} }) => {
    const { formData = {}, mediaCache = {}, activeClient = {} } = logic || {};
    const [theme, setTheme] = useState('dark');
    const [testValues, setTestValues] = useState({});

    const bodyCharCount = (formData?.body_text || '').length;
    const isBodyOverLimit = bodyCharCount > 1024;
    const hasConsecutiveVars = /\{\{\d+\}\}\s*\{\{\d+\}\}/.test(formData?.body_text || '');
    const startsOrEndsWithVar = /^\s*\{\{\d+\}\}/.test(formData?.body_text || '') || /\{\{\d+\}\}\s*$/.test(formData?.body_text || '');

    return (
        <div className="w-full space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 border border-gray-100 dark:border-gray-700 transition-all duration-300">
                {/* Header da Barra de Prévia */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <FiSmartphone size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm sm:text-base text-gray-800 dark:text-white">
                                    Prévia do WhatsApp
                                </h3>
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Ao Vivo
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">
                                Renderização exata da visão do cliente
                            </p>
                        </div>
                    </div>

                    {/* Controles: Tema Claro / Escuro */}
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900/60 p-1 rounded-xl border border-gray-200 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={() => setTheme('dark')}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                theme === 'dark'
                                    ? 'bg-slate-800 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                            title="Visualizar no WhatsApp Dark"
                        >
                            <FiMoon size={14} />
                            <span className="hidden sm:inline text-[11px]">Escuro</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setTheme('light')}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                theme === 'light'
                                    ? 'bg-white text-emerald-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                            title="Visualizar no WhatsApp Claro"
                        >
                            <FiSun size={14} />
                            <span className="hidden sm:inline text-[11px]">Claro</span>
                        </button>
                    </div>
                </div>

                {/* Avisos de Políticas da Meta (se aplicável) */}
                {(isBodyOverLimit || hasConsecutiveVars || startsOrEndsWithVar) && (
                    <div className="mt-3 space-y-1.5">
                        {isBodyOverLimit && (
                            <div className="flex items-center gap-2 p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs border border-red-200 dark:border-red-800/40">
                                <FiAlertTriangle className="shrink-0" />
                                <span>O corpo excedeu o limite máximo da Meta (1024 caracteres).</span>
                            </div>
                        )}
                        {hasConsecutiveVars && (
                            <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs border border-amber-200 dark:border-amber-800/40">
                                <FiAlertTriangle className="shrink-0" />
                                <span>Atenção: A Meta reprova variáveis consecutivas como <code>{'{{1}}{{2}}'}</code>. Adicione texto ou espaço entre elas.</span>
                            </div>
                        )}
                        {startsOrEndsWithVar && (
                            <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs border border-blue-200 dark:border-blue-800/40">
                                <FiInfo className="shrink-0" />
                                <span>Dica Meta: Evite iniciar ou terminar mensagens diretamente com variáveis.</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Smartphone Mockup */}
                <PhoneMockup
                    formData={formData}
                    mediaCache={mediaCache}
                    testValues={testValues}
                    theme={theme}
                    businessName={activeClient?.name || 'ZapVoice Oficial'}
                />

                {/* Painel de Variáveis de Teste */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <VariableInputs
                        formData={formData}
                        testValues={testValues}
                        setTestValues={setTestValues}
                    />
                </div>
            </div>
        </div>
    );
};

export default TemplateLivePreview;

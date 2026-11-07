import React from 'react';
import { FiRefreshCw } from 'react-icons/fi';

export default function AICopilotFinancialView({
    financialData,
    isLoadingFinancial,
    onRefresh
}) {
    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                    Resumo de Consumo de Tokens & Custos
                </h3>
                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={isLoadingFinancial}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                    <FiRefreshCw size={13} className={isLoadingFinancial ? 'animate-spin' : ''} />
                    Atualizar Métricas
                </button>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <span className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Total Gasto (USD)</span>
                    <div className="text-xl font-extrabold text-gray-800 dark:text-white mt-1">
                        ${financialData?.summary?.total_cost_usd?.toFixed(4) || '0.0000'}
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        ≈ R$ {financialData?.summary?.total_cost_brl?.toFixed(2) || '0.00'}
                    </span>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                    <span className="text-[11px] font-bold uppercase text-blue-600 dark:text-blue-400">Total de Respostas</span>
                    <div className="text-xl font-extrabold text-gray-800 dark:text-white mt-1">
                        {financialData?.summary?.total_calls || 0}
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">Interações comerciais</span>
                </div>

                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                    <span className="text-[11px] font-bold uppercase text-purple-600 dark:text-purple-400">Custo Médio / Resposta</span>
                    <div className="text-xl font-extrabold text-gray-800 dark:text-white mt-1">
                        ${financialData?.summary?.avg_cost_usd?.toFixed(5) || '0.00000'}
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        ≈ R$ {financialData?.summary?.avg_cost_brl?.toFixed(4) || '0.0000'}
                    </span>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                    <span className="text-[11px] font-bold uppercase text-amber-600 dark:text-amber-400">Total de Tokens</span>
                    <div className="text-xl font-extrabold text-gray-800 dark:text-white mt-1">
                        {financialData?.summary?.total_tokens?.toLocaleString('pt-BR') || 0}
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">Input + Output</span>
                </div>
            </div>

            {/* Consumo por Modelo */}
            {financialData?.by_model?.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Distribuição de Gastos por Modelo
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {financialData.by_model.map((bm) => (
                            <div key={bm.model} className="p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
                                <div className="flex items-center justify-between font-bold text-xs text-gray-800 dark:text-white">
                                    <span>{bm.model_name}</span>
                                    <span className="text-emerald-500 font-mono">${bm.cost_usd.toFixed(4)}</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                                    <span>{bm.calls} respostas</span>
                                    <span>{bm.tokens.toLocaleString('pt-BR')} tokens</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabela de Histórico Recente */}
            <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Últimas Interações com a IA
                </h4>
                <div className="border border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto max-h-72 custom-scrollbar">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 text-gray-400 uppercase text-[10px] font-bold">
                                <tr>
                                    <th className="py-2.5 px-3">Data/Hora</th>
                                    <th className="py-2.5 px-3">Modelo</th>
                                    <th className="py-2.5 px-3">Contato / Lead</th>
                                    <th className="py-2.5 px-3">Tokens</th>
                                    <th className="py-2.5 px-3">Custo (USD)</th>
                                    <th className="py-2.5 px-3">Custo (BRL)</th>
                                    <th className="py-2.5 px-3">Prévia da Pergunta</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-700 dark:text-gray-300">
                                {financialData?.recent_logs?.length > 0 ? (
                                    financialData.recent_logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5">
                                            <td className="py-2 px-3 whitespace-nowrap text-gray-400 font-mono text-[11px]">
                                                {new Date(log.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                            </td>
                                            <td className="py-2 px-3 whitespace-nowrap font-medium text-blue-500">
                                                {log.model_name}
                                            </td>
                                            <td className="py-2 px-3 whitespace-nowrap">
                                                {log.contact_name ? (
                                                    <span className="font-semibold">{log.contact_name}</span>
                                                ) : (
                                                    <span className="text-gray-400">Chat Geral</span>
                                                )}
                                            </td>
                                            <td className="py-2 px-3 font-mono text-[11px]">
                                                {log.total_tokens}
                                            </td>
                                            <td className="py-2 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                                                ${log.cost_usd.toFixed(5)}
                                            </td>
                                            <td className="py-2 px-3 font-mono text-gray-500 text-[11px]">
                                                R$ {log.cost_brl.toFixed(4)}
                                            </td>
                                            <td className="py-2 px-3 max-w-xs truncate text-gray-500" title={log.question_preview}>
                                                {log.question_preview}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-gray-400">
                                            Nenhum registro de uso de IA encontrado ainda.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

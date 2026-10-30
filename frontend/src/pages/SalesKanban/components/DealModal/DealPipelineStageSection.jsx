import React from 'react';
import { FiGlobe } from 'react-icons/fi';

export function DealPipelineStageSection({
    channel,
    setChannel,
    customChannel,
    setCustomChannel,
    stageId,
    setStageId,
    stages = [],
    status,
    setStatus,
    lostReason,
    setLostReason,
    channelOptions = []
}) {
    const currentStage = stages.find(s => String(s.id) === String(stageId));
    const isDesistencia = (currentStage && (
        currentStage.stage_type === 'lost' ||
        currentStage.name.toLowerCase().includes('desistencia') ||
        currentStage.name.toLowerCase().includes('desistência')
    )) || status === 'lost';

    return (
        <div className="space-y-4">
            {/* Linha: Canal e Estágio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <FiGlobe className="text-blue-400" />
                        Canal de Origem <span className="text-rose-400">*</span>
                    </label>
                    <select
                        value={channel}
                        onChange={(e) => setChannel(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none focus:border-blue-500 transition-all font-bold cursor-pointer"
                    >
                        {channelOptions.map((opt) => (
                            <option key={opt.id} value={opt.id} className="bg-slate-900 text-white">
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    {channel === 'outro' && (
                        <input
                            type="text"
                            value={customChannel}
                            onChange={(e) => setCustomChannel(e.target.value)}
                            placeholder="Digite o nome do canal..."
                            className="mt-2 w-full bg-slate-950 border border-blue-500/40 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500 transition-all"
                        />
                    )}
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Coluna / Estágio <span className="text-rose-400">*</span>
                    </label>
                    <select
                        value={stageId}
                        onChange={(e) => setStageId(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none focus:border-blue-500 transition-all font-bold cursor-pointer"
                    >
                        {stages.map(stg => (
                            <option key={stg.id} value={stg.id} className="bg-slate-900 text-white">
                                {stg.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Status da Oportunidade */}
            <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Status da Oportunidade
                </label>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none focus:border-blue-500 transition-all font-bold cursor-pointer"
                >
                    <option value="open">Em Aberto / Negociação</option>
                    <option value="won">Ganho 🎉 (Venda Fechada)</option>
                    <option value="lost">Perdido ❌</option>
                </select>
            </div>

            {/* Motivo da Desistência se aplicável */}
            {isDesistencia && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 space-y-2 animate-fade-in">
                    <label className="block text-xs font-bold text-rose-300">
                        Motivo da Desistência do Lead
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {[
                            'Preço alto / Sem orçamento',
                            'Sem interesse no momento',
                            'Comprou de concorrente',
                            'Não responde / Sumiu',
                            'Outro motivo'
                        ].map((q) => (
                            <button
                                type="button"
                                key={q}
                                onClick={() => setLostReason(q)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                    lostReason === q
                                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                                        : 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
                                }`}
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                    <textarea
                        rows={2}
                        value={lostReason}
                        onChange={(e) => setLostReason(e.target.value)}
                        placeholder="Descreva o motivo da desistência do lead..."
                        className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white text-xs outline-none focus:border-rose-500 transition-all resize-none font-medium"
                    />
                </div>
            )}
        </div>
    );
}

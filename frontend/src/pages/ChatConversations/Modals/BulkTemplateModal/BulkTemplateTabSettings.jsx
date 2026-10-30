import React from 'react';
import { FiSliders, FiClock, FiLayers } from 'react-icons/fi';
import BulkTemplateButtonsConfig from './BulkTemplateButtonsConfig';
import BulkTemplateScheduling from './BulkTemplateScheduling';
import FollowUpSection from '../../../../components/BulkSender/steps/FollowUpSection';

export default function BulkTemplateTabSettings({
    selectedTemplateObj,
    templateButtons = [],
    buttonActions,
    setButtonActions,
    funnels = [],
    delaySeconds,
    setDelaySeconds,
    concurrency,
    setConcurrency,
    dispatchMode = 'immediate',
    setDispatchMode,
    scheduledDateTime = '',
    setScheduledDateTime,
    recurrenceFrequency = 'weekly',
    setRecurrenceFrequency,
    recurrenceDaysOfWeek = [0],
    setRecurrenceDaysOfWeek,
    recurrenceDayOfMonth = '1',
    setRecurrenceDayOfMonth,
    recurrenceTime = '09:00',
    setRecurrenceTime,
    isFollowupEnabled,
    setIsFollowupEnabled,
    followups,
    setFollowups,
    stopTags,
    setStopTags,
    templates,
    chatwootLabels = []
}) {
    return (
        <div className="space-y-6 animate-in fade-in duration-150">
            {/* 1. Ações dos Botões do Template Principal */}
            {selectedTemplateObj && templateButtons.length > 0 ? (
                <div className="space-y-2">
                    <BulkTemplateButtonsConfig
                        templateButtons={templateButtons}
                        buttonActions={buttonActions}
                        setButtonActions={setButtonActions}
                        funnels={funnels}
                    />
                </div>
            ) : (
                <div className="bg-slate-900/40 rounded-xl p-4 border border-white/10 text-xs text-slate-400 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
                        <FiLayers size={16} />
                    </div>
                    <div>
                        <span className="font-semibold text-slate-300 block">Botões de Resposta Rápida</span>
                        {selectedTemplateObj
                            ? 'Este template não possui botões configurados na Meta.'
                            : 'Selecione um template na aba "Template & Mensagem" para mapear ações de botões.'}
                    </div>
                </div>
            )}

            {/* 2. Programação, Agendamento e Recorrência */}
            <BulkTemplateScheduling
                dispatchMode={dispatchMode}
                setDispatchMode={setDispatchMode}
                scheduledDateTime={scheduledDateTime}
                setScheduledDateTime={setScheduledDateTime}
                recurrenceFrequency={recurrenceFrequency}
                setRecurrenceFrequency={setRecurrenceFrequency}
                recurrenceDaysOfWeek={recurrenceDaysOfWeek}
                setRecurrenceDaysOfWeek={setRecurrenceDaysOfWeek}
                recurrenceDayOfMonth={recurrenceDayOfMonth}
                setRecurrenceDayOfMonth={setRecurrenceDayOfMonth}
                recurrenceTime={recurrenceTime}
                setRecurrenceTime={setRecurrenceTime}
            />

            {/* 3. Configurações de Envio (Delay e Concorrência) */}
            <div className="bg-slate-900/60 rounded-xl p-4 border border-white/10 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FiSliders className="text-blue-400" />
                    <span>Velocidade e Concorrência de Disparo</span>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
                            <FiClock size={12} />
                            <span>Intervalo entre envios (segundos)</span>
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={60}
                            value={delaySeconds}
                            onChange={(e) => setDelaySeconds(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-3 py-1.5 bg-slate-950/60 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-teal-500 transition-colors"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">Tempo de espera seguro entre mensagens</span>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">
                            Envios simultâneos (concorrência)
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={5}
                            value={concurrency}
                            onChange={(e) => setConcurrency(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-3 py-1.5 bg-slate-950/60 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-teal-500 transition-colors"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">Máximo recomendado: 1 a 3 conexões simultâneas</span>
                    </div>
                </div>
            </div>

            {/* 4. Seção de Follow-up (Opcional) */}
            <div className="border-t border-white/10 pt-4">
                <FollowUpSection
                    isFollowupEnabled={isFollowupEnabled}
                    setIsFollowupEnabled={setIsFollowupEnabled}
                    followups={followups}
                    setFollowups={setFollowups}
                    stopTags={stopTags}
                    setStopTags={setStopTags}
                    templates={templates}
                    funnels={funnels}
                    chatwootLabels={chatwootLabels}
                    stepNumber="03"
                />
            </div>
        </div>
    );
}

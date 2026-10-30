import React from 'react';
import { FiMessageSquare, FiInfo } from 'react-icons/fi';
import FollowUpTemplateSelect from '../../../../components/BulkSender/steps/FollowUpTemplateSelect';
import BulkTemplateVariables from './BulkTemplateVariables';

export default function BulkTemplateTabMessage({
    templates,
    selectedTemplateName,
    setSelectedTemplateName,
    selectedTemplateObj,
    templateParams,
    setTemplateParams,
    setButtonActions,
    previewText,
    isTemplateSelectorOpen,
    setIsTemplateSelectorOpen
}) {
    return (
        <div className="space-y-6 animate-in fade-in duration-150">
            {/* 1. Escolha do Template com Busca e Fixados */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-white uppercase tracking-wider block flex items-center justify-between">
                    <span>1. Escolha o Template</span>
                    <span className="text-[11px] text-slate-400 font-normal">Templates aprovados pela Meta</span>
                </label>
                <FollowUpTemplateSelect
                    selectedTemplateName={selectedTemplateName}
                    templates={templates}
                    placeholder="Selecione o template..."
                    onOpenChange={setIsTemplateSelectorOpen}
                    onSelectTemplate={(tplName) => {
                        setSelectedTemplateName(tplName);
                        setTemplateParams({});
                        setButtonActions({});
                        setIsTemplateSelectorOpen(false);
                    }}
                />
            </div>

            {/* 2. Variáveis e Pré-visualização do Template */}
            {!isTemplateSelectorOpen && selectedTemplateObj && (
                <BulkTemplateVariables
                    selectedTemplate={selectedTemplateObj}
                    templateParams={templateParams}
                    setTemplateParams={setTemplateParams}
                    previewText={previewText}
                />
            )}

            {/* Estado sem template selecionado */}
            {!selectedTemplateObj && (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-xl border border-dashed border-white/10 bg-slate-900/30">
                    <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-3 border border-teal-500/20">
                        <FiMessageSquare size={22} />
                    </div>
                    <p className="text-sm font-medium text-slate-200 mb-1">Nenhum template selecionado</p>
                    <p className="text-xs text-slate-400 max-w-sm">
                        Selecione um template aprovado acima para configurar mídias de cabeçalho, preencher variáveis dinâmicas e visualizar como a mensagem será entregue aos contatos.
                    </p>
                </div>
            )}
        </div>
    );
}

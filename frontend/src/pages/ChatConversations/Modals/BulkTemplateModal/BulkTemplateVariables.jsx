import React, { useMemo } from 'react';
import BulkTemplateMediaUpload from './BulkTemplateMediaUpload';
import BulkTemplateVariablesInputs from './BulkTemplateVariablesInputs';
import BulkTemplatePreviewBox from './BulkTemplatePreviewBox';

/**
 * BulkTemplateVariables
 * Orquestrador da seção de mídia de cabeçalho, definição de variáveis e pré-visualização.
 */
export default function BulkTemplateVariables({
    selectedTemplate,
    templateParams,
    setTemplateParams
}) {
    if (!selectedTemplate) return null;

    const components = selectedTemplate.components || [];
    const headerComp = components.find(c => c.type === 'HEADER');
    const bodyComp = components.find(c => c.type === 'BODY');

    // Variáveis do Header (se TEXT contiver {{1}})
    const headerVars = useMemo(() => {
        if (!headerComp || headerComp.format !== 'TEXT' || !headerComp.text) return [];
        const matches = [...headerComp.text.matchAll(/\{\{(\d+)\}\}/g)];
        return [...new Set(matches.map(m => parseInt(m[1])))].sort((a, b) => a - b);
    }, [headerComp]);

    // Variáveis do Corpo
    const bodyVars = useMemo(() => {
        if (!bodyComp?.text) return [];
        const matches = [...bodyComp.text.matchAll(/\{\{(\d+)\}\}/g)];
        return [...new Set(matches.map(m => parseInt(m[1])))].sort((a, b) => a - b);
    }, [bodyComp]);

    return (
        <div className="space-y-4">
            {/* 1. Mídia do Cabeçalho (Upload de novo arquivo ou Seleção de Mídias Salvas) */}
            <BulkTemplateMediaUpload
                headerComp={headerComp}
                templateParams={templateParams}
                setTemplateParams={setTemplateParams}
            />

            {/* 2. Identificação e Definição de Variáveis */}
            <BulkTemplateVariablesInputs
                headerVars={headerVars}
                bodyVars={bodyVars}
                templateParams={templateParams}
                setTemplateParams={setTemplateParams}
            />

            {/* 3. Caixa de Pré-visualização Interativa */}
            <BulkTemplatePreviewBox
                selectedTemplate={selectedTemplate}
                templateParams={templateParams}
                headerVars={headerVars}
                bodyVars={bodyVars}
            />
        </div>
    );
}

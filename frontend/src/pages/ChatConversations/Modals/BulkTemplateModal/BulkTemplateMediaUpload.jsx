import React from 'react';
import MediaHeaderUploader from '../../../../components/BulkSender/common/MediaHeaderUploader';

/**
 * BulkTemplateMediaUpload
 * Gerencia a seleção e upload da mídia do cabeçalho do template no modal de disparo em massa.
 * Suporta upload de arquivos (com progresso) e seleção de mídias salvas / usadas anteriormente.
 */
export default function BulkTemplateMediaUpload({
    headerComp,
    templateParams,
    setTemplateParams
}) {
    if (!headerComp) return null;

    const isMedia = ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerComp.format);
    if (!isMedia) return null;

    const handleParamChange = (key, value) => {
        setTemplateParams(prev => ({
            ...prev,
            [key]: value
        }));
    };

    return (
        <div className="space-y-2">
            <MediaHeaderUploader
                format={headerComp.format}
                templateParams={templateParams}
                handleParamChange={handleParamChange}
            />
        </div>
    );
}

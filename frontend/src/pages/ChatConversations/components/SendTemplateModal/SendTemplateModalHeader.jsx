import React from 'react';
import { FiX, FiBookOpen } from 'react-icons/fi';

export default function SendTemplateModalHeader({ onClose, retryMessage = null }) {
  const isRetry = Boolean(retryMessage);
  const failureReason = retryMessage?.meta_data?.failure_reason;

  return (
    <div className="flex flex-col border-b border-white/5 shrink-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 text-white">
          <FiBookOpen className={isRetry ? "text-amber-400" : "text-blue-500"} size={20} />
          <div>
            <h3 className="text-base font-semibold">
              {isRetry ? 'Editar e Reenviar Template WhatsApp' : 'Enviar Template WhatsApp'}
            </h3>
            {isRetry && (
              <span className="text-[11px] text-amber-300/90 font-medium">
                Edite os parâmetros antes de realizar o reenvio
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          title="Fechar"
        >
          <FiX size={20} />
        </button>
      </div>

      {isRetry && failureReason && (
        <div className="px-6 py-2.5 bg-red-500/15 border-t border-red-500/20 text-red-200 text-xs flex items-center gap-2">
          <span className="font-bold text-red-400 shrink-0">⚠️ Erro da Meta:</span>
          <span className="truncate font-mono text-[11px]">{failureReason}</span>
        </div>
      )}
    </div>
  );
}

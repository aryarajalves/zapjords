import React from 'react';
import { createPortal } from 'react-dom';
import { FiSend, FiCalendar, FiLoader } from 'react-icons/fi';

export default function EmailSendingModal({
  isOpen,
  sendMode = 'immediate',
  recipientCount = 0,
  campaignTitle = ''
}) {
  if (!isOpen) return null;

  const isScheduled = sendMode === 'scheduled';

  const modalContent = (
    <div
      className="fixed inset-0 z-[99990] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-sending-modal-title"
    >
      <div className="w-full max-w-md bg-slate-900/95 border border-white/10 rounded-2xl p-6 shadow-2xl text-center space-y-5">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center relative">
          <FiLoader className="text-blue-400 animate-spin" size={30} />
          <span className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-slate-900 border border-blue-500/40 flex items-center justify-center text-blue-300 shadow">
            {isScheduled ? <FiCalendar size={13} /> : <FiSend size={13} />}
          </span>
        </div>

        <div className="space-y-1.5">
          <h3 id="email-sending-modal-title" className="text-lg font-bold text-white">
            {isScheduled ? 'Agendando Disparo de E-mails...' : 'Enviando E-mails...'}
          </h3>
          {campaignTitle?.trim() && (
            <p className="text-xs font-semibold text-blue-300 truncate px-2">
              Campanha: {campaignTitle}
            </p>
          )}
          <p className="text-sm text-gray-300">
            {isScheduled
              ? `Preparando agendamento para ${recipientCount} contato(s).`
              : `Processando e enviando para ${recipientCount} contato(s).`}
          </p>
        </div>

        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full w-2/3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full animate-pulse" />
        </div>

        <p className="text-[11px] text-gray-400 leading-relaxed">
          Por favor, aguarde. Não feche ou recarregue esta janela até a conclusão do processo.
        </p>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

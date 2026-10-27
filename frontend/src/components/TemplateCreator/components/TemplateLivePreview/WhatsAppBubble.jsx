import React from 'react';
import { FiExternalLink, FiPhone, FiCornerUpLeft, FiImage, FiVideo, FiFileText, FiCheck } from 'react-icons/fi';
import { renderWhatsAppTextWithVariables } from './formatters';

const WhatsAppBubble = ({ formData = {}, mediaCache = {}, testValues = {}, theme = 'dark' }) => {
    const isDark = theme === 'dark';
    const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Renderiza cabeçalho (HEADER)
    const renderHeader = () => {
        const headerType = formData?.header_type || 'NONE';

        if (headerType === 'NONE') return null;

        if (headerType === 'TEXT') {
            if (!formData?.header_text?.trim()) {
                return (
                    <div className="text-xs italic text-gray-400 mb-2 pb-1 border-b border-white/5">
                        [Cabeçalho em Texto vazio]
                    </div>
                );
            }
            return (
                <div className={`font-bold text-sm mb-2 pb-1 border-b ${isDark ? 'text-white border-white/10' : 'text-gray-900 border-gray-200'}`}>
                    {renderWhatsAppTextWithVariables(formData?.header_text, testValues, 'hdr')}
                </div>
            );
        }

        if (headerType === 'IMAGE') {
            const imgSrc = mediaCache?.IMAGE?.previewUrl || formData?.header_media_url;
            return (
                <div className={`h-40 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                    {imgSrc ? (
                        <img
                            src={imgSrc}
                            alt="Header Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-1.5 text-gray-400">
                            <FiImage size={32} className="opacity-60" />
                            <span className="text-[11px] font-medium">Imagem do Cabeçalho</span>
                        </div>
                    )}
                </div>
            );
        }

        if (headerType === 'VIDEO') {
            const vidSrc = mediaCache?.VIDEO?.previewUrl || formData?.header_media_url;
            return (
                <div className={`h-40 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                    {vidSrc ? (
                        <video src={vidSrc} className="w-full h-full object-cover" controls={false} />
                    ) : (
                        <div className="flex flex-col items-center gap-1.5 text-gray-400">
                            <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white">
                                <FiVideo size={20} />
                            </div>
                            <span className="text-[11px] font-medium">Vídeo do Cabeçalho</span>
                        </div>
                    )}
                </div>
            );
        }

        if (headerType === 'DOCUMENT') {
            const fileName = mediaCache?.DOCUMENT?.fileName || 'documento.pdf';
            return (
                <div className={`p-3 rounded-lg mb-3 flex items-center gap-3 border ${
                    isDark ? 'bg-slate-800/80 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                }`}>
                    <div className="w-9 h-9 rounded-lg bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                        <FiFileText size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">{fileName}</p>
                        <p className="text-[10px] text-gray-400">Documento PDF</p>
                    </div>
                </div>
            );
        }

        return null;
    };

    // Renderiza botões interativos
    const renderButtons = () => {
        const buttons = formData?.buttons || [];
        if (buttons.length === 0) return null;

        return (
            <div className="mt-2 space-y-1">
                {buttons.map((btn, index) => {
                    const btnLabel = btn.text?.trim() || `Botão ${index + 1}`;
                    return (
                        <div
                            key={index}
                            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border shadow-sm transition-all select-none cursor-default ${
                                isDark
                                    ? 'bg-[#202c33] text-[#53bdeb] border-white/5 hover:bg-[#233139]'
                                    : 'bg-white text-[#00a884] border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {btn.type === 'URL' && <FiExternalLink size={13} className="shrink-0" />}
                            {btn.type === 'PHONE_NUMBER' && <FiPhone size={13} className="shrink-0" />}
                            {btn.type === 'QUICK_REPLY' && <FiCornerUpLeft size={13} className="shrink-0" />}
                            <span className="truncate">{btnLabel}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="w-full max-w-[340px] mx-auto transition-all animate-in fade-in duration-200">
            {/* Balão de Mensagem */}
            <div
                className={`p-3 rounded-xl rounded-tl-none shadow-md relative border ${
                    isDark
                        ? 'bg-[#1f2c34] text-slate-100 border-[#2a3942]'
                        : 'bg-white text-gray-900 border-gray-100'
                }`}
            >
                {/* Rabicho do balão (Lado esquerdo - Mensagem Recebida pelo Usuário) */}
                <svg
                    className={`absolute -left-2 top-0 ${isDark ? 'text-[#1f2c34]' : 'text-white'}`}
                    width="9"
                    height="14"
                    viewBox="0 0 9 14"
                    fill="currentColor"
                >
                    <path d="M0 0L9 0L9 14L0 0Z" />
                </svg>

                {/* Cabeçalho */}
                {renderHeader()}

                {/* Corpo do Texto */}
                <div className="text-xs leading-relaxed break-words whitespace-pre-wrap select-text">
                    {formData?.body_text?.trim() ? (
                        renderWhatsAppTextWithVariables(formData?.body_text, testValues, 'body')
                    ) : (
                        <span className="text-gray-400 italic text-[11px]">
                            Digite o corpo da mensagem no formulário para visualizar aqui...
                        </span>
                    )}
                </div>

                {/* Rodapé (FOOTER) */}
                {formData?.footer_text?.trim() && (
                    <div className={`text-[10px] mt-2 pt-1.5 border-t ${
                        isDark ? 'text-gray-400 border-white/5' : 'text-gray-500 border-gray-100'
                    }`}>
                        {formData?.footer_text}
                    </div>
                )}

                {/* Metadados: Horário e Status de Leitura */}
                <div className="mt-1.5 flex justify-end items-center gap-1 text-[9px] text-gray-400 select-none">
                    <span>{currentTime}</span>
                    <span className="flex items-center text-[#53bdeb] ml-0.5" title="Entregue e lido">
                        <FiCheck size={11} className="-mr-1.5" />
                        <FiCheck size={11} />
                    </span>
                </div>
            </div>

            {/* Botões do WhatsApp */}
            {renderButtons()}
        </div>
    );
};

export default WhatsAppBubble;

import React, { useState } from 'react';
import { FiX, FiRefreshCw, FiSend, FiFileText, FiMusic, FiMaximize2, FiMinimize2 } from 'react-icons/fi';

export default function MediaPreviewModal({
    mediaPreview,
    previewCaption,
    setPreviewCaption,
    isSendingMedia,
    onClose,
    onSend
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!mediaPreview) return null;

    const { messageType, localUrl, file } = mediaPreview;
    const fileName = file?.name || 'arquivo';
    const fileSizeMB = file?.size ? (file.size / 1024 / 1024).toFixed(2) : null;

    const getTitle = () => {
        switch (messageType) {
            case 'image': return '🖼️ Enviar Imagem';
            case 'video': return '🎬 Enviar Vídeo';
            case 'audio': return '🎵 Enviar Áudio';
            case 'document': return '📄 Enviar Documento';
            default: return '📎 Enviar Arquivo';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className={`bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl w-full ${
                isExpanded ? 'max-w-2xl' : 'max-w-lg'
            } overflow-hidden flex flex-col text-gray-100 transition-all duration-200 max-h-[92vh]`}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
                    <h3 className="text-white font-bold text-base flex items-center gap-2">
                        {getTitle()}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                        title="Fechar modal"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {/* Preview */}
                <div className={`p-4 sm:p-5 flex justify-center items-center bg-black/20 ${
                    isExpanded ? 'min-h-[110px]' : 'min-h-[160px]'
                } transition-all overflow-hidden shrink-0`}>
                    {messageType === 'image' && (
                        <img
                            src={localUrl}
                            alt="Preview"
                            className={`${isExpanded ? 'max-h-44 sm:max-h-52' : 'max-h-80'} max-w-full rounded-xl object-contain shadow-lg transition-all`}
                        />
                    )}

                    {messageType === 'video' && (
                        <video
                            src={localUrl}
                            controls
                            className={`${isExpanded ? 'max-h-44 sm:max-h-52' : 'max-h-80'} max-w-full rounded-xl shadow-lg transition-all`}
                        />
                    )}

                    {messageType === 'audio' && (
                        <div className="w-full flex flex-col items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                <FiMusic size={24} />
                            </div>
                            <span className="text-sm font-medium text-gray-200 truncate max-w-xs">{fileName}</span>
                            {localUrl && (
                                <audio controls src={localUrl} className="w-full mt-1" />
                            )}
                        </div>
                    )}

                    {messageType === 'document' && (
                        <div className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                                <FiFileText size={26} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{fileName}</p>
                                {fileSizeMB && (
                                    <p className="text-xs text-gray-400 mt-0.5">{fileSizeMB} MB</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Legenda / Mensagem de Texto */}
                <div className="px-5 py-4 space-y-4 overflow-y-auto">
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                {messageType === 'audio' ? 'Observação / Texto (opcional)' : 'Legenda (opcional)'}
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsExpanded(prev => !prev)}
                                className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-all cursor-pointer border border-blue-500/20 active:scale-95"
                                title={isExpanded ? "Minimizar campo de legenda" : "Maximizar campo para ver o texto completo"}
                                aria-label={isExpanded ? "Minimizar campo" : "Maximizar campo"}
                            >
                                {isExpanded ? (
                                    <>
                                        <FiMinimize2 size={13} />
                                        <span>Minimizar</span>
                                    </>
                                ) : (
                                    <>
                                        <FiMaximize2 size={13} />
                                        <span>Maximizar</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {isExpanded ? (
                            <div className="space-y-1.5">
                                <div className="relative">
                                    <textarea
                                        value={previewCaption}
                                        onChange={(e) => setPreviewCaption(e.target.value)}
                                        placeholder={messageType === 'audio' ? 'Adicione uma observação detalhada...' : 'Adicione uma legenda detalhada para a mídia...'}
                                        rows={5}
                                        className="w-full px-4 py-3 pr-10 bg-white/5 text-white text-sm rounded-xl border border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 resize-y min-h-[130px] leading-relaxed font-sans"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isSendingMedia) {
                                                e.preventDefault();
                                                onSend();
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsExpanded(false)}
                                        className="absolute right-2.5 top-2.5 p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                                        title="Minimizar campo"
                                        aria-label="Minimizar campo"
                                    >
                                        <FiMinimize2 size={15} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-gray-400 px-1 font-medium">
                                    <span>
                                        Pressione <kbd className="px-1.5 py-0.5 bg-white/10 text-gray-300 rounded text-[10px] font-mono">Ctrl + Enter</kbd> para enviar
                                    </span>
                                    <span className="text-gray-400 font-mono">
                                        {(previewCaption || '').length} caracteres
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={previewCaption}
                                    onChange={(e) => setPreviewCaption(e.target.value)}
                                    placeholder={messageType === 'audio' ? 'Adicione uma observação...' : 'Adicione uma legenda para a mídia...'}
                                    className="w-full pl-4 pr-11 py-2.5 bg-white/5 text-white text-sm rounded-xl border border-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !isSendingMedia) {
                                            onSend();
                                        }
                                    }}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsExpanded(true)}
                                    className="absolute right-2 p-1.5 text-gray-400 hover:text-blue-400 hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                                    title="Maximizar campo para ver o texto completo"
                                    aria-label="Maximizar campo"
                                >
                                    <FiMaximize2 size={15} />
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            disabled={isSendingMedia}
                            onClick={onSend}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
                        >
                            {isSendingMedia ? (
                                <><FiRefreshCw className="animate-spin" size={14} /> Enviando...</>
                            ) : (
                                <><FiSend size={14} /> Enviar</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

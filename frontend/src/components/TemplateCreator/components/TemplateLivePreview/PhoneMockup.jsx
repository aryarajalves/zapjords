import React from 'react';
import { 
    FiArrowLeft, 
    FiMoreVertical, 
    FiPhone, 
    FiVideo, 
    FiSmile, 
    FiPaperclip, 
    FiCamera, 
    FiMic, 
    FiWifi, 
    FiCheckCircle 
} from 'react-icons/fi';
import WhatsAppBubble from './WhatsAppBubble';

const PhoneMockup = ({ formData = {}, mediaCache = {}, testValues = {}, theme = 'dark', businessName = 'ZapVoice Oficial' }) => {
    const isDark = theme === 'dark';
    const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="w-full flex justify-center py-2 select-none">
            {/* Chassi do Smartphone */}
            <div className="w-full max-w-[340px] sm:max-w-[360px] bg-slate-950 rounded-[2.5rem] p-3 shadow-2xl border-4 border-slate-800 relative ring-1 ring-white/10">
                {/* Dynamic Island / Câmera Frontal */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full flex items-center justify-end px-2 z-30">
                    <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700/60" />
                </div>

                {/* Tela do Celular */}
                <div className={`w-full rounded-[2rem] overflow-hidden flex flex-col h-[580px] sm:h-[620px] transition-colors ${
                    isDark ? 'bg-[#0b141a]' : 'bg-[#efeae2]'
                }`}>
                    {/* Barra de Status do Sistema */}
                    <div className={`px-5 pt-3 pb-1 flex justify-between items-center text-[10px] font-bold ${
                        isDark ? 'text-white' : 'text-gray-800'
                    }`}>
                        <span>{currentTime}</span>
                        <div className="flex items-center gap-1.5 opacity-80">
                            <FiWifi size={11} />
                            <div className="w-4 h-2 border border-current rounded-sm p-0.5 flex items-center">
                                <div className="h-full w-full bg-current rounded-2xs" />
                            </div>
                        </div>
                    </div>

                    {/* Cabeçalho do WhatsApp */}
                    <div className={`px-3 py-2 flex items-center justify-between border-b shadow-sm ${
                        isDark ? 'bg-[#1f2c34] text-white border-white/5' : 'bg-[#008069] text-white border-transparent'
                    }`}>
                        <div className="flex items-center gap-2 min-w-0">
                            <FiArrowLeft size={16} className="cursor-pointer shrink-0" />
                            {/* Avatar com Badge Verificado */}
                            <div className="relative shrink-0">
                                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-xs shadow-inner">
                                    {businessName.charAt(0).toUpperCase()}
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 bg-white text-emerald-600 rounded-full">
                                    <FiCheckCircle size={10} className="fill-emerald-500 text-white" />
                                </span>
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                    <p className="text-xs font-bold truncate">{businessName}</p>
                                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded font-bold">Oficial</span>
                                </div>
                                <p className={`text-[9px] truncate ${isDark ? 'text-emerald-400' : 'text-emerald-100'}`}>
                                    Conta comercial verificada
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 opacity-80">
                            <FiVideo size={14} className="cursor-pointer" />
                            <FiPhone size={14} className="cursor-pointer" />
                            <FiMoreVertical size={14} className="cursor-pointer" />
                        </div>
                    </div>

                    {/* Área de Mensagens (Chat Wallpaper) */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar relative flex flex-col justify-end">
                        {/* Pílula de Data */}
                        <div className="flex justify-center my-1">
                            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-md shadow-sm ${
                                isDark ? 'bg-[#182229] text-gray-400' : 'bg-white/90 text-gray-600 shadow-sm'
                            }`}>
                                HOJE
                            </span>
                        </div>

                        {/* Balão Oficial Renderizado */}
                        <WhatsAppBubble 
                            formData={formData} 
                            mediaCache={mediaCache} 
                            testValues={testValues} 
                            theme={theme} 
                        />
                    </div>

                    {/* Barra de Entrada de Mensagem Fictícia (Rodapé do WhatsApp) */}
                    <div className={`p-2 flex items-center gap-1.5 border-t ${
                        isDark ? 'bg-[#1f2c34] border-white/5' : 'bg-[#f0f2f5] border-gray-200'
                    }`}>
                        <div className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-full ${
                            isDark ? 'bg-[#2a3942] text-gray-400' : 'bg-white text-gray-500 shadow-sm'
                        }`}>
                            <FiSmile size={16} />
                            <span className="text-xs flex-1 truncate select-none opacity-60">Mensagem</span>
                            <FiPaperclip size={16} />
                            <FiCamera size={16} />
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#00a884] text-white flex items-center justify-center shrink-0 shadow-md">
                            <FiMic size={16} />
                        </div>
                    </div>

                    {/* Barra Home do Celular */}
                    <div className={`py-1 flex justify-center ${isDark ? 'bg-[#1f2c34]' : 'bg-[#f0f2f5]'}`}>
                        <div className="w-28 h-1 rounded-full bg-gray-500/40" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PhoneMockup;

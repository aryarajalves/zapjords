import React, { useState, useEffect } from 'react';
import { FiPlusCircle, FiList, FiEdit3, FiSmartphone } from 'react-icons/fi';
import { useTemplateCreator } from './hooks/useTemplateCreator';
import TemplateForm from './components/TemplateForm';
import TemplateList from './components/TemplateList';
import TemplateLivePreview from './components/TemplateLivePreview';
import Modals from './components/Modals';
import TemplateGuide from './components/TemplateGuide';
import TemplateAssistant from './components/TemplateAssistant';

const TemplateCreator = ({ onSuccess, refreshKey }) => {
    const logic = useTemplateCreator(onSuccess, refreshKey);
    const [mobileTab, setMobileTab] = useState('create'); // 'create' | 'preview' | 'list'
    const [desktopTab, setDesktopTab] = useState('preview'); // 'preview' | 'list'

    // Quando o usuário clicar em Editar em algum template da lista,
    // alternar automaticamente para a visualização correta
    useEffect(() => {
        if (logic.editingId) {
            setMobileTab('create');
            setDesktopTab('preview');
        }
    }, [logic.editingId]);

    const activeTemplatesCount = (logic.templates || []).filter(t => !t.is_archived).length;

    // Determina se a prévia ou a lista devem estar visíveis
    const isPreviewVisibleOnDesktop = desktopTab === 'preview';
    const isListVisibleOnDesktop = desktopTab === 'list';
    const isPreviewVisibleOnMobile = mobileTab === 'preview';
    const isListVisibleOnMobile = mobileTab === 'list';

    return (
        <div className="max-w-7xl mx-auto px-0 sm:px-4 lg:px-8">
            {/* Sistema de Abas Mobile (Aparece apenas em telas < lg) */}
            <div className="lg:hidden mb-4">
                <div className="flex p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm backdrop-blur-sm">
                    <button
                        type="button"
                        onClick={() => setMobileTab('create')}
                        data-testid="tab-create-template"
                        className={`flex-1 py-2.5 px-2 sm:px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
                            mobileTab === 'create'
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md font-extrabold'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        {logic.editingId ? (
                            <>
                                <FiEdit3 className="w-4 h-4 text-amber-500 shrink-0" />
                                <span>Editar Template</span>
                            </>
                        ) : (
                            <>
                                <FiPlusCircle className="w-4 h-4 shrink-0" />
                                <span>Criar Template</span>
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobileTab('preview')}
                        data-testid="tab-mobile-preview"
                        className={`flex-1 py-2.5 px-2 sm:px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
                            mobileTab === 'preview'
                                ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-md font-extrabold'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        <FiSmartphone className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Prévia</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobileTab('list')}
                        data-testid="tab-my-templates"
                        className={`flex-1 py-2.5 px-2 sm:px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
                            mobileTab === 'list'
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md font-extrabold'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        <FiList className="w-4 h-4 shrink-0" />
                        <span>Meus Templates</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                            mobileTab === 'list'
                                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}>
                            {activeTemplatesCount}
                        </span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                {/* Coluna do Formulário de Criação/Edição */}
                <div className={`${mobileTab === 'create' ? 'block' : 'hidden'} lg:block lg:col-span-8 w-full`}>
                    <TemplateForm logic={logic} />
                </div>

                {/* Coluna Direita (Prévia do WhatsApp e Meus Templates) */}
                <div className={`${mobileTab === 'list' || mobileTab === 'preview' ? 'block' : 'hidden'} lg:block lg:col-span-4 w-full space-y-4`}>
                    {/* Seletor de Abas no Desktop */}
                    <div className="hidden lg:flex p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm backdrop-blur-sm">
                        <button
                            type="button"
                            onClick={() => setDesktopTab('preview')}
                            data-testid="tab-desktop-preview"
                            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                desktopTab === 'preview'
                                    ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-md font-extrabold'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                        >
                            <FiSmartphone className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>Prévia WhatsApp</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setDesktopTab('list')}
                            data-testid="tab-desktop-list"
                            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                desktopTab === 'list'
                                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md font-extrabold'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                        >
                            <FiList className="w-4 h-4 shrink-0" />
                            <span>Meus Templates</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                desktopTab === 'list'
                                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}>
                                {activeTemplatesCount}
                            </span>
                        </button>
                    </div>

                    {/* Conteúdo da Prévia (visível no desktop quando desktopTab === 'preview', ou no mobile quando mobileTab === 'preview') */}
                    <div className={`${isPreviewVisibleOnDesktop ? 'lg:block' : 'lg:hidden'} ${isPreviewVisibleOnMobile ? 'block' : 'hidden'}`}>
                        <TemplateLivePreview logic={logic} />
                    </div>

                    {/* Conteúdo da Lista de Templates */}
                    <TemplateList 
                        logic={logic} 
                        isHidden={(!isListVisibleOnDesktop && !isListVisibleOnMobile) || (!isListVisibleOnDesktop && isPreviewVisibleOnMobile) || (!isListVisibleOnMobile && isPreviewVisibleOnDesktop)} 
                    />
                </div>
            </div>

            <Modals logic={logic} />
            
            <TemplateGuide 
                isOpen={logic.isGuideOpen} 
                onClose={() => logic.setIsGuideOpen(false)} 
            />

            {/* AI Assistant for Templates */}
            <TemplateAssistant logic={logic} />

            {/* Overlay de Carregamento Promitente */}
            {logic.loading && (
                <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-gray-100 dark:border-gray-700">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <div className="text-center">
                            <h3 className="font-bold text-xl text-gray-800 dark:text-white">Enviando template na Meta...</h3>
                            <p className="text-sm text-gray-500 mt-1">Isso pode levar alguns segundos.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplateCreator;

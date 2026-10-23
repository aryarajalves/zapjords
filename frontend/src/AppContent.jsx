import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { FiMenu, FiSettings } from 'react-icons/fi';
import Sidebar from './components/Sidebar';
import AppModals from './components/AppModals';
import { useAppLogic } from './hooks/useAppLogic';
import {
  AppContentHeader,
  AppContentViewRouter,
  ChatConversationsOverlay,
  NoActiveClientScreen,
} from './components/AppContent';

export default function AppContent() {
  const logic = useAppLogic();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0f172a] dark:text-gray-100 overflow-hidden">
      <Toaster
        position="top-right"
        reverseOrder={false}
        containerStyle={{ zIndex: 99999999 }}
        toastOptions={{ style: { zIndex: 99999999 } }}
      />

      <AppModals logic={logic} />

      <Sidebar
        activeView={logic.currentView}
        onViewChange={(view) => {
          logic.handleViewChange(view);
          setIsMobileMenuOpen(false);
        }}
        onLogout={logic.logout}
        onSettings={() => {
          setIsMobileMenuOpen(false);
          window.dispatchEvent(new CustomEvent('close-all-dropdowns'));
          logic.setIsSettingsModalOpen(true);
        }}
        user={logic.user}
        clientName={logic.clientName}
        onClientCreate={() => {
          setIsMobileMenuOpen(false);
          window.dispatchEvent(new CustomEvent('close-all-dropdowns'));
          logic.setIsClientModalOpen(true);
        }}
        appBranding={logic.appBranding}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Barra Superior Mobile (visível apenas em telas menores que md) */}
        <header className="md:hidden flex items-center justify-between px-3.5 py-2.5 bg-white/95 dark:bg-[#1e293b]/95 border-b border-gray-200 dark:border-white/10 backdrop-blur-md z-30 shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              data-testid="open-mobile-sidebar-btn"
              className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition-colors border border-gray-200/50 dark:border-white/5 cursor-pointer shrink-0"
              title="Abrir Menu Lateral"
              aria-label="Abrir Menu Lateral"
            >
              <FiMenu size={20} />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-white tracking-tight truncate">
                {logic.appBranding?.name || 'ZapVoice'}
              </span>
              {logic.clientName && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 max-w-[120px] sm:max-w-[160px] truncate">
                  {logic.clientName}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('close-all-dropdowns'));
                logic.setIsSettingsModalOpen(true);
              }}
              className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
              title="Configurações"
              aria-label="Configurações"
            >
              <FiSettings size={18} />
            </button>
          </div>
        </header>

        <main className={`flex-1 ${logic.currentView === 'sales_kanban' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto overflow-x-hidden'}`}>
          {!logic.activeClient ? (
            <NoActiveClientScreen />
          ) : (
            <>
              <AppContentHeader
                logic={logic}
                onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
              />
              <AppContentViewRouter logic={logic} />
            </>
          )}
        </main>
      </div>

      <ChatConversationsOverlay logic={logic} />
    </div>
  );
}

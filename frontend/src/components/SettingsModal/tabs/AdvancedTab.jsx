import React from 'react';

// Subcomponentes Modulares
import ManyChatTokensSection from './AdvancedTab/ManyChatTokensSection';
import PlatformSettingsSection from './AdvancedTab/PlatformSettingsSection';
import BussolaSettingsSection from './AdvancedTab/BussolaSettingsSection';
import AgentFlowSection from './AdvancedTab/AgentFlowSection';
import MemoryLogsModal from './AdvancedTab/MemoryLogsModal';
import ChatLogsModal from './AdvancedTab/ChatLogsModal';

const AdvancedTab = ({
    user, formData, handleChange, visibleFields, handleRevealSetting,
    showContactsTable, setShowContactsTable, loadingContacts, fetchSyncedContacts, setContactsPage,
    syncedContacts, contactsPage, contactsLimit, contactsTotal, setContactsLimit,
    testingWebhook, handleTestWebhook, testingChatWebhook, handleTestChatWebhook, showMemoryLogsTable, setShowMemoryLogsTable,
    loadingMemoryLogs, fetchMemoryLogs, setMemoryLogsPage, memoryLogs,
    memoryLogsPage, memoryLogsLimit, memoryLogsTotal, setMemoryLogsLimit,
    showChatLogsTable, setShowChatLogsTable, loadingChatLogs, fetchChatLogs, setChatLogsPage,
    chatLogs, chatLogsPage, chatLogsLimit, chatLogsTotal, setChatLogsLimit
}) => {
    const isSuperAdminOrAdmin = ['super_admin', 'admin', 'administrator', 'owner'].includes(user?.role);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {isSuperAdminOrAdmin && (
                <>
                    {/* Plataforma Externa (Área de Membros) */}
                    <PlatformSettingsSection
                        formData={formData}
                        handleChange={handleChange}
                        visibleFields={visibleFields}
                    />

                    {/* App Bússola Astrológica */}
                    <BussolaSettingsSection
                        formData={formData}
                        handleChange={handleChange}
                        visibleFields={visibleFields}
                    />

                    {/* ManyChat API Key Section */}
                    <ManyChatTokensSection
                        formData={formData}
                        handleChange={handleChange}
                        visibleFields={visibleFields}
                    />

                    {/* Painel Unificado AgentFlow (Memória + Mensagens) */}
                    <AgentFlowSection
                        formData={formData}
                        handleChange={handleChange}
                        testingWebhook={testingWebhook}
                        handleTestWebhook={handleTestWebhook}
                        setShowMemoryLogsTable={setShowMemoryLogsTable}
                        setMemoryLogsPage={setMemoryLogsPage}
                        fetchMemoryLogs={fetchMemoryLogs}
                        testingChatWebhook={testingChatWebhook}
                        handleTestChatWebhook={handleTestChatWebhook}
                        setShowChatLogsTable={setShowChatLogsTable}
                        setChatLogsPage={setChatLogsPage}
                        fetchChatLogs={fetchChatLogs}
                    />
                </>
            )}

            {/* Modal de Logs de Sincronização de Memória */}
            <MemoryLogsModal
                showMemoryLogsTable={showMemoryLogsTable}
                setShowMemoryLogsTable={setShowMemoryLogsTable}
                loadingMemoryLogs={loadingMemoryLogs}
                fetchMemoryLogs={fetchMemoryLogs}
                setMemoryLogsPage={setMemoryLogsPage}
                memoryLogs={memoryLogs}
                memoryLogsPage={memoryLogsPage}
                memoryLogsLimit={memoryLogsLimit}
                memoryLogsTotal={memoryLogsTotal}
                setMemoryLogsLimit={setMemoryLogsLimit}
            />

            {/* Modal de Logs de Integração de Mensagens (AgentFlow) */}
            <ChatLogsModal
                showChatLogsTable={showChatLogsTable}
                setShowChatLogsTable={setShowChatLogsTable}
                loadingChatLogs={loadingChatLogs}
                fetchChatLogs={fetchChatLogs}
                setChatLogsPage={setChatLogsPage}
                chatLogs={chatLogs}
                chatLogsPage={chatLogsPage}
                chatLogsLimit={chatLogsLimit}
                chatLogsTotal={chatLogsTotal}
                setChatLogsLimit={setChatLogsLimit}
            />
        </div>
    );
};

export default AdvancedTab;

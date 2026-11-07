import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ActiveChatArea from './ActiveChatArea';

// Mocks para os subcomponentes
vi.mock('./ActiveChatHeader', () => ({
    default: () => <div data-testid="active-chat-header">Header Mock</div>
}));
vi.mock('./ActiveChatBanner', () => ({
    default: () => <div data-testid="active-chat-banner">Banner Mock</div>
}));
vi.mock('./FollowUpChatBanner', () => ({
    default: () => <div data-testid="follow-up-banner">FollowUp Mock</div>
}));
vi.mock('./ChatMessageList', () => ({
    default: () => <div data-testid="chat-message-list">Message List Mock</div>
}));
vi.mock('./ActiveChatInput', () => ({
    default: () => <div data-testid="active-chat-input">Input Mock</div>
}));

describe('ActiveChatArea Component', () => {
    const defaultProps = {
        selectedConvo: null,
        setSelectedConvo: vi.fn(),
        mediaUploader: {
            isDraggingFile: false,
            handleDragEnter: vi.fn(),
            handleDragOver: vi.fn(),
            handleDragLeave: vi.fn(),
            handleDrop: vi.fn(),
            handlePaste: vi.fn(),
            handleMediaUpload: vi.fn(),
            startRecording: vi.fn(),
            stopRecordingToPreview: vi.fn(),
            discardRecordedAudio: vi.fn(),
            sendRecordedAudio: vi.fn(),
            cancelRecording: vi.fn(),
            recordedAudio: null,
            isSendingAudio: false,
        },
        engine: {},
        showRightSidebar: false,
        setShowRightSidebar: vi.fn(),
        chatOps: {},
        setShowFunnelModal: vi.fn(),
        handleExportConversation: vi.fn(),
        activeClient: { id: 1 },
        noteAndAi: {},
        isSearchMode: false,
        setIsSearchMode: vi.fn(),
        isChatMaximized: false,
        setIsChatMaximized: vi.fn(),
        setIsCrmModalOpen: vi.fn(),
        setIsCancelFunnelModalOpen: vi.fn(),
        handleScrollMessages: vi.fn(),
        getMediaSrc: vi.fn(),
        formatMessageTimestamp: vi.fn(),
        replyingTo: null,
        setReplyingTo: vi.fn(),
        chatInputRef: { current: null },
        highlightedMsgId: null,
        setRetryTemplateMessage: vi.fn(),
        setShowTemplateModal: vi.fn(),
        setIsMaximizedInputOpen: vi.fn(),
    };

    it('renderiza o estado vazio quando nenhuma conversa estiver selecionada', () => {
        render(<ActiveChatArea {...defaultProps} selectedConvo={null} />);
        
        expect(screen.getByText('Área de Atendimento')).toBeInTheDocument();
        expect(screen.getByText('Selecione uma conversa para iniciar.')).toBeInTheDocument();
        expect(screen.queryByTestId('active-chat-header')).not.toBeInTheDocument();
    });

    it('renderiza os componentes de chat ativo quando uma conversa for selecionada', () => {
        const convo = { id: 10, contact_name: 'Cliente Teste' };
        render(<ActiveChatArea {...defaultProps} selectedConvo={convo} />);

        expect(screen.getByTestId('active-chat-header')).toBeInTheDocument();
        expect(screen.getByTestId('chat-message-list')).toBeInTheDocument();
        expect(screen.getByTestId('active-chat-input')).toBeInTheDocument();
        expect(screen.queryByText('Selecione uma conversa para iniciar.')).not.toBeInTheDocument();
    });

    it('exibe o banner de drop de arquivo quando isDraggingFile for true', () => {
        const propsWithDragging = {
            ...defaultProps,
            selectedConvo: { id: 10, contact_name: 'Cliente Teste' },
            mediaUploader: {
                ...defaultProps.mediaUploader,
                isDraggingFile: true,
            }
        };

        render(<ActiveChatArea {...propsWithDragging} />);

        expect(screen.getByText('Solte seu arquivo aqui para enviar')).toBeInTheDocument();
        expect(screen.getByText('Imagens, Vídeos, Áudios ou PDFs (Documentos)')).toBeInTheDocument();
    });
});

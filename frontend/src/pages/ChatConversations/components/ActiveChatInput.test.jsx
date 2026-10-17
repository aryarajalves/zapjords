import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActiveChatInput from './ActiveChatInput';

vi.mock('../hooks/useQuickReplies', () => ({
    useQuickReplies: () => ({
        isOpen: false,
        quickMessages: [],
        selectedIndex: 0,
        selectQuickMessage: vi.fn(),
        checkSlashTrigger: vi.fn(),
        handleKeyDown: vi.fn().mockReturnValue(false)
    })
}));

describe('ActiveChatInput Component', () => {
    let defaultProps;

    beforeEach(() => {
        defaultProps = {
            engine: {
                newMessage: '',
                setNewMessage: vi.fn(),
                handleSendMessage: vi.fn(),
                isSending: false,
                isRecording: false,
                timeLeft24h: '23h 59m',
                isLoadingMessages: false,
                audioSeconds: 0
            },
            selectedConvo: {
                id: 101,
                contact_name: 'Cliente Teste',
                phone: '5511999998888'
            },
            activeClientId: 1,
            replyingTo: null,
            setReplyingTo: vi.fn(),
            chatInputRef: { current: null },
            handleMediaUpload: vi.fn(),
            setShowTemplateModal: vi.fn(),
            setIsMaximizedInputOpen: vi.fn(),
            startRecording: vi.fn(),
            stopRecordingToPreview: vi.fn(),
            discardRecordedAudio: vi.fn(),
            sendRecordedAudio: vi.fn(),
            cancelRecording: vi.fn(),
            recordedAudio: null,
            isSendingAudio: false
        };
    });

    it('renders textarea with primary focus and proper placeholder', () => {
        render(<ActiveChatInput {...defaultProps} />);
        const textarea = screen.getByPlaceholderText(/Digite sua mensagem/i);
        expect(textarea).toBeInTheDocument();
    });

    it('displays closed window indicator in placeholder when 24h window is closed', () => {
        defaultProps.engine.timeLeft24h = 'Janela Fechada';
        render(<ActiveChatInput {...defaultProps} />);
        const textarea = screen.getByPlaceholderText(/Janela 24h fechada/i);
        expect(textarea).toBeInTheDocument();
        expect(textarea).toBeDisabled();
    });

    it('renders mobile actions toggle button (+)', () => {
        render(<ActiveChatInput {...defaultProps} />);
        const mobileToggleBtn = screen.getByTestId('mobile-actions-toggle-btn');
        expect(mobileToggleBtn).toBeInTheDocument();
    });

    it('toggles mobile actions dropdown when (+) button is clicked', () => {
        render(<ActiveChatInput {...defaultProps} />);
        const mobileToggleBtn = screen.getByTestId('mobile-actions-toggle-btn');
        
        // Initially closed
        expect(screen.queryByTestId('mobile-actions-dropdown')).not.toBeInTheDocument();

        // Open menu
        fireEvent.click(mobileToggleBtn);
        expect(screen.getByTestId('mobile-actions-dropdown')).toBeInTheDocument();
        expect(screen.getByText('Mídia ou Documento')).toBeInTheDocument();
        expect(screen.getByText('Template WhatsApp')).toBeInTheDocument();
        expect(screen.getByText('Maximizar campo')).toBeInTheDocument();

        // Close menu
        fireEvent.click(mobileToggleBtn);
        expect(screen.queryByTestId('mobile-actions-dropdown')).not.toBeInTheDocument();
    });

    it('triggers setShowTemplateModal when Template WhatsApp is selected in mobile menu', () => {
        render(<ActiveChatInput {...defaultProps} />);
        const mobileToggleBtn = screen.getByTestId('mobile-actions-toggle-btn');
        fireEvent.click(mobileToggleBtn);

        const templateBtn = screen.getByText('Template WhatsApp');
        fireEvent.click(templateBtn);
        expect(defaultProps.setShowTemplateModal).toHaveBeenCalledWith(true);
    });

    it('triggers setIsMaximizedInputOpen when Maximizar campo is selected in mobile menu', () => {
        render(<ActiveChatInput {...defaultProps} />);
        const mobileToggleBtn = screen.getByTestId('mobile-actions-toggle-btn');
        fireEvent.click(mobileToggleBtn);

        const maximizeBtn = screen.getByText('Maximizar campo');
        fireEvent.click(maximizeBtn);
        expect(defaultProps.setIsMaximizedInputOpen).toHaveBeenCalledWith(true);
    });

    it('shows microphone button when newMessage is empty and send button when text is typed', () => {
        const { rerender, container } = render(<ActiveChatInput {...defaultProps} />);
        expect(screen.getByTitle('Gravar áudio')).toBeInTheDocument();

        // Update newMessage with text
        defaultProps.engine.newMessage = 'Olá mundo';
        rerender(<ActiveChatInput {...defaultProps} />);
        expect(screen.queryByTitle('Gravar áudio')).not.toBeInTheDocument();
        const submitBtn = container.querySelector('button[type="submit"]');
        expect(submitBtn).toBeInTheDocument();
    });

    it('submits message on Enter without shift key', () => {
        defaultProps.engine.newMessage = 'Mensagem de teste';
        render(<ActiveChatInput {...defaultProps} />);
        const textarea = screen.getByPlaceholderText(/Digite sua mensagem/i);
        
        fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
        expect(defaultProps.engine.handleSendMessage).toHaveBeenCalledTimes(1);
    });
});

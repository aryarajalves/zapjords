// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, renderHook, act, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import MessageMediaContent from './components/ChatMessageBubble/MessageMediaContent';
import { useChatMediaUploader } from './hooks/useChatMediaUploader';
import * as AuthContextModule from '../../AuthContext';

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe('ChatConversations Media Drag Drop & Paste Utils', () => {
    const MEDIA_SIZE_LIMITS = {
        image:    5  * 1024 * 1024,  // 5 MB
        video:    16 * 1024 * 1024,  // 16 MB
        audio:    16 * 1024 * 1024,  // 16 MB
        document: 100 * 1024 * 1024, // 100 MB
    };

    const detectMessageType = (mimeType) => {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        return 'document';
    };

    it('identifica corretamente os tipos de mensagem por MIME', () => {
        expect(detectMessageType('image/png')).toBe('image');
        expect(detectMessageType('video/mp4')).toBe('video');
        expect(detectMessageType('audio/webm')).toBe('audio');
        expect(detectMessageType('application/pdf')).toBe('document');
        expect(detectMessageType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('document');
    });

    it('valida limites de tamanho para mídias', () => {
        const smallImg = { size: 2 * 1024 * 1024, type: 'image/png' };
        const hugeImg = { size: 10 * 1024 * 1024, type: 'image/png' };
        const hugePdf = { size: 120 * 1024 * 1024, type: 'application/pdf' };
        const validPdf = { size: 50 * 1024 * 1024, type: 'application/pdf' };

        expect(smallImg.size <= MEDIA_SIZE_LIMITS[detectMessageType(smallImg.type)]).toBe(true);
        expect(hugeImg.size <= MEDIA_SIZE_LIMITS[detectMessageType(hugeImg.type)]).toBe(false);
        expect(hugePdf.size <= MEDIA_SIZE_LIMITS[detectMessageType(hugePdf.type)]).toBe(false);
        expect(validPdf.size <= MEDIA_SIZE_LIMITS[detectMessageType(validPdf.type)]).toBe(true);
    });

    it('gerencia dragCounter sem flickering ao passar sobre sub-elementos', () => {
        let dragCounter = 0;
        let isDraggingFile = false;

        const onDragEnter = () => {
            dragCounter += 1;
            isDraggingFile = true;
        };

        const onDragLeave = () => {
            dragCounter -= 1;
            if (dragCounter <= 0) {
                dragCounter = 0;
                isDraggingFile = false;
            }
        };

        // Entrou na área do chat
        onDragEnter();
        expect(dragCounter).toBe(1);
        expect(isDraggingFile).toBe(true);

        // Passou por cima de um elemento filho (ex: mensagem ou botão)
        onDragEnter(); // enter no filho
        expect(dragCounter).toBe(2);
        expect(isDraggingFile).toBe(true);

        onDragLeave(); // leave no pai acionado pelo evento bubbling
        expect(dragCounter).toBe(1);
        expect(isDraggingFile).toBe(true); // Permanece TRUE (sem flickering!)

        // Soltou o arquivo ou saiu completamente da tela
        onDragLeave();
        expect(dragCounter).toBe(0);
        expect(isDraggingFile).toBe(false);
    });

    it('envia o filename original (comunidade.pdf) e a legenda no payload de sendMedia', async () => {
        const mockFile = new File(['%PDF-1.4'], 'comunidade.pdf', { type: 'application/pdf' });
        const caption = 'No documento acima explico um pouco melhor oq irá receber na black friday';

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                filename: 'a2a4c8a1-ab5b-4b76-9be7-c8b1e572583c.pdf',
                original_filename: 'comunidade.pdf',
                url: 'https://cdn.example.com/a2a4c8a1-ab5b-4b76-9be7-c8b1e572583c.pdf'
            })
        });

        const fetchWithAuthSpy = vi.spyOn(AuthContextModule, 'fetchWithAuth').mockResolvedValue({
            ok: true,
            json: async () => ({
                id: 999,
                conversation_id: 17880,
                message_type: 'document',
                content: caption,
                media_url: 'https://cdn.example.com/a2a4c8a1-ab5b-4b76-9be7-c8b1e572583c.pdf',
                meta_data: { filename: 'comunidade.pdf' }
            })
        });

        const engine = {
            setIsSendingMedia: vi.fn(),
            setMessages: vi.fn(),
            setShouldScrollToBottom: vi.fn(),
            setConversations: vi.fn(),
            setSelectedConvo: vi.fn(),
            loadConversationMedia: vi.fn(),
            loadConversations: vi.fn(),
            setMediaPreview: vi.fn(),
            setPreviewCaption: vi.fn(),
            setNewMessage: vi.fn()
        };

        const { result } = renderHook(() =>
            useChatMediaUploader({
                engine,
                selectedConvo: { id: 17880 },
                activeClient: { id: 1 },
                replyingTo: null,
                setReplyingTo: vi.fn()
            })
        );

        await act(async () => {
            await result.current.sendMedia(mockFile, 'document', caption);
        });

        expect(fetchWithAuthSpy).toHaveBeenCalledTimes(1);
        const [, requestInit] = fetchWithAuthSpy.mock.calls[0];
        const parsedBody = JSON.parse(requestInit.body);
        expect(parsedBody).toEqual({
            media_url: 'https://cdn.example.com/a2a4c8a1-ab5b-4b76-9be7-c8b1e572583c.pdf',
            message_type: 'document',
            caption,
            filename: 'comunidade.pdf'
        });
    });

    it('renderiza o nome original do documento e a legenda em MessageMediaContent', () => {
        const msg = {
            id: 999,
            message_type: 'document',
            media_url: 'https://cdn.example.com/a2a4c8a1-ab5b-4b76-9be7-c8b1e572583c.pdf',
            content: 'No documento acima explico um pouco melhor oq irá receber na black friday',
            meta_data: { filename: 'comunidade.pdf' }
        };

        render(<MessageMediaContent msg={msg} />);

        expect(screen.getByText('comunidade.pdf')).toBeInTheDocument();
        expect(
            screen.getByText('No documento acima explico um pouco melhor oq irá receber na black friday')
        ).toBeInTheDocument();
    });
});

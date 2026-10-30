import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ActiveChatHeader from '../pages/ChatConversations/components/ActiveChatHeader';
import ChatMessageBubble from '../pages/ChatConversations/components/ChatMessageBubble';

vi.mock('../AuthContext', () => ({
    useAuth: () => ({
        user: {
            id: 1,
            full_name: 'Aryaraj',
            email: 'aryarajmarketing@gmail.com'
        }
    })
}));

describe('Chat - Leitura Independente por Usuário e Identificação Interna do Remetente', () => {
    const baseEngine = {
        timeLeft24h: '23h 50m',
        isMarkingAsRead: false,
        handleMarkAsRead: vi.fn(),
        handleToggleStatus: vi.fn(),
        handleToggleArchive: vi.fn(),
        setIsBlockModalOpen: vi.fn(),
        availableAgents: [
            { id: 1, full_name: 'Aryaraj', email: 'aryarajmarketing@gmail.com' },
            { id: 2, full_name: 'Jordão', email: 'jordao@zapvoice.com' }
        ]
    };

    it('exibe o botão "Marcar como lida" no cabeçalho da conversa aberta quando há mensagens não lidas e aciona handleMarkAsRead', () => {
        const selectedConvo = {
            id: 55,
            phone: '555192424528',
            contact_name: 'Cliente Teste',
            status: 'open',
            unread_count: 3,
            labels: []
        };

        render(
            <ActiveChatHeader
                selectedConvo={selectedConvo}
                setSelectedConvo={vi.fn()}
                showRightSidebar={false}
                setShowRightSidebar={vi.fn()}
                engine={baseEngine}
                handleTogglePin={vi.fn()}
                handleToggleUrgent={vi.fn()}
                handleUnblockContact={vi.fn()}
                setShowFunnelModal={vi.fn()}
                exportConversationToDoc={vi.fn()}
                activeClientId={14}
            />
        );

        const markReadBtn = screen.getByTestId('chat-header-mark-read-btn');
        expect(markReadBtn).toBeInTheDocument();
        expect(markReadBtn.textContent).toContain('Marcar como lida (3)');

        fireEvent.click(markReadBtn);
        expect(baseEngine.handleMarkAsRead).toHaveBeenCalledWith(selectedConvo);
    });

    it('exibe o botão "Marcar como não lida" no cabeçalho quando unread_count é 0 e aciona handleMarkAsUnread', () => {
        const selectedConvo = {
            id: 55,
            phone: '555192424528',
            contact_name: 'Cliente Teste',
            status: 'open',
            unread_count: 0,
            labels: []
        };
        const engineWithUnread = {
            ...baseEngine,
            handleMarkAsUnread: vi.fn()
        };

        render(
            <ActiveChatHeader
                selectedConvo={selectedConvo}
                setSelectedConvo={vi.fn()}
                showRightSidebar={false}
                setShowRightSidebar={vi.fn()}
                engine={engineWithUnread}
                handleTogglePin={vi.fn()}
                handleToggleUrgent={vi.fn()}
                handleUnblockContact={vi.fn()}
                setShowFunnelModal={vi.fn()}
                exportConversationToDoc={vi.fn()}
                activeClientId={14}
            />
        );

        const markUnreadBtn = screen.getByTestId('chat-header-mark-unread-btn');
        expect(markUnreadBtn).toBeInTheDocument();
        expect(markUnreadBtn.textContent).toContain('Marcar como não lida');

        fireEvent.click(markUnreadBtn);
        expect(engineWithUnread.handleMarkAsUnread).toHaveBeenCalledWith(selectedConvo);
    });

    it('exibe "Eu" nas mensagens enviadas pelo próprio usuário logado (user_id === currentUser.id)', () => {
        const myMsg = {
            id: 101,
            sender_type: 'user',
            user_id: 1,
            sender_name: 'Aryaraj',
            message_type: 'text',
            content: 'Mensagem enviada por mim',
            timestamp: new Date().toISOString()
        };

        render(
            <ChatMessageBubble
                msg={myMsg}
                selectedConvo={{ id: 55, contact_name: 'Cliente' }}
                allMessages={[myMsg]}
                getMediaSrc={() => ''}
                formatMessageTimestamp={() => '10:30'}
                engine={baseEngine}
            />
        );

        const senderLabel = screen.getByTestId('message-sender-label');
        expect(senderLabel).toBeInTheDocument();
        expect(senderLabel.textContent).toBe('Eu');
    });

    it('exibe o nome do outro usuário (ex: "Jordão") nas mensagens enviadas por outro membro da equipe', () => {
        const otherUserMsg = {
            id: 102,
            sender_type: 'user',
            user_id: 2,
            sender_name: 'Jordão',
            message_type: 'text',
            content: 'Mensagem enviada pelo Jordão',
            timestamp: new Date().toISOString()
        };

        render(
            <ChatMessageBubble
                msg={otherUserMsg}
                selectedConvo={{ id: 55, contact_name: 'Cliente' }}
                allMessages={[otherUserMsg]}
                getMediaSrc={() => ''}
                formatMessageTimestamp={() => '10:31'}
                engine={baseEngine}
            />
        );

        const senderLabel = screen.getByTestId('message-sender-label');
        expect(senderLabel).toBeInTheDocument();
        expect(senderLabel.textContent).toBe('Jordão');
    });

    it('exibe "Automação" nas mensagens automáticas de funil/template sem user_id e não exibe em mensagens do contato', () => {
        const autoMsg = {
            id: 103,
            sender_type: 'user',
            user_id: null,
            message_type: 'text',
            content: 'Template automático',
            meta_data: { is_template: true, template_name: 'boas_vindas' },
            timestamp: new Date().toISOString()
        };

        const { unmount } = render(
            <ChatMessageBubble
                msg={autoMsg}
                selectedConvo={{ id: 55, contact_name: 'Cliente' }}
                allMessages={[autoMsg]}
                getMediaSrc={() => ''}
                formatMessageTimestamp={() => '10:32'}
                engine={baseEngine}
            />
        );

        expect(screen.getByTestId('message-sender-label').textContent).toBe('Automação');
        unmount();

        const contactMsg = {
            id: 104,
            sender_type: 'contact',
            message_type: 'text',
            content: 'Oi, quero saber mais',
            timestamp: new Date().toISOString()
        };

        render(
            <ChatMessageBubble
                msg={contactMsg}
                selectedConvo={{ id: 55, contact_name: 'Cliente' }}
                allMessages={[contactMsg]}
                getMediaSrc={() => ''}
                formatMessageTimestamp={() => '10:33'}
                engine={baseEngine}
            />
        );

        expect(screen.queryByTestId('message-sender-label')).not.toBeInTheDocument();
    });

    it('ao enviar mensagem ou quando chega mensagem de atendente (sender_type === "user"), o botão do cabeçalho reflete estado zerado / lido', () => {
        // Conversa que antes tinha 3 não lidas, após resposta de qualquer atendente tem unread_count zerado
        const convoAfterReply = {
            id: 55,
            phone: '555192424528',
            contact_name: 'Cliente Teste',
            status: 'open',
            unread_count: 0,
            labels: []
        };

        render(
            <ActiveChatHeader
                selectedConvo={convoAfterReply}
                setSelectedConvo={vi.fn()}
                showRightSidebar={false}
                setShowRightSidebar={vi.fn()}
                engine={baseEngine}
                handleTogglePin={vi.fn()}
                handleToggleUrgent={vi.fn()}
                handleUnblockContact={vi.fn()}
                setShowFunnelModal={vi.fn()}
                exportConversationToDoc={vi.fn()}
                activeClientId={14}
            />
        );

        const markUnreadBtn = screen.getByTestId('chat-header-mark-unread-btn');
        expect(markUnreadBtn).toBeInTheDocument();
        expect(markUnreadBtn.textContent).toContain('Marcar como não lida');
        expect(markUnreadBtn.textContent).not.toContain('Marcar como lida (');
    });
});

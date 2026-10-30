import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatMediaAndDocs } from './useChatMediaAndDocs';
import { useChatConversationOpen } from './useChatConversationOpen';
import { useChatEffects } from './useChatEffects';
import { useChatMessageScroller } from './useChatMessageScroller';

vi.mock('../../../AuthContext', () => ({
  fetchWithAuth: vi.fn()
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

import { fetchWithAuth } from '../../../AuthContext';
import { toast } from 'react-hot-toast';

describe('useChatMediaAndDocs sub-hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar com valores vazios quando não houver selectedConvo', () => {
    const { result } = renderHook(() => useChatMediaAndDocs({
      activeClient: { id: 1 },
      selectedConvo: null,
      setPrivateNote: vi.fn()
    }));

    expect(result.current.mediaData.total_all).toBe(0);
    expect(result.current.isMediaModalOpen).toBe(false);
    expect(result.current.isLoadingMedia).toBe(false);
  });

  it('deve carregar dados de mídia quando selectedConvo for fornecido', async () => {
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        total_media: 2,
        total_docs: 1,
        total_links: 0,
        total_notes: 0,
        total_all: 3,
        media: [{ id: 1 }, { id: 2 }],
        docs: [{ id: 3 }],
        links: [],
        notes: []
      })
    });

    const setPrivateNote = vi.fn();
    const { result } = renderHook(() => useChatMediaAndDocs({
      activeClient: { id: 1 },
      selectedConvo: { id: 456 },
      setPrivateNote
    }));

    expect(setPrivateNote).toHaveBeenCalledWith('');
    await act(async () => {
      await result.current.loadConversationMedia(456);
    });

    expect(result.current.mediaData.total_media).toBe(2);
    expect(result.current.mediaData.total_all).toBe(3);
  });
});

describe('useChatConversationOpen sub-hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve selecionar conversa imediatamente se já estiver na memória', async () => {
    const existing = { id: 10, contact_name: 'Maria' };
    const setSelectedConvo = vi.fn();
    const setConversations = vi.fn();

    const { result } = renderHook(() => useChatConversationOpen({
      activeClient: { id: 1 },
      conversations: [existing],
      setConversations,
      setSelectedConvo
    }));

    await act(async () => {
      await result.current.openConversationById(10);
    });

    expect(setSelectedConvo).toHaveBeenCalledWith(existing);
    expect(toast.success).toHaveBeenCalledWith('Abrindo conversa de Maria');
  });

  it('deve buscar conversa via API se não estiver em memória', async () => {
    const setSelectedConvo = vi.fn();
    const setConversations = vi.fn();

    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 20, contact_name: 'João' })
    });

    const { result } = renderHook(() => useChatConversationOpen({
      activeClient: { id: 1 },
      conversations: [],
      setConversations,
      setSelectedConvo
    }));

    await act(async () => {
      await result.current.openConversationById(20);
    });

    expect(fetchWithAuth).toHaveBeenCalled();
    expect(setSelectedConvo).toHaveBeenCalledWith({ id: 20, contact_name: 'João' });
    expect(toast.success).toHaveBeenCalledWith('Abrindo conversa de João');
  });
});

describe('useChatEffects sub-hook - pipeline/kanban filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve recarregar conversas quando filterPipelineId ou filterPipelineStageId mudarem', () => {
    const mockEngine = {
      loadConversations: vi.fn(),
      loadAvailableLabels: vi.fn(),
      loadAvailableAgents: vi.fn(),
      loadPipelines: vi.fn(),
      setTimeLeft24h: vi.fn(),
      page: 1,
      limit: 20,
      selectedConvoIds: []
    };
    const setSelectAllPages = vi.fn();
    const setExcludedConvoIds = vi.fn();

    const initialProps = {
      engine: mockEngine,
      setSelectAllPages,
      setExcludedConvoIds,
      filterInPipeline: false,
      filterPipelineId: null,
      filterPipelineStageId: null,
      activeTab: 'todos',
      statusFilter: 'open',
      activeClient: { id: 1 },
      chatInputRef: { current: null }
    };

    const { rerender } = renderHook((props) => useChatEffects(props), {
      initialProps
    });

    expect(mockEngine.loadConversations).toHaveBeenCalledWith(true);
    expect(mockEngine.loadConversations).toHaveBeenCalledTimes(1);

    // Altera filterPipelineId (seleciona pipeline "Teste 02")
    rerender({
      ...initialProps,
      filterInPipeline: true,
      filterPipelineId: 3
    });

    expect(mockEngine.loadConversations).toHaveBeenCalledTimes(2);
    expect(setSelectAllPages).toHaveBeenCalledWith(false);

    // Altera filterPipelineStageId (seleciona coluna "Desistencia")
    rerender({
      ...initialProps,
      filterInPipeline: true,
      filterPipelineId: 3,
      filterPipelineStageId: 18
    });

    expect(mockEngine.loadConversations).toHaveBeenCalledTimes(3);
  });
});

describe('useChatMessageScroller sub-hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve rolar automaticamente para a última mensagem ao abrir a conversa quando as mensagens concluem o carregamento', () => {
    const mockContainer = {
      scrollTop: 0,
      scrollHeight: 1500,
      clientHeight: 500
    };
    const mockEnd = {
      scrollIntoView: vi.fn()
    };
    const setShowScrollBtn = vi.fn();
    const setShowScrollTopBtn = vi.fn();
    const setShouldScrollToBottom = vi.fn();

    const engine = {
      messagesContainerRef: { current: mockContainer },
      messagesEndRef: { current: mockEnd },
      isLoadingMessages: false,
      messages: [{ id: 1, content: 'Oi' }, { id: 2, content: 'Tudo bem?' }],
      shouldScrollToBottom: false,
      hasMoreMessages: false,
      setShowScrollBtn,
      setShowScrollTopBtn,
      setShouldScrollToBottom
    };

    renderHook(() => useChatMessageScroller({
      engine,
      selectedConvo: { id: 99 },
      setIsSearchMode: vi.fn(),
      setHighlightedMsgId: vi.fn(),
      activeClient: { id: 1 }
    }));

    // Verifica que o container rolou para o final (scrollHeight)
    expect(mockContainer.scrollTop).toBe(1500);
    expect(mockEnd.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto' });
    expect(setShowScrollBtn).toHaveBeenCalledWith(false);
  });

  it('NÃO deve forçar a rolagem para baixo se o usuário estiver rolando para cima e receber nova mensagem de contato', () => {
    const mockContainer = {
      scrollTop: 200,
      scrollHeight: 1500,
      clientHeight: 500
    };
    const mockEnd = {
      scrollIntoView: vi.fn()
    };
    const setShowScrollBtn = vi.fn();
    const setShowScrollTopBtn = vi.fn();
    const setShouldScrollToBottom = vi.fn();

    const engine = {
      messagesContainerRef: { current: mockContainer },
      messagesEndRef: { current: mockEnd },
      isLoadingMessages: false,
      messages: [{ id: 1, sender_type: 'contact', content: 'Mensagem antiga' }],
      shouldScrollToBottom: false,
      hasMoreMessages: true,
      setShowScrollBtn,
      setShowScrollTopBtn,
      setShouldScrollToBottom,
      loadMoreMessages: vi.fn()
    };

    const { result, rerender } = renderHook(
      (props) => useChatMessageScroller(props),
      {
        initialProps: {
          engine,
          selectedConvo: { id: 99 },
          setIsSearchMode: vi.fn(),
          setHighlightedMsgId: vi.fn(),
          activeClient: { id: 1 }
        }
      }
    );

    // 1. Simula usuário rolando a tela para cima após a abertura (distância do fundo = 1500 - 200 - 500 = 800px > 120px)
    mockContainer.scrollTop = 200;
    setShowScrollBtn.mockClear();
    result.current.handleScrollMessages();
    expect(setShowScrollBtn).toHaveBeenCalledWith(true);

    mockEnd.scrollIntoView.mockClear();

    // 2. Chega uma mensagem de contato enquanto o usuário está lendo no topo
    const updatedEngine = {
      ...engine,
      messages: [
        { id: 1, sender_type: 'contact', content: 'Mensagem antiga' },
        { id: 2, sender_type: 'contact', content: 'Nova do contato' }
      ],
      shouldScrollToBottom: true
    };

    rerender({
      engine: updatedEngine,
      selectedConvo: { id: 99 },
      setIsSearchMode: vi.fn(),
      setHighlightedMsgId: vi.fn(),
      activeClient: { id: 1 }
    });

    // O scrollIntoView NÃO deve ter sido chamado para puxar para baixo
    expect(mockEnd.scrollIntoView).not.toHaveBeenCalled();
    expect(setShouldScrollToBottom).toHaveBeenCalledWith(false);
  });

  it('deve rolar para baixo se a nova mensagem for enviada pelo próprio operador (user)', () => {
    const mockContainer = {
      scrollTop: 200,
      scrollHeight: 1500,
      clientHeight: 500
    };
    const mockEnd = {
      scrollIntoView: vi.fn()
    };
    const setShowScrollBtn = vi.fn();
    const setShowScrollTopBtn = vi.fn();
    const setShouldScrollToBottom = vi.fn();

    const engine = {
      messagesContainerRef: { current: mockContainer },
      messagesEndRef: { current: mockEnd },
      isLoadingMessages: false,
      messages: [{ id: 1, sender_type: 'contact', content: 'Mensagem antiga' }],
      shouldScrollToBottom: false,
      hasMoreMessages: true,
      setShowScrollBtn,
      setShowScrollTopBtn,
      setShouldScrollToBottom,
      loadMoreMessages: vi.fn()
    };

    const { result, rerender } = renderHook(
      (props) => useChatMessageScroller(props),
      {
        initialProps: {
          engine,
          selectedConvo: { id: 99 },
          setIsSearchMode: vi.fn(),
          setHighlightedMsgId: vi.fn(),
          activeClient: { id: 1 }
        }
      }
    );

    result.current.handleScrollMessages();
    mockEnd.scrollIntoView.mockClear();

    // Operador envia mensagem
    const updatedEngine = {
      ...engine,
      messages: [
        { id: 1, sender_type: 'contact', content: 'Mensagem antiga' },
        { id: 2, sender_type: 'user', content: 'Resposta do operador' }
      ],
      shouldScrollToBottom: true
    };

    rerender({
      engine: updatedEngine,
      selectedConvo: { id: 99 },
      setIsSearchMode: vi.fn(),
      setHighlightedMsgId: vi.fn(),
      activeClient: { id: 1 }
    });

    expect(mockEnd.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto' });
  });
});

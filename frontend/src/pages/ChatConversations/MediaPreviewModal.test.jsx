import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import MediaPreviewModal from './MediaPreviewModal';

vi.mock('react-icons/fi', () => ({
    FiX: () => <span data-testid="icon-x" />,
    FiSend: () => <span data-testid="icon-send" />,
    FiRefreshCw: () => <span data-testid="icon-refresh" />,
    FiFileText: () => <span data-testid="icon-file-text" />,
    FiMusic: () => <span data-testid="icon-music" />,
    FiMaximize2: () => <span data-testid="icon-maximize" />,
    FiMinimize2: () => <span data-testid="icon-minimize" />,
}));

describe('MediaPreviewModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('não renderiza quando mediaPreview é nulo', () => {
        const { container } = render(<MediaPreviewModal mediaPreview={null} />);
        expect(container.firstChild).toBeNull();
    });

    it('renderiza preview de imagem corretamente', () => {
        const mediaPreview = {
            messageType: 'image',
            localUrl: 'blob:http://localhost/fake-img',
            file: new File(['fake'], 'foto.jpg', { type: 'image/jpeg' }),
        };

        render(
            <MediaPreviewModal
                mediaPreview={mediaPreview}
                previewCaption="Minha foto"
                setPreviewCaption={vi.fn()}
                isSendingMedia={false}
                onClose={vi.fn()}
                onSend={vi.fn()}
            />
        );

        expect(screen.getByText('🖼️ Enviar Imagem')).toBeInTheDocument();
        expect(screen.getByAltText('Preview')).toHaveAttribute('src', 'blob:http://localhost/fake-img');
        expect(screen.getByDisplayValue('Minha foto')).toBeInTheDocument();
    });

    it('renderiza preview de documento/PDF corretamente com tamanho', () => {
        const mediaPreview = {
            messageType: 'document',
            localUrl: 'blob:http://localhost/fake-pdf',
            file: new File([new ArrayBuffer(1024 * 1024 * 2)], 'documento.pdf', { type: 'application/pdf' }),
        };

        render(
            <MediaPreviewModal
                mediaPreview={mediaPreview}
                previewCaption=""
                setPreviewCaption={vi.fn()}
                isSendingMedia={false}
                onClose={vi.fn()}
                onSend={vi.fn()}
            />
        );

        expect(screen.getByText('📄 Enviar Documento')).toBeInTheDocument();
        expect(screen.getByText('documento.pdf')).toBeInTheDocument();
        expect(screen.getByText('2.00 MB')).toBeInTheDocument();
    });

    it('renderiza preview de áudio corretamente com player', () => {
        const mediaPreview = {
            messageType: 'audio',
            localUrl: 'blob:http://localhost/fake-audio',
            file: new File(['fake'], 'audio.mp3', { type: 'audio/mp3' }),
        };

        render(
            <MediaPreviewModal
                mediaPreview={mediaPreview}
                previewCaption="Áudio explicativo"
                setPreviewCaption={vi.fn()}
                isSendingMedia={false}
                onClose={vi.fn()}
                onSend={vi.fn()}
            />
        );

        expect(screen.getByText('🎵 Enviar Áudio')).toBeInTheDocument();
        expect(screen.getByText('audio.mp3')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Áudio explicativo')).toBeInTheDocument();
    });

    it('chama onSend ao clicar no botão de enviar', () => {
        const onSend = vi.fn();
        const mediaPreview = {
            messageType: 'image',
            localUrl: 'blob:http://localhost/fake-img',
            file: new File(['fake'], 'foto.jpg', { type: 'image/jpeg' }),
        };

        render(
            <MediaPreviewModal
                mediaPreview={mediaPreview}
                previewCaption="Legenda"
                setPreviewCaption={vi.fn()}
                isSendingMedia={false}
                onClose={vi.fn()}
                onSend={onSend}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /Enviar/i }));
        expect(onSend).toHaveBeenCalledTimes(1);
    });

    it('permite maximizar o campo de legenda para textarea e minimizar novamente', () => {
        const mediaPreview = {
            messageType: 'image',
            localUrl: 'blob:http://localhost/fake-img',
            file: new File(['fake'], 'foto.jpg', { type: 'image/jpeg' }),
        };

        render(
            <MediaPreviewModal
                mediaPreview={mediaPreview}
                previewCaption="Texto inicial da legenda"
                setPreviewCaption={vi.fn()}
                isSendingMedia={false}
                onClose={vi.fn()}
                onSend={vi.fn()}
            />
        );

        // No estado compacto, deve renderizar o input de texto
        const inputCompacto = screen.getByDisplayValue('Texto inicial da legenda');
        expect(inputCompacto.tagName).toBe('INPUT');

        // Clica no botão de Maximizar
        const maximizeBtns = screen.getAllByRole('button', { name: /maximizar/i });
        expect(maximizeBtns.length).toBeGreaterThan(0);
        fireEvent.click(maximizeBtns[0]);

        // Agora deve renderizar um textarea com a legenda
        const textareaExpandido = screen.getByDisplayValue('Texto inicial da legenda');
        expect(textareaExpandido.tagName).toBe('TEXTAREA');
        expect(screen.getByText(/caracteres/i)).toBeInTheDocument();
        expect(screen.getByText(/Ctrl \+ Enter/i)).toBeInTheDocument();

        // Clica no botão de Minimizar
        const minimizeBtns = screen.getAllByRole('button', { name: /minimizar/i });
        expect(minimizeBtns.length).toBeGreaterThan(0);
        fireEvent.click(minimizeBtns[0]);

        // Volta a ser um input
        const inputRestaurado = screen.getByDisplayValue('Texto inicial da legenda');
        expect(inputRestaurado.tagName).toBe('INPUT');
    });

    it('dispara onSend com Ctrl + Enter no textarea maximizado', () => {
        const onSend = vi.fn();
        const mediaPreview = {
            messageType: 'image',
            localUrl: 'blob:http://localhost/fake-img',
            file: new File(['fake'], 'foto.jpg', { type: 'image/jpeg' }),
        };

        render(
            <MediaPreviewModal
                mediaPreview={mediaPreview}
                previewCaption="Texto para enviar"
                setPreviewCaption={vi.fn()}
                isSendingMedia={false}
                onClose={vi.fn()}
                onSend={onSend}
            />
        );

        // Maximizar
        const maximizeBtn = screen.getAllByRole('button', { name: /maximizar/i })[0];
        fireEvent.click(maximizeBtn);

        const textarea = screen.getByDisplayValue('Texto para enviar');
        fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
        expect(onSend).toHaveBeenCalledTimes(1);
    });
});

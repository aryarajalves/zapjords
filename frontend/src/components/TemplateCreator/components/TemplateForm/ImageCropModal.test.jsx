import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImageCropModal } from './ImageCropModal';

describe('ImageCropModal Component', () => {
    const mockOnClose = vi.fn();
    const mockOnCropComplete = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock HTMLCanvasElement.prototype.getContext and toBlob
        HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
            fillStyle: '',
            fillRect: vi.fn(),
            drawImage: vi.fn()
        }));
        HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
            callback(new Blob(['fake-image'], { type: 'image/jpeg' }));
        });
        global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/fake-crop-url');
    });

    it('não renderiza nada quando isOpen é false', () => {
        const { container } = render(
            <ImageCropModal
                isOpen={false}
                onClose={mockOnClose}
                imageSrc="data:image/png;base64,sample"
                onCropComplete={mockOnCropComplete}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('não renderiza nada se imageSrc for nulo', () => {
        const { container } = render(
            <ImageCropModal
                isOpen={true}
                onClose={mockOnClose}
                imageSrc={null}
                onCropComplete={mockOnCropComplete}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renderiza corretamente com informações de proporção 1.91:1 e resolução 1200x628', () => {
        render(
            <ImageCropModal
                isOpen={true}
                onClose={mockOnClose}
                imageSrc="https://example.com/test.jpg"
                onCropComplete={mockOnCropComplete}
            />
        );

        expect(screen.getByText('Enquadrar Mídia do Cabeçalho')).toBeInTheDocument();
        expect(screen.getAllByText(/1.91:1/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/1200 x 628 px/i)).toBeInTheDocument();
        expect(screen.getByText('Arraste para mover')).toBeInTheDocument();
        expect(screen.getByText('Centralizar')).toBeInTheDocument();
        expect(screen.getByText('Aplicar Enquadramento')).toBeInTheDocument();
    });

    it('permite alterar o zoom pelo slider', () => {
        render(
            <ImageCropModal
                isOpen={true}
                onClose={mockOnClose}
                imageSrc="https://example.com/test.jpg"
                onCropComplete={mockOnCropComplete}
            />
        );

        const zoomSlider = screen.getByRole('slider');
        expect(zoomSlider).toBeInTheDocument();
        expect(zoomSlider.value).toBe('1');

        fireEvent.change(zoomSlider, { target: { value: '2' } });
        expect(zoomSlider.value).toBe('2');
        expect(screen.getByText('2.0x')).toBeInTheDocument();
    });

    it('chama onClose ao clicar em Cancelar', () => {
        render(
            <ImageCropModal
                isOpen={true}
                onClose={mockOnClose}
                imageSrc="https://example.com/test.jpg"
                onCropComplete={mockOnCropComplete}
            />
        );

        const cancelButton = screen.getByRole('button', { name: /cancelar/i });
        fireEvent.click(cancelButton);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('executa crop e chama onCropComplete ao clicar em Aplicar Enquadramento', () => {
        render(
            <ImageCropModal
                isOpen={true}
                onClose={mockOnClose}
                imageSrc="https://example.com/test.jpg"
                fileName="meu_banner.png"
                onCropComplete={mockOnCropComplete}
            />
        );

        const applyButton = screen.getByRole('button', { name: /aplicar enquadramento/i });
        fireEvent.click(applyButton);

        expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();
        expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalled();
        expect(mockOnCropComplete).toHaveBeenCalledWith(
            expect.any(File),
            'blob:http://localhost/fake-crop-url'
        );
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
});

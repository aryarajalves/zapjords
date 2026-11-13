// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ReactFlowProvider } from 'reactflow';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import MediaNode from './MediaNode';

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

// Mock useClient context
vi.mock('../../../contexts/ClientContext', () => ({
    useClient: () => ({
        activeClient: { id: 1, chatwoot_url: 'http://test.com' }
    })
}));

// Mock ExpandTextModal
vi.mock('../../BulkSender/common/ExpandTextModal', () => {
    return {
        default: ({ isOpen, onClose, title, value, onSave, fieldKey }) => {
            if (!isOpen) return null;
            return (
                <div data-testid="expand-text-modal">
                    <h3>{title}</h3>
                    <textarea 
                        data-testid="modal-textarea" 
                        defaultValue={value} 
                        onChange={() => {}}
                    />
                    <button onClick={onClose}>Cancelar</button>
                    <button onClick={() => { onSave(fieldKey, 'Legenda atualizada pelo modal'); onClose(); }}>
                        SALVAR ALTERAÇÕES
                    </button>
                </div>
            );
        }
    };
});

describe('MediaNode', () => {
    const mockOnChange = vi.fn();
    const mockData = {
        mediaUrl: 'http://test.com/image.jpg',
        mediaType: 'image',
        fileName: 'image.jpg',
        caption: 'Legenda original',
        onChange: mockOnChange,
        isStart: false,
        onDelete: vi.fn(),
        onSetStart: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renderiza a legenda e botão de maximizar', () => {
        render(
            <ReactFlowProvider>
                <MediaNode id="node-media-1" data={mockData} />
            </ReactFlowProvider>
        );

        expect(screen.getByText('Legenda (Opcional)')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Legenda original')).toBeInTheDocument();
        expect(screen.getByTitle('Maximizar Legenda')).toBeInTheDocument();
    });

    test('abre o modal ao clicar no botão de maximizar e atualiza o valor', () => {
        render(
            <ReactFlowProvider>
                <MediaNode id="node-media-1" data={mockData} />
            </ReactFlowProvider>
        );

        const maximizeBtn = screen.getByTitle('Maximizar Legenda');
        fireEvent.click(maximizeBtn);

        expect(screen.getByTestId('expand-text-modal')).toBeInTheDocument();
        expect(screen.getByText('Legenda da Mídia')).toBeInTheDocument();

        fireEvent.click(screen.getByText('SALVAR ALTERAÇÕES'));

        expect(mockOnChange).toHaveBeenCalledWith('node-media-1', { caption: 'Legenda atualizada pelo modal' });
    });

    test('salva o nome original do documento (comunidade.pdf) ao fazer upload em vez do UUID do storage', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                filename: '7b73f61f-6762-4697-aaa8-14f97abdcbb1.pdf',
                original_filename: 'comunidade.pdf',
                url: 'http://test.com/7b73f61f-6762-4697-aaa8-14f97abdcbb1.pdf'
            })
        });

        const emptyData = {
            mediaUrl: null,
            mediaType: null,
            fileName: null,
            caption: '',
            onChange: mockOnChange,
            isStart: false,
            onDelete: vi.fn(),
            onSetStart: vi.fn()
        };

        const { container } = render(
            <ReactFlowProvider>
                <MediaNode id="node-media-doc" data={emptyData} />
            </ReactFlowProvider>
        );

        const fileInput = container.querySelector('input[type="file"]');
        const pdfFile = new File(['%PDF-1.4'], 'comunidade.pdf', { type: 'application/pdf' });

        fireEvent.change(fileInput, { target: { files: [pdfFile] } });

        await waitFor(() => {
            expect(mockOnChange).toHaveBeenCalledWith('node-media-doc', {
                mediaUrl: 'http://test.com/7b73f61f-6762-4697-aaa8-14f97abdcbb1.pdf',
                fileName: 'comunidade.pdf',
                mediaType: 'document'
            });
        });
    });
});

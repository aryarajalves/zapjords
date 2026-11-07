import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductPromptsManager from '../ProductPromptsManager';

describe('ProductPromptsManager Component', () => {
    const mockPresets = [
        { id: 1, name: 'Geral (Vendas)', prompt_text: 'Prompt geral para vendas.', is_default: true },
        { id: 2, name: 'Bússola Astrológica', prompt_text: 'Prompt para venda de mapa astral.', is_default: false }
    ];

    it('renderiza os produtos cadastrados e destaca o produto ativo', () => {
        render(
            <ProductPromptsManager
                presets={mockPresets}
                activePresetId={1}
                setActivePresetId={vi.fn()}
                onSavePreset={vi.fn()}
                onCreatePreset={vi.fn()}
                onDeletePreset={vi.fn()}
                onSetDefaultPreset={vi.fn()}
                onRestoreDefault={vi.fn()}
                defaultPromptBase="Prompt base"
                isSaving={false}
            />
        );

        expect(screen.getByText('Geral (Vendas)')).toBeInTheDocument();
        expect(screen.getByText('Bússola Astrológica')).toBeInTheDocument();
        expect(screen.getByText(/Padrão Comercial/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('Prompt geral para vendas.')).toBeInTheDocument();
    });

    it('permite alternar para outro produto ao clicar na aba', () => {
        const setActive = vi.fn();
        render(
            <ProductPromptsManager
                presets={mockPresets}
                activePresetId={1}
                setActivePresetId={setActive}
                onSavePreset={vi.fn()}
                onCreatePreset={vi.fn()}
                onDeletePreset={vi.fn()}
                onSetDefaultPreset={vi.fn()}
                onRestoreDefault={vi.fn()}
                defaultPromptBase="Prompt base"
                isSaving={false}
            />
        );

        fireEvent.click(screen.getByText('Bússola Astrológica'));
        expect(setActive).toHaveBeenCalledWith(2);
    });

    it('abre o modal maximizado em tela cheia ao clicar em Maximizar Editor', () => {
        render(
            <ProductPromptsManager
                presets={mockPresets}
                activePresetId={1}
                setActivePresetId={vi.fn()}
                onSavePreset={vi.fn()}
                onCreatePreset={vi.fn()}
                onDeletePreset={vi.fn()}
                onSetDefaultPreset={vi.fn()}
                onRestoreDefault={vi.fn()}
                defaultPromptBase="Prompt base"
                isSaving={false}
            />
        );

        const maxBtn = screen.getByTitle(/Maximizar para tela cheia/i);
        fireEvent.click(maxBtn);

        expect(screen.getByText(/Editor em Tela Cheia/i)).toBeInTheDocument();
        expect(screen.getByText(/Fechar Tela Cheia/i)).toBeInTheDocument();
    });
});

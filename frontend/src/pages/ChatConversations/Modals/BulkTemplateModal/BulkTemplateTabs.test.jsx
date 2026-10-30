import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BulkTemplateTabs from './BulkTemplateTabs';

describe('BulkTemplateTabs Component', () => {
    it('renderiza todas as abas com labels corretas e badge de contatos', () => {
        render(
            <BulkTemplateTabs
                activeTab="template"
                onTabChange={vi.fn()}
                recipientCount={8}
            />
        );

        expect(screen.getByText('Template & Mensagem')).toBeInTheDocument();
        expect(screen.getByText('Ações & Envio')).toBeInTheDocument();
        expect(screen.getByText('Contatos')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('chama onTabChange ao clicar em uma aba diferente', () => {
        const onTabChange = vi.fn();
        render(
            <BulkTemplateTabs
                activeTab="template"
                onTabChange={onTabChange}
                recipientCount={5}
            />
        );

        fireEvent.click(screen.getByText('Ações & Envio'));
        expect(onTabChange).toHaveBeenCalledWith('settings');

        fireEvent.click(screen.getByText('Contatos'));
        expect(onTabChange).toHaveBeenCalledWith('recipients');
    });
});

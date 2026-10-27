import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ContactLabelsSection from './ContactLabelsSection';

describe('ContactLabelsSection Component', () => {
    it('renderiza o título "Etiquetas do Contato" e aviso de que aplica no contato e não na conversa', () => {
        render(
            <ContactLabelsSection
                chatwootLabels={[]}
                selectedContactLabels={[]}
                setSelectedContactLabels={vi.fn()}
            />
        );

        expect(screen.getByText('Etiquetas do Contato')).toBeInTheDocument();
        expect(screen.getByText(/Aplica diretamente no contato \(e não na conversa\)/i)).toBeInTheDocument();
    });

    it('exibe etiquetas selecionadas como badges e permite remover ao clicar no botão fechar', () => {
        const mockSetSelected = vi.fn();
        render(
            <ContactLabelsSection
                chatwootLabels={['Lead Quente', 'VIP']}
                selectedContactLabels={['VIP', 'Lead Quente']}
                setSelectedContactLabels={mockSetSelected}
            />
        );

        expect(screen.getByText('VIP')).toBeInTheDocument();
        expect(screen.getByText('Lead Quente')).toBeInTheDocument();
        expect(screen.getByText('2 etiquetas')).toBeInTheDocument();

        // Botões de remover (FiX)
        const removeButtons = screen.getAllByTitle('Remover etiqueta');
        expect(removeButtons).toHaveLength(2);

        fireEvent.click(removeButtons[0]); // Remove 'VIP'
        expect(mockSetSelected).toHaveBeenCalledWith(['Lead Quente']);
    });

    it('permite digitar uma nova etiqueta e adicioná-la com Enter ou botão Adicionar', () => {
        const mockSetSelected = vi.fn();
        render(
            <ContactLabelsSection
                chatwootLabels={[]}
                selectedContactLabels={[]}
                setSelectedContactLabels={mockSetSelected}
            />
        );

        const input = screen.getByPlaceholderText(/Selecione ou digite uma etiqueta para o contato/i);
        fireEvent.change(input, { target: { value: 'Comprador' } });

        const addBtn = screen.getByText('Adicionar');
        fireEvent.click(addBtn);

        expect(mockSetSelected).toHaveBeenCalledWith(['Comprador']);
    });

    it('limita o tamanho da etiqueta para no máximo 25 caracteres', () => {
        const mockSetSelected = vi.fn();
        render(
            <ContactLabelsSection
                chatwootLabels={[]}
                selectedContactLabels={[]}
                setSelectedContactLabels={mockSetSelected}
            />
        );

        const input = screen.getByPlaceholderText(/Selecione ou digite uma etiqueta para o contato/i);
        const longText = 'EssaEtiquetaTemMaisDeVinteECincoCaracteres';
        fireEvent.change(input, { target: { value: longText } });

        expect(input.value.length).toBeLessThanOrEqual(25);
        expect(screen.getByText('25/25 caracteres')).toBeInTheDocument();

        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
        expect(mockSetSelected).toHaveBeenCalledWith([longText.slice(0, 25)]);
    });

    it('permite selecionar etiqueta existente nas sugestões', () => {
        const mockSetSelected = vi.fn();
        render(
            <ContactLabelsSection
                chatwootLabels={[{ title: 'Interesse Mentoria' }]}
                selectedContactLabels={[]}
                setSelectedContactLabels={mockSetSelected}
            />
        );

        const input = screen.getByPlaceholderText(/Selecione ou digite uma etiqueta para o contato/i);
        fireEvent.focus(input);

        const suggestion = screen.getByText('Interesse Mentoria');
        expect(suggestion).toBeInTheDocument();

        fireEvent.click(suggestion);
        expect(mockSetSelected).toHaveBeenCalledWith(['Interesse Mentoria']);
    });

    it('exibe e filtra as etiquetas do CRM (Base de Leads) nas sugestões do dropdown', () => {
        const mockSetSelected = vi.fn();
        const crmLabels = [
            { id: 'Compra Aprovada', title: 'Compra Aprovada' },
            { id: 'Formulario', title: 'Formulario' },
            { id: 'Leitura Concluida', title: 'Leitura Concluida' }
        ];

        render(
            <ContactLabelsSection
                chatwootLabels={crmLabels}
                selectedContactLabels={[]}
                setSelectedContactLabels={mockSetSelected}
            />
        );

        const input = screen.getByPlaceholderText(/Selecione ou digite uma etiqueta para o contato/i);
        fireEvent.focus(input);

        // Todas as 3 etiquetas da Base de Leads devem estar visíveis nas opções
        expect(screen.getByText('Compra Aprovada')).toBeInTheDocument();
        expect(screen.getByText('Formulario')).toBeInTheDocument();
        expect(screen.getByText('Leitura Concluida')).toBeInTheDocument();

        // Ao digitar "form", deve filtrar para mostrar apenas "Formulario"
        fireEvent.change(input, { target: { value: 'form' } });
        expect(screen.getByText('Formulario')).toBeInTheDocument();
        expect(screen.queryByText('Compra Aprovada')).not.toBeInTheDocument();

        fireEvent.click(screen.getByText('Formulario'));
        expect(mockSetSelected).toHaveBeenCalledWith(['Formulario']);
    });
});

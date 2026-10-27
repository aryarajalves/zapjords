import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PipelineModal } from '../components/PipelineModal';

describe('PipelineModal Component', () => {
    const mockProducts = [
        { id: 1, name: 'Mentoria Elite', price: 2500.00 },
        { id: 2, name: 'Bussola Astrologica', price: 1497.00 },
    ];

    it('não renderiza nada quando isOpen é false', () => {
        const { container } = render(
            <PipelineModal isOpen={false} onClose={vi.fn()} onSave={vi.fn()} />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renderiza título de criação e dropdown de produtos quando pipelineToEdit é null', () => {
        render(
            <PipelineModal
                isOpen={true}
                onClose={vi.fn()}
                onSave={vi.fn()}
                pipelineToEdit={null}
                products={mockProducts}
            />
        );

        expect(screen.getByText('Novo Pipeline de Vendas')).toBeInTheDocument();
        // Dropdown de produto está presente
        const productSelect = screen.getByRole('combobox');
        expect(productSelect).toBeInTheDocument();
        expect(screen.getByText('Mentoria Elite - R$ 2.500,00')).toBeInTheDocument();
        expect(screen.getByText('Bussola Astrologica - R$ 1.497,00')).toBeInTheDocument();

        // Não deve renderizar botão de excluir na criação
        expect(screen.queryByText('Excluir Pipeline')).not.toBeInTheDocument();
    });

    it('ao selecionar um produto do dropdown, preenche o valor padrão automaticamente', () => {
        render(
            <PipelineModal
                isOpen={true}
                onClose={vi.fn()}
                onSave={vi.fn()}
                pipelineToEdit={null}
                products={mockProducts}
            />
        );

        const productSelect = screen.getByRole('combobox');
        fireEvent.change(productSelect, { target: { value: 'Bussola Astrologica' } });

        expect(productSelect.value).toBe('Bussola Astrologica');
        const priceInput = screen.getByPlaceholderText('0.00');
        expect(priceInput.value).toBe('1497');
    });

    it('renderiza botão "Excluir Pipeline" quando pipelineToEdit é fornecido e chama onDelete', () => {
        const mockDelete = vi.fn();
        const pipelineToEdit = {
            id: 10,
            name: 'Pipeline Teste',
            product_name: 'Mentoria Elite',
            default_value: 2500.0,
            is_default: false
        };

        render(
            <PipelineModal
                isOpen={true}
                onClose={vi.fn()}
                onSave={vi.fn()}
                onDelete={mockDelete}
                pipelineToEdit={pipelineToEdit}
                products={mockProducts}
            />
        );

        expect(screen.getByText('Editar Pipeline de Produto')).toBeInTheDocument();
        const deleteBtn = screen.getByRole('button', { name: /excluir pipeline/i });
        expect(deleteBtn).toBeInTheDocument();

        fireEvent.click(deleteBtn);
        expect(mockDelete).toHaveBeenCalledWith(10, 'Pipeline Teste');
    });

    it('submete o formulário chamando onSave com os dados configurados', async () => {
        const mockSave = vi.fn();
        render(
            <PipelineModal
                isOpen={true}
                onClose={vi.fn()}
                onSave={mockSave}
                pipelineToEdit={null}
                products={mockProducts}
            />
        );

        const nameInput = screen.getByPlaceholderText(/Ex: Mentoria Elite/i);
        fireEvent.change(nameInput, { target: { value: 'Funil Black Friday' } });

        const productSelect = screen.getByRole('combobox');
        fireEvent.change(productSelect, { target: { value: 'Mentoria Elite' } });

        const submitBtn = screen.getByRole('button', { name: /salvar pipeline/i });
        fireEvent.click(submitBtn);

        expect(mockSave).toHaveBeenCalledWith({
            name: 'Funil Black Friday',
            product_name: 'Mentoria Elite',
            associated_tags: null,
            default_value: 2500,
            is_default: false
        });
    });
});

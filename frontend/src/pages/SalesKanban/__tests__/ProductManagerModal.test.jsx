import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductManagerModal } from '../components/ProductManagerModal';

const mockProducts = [
    {
        id: 1,
        name: 'Astrowake',
        price: 1497.00,
        description: 'Curso completo de formação'
    },
    {
        id: 2,
        name: 'Mentoria VIP',
        price: 6000.00,
        description: 'Acompanhamento individualizado'
    }
];

describe('ProductManagerModal Component', () => {
    it('não renderiza quando isOpen é false', () => {
        const { container } = render(
            <ProductManagerModal
                isOpen={false}
                onClose={vi.fn()}
                products={mockProducts}
                onCreateProduct={vi.fn()}
                onUpdateProduct={vi.fn()}
                onDeleteProduct={vi.fn()}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renderiza lista de produtos e preços formatados', () => {
        render(
            <ProductManagerModal
                isOpen={true}
                onClose={vi.fn()}
                products={mockProducts}
                onCreateProduct={vi.fn()}
                onUpdateProduct={vi.fn()}
                onDeleteProduct={vi.fn()}
            />
        );

        expect(screen.getByText('Produtos da Empresa')).toBeInTheDocument();
        expect(screen.getByText('Astrowake')).toBeInTheDocument();
        expect(screen.getByText('Mentoria VIP')).toBeInTheDocument();
        expect(screen.getByText(/1\.497/)).toBeInTheDocument();
        expect(screen.getByText(/6\.000/)).toBeInTheDocument();
    });

    it('abre formulário de cadastro e chama onCreateProduct', async () => {
        const handleCreate = vi.fn().mockResolvedValue({});
        render(
            <ProductManagerModal
                isOpen={true}
                onClose={vi.fn()}
                products={mockProducts}
                onCreateProduct={handleCreate}
                onUpdateProduct={vi.fn()}
                onDeleteProduct={vi.fn()}
            />
        );

        const addBtn = screen.getByText('+ Cadastrar Novo Produto');
        fireEvent.click(addBtn);

        expect(screen.getByPlaceholderText(/Ex: Astrowake/i)).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText(/Ex: Astrowake/i), {
            target: { value: 'Novo Curso' }
        });
        fireEvent.change(screen.getByPlaceholderText(/1497,00/i), {
            target: { value: '497' }
        });

        const submitBtn = screen.getByText('Cadastrar Produto');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(handleCreate).toHaveBeenCalledWith({
                name: 'Novo Curso',
                price: 497,
                description: null
            });
        });
    });

    it('exibe confirmação e chama onDeleteProduct ao confirmar', async () => {
        const handleDelete = vi.fn().mockResolvedValue({});
        render(
            <ProductManagerModal
                isOpen={true}
                onClose={vi.fn()}
                products={mockProducts}
                onCreateProduct={vi.fn()}
                onUpdateProduct={vi.fn()}
                onDeleteProduct={handleDelete}
            />
        );

        // Clica no botão de excluir do primeiro item
        const deleteButtons = screen.getAllByTitle('Excluir Produto');
        fireEvent.click(deleteButtons[0]);

        // Aparece pergunta "Excluir?" e botão "Sim"
        expect(screen.getByText('Excluir?')).toBeInTheDocument();
        const confirmYesBtn = screen.getByText('Sim');
        fireEvent.click(confirmYesBtn);

        await waitFor(() => {
            expect(handleDelete).toHaveBeenCalledWith(1);
        });
    });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CreateUserModal } from './CreateUserModal';

vi.mock('react-hot-toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
        dismiss: vi.fn()
    }
}));

describe('CreateUserModal Component', () => {
    const mockOnClose = vi.fn();
    const mockOnUserCreated = vi.fn();
    const mockClients = [
        { id: 1, name: 'Cliente Alpha' },
        { id: 2, name: 'Cliente Beta' }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it('does not render when isOpen is false', () => {
        render(
            <CreateUserModal
                isOpen={false}
                onClose={mockOnClose}
                clients={mockClients}
                onUserCreated={mockOnUserCreated}
            />
        );
        expect(screen.queryByText('Criar Novo Usuário')).not.toBeInTheDocument();
    });

    it('renders all required form fields when isOpen is true', () => {
        render(
            <CreateUserModal
                isOpen={true}
                onClose={mockOnClose}
                clients={mockClients}
                onUserCreated={mockOnUserCreated}
            />
        );

        expect(screen.getByText('Criar Novo Usuário')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Ex: João da Silva')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('joao@exemplo.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Ex: 5511999998888')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Mínimo de 12 caracteres/i)).toBeInTheDocument();
        expect(screen.getByText('Mínimo 12 caracteres')).toBeInTheDocument();
        expect(screen.getByText('Letra minúscula (a-z)')).toBeInTheDocument();
        expect(screen.getByText('Letra maiúscula (A-Z)')).toBeInTheDocument();
        expect(screen.getByText('Número (0-9)')).toBeInTheDocument();
        expect(screen.getByText(/Caractere especial/i)).toBeInTheDocument();
    });

    it('validates password requirements interactively and enables submit button only when valid', async () => {
        render(
            <CreateUserModal
                isOpen={true}
                onClose={mockOnClose}
                clients={mockClients}
                onUserCreated={mockOnUserCreated}
            />
        );

        const nameInput = screen.getByPlaceholderText('Ex: João da Silva');
        const emailInput = screen.getByPlaceholderText('joao@exemplo.com');
        const phoneInput = screen.getByPlaceholderText('Ex: 5511999998888');
        const passwordInput = screen.getByPlaceholderText(/Mínimo de 12 caracteres/i);
        const submitBtn = screen.getByRole('button', { name: /Criar Usuário/i });

        // Preenche dados básicos
        fireEvent.change(nameInput, { target: { value: 'Carlos Silva' } });
        fireEvent.change(emailInput, { target: { value: 'carlos@teste.com' } });
        fireEvent.change(phoneInput, { target: { value: '5511988887777' } });

        // Senha curta (< 12 caracteres)
        fireEvent.change(passwordInput, { target: { value: 'Senha123!' } });
        expect(submitBtn).toBeDisabled();

        // Senha com 12+ caracteres sem maiúscula
        fireEvent.change(passwordInput, { target: { value: 'senhaforte123!' } });
        expect(submitBtn).toBeDisabled();

        // Senha com 12+ caracteres sem minúscula
        fireEvent.change(passwordInput, { target: { value: 'SENHAFORTE123!' } });
        expect(submitBtn).toBeDisabled();

        // Senha com 12+ caracteres sem número
        fireEvent.change(passwordInput, { target: { value: 'SenhaForteSemNumero!' } });
        expect(submitBtn).toBeDisabled();

        // Senha com 12+ caracteres sem especial
        fireEvent.change(passwordInput, { target: { value: 'SenhaForte123456' } });
        expect(submitBtn).toBeDisabled();

        // Senha 100% válida atendendo aos 5 requisitos
        fireEvent.change(passwordInput, { target: { value: 'SenhaForte2026!@#' } });
        expect(submitBtn).not.toBeDisabled();
    });

    it('submits form with correct data and triggers callbacks on success', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'User created successfully', user_id: 42 })
        });

        render(
            <CreateUserModal
                isOpen={true}
                onClose={mockOnClose}
                clients={mockClients}
                onUserCreated={mockOnUserCreated}
            />
        );

        fireEvent.change(screen.getByPlaceholderText('Ex: João da Silva'), {
            target: { value: 'Maria Oliveira' }
        });
        fireEvent.change(screen.getByPlaceholderText('joao@exemplo.com'), {
            target: { value: 'maria@teste.com' }
        });
        fireEvent.change(screen.getByPlaceholderText('Ex: 5511999998888'), {
            target: { value: '5511999991111' }
        });
        fireEvent.change(screen.getByPlaceholderText(/Mínimo de 12 caracteres/i), {
            target: { value: 'SenhaSegura123!@#' }
        });

        const submitBtn = screen.getByRole('button', { name: /Criar Usuário/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/auth/register'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
                        full_name: 'Maria Oliveira',
                        email: 'maria@teste.com',
                        phone: '5511999991111',
                        password: 'SenhaSegura123!@#',
                        role: 'admin',
                        client_ids: [1, 2]
                    })
                })
            );
        });

        await waitFor(() => {
            expect(mockOnClose).toHaveBeenCalled();
            expect(mockOnUserCreated).toHaveBeenCalled();
        });
    });
});

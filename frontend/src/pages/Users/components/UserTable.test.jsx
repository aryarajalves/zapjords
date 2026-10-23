import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UserTable, { formatBrasiliaDateTime } from './UserTable';

describe('UserTable Component & Brasília DateTime Formatter', () => {
    describe('formatBrasiliaDateTime helper', () => {
        it('returns dashes for null, undefined or empty string', () => {
            expect(formatBrasiliaDateTime(null)).toEqual({ date: '—', time: '—' });
            expect(formatBrasiliaDateTime(undefined)).toEqual({ date: '—', time: '—' });
            expect(formatBrasiliaDateTime('')).toEqual({ date: '—', time: '—' });
            expect(formatBrasiliaDateTime('data_invalida')).toEqual({ date: '—', time: '—' });
        });

        it('correctly converts UTC to Brasília time (UTC-3)', () => {
            // 2026-10-23T13:30:00Z em UTC corresponde a 2026-10-23 10:30:00 no Horário de Brasília
            const utcDate = '2026-10-23T13:30:00Z';
            const formatted = formatBrasiliaDateTime(utcDate);
            expect(formatted.date).toBe('23/10/2026');
            expect(formatted.time).toBe('10:30:00');
        });
    });

    describe('UserTable rendering', () => {
        const mockUsers = [
            {
                id: 1,
                full_name: 'Ana Silva',
                email: 'ana@teste.com',
                phone: '5511999998888',
                role: 'admin',
                is_active: true,
                created_at: '2026-05-15T15:45:30Z' // 12:45:30 em Brasília
            },
            {
                id: 2,
                full_name: 'Carlos Vendedor',
                email: 'carlos@teste.com',
                phone: null,
                role: 'vendedor',
                seller_weight: 3,
                is_active: false,
                created_at: '2026-08-20T21:10:00Z' // 18:10:00 em Brasília
            }
        ];

        it('renders the "Criado em" table header', () => {
            render(
                <UserTable
                    users={mockUsers}
                    handleOpenEditModal={vi.fn()}
                    confirmDeleteUser={vi.fn()}
                    currentPage={1}
                    setCurrentPage={vi.fn()}
                    itemsPerPage={5}
                    setItemsPerPage={vi.fn()}
                />
            );

            expect(screen.getByText('Criado em')).toBeInTheDocument();
            expect(screen.getByText('Nome / Email')).toBeInTheDocument();
            expect(screen.getByText('Cargo')).toBeInTheDocument();
            expect(screen.getByText('Status')).toBeInTheDocument();
        });

        it('renders users creation dates and times in Brasília timezone', () => {
            render(
                <UserTable
                    users={mockUsers}
                    handleOpenEditModal={vi.fn()}
                    confirmDeleteUser={vi.fn()}
                    currentPage={1}
                    setCurrentPage={vi.fn()}
                    itemsPerPage={5}
                    setItemsPerPage={vi.fn()}
                />
            );

            // Usuário 1: 15/05/2026 12:45:30
            expect(screen.getByText('15/05/2026')).toBeInTheDocument();
            expect(screen.getByText('12:45:30')).toBeInTheDocument();

            // Usuário 2: 20/08/2026 18:10:00
            expect(screen.getByText('20/08/2026')).toBeInTheDocument();
            expect(screen.getByText('18:10:00')).toBeInTheDocument();
        });

        it('renders empty message when no users match', () => {
            render(
                <UserTable
                    users={[]}
                    handleOpenEditModal={vi.fn()}
                    confirmDeleteUser={vi.fn()}
                    currentPage={1}
                    setCurrentPage={vi.fn()}
                    itemsPerPage={5}
                    setItemsPerPage={vi.fn()}
                />
            );

            expect(screen.getByText('Nenhum usuário encontrado com os filtros aplicados.')).toBeInTheDocument();
        });
    });
});

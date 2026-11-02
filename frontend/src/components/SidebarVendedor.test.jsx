import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Sidebar from './Sidebar';

vi.mock('../AuthContext', () => ({
  useAuth: () => ({ user: { role: 'vendedor' } }),
}));

vi.mock('../contexts/ClientContext', () => ({
  useClient: () => ({
    activeClient: { id: 14, name: 'Cliente - Crassus' },
    clients: [{ id: 14, name: 'Cliente - Crassus' }],
  }),
}));

describe('Sidebar - Permissões do Vendedor', () => {
  const vendedorUser = {
    id: 5,
    email: 'vendedor@empresa.com',
    full_name: 'Hokage Vendedor',
    role: 'vendedor',
  };

  it('deve exibir Kanban de Vendas, Disparo em Massa, Contatos e Atendimento para o vendedor', () => {
    render(
      <Sidebar
        activeView="sales_kanban"
        onViewChange={vi.fn()}
        onLogout={vi.fn()}
        onSettings={vi.fn()}
        user={vendedorUser}
        clientName="Cliente - Crassus"
      />
    );

    // Bolinha verde + Bolinha amarela permitidas
    expect(screen.getByText('Kanban de Vendas')).toBeInTheDocument();
    expect(screen.getByText('Atendimento')).toBeInTheDocument();
    expect(screen.getAllByText('Contatos').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Disparo em Massa')).toBeInTheDocument();
    expect(screen.getByText('Criar Template')).toBeInTheDocument();
    expect(screen.getByText('Leads Quentes')).toBeInTheDocument();

    // Telas administrativas restritas que NÃO devem aparecer
    expect(screen.queryByText('Desempenho da Equipe')).not.toBeInTheDocument();
    expect(screen.queryByText('Financeiro')).not.toBeInTheDocument();
    expect(screen.queryByText('Gestão de Usuários')).not.toBeInTheDocument();
    expect(screen.queryByText('Infraestrutura')).not.toBeInTheDocument();
  });
});

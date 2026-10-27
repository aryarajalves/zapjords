import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchableFunnelSelect from './SearchableFunnelSelect';

describe('SearchableFunnelSelect Component', () => {
  const mockFunnels = [
    { id: 10, name: 'Funil de Vendas Quentes', is_active: true },
    { id: 20, name: 'Funil Boas Vindas', is_active: true },
    { id: 30, name: 'Promoção Especial Astrologia', is_active: true },
    { id: 40, name: 'Descadastro / Bloqueio', is_active: false }
  ];

  it('deve renderizar o input de busca quando nenhum funil estiver selecionado', () => {
    render(
      <SearchableFunnelSelect
        value=""
        onChange={vi.fn()}
        funnels={mockFunnels}
        placeholder="Buscar funil..."
      />
    );

    expect(screen.getByPlaceholderText('Buscar funil...')).toBeInTheDocument();
  });

  it('deve abrir a lista de funis ao focar no input de busca', () => {
    render(
      <SearchableFunnelSelect
        value=""
        onChange={vi.fn()}
        funnels={mockFunnels}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    expect(screen.getByText('Funil de Vendas Quentes')).toBeInTheDocument();
    expect(screen.getByText('Funil Boas Vindas')).toBeInTheDocument();
  });

  it('deve filtrar os funis em tempo real ao digitar o nome', () => {
    render(
      <SearchableFunnelSelect
        value=""
        onChange={vi.fn()}
        funnels={mockFunnels}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Vendas' } });

    expect(screen.getByText('Funil de Vendas Quentes')).toBeInTheDocument();
    expect(screen.queryByText('Funil Boas Vindas')).not.toBeInTheDocument();
    expect(screen.queryByText('Promoção Especial Astrologia')).not.toBeInTheDocument();
  });

  it('deve filtrar ignorando acentuação e maiúsculas/minúsculas', () => {
    render(
      <SearchableFunnelSelect
        value=""
        onChange={vi.fn()}
        funnels={mockFunnels}
      />
    );

    const input = screen.getByRole('textbox');
    // Digita "promocao" sem acento e minúsculo
    fireEvent.change(input, { target: { value: 'promocao' } });

    expect(screen.getByText('Promoção Especial Astrologia')).toBeInTheDocument();
    expect(screen.queryByText('Funil de Vendas Quentes')).not.toBeInTheDocument();
  });

  it('deve exibir mensagem quando nenhum funil corresponder à busca', () => {
    render(
      <SearchableFunnelSelect
        value=""
        onChange={vi.fn()}
        funnels={mockFunnels}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'InexistenteXYZ' } });

    expect(screen.getByText(/Nenhum funil encontrado/i)).toBeInTheDocument();
  });

  it('deve chamar onChange ao clicar em um funil da lista', () => {
    const onChangeMock = vi.fn();
    render(
      <SearchableFunnelSelect
        value=""
        onChange={onChangeMock}
        funnels={mockFunnels}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    const option = screen.getByText('Funil Boas Vindas');
    fireEvent.click(option);

    expect(onChangeMock).toHaveBeenCalledWith(20);
  });

  it('deve exibir o card com o funil selecionado e permitir trocar', () => {
    const onChangeMock = vi.fn();
    const { rerender } = render(
      <SearchableFunnelSelect
        value={10}
        onChange={onChangeMock}
        funnels={mockFunnels}
      />
    );

    expect(screen.getByText('Funil de Vendas Quentes')).toBeInTheDocument();
    expect(screen.getByText('#10')).toBeInTheDocument();

    // Clicar no botão limpar / remover
    const removeBtn = screen.getByTitle('Remover funil selecionado');
    fireEvent.click(removeBtn);

    expect(onChangeMock).toHaveBeenCalledWith('');
  });

  it('deve exibir a opção emptyLabel quando fornecida', () => {
    const onChangeMock = vi.fn();
    render(
      <SearchableFunnelSelect
        value=""
        onChange={onChangeMock}
        funnels={mockFunnels}
        emptyLabel="Nenhum funil (apenas bloquear)"
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    const emptyOption = screen.getByText(/Nenhum funil \(apenas bloquear\)/i);
    expect(emptyOption).toBeInTheDocument();

    fireEvent.click(emptyOption);
    expect(onChangeMock).toHaveBeenCalledWith('');
  });
});

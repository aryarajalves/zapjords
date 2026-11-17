import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  isVariableEmpty,
  isVariableNumeric,
  isNotRealName,
  matchesVarFilterMode,
} from './VariableActionModal';
import ContactTableToolbar from './ContactTable/ContactTableToolbar';
import ContactTable from './ContactTable';

describe('Filtros de Valores de Variáveis (Vazios, Só Números e Não parece nome)', () => {
  it('identifica corretamente valores vazios, somente números e valores que não parecem nomes reais', () => {
    expect(isVariableEmpty('')).toBe(true);
    expect(isVariableEmpty('   ')).toBe(true);
    expect(isVariableEmpty('Cinthia')).toBe(false);

    expect(isVariableNumeric('5585999999999')).toBe(true);
    expect(isVariableNumeric('(85) 99999-9999')).toBe(true);
    expect(isVariableNumeric('Cinthia')).toBe(false);

    // Nomes reais devem retornar false em isNotRealName
    expect(isNotRealName('Cinthia')).toBe(false);
    expect(isNotRealName('José Silva')).toBe(false);
    expect(isNotRealName('Mireille')).toBe(false);
    expect(isNotRealName("Ana D'Ávila")).toBe(false);
    // Links válidos (outra variável) não devem ser classificados como nome inválido
    expect(isNotRealName('https://bussolaappfront.aryaraj.shop/cadastro?token=abc')).toBe(false);

    // Valores suspeitos que não parecem nome real
    expect(isNotRealName('teste')).toBe(true);
    expect(isNotRealName('Cliente')).toBe(true);
    expect(isNotRealName('Sem Nome')).toBe(true);
    expect(isNotRealName('user123')).toBe(true);
    expect(isNotRealName('...')).toBe(true);
    expect(isNotRealName('❤️')).toBe(true);
    expect(isNotRealName('a')).toBe(true);
    expect(isNotRealName('kkkk')).toBe(true);
    expect(isNotRealName('@usuario')).toBe(true);

    expect(matchesVarFilterMode('teste', 'not_real_name')).toBe(true);
    expect(matchesVarFilterMode('Cinthia', 'not_real_name')).toBe(false);
  });

  it('renderiza os 3 botões de filtro na ContactTableToolbar e dispara o filtro ao clicar', () => {
    const toggleQuickVarFilter = vi.fn();
    render(
      <ContactTableToolbar
        hasVariables={true}
        quickVarFilter="all"
        toggleQuickVarFilter={toggleQuickVarFilter}
        quickFilterStats={{ empty: 2, numeric: 1, not_real_name: 3 }}
        showContactTags={false}
        isLoadingTags={false}
        toggleShowContactTags={vi.fn()}
      />
    );

    const emptyBtn = screen.getByRole('button', { name: /Vazios/i });
    const numericBtn = screen.getByRole('button', { name: /Só Números/i });
    const notNameBtn = screen.getByRole('button', { name: /Não parece nome/i });

    expect(emptyBtn).toHaveTextContent('2');
    expect(numericBtn).toHaveTextContent('1');
    expect(notNameBtn).toHaveTextContent('3');

    fireEvent.click(notNameBtn);
    expect(toggleQuickVarFilter).toHaveBeenCalledWith('not_real_name');
  });

  it('filtra os contatos na ContactTable ao clicar em Vazios, Só Números e Não parece nome', () => {
    const contacts = [
      { phone: '5511999990001', name: 'Cinthia', status: 'pending', vars: { '1': 'Cinthia' } },
      { phone: '5511999990002', name: '', status: 'pending', vars: { '1': '' } },
      { phone: '5511999990003', name: '5511988887777', status: 'pending', vars: { '1': '5511988887777' } },
      { phone: '5511999990004', name: 'teste', status: 'pending', vars: { '1': 'teste' } },
    ];

    render(
      <ContactTable
        displayedContacts={contacts}
        filteredContacts={contacts}
        activeVarColumns={[{ key: '1', label: '{{1}}' }]}
        removeContact={vi.fn()}
        unblockContact={vi.fn()}
        setDisplayLimit={vi.fn()}
        setVariableFilters={vi.fn()}
        setContacts={vi.fn()}
      />
    );

    expect(screen.getByText('5511999990001')).toBeInTheDocument();
    expect(screen.getByText('5511999990004')).toBeInTheDocument();

    // Filtrar Vazios
    fireEvent.click(screen.getByRole('button', { name: /Vazios/i }));
    expect(screen.getByText('5511999990002')).toBeInTheDocument();
    expect(screen.queryByText('5511999990001')).not.toBeInTheDocument();

    // Filtrar Só Números
    fireEvent.click(screen.getByRole('button', { name: /Só Números/i }));
    expect(screen.getByText('5511999990003')).toBeInTheDocument();
    expect(screen.queryByText('5511999990002')).not.toBeInTheDocument();

    // Filtrar Não parece nome
    fireEvent.click(screen.getByRole('button', { name: /Não parece nome/i }));
    expect(screen.getByText('5511999990004')).toBeInTheDocument();
    expect(screen.queryByText('5511999990001')).not.toBeInTheDocument();

    // Limpar filtro volta a mostrar todos
    fireEvent.click(screen.getByRole('button', { name: /Limpar filtro/i }));
    expect(screen.getByText('5511999990001')).toBeInTheDocument();
    expect(screen.getByText('5511999990004')).toBeInTheDocument();
  });
});

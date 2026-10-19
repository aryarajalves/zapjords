import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BussolaSettingsSection from './BussolaSettingsSection';

// Mocks necessários
vi.mock('../../../../AuthContext', () => ({
  fetchWithAuth: vi.fn(),
}));

vi.mock('../../../../contexts/ClientContext', () => ({
  useClient: () => ({ activeClient: { id: 1, name: 'Cliente Teste' } }),
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('BussolaSettingsSection', () => {
  const defaultFormData = {
    BUSSOLA_API_URL: 'https://api.bussolaastrologica.com.br',
    BUSSOLA_API_KEY: 'bussola_ext_sec_teste123',
  };

  it('exibe explicitamente o badge Backend (API) e o card explicativo de Endpoint do Backend', () => {
    render(
      <BussolaSettingsSection
        formData={defaultFormData}
        handleChange={vi.fn()}
        visibleFields={{}}
      />
    );

    // Badge visual de Backend
    expect(screen.getByText('Backend (API)')).toBeDefined();

    // Rótulo principal
    expect(screen.getByText('URL Base da API da Bússola')).toBeDefined();

    // Caixinha explicativa e helper text com Endpoint do Backend
    expect(screen.getAllByText(/Endpoint do Backend:/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/onde a rota/i)).toBeDefined();

    // Subtítulo do card com menção ao backend
    expect(screen.getByText(/Configure a API do Backend do App Bússola/i)).toBeDefined();

    // Valor nos inputs
    expect(screen.getByDisplayValue('https://api.bussolaastrologica.com.br')).toBeDefined();
    expect(screen.getByDisplayValue('bussola_ext_sec_teste123')).toBeDefined();
  });

  it('chama handleChange ao alterar a URL do backend da Bússola', () => {
    const handleChange = vi.fn();
    render(
      <BussolaSettingsSection
        formData={defaultFormData}
        handleChange={handleChange}
        visibleFields={{}}
      />
    );

    const apiUrlInput = screen.getByDisplayValue('https://api.bussolaastrologica.com.br');
    fireEvent.change(apiUrlInput, { target: { name: 'BUSSOLA_API_URL', value: 'http://localhost:8005' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('alterna visualização da chave ao clicar no botão de olho', () => {
    render(
      <BussolaSettingsSection
        formData={defaultFormData}
        handleChange={vi.fn()}
        visibleFields={{}}
      />
    );

    const keyInput = screen.getByDisplayValue('bussola_ext_sec_teste123');
    // Inicialmente oculto com disc
    expect(keyInput.style.WebkitTextSecurity).toBe('disc');

    const toggleButton = screen.getByTitle('Visualizar');
    fireEvent.click(toggleButton);

    // Após o clique, deve exibir normalmente
    expect(keyInput.style.WebkitTextSecurity).toBe('');
  });
});

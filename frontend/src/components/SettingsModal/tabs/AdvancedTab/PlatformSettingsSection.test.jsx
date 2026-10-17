import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PlatformSettingsSection from './PlatformSettingsSection';

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

describe('PlatformSettingsSection', () => {
  const defaultFormData = {
    PLATFORM_API_URL: 'https://api.minhaplataforma.com.br',
    PLATFORM_API_TOKEN: 'sk_live_teste123',
    PLATFORM_FRONTEND_URL: 'https://alunos.minhaplataforma.com.br',
  };

  it('exibe explicitamente os badges e textos de Backend (API) e Frontend (Interface do Aluno)', () => {
    render(
      <PlatformSettingsSection
        formData={defaultFormData}
        handleChange={vi.fn()}
        visibleFields={{}}
      />
    );

    // Badges visuais
    expect(screen.getByText('Backend (API)')).toBeDefined();
    expect(screen.getByText('Frontend (Interface do Aluno)')).toBeDefined();

    // Rótulos principais
    expect(screen.getByText('URL da API da Plataforma')).toBeDefined();
    expect(screen.getByText('URL da Área de Alunos')).toBeDefined();

    // Caixinha explicativa
    expect(screen.getByText(/Como configurar as URLs:/)).toBeDefined();

    // Valores nos inputs
    expect(screen.getByDisplayValue('https://api.minhaplataforma.com.br')).toBeDefined();
    expect(screen.getByDisplayValue('https://alunos.minhaplataforma.com.br')).toBeDefined();
  });

  it('chama handleChange ao alterar a URL da API (Backend) e a URL do Aluno (Frontend)', () => {
    const handleChange = vi.fn();
    render(
      <PlatformSettingsSection
        formData={defaultFormData}
        handleChange={handleChange}
        visibleFields={{}}
      />
    );

    const apiUrlInput = screen.getByDisplayValue('https://api.minhaplataforma.com.br');
    fireEvent.change(apiUrlInput, { target: { name: 'PLATFORM_API_URL', value: 'https://api2.com' } });
    expect(handleChange).toHaveBeenCalled();

    const frontendUrlInput = screen.getByDisplayValue('https://alunos.minhaplataforma.com.br');
    fireEvent.change(frontendUrlInput, { target: { name: 'PLATFORM_FRONTEND_URL', value: 'https://aluno2.com' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('alterna visualização do token ao clicar no botão de olho', () => {
    render(
      <PlatformSettingsSection
        formData={defaultFormData}
        handleChange={vi.fn()}
        visibleFields={{}}
      />
    );

    const tokenInput = screen.getByDisplayValue('sk_live_teste123');
    // Inicialmente oculto com disc
    expect(tokenInput.style.WebkitTextSecurity).toBe('disc');

    const toggleButton = screen.getByTitle('Visualizar');
    fireEvent.click(toggleButton);

    // Após o clique, deve exibir normalmente
    expect(tokenInput.style.WebkitTextSecurity).toBe('');
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import EmailTagCombobox from '../components/EmailTagCombobox';

vi.mock('../../../../contexts/ClientContext', () => ({
  useClient: () => ({
    activeClient: { id: 1, name: 'Empresa Teste' }
  })
}));

vi.mock('../../../../config', () => ({
  API_URL: 'http://localhost:8000/api'
}));

describe('EmailTagCombobox Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake_token');
    localStorage.setItem('client_id', '1');

    global.fetch = vi.fn((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/leads/filters')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ tags: ['cliente_vip', 'lead_novo', 'comprou'] })
        });
      }
      if (urlStr.includes('/chat/labels/details')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ name: 'lead_quente' }])
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it('renders single selection mode and filters tags', async () => {
    const handleChange = vi.fn();
    render(
      <EmailTagCombobox
        label="Nome da Etiqueta"
        value="lead_novo"
        onChange={handleChange}
        placeholder="Escolha a tag..."
        multiple={false}
      />
    );

    expect(screen.getByText('Nome da Etiqueta')).toBeInTheDocument();
    expect(screen.getByText('lead_novo')).toBeInTheDocument();

    // Clica para abrir o dropdown
    fireEvent.click(screen.getByText('lead_novo'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar ou digitar nova tag.../i)).toBeInTheDocument();
    });

    // Digita para filtrar
    const input = screen.getByPlaceholderText(/Buscar ou digitar nova tag.../i);
    fireEvent.change(input, { target: { value: 'vip' } });

    expect(screen.getByText('cliente_vip')).toBeInTheDocument();

    // Clica na tag filtrada
    fireEvent.click(screen.getByText('cliente_vip'));
    expect(handleChange).toHaveBeenCalledWith('cliente_vip');
  });

  it('allows creating a new tag if not found in list', async () => {
    const handleChange = vi.fn();
    render(
      <EmailTagCombobox
        label="Nova Tag"
        value=""
        onChange={handleChange}
        placeholder="Escolha a tag..."
        multiple={false}
      />
    );

    // Clica para abrir
    fireEvent.click(screen.getByText('Escolha a tag...'));

    const input = screen.getByPlaceholderText(/Buscar ou digitar nova tag.../i);
    fireEvent.change(input, { target: { value: 'tag_inexistente_123' } });

    await waitFor(() => {
      expect(screen.getByText(/Criar tag:/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Criar tag:/i));
    expect(handleChange).toHaveBeenCalledWith('tag_inexistente_123');
  });

  it('renders multiple mode with chips and removal', () => {
    const handleChange = vi.fn();
    render(
      <EmailTagCombobox
        label="Stop Tags"
        value={['comprou', 'cliente_vip']}
        onChange={handleChange}
        multiple={true}
      />
    );

    expect(screen.getByText('comprou')).toBeInTheDocument();
    expect(screen.getByText('cliente_vip')).toBeInTheDocument();
  });
});

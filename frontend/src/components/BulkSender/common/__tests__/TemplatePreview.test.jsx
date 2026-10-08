import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import TemplatePreview from '../TemplatePreview';

describe('TemplatePreview', () => {
  it('renders null when template is not provided', () => {
    const { container } = render(<TemplatePreview template={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders body text and breaks long URLs without overflowing', () => {
    const longUrl = 'https://chat.whatsapp.com/HJYcwc58Bg0GvMJ1vEpcVeryLongLinkWithoutSpacesThatMightOverflowCardContainer1234567890';
    const template = {
      name: 'teste_long_link',
      components: [
        {
          type: 'BODY',
          text: `Acesse o link abaixo:\n\n{{1}}\n\nEntre no grupo VIP:\n${longUrl}`
        }
      ]
    };

    const { container } = render(<TemplatePreview template={template} params={{ BODY_0: 'https://exemplo.com/cadastro' }} />);

    // Verifica se o texto e a URL estão presentes
    expect(screen.getByText(/Acesse o link abaixo/)).toBeDefined();
    expect(screen.getByText(/https:\/\/exemplo\.com\/cadastro/)).toBeDefined();
    expect(screen.getByText(new RegExp(longUrl))).toBeDefined();

    // Verifica se as classes de quebra de palavra foram aplicadas ao container do body
    const bodyContainer = container.querySelector('.text-slate-200');
    expect(bodyContainer).toBeDefined();
    expect(bodyContainer.className).toContain('break-words');
    expect(bodyContainer.className).toContain('[overflow-wrap:anywhere]');
  });

  it('renders header text with break-words classes', () => {
    const template = {
      name: 'teste_header',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'SuperHeaderComUmTextoMuitoLongoSemEspacosParaTestarQuebraDeLinha'
        },
        {
          type: 'BODY',
          text: 'Corpo da mensagem'
        }
      ]
    };

    const { container } = render(<TemplatePreview template={template} />);
    const headerContainer = container.querySelector('.font-bold.mb-3');
    expect(headerContainer).toBeDefined();
    expect(headerContainer.className).toContain('break-words');
    expect(headerContainer.className).toContain('[overflow-wrap:anywhere]');
  });
});

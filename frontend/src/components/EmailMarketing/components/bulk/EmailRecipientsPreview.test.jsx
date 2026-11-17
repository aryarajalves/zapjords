import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EmailRecipientsPreview, { parseRecipientTags } from './EmailRecipientsPreview';

describe('EmailRecipientsPreview Unit Tests', () => {
  it('parseRecipientTags separa string por vírgula e remove espaços e vazios', () => {
    expect(parseRecipientTags('tag1, tag2 , , tag3')).toEqual(['tag1', 'tag2', 'tag3']);
    expect(parseRecipientTags(['a', ' b ', ''])).toEqual(['a', 'b']);
    expect(parseRecipientTags('')).toEqual([]);
  });

  it('exibe e-mail completo, nome e até 3 etiquetas com botão +N para expandir e recolher', () => {
    const recipients = [
      {
        id: 1,
        email: 'vanessa.cliente@astrowake.com',
        name: 'Vanessa Silva',
        tags: 'tag_um, tag_dois, tag_tres, tag_quatro, tag_cinco'
      }
    ];

    render(<EmailRecipientsPreview recipients={recipients} previewLoading={false} />);

    expect(screen.getByText('vanessa.cliente@astrowake.com')).toBeInTheDocument();
    expect(screen.getByText('(Vanessa Silva)')).toBeInTheDocument();

    expect(screen.getByText('tag_um')).toBeInTheDocument();
    expect(screen.getByText('tag_dois')).toBeInTheDocument();
    expect(screen.getByText('tag_tres')).toBeInTheDocument();
    expect(screen.queryByText('tag_quatro')).not.toBeInTheDocument();

    const expandBtn = screen.getByRole('button', { name: '+2' });
    fireEvent.click(expandBtn);

    expect(screen.getByText('tag_quatro')).toBeInTheDocument();
    expect(screen.getByText('tag_cinco')).toBeInTheDocument();

    const collapseBtn = screen.getByRole('button', { name: 'recolher' });
    fireEvent.click(collapseBtn);

    expect(screen.queryByText('tag_quatro')).not.toBeInTheDocument();
  });
});

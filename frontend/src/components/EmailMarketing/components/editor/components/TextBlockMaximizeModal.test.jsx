import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TextBlockMaximizeModal from './TextBlockMaximizeModal';

describe('TextBlockMaximizeModal Unit Tests', () => {
  it('insere variável na posição do cursor, previne blur no mousedown e preserva scrollTop do textarea', () => {
    const onUpdateActiveBlock = vi.fn();
    const activeBlock = {
      id: 'b-1',
      type: 'text',
      content: 'Linha 1\n\nLink: '
    };

    const rafCallbacks = [];
    const origRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = (cb) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    };

    try {
      render(
        <TextBlockMaximizeModal
          isOpen={true}
          onClose={vi.fn()}
          activeBlock={activeBlock}
          onUpdateActiveBlock={onUpdateActiveBlock}
        />
      );

      const textarea = screen.getByPlaceholderText(/Escreva seu e-mail aqui/i);
      textarea.setSelectionRange(15, 15);
      textarea.scrollTop = 180;

      const focusSpy = vi.spyOn(textarea, 'focus');

      const varBtn = screen.getByRole('button', { name: /\{\{link_bussola\}\}/i });

      const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      const notPrevented = varBtn.dispatchEvent(mouseDownEvent);
      expect(notPrevented).toBe(false);

      fireEvent.click(varBtn);

      expect(onUpdateActiveBlock).toHaveBeenCalledWith(
        'content',
        'Linha 1\n\nLink: {{link_bussola}}'
      );

      // Simula que o browser tentou zerar/descer o scroll ao atualizar o value
      textarea.scrollTop = 999;

      rafCallbacks.forEach(cb => cb());

      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
      expect(textarea.scrollTop).toBe(180);
    } finally {
      window.requestAnimationFrame = origRaf;
    }
  });
});

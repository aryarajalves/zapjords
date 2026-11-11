import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDraggableBalloon } from '../useDraggableBalloon';

describe('useDraggableBalloon hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Configura viewport padrão
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });
  });

  it('inicia na posição padrão { x: 0, y: 0 } e sem arrasto', () => {
    const { result } = renderHook(() => useDraggableBalloon(1));
    expect(result.current.position).toEqual({ x: 0, y: 0 });
    expect(result.current.isDragging).toBe(false);
  });

  it('reseta a posição para { x: 0, y: 0 } quando resetKey é alterado (troca de conversa)', () => {
    let currentId = 1;
    const { result, rerender } = renderHook(({ id }) => useDraggableBalloon(id), {
      initialProps: { id: currentId }
    });

    // Simula arrasto com mouse
    act(() => {
      result.current.handleMouseDown({ button: 0, clientX: 500, clientY: 500 });
    });

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 450, clientY: 420 }));
    });

    expect(result.current.position.x).not.toBe(0);
    expect(result.current.position.y).not.toBe(0);

    // Finaliza o mouseup
    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup'));
    });

    // Alterna para nova conversa (id 2)
    rerender({ id: 2 });

    expect(result.current.position).toEqual({ x: 0, y: 0 });
    expect(result.current.isDragging).toBe(false);
  });

  it('permite arrastar o balão com o botão esquerdo do mouse', () => {
    const { result } = renderHook(() => useDraggableBalloon(1));

    act(() => {
      result.current.handleMouseDown({ button: 0, clientX: 300, clientY: 400 });
    });

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 250, clientY: 350 }));
    });

    expect(result.current.isDragging).toBe(true);
    expect(result.current.position.x).toBe(-50);
    expect(result.current.position.y).toBe(-50);

    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup'));
    });

    expect(result.current.isDragging).toBe(false);
  });

  it('ignora cliques com botão direito ou do meio para arrasto', () => {
    const { result } = renderHook(() => useDraggableBalloon(1));

    act(() => {
      result.current.handleMouseDown({ button: 2, clientX: 300, clientY: 400 });
    });

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }));
    });

    expect(result.current.isDragging).toBe(false);
    expect(result.current.position).toEqual({ x: 0, y: 0 });
  });

  it('bloqueia o callback de click se houver arrasto recente', () => {
    const { result } = renderHook(() => useDraggableBalloon(1));
    const clickSpy = vi.fn();

    act(() => {
      result.current.handleMouseDown({ button: 0, clientX: 300, clientY: 400 });
    });

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 250, clientY: 350 }));
    });

    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup'));
    });

    // Imediatamente após soltar o arrasto, o click deve ser ignorado
    act(() => {
      result.current.handleClick(clickSpy);
    });

    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('executa o callback de click normalmente se não houve arrasto (apenas clique)', () => {
    const { result } = renderHook(() => useDraggableBalloon(1));
    const clickSpy = vi.fn();

    act(() => {
      result.current.handleClick(clickSpy);
    });

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useDragScroll } from '../useDragScroll';

function TestComponent() {
    const { isDragging, dragScrollProps } = useDragScroll();

    return (
        <div
            data-testid="scroll-container"
            {...dragScrollProps}
            style={{ width: '500px', overflowX: 'auto' }}
        >
            <div data-testid="free-area">Área livre</div>
            <button data-testid="test-button">Botão</button>
            <div data-testid="card-deal" draggable="true">Card Deal</div>
            <span data-testid="dragging-status">{isDragging ? 'arrastando' : 'parado'}</span>
        </div>
    );
}

describe('useDragScroll Hook Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('inicia parado e com isDragging false', () => {
        render(<TestComponent />);
        expect(screen.getByTestId('dragging-status')).toHaveTextContent('parado');
    });

    it('ativa arraste ao pressionar botão esquerdo em área livre', () => {
        render(<TestComponent />);
        const freeArea = screen.getByTestId('free-area');

        fireEvent.mouseDown(freeArea, { button: 0, pageX: 100 });
        expect(screen.getByTestId('dragging-status')).toHaveTextContent('arrastando');
    });

    it('não ativa arraste se clicar em botão ou elemento interativo', () => {
        render(<TestComponent />);
        const button = screen.getByTestId('test-button');

        fireEvent.mouseDown(button, { button: 0, pageX: 100 });
        expect(screen.getByTestId('dragging-status')).toHaveTextContent('parado');
    });

    it('não ativa arraste se clicar em card com draggable=true', () => {
        render(<TestComponent />);
        const card = screen.getByTestId('card-deal');

        fireEvent.mouseDown(card, { button: 0, pageX: 100 });
        expect(screen.getByTestId('dragging-status')).toHaveTextContent('parado');
    });

    it('não ativa arraste se o botão do mouse não for o esquerdo (button !== 0)', () => {
        render(<TestComponent />);
        const freeArea = screen.getByTestId('free-area');

        fireEvent.mouseDown(freeArea, { button: 2, pageX: 100 }); // Botão direito
        expect(screen.getByTestId('dragging-status')).toHaveTextContent('parado');
    });

    it('desloca scrollLeft do container ao mover o mouse durante o arraste', () => {
        render(<TestComponent />);
        const container = screen.getByTestId('scroll-container');
        const freeArea = screen.getByTestId('free-area');

        let currentScrollLeft = 50;
        Object.defineProperty(container, 'scrollLeft', {
            get: () => currentScrollLeft,
            set: (val) => { currentScrollLeft = val; },
            configurable: true
        });

        // Mouse down na posição 200
        fireEvent.mouseDown(freeArea, { button: 0, pageX: 200, clientX: 200 });
        expect(screen.getByTestId('dragging-status')).toHaveTextContent('arrastando');

        // Mouse move para posição 150 (arrastou 50px para a esquerda -> scroll deve avançar para a direita)
        fireEvent.mouseMove(window, { pageX: 150, clientX: 150 });
        // (x - startX) = (150 - 200) = -50
        // walk = -50 * 1.5 = -75
        // scrollLeft = 50 - (-75) = 125
        expect(container.scrollLeft).toBe(125);

        // Mouse up encerra o arraste
        fireEvent.mouseUp(container);
        expect(screen.getByTestId('dragging-status')).toHaveTextContent('parado');
    });

    it('encerra o arraste com mouseUp global', () => {
        render(<TestComponent />);
        const freeArea = screen.getByTestId('free-area');

        fireEvent.mouseDown(freeArea, { button: 0, pageX: 200 });
        expect(screen.getByTestId('dragging-status')).toHaveTextContent('arrastando');

        fireEvent.mouseUp(window);
        expect(screen.getByTestId('dragging-status')).toHaveTextContent('parado');
    });

    it('aciona auto-scroll quando evento dragover ocorre perto da extremidade esquerda', () => {
        let rafCallback = null;
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
            rafCallback = cb;
            return 123;
        });
        const cancelRafSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(vi.fn());

        render(<TestComponent />);
        const container = screen.getByTestId('scroll-container');
        container.getBoundingClientRect = () => ({
            left: 100,
            right: 600,
            width: 500,
            height: 400,
            top: 0,
            bottom: 400
        });

        let currentScrollLeft = 100;
        Object.defineProperty(container, 'scrollLeft', {
            get: () => currentScrollLeft,
            set: (val) => { currentScrollLeft = val; },
            configurable: true
        });

        // Evento dragover próximo da borda esquerda (clientX = 120, bem próximo de left: 100)
        const leftDrag = new MouseEvent('dragover', { bubbles: true, cancelable: true });
        Object.defineProperty(leftDrag, 'clientX', { value: 120 });
        container.dispatchEvent(leftDrag);

        expect(window.requestAnimationFrame).toHaveBeenCalled();
        if (rafCallback) rafCallback();
        // scrollLeft deve ter diminuído (rolou para a esquerda)
        expect(currentScrollLeft).toBeLessThan(100);

        // Ao soltar (dragend), para o auto-scroll
        fireEvent.dragEnd(window);
        expect(cancelRafSpy).toHaveBeenCalled();
    });

    it('aciona auto-scroll quando evento dragover ocorre perto da extremidade direita', () => {
        let rafCallback = null;
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
            rafCallback = cb;
            return 124;
        });

        render(<TestComponent />);
        const container = screen.getByTestId('scroll-container');
        container.getBoundingClientRect = () => ({
            left: 100,
            right: 600,
            width: 500,
            height: 400,
            top: 0,
            bottom: 400
        });

        let currentScrollLeft = 100;
        Object.defineProperty(container, 'scrollLeft', {
            get: () => currentScrollLeft,
            set: (val) => { currentScrollLeft = val; },
            configurable: true
        });

        // Evento dragover próximo da borda direita (clientX = 580, bem próximo de right: 600)
        const rightDrag = new MouseEvent('dragover', { bubbles: true, cancelable: true });
        Object.defineProperty(rightDrag, 'clientX', { value: 580 });
        container.dispatchEvent(rightDrag);

        expect(window.requestAnimationFrame).toHaveBeenCalled();
        if (rafCallback) rafCallback();
        // scrollLeft deve ter aumentado (rolou para a direita)
        expect(currentScrollLeft).toBeGreaterThan(100);
    });
});


import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * Hook para rolagem horizontal do Kanban:
 * 1. Arraste manual com o botão esquerdo do mouse em áreas livres/fundo.
 * 2. Auto-scroll contínuo nas extremidades (esquerda e direita) enquanto o usuário
 *    está segurando e arrastando um card de lead (HTML5 Drag & Drop).
 */
export function useDragScroll() {
    const containerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const stateRef = useRef({
        isDown: false,
        startX: 0,
        scrollLeft: 0,
        hasMoved: false
    });

    // Refs para controle do auto-scroll por proximidade de borda durante drag de card
    const autoScrollAnimRef = useRef(null);
    const autoScrollSpeedRef = useRef(0);

    const stopAutoScroll = useCallback(() => {
        if (autoScrollAnimRef.current) {
            if (typeof window !== 'undefined') {
                window.cancelAnimationFrame(autoScrollAnimRef.current);
            }
            autoScrollAnimRef.current = null;
        }
        autoScrollSpeedRef.current = 0;
    }, []);

    const startAutoScroll = useCallback(() => {
        if (autoScrollAnimRef.current) return;

        const step = () => {
            const container = containerRef.current;
            if (container && autoScrollSpeedRef.current !== 0) {
                container.scrollLeft += autoScrollSpeedRef.current;
                if (typeof window !== 'undefined') {
                    autoScrollAnimRef.current = window.requestAnimationFrame(step);
                }
            } else {
                stopAutoScroll();
            }
        };

        if (typeof window !== 'undefined') {
            autoScrollAnimRef.current = window.requestAnimationFrame(step);
        }
    }, [stopAutoScroll]);

    const checkEdgeAutoScroll = useCallback((clientX) => {
        const container = containerRef.current;
        if (!container || clientX === undefined) {
            stopAutoScroll();
            return;
        }

        const rect = container.getBoundingClientRect();
        const edgeThreshold = 140; // Zona de ativação de 140px a partir das extremidades
        const maxSpeed = 20; // Velocidade máxima em px por frame

        // Extremidade Esquerda
        if (clientX >= rect.left && clientX < rect.left + edgeThreshold) {
            const distance = clientX - rect.left;
            const ratio = 1 - (distance / edgeThreshold);
            const speed = Math.max(5, Math.round(ratio * maxSpeed));
            autoScrollSpeedRef.current = -speed;
            startAutoScroll();
        }
        // Extremidade Direita
        else if (clientX <= rect.right && clientX > rect.right - edgeThreshold) {
            const distance = rect.right - clientX;
            const ratio = 1 - (distance / edgeThreshold);
            const speed = Math.max(5, Math.round(ratio * maxSpeed));
            autoScrollSpeedRef.current = speed;
            startAutoScroll();
        }
        // Área central neutra
        else {
            stopAutoScroll();
        }
    }, [startAutoScroll, stopAutoScroll]);

    // Arraste manual de fundo com mouse esquerdo
    const handleMouseDown = useCallback((e) => {
        // Apenas botão principal (esquerdo)
        if (e.button !== 0) return;

        // Se clicou em botão, input, select, textarea, link ou card arrastável de lead, não inicia scroll do board
        const target = e.target;
        if (
            target.closest('button') ||
            target.closest('input') ||
            target.closest('select') ||
            target.closest('textarea') ||
            target.closest('a') ||
            target.closest('[draggable="true"]')
        ) {
            return;
        }

        const container = containerRef.current;
        if (!container) return;

        stateRef.current.isDown = true;
        stateRef.current.hasMoved = false;
        const pageX = e.pageX !== undefined ? e.pageX : (e.clientX ?? 0);
        stateRef.current.startX = pageX - container.offsetLeft;
        stateRef.current.scrollLeft = container.scrollLeft;
        setIsDragging(true);
    }, []);

    const stopDragging = useCallback(() => {
        if (stateRef.current.isDown) {
            stateRef.current.isDown = false;
            setIsDragging(false);
        }
    }, []);

    // Global listeners para permitir arrastar e soltar suavemente mesmo se o ponteiro sair da div
    useEffect(() => {
        const handleGlobalMouseMove = (e) => {
            if (!stateRef.current.isDown) return;
            const container = containerRef.current;
            if (!container) return;

            e.preventDefault();
            const pageX = e.pageX !== undefined ? e.pageX : (e.clientX ?? 0);
            const x = pageX - container.offsetLeft;
            const walk = (x - stateRef.current.startX) * 1.5;

            if (Math.abs(walk) > 3) {
                stateRef.current.hasMoved = true;
            }

            container.scrollLeft = stateRef.current.scrollLeft - walk;
        };

        const handleGlobalMouseUp = () => {
            stopDragging();
        };

        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [stopDragging]);

    // Listeners globais para HTML5 Drag & Drop de cards de oportunidades
    useEffect(() => {
        const handleGlobalDragOver = (e) => {
            if (e.clientX !== undefined) {
                checkEdgeAutoScroll(e.clientX);
            }
        };

        const handleDragEndOrDrop = () => {
            stopAutoScroll();
        };

        window.addEventListener('dragover', handleGlobalDragOver);
        window.addEventListener('dragend', handleDragEndOrDrop);
        window.addEventListener('drop', handleDragEndOrDrop);

        return () => {
            window.removeEventListener('dragover', handleGlobalDragOver);
            window.removeEventListener('dragend', handleDragEndOrDrop);
            window.removeEventListener('drop', handleDragEndOrDrop);
            stopAutoScroll();
        };
    }, [checkEdgeAutoScroll, stopAutoScroll]);

    return {
        containerRef,
        isDragging,
        dragScrollProps: {
            ref: containerRef,
            onMouseDown: handleMouseDown,
            onMouseLeave: stopDragging,
            onMouseUp: stopDragging,
            onDragOver: (e) => {
                const clientX = e.clientX !== undefined ? e.clientX : (e.pageX ?? 0);
                checkEdgeAutoScroll(clientX);
            }
        }
    };
}

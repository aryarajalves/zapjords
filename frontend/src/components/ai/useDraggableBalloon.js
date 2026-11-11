import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook de alto desempenho para permitir arrastar o balão flutuante (Copiloto IA)
 * acompanhando o cursor do mouse instantaneamente (zero delay / 0ms latency),
 * com atualização direta no DOM via transform e reset automático por conversa.
 *
 * @param {any} resetKey - Chave de identificação da conversa (ex: selectedConvo?.id).
 */
export function useDraggableBalloon(resetKey) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const buttonRef = useRef(null);

  const dragRef = useRef({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
    currentX: 0,
    currentY: 0,
    moved: false,
    active: false
  });

  const justDraggedRef = useRef(false);

  // Sincroniza transform do elemento quando a posição de estado mudar
  useEffect(() => {
    if (buttonRef.current) {
      buttonRef.current.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
      buttonRef.current.style.transition = 'transform 0.15s ease-out';
    }
  }, [position.x, position.y]);

  // Reseta para a posição padrão sempre que abrir uma conversa nova ou alternar de contato
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
    dragRef.current.posX = 0;
    dragRef.current.posY = 0;
    dragRef.current.currentX = 0;
    dragRef.current.currentY = 0;
    dragRef.current.active = false;
    dragRef.current.moved = false;
    justDraggedRef.current = false;
    if (buttonRef.current) {
      buttonRef.current.style.transform = 'translate3d(0px, 0px, 0)';
      buttonRef.current.style.transition = 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)';
    }
  }, [resetKey]);

  const handleMouseDown = useCallback((e) => {
    // Permite arrastar apenas com o botão esquerdo do mouse
    if (e.button !== 0) return;

    // Evita seleção nativa do navegador que cria hesitação/delay no início do arrasto
    if (typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.posX = position.x;
    dragRef.current.posY = position.y;
    dragRef.current.currentX = position.x;
    dragRef.current.currentY = position.y;
    dragRef.current.moved = false;
    dragRef.current.active = true;

    // Desativa qualquer transição CSS imediatamente no clique para o balão colar no mouse sem atraso
    if (buttonRef.current) {
      buttonRef.current.style.transition = 'none';
    }

    const handleMouseMove = (moveEvt) => {
      if (!dragRef.current.active) return;
      if (typeof moveEvt.preventDefault === 'function') {
        moveEvt.preventDefault();
      }

      const dx = moveEvt.clientX - dragRef.current.startX;
      const dy = moveEvt.clientY - dragRef.current.startY;

      if (!dragRef.current.moved && (dx !== 0 || dy !== 0)) {
        dragRef.current.moved = true;
        setIsDragging(true);
      }

      if (dragRef.current.moved) {
        const newX = dragRef.current.posX + dx;
        const newY = dragRef.current.posY + dy;

        const maxLeft = -(window.innerWidth - 120);
        const maxTop = -(window.innerHeight - 80);
        const clampedX = Math.min(15, Math.max(maxLeft, newX));
        const clampedY = Math.min(15, Math.max(maxTop, newY));

        dragRef.current.currentX = clampedX;
        dragRef.current.currentY = clampedY;

        // Atualização instantânea direto na propriedade de estilo (zero render delay)
        if (buttonRef.current) {
          buttonRef.current.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`;
        }
        setPosition({ x: clampedX, y: clampedY });
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      if (dragRef.current.moved) {
        justDraggedRef.current = true;
        setPosition({
          x: dragRef.current.currentX,
          y: dragRef.current.currentY
        });
        setTimeout(() => {
          justDraggedRef.current = false;
        }, 120);
      }

      dragRef.current.active = false;
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);
  }, [position.x, position.y]);

  const handleTouchStart = useCallback((e) => {
    if (!e.touches || e.touches.length !== 1) return;
    const touch = e.touches[0];

    dragRef.current.startX = touch.clientX;
    dragRef.current.startY = touch.clientY;
    dragRef.current.posX = position.x;
    dragRef.current.posY = position.y;
    dragRef.current.currentX = position.x;
    dragRef.current.currentY = position.y;
    dragRef.current.moved = false;
    dragRef.current.active = true;

    if (buttonRef.current) {
      buttonRef.current.style.transition = 'none';
    }

    const handleTouchMove = (moveEvt) => {
      if (!dragRef.current.active || !moveEvt.touches || moveEvt.touches.length !== 1) return;
      const t = moveEvt.touches[0];
      const dx = t.clientX - dragRef.current.startX;
      const dy = t.clientY - dragRef.current.startY;

      if (!dragRef.current.moved && (dx !== 0 || dy !== 0)) {
        dragRef.current.moved = true;
        setIsDragging(true);
      }

      if (dragRef.current.moved) {
        const newX = dragRef.current.posX + dx;
        const newY = dragRef.current.posY + dy;

        const maxLeft = -(window.innerWidth - 120);
        const maxTop = -(window.innerHeight - 80);
        const clampedX = Math.min(15, Math.max(maxLeft, newX));
        const clampedY = Math.min(15, Math.max(maxTop, newY));

        dragRef.current.currentX = clampedX;
        dragRef.current.currentY = clampedY;

        if (buttonRef.current) {
          buttonRef.current.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`;
        }
        setPosition({ x: clampedX, y: clampedY });
      }
    };

    const handleTouchEnd = () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);

      if (dragRef.current.moved) {
        justDraggedRef.current = true;
        setPosition({
          x: dragRef.current.currentX,
          y: dragRef.current.currentY
        });
        setTimeout(() => {
          justDraggedRef.current = false;
        }, 120);
      }

      dragRef.current.active = false;
      setIsDragging(false);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
  }, [position.x, position.y]);

  const handleClick = useCallback((callback) => {
    if (dragRef.current.moved || justDraggedRef.current) {
      return;
    }
    if (typeof callback === 'function') {
      callback();
    }
  }, []);

  return {
    position,
    isDragging,
    buttonRef,
    handleMouseDown,
    handleTouchStart,
    handleClick,
    resetPosition: () => setPosition({ x: 0, y: 0 })
  };
}

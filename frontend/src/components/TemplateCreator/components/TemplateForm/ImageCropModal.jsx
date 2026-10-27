import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiX, FiCheck, FiZoomIn, FiZoomOut, FiMove, FiInfo, FiRotateCcw } from 'react-icons/fi';

export function ImageCropModal({
    isOpen,
    onClose,
    imageSrc,
    fileName = 'imagem_cabecalho.jpg',
    onCropComplete
}) {
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isProcessing, setIsProcessing] = useState(false);

    const imageRef = useRef(null);
    const containerRef = useRef(null);

    // Reset ao abrir modal
    useEffect(() => {
        if (isOpen) {
            setZoom(1);
            setPosition({ x: 0, y: 0 });
            setIsDragging(false);
        }
    }, [isOpen, imageSrc]);

    // Handlers de arrastar (Pan)
    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    }, [isDragging, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Handlers Touch para Mobile
    const handleTouchStart = (e) => {
        if (e.touches.length === 1) {
            setIsDragging(true);
            setDragStart({
                x: e.touches[0].clientX - position.x,
                y: e.touches[0].clientY - position.y
            });
        }
    };

    const handleTouchMove = (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        setPosition({
            x: e.touches[0].clientX - dragStart.x,
            y: e.touches[0].clientY - dragStart.y
        });
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    // Resetar enquadramento
    const handleReset = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    // Gerar imagem recortada em 1200x628 (proporção oficial Meta 1.91:1)
    const handleApply = async () => {
        if (!imageRef.current || !containerRef.current) return;
        setIsProcessing(true);

        try {
            const container = containerRef.current;
            const img = imageRef.current;
            const containerRect = container.getBoundingClientRect();

            // Dimensões recomendadas oficiais da Meta para cabeçalho
            const targetWidth = 1200;
            const targetHeight = 628;

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');

            if (!ctx) throw new Error('Não foi possível inicializar canvas');

            // Fundo escuro neutro caso haja áreas fora da imagem
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, targetWidth, targetHeight);

            // Escala entre viewport na tela e canvas 1200x628
            const scaleToCanvas = targetWidth / containerRect.width;

            // Posição e dimensões desenhadas da imagem no container
            const renderedWidth = img.width * zoom * scaleToCanvas;
            const renderedHeight = img.height * zoom * scaleToCanvas;
            
            // Ponto central da imagem com offset do usuário
            const centerX = (targetWidth / 2) + (position.x * scaleToCanvas);
            const centerY = (targetHeight / 2) + (position.y * scaleToCanvas);

            const drawX = centerX - (renderedWidth / 2);
            const drawY = centerY - (renderedHeight / 2);

            ctx.drawImage(img, drawX, drawY, renderedWidth, renderedHeight);

            canvas.toBlob((blob) => {
                if (!blob) {
                    setIsProcessing(false);
                    return;
                }
                const cleanFileName = fileName.replace(/\.[^/.]+$/, "") + "_cropped.jpg";
                const croppedFile = new File([blob], cleanFileName, { type: 'image/jpeg' });
                const previewUrl = URL.createObjectURL(blob);
                onCropComplete(croppedFile, previewUrl);
                setIsProcessing(false);
                onClose();
            }, 'image/jpeg', 0.92);
        } catch (err) {
            console.error('Erro ao recortar imagem:', err);
            setIsProcessing(false);
        }
    };

    if (!isOpen || !imageSrc) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <div 
                className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5 bg-slate-950/60">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                            <FiMove size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white">
                                Enquadrar Mídia do Cabeçalho
                            </h3>
                            <p className="text-[11px] text-slate-400">
                                Proporção oficial WhatsApp / Meta: <strong className="text-blue-400 font-mono">1.91:1 (1200 x 628 px)</strong>
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isProcessing}
                        className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all cursor-pointer"
                        title="Fechar"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {/* Body / Crop Area */}
                <div className="p-6 space-y-4">
                    {/* Alerta explicativo */}
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs leading-relaxed">
                        <FiInfo size={16} className="shrink-0 mt-0.5 text-blue-400" />
                        <div>
                            <strong>Como funciona o WhatsApp:</strong> O cabeçalho dos templates no WhatsApp é sempre exibido em formato horizontal cheio (1.91:1). 
                            <span className="block text-[11px] text-blue-200/80 mt-0.5">
                                Arraste a imagem abaixo para escolher qual parte deseja destacar e use o zoom para aproximar.
                            </span>
                        </div>
                    </div>

                    {/* Viewport de Enquadramento 1.91:1 */}
                    <div className="flex justify-center">
                        <div
                            ref={containerRef}
                            onMouseDown={handleMouseDown}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            style={{ width: '100%', maxWidth: '480px', aspectRatio: '1.91 / 1' }}
                            className={`relative rounded-2xl overflow-hidden border-2 border-blue-500/40 bg-slate-950 shadow-inner flex items-center justify-center select-none ${
                                isDragging ? 'cursor-grabbing' : 'cursor-grab'
                            }`}
                        >
                            {/* Grid do Rule of Thirds */}
                            <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-3 grid-rows-3 opacity-30 border border-white/20">
                                <div className="border-r border-b border-white/20" />
                                <div className="border-r border-b border-white/20" />
                                <div className="border-b border-white/20" />
                                <div className="border-r border-b border-white/20" />
                                <div className="border-r border-b border-white/20" />
                                <div className="border-b border-white/20" />
                                <div className="border-r border-white/20" />
                                <div className="border-r border-white/20" />
                                <div />
                            </div>

                            {/* Badge Indicador de Arraste */}
                            <div className="absolute top-2.5 left-2.5 z-20 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-slate-300 pointer-events-none flex items-center gap-1">
                                <FiMove size={11} className="text-blue-400" />
                                <span>Arraste para mover</span>
                            </div>

                            {/* Imagem a ser reposicionada */}
                            <img
                                ref={imageRef}
                                src={imageSrc}
                                alt="Recorte"
                                draggable={false}
                                style={{
                                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                                    transformOrigin: 'center center',
                                    maxWidth: 'none',
                                    maxHeight: 'none',
                                    userSelect: 'none',
                                    pointerEvents: 'none',
                                    transition: isDragging ? 'none' : 'transform 0.05s ease-out'
                                }}
                                className="w-auto h-full object-contain"
                            />
                        </div>
                    </div>

                    {/* Controles de Zoom e Reset */}
                    <div className="flex items-center justify-between gap-4 pt-1 bg-slate-950/40 p-3.5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2.5 flex-1">
                            <FiZoomOut size={16} className="text-slate-400" />
                            <input
                                type="range"
                                min="1"
                                max="3"
                                step="0.05"
                                value={zoom}
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                            />
                            <FiZoomIn size={16} className="text-slate-400" />
                            <span className="text-xs font-mono font-bold text-slate-300 w-12 text-right">
                                {zoom.toFixed(1)}x
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleReset}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer border border-white/5"
                            title="Resetar Posição e Zoom"
                        >
                            <FiRotateCcw size={12} />
                            <span>Centralizar</span>
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-5 border-t border-white/5 bg-slate-950/60">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isProcessing}
                        className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        onClick={handleApply}
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {isProcessing ? (
                            <>
                                <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                                <span>Processando...</span>
                            </>
                        ) : (
                            <>
                                <FiCheck size={16} />
                                <span>Aplicar Enquadramento</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ImageCropModal;

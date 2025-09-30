import React, { useEffect } from 'react';
import { Button } from 'react-bootstrap';

const Lightbox = ({ 
    isOpen, 
    onClose, 
    imageUrl, 
    imageAlt = 'Imagem',
    onPrevious,
    onNext,
    hasPrevious = false,
    hasNext = false,
    currentIndex = 0,
    totalImages = 1
}) => {
    // Fechar com ESC
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            } else if (event.key === 'ArrowLeft' && hasPrevious) {
                onPrevious();
            } else if (event.key === 'ArrowRight' && hasNext) {
                onNext();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            // Prevenir scroll do body quando lightbox está aberto
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose, onPrevious, onNext, hasPrevious, hasNext]);

    if (!isOpen || !imageUrl) return null;

    return (
        <div 
            className="lightbox-overlay"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}
            onClick={(e) => {
                // Fechar ao clicar no overlay (fora da imagem)
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            {/* Botão de fechar */}
            <Button
                variant="light"
                size="lg"
                className="position-absolute"
                style={{
                    top: '20px',
                    right: '20px',
                    zIndex: 10000,
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    backdropFilter: 'blur(10px)'
                }}
                onClick={onClose}
            >
                <span className="material-icons" style={{fontSize: '24px', color: 'white'}}>
                    close
                </span>
            </Button>

            {/* Botão anterior */}
            {hasPrevious && (
                <Button
                    variant="light"
                    size="lg"
                    className="position-absolute"
                    style={{
                        left: '20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10000,
                        borderRadius: '50%',
                        width: '60px',
                        height: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        backdropFilter: 'blur(10px)'
                    }}
                    onClick={onPrevious}
                >
                    <span className="material-icons" style={{fontSize: '28px', color: 'white'}}>
                        chevron_left
                    </span>
                </Button>
            )}

            {/* Botão próximo */}
            {hasNext && (
                <Button
                    variant="light"
                    size="lg"
                    className="position-absolute"
                    style={{
                        right: '20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10000,
                        borderRadius: '50%',
                        width: '60px',
                        height: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        backdropFilter: 'blur(10px)'
                    }}
                    onClick={onNext}
                >
                    <span className="material-icons" style={{fontSize: '28px', color: 'white'}}>
                        chevron_right
                    </span>
                </Button>
            )}

            {/* Imagem */}
            <div 
                style={{
                    maxWidth: '90%',
                    maxHeight: '90%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={imageUrl}
                    alt={imageAlt}
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
                    }}
                />
            </div>

            {/* Contador de imagens */}
            {totalImages > 1 && (
                <div
                    className="position-absolute"
                    style={{
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 10000,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    {currentIndex + 1} / {totalImages}
                </div>
            )}

            {/* Instruções */}
            <div
                className="position-absolute"
                style={{
                    bottom: '60px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10000,
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '12px',
                    textAlign: 'center'
                }}
            >
                Use as setas do teclado ou clique nos botões para navegar
            </div>
        </div>
    );
};

export default Lightbox;

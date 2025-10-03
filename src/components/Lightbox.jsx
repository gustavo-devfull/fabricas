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
                padding: '10px',
                // Melhorar responsividade
                minHeight: '100vh',
                minWidth: '100vw'
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
                    top: '10px',
                    right: '10px',
                    zIndex: 10000,
                    borderRadius: '50%',
                    width: '45px',
                    height: '45px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    backdropFilter: 'blur(10px)',
                    // Responsivo para mobile
                    '@media (max-width: 768px)': {
                        width: '40px',
                        height: '40px',
                        top: '5px',
                        right: '5px'
                    }
                }}
                onClick={onClose}
            >
                <span className="material-icons" style={{fontSize: '22px', color: 'white'}}>
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
                        left: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10000,
                        borderRadius: '50%',
                        width: '55px',
                        height: '55px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        backdropFilter: 'blur(10px)'
                    }}
                    onClick={onPrevious}
                >
                    <span className="material-icons" style={{fontSize: '26px', color: 'white'}}>
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
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10000,
                        borderRadius: '50%',
                        width: '55px',
                        height: '55px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        backdropFilter: 'blur(10px)'
                    }}
                    onClick={onNext}
                >
                    <span className="material-icons" style={{fontSize: '26px', color: 'white'}}>
                        chevron_right
                    </span>
                </Button>
            )}

            {/* Imagem */}
            <div 
                style={{
                    maxWidth: '95vw',
                    maxHeight: '95vh',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={imageUrl}
                    alt={imageAlt}
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                        // Garantir que a imagem seja responsiva
                        minWidth: '200px',
                        minHeight: '200px'
                    }}
                />
            </div>

            {/* Contador de imagens */}
            {totalImages > 1 && (
                <div
                    className="position-absolute"
                    style={{
                        bottom: '15px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 10000,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '15px',
                        fontSize: '13px',
                        backdropFilter: 'blur(10px)',
                        fontWeight: '500'
                    }}
                >
                    {currentIndex + 1} / {totalImages}
                </div>
            )}

            {/* Instruções */}
            <div
                className="position-absolute"
                style={{
                    bottom: '50px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10000,
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '11px',
                    textAlign: 'center',
                    maxWidth: '300px',
                    padding: '0 20px'
                }}
            >
                Use as setas do teclado ou clique nos botões para navegar
            </div>
        </div>
    );
};

export default Lightbox;

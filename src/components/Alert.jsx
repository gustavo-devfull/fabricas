import React, { useState, useEffect } from 'react';
import { Alert as BootstrapAlert, Button } from 'react-bootstrap';

const Alert = ({ 
    variant = 'info', 
    message, 
    title, 
    show, 
    onClose, 
    autoClose = false, 
    duration = 5000,
    actions = []
}) => {
    const [isVisible, setIsVisible] = useState(show);

    useEffect(() => {
        setIsVisible(show);
        
        if (show && autoClose) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            
            return () => clearTimeout(timer);
        }
    }, [show, autoClose, duration]);

    const handleClose = () => {
        setIsVisible(false);
        if (onClose) {
            setTimeout(onClose, 300); // Delay para animação
        }
    };

    if (!isVisible) return null;

    const getVariantColor = () => {
        switch (variant) {
            case 'success': return 'success';
            case 'error': 
            case 'danger': return 'danger';
            case 'warning': return 'warning';
            case 'info': return 'info';
            default: return 'info';
        }
    };

    const getIcon = () => {
        switch (variant) {
            case 'success': return '✓';
            case 'error': 
            case 'danger': return '⚠';
            case 'warning': return '⚠';
            case 'info': return 'ℹ';
            default: return 'ℹ';
        }
    };

    return (
        <div 
            className={`position-fixed top-0 end-0 p-3 z-3`}
            style={{
                zIndex: 1050,
                transition: 'all 0.3s ease',
                transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
                opacity: isVisible ? 1 : 0
            }}
        >
            <BootstrapAlert 
                variant={getVariantColor()} 
                className="shadow-lg border-0"
                style={{ minWidth: '300px', maxWidth: '400px' }}
            >
                <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                        {title && (
                            <div className="d-flex align-items-center mb-2">
                                <span className="me-2 fw-bold fs-5">
                                    {getIcon()}
                                </span>
                                <h6 className="mb-0 fw-bold">
                                    {title}
                                </h6>
                            </div>
                        )}
                        <div className="small">
                            {message}
                        </div>
                        {actions.length > 0 && (
                            <div className="mt-3 d-flex gap-2">
                                {actions.map((action, index) => (
                                    <Button
                                        key={index}
                                        size="sm"
                                        variant={action.variant || 'outline-' + getVariantColor()}
                                        onClick={action.onClick}
                                        className="px-3 py-1"
                                    >
                                        {action.label}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                    <Button
                        variant="link"
                        size="sm"
                        onClick={handleClose}
                        className="p-0 ms-2 text-decoration-none"
                        style={{ color: 'inherit' }}
                    >
                        <span className="material-icons" style={{fontSize: '18px'}}>close</span>
                    </Button>
                </div>
            </BootstrapAlert>
        </div>
    );
};

export default Alert;
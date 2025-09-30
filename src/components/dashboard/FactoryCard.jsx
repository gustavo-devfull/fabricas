import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';

const FactoryCard = ({ 
    factory, 
    onEdit, 
    onViewQuotes, 
    onImport, 
    onDelete 
}) => {
    const getStatusBadge = (status) => {
        const statusConfig = {
            'ativa': { variant: 'success', text: 'Ativa' },
            'manutencao': { variant: 'warning', text: 'Manutenção' },
            'inativa': { variant: 'secondary', text: 'Inativa' }
        };
        
        const config = statusConfig[status] || statusConfig['inativa'];
        return (
            <Badge 
                className={`px-1 py-1 ${config.variant === 'warning' ? 'text-dark' : ''}`}
                style={{
                    fontSize: '0.65rem',
                    borderRadius: '12px',
                    fontWeight: '600',
                    backgroundColor: config.variant === 'success' ? '#28a745' : 
                                   config.variant === 'warning' ? '#ffc107' : '#6c757d'
                }}
            >
                {config.text}
            </Badge>
        );
    };

    return (
        <Card 
            className="shadow-sm h-100 factory-card" 
            style={{
                border: 'none',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
            }}
        >
            <Card.Body className="d-flex flex-column justify-content-between p-3">
                {/* Cabeçalho com nome e status */}
                <div className="mb-2">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                        <h6 
                            className="mb-0 text-truncate fw-bold" 
                            style={{
                                maxWidth: '120px',
                                color: '#2c3e50',
                                fontSize: '0.95rem'
                            }} 
                            title={factory.nomeFabrica}
                        >
                            {factory.nomeFabrica}
                        </h6>
                        {getStatusBadge(factory.status)}
                    </div>
                    
                    {/* Informações adicionais compactas */}
                    <div className="text-muted" style={{fontSize: '0.75rem'}}>
                        <div className="d-flex align-items-center mb-1">
                            <span className="material-icons me-1" style={{fontSize: '12px'}}>location_on</span>
                            <span 
                                className="text-truncate" 
                                style={{maxWidth: '100px'}} 
                                title={factory.localizacao}
                            >
                                {factory.localizacao}
                            </span>
                        </div>
                        <div className="d-flex align-items-center">
                            <span className="material-icons me-1" style={{fontSize: '12px'}}>category</span>
                            <span 
                                className="text-truncate" 
                                style={{maxWidth: '100px'}} 
                                title={factory.segmento}
                            >
                                {factory.segmento}
                            </span>
                        </div>
                    </div>
                </div>
                
                {/* Botões de ação */}
                <div className="d-flex gap-1 justify-content-start">
                    <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => onEdit(factory)}
                        title="Editar Fábrica"
                        className="action-btn"
                        style={{
                            borderRadius: '6px',
                            padding: '6px 8px',
                            borderWidth: '1px',
                            fontWeight: '500',
                            minWidth: '32px',
                            filter: 'invert(1)',
                            backgroundColor: 'transparent'
                        }}
                    >
                        <span className="material-icons" style={{fontSize: '16px'}}>edit</span>
                    </Button>
                    <Button 
                        variant="outline-info" 
                        size="sm"
                        onClick={() => onViewQuotes(factory.id)}
                        title="Ver Cotações"
                        className="action-btn"
                        style={{
                            borderRadius: '6px',
                            padding: '6px 8px',
                            borderWidth: '1px',
                            fontWeight: '500',
                            minWidth: '32px',
                            filter: 'invert(1)',
                            backgroundColor: 'transparent'
                        }}
                    >
                        <span className="material-icons" style={{fontSize: '16px'}}>assessment</span>
                    </Button>
                    <Button 
                        variant="outline-success" 
                        size="sm"
                        onClick={() => onImport(factory.id)}
                        title="Importar Cotações"
                        className="action-btn"
                        style={{
                            borderRadius: '6px',
                            padding: '6px 8px',
                            borderWidth: '1px',
                            fontWeight: '500',
                            minWidth: '32px',
                            filter: 'invert(1)',
                            backgroundColor: 'transparent'
                        }}
                    >
                        <span className="material-icons" style={{fontSize: '16px'}}>upload</span>
                    </Button>
                    <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => onDelete(factory.id)}
                        title="Excluir Fábrica"
                        className="action-btn"
                        style={{
                            borderRadius: '6px',
                            padding: '6px 8px',
                            borderWidth: '1px',
                            fontWeight: '500',
                            minWidth: '32px',
                            filter: 'invert(1)',
                            backgroundColor: 'transparent'
                        }}
                    >
                        <span className="material-icons" style={{fontSize: '16px'}}>delete</span>
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};

export default FactoryCard;

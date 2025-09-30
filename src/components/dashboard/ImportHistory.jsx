import React from 'react';
import { Card, Button, Badge, Row, Col } from 'react-bootstrap';

const ImportHistory = ({ 
    imports, 
    quotes, 
    onViewImport, 
    onEditImport 
}) => {
    if (!imports || imports.length === 0) return null;

    return (
        <div className="mb-4">
            <h6 className="mb-3">
                <span className="material-icons me-2" style={{fontSize: '20px', verticalAlign: 'middle'}}>history</span>
                Histórico de Importações ({imports.length})
            </h6>
            <Row className="g-3">
                {imports.map((importData, index) => (
                    <Col key={index} md={6} lg={4}>
                        <Card 
                            className="shadow-sm import-card" 
                            style={{
                                border: 'none',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                            }}
                            onClick={() => onViewImport(importData, quotes)}
                        >
                            <Card.Body className="p-4">
                                {/* Cabeçalho do Card */}
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h6 
                                            className="mb-1 fw-bold" 
                                            style={{color: '#2c3e50', fontSize: '1rem'}}
                                        >
                                            Importação #{index + 1}
                                        </h6>
                                        <div className="text-muted small">
                                            <div className="d-flex align-items-center mb-1">
                                                <span className="material-icons me-1" style={{fontSize: '14px'}}>event</span>
                                                <span>{importData.date}</span>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <span className="material-icons me-1" style={{fontSize: '14px'}}>schedule</span>
                                                <span>{importData.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Badge 
                                        className="px-2 py-1" 
                                        style={{
                                            fontSize: '0.75rem',
                                            borderRadius: '15px',
                                            fontWeight: '600',
                                            backgroundColor: '#007bff'
                                        }}
                                    >
                                        {importData.count} itens
                                    </Badge>
                                </div>
                                
                                {/* Estatísticas da Importação */}
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <div className="d-flex align-items-center">
                                            <span 
                                                className="material-icons me-2" 
                                                style={{fontSize: '18px', color: '#28a745'}}
                                            >
                                                attach_money
                                            </span>
                                            <div>
                                                <div 
                                                    className="fw-bold text-success" 
                                                    style={{fontSize: '1.1rem'}}
                                                >
                                                    R$ {importData.totalValue.toFixed(2)}
                                                </div>
                                                <small className="text-muted">Valor Total</small>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center">
                                            <span 
                                                className="material-icons me-2" 
                                                style={{fontSize: '18px', color: '#007bff'}}
                                            >
                                                trending_up
                                            </span>
                                            <div>
                                                <div 
                                                    className="fw-bold text-primary" 
                                                    style={{fontSize: '1rem'}}
                                                >
                                                    R$ {(importData.totalValue / importData.count).toFixed(2)}
                                                </div>
                                                <small className="text-muted">Valor Médio</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Informações Adicionais */}
                                <div className="border-top pt-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <small className="text-muted">
                                            <span className="material-icons me-1" style={{fontSize: '14px'}}>event</span>
                                            {importData.datetime.toLocaleDateString('pt-BR')} às {importData.time}
                                        </small>
                                        <div className="d-flex gap-1">
                                            <Button 
                                                variant="outline-primary" 
                                                size="sm"
                                                style={{
                                                    fontSize: '0.7rem',
                                                    padding: '3px 6px',
                                                    borderRadius: '4px',
                                                    borderWidth: '1px'
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onViewImport(importData, quotes);
                                                }}
                                            >
                                                <span className="material-icons" style={{fontSize: '12px'}}>visibility</span>
                                            </Button>
                                            <Button 
                                                variant="outline-warning" 
                                                size="sm"
                                                style={{
                                                    fontSize: '0.7rem',
                                                    padding: '3px 6px',
                                                    borderRadius: '4px',
                                                    borderWidth: '1px'
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditImport(importData);
                                                }}
                                            >
                                                <span className="material-icons" style={{fontSize: '12px'}}>edit</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default ImportHistory;

import React from 'react';
import { Button, Badge, Row, Col } from 'react-bootstrap';
import QuoteCard from './QuoteCard';

const QuotesTable = ({ 
    quotes, 
    onDeleteQuote, 
    showMultiSelect, 
    onToggleMultiSelect, 
    selectedQuotes, 
    onSelectionChange, 
    onBulkAction,
    onImageUpdate,
    onRefresh
}) => {
    const totalValue = quotes.reduce((total, quote) => total + (quote.amount || 0), 0);

    const handleToggleSelect = (quoteId) => {
        const isSelected = selectedQuotes.includes(quoteId);
        if (isSelected) {
            onSelectionChange(selectedQuotes.filter(id => id !== quoteId));
        } else {
            onSelectionChange([...selectedQuotes, quoteId]);
        }
    };

    return (
        <div>
            {/* Controles das Cotações */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-3">
                    <h6 className="mb-0">
                        <span className="material-icons me-2" style={{fontSize: '20px', verticalAlign: 'middle'}}>grid_view</span>
                        Produtos ({quotes.length})
                    </h6>
                    <Badge bg="success" className="px-3 py-2">
                        <span className="material-icons me-1" style={{fontSize: '16px'}}>attach_money</span>
                        Valor Total: R$ {totalValue.toFixed(2)}
                    </Badge>
                </div>
                <div className="d-flex gap-2">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={onRefresh}
                        className="d-flex align-items-center gap-1"
                        title="Atualizar produtos"
                    >
                        <span className="material-icons" style={{fontSize: '16px'}}>refresh</span>
                        Atualizar
                    </Button>
                    <Button
                        variant={showMultiSelect ? "success" : "outline-primary"}
                        size="sm"
                        onClick={onToggleMultiSelect}
                        className="d-flex align-items-center gap-1"
                    >
                        <span className="material-icons" style={{fontSize: '16px'}}>
                            {showMultiSelect ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                        {showMultiSelect ? 'Cancelar Seleção' : 'Seleção Múltipla'}
                    </Button>
                    {showMultiSelect && selectedQuotes.length > 0 && (
                        <Badge bg="primary" className="px-3 py-2">
                            <span className="material-icons me-1" style={{fontSize: '16px'}}>check_circle</span>
                            {selectedQuotes.length} selecionados
                        </Badge>
                    )}
                </div>
            </div>
            
            {/* Cards de Cotações */}
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <Row className="g-3">
                    {quotes.map((quote) => (
                        <Col key={quote.id} xs={12} sm={6} md={4} lg={3} xl={2}>
                            <QuoteCard
                                quote={quote}
                                onDeleteQuote={onDeleteQuote}
                                isSelected={selectedQuotes.includes(quote.id)}
                                onToggleSelect={showMultiSelect ? () => handleToggleSelect(quote.id) : null}
                                onImageUpdate={onImageUpdate}
                            />
                        </Col>
                    ))}
                </Row>
                
                {quotes.length === 0 && (
                    <div className="text-center p-5">
                        <div className="mb-3">
                            <span className="material-icons" style={{fontSize: '4rem', color: '#6c757d'}}>inventory_2</span>
                        </div>
                        <h5>Nenhum produto encontrado</h5>
                        <p className="text-muted">Não há produtos nesta importação</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuotesTable;

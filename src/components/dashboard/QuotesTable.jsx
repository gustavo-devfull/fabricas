import React from 'react';
import { Button, Badge, Row, Col } from 'react-bootstrap';
import QuoteCard from './QuoteCard';

const QuotesTable = ({ 
    quotes, 
    onDeleteQuote, 
    onDuplicateQuote,
    showMultiSelect, 
    onToggleMultiSelect, 
    selectedQuotes, 
    onSelectionChange, 
    onBulkAction,
    onImageUpdate,
    onRefresh,
    selectedForOrder = [],
    onToggleOrderSelect = null,
    onImportImages = null,
    onUpdateImport = null,
    quoteImports = []
}) => {

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
            {/* Controles das Cotações - Layout Responsivo */}
            <div className="mb-3">
                {/* Desktop: Título e botões lado a lado */}
                <div className="d-none d-md-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                        <h6 className="mb-0" id="productos-section">
                            <span className="material-icons me-2" style={{fontSize: '20px', verticalAlign: 'middle'}}>grid_view</span>
                            Produtos ({quotes.length})
                        </h6>
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
                                <span className="material-icons me-1" style={{
                                    fontSize: '16px'}}>check_circle</span>
                                {selectedQuotes.length} selecionados
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Mobile: Título primeiro, botões embaixo */}
                <div className="d-md-none">
                    <div className="d-flex align-items-center gap-3 mb-3">
                        <h6 className="mb-0" id="productos-section">
                            <span className="material-icons me-2" style={{fontSize: '20px', verticalAlign: 'middle'}}>grid_view</span>
                            Produtos ({quotes.length})
                        </h6>
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={onRefresh}
                            className="d-flex align-items-center gap-1 flex-fill"
                            title="Atualizar produtos"
                        >
                            <span className="material-icons" style={{fontSize: '16px'}}>refresh</span>
                            Atualizar
                        </Button>
                        <Button
                            variant={showMultiSelect ? "success" : "outline-primary"}
                            size="sm"
                            onClick={onToggleMultiSelect}
                            className="d-flex align-items-center gap-1 flex-fill"
                        >
                            <span className="material-icons" style={{fontSize: '16px'}}>
                                {showMultiSelect ? 'check_box' : 'check_box_outline_blank'}
                            </span>
                            {showMultiSelect ? 'Cancelar Seleção' : 'Seleção Múltipla'}
                        </Button>
                    </div>
                    {showMultiSelect && selectedQuotes.length > 0 && (
                        <div className="mt-2">
                            <Badge bg="primary" className="px-3 py-2">
                                <span className="material-icons me-1" style={{fontSize: '16px'}}>check_circle</span>
                                {selectedQuotes.length} selecionados
                            </Badge>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Cards de Cotações */}
            <div>
                <div className="d-flex flex-column gap-3">
                    {quotes.map((quote) => (
                        <div key={quote.id} style={{ width: '100%' }}>
                            <QuoteCard
                                quote={quote}
                                onDeleteQuote={onDeleteQuote}
                                onDuplicateQuote={onDuplicateQuote}
                                isSelected={selectedQuotes.includes(quote.id)}
                                onToggleSelect={showMultiSelect ? () => handleToggleSelect(quote.id) : null}
                                onImageUpdate={onImageUpdate}
                                isSelectedForOrder={selectedForOrder.includes(quote.id)}
                                onToggleOrderSelect={onToggleOrderSelect}
                                onImportImages={onImportImages}
                                onUpdateImport={onUpdateImport}
                            />
                        </div>
                    ))}
                </div>
                
                {quotes.length === 0 && (
                    <div className="text-center p-5">
                        <div className="mb-3">
                            <span className="material-icons" style={{fontSize: '4rem', color: '#6c757d'}}>inventory_2</span>
                        </div>
                        <h5>Nenhum produto encontrado</h5>
                        <p style={{color: 'black'}}>Não há produtos nesta importação</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuotesTable;

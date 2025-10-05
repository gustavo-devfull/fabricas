import React from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import ImportHistory from './ImportHistory';
import EditImportModal from './EditImportModal';
import QuotesTable from './QuotesTable';
import MultiSelectProducts from '../MultiSelectProducts';

const QuotesSection = ({
    show,
    selectedFactoryForQuotes,
    factoryName,
    quotes,
    allQuotes,
    quoteImports,
    editingImport,
    editingQuotes,
    selectedQuotes,
    showMultiSelect,
    onClose,
    onViewImport,
    onEditImport,
    onUpdateQuote,
    onSaveImport,
    onCancelEdit,
    onDeleteQuote,
    onToggleMultiSelect,
    onSelectionChange,
    onBulkAction,
    onImageUpdate,
    onRefresh,
    selectedForOrder = [],
    onToggleOrderSelect = null,
    selectedImportId = null,
    loading = false,
    onImportImages = null,
    onUpdateImport = null,
    onDuplicateQuote = null
}) => {
    if (!show) return null;

    return (
        <div className="mb-4">
            <Card className="shadow-sm">
                <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        <span className="material-icons me-2" style={{fontSize: '24px', verticalAlign: 'middle'}}>assessment</span>
                        Cotações - {factoryName}
                    </h5>
                    <Button variant="outline-light" size="sm" onClick={onClose}>
                        <span className="material-icons" style={{fontSize: '18px'}}>close</span>
                    </Button>
                </Card.Header>
                <Card.Body>
                    {quotes.length === 0 ? (
                        <div className="text-center p-4">
                            <div className="mb-3">
                                <span className="material-icons" style={{fontSize: '4rem', color: '#6c757d'}}>description</span>
                            </div>
                            <h5>Nenhuma cotação encontrada</h5>
                            <p className="text-muted">Esta fábrica ainda não possui cotações importadas</p>
                            <Button 
                                variant="success" 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('Redirecionando para página de importação');
                                    window.location.href = '/admin/import';
                                }}
                            >
                                <span className="material-icons me-1" style={{fontSize: '18px'}}>upload</span>
                                Importar Cotações
                            </Button>
                        </div>
                    ) : (
                        <div>
                            {/* Card da Cotação Selecionada */}
                            {selectedImportId && quoteImports.find(imp => imp.id === selectedImportId) && (
                                <div className="mb-4">
                                    <Card className="border-primary shadow-sm">
                                        <Card.Header className="bg-primary text-white">
                                            <h6 className="mb-0">
                                                <span className="material-icons me-2" style={{fontSize: '20px'}}>assessment</span>
                                                Cotação Selecionada: {quoteImports.find(imp => imp.id === selectedImportId).importName || 'Cotação'}
                                            </h6>
                                        </Card.Header>
                                        <Card.Body>
                                            <div className="row align-items-center">
                                                <div className="col-md-3 text-center">
                                                    <div style={{color: 'black', fontWeight: 'bold', fontSize: '0.9rem'}}>
                                                        Produtos Selecionados
                                                    </div>
                                                    <div style={{color: '#007bff', fontSize: '1.4rem', fontWeight: 'bold'}}>
                                                        {selectedForOrder.filter(id => quotes.some(quote => quote.id === id)).length}
                                                    </div>
                                                </div>
                                                <div className="col-md-3 text-center">
                                                    <div style={{color: 'black', fontWeight: 'bold', fontSize: '0.9rem'}}>
                                                        Valor Total Selecionados
                                                    </div>
                                                    <div style={{color: '#28a745', fontSize: '1.4rem', fontWeight: 'bold'}}>
                                                        ¥ {(quotes.filter(quote => selectedForOrder.includes(quote.id)).reduce((total, quote) => {
                                                            const amount = Number(quote.amount) || 0;
                                                            return total + amount;
                                                        }, 0)).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                                    </div>
                                                </div>
                                                <div className="col-md-3 text-center">
                                                    <div style={{color: 'black', fontWeight: 'bold', fontSize: '0.9rem'}}>
                                                        CBM Total Selecionados
                                                    </div>
                                                    <div style={{color: '#ffc107', fontSize: '1.4rem', fontWeight: 'bold'}}>
                                                        {quotes.filter(quote => selectedForOrder.includes(quote.id)).reduce((total, quote) => {
                                                            const cbmTotal = Number(quote.cbmTotal) || Number(quote.cbm) || 0;
                                                            return total + cbmTotal;
                                                        }, 0).toFixed(3).replace('.', ',')} m³
                                                    </div>
                                                </div>
                                                <div className="col-md-3 text-center">
                                                    <div style={{color: 'black', fontWeight: 'bold', fontSize: '0.9rem'}}>
                                                        Valor Total da Cotação
                                                    </div>
                                                    <div style={{color: '#6c757d', fontSize: '1.4rem', fontWeight: 'bold'}}>
                                                        ¥ {(quotes.reduce((total, quote) => {
                                                            const amount = Number(quote.amount) || 0;
                                                            return total + amount;
                                                        }, 0)).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </div>
                            )}

                            {/* Histórico de Importações */}
                            <ImportHistory
                                imports={quoteImports}
                                quotes={allQuotes}
                                onViewImport={onViewImport}
                                onEditImport={onEditImport}
                                onDuplicateQuote={onDuplicateQuote}
                                selectedForOrder={selectedForOrder}
                                selectedImportId={selectedImportId}
                            />

                            {/* Modal de Edição de Importação */}
                            <EditImportModal
                                editingImport={editingImport}
                                editingQuotes={editingQuotes}
                                onUpdateQuote={onUpdateQuote}
                                onSave={onSaveImport}
                                onCancel={onCancelEdit}
                                loading={loading}
                            />

                            {/* Exibição das Cotações */}
                            {showMultiSelect ? (
                                <MultiSelectProducts
                                    products={quotes}
                                    selectedProducts={selectedQuotes}
                                    onSelectionChange={onSelectionChange}
                                    onBulkAction={onBulkAction}
                                    title="Selecionar Cotações para Ação em Lote"
                                    showBulkActions={true}
                                />
                            ) : (
                                <QuotesTable
                                    quotes={quotes}
                                    onDeleteQuote={onDeleteQuote}
                                    onDuplicateQuote={onDuplicateQuote}
                                    showMultiSelect={showMultiSelect}
                                    onToggleMultiSelect={onToggleMultiSelect}
                                    selectedQuotes={selectedQuotes}
                                    onSelectionChange={onSelectionChange}
                                    onBulkAction={onBulkAction}
                                    onImageUpdate={onImageUpdate}
                                    onRefresh={onRefresh}
                                    selectedForOrder={selectedForOrder}
                                    onToggleOrderSelect={onToggleOrderSelect}
                                    onImportImages={onImportImages}
                                    onUpdateImport={onUpdateImport}
                                    quoteImports={quoteImports}
                                />
                            )}
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default QuotesSection;

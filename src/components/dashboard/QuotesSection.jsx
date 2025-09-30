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
    loading = false
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
                                onClick={() => window.location.href = '/admin/import'}
                            >
                                <span className="material-icons me-1" style={{fontSize: '18px'}}>upload</span>
                                Importar Cotações
                            </Button>
                        </div>
                    ) : (
                        <div>
                            {/* Histórico de Importações */}
                            <ImportHistory
                                imports={quoteImports}
                                quotes={quotes}
                                onViewImport={onViewImport}
                                onEditImport={onEditImport}
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
                                    showMultiSelect={showMultiSelect}
                                    onToggleMultiSelect={onToggleMultiSelect}
                                    selectedQuotes={selectedQuotes}
                                    onSelectionChange={onSelectionChange}
                                    onBulkAction={onBulkAction}
                                    onImageUpdate={onImageUpdate}
                                    onRefresh={onRefresh}
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

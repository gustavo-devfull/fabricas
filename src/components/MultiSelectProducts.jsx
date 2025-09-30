import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Badge, Alert } from 'react-bootstrap';

const MultiSelectProducts = ({ 
    products = [], 
    selectedProducts = [], 
    onSelectionChange,
    onBulkAction,
    title = "Selecionar Produtos",
    showBulkActions = true
}) => {
    const [selected, setSelected] = useState(selectedProducts);
    const [selectAll, setSelectAll] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [bulkAction, setBulkAction] = useState(null);

    useEffect(() => {
        setSelected(selectedProducts);
        setSelectAll(products.length > 0 && selectedProducts.length === products.length);
    }, [selectedProducts, products]);

    const handleSelectProduct = (productId) => {
        const newSelected = selected.includes(productId)
            ? selected.filter(id => id !== productId)
            : [...selected, productId];
        
        setSelected(newSelected);
        setSelectAll(newSelected.length === products.length);
        onSelectionChange?.(newSelected);
    };

    const handleSelectAll = () => {
        const newSelected = selectAll ? [] : products.map(p => p.id);
        setSelected(newSelected);
        setSelectAll(!selectAll);
        onSelectionChange?.(newSelected);
    };

    const handleBulkAction = (action) => {
        setBulkAction(action);
        setShowConfirmModal(true);
    };

    const confirmBulkAction = () => {
        if (bulkAction && selected.length > 0) {
            onBulkAction?.(bulkAction, selected);
        }
        setShowConfirmModal(false);
        setBulkAction(null);
    };

    const getBulkActionLabel = (action) => {
        switch (action) {
            case 'delete': return 'Excluir Selecionados';
            case 'export': return 'Exportar Selecionados';
            case 'duplicate': return 'Duplicar Selecionados';
            default: return 'Ação em Lote';
        }
    };

    const getBulkActionVariant = (action) => {
        switch (action) {
            case 'delete': return 'danger';
            case 'export': return 'primary';
            case 'duplicate': return 'success';
            default: return 'secondary';
        }
    };

    return (
        <>
            <Card className="shadow-sm">
                <Card.Header className="bg-primary text-white">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{title}</h5>
                        <div className="d-flex align-items-center gap-2">
                            <Badge bg="light" text="dark" className="px-3 py-2">
                                {selected.length} selecionados
                            </Badge>
                            {selected.length > 0 && (
                                <Button
                                    variant="outline-light"
                                    size="sm"
                                    onClick={() => {
                                        setSelected([]);
                                        setSelectAll(false);
                                        onSelectionChange?.([]);
                                    }}
                                >
                                    Limpar Seleção
                                </Button>
                            )}
                        </div>
                    </div>
                </Card.Header>
                
                <Card.Body className="p-4">
                    {/* Controles de Seleção */}
                    <div className="mb-4 p-3 bg-light rounded">
                        <div className="d-flex justify-content-between align-items-center">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={selectAll}
                                    onChange={handleSelectAll}
                                    id="selectAll"
                                />
                                <label className="form-check-label fw-bold" htmlFor="selectAll">
                                    Selecionar Todos ({products.length} produtos)
                                </label>
                            </div>
                            
                            {showBulkActions && selected.length > 0 && (
                                <div className="d-flex gap-2">
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => handleBulkAction('export')}
                                        className="d-flex align-items-center gap-1"
                                    >
                                        <span className="material-icons" style={{fontSize: '16px'}}>download</span>
                                        Exportar
                                    </Button>
                                    <Button
                                        variant="outline-success"
                                        size="sm"
                                        onClick={() => handleBulkAction('duplicate')}
                                        className="d-flex align-items-center gap-1"
                                    >
                                        <span className="material-icons" style={{fontSize: '16px'}}>content_copy</span>
                                        Duplicar
                                    </Button>
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => handleBulkAction('delete')}
                                        className="d-flex align-items-center gap-1"
                                    >
                                        <span className="material-icons" style={{fontSize: '16px'}}>delete</span>
                                        Excluir
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lista de Produtos */}
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {products.length === 0 ? (
                            <Alert variant="info" className="text-center">
                                <span className="material-icons mb-2" style={{fontSize: '2rem'}}>inbox</span>
                                <div>Nenhum produto encontrado</div>
                            </Alert>
                        ) : (
                            <div className="row g-2">
                                {products.map((product) => (
                                    <div key={product.id} className="col-12">
                                        <div
                                            className={`p-3 rounded border transition-all ${
                                                selected.includes(product.id)
                                                    ? 'border-primary bg-primary bg-opacity-10'
                                                    : 'border-light hover-border-secondary hover-bg-light'
                                            }`}
                                            style={{
                                                transition: 'all 0.2s ease',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => handleSelectProduct(product.id)}
                                        >
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={selected.includes(product.id)}
                                                        onChange={() => handleSelectProduct(product.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                                
                                                <div className="flex-grow-1">
                                                    <div className="d-flex align-items-center gap-2 mb-1">
                                                        <h6 className="mb-0 fw-bold text-dark">
                                                            {product.ref || 'N/A'}
                                                        </h6>
                                                        {selected.includes(product.id) && (
                                                            <Badge bg="primary" className="px-2 py-1">
                                                                Selecionado
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    
                                                    <p className="mb-1 text-muted small">
                                                        {product.description || 'Sem descrição'}
                                                    </p>
                                                    
                                                    <div className="d-flex flex-wrap gap-3 text-muted small">
                                                        <span><strong>Qty:</strong> {product.qty || 0}</span>
                                                        <span><strong>Preço:</strong> R$ {product.unitPrice?.toFixed(2) || '0.00'}</span>
                                                        <span><strong>Total:</strong> R$ {product.amount?.toFixed(2) || '0.00'}</span>
                                                        {product.cbm && <span><strong>CBM:</strong> {product.cbm}</span>}
                                                        {product.grossWeight && <span><strong>Peso:</strong> {product.grossWeight}g</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card.Body>
            </Card>

            {/* Modal de Confirmação */}
            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Ação</Modal.Title>
                </Modal.Header>
                
                <Modal.Body>
                    <p>
                        Tem certeza que deseja <strong>{getBulkActionLabel(bulkAction).toLowerCase()}</strong> {selected.length} produto(s) selecionado(s)?
                    </p>
                    
                    {bulkAction === 'delete' && (
                        <Alert variant="danger" className="mt-3">
                            <div className="d-flex align-items-center">
                                <span className="material-icons me-2">warning</span>
                                <strong>Esta ação não pode ser desfeita!</strong>
                            </div>
                        </Alert>
                    )}
                </Modal.Body>
                
                <Modal.Footer>
                    <Button 
                        variant="secondary" 
                        onClick={() => setShowConfirmModal(false)}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        variant={getBulkActionVariant(bulkAction)}
                        onClick={confirmBulkAction}
                    >
                        Confirmar
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default MultiSelectProducts;
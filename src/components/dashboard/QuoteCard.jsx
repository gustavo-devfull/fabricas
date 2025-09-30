import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import ImageUpload from './ImageUpload';

const QuoteCard = ({ 
    quote, 
    onDeleteQuote, 
    isSelected = false, 
    onToggleSelect = null,
    onImageUpdate = null
}) => {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };

    const formatNumber = (value, decimals = 2) => {
        return (value || 0).toFixed(decimals);
    };

    return (
        <Card 
            className={`shadow-sm h-100 quote-card ${isSelected ? 'border-primary' : ''}`}
            style={{
                border: isSelected ? '2px solid #007bff' : '1px solid #e9ecef',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                cursor: 'pointer',
                overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
            }}
        >
            <Card.Body className="p-3">
                {/* Imagem do produto */}
                {quote.imageUrl && (
                    <div className="mb-3 text-center">
                        <div 
                            style={{
                                width: '100%',
                                aspectRatio: '1/1',
                                borderRadius: '8px',
                                border: '1px solid #e9ecef',
                                overflow: 'hidden',
                                backgroundColor: '#f8f9fa',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <img 
                                src={quote.imageUrl} 
                                alt={quote.name || quote.description || 'Produto'}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: '8px'
                                }}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = `
                                        <div style="color: #6c757d; font-size: 0.8rem;">
                                            <span class="material-icons" style="font-size: 2rem;">image_not_supported</span>
                                            <div>Imagem não encontrada</div>
                                        </div>
                                    `;
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Upload de imagem */}
                <div className="mb-3">
                    <ImageUpload 
                        quote={quote} 
                        onImageUpdate={onImageUpdate}
                    />
                </div>

                {/* Cabeçalho com REF e ações */}
                <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex align-items-center">
                        {onToggleSelect && (
                            <input
                                type="checkbox"
                                className="form-check-input me-2"
                                checked={isSelected}
                                onChange={onToggleSelect}
                                onClick={(e) => e.stopPropagation()}
                                style={{transform: 'scale(0.9)'}}
                            />
                        )}
                        <Badge 
                            bg="primary" 
                            className="px-2 py-1"
                            style={{
                                fontSize: '0.7rem',
                                borderRadius: '6px',
                                fontWeight: '600',
                                letterSpacing: '0.5px'
                            }}
                        >
                            {quote.ref || 'N/A'}
                        </Badge>
                    </div>
                    <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteQuote(quote.id);
                        }}
                        title="Excluir Cotação"
                        style={{
                            padding: '4px 6px',
                            borderRadius: '6px',
                            borderWidth: '1px'
                        }}
                    >
                        <span className="material-icons" style={{fontSize: '14px'}}>delete</span>
                    </Button>
                </div>

                {/* Informações principais */}
                <div className="mb-3">
                    <h6 className="fw-bold text-dark mb-1" style={{fontSize: '0.9rem', lineHeight: '1.2'}}>
                        {quote.name || quote.description || 'Produto sem nome'}
                    </h6>
                    {quote.description && quote.description !== quote.name && (
                        <p className="text-muted mb-1" style={{fontSize: '0.75rem', lineHeight: '1.3'}}>
                            {quote.description}
                        </p>
                    )}
                    {quote.englishDescription && (
                        <p className="text-info mb-0" style={{fontSize: '0.7rem', lineHeight: '1.2'}}>
                            <strong>EN:</strong> {quote.englishDescription}
                        </p>
                    )}
                </div>

                {/* Valor Total destacado */}
                <div className="mb-3 p-2 bg-success bg-opacity-10 rounded-3 border border-success border-opacity-25">
                    <div className="d-flex justify-content-between align-items-center">
                        <span className="text-success fw-bold" style={{fontSize: '0.8rem'}}>TOTAL</span>
                        <span className="text-success fw-bold" style={{fontSize: '1.1rem'}}>
                            {formatCurrency(quote.amount)}
                        </span>
                    </div>
                </div>

                {/* Grid de informações compactas */}
                <div className="row g-1 mb-3">
                    {/* Quantidade */}
                    <div className="col-6">
                        <div className="d-flex align-items-center">
                            <span className="material-icons me-1 text-primary" style={{fontSize: '14px'}}>inventory</span>
                            <span className="text-muted" style={{fontSize: '0.65rem'}}>QTY:</span>
                            <span className="fw-bold ms-1" style={{fontSize: '0.8rem'}}>{formatNumber(quote.qty, 0)}</span>
                        </div>
                    </div>

                    {/* Preço Unitário */}
                    <div className="col-6">
                        <div className="d-flex align-items-center">
                            <span className="material-icons me-1 text-success" style={{fontSize: '14px'}}>attach_money</span>
                            <span className="text-muted" style={{fontSize: '0.65rem'}}>UNIT:</span>
                            <span className="fw-bold ms-1 text-success" style={{fontSize: '0.8rem'}}>
                                {formatCurrency(quote.unitPrice)}
                            </span>
                        </div>
                    </div>

                    {/* Unidade */}
                    <div className="col-6">
                        <div className="d-flex align-items-center">
                            <span className="material-icons me-1 text-info" style={{fontSize: '14px'}}>straighten</span>
                            <span className="text-muted" style={{fontSize: '0.65rem'}}>UNIT:</span>
                            <span className="fw-bold ms-1" style={{fontSize: '0.8rem'}}>{quote.unit || 'N/A'}</span>
                        </div>
                    </div>

                    {/* CBM */}
                    <div className="col-6">
                        <div className="d-flex align-items-center">
                            <span className="material-icons me-1 text-warning" style={{fontSize: '14px'}}>crop_free</span>
                            <span className="text-muted" style={{fontSize: '0.65rem'}}>CBM:</span>
                            <span className="fw-bold ms-1" style={{fontSize: '0.8rem'}}>{formatNumber(quote.cbm)}</span>
                        </div>
                    </div>

                    {/* Peso */}
                    <div className="col-6">
                        <div className="d-flex align-items-center">
                            <span className="material-icons me-1 text-secondary" style={{fontSize: '14px'}}>fitness_center</span>
                            <span className="text-muted" style={{fontSize: '0.65rem'}}>PESO:</span>
                            <span className="fw-bold ms-1" style={{fontSize: '0.8rem'}}>{formatNumber(quote.grossWeight)}kg</span>
                        </div>
                    </div>

                    {/* CTNS */}
                    <div className="col-6">
                        <div className="d-flex align-items-center">
                            <span className="material-icons me-1 text-dark" style={{fontSize: '14px'}}>inventory_2</span>
                            <span className="text-muted" style={{fontSize: '0.65rem'}}>CTNS:</span>
                            <span className="fw-bold ms-1" style={{fontSize: '0.8rem'}}>{quote.ctns || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Dimensões */}
                {(quote.length || quote.width || quote.height) && (
                    <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                            <span className="material-icons me-1 text-muted" style={{fontSize: '14px'}}>aspect_ratio</span>
                            <span className="text-muted fw-bold" style={{fontSize: '0.7rem'}}>DIMENSÕES</span>
                        </div>
                        <div className="row g-1">
                            <div className="col-4">
                                <div className="text-center p-1 bg-light rounded-2">
                                    <div className="text-muted" style={{fontSize: '0.6rem'}}>L</div>
                                    <div className="fw-bold" style={{fontSize: '0.75rem'}}>{formatNumber(quote.length)}</div>
                                </div>
                            </div>
                            <div className="col-4">
                                <div className="text-center p-1 bg-light rounded-2">
                                    <div className="text-muted" style={{fontSize: '0.6rem'}}>W</div>
                                    <div className="fw-bold" style={{fontSize: '0.75rem'}}>{formatNumber(quote.width)}</div>
                                </div>
                            </div>
                            <div className="col-4">
                                <div className="text-center p-1 bg-light rounded-2">
                                    <div className="text-muted" style={{fontSize: '0.6rem'}}>H</div>
                                    <div className="fw-bold" style={{fontSize: '0.75rem'}}>{formatNumber(quote.height)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Informações adicionais */}
                <div className="border-top pt-2">
                    <div className="row g-1">
                        {/* NCM */}
                        {quote.ncm && (
                            <div className="col-6">
                                <div className="text-muted" style={{fontSize: '0.6rem'}}>NCM</div>
                                <div className="fw-bold" style={{fontSize: '0.75rem'}}>{quote.ncm}</div>
                            </div>
                        )}

                        {/* Peso Unitário */}
                        {quote.pesoUnitario && (
                            <div className="col-6">
                                <div className="text-muted" style={{fontSize: '0.6rem'}}>PESO UNIT.</div>
                                <div className="fw-bold" style={{fontSize: '0.75rem'}}>{formatNumber(quote.pesoUnitario)}g</div>
                            </div>
                        )}

                        {/* CBM Total */}
                        {quote.cbmTotal && (
                            <div className="col-6">
                                <div className="text-muted" style={{fontSize: '0.6rem'}}>CBM TOTAL</div>
                                <div className="fw-bold" style={{fontSize: '0.75rem'}}>{formatNumber(quote.cbmTotal)}</div>
                            </div>
                        )}

                        {/* Peso Total */}
                        {quote.totalGrossWeight && (
                            <div className="col-6">
                                <div className="text-muted" style={{fontSize: '0.6rem'}}>PESO TOTAL</div>
                                <div className="fw-bold" style={{fontSize: '0.75rem'}}>{formatNumber(quote.totalGrossWeight)}kg</div>
                            </div>
                        )}
                    </div>

                    {/* Observações */}
                    {(quote.remark || quote.obs) && (
                        <div className="mt-2">
                            {quote.remark && (
                                <div className="mb-1">
                                    <div className="text-muted" style={{fontSize: '0.6rem'}}>REMARK</div>
                                    <div style={{fontSize: '0.7rem', lineHeight: '1.2'}}>{quote.remark}</div>
                                </div>
                            )}
                            {quote.obs && (
                                <div>
                                    <div className="text-muted" style={{fontSize: '0.6rem'}}>OBS</div>
                                    <div style={{fontSize: '0.7rem', lineHeight: '1.2'}}>{quote.obs}</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
};

export default QuoteCard;

import React, { useState } from 'react';
import { Card, Button, Row, Col } from 'react-bootstrap';
import Lightbox from '../Lightbox';

const EditImportModal = ({ 
    editingImport, 
    editingQuotes, 
    onUpdateQuote, 
    onSave, 
    onCancel, 
    loading = false 
}) => {
    const [showLightbox, setShowLightbox] = useState(false);
    const [lightboxImageUrl, setLightboxImageUrl] = useState('');
    const [lightboxImageAlt, setLightboxImageAlt] = useState('');

    const handleImageClick = (imageUrl, imageAlt) => {
        if (imageUrl) {
            setLightboxImageUrl(imageUrl);
            setLightboxImageAlt(imageAlt);
            setShowLightbox(true);
        }
    };

    const handleCloseLightbox = () => {
        setShowLightbox(false);
    };

    if (!editingImport) return null;

    return (
        <div className="mb-4">
            <Card className="shadow-sm" style={{border: '2px solid #ffc107'}}>
                <Card.Header className="bg-warning text-dark">
                    <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">
                            <span className="material-icons me-2" style={{fontSize: '20px', verticalAlign: 'middle'}}>edit</span>
                            Editando Importação
                        </h6>
                        <div className="d-flex gap-2">
                            <Button 
                                variant="success" 
                                size="sm"
                                onClick={onSave}
                                disabled={loading}
                            >
                                <span className="material-icons me-1" style={{fontSize: '16px'}}>save</span>
                                {loading ? 'Salvando...' : 'Salvar'}
                            </Button>
                            <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={onCancel}
                                disabled={loading}
                            >
                                <span className="material-icons me-1" style={{fontSize: '16px'}}>cancel</span>
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </Card.Header>
                <Card.Body>
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        <Row className="g-3">
                            {editingQuotes.map((quote, index) => (
                                <Col key={quote.id || index} xs={12} sm={6} md={4} lg={3}>
                                    <Card className="h-100" style={{border: '1px solid #ffc107'}}>
                                        <Card.Body className="p-3">
                                            {/* Imagem do produto (se existir) */}
                                            {quote.imageUrl && (
                                                <div className="mb-3 text-center">
                                                    <div 
                                                        style={{
                                                            width: '100%',
                                                            aspectRatio: '1/1',
                                                            borderRadius: '6px',
                                                            border: '1px solid #ffc107',
                                                            overflow: 'hidden',
                                                            backgroundColor: '#fff3cd',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                                        }}
                                                        onClick={() => handleImageClick(quote.imageUrl, 'Produto')}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.transform = 'scale(1.02)';
                                                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 193, 7, 0.3)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.transform = 'scale(1)';
                                                            e.currentTarget.style.boxShadow = 'none';
                                                        }}
                                                        title="Clique para ampliar a imagem"
                                                    >
                                                        <img 
                                                            src={quote.imageUrl} 
                                                            alt="Produto"
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover',
                                                                borderRadius: '6px'
                                                            }}
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.parentElement.innerHTML = `
                                                                    <div style="color: #856404; font-size: 0.7rem;">
                                                                        <span class="material-icons" style="font-size: 1.5rem;">image_not_supported</span>
                                                                        <div>Sem imagem</div>
                                                                    </div>
                                                                `;
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* REF */}
                                            <div className="mb-2">
                                                <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>REF</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control form-control-sm" 
                                                    value={quote.ref || ''} 
                                                    onChange={(e) => onUpdateQuote(index, 'ref', e.target.value)}
                                                    style={{fontSize: '0.8rem'}}
                                                />
                                            </div>

                                            {/* Name */}
                                            <div className="mb-2">
                                                <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>NOME</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control form-control-sm" 
                                                    value={quote.name || ''} 
                                                    onChange={(e) => onUpdateQuote(index, 'name', e.target.value)}
                                                    style={{fontSize: '0.8rem'}}
                                                />
                                            </div>

                                            {/* Description */}
                                            <div className="mb-2">
                                                <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>DESCRIÇÃO</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control form-control-sm" 
                                                    value={quote.description || ''} 
                                                    onChange={(e) => onUpdateQuote(index, 'description', e.target.value)}
                                                    style={{fontSize: '0.8rem'}}
                                                />
                                            </div>

                                            {/* CTNS e Unit/Ctn */}
                                            <div className="row g-1 mb-2">
                                                <div className="col-6">
                                                    <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>CTNS</label>
                                                    <input 
                                                        type="number" 
                                                        className="form-control form-control-sm" 
                                                        value={quote.ctns || 0} 
                                                        onChange={(e) => onUpdateQuote(index, 'ctns', parseFloat(e.target.value) || 0)}
                                                        step="0.01"
                                                        style={{fontSize: '0.8rem'}}
                                                    />
                                                </div>
                                                <div className="col-6">
                                                    <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>UNIT/CTN</label>
                                                    <input 
                                                        type="number" 
                                                        className="form-control form-control-sm" 
                                                        value={quote.unitCtn || 0} 
                                                        onChange={(e) => onUpdateQuote(index, 'unitCtn', parseFloat(e.target.value) || 0)}
                                                        step="0.01"
                                                        style={{fontSize: '0.8rem'}}
                                                    />
                                                </div>
                                            </div>

                                            {/* QTY e Unit Price */}
                                            <div className="row g-1 mb-2">
                                                <div className="col-6">
                                                    <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>QTY</label>
                                                    <input 
                                                        type="number" 
                                                        className="form-control form-control-sm" 
                                                        value={quote.qty || 0} 
                                                        onChange={(e) => onUpdateQuote(index, 'qty', parseFloat(e.target.value) || 0)}
                                                        step="0.01"
                                                        style={{fontSize: '0.8rem'}}
                                                    />
                                                </div>
                                                <div className="col-6">
                                                    <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>PREÇO UNIT.</label>
                                                    <input 
                                                        type="number" 
                                                        className="form-control form-control-sm" 
                                                        value={quote.unitPrice || 0} 
                                                        onChange={(e) => onUpdateQuote(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                        step="0.01"
                                                        style={{fontSize: '0.8rem'}}
                                                    />
                                                </div>
                                            </div>

                                            {/* Amount (calculado) */}
                                            <div className="mb-2">
                                                <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>TOTAL</label>
                                                <div className="form-control form-control-sm bg-success bg-opacity-10 fw-bold text-success border-success border-opacity-25" style={{fontSize: '0.9rem'}}>
                                                    R$ {(quote.amount || 0).toFixed(2)}
                                                </div>
                                            </div>

                                            {/* Unit */}
                                            <div className="mb-2">
                                                <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>UNIDADE</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control form-control-sm" 
                                                    value={quote.unit || ''} 
                                                    onChange={(e) => onUpdateQuote(index, 'unit', e.target.value)}
                                                    style={{fontSize: '0.8rem'}}
                                                />
                                            </div>

                                            {/* Dimensões - L, W, H */}
                                            <div className="row g-1 mb-2">
                                                <div className="col-4">
                                                    <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>L (cm)</label>
                                                    <input 
                                                        type="number" 
                                                        className="form-control form-control-sm" 
                                                        value={quote.length || 0} 
                                                        onChange={(e) => onUpdateQuote(index, 'length', parseFloat(e.target.value) || 0)}
                                                        step="0.01"
                                                        style={{fontSize: '0.8rem'}}
                                                    />
                                                </div>
                                                <div className="col-4">
                                                    <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>W (cm)</label>
                                                    <input 
                                                        type="number" 
                                                        className="form-control form-control-sm" 
                                                        value={quote.width || 0} 
                                                        onChange={(e) => onUpdateQuote(index, 'width', parseFloat(e.target.value) || 0)}
                                                        step="0.01"
                                                        style={{fontSize: '0.8rem'}}
                                                    />
                                                </div>
                                                <div className="col-4">
                                                    <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>H (cm)</label>
                                                    <input 
                                                        type="number" 
                                                        className="form-control form-control-sm" 
                                                        value={quote.height || 0} 
                                                        onChange={(e) => onUpdateQuote(index, 'height', parseFloat(e.target.value) || 0)}
                                                        step="0.01"
                                                        style={{fontSize: '0.8rem'}}
                                                    />
                                                </div>
                                            </div>

                                            {/* CBM e CBM Total */}
                                            <div className="row g-1 mb-2">
                                                <div className="col-6">
                                                    <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>CBM</label>
                                                    <input 
                                                        type="number" 
                                                        className="form-control form-control-sm" 
                                                        value={quote.cbm || 0} 
                                                        onChange={(e) => onUpdateQuote(index, 'cbm', parseFloat(e.target.value) || 0)}
                                                        step="0.01"
                                                        style={{fontSize: '0.8rem'}}
                                                    />
                                                </div>
                                                <div className="col-6">
                                                    <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>CBM TOTAL</label>
                                                    <input 
                                                        type="number" 
                                                        className="form-control form-control-sm" 
                                                        value={quote.cbmTotal || 0} 
                                                        onChange={(e) => onUpdateQuote(index, 'cbmTotal', parseFloat(e.target.value) || 0)}
                                                        step="0.01"
                                                        style={{fontSize: '0.8rem'}}
                                                    />
                                                </div>
                                            </div>

                                            {/* Pesos - Gross Weight e Net Weight */}
                                            <div className="row g-1 mb-2">
                                                <div className="col-6">
                                                    <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>PESO BRUTO (KG)</label>
                                                    <input 
                                                        type="number" 
                                                        className="form-control form-control-sm" 
                                                        value={quote.grossWeight || 0} 
                                                        onChange={(e) => onUpdateQuote(index, 'grossWeight', parseFloat(e.target.value) || 0)}
                                                        step="0.01"
                                                        style={{fontSize: '0.8rem'}}
                                                    />
                                                </div>
                                                <div className="col-6">
                                                    <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>PESO LÍQUIDO (KG)</label>
                                                    <input 
                                                        type="number" 
                                                        className="form-control form-control-sm" 
                                                        value={quote.netWeight || 0} 
                                                        onChange={(e) => onUpdateQuote(index, 'netWeight', parseFloat(e.target.value) || 0)}
                                                        step="0.01"
                                                        style={{fontSize: '0.8rem'}}
                                                    />
                                                </div>
                                            </div>

                                            {/* Total Gross Weight e Total Net Weight */}
                                            <div className="row g-1 mb-2">
                                                <div className="col-6">
                                                    <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>T.G.W (KG)</label>
                                                    <input 
                                                        type="number" 
                                                        className="form-control form-control-sm" 
                                                        value={quote.totalGrossWeight || 0} 
                                                        onChange={(e) => onUpdateQuote(index, 'totalGrossWeight', parseFloat(e.target.value) || 0)}
                                                        step="0.01"
                                                        style={{fontSize: '0.8rem'}}
                                                    />
                                                </div>
                                                <div className="col-6">
                                                    <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>T.N.W (KG)</label>
                                                    <input 
                                                        type="number" 
                                                        className="form-control form-control-sm" 
                                                        value={quote.totalNetWeight || 0} 
                                                        onChange={(e) => onUpdateQuote(index, 'totalNetWeight', parseFloat(e.target.value) || 0)}
                                                        step="0.01"
                                                        style={{fontSize: '0.8rem'}}
                                                    />
                                                </div>
                                            </div>

                                            {/* Peso Unitário */}
                                            <div className="mb-2">
                                                <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>PESO UNITÁRIO (G)</label>
                                                <input 
                                                    type="number" 
                                                    className="form-control form-control-sm" 
                                                    value={quote.pesoUnitario || 0} 
                                                    onChange={(e) => onUpdateQuote(index, 'pesoUnitario', parseFloat(e.target.value) || 0)}
                                                    step="0.01"
                                                    style={{fontSize: '0.8rem'}}
                                                />
                                            </div>

                                            {/* English Description */}
                                            <div className="mb-2">
                                                <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>DESCRIÇÃO INGLÊS</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control form-control-sm" 
                                                    value={quote.englishDescription || ''} 
                                                    onChange={(e) => onUpdateQuote(index, 'englishDescription', e.target.value)}
                                                    style={{fontSize: '0.8rem'}}
                                                />
                                            </div>

                                            {/* Import */}
                                            <div className="mb-2">
                                                <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>IMPORT</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control form-control-sm" 
                                                    value={quote.import || ''} 
                                                    onChange={(e) => onUpdateQuote(index, 'import', e.target.value)}
                                                    style={{fontSize: '0.8rem'}}
                                                />
                                            </div>

                                            {/* Import Name */}
                                            <div className="mb-2">
                                                <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>NOME IMPORTAÇÃO</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control form-control-sm" 
                                                    value={quote.importName || ''} 
                                                    onChange={(e) => onUpdateQuote(index, 'importName', e.target.value)}
                                                    style={{fontSize: '0.8rem'}}
                                                />
                                            </div>

                                            {/* NCM */}
                                            <div className="mb-2">
                                                <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>NCM</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control form-control-sm" 
                                                    value={quote.ncm || ''} 
                                                    onChange={(e) => onUpdateQuote(index, 'ncm', e.target.value)}
                                                    style={{fontSize: '0.8rem'}}
                                                />
                                            </div>

                                            {/* Remark */}
                                            <div className="mb-2">
                                                <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>REMARK</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control form-control-sm" 
                                                    value={quote.remark || ''} 
                                                    onChange={(e) => onUpdateQuote(index, 'remark', e.target.value)}
                                                    style={{fontSize: '0.8rem'}}
                                                />
                                            </div>

                                            {/* OBS */}
                                            <div className="mb-0">
                                                <label className="form-label fw-bold" style={{fontSize: '0.7rem', marginBottom: '2px'}}>OBS</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control form-control-sm" 
                                                    value={quote.obs || ''} 
                                                    onChange={(e) => onUpdateQuote(index, 'obs', e.target.value)}
                                                    style={{fontSize: '0.8rem'}}
                                                />
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>
                </Card.Body>
            </Card>

            {/* Lightbox */}
            <Lightbox
                isOpen={showLightbox}
                onClose={handleCloseLightbox}
                imageUrl={lightboxImageUrl}
                imageAlt={lightboxImageAlt}
            />
        </div>
    );
};

export default EditImportModal;

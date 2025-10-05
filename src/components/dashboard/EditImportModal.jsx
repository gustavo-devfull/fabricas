import React, { useState } from 'react';
import { Card, Button, Row, Col } from 'react-bootstrap';
import { Card as MuiCard, CardContent, Typography, Button as MuiButton, Box, TextField } from '@mui/material';
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

    // Função para renderizar campo do modal igual ao dashboard
    const renderModalField = (index, fieldName, label, value, type = 'text', options = {}) => {
        return (
            <Box sx={{ 
                backgroundColor: '#f8f9fa',
                padding: 0.5,
                borderRadius: 1,
                border: 'none',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 0.5,
                justifyContent: 'space-between',
                minWidth: '120px',
                maxWidth: '200px',
                flex: '1 1 200px'
            }}>
                <Typography variant="body2" sx={{ fontSize: '14px', color: '#495057', fontWeight: options.bold ? 'bold' : '500', flexShrink: 0 }}>
                    {label}:
                </Typography>
                <TextField
                    value={value}
                    onChange={(e) => onUpdateQuote(index, fieldName, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                    size="small"
                    type={type}
                    variant="outlined"
                    multiline={options.multiline}
                    rows={options.multiline ? 2 : undefined}
                    inputProps={{
                        min: type === 'number' ? 0 : undefined,
                        step: type === 'number' ? 0.01 : undefined,
                        maxLength: options.maxLength
                    }}
                    sx={{
                        width: options.multiline ? '150px' : '80px',
                        '& .MuiInputBase-input': {
                            textAlign: options.multiline ? 'left' : 'center',
                            fontSize: '14px',
                            padding: '4px 6px',
                            color: options.color || '#495057'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                            border: options.border || 'none'
                        },
                        '& .MuiInputBase-root': {
                            backgroundColor: options.backgroundColor || '#ffffff',
                            borderRadius: '4px'
                        }
                    }}
                />
            </Box>
        );
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
                        <Row className="g-3">
                            {editingQuotes.map((quote, index) => (
                            <Col key={quote.id || index} xs={12}>
                                <MuiCard sx={{
                                    border: '1px solid #ffc107',
                                    borderRadius: '12px',
                                    height: '100%',
                                    transition: 'all 0.3s ease',
                                    backgroundColor: '#ffffff',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 4px 15px rgba(255, 193, 7, 0.3)'
                                    }
                                }}>
                                    <CardContent sx={{ p: 0.5 }}>
                                        {/* Layout igual ao dashboard */}
                                        <div className="d-flex gap-3 mb-3">
                                            {/* Imagem */}
                                            <div className="flex-shrink-0" style={{ 
                                                width: '150px', 
                                                height: '150px'
                                            }}>
                                                {quote.imageUrl ? (
                                                    <div 
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            borderRadius: '8px',
                                                            border: '2px solid #ffc107',
                                                            overflow: 'hidden',
                                                            backgroundColor: '#f8f9fa',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.3s ease',
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                                        }}
                                                        onClick={() => handleImageClick(quote.imageUrl, 'Produto')}
                                                        title="Clique para ampliar a imagem"
                                                    >
                                                        <img 
                                                            src={quote.imageUrl} 
                                                            alt={quote.name || quote.description || 'Produto'}
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover',
                                                                borderRadius: '6px'
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div 
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            borderRadius: '8px',
                                                            border: '2px dashed #ffc107',
                                                            backgroundColor: '#f8f9fa',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: '#856404',
                                                            fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        Sem imagem
                                                </div>
                                            )}
                                            </div>

                                            {/* Campos */}
                                            <div className="flex-grow-1">
                                                <Box sx={{ 
                                                    backgroundColor: '#ffffff', 
                                                    padding: 0.5, 
                                                    borderRadius: 1,
                                                    border: 'none'
                                                }}>
                                                    {/* Campos em linha horizontal */}
                                                    <Box sx={{ 
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        flexWrap: 'wrap',
                                                        gap: 1,
                                                        padding: 0.5,
                                                        alignItems: 'center'
                                                    }}>
                                                        {/* REF */}
                                                        {renderModalField(index, 'ref', 'REF', quote.ref || '', 'text', { 
                                                            backgroundColor: '#ffffff',
                                                            color: '#007bff',
                                                            bold: true
                                                        })}

                                                        {/* NCM */}
                                                        {renderModalField(index, 'ncm', 'NCM', quote.ncm || '', 'text', { 
                                                            backgroundColor: '#f8f9fa',
                                                            border: 'none'
                                                        })}

                                                        {/* DESCRIPTION */}
                                                        {renderModalField(index, 'description', 'DESCRIPTION', quote.description || '', 'text', { 
                                                            backgroundColor: '#f8f9fa',
                                                            border: 'none',
                                                            bold: true
                                                        })}

                                                        {/* NAME */}
                                                        {renderModalField(index, 'name', 'NAME', quote.name || '', 'text', { 
                                                            backgroundColor: '#f8f9fa',
                                                            border: 'none'
                                                        })}

                                                        {/* ENGLISH DESCRIPTION */}
                                                        {renderModalField(index, 'englishDescription', 'ENGLISH', quote.englishDescription || '', 'text', { 
                                                            backgroundColor: '#f8f9fa',
                                                            border: 'none',
                                                            maxLength: 30
                                                        })}

                                                        {/* IMPORT */}
                                                        {renderModalField(index, 'import', 'IMPORT', quote.import || '', 'text', { 
                                                            backgroundColor: '#f8f9fa',
                                                            border: 'none'
                                                        })}

                                                        {/* REMARK */}
                                                        {renderModalField(index, 'remark', 'REMARK', quote.remark || '', 'text', { 
                                                            backgroundColor: '#f8f9fa',
                                                            border: 'none'
                                                        })}

                                                        {/* OBS */}
                                                        {renderModalField(index, 'obs', 'OBS', quote.obs || '', 'text', { 
                                                            backgroundColor: '#f8f9fa',
                                                            border: 'none'
                                                        })}

                                                        {/* CTNS */}
                                                        {renderModalField(index, 'ctns', 'CTNS', quote.ctns || 0, 'number', { 
                                                            backgroundColor: '#ffffff',
                                                            border: 'none'
                                                        })}

                                                        {/* UNIT/CTN */}
                                                        {renderModalField(index, 'unitCtn', 'UNIT/CTN', quote.unitCtn || 0, 'number', { 
                                                            backgroundColor: '#f8f9fa',
                                                            border: 'none'
                                                        })}

                                                        {/* Cálculo CTNS × UNIT/CTN */}
                                                        <Box sx={{ 
                                                            backgroundColor: '#f8f9fa',
                                                            padding: 0.5,
                                                            borderRadius: 1,
                                                            border: 'none',
                                                            display: 'flex',
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            gap: 0.5,
                                                            justifyContent: 'space-between',
                                                            minWidth: '120px',
                                                            maxWidth: '200px',
                                                            flex: '1 1 200px'
                                                        }}>
                                                            <Typography variant="body2" sx={{ fontSize: '14px', color: '#495057', fontWeight: 'bold', flexShrink: 0 }}>
                                                                CALC:
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 'bold', color: '#495057', textAlign: 'right', flex: 1 }}>
                                                                {(quote.ctns || 0)}×{(quote.unitCtn || 1)}={Math.round((quote.ctns || 0) * (quote.unitCtn || 1))}
                                                            </Typography>
                                                        </Box>

                                                        {/* Unit Price */}
                                                        {renderModalField(index, 'unitPrice', 'U.PRICE', quote.unitPrice || 0, 'number', { 
                                                            backgroundColor: '#ffffff',
                                                            color: '#16a34a',
                                                            border: 'none'
                                                        })}

                                                        {/* Amount - Campo calculado */}
                                                        <Box sx={{ 
                                                            backgroundColor: '#f8f9fa',
                                                            padding: 0.5,
                                                            borderRadius: 1,
                                                            border: 'none',
                                                            display: 'flex',
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            gap: 0.5,
                                                            justifyContent: 'space-between',
                                                            minWidth: '120px',
                                                            maxWidth: '200px',
                                                            flex: '1 1 200px'
                                                        }}>
                                                            <Typography variant="body2" sx={{ fontSize: '14px', color: '#495057', fontWeight: 'bold', flexShrink: 0 }}>
                                                                AMOUNT:
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 'bold', color: '#16a34a', textAlign: 'right', flex: 1 }}>
                                                                R$ {((quote.ctns || 0) * (quote.unitCtn || 1) * (quote.unitPrice || 0)).toFixed(2)}
                                                            </Typography>
                                                        </Box>

                                                        {/* UNIT */}
                                                        {renderModalField(index, 'unit', 'UNIT', quote.unit || '', 'text', { 
                                                            backgroundColor: '#f8f9fa',
                                                            border: 'none'
                                                        })}

                                                        {/* Length */}
                                                        {renderModalField(index, 'length', 'LENGTH', quote.length || 0, 'number', { 
                                                            backgroundColor: '#f8f9fa',
                                                            border: 'none'
                                                        })}

                                                        {/* Width */}
                                                        {renderModalField(index, 'width', 'WIDTH', quote.width || 0, 'number', { 
                                                            backgroundColor: '#f8f9fa',
                                                            border: 'none'
                                                        })}

                                                        {/* Height */}
                                                        {renderModalField(index, 'height', 'HEIGHT', quote.height || 0, 'number', { 
                                                            backgroundColor: '#f8f9fa',
                                                            border: 'none'
                                                        })}

                                                        {/* CBM */}
                                                        {renderModalField(index, 'cbm', 'CBM', quote.cbm || 0, 'number', { 
                                                            backgroundColor: '#f8f9fa',
                                                            border: 'none'
                                                        })}

                                                        {/* CBM Total - Campo calculado */}
                                                        <Box sx={{ 
                                                            backgroundColor: '#f8f9fa',
                                                            padding: 0.5,
                                                            borderRadius: 1,
                                                            border: 'none',
                                                            display: 'flex',
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            gap: 0.5,
                                                            justifyContent: 'space-between',
                                                            minWidth: '120px',
                                                            maxWidth: '200px',
                                                            flex: '1 1 200px'
                                                        }}>
                                                            <Typography variant="body2" sx={{ fontSize: '14px', color: '#495057', fontWeight: 'bold', flexShrink: 0 }}>
                                                                CBM TOTAL:
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 'bold', color: '#16a34a', textAlign: 'right', flex: 1 }}>
                                                                {((quote.ctns || 0) * (quote.cbm || 0)).toFixed(2)} m³
                                                            </Typography>
                                                        </Box>

                                                        {/* Gross Weight */}
                                                        {renderModalField(index, 'grossWeight', 'G.W.', quote.grossWeight || 0, 'number', { 
                                                            backgroundColor: '#f8f9fa',
                                                            border: 'none'
                                                        })}

                                                        {/* Net Weight */}
                                                        {renderModalField(index, 'netWeight', 'N.W.', quote.netWeight || 0, 'number', { 
                                                            backgroundColor: '#f8f9fa',
                                                            border: 'none'
                                                        })}

                                            {/* Peso Unitário */}
                                                        {renderModalField(index, 'pesoUnitario', 'P.U.', quote.pesoUnitario || 0, 'number', { 
                                                            backgroundColor: '#f8f9fa',
                                                            border: 'none'
                                                        })}

                                                        {/* Total Gross Weight - Campo calculado */}
                                                        <Box sx={{ 
                                                            backgroundColor: '#f8f9fa',
                                                            padding: 0.5,
                                                            borderRadius: 1,
                                                            border: 'none',
                                                            display: 'flex',
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            gap: 0.5,
                                                            justifyContent: 'space-between',
                                                            minWidth: '120px',
                                                            maxWidth: '200px',
                                                            flex: '1 1 200px'
                                                        }}>
                                                            <Typography variant="body2" sx={{ fontSize: '14px', color: '#495057', fontWeight: 'bold', flexShrink: 0 }}>
                                                                T.G.W.:
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 'bold', color: '#16a34a', textAlign: 'right', flex: 1 }}>
                                                                {((quote.ctns || 0) * (quote.grossWeight || 0)).toFixed(2)} kg
                                                            </Typography>
                                                        </Box>

                                                        {/* Total Net Weight - Campo calculado */}
                                                        <Box px={{ 
                                                            backgroundColor: '#f8f9fa',
                                                            padding: 0.5,
                                                            borderRadius: 1,
                                                            border: 'none',
                                                            display: 'flex',
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            gap: 0.5,
                                                            justifyContent: 'space-between',
                                                            minWidth: '120px',
                                                            maxWidth: '200px',
                                                            flex: '1 1 200px'
                                                        }}>
                                                            <Typography variant="body2" sx={{ fontSize: '14px', color: '#495057', fontWeight: 'bold', flexShrink: 0 }}>
                                                                T.N.W.:
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 'bold', color: '#16a34a', textAlign: 'right', flex: 1 }}>
                                                                {((quote.ctns || 0) * (quote.netWeight || 0)).toFixed(2)} kg
                                                            </Typography>
                                                        </Box>

                                                        {/* MOQ */}
                                                        {renderModalField(index, 'moq', 'MOQ', quote.moq || 0, 'text', { 
                                                            backgroundColor: '#f8f9fa',
                                                            border: 'none'
                                                        })}

                                                        {/* MOQ LOGO */}
                                                        {renderModalField(index, 'moqLogo', 'MOQ LOGO', quote.moqLogo || '', 'text', { 
                                                            backgroundColor: '#f8f9fa',
                                                            border: 'none'
                                                        })}

                                                        {/* Comentários */}
                                                        {renderModalField(index, 'comentarios', 'COMMENTS', quote.comentarios || '', 'text', { 
                                                            backgroundColor: '#f8f9fa',
                                                            border: 'none',
                                                            multiline: true,
                                                            maxLength: 100
                                                        })}
                                                    </Box>
                                                </Box>
                                            </div>
                                            </div>
                                    </CardContent>
                                </MuiCard>
                                </Col>
                            ))}
                        </Row>
                </Card.Body>
            </Card>

            {/* Lightbox */}
            <Lightbox
                show={showLightbox}
                imageUrl={lightboxImageUrl}
                imageAlt={lightboxImageAlt}
                onClose={handleCloseLightbox}
            />
        </div>
    );
};

export default EditImportModal;
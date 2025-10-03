import React, { useState } from 'react';
import { Card, Button, Badge, Row, Col } from 'react-bootstrap';
import { TextField, IconButton } from '@mui/material';
import { Save, Check, Close } from '@mui/icons-material';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const ImportHistory = ({ 
    imports, 
    quotes, 
    onViewImport, 
    onEditImport,
    selectedForOrder = [],
    selectedImportId = null
}) => {
    const [editingImportNumbers, setEditingImportNumbers] = useState({});
    const [savingImportNumbers, setSavingImportNumbers] = useState({});
    const [localImports, setLocalImports] = useState(imports);

    // Atualizar imports locais quando props mudarem
    React.useEffect(() => {
        setLocalImports(imports);
    }, [imports]);

    if (!localImports || localImports.length === 0) return null;

    // Função para formatar números com ponto para milhares e vírgula para decimais
    const formatCurrency = (value) => {
        return `¥ ${value.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    // Função para calcular CBM total dos produtos selecionados para pedido
    const calculateTotalCBM = () => {
        return quotes
            .filter(quote => selectedForOrder.includes(quote.id))
            .reduce((total, quote) => total + (quote.cbmTotal || quote.cbm || 0), 0);
    };

    // Função para calcular produtos selecionados e CBM por importação específica
    const calculateImportSpecificData = (importData) => {
        const importQuotes = quotes.filter(quote => {
            const quoteCreatedAt = quote.createdAt?.toDate?.();
            if (!quoteCreatedAt) return false;
            const quoteKey = quoteCreatedAt.toISOString().substring(0, 16);
            return quoteKey === importData.id;
        });

        const selectedQuotesInImport = importQuotes.filter(quote => 
            selectedForOrder.includes(quote.id)
        );

        const totalCBMForImport = selectedQuotesInImport.reduce(
            (total, quote) => total + (quote.cbmTotal || quote.cbm || 0), 
            0
        );

        // Calcular valor total dos produtos selecionados para pedido
        const totalAmountForImport = selectedQuotesInImport.reduce(
            (total, quote) => {
                // Primeiro tentar usar o campo amount já calculado
                const existingAmount = quote.amount;
                
                if (existingAmount && existingAmount > 0) {
                    console.log('📊 Usando amount existente:', { 
                        ref: quote.ref, 
                        existingAmount 
                    });
                    return total + existingAmount;
                } else {
                    // Se não existe ou é zero, calcular amount baseado em ctns * unitCtn * unitPrice
                    const ctns = quote.ctns || 0;
                    const unitCtn = quote.unitCtn || 1;
                    const unitPrice = quote.unitPrice || 0;
                    const calculatedAmount = ctns * unitCtn * unitPrice;
                    
                    console.log('🧮 Usando amount calculado:', { 
                        ref: quote.ref, 
                        ctns, 
                        unitCtn, 
                        unitPrice, 
                        calculatedAmount 
                    });
                    return total + calculatedAmount;
                }
            }, 
            0
        );

        return {
            selectedCount: selectedQuotesInImport.length,
            totalCBM: totalCBMForImport,
            totalAmount: totalAmountForImport,
            totalQuotes: importQuotes.length
        };
    };

    const totalCBM = calculateTotalCBM();

    // Função para salvar o número da importação
    const handleSaveImportNumber = async (importId, newNumber) => {
        try {
            setSavingImportNumbers(prev => ({ ...prev, [importId]: true }));
            
            // Atualizar o estado local imediatamente para feedback visual
            setLocalImports(prevImports => 
                prevImports.map(imp => 
                    imp.id === importId 
                        ? { ...imp, importName: newNumber }
                        : imp
                )
            );
            
            // Como as importações são criadas dinamicamente baseadas nas datas das cotações,
            // vamos atualizar todas as cotações dessa importação com o novo nome
            const importData = localImports.find(imp => imp.id === importId);
            if (importData && importData.quotes) {
                const updatePromises = importData.quotes.map(async (quote) => {
                    const quoteRef = doc(db, 'quotes', quote.id);
                    await updateDoc(quoteRef, {
                        importName: newNumber,
                        updatedAt: new Date()
                    });
                });
                
                await Promise.all(updatePromises);
                console.log('Nome da importação salvo com sucesso:', newNumber);
            }
        } catch (error) {
            console.error('Erro ao salvar nome da importação:', error);
            // Reverter a mudança local em caso de erro
            setLocalImports(prevImports => 
                prevImports.map(imp => 
                    imp.id === importId 
                        ? { ...imp, importName: imports.find(i => i.id === importId)?.importName }
                        : imp
                )
            );
        } finally {
            setSavingImportNumbers(prev => ({ ...prev, [importId]: false }));
        }
    };

    // Função para iniciar edição
    const handleStartEdit = (importId, currentNumber) => {
        setEditingImportNumbers(prev => ({ ...prev, [importId]: currentNumber }));
    };

    // Função para cancelar edição
    const handleCancelEdit = (importId) => {
        setEditingImportNumbers(prev => {
            const newState = { ...prev };
            delete newState[importId];
            return newState;
        });
    };

    return (
        <div className="mb-4">
            <Row className="g-3">
                {localImports.map((importData, index) => {
                    const isSelected = selectedImportId === importData.id;
                    const importSpecificData = calculateImportSpecificData(importData);
                    return (
                        <Col key={index} md={6} lg={4}>
                            <Card 
                                className="shadow-sm import-card" 
                                style={{
                                    border: isSelected ? '2px solid #007bff' : 'none',
                                    borderRadius: '12px',
                                    background: isSelected 
                                        ? 'linear-gradient(135deg, #e9ecef 0%, #f8f9fa 100%)'
                                        : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                                    transition: 'all 0.3s ease',
                                    cursor: 'default'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                                    }
                                }}
                            >
                            <Card.Body className="p-4">
                                {/* Cabeçalho do Card */}
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div className="d-flex align-items-center gap-2">
                                        {editingImportNumbers[importData.id] !== undefined ? (
                                            <div className="d-flex align-items-center gap-1">
                                                <TextField
                                                    value={editingImportNumbers[importData.id]}
                                                    onChange={(e) => setEditingImportNumbers(prev => ({
                                                        ...prev,
                                                        [importData.id]: e.target.value
                                                    }))}
                                                    size="small"
                                                    placeholder="Nome da importação"
                                                    sx={{
                                                        minWidth: '200px',
                                                        '& .MuiInputBase-input': {
                                                            fontSize: '1rem',
                                                            fontWeight: 'bold',
                                                            color: '#2c3e50',
                                                            padding: '4px 8px'
                                                        }
                                                    }}
                                                    inputProps={{
                                                        style: { fontSize: '1rem', fontWeight: 'bold' }
                                                    }}
                                                />
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        const newValue = editingImportNumbers[importData.id];
                                                        if (newValue && newValue !== `Importação #${index + 1}`) {
                                                            handleSaveImportNumber(importData.id, newValue);
                                                        }
                                                        handleCancelEdit(importData.id);
                                                    }}
                                                    disabled={savingImportNumbers[importData.id]}
                                                    sx={{
                                                        backgroundColor: 'success.main',
                                                        color: 'white',
                                                        '&:hover': {
                                                            backgroundColor: 'success.dark'
                                                        },
                                                        '&:disabled': {
                                                            backgroundColor: 'grey.300'
                                                        }
                                                    }}
                                                    title="Salvar"
                                                >
                                                    <Check fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleCancelEdit(importData.id)}
                                                    disabled={savingImportNumbers[importData.id]}
                                                    sx={{
                                                        backgroundColor: 'error.main',
                                                        color: 'white',
                                                        '&:hover': {
                                                            backgroundColor: 'error.dark'
                                                        },
                                                        '&:disabled': {
                                                            backgroundColor: 'grey.300'
                                                        }
                                                    }}
                                                    title="Cancelar"
                                                >
                                                    <Close fontSize="small" />
                                                </IconButton>
                                                {savingImportNumbers[importData.id] && (
                                                    <Save sx={{ fontSize: '16px', color: 'primary.main' }} />
                                                )}
                                            </div>
                                        ) : (
                                            <h6 
                                                className="mb-1 fw-bold" 
                                                style={{color: '#2c3e50', fontSize: '1rem', cursor: 'pointer'}}
                                                onClick={() => handleStartEdit(importData.id, importData.importName || `Importação #${index + 1}`)}
                                                title="Clique para editar"
                                            >
                                                {importData.importName || `Importação #${index + 1}`}
                                            </h6>
                                        )}
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
                                    <Row className="g-2">
                                        {/* Coluna Valor Total */}
                                        <Col xs={6}>
                                            <div 
                                                className="d-flex align-items-center p-2 rounded"
                                                style={{
                                                    border: '1px solid #e9ecef',
                                                    backgroundColor: '#f8f9fa',
                                                    height: '100%'
                                                }}
                                            >
                                                <div className="flex-grow-1">
                                                    <div 
                                                        className="fw-bold text-success mb-0 d-flex align-items-center" 
                                                        style={{fontSize: '0.9rem'}}
                                                    >
                                                        <span className="me-1">Valor Total:</span>
                                                        <span>{formatCurrency(importSpecificData.totalAmount)}</span>
                                                    </div>
                                                    <small className="text-muted" style={{fontSize: '0.7rem'}}>
                                                        Produtos Selecionados para Pedido
                                                    </small>
                                                </div>
                                            </div>
                                        </Col>
                                        
                                        {/* Coluna Produtos Selecionados */}
                                        <Col xs={6}>
                                            <div 
                                                className="d-flex align-items-center p-2 rounded"
                                                style={{
                                                    border: '1px solid #e9ecef',
                                                    backgroundColor: '#f8f9fa',
                                                    height: '100%'
                                                }}
                                            >
                                                <div className="flex-grow-1">
                                                    <div 
                                                        className="fw-bold text-primary mb-0 d-flex align-items-center" 
                                                        style={{fontSize: '0.9rem'}}
                                                    >
                                                        <span className="me-1">Para Pedido:</span>
                                                        <span>{importSpecificData.selectedCount}</span>
                                                    </div>
                                                    <small className="text-muted" style={{fontSize: '0.7rem'}}>
                                                        Produtos Selecionados desta Importação
                                                    </small>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>
                                
                                {/* Card CBM Total dos Produtos Selecionados desta Importação */}
                                {importSpecificData.selectedCount > 0 && (
                                    <div className="mb-3">
                                        <div 
                                            className="d-flex align-items-center p-3 rounded"
                                            style={{
                                                border: '2px solid #17a2b8',
                                                backgroundColor: '#e7f3ff',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            <div 
                                                className="d-flex align-items-center justify-content-center me-3"
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    backgroundColor: '#17a2b8',
                                                    borderRadius: '8px',
                                                    color: 'white'
                                                }}
                                            >
                                                <span className="material-icons" style={{fontSize: '20px'}}>
                                                    crop_free
                                                </span>
                                            </div>
                                            <div className="flex-grow-1">
                                                <div 
                                                    className="fw-bold text-info mb-1" 
                                                    style={{fontSize: '1rem'}}
                                                >
                                                    CBM Total Selecionado: {importSpecificData.totalCBM.toFixed(3).replace('.', ',')} m³
                                                </div>
                                                <small className="text-muted" style={{fontSize: '0.75rem'}}>
                                                    Volume total dos {importSpecificData.selectedCount} produtos desta importação marcados para pedido
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Informações Adicionais */}
                                <div className="border-top pt-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <small className="text-muted">
                                            <span className="material-icons me-1" style={{fontSize: '14px'}}>event</span>
                                            {importData.datetime.toLocaleDateString('pt-BR')} às {importData.time}
                                        </small>
                                        <div className="d-flex gap-2">
                                            <Button 
                                                variant="primary" 
                                                size="sm"
                                                style={{
                                                    fontSize: '0.75rem',
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    fontWeight: '500',
                                                    minWidth: '80px'
                                                }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    console.log('Clicando em Ver importação:', importData.id);
                                                    onViewImport(importData);
                                                }}
                                                title="Visualizar produtos desta importação"
                                            >
                                                <span className="material-icons me-1" style={{fontSize: '14px'}}>visibility</span>
                                                Ver
                                            </Button>
                                            <Button 
                                                variant="outline-warning" 
                                                size="sm"
                                                style={{
                                                    fontSize: '0.75rem',
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    fontWeight: '500',
                                                    minWidth: '80px'
                                                }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onEditImport(importData);
                                                }}
                                                title="Editar produtos desta importação"
                                            >
                                                <span className="material-icons me-1" style={{fontSize: '14px'}}>edit</span>
                                                Editar
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    );
                })}
            </Row>
        </div>
    );
};

export default ImportHistory;

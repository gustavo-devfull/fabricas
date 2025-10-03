import React, { useState } from 'react';
import { Card, CardContent, Typography, Button, Box, TextField, Switch, FormControlLabel, Chip, Tooltip } from '@mui/material';
import ImageUpload from './ImageUpload';
import Lightbox from '../Lightbox';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const QuoteCard = ({ 
    quote, 
    onDeleteQuote, 
    isSelected = false, 
    onImageUpdate = null,
    isSelectedForOrder = false,
    onToggleOrderSelect = null,
    onImportImages = null
}) => {
    const [showLightbox, setShowLightbox] = useState(false);
    const [editableCtns, setEditableCtns] = useState(quote.ctns || 0);
    const [isEditingCtns, setIsEditingCtns] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingCtns, setIsSavingCtns] = useState(false);
    
    // Estados para campos editáveis
    const [editedFields, setEditedFields] = useState({
        ref: quote.ref || '',
        ncm: quote.ncm || '',
        description: quote.description || '',
        name: quote.name || '',
        englishDescription: quote.englishDescription || '',
        import: quote.import || '',
        remark: quote.remark || '',
        obs: quote.obs || '',
        unitCtn: quote.unitCtn || 0,
        unit: quote.unit || '',
        unitPrice: quote.unitPrice || 0,
        length: quote.length || 0,
        width: quote.width || 0,
        height: quote.height || 0,
        cbm: quote.cbm || 0,
        grossWeight: quote.grossWeight || 0,
        netWeight: quote.netWeight || 0,
        pesoUnitario: quote.pesoUnitario || 0
    });

    const handleImageClick = () => {
        if (quote.imageUrl) {
            setShowLightbox(true);
        }
    };

    const handleCloseLightbox = () => {
        setShowLightbox(false);
    };

    // Calcular quantidade automaticamente: Caixas × UNIT/CTN
    const calculateQuantity = () => {
        const ctns = parseFloat(editableCtns) || 0;
        const unitCtn = parseFloat(isEditing ? editedFields.unitCtn : quote.unitCtn) || 1;
        return ctns * unitCtn;
    };

    const calculatedQuantity = calculateQuantity();


    // Função para lidar com mudança nos campos editáveis
    const handleFieldChange = (field, value) => {
        setEditedFields(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Função para calcular valores dependentes
    const calculateDependentValues = () => {
        const ctns = parseFloat(editableCtns) || 0;
        const unitCtn = parseFloat(editedFields.unitCtn) || 1;
        const unitPrice = parseFloat(editedFields.unitPrice) || 0;
        const cbm = parseFloat(editedFields.cbm) || 0;
        const grossWeight = parseFloat(editedFields.grossWeight) || 0;
        const netWeight = parseFloat(editedFields.netWeight) || 0;

        return {
            qty: ctns * unitCtn,
            amount: ctns * unitCtn * unitPrice,
            cbmTotal: cbm * ctns,
            totalGrossWeight: grossWeight * ctns,
            totalNetWeight: netWeight * ctns
        };
    };

    const dependentValues = calculateDependentValues();

    const handleSaveChanges = async () => {
        try {
            setIsSaving(true);
            const quoteRef = doc(db, 'quotes', quote.id);
            
            const updateData = {
                ...editedFields,
                ctns: editableCtns,
                ...dependentValues,
                updatedAt: new Date()
            };

            await updateDoc(quoteRef, updateData);
            
            // Atualizar o objeto local
            Object.assign(quote, updateData);
            
            setIsEditing(false);
            console.log('✅ Produto atualizado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao salvar alterações:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setEditedFields({
            ref: quote.ref || '',
            ncm: quote.ncm || '',
            description: quote.description || '',
            name: quote.name || '',
            englishDescription: quote.englishDescription || '',
            import: quote.import || '',
            remark: quote.remark || '',
            obs: quote.obs || '',
            unitCtn: quote.unitCtn || 0,
            unit: quote.unit || '',
            unitPrice: quote.unitPrice || 0,
            length: quote.length || 0,
            width: quote.width || 0,
            height: quote.height || 0,
            cbm: quote.cbm || 0,
            grossWeight: quote.grossWeight || 0,
            netWeight: quote.netWeight || 0,
            pesoUnitario: quote.pesoUnitario || 0
        });
        setEditableCtns(quote.ctns || 0);
        setIsEditing(false);
    };

    // Função para salvar alteração de CTNS
    const handleSaveCtns = async () => {
        const ctns = parseFloat(editableCtns) || 0;
        
        if (ctns === quote.ctns) {
            setIsEditingCtns(false);
            return;
        }

        setIsSavingCtns(true);
        try {
            console.log('💾 Salvando CTNS:', { ref: quote.ref, oldCtns: quote.ctns, newCtns: ctns });
            
            const quoteRef = doc(db, 'quotes', quote.id);
            await updateDoc(quoteRef, {
                ctns: ctns,
                qty: ctns * (quote.unitCtn || 1),
                amount: ctns * (quote.unitCtn || 1) * (quote.unitPrice || 0),
                updatedAt: new Date()
            });

            // Atualizar objeto local
            quote.ctns = ctns;
            quote.qty = ctns * (quote.unitCtn || 1);
            quote.amount = ctns * (quote.unitCtn || 1) * (quote.unitPrice || 0);
            quote.updatedAt = new Date();

            setIsEditingCtns(false);
            console.log('✅ CTNS salvo com sucesso!');

        } catch (error) {
            console.error('❌ Erro ao salvar CTNS:', error);
            setEditableCtns(quote.ctns || 0); // Reverter em caso de erro
        } finally {
            setIsSavingCtns(false);
        }
    };

    // Função para lidar com Enter no campo CTNS
    const handleCtnsKeyPress = (event) => {
        if (event.key === 'Enter') {
            setIsEditingCtns(false);
            handleSaveCtns();
        }
        if (event.key === 'Escape') {
            setEditableCtns(quote.ctns || 0);
            setIsEditingCtns(false);
        }
    };


    const formatCurrency = (value) => {
        return `¥ ${(value || 0).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const formatNumber = (value, decimals = 2) => {
        return (value || 0).toFixed(decimals);
    };

    // Função para renderizar campo editável ou texto
    const renderEditableField = (fieldName, label, value, type = 'text', options = {}) => {
        if (isEditing) {
            return (
                <Box sx={{ 
                    backgroundColor: '#ffffff',
                    padding: 0.5,
                    borderRadius: 1,
                    border: '1px solid #e9ecef',
                    textAlign: 'center',
                    minHeight: '60px'
                }}>
                    <Typography variant="body2" sx={{ fontSize: '0.6rem', color: '#6c757d', fontWeight: 'bold', mb: 0.5 }}>
                        {label}
                    </Typography>
                    <TextField
                        value={editedFields[fieldName]}
                        onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                        size="small"
                        type={type}
                        sx={{
                            width: '100%',
                            '& .MuiInputBase-input': {
                                textAlign: 'center',
                                fontSize: '0.7rem',
                                padding: '2px 4px'
                            }
                        }}
                        inputProps={{
                            min: options.min || 0,
                            step: options.step || (type === 'number' ? 0.01 : undefined),
                            max: options.max
                        }}
                    />
                </Box>
            );
        }

        // Renderização quando não está editando (visualização)
        const backgroundColor = options.backgroundColor || '#ffffff';
        return (
            <Box sx={{ 
                backgroundColor: backgroundColor,
                padding: 1,
                borderRadius: 1,
                border: '1px solid #e9ecef',
                textAlign: 'center'
            }}>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 'bold', mb: 0.5 }}>
                    {label}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 'bold', color: options.color || '#374151' }}>
                    {type === 'currency' ? formatCurrency(value) : 
                     type === 'number' ? formatNumber(value, options.decimals || 2) :
                     value?.toString().substring(0, (options.maxLength || 25)) + (value?.toString().length > (options.maxLength || 25) ? '...' : '')}
                </Typography>
            </Box>
        );
    };

    return (
        <>
            <Card
                sx={{
                    border: isSelected ? '2px solid #007bff' : '1px solid #e9ecef',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    }
                }}
            >
                <CardContent sx={{ p: 0.5 }}>

                {/* Layout principal: Header + Conteúdo */}
                <div className="mb-1">
                    {/* Header com todos os elementos em uma linha */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        {/* REF */}
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1rem', minWidth: '80px' }}>
                            REF: {quote.ref || 'N/A'}
                        </Typography>

                        {/* Para Pedido - Switch */}
                        {onToggleOrderSelect && (
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={isSelectedForOrder}
                                        onChange={() => onToggleOrderSelect(quote.id)}
                                        size="small"
                                        color="primary"
                                    />
                                }
                                label="Para Pedido"
                                sx={{
                                    '& .MuiFormControlLabel-label': {
                                        fontSize: '0.75rem',
                                        color: '#6c757d'
                                    }
                                }}
                            />
                        )}

                        {/* Description - Editável */}
                        <Box sx={{ flex: 1, minWidth: '200px' }}>
                            {isEditing ? (
                                <TextField
                                    value={editedFields.description}
                                    onChange={(e) => handleFieldChange('description', e.target.value)}
                                    size="small"
                                    placeholder="Description"
                                    sx={{ width: '100%' }}
                                />
                            ) : (
                                <Typography 
                                    variant="body1" 
                                    sx={{ 
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        '&:hover': { color: 'primary.main' }
                                    }}
                                    onClick={() => setIsEditing(true)}
                                >
                                    {quote.description || 'Sem descrição'}
                                </Typography>
                            )}
                        </Box>

                        {/* Name - Editável */}
                        <Box sx={{ flex: 1, minWidth: '150px' }}>
                            {isEditing ? (
                                <TextField
                                    value={editedFields.name}
                                    onChange={(e) => handleFieldChange('name', e.target.value)}
                                    size="small"
                                    placeholder="Name"
                                    sx={{ width: '100%' }}
                                />
                            ) : (
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        fontSize: '0.8rem',
                                        color: 'text.secondary',
                                        cursor: 'pointer',
                                        '&:hover': { color: 'primary.main' }
                                    }}
                                    onClick={() => setIsEditing(true)}
                                >
                                    {quote.name || 'Sem nome'}
                                </Typography>
                            )}
                        </Box>

                        {/* Botões Salvar/Cancelar quando editando */}
                        {isEditing && (
                            <>
                                <Button
                                    size="small"
                                    onClick={handleSaveChanges}
                                    variant="contained"
                                    color="success"
                                    disabled={isSaving}
                                    sx={{ fontSize: '0.6rem', padding: '2px 8px' }}
                                >
                                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                                </Button>
                                <Button
                                    size="small"
                                    onClick={handleCancelEdit}
                                    variant="contained"
                                    color="warning"
                                    disabled={isSaving}
                                    sx={{ fontSize: '0.6rem', padding: '2px 8px' }}
                                >
                                    Cancelar
                                </Button>
                            </>
                        )}

                        {/* Botão Editar quando não editando */}
                        {!isEditing && (
                            <Button
                                size="small"
                                onClick={() => setIsEditing(true)}
                                variant="contained"
                                color="primary"
                                sx={{ fontSize: '0.6rem', padding: '2px 8px' }}
                            >
                                Editar Produto
                            </Button>
                        )}

                        {/* Botão Excluir */}
                        <Button
                            size="small"
                            onClick={() => onDeleteQuote(quote.id)}
                            variant="contained"
                            color="error"
                            sx={{ fontSize: '0.6rem', padding: '2px 8px' }}
                        >
                            Excluir
                        </Button>

                        {/* Botão Importar Imagens */}
                        {onImportImages && (
                            <Button
                                size="small"
                                onClick={() => {
                                    console.log('Botão de importação clicado para REF:', quote.ref);
                                    onImportImages();
                                }}
                                variant="contained"
                                color="info"
                                sx={{ fontSize: '0.6rem', padding: '2px 8px' }}
                            >
                                Importar
                            </Button>
                        )}
                    </Box>

                    {/* Layout horizontal: Imagem à esquerda, informações à direita */}
                    <div className="d-flex gap-2">
                        {/* Imagem do produto */}
                        <div className="flex-shrink-0" style={{ width: '200px', height: '200px' }}>
                            {quote.imageUrl ? (
                                <div 
                                    style={{
                                        width: '200px',
                                        height: '200px',
                                        borderRadius: '8px',
                                        border: '2px solid #e9ecef',
                                        overflow: 'hidden',
                                        backgroundColor: '#f8f9fa',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }}
                                    onClick={handleImageClick}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.02)';
                                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
                                        e.currentTarget.style.borderColor = '#007bff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                        e.currentTarget.style.borderColor = '#e9ecef';
                                    }}
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
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = `
                                                <div style="color: #6c757d; text-align: center; font-size: 0.7rem;">
                                                    Sem imagem
                                                </div>
                                            `;
                                        }}
                                    />
                                </div>
                            ) : (
                                <div 
                                    style={{
                                        width: '200px',
                                        height: '200px',
                                        borderRadius: '8px',
                                        border: '2px dashed #dee2e6',
                                        backgroundColor: '#f8f9fa',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#6c757d'
                                    }}
                                >
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{fontSize: '0.7rem'}}>Sem imagem</div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Upload de imagem */}
                            <div className="mt-2">
                                <ImageUpload 
                                    quote={quote} 
                                    onImageUpdate={onImageUpdate}
                                />
                            </div>
                        </div>
                        
                        {/* Informações do produto */}
                        <div className="flex-grow-1">
                            <Box sx={{ 
                                backgroundColor: '#f8f9fa', 
                                padding: 0.5, 
                                borderRadius: 1,
                                border: '1px solid #e9ecef'
                            }}>
                                {/* Campos individuais em Grid */}
                                <Box sx={{ 
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                    gap: 1,
                                    padding: 0.5
                                }}>
                                    {/* REF */}
                                    {renderEditableField('ref', 'REF', isEditing ? editedFields.ref : quote.ref, 'text', { 
                                        backgroundColor: '#ffffff',
                                        color: 'primary.main'
                                    })}

                                    {/* NCM */}
                                    {renderEditableField('ncm', 'NCM', isEditing ? editedFields.ncm : quote.ncm, 'text', { 
                                        backgroundColor: '#f0f9ff',
                                        border: '1px solid #0284c7'
                                    })}

                                    {/* DESCRIPTION */}
                                    {renderEditableField('description', 'DESCRIPTION', isEditing ? editedFields.description : quote.description, 'text', { 
                                        backgroundColor: '#f8f9ff',
                                        border: '1px solid #d1d5db',
                                        maxLength: 50
                                    })}

                                    {/* NAME */}
                                    {renderEditableField('name', 'NAME', isEditing ? editedFields.name : quote.name, 'text', { 
                                        backgroundColor: '#fff7f8',
                                        border: '1px solid #fdbdbd',
                                        maxLength: 30
                                    })}

                                    {/* ENGLISH DESCRIPTION */}
                                    {renderEditableField('englishDescription', 'ENGLISH', isEditing ? editedFields.englishDescription : quote.englishDescription, 'text', { 
                                        backgroundColor: '#f0fdf4',
                                        border: '1px solid #a7f3d0',
                                        maxLength: 30
                                    })}

                                    {/* IMPORT */}
                                    {renderEditableField('import', 'IMPORT', isEditing ? editedFields.import : quote.import, 'text', { 
                                        backgroundColor: '#fefce8',
                                        border: '1px solid #facc15'
                                    })}

                                    {/* REMARK */}
                                    <Box sx={{ 
                                        backgroundColor: '#eff6ff',
                                        padding: 1,
                                        borderRadius: 1,
                                        border: '1px solid #93c5fd',
                                        textAlign: 'center',
                                        fontSize: '0.7rem'
                                    }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 'bold', mb: 0.5 }}>
                                            REMARK
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#374151', lineHeight: 1.2 }}>
                                            {(quote.remark || 'N/A').substring(0, 25) + ((quote.remark || 'N/A').length > 25 ? '...' : '')}
                                        </Typography>
                                    </Box>

                                    {/* OBS */}
                                    <Box sx={{ 
                                        backgroundColor: '#fdf2f8',
                                        padding: 1,
                                        borderRadius: 1,
                                        border: '1px solid #f9a8d4',
                                        textAlign: 'center',
                                        fontSize: '0.7rem'
                                    }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 'bold', mb: 0.5 }}>
                                            OBS
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#374151', lineHeight: 1.2 }}>
                                            {(quote.obs || 'N/A').substring(0, 25) + ((quote.obs || 'N/A').length > 25 ? '...' : '')}
                                        </Typography>
                                    </Box>

                                    {/* CTNS - Sempre editável */}
                                    <Box sx={{ 
                                        backgroundColor: '#fff1f2',
                                        padding: isEditingCtns ? 0.5 : 1,
                                        borderRadius: 1,
                                        border: '1px solid #fca5a5',
                                        textAlign: 'center',
                                        minHeight: isEditingCtns ? '60px' : 'auto',
                                        cursor: isEditingCtns ? 'default' : 'pointer',
                                        '&:hover': {
                                            backgroundColor: !isEditingCtns ? '#fef2f2' : '#fff1f2',
                                            border: !isEditingCtns ? '1px solid #f87171' : '1px solid #fca5a5'
                                        },
                                        transition: 'all 0.2s ease'
                                    }}>
                                        <Typography variant="body2" sx={{ fontSize: isEditingCtns ? '0.6rem' : '0.75rem', color: '#6c757d', fontWeight: 'bold', mb: 0.5 }}>
                                            CTNS {isSavingCtns && <span style={{ fontSize: '0.6rem', color: '#1976d2' }}>(Salvando...)</span>}
                                        </Typography>
                                        {isEditingCtns ? (
                                            <TextField
                                                type="number"
                                                value={editableCtns}
                                                onChange={(e) => setEditableCtns(e.target.value)}
                                                onKeyDown={handleCtnsKeyPress}
                                                onBlur={handleSaveCtns}
                                                autoFocus
                                                disabled={isSavingCtns}
                                                size="small"
                                                sx={{
                                                    width: '100%',
                                                    fontSize: '0.85rem',
                                                    '& .MuiInputBase-input': {
                                                        textAlign: 'center',
                                                        fontSize: '0.7rem',
                                                        padding: '2px 4px'
                                                    }
                                                }}
                                                inputProps={{
                                                    min: 0,
                                                    step: 1
                                                }}
                                            />
                                        ) : (
                                            <Tooltip title="Clique para editar CTNS. Enter para salvar, ESC para cancelar">
                                                <div
                                                    onClick={() => setIsEditingCtns(true)}
                                                    style={{
                                                        cursor: 'pointer',
                                                        padding: '2px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 'bold',
                                                        color: '#374151'
                                                    }}
                                                >
                                                    {editableCtns}
                                                </div>
                                            </Tooltip>
                                        )}
                                    </Box>

                                    {/* UNIT/CTN */}
                                    {renderEditableField('unitCtn', 'UNIT/CTN', isEditing ? editedFields.unitCtn : quote.unitCtn, 'number', { 
                                        backgroundColor: '#fffbeb',
                                        border: '1px solid #fed7aa'
                                    })}

                                    {/* QTY */}
                                    <Box sx={{ 
                                        backgroundColor: '#fef3c7',
                                        padding: 1,
                                        borderRadius: 1,
                                        border: '1px solid #d97706',
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 'bold', mb: 0.5 }}>
                                            QTY
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#d97706' }}>
                                            {formatNumber(calculatedQuantity, 0)}
                                        </Typography>
                                    </Box>

                                    {/* UNIT */}
                                    <Box sx={{ 
                                        backgroundColor: '#f3e8ff',
                                        padding: 1,
                                        borderRadius: 1,
                                        border: '1px solid #c4b5fd',
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 'bold', mb: 0.5 }}>
                                            UNIT
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#374151' }}>
                                            {quote.unit || 'N/A'}
                                        </Typography>
                                    </Box>

                                    {/* U.PRICE */}
                                    {renderEditableField('unitPrice', 'U.PRICE', isEditing ? editedFields.unitPrice : quote.unitPrice, 'number', { 
                                        backgroundColor: '#dcfce7',
                                        border: '1px solid #22c55e',
                                        color: '#16a34a',
                                        decimals: 2
                                    })}

                                    {/* Cálculo CTNS × UNIT/CTN */}
                                    <Box sx={{ 
                                        backgroundColor: '#ddd6fe',
                                        padding: 1,
                                        borderRadius: 1,
                                        border: '1px solid #7c3aed',
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 'bold', mb: 0.5 }}>
                                            Cálculo
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#7c3aed', lineHeight: 1.2 }}>
                                            {editableCtns || 0} × {quote.unitCtn || 1}
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#7c3aed' }}>
                                            = {formatNumber(calculatedQuantity, 0)}
                                        </Typography>
                                    </Box>

                                    {/* AMOUNT DESTACADO */}
                                    <Box sx={{ 
                                        backgroundColor: '#d1fae5',
                                        padding: 1,
                                        borderRadius: 1,
                                        border: '2px solid #059669',
                                        textAlign: 'center',
                                        gridColumn: 'span 2',
                                        minWidth: '120px'
                                    }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#059669', fontWeight: 'bold', mb: 0.5 }}>
                                            AMOUNT TOTAL
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#047857' }}>
                                            {formatCurrency(calculatedQuantity * (quote.unitPrice || 0))}
                                        </Typography>
                                    </Box>

                                    {/* LENGTH */}
                                    <Box sx={{ 
                                        backgroundColor: '#e0f2fe',
                                        padding: 1,
                                        borderRadius: 1,
                                        border: '1px solid #0284c7',
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 'bold', mb: 0.5 }}>
                                            LENGTH
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#374151' }}>
                                            {formatNumber(quote.length)}cm
                                        </Typography>
                                    </Box>

                                    {/* WIDTH */}
                                    <Box sx={{ 
                                        backgroundColor: '#ecfdf5',
                                        padding: 1,
                                        borderRadius: 1,
                                        border: '1px solid #10b981',
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 'bold', mb: 0.5 }}>
                                            WIDTH
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#374151' }}>
                                            {formatNumber(quote.width)}cm
                                        </Typography>
                                    </Box>

                                    {/* HEIGHT */}
                                    <Box sx={{ 
                                        backgroundColor: '#f0fdfa',
                                        padding: 1,
                                        borderRadius: 1,
                                        border: '1px solid #065f46',
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 'bold', mb: 0.5 }}>
                                            HEIGHT
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#374151' }}>
                                            {formatNumber(quote.height)}cm
                                        </Typography>
                                    </Box>

                                    {/* CBM */}
                                    <Box sx={{ 
                                        backgroundColor: '#fdf4ff',
                                        padding: 1,
                                        borderRadius: 1,
                                        border: '1px solid #9333ea',
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 'bold', mb: 0.5 }}>
                                            CBM
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#374151' }}>
                                            {formatNumber(quote.cbm)}
                                        </Typography>
                                    </Box>

                                    {/* CBM TOTAL */}
                                    <Box sx={{ 
                                        backgroundColor: '#fff7ed',
                                        padding: 1,
                                        borderRadius: 1,
                                        border: '1px solid #ea580c',
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 'bold', mb: 0.5 }}>
                                            CBM TOTAL
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#374151' }}>
                                            {formatNumber(quote.cbmTotal)}
                                        </Typography>
                                    </Box>

                                    {/* GROSS WEIGHT */}
                                    <Box sx={{ 
                                        backgroundColor: '#f8fafc',
                                        padding: 1,
                                        borderRadius: 1,
                                        border: '1px solid #64748b',
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 'bold', mb: 0.5 }}>
                                            G.W
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#374151' }}>
                                            {formatNumber(quote.grossWeight)}kg
                                        </Typography>
                                    </Box>

                                    {/* TOTAL GROSS WEIGHT */}
                                    <Box sx={{ 
                                        backgroundColor: '#fcfcfd',
                                        padding: 1,
                                        borderRadius: 1,
                                        border: '1px solid #71717a',
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 'bold', mb: 0.5 }}>
                                            T.G.W
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#374151' }}>
                                            {formatNumber(quote.totalGrossWeight)}kg
                                        </Typography>
                                    </Box>

                                    {/* NET WEIGHT */}
                                    <Box sx={{ 
                                        backgroundColor: '#fefeff',
                                        padding: 1,
                                        borderRadius: 1,
                                        border: '1px solid #7c2d12',
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 'bold', mb: 0.5 }}>
                                            N.W
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#374151' }}>
                                            {formatNumber(quote.netWeight)}kg
                                        </Typography>
                                    </Box>

                                    {/* TOTAL NET WEIGHT */}
                                    <Box sx={{ 
                                        backgroundColor: '#fefefe',
                                        padding: 1,
                                        borderRadius: 1,
                                        border: '1px solid #99250a',
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 'bold', mb: 0.5 }}>
                                            T.N.W
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#374151' }}>
                                            {formatNumber(quote.totalNetWeight)}kg
                                        </Typography>
                                    </Box>

                                    {/* PESO UNITÁRIO */}
                                    <Box sx={{ 
                                        backgroundColor: '#fffeff',
                                        padding: 1,
                                        borderRadius: 1,
                                        border: '1px solid #be1e09',
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 'bold', mb: 0.5 }}>
                                            PESO UNITÁRIO
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#374151' }}>
                                            {formatNumber(quote.pesoUnitario)}g
                                        </Typography>
                                    </Box>
                                </Box>

                            </Box>
                        </div>
                    </div>
                </div>
                </CardContent>
            </Card>

        {/* Lightbox */}
        <Lightbox
            isOpen={showLightbox}
            onClose={handleCloseLightbox}
            imageUrl={quote.imageUrl}
            imageAlt={quote.name || quote.description || 'Produto'}
        />
        </>
    );
};

export default QuoteCard;
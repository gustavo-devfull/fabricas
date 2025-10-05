import React, { useState } from 'react';
import { Card, CardContent, Typography, Button, Box, TextField, Switch, FormControlLabel, Chip, Tooltip } from '@mui/material';
import ImageUpload from './ImageUpload';
import Lightbox from '../Lightbox';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

const QuoteCard = ({ 
    quote, 
    onDeleteQuote, 
    isSelected = false, 
    onImageUpdate = null,
    isSelectedForOrder = false,
    onToggleOrderSelect = null,
    onImportImages = null,
    onDuplicateQuote = null
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
        pesoUnitario: quote.pesoUnitario || 0,
        moq: quote.moq || 0,
        moqLogo: quote.moqLogo || '',
        comentarios: quote.comentarios || '',
        dataPedido: quote.dataPedido || '',
        lotePedido: quote.lotePedido || ''
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

    // Função auxiliar para converter valores para número ou texto
    const safeValue = (value, defaultValue = 0, isNumber = true) => {
        if (value === null || value === undefined || value === '') {
            return defaultValue;
        }
        
        if (typeof value === 'object' && value !== null) {
            // Se for um objeto Firebase, tentar extrair valor
            const extractedValue = value.value || value.amount || value;
            return isNumber ? (parseFloat(extractedValue) || defaultValue) : (extractedValue?.toString() || defaultValue);
        }
        
        return isNumber ? (parseFloat(value) || defaultValue) : (value?.toString() || defaultValue);
    };

    const handleCancelEdit = () => {
        setEditedFields({
            ref: safeValue(quote.ref, '', false),
            ncm: safeValue(quote.ncm, '', false),
            description: safeValue(quote.description, '', false),
            name: safeValue(quote.name, '', false),
            englishDescription: safeValue(quote.englishDescription, '', false),
            import: safeValue(quote.import, '', false),
            remark: safeValue(quote.remark, '', false),
            obs: safeValue(quote.obs, '', false),
            unitCtn: safeValue(quote.unitCtn, 0, true),
            unit: safeValue(quote.unit, '', false),
            unitPrice: safeValue(quote.unitPrice, 0, true),
            length: safeValue(quote.length, 0, true),
            width: safeValue(quote.width, 0, true),
            height: safeValue(quote.height, 0, true),
            cbm: safeValue(quote.cbm, 0, true),
            grossWeight: safeValue(quote.grossWeight, 0, true),
            netWeight: safeValue(quote.netWeight, 0, true),
            pesoUnitario: safeValue(quote.pesoUnitario, 0, true),
            moq: safeValue(quote.moq, 0, true),
            moqLogo: safeValue(quote.moqLogo, '', false),
            comentarios: safeValue(quote.comentarios, '', false),
            dataPedido: safeValue(quote.dataPedido, '', false),
            lotePedido: safeValue(quote.lotePedido, '', false)
        });
        setEditableCtns(safeValue(quote.ctns, 0, true));
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
        // Se valor é null, undefined ou vazio, retornar 0 formatado
        if (value === null || value === undefined || value === '') {
            return (0).toFixed(decimals);
        }
        
        // Converter valor para número se não for já
        let numValue = value;
        if (typeof value === 'string') {
            numValue = parseFloat(value) || 0;
        } else if (typeof value === 'object' && value !== null) {
            // Se for um objeto, tentar extrair um valor numérico
            numValue = value.value || value.amount || value || 0;
            if (typeof numValue !== 'number') {
                numValue = parseFloat(numValue) || 0;
            }
        } else if (typeof value !== 'number') {
            numValue = parseFloat(value) || 0;
        }
        
        // Verificar se numValue é um número válido antes de chamar toFixed
        if (isNaN(numValue) || !isFinite(numValue)) {
            numValue = 0;
        }
        
        return numValue.toFixed(decimals);
    };

    // Função para renderizar campo sempre editável
    const renderAlwaysEditableField = (fieldName, label, type = 'text', options = {}) => {
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
                <Typography variant="body2" sx={{ fontSize: '14px', color: '#495057', fontWeight: '500', flexShrink: 0 }}>
                    {label}:
                </Typography>
                <TextField
                    value={editedFields[fieldName]}
                    onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !options.multiline) {
                            e.preventDefault();
                            handleSaveChanges();
                        } else if (e.key === 'Enter' && options.multiline && e.ctrlKey) {
                            e.preventDefault();
                            handleSaveChanges();
                        }
                    }}
                    onBlur={() => {
                        // Salvar automaticamente quando sair do campo
                        setTimeout(() => {
                            const currentValue = editedFields[fieldName];
                            const originalValue = quote[fieldName];
                            
                            // Comparar valores tratados (strings/números)
                            const compareCurrent = typeof currentValue === 'number' ? currentValue : (currentValue || '').toString();
                            const compareOriginal = typeof originalValue === 'number' ? originalValue : (originalValue || '').toString();
                            
                            if (compareCurrent !== compareOriginal && currentValue !== undefined) {
                                console.log(`🔄 Salvando campo ${fieldName}: ${compareOriginal} → ${compareCurrent}`);
                                handleSaveChanges();
                            }
                        }, 200);
                    }}
                    size="small"
                    type={type}
                    variant="outlined"
                    multiline={options.multiline}
                    rows={options.multiline ? 2 : undefined}
                    sx={{
                        width: options.multiline ? '120px' : '80px',
                        '& .MuiInputBase-input': {
                            textAlign: options.multiline ? 'left' : 'center',
                            fontSize: '14px',
                            padding: '4px 6px',
                            color: '#495057'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                            border: 'none'
                        },
                        '& .MuiInputBase-root': {
                            backgroundColor: '#ffffff',
                            borderRadius: '4px'
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
    };


    // Campos que NÃO devem ser editáveis (têm fórmulas matemáticas)
    const calculatedFields = ['qty', 'amount', 'cbmTotal', 'totalGrossWeight', 'totalNetWeight'];

    // Função para verificar se um campo é editável
    const isFieldEditable = (fieldName) => {
        // Em modo de edição, todos os campos são editáveis exceto os calculados
        if (isEditing) {
            return !calculatedFields.includes(fieldName);
        }
        // No estado normal, apenas CTNS é editável
        return fieldName === 'ctns';
    };

    // Função para renderizar campo editável ou texto
    const renderEditableField = (fieldName, label, value, type = 'text', options = {}) => {
        if (isEditing && isFieldEditable(fieldName)) {
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
                        value={editedFields[fieldName]}
                        onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !options.multiline) {
                                e.preventDefault();
                                handleSaveChanges();
                            } else if (e.key === 'Enter' && options.multiline && e.ctrlKey) {
                                // Ctrl+Enter para salvar em campos multi-line
                                e.preventDefault();
                                handleSaveChanges();
                            }
                        }}
                        size="small"
                        type={type}
                        variant="outlined"
                        multiline={options.multiline}
                        rows={options.multiline ? 2 : undefined}
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
                <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: options.bold ? 'bold' : '500', color: '#495057', textAlign: 'right', flex: 1 }}>
                    {type === 'currency' ? formatCurrency(value) : 
                     type === 'number' ? formatNumber(value, options.decimals || 2) :
                     value?.toString().substring(0, (options.maxLength || 15)) + (value?.toString().length > (options.maxLength || 15) ? '...' : '')}
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
                    <Box sx={{ 
                        display: 'flex', 
                        gap: 1, 
                        mb: 1, 
                        flexWrap: 'wrap',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'stretch', sm: 'center' }
                    }}>
                        {/* REF */}
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'black', fontSize: '1rem', minWidth: '80px' }}>
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
                                        color: 'black'
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
                                        color: 'black',
                                        '&:hover': { color: '#007bff' }
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
                                        color: 'black',
                                        cursor: 'pointer',
                                        '&:hover': { color: '#007bff' }
                                    }}
                                    onClick={() => setIsEditing(true)}
                                >
                                    {quote.name || 'Sem nome'}
                                </Typography>
                            )}
                        </Box>

                        {/* Botões de ação - organizados para mobile */}
                        <Box sx={{ 
                            display: 'flex', 
                            gap: 1, 
                            flexWrap: 'wrap',
                            flexDirection: { xs: 'column', sm: 'row' },
                            width: { xs: '100%', sm: 'auto' },
                            mt: { xs: 1, sm: 0 }
                        }}>
                            {/* Botões Salvar/Cancelar quando editando */}
                            {isEditing && (
                                <>
                                    <Button
                                        size="small"
                                        onClick={handleSaveChanges}
                                        variant="contained"
                                        color="success"
                                        disabled={isSaving}
                                        sx={{ 
                                            fontSize: '0.6rem', 
                                            padding: '2px 8px',
                                            width: { xs: '100%', sm: 'auto' }
                                        }}
                                    >
                                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                                    </Button>
                                    <Button
                                        size="small"
                                        onClick={handleCancelEdit}
                                        variant="contained"
                                        color="warning"
                                        disabled={isSaving}
                                        sx={{ 
                                            fontSize: '0.6rem', 
                                            padding: '2px 8px',
                                            width: { xs: '100%', sm: 'auto' }
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                </>
                            )}

                            {/* Botão Editar quando não editando */}
                            {!isEditing && (
                                <>
                                    <Button
                                        size="small"
                                        onClick={() => setIsEditing(true)}
                                        variant="contained"
                                        color="primary"
                                        sx={{ 
                                            fontSize: '0.6rem', 
                                            padding: '2px 8px',
                                            width: { xs: '100%', sm: 'auto' }
                                        }}
                                    >
                                        Editar Produto
                                    </Button>
                                    
                                    {/* Botão Duplicar */}
                                    {onDuplicateQuote && (
                                        <Button
                                            size="small"
                                            onClick={() => onDuplicateQuote(quote)}
                                            variant="contained"
                                            color="secondary"
                                            sx={{ 
                                                fontSize: '0.6rem', 
                                                padding: '2px 8px',
                                                width: { xs: '100%', sm: 'auto' }
                                            }}
                                        >
                                            Duplicar Cotação
                                        </Button>
                                    )}
                                </>
                            )}

                            {/* Botão Excluir */}
                            <Button
                                size="small"
                                onClick={() => onDeleteQuote(quote.id)}
                                variant="contained"
                                color="error"
                                sx={{ 
                                    fontSize: '0.6rem', 
                                    padding: '2px 8px',
                                    width: { xs: '100%', sm: 'auto' }
                                }}
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
                                    sx={{ 
                                        fontSize: '0.6rem', 
                                        padding: '2px 8px',
                                        width: { xs: '100%', sm: 'auto' }
                                    }}
                                >
                                    Importar
                                </Button>
                            )}
                        </Box>
                    </Box>

                    {/* Layout horizontal: Imagem à esquerda, informações à direita */}
                    <div className="d-flex gap-2 flex-column flex-md-row">
                        {/* Imagem do produto */}
                        <div className="flex-shrink-0 mx-auto mx-md-0" style={{ 
                            width: '200px', 
                            height: '200px',
                            maxWidth: '100%'
                        }}>
                            {quote.imageUrl ? (
                                <div 
                                    style={{
                                        width: '100%',
                                        height: '100%',
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
                                                <div style="color: black; text-align: center; font-size: 0.7rem;">
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
                                        color: 'black'
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
                                backgroundColor: '#ffffff', 
                                padding: 0.5, 
                                borderRadius: 1,
                                border: 'none'
                            }}>
                                {/* Campos individuais em Linha Horizontal */}
                                <Box sx={{ 
                                    display: 'flex',
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    gap: 1,
                                    padding: 0.5,
                                    alignItems: 'center'
                                }}>
                                    {/* REF */}
                                    {renderEditableField('ref', 'REF', isEditing ? editedFields.ref : quote.ref, 'text', { 
                                        backgroundColor: '#ffffff',
                                        color: 'primary.main',
                                        bold: true
                                    })}

                                    {/* NCM */}
                                    {renderEditableField('ncm', 'NCM', isEditing ? editedFields.ncm : quote.ncm, 'text', { 
                                        backgroundColor: '#f8f9fa',
                                        border: 'none'
                                    })}

                                    {/* DESCRIPTION */}
                                    {renderEditableField('description', 'DESCRIPTION', isEditing ? editedFields.description : quote.description, 'text', { 
                                        backgroundColor: '#f8f9fa',
                                        border: 'none',
                                        maxLength: 50,
                                        bold: true
                                    })}

                                    {/* NAME */}
                                    {renderEditableField('name', 'NAME', isEditing ? editedFields.name : quote.name, 'text', { 
                                        backgroundColor: '#f8f9fa',
                                        border: 'none',
                                        maxLength: 30
                                    })}

                                    {/* ENGLISH DESCRIPTION */}
                                    {renderEditableField('englishDescription', 'ENGLISH', isEditing ? editedFields.englishDescription : quote.englishDescription, 'text', { 
                                        backgroundColor: '#f8f9fa',
                                        border: 'none',
                                        maxLength: 30
                                    })}

                                    {/* IMPORT */}
                                    {renderEditableField('import', 'IMPORT', isEditing ? editedFields.import : quote.import, 'text', { 
                                        backgroundColor: '#f8f9fa',
                                        border: 'none'
                                    })}

                                    {/* REMARK */}
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
                                        <Typography variant="body2" sx={{ fontSize: '14px', color: '#495057', fontWeight: '500', flexShrink: 0 }}>
                                            REMARK:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: '500', color: '#495057', textAlign: 'right', flex: 1 }}>
                                            {(quote.remark || 'N/A').substring(0, 15) + ((quote.remark || 'N/A').length > 15 ? '...' : '')}
                                        </Typography>
                                    </Box>

                                    {/* OBS */}
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
                                        <Typography variant="body2" sx={{ fontSize: '14px', color: '#495057', fontWeight: '500', flexShrink: 0 }}>
                                            OBS:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: '500', color: '#495057', textAlign: 'right', flex: 1 }}>
                                            {(quote.obs || 'N/A').substring(0, 15) + ((quote.obs || 'N/A').length > 15 ? '...' : '\'')}
                                        </Typography>
                                    </Box>

                                    {/* CTNS - Sempre editável */}
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
                                        flex: '1 1 200px',
                                        cursor: isEditingCtns ? 'default' : 'pointer',
                                        '&:hover': {
                                            backgroundColor: !isEditingCtns ? '#e9ecef' : '#f8f9fa'
                                        },
                                        transition: 'all 0.2s ease'
                                    }}>
                                        <Typography variant="body2" sx={{ fontSize: '14px', color: '#495057', fontWeight: 'bold', flexShrink: 0 }}>
                                            CTNS: {isSavingCtns && <span style={{ fontSize: '12px', color: '#6c757d' }}>(Salvando...)</span>}
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
                                                variant="outlined"
                                                sx={{
                                                    width: '80px',
                                                    '& .MuiInputBase-input': {
                                                        textAlign: 'center',
                                                        fontSize: '14px',
                                                        padding: '4px 6px',
                                                        color: '#495057'
                                                    },
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        border: 'none'
                                                    },
                                                    '& .MuiInputBase-root': {
                                                        backgroundColor: '#ffffff',
                                                        borderRadius: '4px'
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
                                                        fontSize: '14px',
                                                        fontWeight: 'bold',
                                                        color: '#495057',
                                                        textAlign: 'right',
                                                        flex: 1
                                                    }}
                                                >
                                                    {editableCtns}
                                                </div>
                                            </Tooltip>
                                        )}
                                    </Box>

                                    {/* UNIT/CTN */}
                                    {renderEditableField('unitCtn', 'UNIT/CTN', isEditing ? editedFields.unitCtn : quote.unitCtn, 'number', { 
                                        backgroundColor: '#f8f9fa',
                                        border: 'none',
                                        bold: true
                                    })}

                                    {/* QTY */}
                                    <Box sx={{ 
                                        backgroundColor: '#f8f9fa',
                                        padding: 0.5,
                                        borderRadius: 1,
                                        border: 'none',
                                        display: 'flex',
                                        flexDirection: ' flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        justifyContent: 'space-between',
                                        minWidth: '120px',
                                        maxWidth: '200px',
                                        flex: '1 1 200px'
                                    }}>
                                        <Typography variant="body2" sx={{ fontSize: '14px', color: '#495057', fontWeight: 'bold', flexShrink: 0 }}>
                                            QTY:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 'bold', color: '#495057', textAlign: 'right', flex: 1 }}>
                                            {formatNumber(calculatedQuantity, 0)}
                                        </Typography>
                                    </Box>

                                    {/* UNIT */}
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
                                        <Typography variant="body2" sx={{ fontSize: '14px', color: '#495057', fontWeight: '500', flexShrink: 0 }}>
                                            UNIT:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: '500', color: '#495057', textAlign: 'right', flex: 1 }}>
                                            {quote.unit || 'N/A'}
                                        </Typography>
                                    </Box>

                                    {/* U.PRICE */}
                                    {renderEditableField('unitPrice', 'U.PRICE', isEditing ? editedFields.unitPrice : quote.unitPrice, 'number', { 
                                        backgroundColor: '#f8f9fa',
                                        border: 'none',
                                        color: '#16a34a',
                                        decimals: 2,
                                        bold: true
                                    })}

                                    {/* Cálculo CTNS × UNIT/CTN - Campo Calculado */}
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
                                            {editableCtns || 0}×{isEditing ? editedFields.unitCtn || 1 : quote.unitCtn || 1}={formatNumber(calculatedQuantity, 0)}
                                        </Typography>
                                    </Box>

                                    {/* AMOUNT DESTACADO - Campo Calculado */}
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
                                        <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 'bold', color: '#495057', textAlign: 'right', flex: 1 }}>
                                            {formatCurrency(calculatedQuantity * (isEditing ? editedFields.unitPrice || 0 : quote.unitPrice || 0))}
                                        </Typography>
                                    </Box>

                                    {/* LENGTH */}
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
                                        <Typography variant="body2" sx={{ fontSize: '14px', color: '#495057', fontWeight: '500', flexShrink: 0 }}>
                                            LENGTH:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: '500', color: '#495057', textAlign: 'right', flex: 1 }}>
                                            {formatNumber(quote.length)}cm
                                        </Typography>
                                    </Box>

                                    {/* WIDTH */}
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
                                        <Typography variant="body2" sx={{ fontSize: '14px', color: '#495057', fontWeight: '500', flexShrink: 0 }}>
                                            WIDTH:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: '500', color: '#495057', textAlign: 'right', flex: 1 }}>
                                            {formatNumber(quote.width)}cm
                                        </Typography>
                                    </Box>

                                    {/* HEIGHT */}
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
                                        <Typography variant="body2" sx={{ fontSize: '14px', color: '#495057', fontWeight: '500', flexShrink: 0 }}>
                                            HEIGHT:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: '500', color: '#495057', textAlign: 'right', flex: 1 }}>
                                            {formatNumber(quote.height)}cm
                                        </Typography>
                                    </Box>

                                    {/* CBM */}
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
                                        <Typography variant="body2" sx={{ fontSize: '14px', color: '#495057', fontWeight: '500', flexShrink: 0 }}>
                                            CBM:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: '500', color: '#495057', textAlign: 'right', flex: 1 }}>
                                            {formatNumber(quote.cbm)}
                                        </Typography>
                                    </Box>

                                    {/* CBM TOTAL - Campo Calculado */}
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
                                            CBM TOT:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 'bold', color: '#495057', textAlign: 'right', flex: 1 }}>
                                            {formatNumber((isEditing ? editedFields.cbm || 0 : quote.cbm || 0) * (editableCtns || 0))}
                                        </Typography>
                                    </Box>

                                    {/* GROSS WEIGHT */}
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
                                        <Typography variant="body2" sx={{ fontSize: '14px', color: '#495057', fontWeight: '500', flexShrink: 0 }}>
                                            G.W:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: '500', color: '#495057', textAlign: 'right', flex: 1 }}>
                                            {formatNumber(quote.grossWeight)}kg
                                        </Typography>
                                    </Box>

                                    {/* TOTAL GROSS WEIGHT - Campo Calculado */}
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
                                            T.G.W:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 'bold', color: '#495057', textAlign: 'right', flex: 1 }}>
                                            {formatNumber((isEditing ? editedFields.grossWeight || 0 : quote.grossWeight || 0) * (editableCtns || 0))}kg
                                        </Typography>
                                    </Box>

                                    {/* NET WEIGHT */}
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
                                        <Typography variant="body2" sx={{ fontSize: '14px', color: '#495057', fontWeight: '500', flexShrink: 0 }}>
                                            N.W:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: '500', color: '#495057', textAlign: 'right', flex: 1 }}>
                                            {formatNumber(quote.netWeight)}kg
                                        </Typography>
                                    </Box>

                                    {/* TOTAL NET WEIGHT - Campo Calculado */}
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
                                            T.N.W:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 'bold', color: '#495057', textAlign: 'right', flex: 1 }}>
                                            {formatNumber((isEditing ? editedFields.netWeight || 0 : quote.netWeight || 0) * (editableCtns || 0))}kg
                                        </Typography>
                                    </Box>

                                    {/* PESO UNITÁRIO */}
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
                                        <Typography variant="body2" sx={{ fontSize: '14px', color: '#495057', fontWeight: '500', flexShrink: 0 }}>
                                            P.U:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: '500', color: '#495057', textAlign: 'right', flex: 1 }}>
                                            {formatNumber(quote.pesoUnitario)}g
                                        </Typography>
                                    </Box>

                                    {/* MOQ - Editable only in edit mode */}
                                    {renderEditableField('moq', 'MOQ', isEditing ? editedFields.moq : quote.moq, 'number', { 
                                        backgroundColor: '#f8f9fa',
                                        border: 'none'
                                    })}

                                    {/* MOQ LOGO - Editable only in edit mode */}
                                    {renderEditableField('moqLogo', 'MOQ LOGO', isEditing ? editedFields.moqLogo : quote.moqLogo, 'number', { 
                                        backgroundColor: '#f8f9fa',
                                        border: 'none'
                                    })}

                                    {/* COMENTS - Editable only in edit mode */}
                                    {renderEditableField('comentarios', 'COMENTS', isEditing ? editedFields.comentarios : quote.comentarios, 'text', { 
                                        backgroundColor: '#f8f9fa',
                                        border: 'none',
                                        multiline: true,
                                        maxLength: 100,
                                        bold: true
                                    })}
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
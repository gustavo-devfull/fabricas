import React, { useState } from 'react';
import { Card, Button, Badge, Row, Col } from 'react-bootstrap';
import { TextField, IconButton, Switch, FormControlLabel, Chip } from '@mui/material';
import { Save, Check, Close } from '@mui/icons-material';
import { updateDoc, doc, setDoc, addDoc, query, collection, getDocs, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

const ImportHistory = ({ 
    imports, 
    quotes, 
    onViewImport, 
    onEditImport,
    onDuplicateQuote,
    selectedForOrder = [],
    selectedImportId = null
}) => {
    const [editingImportNumbers, setEditingImportNumbers] = useState({});
    const [savingImportNumbers, setSavingImportNumbers] = useState({});
    const [localImports, setLocalImports] = useState(imports);
    const [editingImportFields, setEditingImportFields] = useState({});
    const convertToBrazilianDate = (dateString) => {
        if (!dateString) return '';
        // Se já está no formato brasileiro DD/MM/AAAA, retorna como está
        if (dateString.includes('/')) return dateString;
        // Se está no formato americano AAAA-MM-DD, converte para DD/MM/AAAA
        if (dateString.includes('-')) {
            const [year, month, day] = dateString.split('-');
            return `${day}/${month}/${year}`;
        }
        return dateString;
    };

    const convertToAmericanDate = (dateString) => {
        if (!dateString) return '';
        // Se está no formato brasileiro DD/MM/AAAA, converte para AAAA-MM-DD
        if (dateString.includes('/')) {
            const [day, month, year] = dateString.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        // Se já está no formato americano, retorna como está
        return dateString;
    };

    const formatDateForDisplay = (dateString) => {
        return convertToBrazilianDate(dateString);
    };

    // Função para carregar dados salvos da coleção quoteImports
    const loadSavedImportData = async () => {
        try {
            // Pegar o factoryId da primeira importação (todas são da mesma fábrica)
            if (imports && imports.length > 0) {
                const factoryId = imports[0].factoryId;
                console.log(`📥 Carregando dados salvos para fábrica ${factoryId}`);
                
                const importsQuery = query(collection(db, 'quoteImports'), where('factoryId', '==', factoryId));
                const snapshot = await getDocs(importsQuery);
                const savedData = {};
                
                snapshot.forEach((doc) => {
                    savedData[doc.id] = doc.data();
                    console.log(`✅ Dados salvos para importação ${doc.id}:`, doc.data());
                });
                
                // Mesclar dados salvos com dados das importações
                const importsWithSavedData = imports.map(importItem => {
                    const savedImportData = savedData[importItem.id] || {};
                    return {
                        ...importItem,
                        dataPedido: savedImportData.dataPedido || '',
                        lotePedido: savedImportData.lotePedido || '',
                        importName: savedImportData.importName || importItem.importName
                    };
                });
                
                setLocalImports(importsWithSavedData);
                console.log(`🔄 ${importsWithSavedData.length} importações atualizadas com dados salvos`);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar dados salvos:', error);
            setLocalImports(imports);
        }
    };

    // Atualize imports locais quando props mudarem
    React.useEffect(() => {
        console.log('📊 ImportHistory: Importações recebidas:', imports);
        if (imports && imports.length > 0) {
            loadSavedImportData();
        }
    }, [imports]);

    if (!localImports || localImports.length === 0) return null;

    // Função para formatar números com ponto para milhares e vírgula para decimais
    const formatCurrency = (value) => {
        // Garantir que o valor seja um número válido
        const numValue = Number(value) || 0;
        return `¥ ${numValue.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    // Função para calcular CBM total dos produtos selecionados para pedido
    const calculateTotalCBM = () => {
        return quotes
            .filter(quote => selectedForOrder.includes(quote.id))
            .reduce((total, quote) => {
                // Priorizar cbmTotal se existir, senão calcular cbm * ctns
                const cbmTotal = quote.cbmTotal || (quote.cbm || 0) * (quote.ctns || 0);
                return total + cbmTotal;
            }, 0);
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

        console.log('🔍 Calculando dados da importação:', {
            importId: importData.id,
            importName: importData.importName,
            totalQuotes: importQuotes.length,
            selectedQuotesCount: selectedQuotesInImport.length,
            selectedForOrderCount: selectedForOrder.length
        });

        const totalCBMForImport = selectedQuotesInImport.reduce(
            (total, quote) => {
                // Priorizar cbmTotal se existir, senão calcular cbm * ctns
                const cbmTotal = quote.cbmTotal || (quote.cbm || 0) * (quote.ctns || 0);
                return total + cbmTotal;
            }, 
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

        console.log('📈 Totais calculados:', {
            totalAmount: totalAmountForImport,
            totalCBM: totalCBMForImport,
            selectedCount: selectedQuotesInImport.length
        });

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
            console.log('🔄 Iniciando salvamento do nome da importação:', { importId, newNumber });
            setSavingImportNumbers(prev => ({ ...prev, [importId]: true }));
            
            // Atualizar o estado local imediatamente para feedback visual
            setLocalImports(prevImports => 
                prevImports.map(imp => 
                    imp.id === importId 
                        ? { ...imp, importName: newNumber }
                        : imp
                )
            );
            
            // Salvar na coleção quoteImports primeiro
            const importData = imports.find(imp => imp.id === importId);
            console.log('📋 Dados da importação encontrados:', importData);
            
            if (importData) {
                console.log('🔍 Buscando documento na coleção quoteImports...');
                // Tentar encontrar na coleção quoteImports
                const quoteImportsQuery = query(
                    collection(db, 'quoteImports'),
                    where('factoryId', '==', importData.factoryId),
                    where('updateDate', '==', importData.id)
                );
                const quoteImportsSnapshot = await getDocs(quoteImportsQuery);
                console.log('📊 Resultado da busca:', quoteImportsSnapshot.size, 'documentos encontrados');
                
                if (!quoteImportsSnapshot.empty) {
                    // Atualizar documento existente
                    const docSnapshot = quoteImportsSnapshot.docs[0];
                    console.log('✏️ Atualizando documento existente:', docSnapshot.id);
                    await updateDoc(doc(db, 'quoteImports', docSnapshot.id), {
                        importName: newNumber,
                        quoteName: importData.quoteName || '',
                        updatedAt: serverTimestamp()
                    });
                    console.log('✅ Importação atualizada na coleção quoteImports');
                } else {
                    // Criar novo documento se não existir
                    console.log('➕ Criando novo documento na coleção quoteImports...');
                    const newDocRef = await addDoc(collection(db, 'quoteImports'), {
                        factoryId: importData.factoryId,
                        updateDate: importData.id,
                        importName: newNumber,
                        quoteName: importData.quoteName || '',
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                    console.log('✅ Nova importação criada na coleção quoteImports com ID:', newDocRef.id);
                }
            } else {
                console.log('⚠️ Importação não encontrada nos dados locais');
            }
            
            // Como as importações são criadas dinamicamente baseadas nas datas das cotações,
            // vamos atualizar todas as cotações dessa importação com o novo nome
            if (importData && importData.quotes) {
                console.log('🔄 Atualizando', importData.quotes.length, 'cotações...');
                const updatePromises = importData.quotes.map(async (quote) => {
                    const quoteRef = doc(db, 'quotes', quote.id);
                    await updateDoc(quoteRef, {
                        importName: newNumber,
                        updatedAt: serverTimestamp()
                    });
                });
                
                await Promise.all(updatePromises);
                console.log('✅ Todas as cotações atualizadas com novo nome:', newNumber);
            } else {
                console.log('⚠️ Nenhuma cotação encontrada para atualizar');
            }
            
            // Limpar o estado de edição
            setEditingImportNumbers(prev => {
                const newState = { ...prev };
                delete newState[importId];
                return newState;
            });
            
            console.log('✅ Nome da importação salvo com sucesso:', newNumber);
        } catch (error) {
            console.error('❌ Erro ao salvar nome da importação:', error);
            console.error('❌ Detalhes do erro:', {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            // Reverter a mudança local em caso de erro
            setLocalImports(prevImports => 
                prevImports.map(imp => 
                    imp.id === importId 
                        ? { ...imp, importName: imports.find(i => i.id === importId)?.importName || '' }
                        : imp
                )
            );
            alert('Erro ao salvar nome da importação. Tente novamente.');
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

    // Função para salvar campos da importação (DATA PEDIDO, LOTE PEDIDO) e atualizar todas as cotações relacionadas
    const handleSaveImportFields = async (importId, fields) => {
        try {
            console.log(`🔄 Tentando salvar campos para importação ${importId}:`, fields);
            const { dataPedido, lotePedido } = fields;
            
            // Buscar dados da importação primeiro
            const importData = localImports.find(imp => imp.id === importId);
            console.log(`🔍 Dados da importação encontrados:`, importData);
            
            // Salvar na importação (quoteImports) - usar setDoc para criar ou atualizar
            const importRef = doc(db, 'quoteImports', importId);
            await setDoc(importRef, {
                ...fields,
                id: importId,
                factoryId: importData?.factoryId || 'unknown',
                createdAt: importData?.datetime || new Date(),
                updatedAt: new Date()
            }, { merge: true }); // merge: true permite criar ou atualizar
            console.log(`✅ Importação ${importId} salva no banco de dados`);

            // Atualizar estado local da importação
            setLocalImports(prev => prev.map(imp => 
                imp.id === importId ? { ...imp, ...fields } : imp
            ));
            console.log(`✅ Estado local da importação ${importId} atualizado`);
            
            if (importData && importData.selectedProducts) {
                console.log(`📋 Atualizando ${importData.selectedProducts.length} cotações`);
                const updatePromises = importData.selectedProducts.map(async (product) => {
                    const quoteRef = doc(db, 'quotes', product.id);
                    await updateDoc(quoteRef, {
                        dataPedido: dataPedido || '',
                        lotePedido: lotePedido || '',
                        updatedAt: new Date()
                    });
                    console.log(`✅ Cotação ${product.id} (${product.ref}) atualizada`);
                });

                await Promise.all(updatePromises);
                console.log(`✅ ${updatePromises.length} cotações atualizadas com campos da importação`);
            } else {
                console.log(`⚠️ ImportData não encontrada ou sem selectedProducts:`, importData);
            }

            console.log(`✅ Campos da importação ${importId} salvos e cotações relacionadas atualizadas`);
            
            // Recarregar dados salvos para refletir as mudanças
            setTimeout(() => {
                loadSavedImportData();
            }, 1000);
            
        } catch (error) {
            console.error('❌ Erro ao salvar campos da importação:', error);
        }
    };

    // Função para alternar estado de reposição de um produto
    const toggleProductReplacement = (importId, productId, isReplacement) => {
        setReplacementToggleStates(prev => ({
            ...prev,
            [`${importId}-${productId}`]: isReplacement
        }));
        
        console.log(`🔄 Toggled product ${productId} replacement status to: ${isReplacement}`);
    };

    // Função para clicar na cotação com scroll автомático
    const handleQuoteClick = (importData) => {
        onViewImport(importData);
        
        // Scroll automático para a seção de produtos após um delay
        setTimeout(() => {
            // 🎯 BUSCA PRECISA: Via ID específico "productos-section"
            const productSectionById = document.getElementById('productos-section');
            if (productSectionById) {
                console.log('✅ Scroll automático encontrou via ID productos-section');
                productSectionById.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
                return;
            }
            
            // 🔍 BUSCA ESPECÍFICA: Título "Produtos" no QuotesTable
            const productTitle = document.querySelector('h6');
            if (productTitle && productTitle.textContent.includes('Produtos')) {
                console.log('✅ Scroll automático encontrou título Produtos:', productTitle.textContent);
                productTitle.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
                return;
            }
            
            // 🌐 BUSCA ALTERNATIVA: Material icon "grid_view"
            const gridIcons = document.querySelectorAll('.material-icons');
            for (let icon of gridIcons) {
                if (icon.textContent === 'grid_view') {
                    const parentElement = icon.closest('h6') || icon.parentElement;
                    if (parentElement && parentElement.textContent.includes('Produtos')) {
                        console.log('✅ Scroll automático encontrou via ícone grid_view');
                        parentElement.scrollIntoView({ 
                            behavior: 'smooth',
                            block: 'start'
                        });
                        return;
                    }
                }
            }
            
            // 📱 FALLBACK: Buscar por QuoteCard com REF
            const quoteCards = document.querySelectorAll('[class*="quote"], .MuiCard-root');
            for (let card of quoteCards) {
                if (card.textContent.includes('REF:') && card.offsetTop > 0) {
                    console.log('✅ Scroll automático encontrou QuoteCard via REF');
                    card.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                    break;
                }
            }
            
            console.log('⚠️ Scroll automático não encontrou seção de produtos');
        }, 350); // Delay otimizado para renderização completa
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
                                    border: isSelected ? '2px solid #007bff' : '1px solid #6c757d',
                                    borderRadius: '12px',
                                    background: isSelected 
                                        ? 'linear-gradient(135deg, #e9ecef 0%, #f8f9fa 100%)'
                                        : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                                    transition: 'all 0.3s ease'
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
                                                {importData.quoteName || importData.importName || `Importação #${index + 1}`}
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
                                {/* Cards de Resumo - Três campos na mesma linha */}
                                <div className="mb-3">
                                    <Row className="g-2">
                                        {/* Valor Total */}
                                        <Col xs={4}>
                                            <div 
                                                className="d-flex align-items-center p-2 rounded"
                                                style={{
                                                    border: '1px solid #e9ecef',
                                                    backgroundColor: '#f8f9fa',
                                                    height: '100%'
                                                }}
                                            >
                                                <div className="flex-grow-1 text-center">
                                                    <div 
                                                        className="fw-bold mb-0" 
                                                        style={{fontSize: '0.9rem', color: 'black'}}
                                                    >
                                                        Valor Total:
                                                    </div>
                                                    <div style={{fontSize: '0.8rem', color: '#495057'}}>
                                                        {formatCurrency(importSpecificData.totalAmount)}
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>
                                        
                                        {/* Para Pedido */}
                                        <Col xs={4}>
                                            <div 
                                                className="d-flex align-items-center p-2 rounded"
                                                style={{
                                                    border: '1px solid #e9ecef',
                                                    backgroundColor: '#f8f9fa',
                                                    height: '100%'
                                                }}
                                            >
                                                <div className="flex-grow-1 text-center">
                                                    <div 
                                                        className="fw-bold mb-0" 
                                                        style={{fontSize: '0.9rem', color: 'black'}}
                                                    >
                                                        Para Pedido:
                                                    </div>
                                                    <div style={{fontSize: '0.8rem', color: '#495057'}}>
                                                        {importSpecificData.selectedCount}
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>
                                        
                                        {/* CBM Total Selecionado */}
                                        <Col xs={4}>
                                            <div 
                                                className="d-flex align-items-center p-2 rounded"
                                                style={{
                                                    border: '1px solid #e9ecef',
                                                    backgroundColor: '#f8f9fa',
                                                    height: '100%'
                                                }}
                                            >
                                                <div className="flex-grow-1 text-center">
                                                    <div 
                                                        className="fw-bold mb-0" 
                                                        style={{fontSize: '0.9rem', color: 'black'}}
                                                    >
                                                        CBM Total:
                                                    </div>
                                                    <div style={{fontSize: '0.8rem', color: '#495057'}}>
                                                        {importSpecificData.totalCBM.toFixed(3).replace('.', ',')} m³
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>
                                
                                
                                {/* Botões de Ação */}
                                <div className="mb-3">
                                    <div className="d-flex justify-content-center gap-2">
                                        {editingImportFields[importData.id] ? (
                                            /* Modo Edição - Mostrar campos editáveis e botões Salvar/Cancelar */
                                            <>
                                                {/* Botão Salvar */}
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    onClick={() => {
                                                        const currentFields = editingImportFields[importData.id] || {};
                                                        const fieldsToSave = {};
                                                        
                                                        // Verificar se há mudanças na DATA PEDIDO
                                                        const dataPedidoChange = currentFields.dataPedido !== undefined && 
                                                                        currentFields.dataPedido !== importData.dataPedido;
                                                        if (dataPedidoChange) {
                                                            fieldsToSave.dataPedido = currentFields.dataPedido;
                                                        }
                                                        
                                                        // Verificar se há mudanças no LOTE PEDIDO
                                                        const lotePedidoChange = currentFields.lotePedido !== undefined && 
                                                                        currentFields.lotePedido !== importData.lotePedido;
                                                        if (lotePedidoChange) {
                                                            fieldsToSave.lotePedido = currentFields.lotePedido;
                                                        }
                                                        
                                                        // Log detalhado
                                                        console.log(`💾 Botão Salvar clicado:`, {
                                                            importId: importData.id,
                                                            currentFields: currentFields,
                                                            fieldsToSave: fieldsToSave,
                                                            dataPedidoChange: dataPedidoChange,
                                                            lotePedidoChange: lotePedidoChange,
                                                            importDataOriginal: {
                                                                dataPedido: importData.dataPedido,
                                                                lotePedido: importData.lotePedido
                                                            }
                                                        });
                                                        
                                                        // Salvar se houver mudanças
                                                        if (Object.keys(fieldsToSave).length > 0) {
                                                            handleSaveImportFields(importData.id, fieldsToSave);
                                                        }
                                                        
                                                        // Sair do modo de edição
                                                        setEditingImportFields(prev => {
                                                            const newState = { ...prev };
                                                            delete newState[importData.id];
                                                            return newState;
                                                        });
                                                    }}
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        padding: '6px 16px',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    <span className="material-icons me-1" style={{fontSize: '14px'}}>save</span>
                                                    Salvar
                                                </Button>
                                                
                                                {/* Botão Cancelar */}
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => {
                                                        // Cancelar edição e limpar estado
                                                        setEditingImportFields(prev => {
                                                            const newState = { ...prev };
                                                            delete newState[importData.id];
                                                            return newState;
                                                        });
                                                    }}
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        padding: '6px 16px',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    <span className="material-icons me-1" style={{fontSize: '14px'}}>close</span>
                                                    Cancelar
                                                </Button>
                                            </>
                                        ) : (
                                            /* Modo Visualização - Não mostrar botão Editar aqui */
                                            null
                                        )}
                                    </div>
                                </div>

                                {/* Campos DATA PEDIDO e LOTE PEDIDO */}
                                {editingImportFields[importData.id] ? (
                                    /* Modo Edição - Campos Editáveis */
                                    <div className="mb-3">
                                        <Row className="g-2">
                                            {/* DATA PEDIDO */}
                                            <Col xs={6}>
                                                <div className="d-flex align-items-center gap-2 p-2 rounded" style={{
                                                    border: '2px solid #007bff',
                                                    backgroundColor: '#f8f9fa',
                                                    height: '100%'
                                                }}>
                                                    <div style={{ fontSize: '0.8rem', color: '#495057', fontWeight: 'bold', minWidth: '80px' }}>
                                                        DATA PEDIDO:
                                                    </div>
                                                    <TextField
                                                        size="small"
                                                        type="text"
                                                        placeholder="DD/MM/AAAA"
                                                        value={formatDateForDisplay(editingImportFields[importData.id]?.dataPedido || '')}
                                                        onChange={(e) => {
                                                            let value = e.target.value;
                                                            // Aplicar máscara DD/MM/AAAA
                                                            value = value.replace(/\D/g, ''); // Remove caracteres não numéricos
                                                            if (value.length >= 2) {
                                                                value = value.substring(0, 2) + '/' + value.substring(2);
                                                            }
                                                            if (value.length >= 5) {
                                                                value = value.substring(0, 5) + '/' + value.substring(5, 9);
                                                            }
                                                            if (value.length > 10) {
                                                                value = value.substring(0, 10);
                                                            }
                                                            
                                                            setEditingImportFields(prev => ({
                                                                ...prev,
                                                                [importData.id]: {
                                                                    ...prev[importData.id],
                                                                    dataPedido: value
                                                                }
                                                            }));
                                                        }}
                                                        sx={{
                                                            flex: 1,
                                                            '& .MuiInputBase-input': {
                                                                fontSize: '0.8rem',
                                                                padding: '4px 8px',
                                                                backgroundColor: '#ffffff',
                                                                borderRadius: '4px',
                                                                border: 'none'
                                                            },
                                                            '& .MuiOutlinedInput-notchedOutline': {
                                                                border: 'none'
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </Col>
                                            
                                            {/* LOTE PEDIDO */}
                                            <Col xs={6}>
                                                <div className="d-flex align-items-center gap-2 p-2 rounded" style={{
                                                    border: '2px solid #007bff',
                                                    backgroundColor: '#f8f9fa',
                                                    height: '100%'
                                                }}>
                                                    <div style={{ fontSize: '0.8rem', color: '#495057', fontWeight: 'bold', minWidth: '90px' }}>
                                                        LOTE PEDIDO:
                                                    </div>
                                                    <TextField
                                                        size="small"
                                                        type="text"
                                                        placeholder="Digite o lote..."
                                                        value={editingImportFields[importData.id]?.lotePedido || ''}
                                                        onChange={(e) => setEditingImportFields(prev => ({
                                                            ...prev,
                                                            [importData.id]: {
                                                                ...prev[importData.id],
                                                                lotePedido: e.target.value
                                                            }
                                                        }))}
                                                        sx={{
                                                            flex: 1,
                                                            '& .MuiInputBase-input': {
                                                                fontSize: '0.8rem',
                                                                padding: '4px 8px',
                                                                backgroundColor: '#ffffff',
                                                                borderRadius: '4px',
                                                                border: 'none'
                                                            },
                                                            '& .MuiOutlinedInput-notchedOutline': {
                                                                border: 'none'
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>
                                ) : (
                                    /* Modo Visualização - Apenas Exibir Valores */
                                    <div className="mb-3">
                                        <Row className="g-2">
                                            {/* DATA PEDIDO */}
                                            <Col xs={6}>
                                                <div className="d-flex align-items-center gap-2 p-2 rounded" style={{
                                                    border: '1px solid #e9ecef',
                                                    backgroundColor: '#f8f9fa',
                                                    height: '100%'
                                                }}>
                                                    <div style={{ fontSize: '0.8rem', color: '#495057', fontWeight: 'bold', minWidth: '80px' }}>
                                                        DATA PEDIDO:
                                                    </div>
                                                    <div style={{ 
                                                        fontSize: '0.8rem', 
                                                        color: '#495057',
                                                        flex: 1,
                                                        textAlign: 'center',
                                                        padding: '4px 8px',
                                                        backgroundColor: '#ffffff',
                                                        borderRadius: '4px'
                                                    }}>
                                                        {formatDateForDisplay(importData.dataPedido) || 'Não informado'}
                                                    </div>
                                                </div>
                                            </Col>
                                            
                                            {/* LOTE PEDIDO */}
                                                <Col xs={6}>
                                                <div className="d-flex align-items-center gap-2 p-2 rounded" style={{
                                                    border: '1px solid #e9ecef',
                                                    backgroundColor: '#f8f9fa',
                                                    height: '100%'
                                                }}>
                                                    <div style={{ fontSize: '0.8rem', color: '#495057', fontWeight: 'bold', minWidth: '90px' }}>
                                                        LOTE PEDIDO:
                                                    </div>
                                                    <div style={{ 
                                                        fontSize: '0.8rem', 
                                                        color: '#495057',
                                                        flex: 1,
                                                        textAlign: 'center',
                                                        padding: '4px 8px',
                                                        backgroundColor: '#ffffff',
                                                        borderRadius: '4px'
                                                    }}>
                                                        {importData.lotePedido || 'Não informado'}
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>
                                )}
                                
                                {/* Botões de Ação para Cotação */}
                                <div className="mb-3">
                                    <div className="d-flex justify-content-center gap-2">
                                        {/* Botão Editar Datas */}
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => {
                                                // Entrar no modo de edição
                                                setEditingImportFields(prev => ({
                                                    ...prev,
                                                    [importData.id]: {
                                                        dataPedido: importData.dataPedido || '',
                                                        lotePedido: importData.lotePedido || ''
                                                    }
                                                }));
                                                console.log(`✏️ Entrando modo edição para importação ${importData.id}`);
                                            }}
                                            style={{
                                                fontSize: '0.75rem',
                                                padding: '6px 16px',
                                                fontWeight: 'bold',
                                                backgroundColor: '#007bff',
                                                borderColor: '#007bff',
                                                color: 'white'
                                            }}
                                        >
                                            Editar Datas
                                        </Button>
                                        
                                        {/* Botão Editar Cotação */}
                                        <Button
                                            variant="warning"
                                            size="sm"
                                            onClick={() => {
                                                console.log(`✏️ Editar cotação importação ${importData.id}`);
                                                // Chamar a função de edição de importação
                                                if (onEditImport) {
                                                    onEditImport(importData);
                                                } else {
                                                    console.log('❌ Função onEditImport não disponível');
                                                }
                                            }}
                                            style={{
                                                fontSize: '0.75rem',
                                                padding: '6px 16px',
                                                fontWeight: 'bold',
                                                backgroundColor: '#ffc107',
                                                borderColor: '#ffc107',
                                                color: 'black'
                                            }}
                                        >
                                            Editar Cotação
                                        </Button>
                                        
                                        {/* Botão Ver Produtos */}
                                        <Button
                                            variant="info"
                                            size="sm"
                                            onClick={() => {
                                                console.log(`👀 Ver produtos da importação ${importData.id}`);
                                                onViewImport(importData);
                                                
                                                // Scroll automático para a seção de produtos após um delay
                                                setTimeout(() => {
                                                    // 🎯 BUSCA PRECISA: Via ID específico "productos-section"
                                                    const productSectionById = document.getElementById('productos-section');
                                                    if (productSectionById) {
                                                        console.log('✅ Scroll automático encontrou via ID productos-section');
                                                        productSectionById.scrollIntoView({ 
                                                            behavior: 'smooth',
                                                            block: 'start'
                                                        });
                                                        return;
                                                    }
                                                    
                                                    // 🔍 BUSCA ESPECÍFICA: Título "Produtos" no QuotesTable
                                                    const productTitle = document.querySelector('h6');
                                                    if (productTitle && productTitle.textContent.includes('Produtos')) {
                                                        console.log('✅ Scroll automático encontrou título Produtos:', productTitle.textContent);
                                                        productTitle.scrollIntoView({ 
                                                            behavior: 'smooth',
                                                            block: 'start'
                                                        });
                                                        return;
                                                    }
                                                    
                                                    // 🌐 BUSCA ALTERNATIVA: Material icon "grid_view"
                                                    const gridIcons = document.querySelectorAll('.material-icons');
                                                    for (let icon of gridIcons) {
                                                        if (icon.textContent === 'grid_view') {
                                                            const parentElement = icon.closest('h6') || icon.parentElement;
                                                            if (parentElement && parentElement.textContent.includes('Produtos')) {
                                                                console.log('✅ Scroll automático encontrou via ícone grid_view');
                                                                parentElement.scrollIntoView({ 
                                                                    behavior: 'smooth',
                                                                    block: 'start'
                                                                });
                                                                return;
                                                            }
                                                        }
                                                    }
                                                    
                                                    // 📱 FALLBACK: Buscar por QuoteCard com REF
                                                    const quoteCards = document.querySelectorAll('[class*="quote"], .MuiCard-root');
                                                    for (let card of quoteCards) {
                                                        if (card.textContent.includes('REF:') && card.offsetTop > 0) {
                                                            console.log('✅ Scroll automático encontrou QuoteCard via REF');
                                                            card.scrollIntoView({ 
                                                                behavior: 'smooth',
                                                                block: 'start'
                                                            });
                                                            break;
                                                        }
                                                    }
                                                    
                                                    console.log('⚠️ Scroll automático não encontrou seção de produtos');
                                                }, 350); // Delay otimizado para renderização completa
                                            }}
                                            style={{
                                                fontSize: '0.75rem',
                                                padding: '6px 16px',
                                                fontWeight: 'bold',
                                                backgroundColor: '#0dcaf0',
                                                borderColor: '#0dcaf0',
                                                color: 'white'
                                            }}
                                        >
                                            Ver Produtos
                                        </Button>

                                        {/* Botão Duplicar Importação */}
                                        {onDuplicateQuote && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => {
                                                    console.log(`🔄 Duplicando importação ${importData.id}`);
                                                    // Duplicar todas as cotações desta importação
                                                    const importQuotes = quotes.filter(quote => {
                                                        const quoteCreatedAt = quote.createdAt?.toDate?.();
                                                        if (!quoteCreatedAt) return false;
                                                        const quoteKey = quoteCreatedAt.toISOString().substring(0, 16);
                                                        return quoteKey === importData.id;
                                                    });
                                                    
                                                    console.log(`📋 Encontradas ${importQuotes.length} cotações para duplicar`);
                                                    
                                                    // Duplicar cada cotação da importação
                                                    importQuotes.forEach(quote => {
                                                        onDuplicateQuote(quote);
                                                    });
                                                }}
                                                style={{
                                                    fontSize: '0.75rem',
                                                    padding: '6px 16px',
                                                    fontWeight: 'bold',
                                                    backgroundColor: '#6c757d',
                                                    borderColor: '#6c757d',
                                                    color: 'white'
                                                }}
                                            >
                                                Duplicar Importação
                                            </Button>
                                        )}
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













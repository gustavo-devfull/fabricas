import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Form } from 'react-bootstrap';
import { Box, Typography, Chip, Divider, Switch, FormControlLabel, TextField, IconButton } from '@mui/material';
import { 
    getAllFactories, 
    getQuotesByFactory,
    getQuoteImportsByFactory
} from '../../firebase/firestoreService';
import { query, collection, getDocs, where, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import excelExportService from '../../services/excelExportService';
import { useAuth } from '../../hooks/useAuth';
import { CloudUpload, Image as ImageIcon, Delete } from '@mui/icons-material';
import Lightbox from '../../components/Lightbox';

const SelectedProducts = () => {
    const { currentUser } = useAuth();
    const [factories, setFactories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [factoryData, setFactoryData] = useState([]);
    const [exporting, setExporting] = useState(false);
    const [exportingFactory, setExportingFactory] = useState(null);
    const [expandedCards, setExpandedCards] = useState({});
    const [expandedFactories, setExpandedFactories] = useState({});
    const [filters, setFilters] = useState({
        dataPedido: '',
        lotePedido: '',
        buscaGeral: ''
    });
    const [duplicateDetectionEnabled, setDuplicateDetectionEnabled] = useState(true);
    const [replacementImports, setReplacementImports] = useState({});
    const [importComments, setImportComments] = useState({});
    const [newComment, setNewComment] = useState('');
    const [commentingImport, setCommentingImport] = useState(null);
    const [commentImage, setCommentImage] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [showLightbox, setShowLightbox] = useState(false);
    const [lightboxImageUrl, setLightboxImageUrl] = useState('');
    const [lightboxImageAlt, setLightboxImageAlt] = useState('');
    const [sortByRecent, setSortByRecent] = useState(false);
    const [sortByDataPedido, setSortByDataPedido] = useState(false);
    const [markedExportedFactories, setMarkedExportedFactories] = useState(new Set());
    // Função para formatar data brasileira
    const formatBrazilianDate = (dateString) => {
        if (!dateString) return 'Não informado';
        // Se já está no formato brasileiro DD/MM/AAAA, retorna como está
        if (dateString.includes('/')) return dateString;
        // Se está no formato americano AAAA-MM-DD, converte para DD/MM/AAAA
        if (dateString.includes('-')) {
            const [year, month, day] = dateString.split('-');
            return `${day}/${month}/${year}`;
        }
        return dateString;
    };

    // Função para converter data brasileira para objeto Date para ordenação
    const parseBrazilianDate = (dateString) => {
        if (!dateString || dateString === 'Não informado') return new Date(0);
        
        // Se está no formato brasileiro DD/MM/AAAA
        if (dateString.includes('/')) {
            const [day, month, year] = dateString.split('/');
            return new Date(year, month - 1, day);
        }
        
        // Se está no formato americano AAAA-MM-DD
        if (dateString.includes('-')) {
            return new Date(dateString);
        }
        
        return new Date(0);
    };

    useEffect(() => {
        loadData();
        loadReplacementStates();
    }, []);

    // Função para carregar estados de reposição salvos do Firebase
    const loadReplacementStates = async () => {
        try {
            console.log('🔄 Carregando estados de reposição do Firebase...');
            
            // Buscar todos os documentos da coleção quoteImports que têm isReplacement definido
            const importsQuery = query(
                collection(db, 'quoteImports'),
                where('isReplacement', '==', true)
            );
            
            const querySnapshot = await getDocs(importsQuery);
            const replacementStates = {};
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const replacementKey = `${data.factoryId}-${data.id}`;
                replacementStates[replacementKey] = true;
                console.log(`✅ Estado de reposição carregado: ${replacementKey}`);
            });
            
            setReplacementImports(replacementStates);
            console.log(`✅ ${Object.keys(replacementStates).length} estados de reposição carregados`);
        } catch (error) {
            console.error('❌ Erro ao carregar estados de reposição:', error);
        }
    };

    // Função para alternar o estado de expansão de uma fábrica
    const toggleFactoryExpansion = (factoryId) => {
        setExpandedFactories(prev => {
            const newState = {
            ...prev,
            [factoryId]: !prev[factoryId]
            };
            console.log(`🔄 Toggle fábrica ${factoryId}: estendida = ${newState[factoryId]}`);
            return newState;
        });
    };

    // Função para comprimir imagem
    const compressImage = (file, maxWidth = 800, quality = 0.8) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calcular novas dimensões mantendo proporção
                let { width, height } = img;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Desenhar imagem redimensionada
                ctx.drawImage(img, 0, 0, width, height);
                
                // Converter para blob com compressão
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    };

    // Função para converter arquivo para base64
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    // Função para adicionar comentário na importação
    const handleAddComment = async (factoryId, importId) => {
        if (!newComment.trim() && !commentImage) return;

        try {
            let imageUrl = null;
            
            // Upload da imagem se existir
            if (commentImage) {
                setUploadingImage(true);
                console.log('🔄 Comprimindo imagem...');
                
                // Comprimir imagem antes de converter para base64
                const compressedBlob = await compressImage(commentImage, 600, 0.7);
                console.log(`📊 Imagem comprimida: ${compressedBlob.size} bytes (original: ${commentImage.size} bytes)`);
                
                // Converter blob comprimido para base64
                const base64 = await fileToBase64(compressedBlob);
                imageUrl = base64;
                
                console.log('✅ Imagem comprimida e convertida para base64');
            }

            const commentData = {
                factoryId,
                importId,
                comment: newComment.trim(),
                userName: currentUser?.displayName || currentUser?.email || 'Usuário',
                createdAt: serverTimestamp(),
                userId: currentUser?.uid || 'unknown',
                imageUrl: imageUrl
            };

            // Salvar no Firestore
            const docRef = await addDoc(collection(db, 'importComments'), commentData);
            console.log('✅ Comentário salvo com ID:', docRef.id);
            
            // Atualizar estado local com o ID real do documento
            const commentKey = `${factoryId}-${importId}`;
            setImportComments(prev => ({
                ...prev,
                [commentKey]: [
                    {
                        id: docRef.id, // ID real do Firestore
                        ...commentData,
                        createdAt: new Date() // Para exibição imediata
                    },
                    ...(prev[commentKey] || [])
                ]
            }));

            setNewComment('');
            setCommentImage(null);
            setCommentingImport(null);
            setUploadingImage(false);
            console.log('✅ Comentário adicionado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao adicionar comentário:', error);
            setUploadingImage(false);
            
            if (error.message.includes('longer than 1048487 bytes')) {
                alert('A imagem é muito grande mesmo após compressão. Tente uma imagem menor ou com menor qualidade.');
            } else {
                alert('Erro ao salvar comentário. Tente novamente.');
            }
        }
    };

    // Função para lidar com upload de imagem
    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validar tipo de arquivo
            if (!file.type.startsWith('image/')) {
                alert('Por favor, selecione apenas arquivos de imagem.');
                return;
            }
            
            // Validar tamanho (máximo 2MB antes da compressão)
            if (file.size > 2 * 1024 * 1024) {
                alert('A imagem deve ter no máximo 2MB. Será comprimida automaticamente.');
                return;
            }
            
            setCommentImage(file);
            console.log('✅ Imagem selecionada:', file.name);
        }
    };

    // Função para remover imagem selecionada
    const handleRemoveImage = () => {
        setCommentImage(null);
        // Limpar o input file
        const fileInput = document.getElementById('comment-image-upload');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    // Funções para controlar o lightbox
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

    // Função para carregar comentários de uma importação
    const loadImportComments = async (factoryId, importId) => {
        try {
            const q = query(
                collection(db, 'importComments'),
                where('factoryId', '==', factoryId),
                where('importId', '==', importId)
            );
            const querySnapshot = await getDocs(q);
            const comments = [];
            querySnapshot.forEach((doc) => {
                comments.push({ id: doc.id, ...doc.data() });
            });
            
            const commentKey = `${factoryId}-${importId}`;
            setImportComments(prev => ({
                ...prev,
                [commentKey]: comments.sort((a, b) => {
                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                    return dateB - dateA; // Mais recentes primeiro
                })
            }));
            console.log(`✅ Comentários carregados para ${factoryId}-${importId}:`, comments.length);
        } catch (error) {
            console.error('❌ Erro ao carregar comentários:', error);
        }
    };

    // Função para carregar todos os comentários de todas as importações
    const loadAllComments = async () => {
        try {
            console.log('🔄 Carregando todos os comentários...');
            const q = query(collection(db, 'importComments'));
            const querySnapshot = await getDocs(q);
            const allComments = {};
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const commentKey = `${data.factoryId}-${data.importId}`;
                
                if (!allComments[commentKey]) {
                    allComments[commentKey] = [];
                }
                
                allComments[commentKey].push({ 
                    id: doc.id, 
                    ...data 
                });
            });
            
            // Ordenar comentários por data em cada importação
            Object.keys(allComments).forEach(key => {
                allComments[key].sort((a, b) => {
                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                    return dateB - dateA; // Mais recentes primeiro
                });
            });
            
            setImportComments(allComments);
            console.log('✅ Todos os comentários carregados:', Object.keys(allComments).length, 'importações com comentários');
        } catch (error) {
            console.error('❌ Erro ao carregar todos os comentários:', error);
        }
    };

    // Função para aplicar filtros aos dados
    const applyFilters = (data) => {
        if (!data || data.length === 0) return data;
        
        return data
            .map(factoryDataItem => {
                const filteredImports = factoryDataItem.imports.filter(importData => {
                    // Filtro por DATA PEDIDO
                    if (filters.dataPedido && !importData.dataPedido?.toLowerCase().includes(filters.dataPedido.toLowerCase())) {
                        return false;
                    }
                    
                    // Filtro por LOTE PEDIDO
                    if (filters.lotePedido && !importData.lotePedido?.toLowerCase().includes(filters.lotePedido.toLowerCase())) {
                        return false;
                    }
                    
                    // Filtro por busca geral
                    if (filters.buscaGeral) {
                        const searchTerm = filters.buscaGeral.toLowerCase();
                        const hasMatch = 
                            (factoryDataItem.factory.name || factoryDataItem.factory.nomeFabrica)?.toLowerCase().includes(searchTerm) ||
                            factoryDataItem.factory.localizacao?.toLowerCase().includes(searchTerm) ||
                            importData.dataPedido?.toLowerCase().includes(searchTerm) ||
                            importData.lotePedido?.toLowerCase().includes(searchTerm) ||
                            importData.importName?.toLowerCase().includes(searchTerm) ||
                            importData.selectedProducts?.some(product => 
                                product.ref?.toLowerCase().includes(searchTerm) ||
                                product.description?.toLowerCase().includes(searchTerm)
                            );
                        if (!hasMatch) return false;
                    }
                    
                    return true;
                });
                
                // Aplicar ordenação por mais recentes primeiro se ativada
                const sortedImports = sortByRecent 
                    ? (() => {
                        console.log('📅 Aplicando ordenação por mais recentes primeiro');
                        const sorted = [...filteredImports].sort((a, b) => {
                            const dateA = a.datetime || new Date(0);
                            const dateB = b.datetime || new Date(0);
                            return dateB - dateA; // Mais recentes primeiro ...
                        });
                        console.log(`✅ ${sorted.length} importações ordenadas por data recente`);
                        return sorted;
                    })()
                    : filteredImports;

                // Sempre mostrar todas as importações, mas aplicar transparência às exportadas
                let finalImports = sortedImports;

                return {
                    ...factoryDataItem,
                    imports: finalImports,
                    importsExported: factoryDataItem.importsExported || [], // Manter as exportadas para exibição separada
                    totalSelectedProducts: finalImports.reduce((total, importData) => total + importData.selectedProducts.length, 0)
                };
            })
            .filter(factoryDataItem => {
                // Sempre mostrar fábricas que tenham imports (ativas ou exportadas)
                return factoryDataItem.imports.length > 0;
            })
            .sort((a, b) => {
                if (sortByDataPedido) {
                    console.log('📅 Aplicando ordenação por Data Pedido');
                    // Ordenar por Data Pedido mais antiga primeiro
                    const getEarliestDataPedido = (factory) => {
                        const dates = factory.imports
                            .map(imp => imp.dataPedido)
                            .filter(date => date && date !== 'Não informado')
                            .map(date => parseBrazilianDate(date));
                        
                        if (dates.length === 0) return new Date(0);
                        return new Date(Math.min(...dates));
                    };
                    
                    const dateA = getEarliestDataPedido(a);
                    const dateB = getEarliestDataPedido(b);
                    return dateA - dateB; // Mais antigas primeiro
                }
                return 0; // Sem ordenação adicional
            });
    };

    // Função para alternar o estado de expansão de um card
    const toggleCardExpansion = (factoryId, importKey) => {
        const cardKey = `${factoryId}-${importKey}`;
        setExpandedCards(prev => ({
            ...prev,
            [cardKey]: !prev[cardKey]
        }));
    };

    // Função para calcular informações resumidas de uma importação
    const calculateImportSummary = (importData) => {
        const selectedProducts = importData.selectedProducts || [];
        
        let totalAmount = 0;
        let totalCBM = 0;
        
        selectedProducts.forEach(product => {
            // Usar amount se existir e for maior que 0, senão calcular
            const amount = product.amount && product.amount > 0 
                ? product.amount 
                : (product.ctns || 0) * (product.unitCtn || 1) * (product.unitPrice || 0);
            
            totalAmount += amount;
            totalCBM += (product.cbmTotal || (product.cbm || 0) * (product.ctns || 0));
        });

        return {
            totalAmount,
            totalCBM,
            productCount: selectedProducts.length
        };
    };

    // Função para calcular informações resumidas de uma fábrica
    const calculateFactorySummary = (factoryDataItem) => {
        let totalAmount = 0;
        let totalCBM = 0;
        let totalProducts = 0;
        let importCount = 0;

        factoryDataItem.imports.forEach(importData => {
            const importSummary = calculateImportSummary(importData);
            totalAmount += importSummary.totalAmount;
            totalCBM += importSummary.totalCBM;
            totalProducts += importSummary.productCount;
            importCount++;
        });

        return {
            totalAmount,
            totalCBM,
            totalProducts,
            importCount
        };
    };

    // Função para carregar dados salvos da coleção quoteImports
    const loadSavedImportData = async (factoryId) => {
        try {
            console.log(`📥 Carregando dados salvos para fábrica ${factoryId}`);
            
            const importsQuery = query(collection(db, 'quoteImports'), where('factoryId', '==', factoryId));
            const importsSnapshot = await getDocs(importsQuery);
            const savedData = {};
            
            importsSnapshot.forEach((doc) => {
                savedData[doc.id] = doc.data();
                console.log(`✅ Dados salvos para importação ${doc.id}:`, doc.data());
            });
            
            return savedData;
        } catch (error) {
            console.error('❌ Erro ao carregar dados salvos:', error);
            return {};
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Carregar todas as fábricas
            const factoriesData = await getAllFactories();
            setFactories(factoriesData);
            
            // Para cada fábrica, carregar cotações e importações
            const factoryDataPromises = factoriesData.map(async (factory) => {
                try {
                    const quotes = await getQuotesByFactory(factory.id);
                    const imports = await getQuoteImportsByFactory(factory.id);
                    
                    // Carregar dados salvos da coleção quoteImports
                    const savedData = await loadSavedImportData(factory.id);
                    
                    console.log(`🔍 Fábrica ${factory.name || factory.nomeFabrica}:`);
                    console.log(`  📊 Total de cotações: ${quotes.length}`);
                    console.log(`  📦 Total de importações: ${imports.length}`);
                    
                    // Debug: Ver todas as cotações
                    if (quotes.length > 0) {
                        console.log(`  📋 Cotações encontradas:`);
                        quotes.forEach((quote, i) => {
                            console.log(`    ${i + 1}. REF: ${quote.ref}, selectedForOrder: ${quote.selectedForOrder}, exported: ${quote.exported}`);
                        });
                    }
                    
                    // Filtrar produtos selecionados para pedido OU exportados (para mostrar com transparência)
                    const selectedQuotes = quotes.filter(quote => 
                        quote.selectedForOrder === true || quote.exported === true
                    );
                    
                    console.log(`  ✅ Cotações selecionadas/exportadas: ${selectedQuotes.length}`);
                    
                    // Separar cotações exportadas e não exportadas selecionadas para pedido
                    const selectedQuotesExported = selectedQuotes.filter(quote => quote.exported === true);
                    const selectedQuotesNotExported = selectedQuotes.filter(quote => quote.exported !== true);
                    
                    // Função auxiliar para agrupar cotações por importação
                    const groupQuotesByImport = (quotesToGroup, type = 'not-exported') => {
                        console.log(`🔍 Agrupando ${quotesToGroup.length} cotações por importação (tipo: ${type})`);
                        return imports.map(importData => {
                            console.log(`📅 Processando importação: ${importData.id}`);
                            const importQuotes = quotesToGroup.filter(quote => {
                            const quoteCreatedAt = quote.createdAt?.toDate?.();
                                if (!quoteCreatedAt) {
                                    console.log(`⚠️ Cotações sem createdAt: ${quote.ref}`);
                                    return false;
                                }
                            const quoteKey = quoteCreatedAt.toISOString().substring(0, 16);
                                const matches = quoteKey === importData.id;
                                console.log(`🔗 Comparando: "${quoteKey}" === "${importData.id}" = ${matches} (REF: ${quote.ref})`);
                                return matches;
                            });
                            
                            console.log(`📦 Importação ${importData.id}: encontrou ${importQuotes.length} cotações`);
                            
                            if (importQuotes.length === 0) {
                                console.log(`⚠️ Importação ${importData.id} descartada (sem produtos)`);
                                return null;
                            }
                            
                            // Mesclar dados salvos da coleção quoteImports
                            const savedImportData = savedData[importData.id] || {};
                            
                            // Se não há quoteName salvo, tentar capturar da primeira cotação
                            let quoteName = savedImportData.quoteName || importData.quoteName || '';
                            if (!quoteName && importQuotes.length > 0) {
                                const firstQuote = importQuotes[0];
                                if (firstQuote.quoteName) {
                                    quoteName = firstQuote.quoteName;
                                }
                            }
                        
                            return {
                                ...importData,
                                selectedProducts: importQuotes,
                                exportType: type,
                                // Incluir dados salvos da coleção quoteImports
                                dataPedido: savedImportData.dataPedido || '',
                                lotePedido: savedImportData.lotePedido || '',
                                importName: savedImportData.importName || importData.importName,
                                quoteName: quoteName
                            };
                        }).filter(importData => importData !== null);
                    };
                    
                    // Criar grupos separados para exportadas e não exportadas
                    const importsNotExported = groupQuotesByImport(selectedQuotesNotExported, 'not-exported');
                    const importsExported = groupQuotesByImport(selectedQuotesExported, 'exported');
                    
                    // Combinar todas as importações (exportadas e não exportadas) em um único array
                    const allImports = [...importsNotExported, ...importsExported];
                    
                    console.log(`🔄 Fábrica ${factory.name || factory.nomeFabrica}: ${importsNotExported.length} importações não exportadas, ${importsExported.length} exportadas, ${allImports.length} total`);
                    
                    return {
                        factory,
                        imports: allImports, // Todas as importações (exportadas e não exportadas)
                        importsExported: importsExported, // Manter separado para referência
                        totalSelectedProducts: selectedQuotesNotExported.length,
                        totalExportedProducts: selectedQuotesExported.length
                    };
                } catch (err) {
                    console.error(`Erro ao carregar dados da fábrica ${factory.nomeFabrica}:`, err);
                    return {
                        factory,
                        imports: [],
                        totalSelectedProducts: 0
                    };
                }
            });
            
            const factoryDataResults = await Promise.all(factoryDataPromises);
            
            // Debug: Log detalhado das fábricas encontradas
            console.log('🔍 Debug - Fábricas encontradas:');
            factoryDataResults.forEach((data, index) => {
                console.log(`  ${index + 1}. ${data.factory.name || data.factory.nomeFabrica}:`);
                console.log(`     - totalSelectedProducts: ${data.totalSelectedProducts}`);
                console.log(`     - totalExportedProducts: ${data.totalExportedProducts}`);
                console.log(`     - imports.length: ${data.imports.length}`);
            });
            
            // Mostrar TODAS as fábricas para debug (remover filtro temporariamente)
            setFactoryData(factoryDataResults);
            // setFactoryData(factoryDataResults.filter(data => 
            //     data.totalSelectedProducts > 0 || data.totalExportedProducts > 0
            // ));
            
            console.log(`✅ Dados carregados: ${factoryDataResults.length} fábricas (total), ${factoryDataResults.filter(data => data.totalSelectedProducts > 0 || data.totalExportedProducts > 0).length} com produtos`);
            
            // Carregar todos os comentários após carregar os dados principais
            await loadAllComments();
            
            // Carregar status de fábricas exportadas
            await loadExportedFactoriesStatus();
            
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
            setError('Erro ao carregar dados das fábricas');
        } finally {
            setLoading(false);
        }
    };

    // Função para exportar todos os produtos selecionados
    const handleExportAll = async () => {
        try {
            setExporting(true);
            // Usar função com imagens visíveis nas células
            const result = await excelExportService.exportSelectedProductsWithImages(factoryData);
            console.log('Exportação geral com imagens visíveis concluída:', result);
        } catch (error) {
            console.error('Erro na exportação geral:', error);
            setError('Erro ao exportar dados: ' + error.message);
        } finally {
            setExporting(false);
        }
    };

    // Função para exportar produtos de uma fábrica específica
    const handleExportFactory = async (factoryDataItem) => {
        try {
            setExportingFactory(factoryDataItem.factory.id);
            // Usar função com imagens visíveis nas células
            const result = await excelExportService.exportSelectedProductsWithImages([factoryDataItem]);
            console.log('Exportação da fábrica concluída:', result);
        } catch (error) {
            console.error('Erro na exportação da fábrica:', error);
            setError('Erro ao exportar dados da fábrica: ' + error.message);
        } finally {
            setExportingFactory(null);
        }
    };

    const formatNumber = (value, decimals = 2) => {
        return (value || 0).toFixed(decimals);
    };

    // Função para limpar todos os filtros
    const clearFilters = () => {
        setFilters({
            dataPedido: '',
            lotePedido: '',
            buscaGeral: ''
        });
    };

    // Função para limpar todas as ordenações
    const clearSorting = () => {
        console.log('🧹 Limpando todas as ordenações');
        setSortByRecent(false);
        setSortByDataPedido(false);
    };

    // Função para alternar o status de exportação de uma fábrica
    const toggleFactoryExportStatus = async (factoryDataItem) => {
        try {
            console.log('🚀 toggleFactoryExportStatus chamada!');
            console.log('🏭 Fábrica:', factoryDataItem.factory.name || factoryDataItem.factory.nomeFabrica);
            console.log('🆔 ID:', factoryDataItem.factory.id);
            console.log('📊 markedExportedFactories atual:', Array.from(markedExportedFactories));
            
            const isCurrentlyExported = markedExportedFactories.has(factoryDataItem.factory.id);
            console.log('🔍 Fábrica atualmente exportada?', isCurrentlyExported);
            
            if (isCurrentlyExported) {
                // Se está exportada, vamos desmarcar
                console.log('🔄 Desmarcando fábrica como exportada:', factoryDataItem.factory.name || factoryDataItem.factory.nomeFabrica);
                
                // Coletar todos os IDs das cotações desta fábrica
                const allQuoteIds = [];
                factoryDataItem.imports.forEach(importData => {
                    if (importData.selectedProducts && Array.isArray(importData.selectedProducts)) {
                        importData.selectedProducts.forEach(product => {
                            if (product.id) {
                                allQuoteIds.push(product.id);
                            }
                        });
                    }
                });

                if (allQuoteIds.length === 0) {
                    showAlert('warning', 'Aviso', 'Nenhuma cotação encontrada nesta fábrica para desmarcar como exportada.');
                    return;
                }

                console.log(`🔄 Desmarcando ${allQuoteIds.length} cotações como exportadas...`);

                // Atualizar todas as cotações no Firebase para desmarcar como exportadas
                const { doc, updateDoc } = await import('firebase/firestore');
                const { db } = await import('../../firebase/config');

                const updatePromises = allQuoteIds.map(async (quoteId) => {
                    try {
                        // Buscar dados atuais da cotação DIRETAMENTE do Firebase para preservar campos importantes
                        const { doc, getDoc, updateDoc } = await import('firebase/firestore');
                        const quoteRef = doc(db, 'quotes', quoteId);
                        const quoteSnapshot = await getDoc(quoteRef);
                        const currentQuoteData = quoteSnapshot.exists() ? quoteSnapshot.data() : null;
                        
                        console.log(`📊 Dados atuais da cotação ${quoteId} no Firebase:`, {
                            dataPedido: currentQuoteData?.dataPedido,
                            lotePedido: currentQuoteData?.lotePedido,
                            ref: currentQuoteData?.ref
                        });
                        
                        await updateDoc(quoteRef, {
                            exported: false,
                            exportedAt: null,
                            orderStatus: 'pending',
                            selectedForOrder: true, // Reativar seleção
                            updatedAt: new Date(),
                            // Preservar campos importantes do Firebase
                            dataPedido: currentQuoteData?.dataPedido || '',
                            lotePedido: currentQuoteData?.lotePedido || ''
                        });
                        console.log(`✅ Cotação ${quoteId} desmarcada como exportada (DATA PEDIDO: ${currentQuoteData?.dataPedido}, LOTE PEDIDO: ${currentQuoteData?.lotePedido})`);
                    } catch (updateError) {
                        console.error(`❌ Erro ao atualizar cotação ${quoteId}:`, updateError);
                        throw updateError;
                    }
                });

                await Promise.all(updatePromises);

                // Remover fábrica do conjunto de fábricas marcadas como exportadas
                setMarkedExportedFactories(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(factoryDataItem.factory.id);
                    return newSet;
                });

                // Recarregar dados
                await loadData();

                showAlert('success', 'Sucesso!', 
                    `${allQuoteIds.length} cotações da fábrica "${factoryDataItem.factory.name || factoryDataItem.factory.nomeFabrica}" foram desmarcadas como exportadas. Dados dos campos preservados.`);
                
                console.log(`✅ ${allQuoteIds.length} cotações desmarcadas como exportadas com sucesso`);

            } else {
                // Se não está exportada, vamos marcar
                console.log('🏷️ Marcando fábrica como exportada:', factoryDataItem.factory.name || factoryDataItem.factory.nomeFabrica);
                
                // Coletar todos os IDs das cotações desta fábrica
                const allQuoteIds = [];
                factoryDataItem.imports.forEach(importData => {
                    if (importData.selectedProducts && Array.isArray(importData.selectedProducts)) {
                        importData.selectedProducts.forEach(product => {
                            if (product.id) {
                                allQuoteIds.push(product.id);
                            }
                        });
                    }
                });

                if (allQuoteIds.length === 0) {
                    showAlert('warning', 'Aviso', 'Nenhuma cotação encontrada nesta fábrica para marcar como exportada.');
                    return;
                }

                console.log(`🔄 Marcando ${allQuoteIds.length} cotações como exportadas...`);

                // Atualizar todas as cotações no Firebase para marcar como exportadas
                const { doc, updateDoc } = await import('firebase/firestore');
                const { db } = await import('../../firebase/config');

                const updatePromises = allQuoteIds.map(async (quoteId) => {
                    try {
                        // Buscar dados atuais da cotação DIRETAMENTE do Firebase para preservar campos importantes
                        const { doc, getDoc, updateDoc } = await import('firebase/firestore');
                        const quoteRef = doc(db, 'quotes', quoteId);
                        const quoteSnapshot = await getDoc(quoteRef);
                        const currentQuoteData = quoteSnapshot.exists() ? quoteSnapshot.data() : null;
                        
                        console.log(`📊 Dados atuais da cotação ${quoteId} no Firebase:`, {
                            dataPedido: currentQuoteData?.dataPedido,
                            lotePedido: currentQuoteData?.lotePedido,
                            ref: currentQuoteData?.ref
                        });
                        
                        await updateDoc(quoteRef, {
                            exported: true,
                            exportedAt: new Date(),
                            orderStatus: 'exported',
                            selectedForOrder: false,
                            updatedAt: new Date(),
                            // Preservar campos importantes do Firebase
                            dataPedido: currentQuoteData?.dataPedido || '',
                            lotePedido: currentQuoteData?.lotePedido || ''
                        });
                        console.log(`✅ Cotação ${quoteId} marcada como exportada (DATA PEDIDO: ${currentQuoteData?.dataPedido}, LOTE PEDIDO: ${currentQuoteData?.lotePedido})`);
                    } catch (updateError) {
                        console.error(`❌ Erro ao atualizar cotação ${quoteId}:`, updateError);
                        throw updateError;
                    }
                });

                await Promise.all(updatePromises);

                // Adicionar fábrica ao conjunto de fábricas marcadas como exportadas
                setMarkedExportedFactories(prev => new Set([...prev, factoryDataItem.factory.id]));

                // Recarregar dados
                await loadData();

                showAlert('success', 'Sucesso!', 
                    `${allQuoteIds.length} cotações da fábrica "${factoryDataItem.factory.name || factoryDataItem.factory.nomeFabrica}" foram marcadas como exportadas. Dados dos campos preservados.`);
                
                console.log(`✅ ${allQuoteIds.length} cotações marcadas como exportadas com sucesso`);
            }

        } catch (error) {
            console.error('❌ Erro ao alterar status de exportação da fábrica:', error);
            showAlert('error', 'Erro!', `Erro ao alterar status de exportação: ${error.message}`);
        }
    };


    // Função para carregar o status de exportação das fábricas
    const loadExportedFactoriesStatus = async () => {
        try {
            console.log('🔄 Carregando status de fábricas exportadas...');
            console.log('📊 Total de fábricas para verificar:', factoryData.length);
            
            const exportedFactoryIds = new Set();
            
            // Verificar todas as fábricas na lista atual
            for (const factoryDataItem of factoryData) {
                console.log(`🔍 Verificando fábrica: ${factoryDataItem.factory.name || factoryDataItem.factory.nomeFabrica}`);
                let allQuotesExported = true;
                let hasAnyQuote = false;
                let exportedCount = 0;
                let totalCount = 0;
                
                // Verificar se todos os produtos desta fábrica estão exportados
                for (const importData of factoryDataItem.imports) {
                    console.log(`  📦 Verificando importação: ${importData.importName || importData.id}`);
                    
                    for (const product of importData.selectedProducts || []) {
                        hasAnyQuote = true;
                        totalCount++;
                        
                        console.log(`    🛍️ Produto ${product.ref}: exported = ${product.exported}`);
                        
                        if (product.exported === true) {
                            exportedCount++;
                        } else {
                            allQuotesExported = false;
                        }
                    }
                    
                    if (!allQuotesExported) break;
                }
                
                console.log(`📈 Fábrica ${factoryDataItem.factory.name || factoryDataItem.factory.nomeFabrica}: ${exportedCount}/${totalCount} produtos exportados`);
                
                // Se tem produtos e todos estão exportados, marcar fábrica como exportada
                if (hasAnyQuote && allQuotesExported && exportedCount > 0) {
                    exportedFactoryIds.add(factoryDataItem.factory.id);
                    console.log(`✅ Fábrica ${factoryDataItem.factory.name || factoryDataItem.factory.nomeFabrica} marcada como exportada`);
                } else {
                    console.log(`❌ Fábrica ${factoryDataItem.factory.name || factoryDataItem.factory.nomeFabrica} não será marcada como exportada`);
                }
            }
            
            setMarkedExportedFactories(exportedFactoryIds);
            console.log(`📊 Status final: ${exportedFactoryIds.size} fábricas marcadas como exportadas:`, Array.from(exportedFactoryIds));
            
        } catch (error) {
            console.error('❌ Erro ao carregar status de fábricas exportadas:', error);
        }
    };

    // Função para atualizar estado de reposição de importação
    const updateReplacementStatus = async (factoryId, importId, isReplacement) => {
        try {
            const replacementKey = `${factoryId}-${importId}`;
            
            // Atualizar estado local primeiro
            setReplacementImports(prev => ({
                ...prev,
                [replacementKey]: isReplacement
            }));
            
            // Salvar no Firebase na coleção quoteImports
            const importRef = doc(db, 'quoteImports', importId);
            await setDoc(importRef, {
                id: importId,
                factoryId: factoryId,
                isReplacement: isReplacement,
                updatedAt: new Date()
            }, { merge: true });
            
            console.log(`✅ Status de reposição salvo no Firebase para ${factoryId}-${importId}: ${isReplacement}`);
        } catch (error) {
            console.error('❌ Erro ao salvar status de reposição:', error);
            // Reverter estado local em caso de erro
            const replacementKey = `${factoryId}-${importId}`;
            setReplacementImports(prev => ({
                ...prev,
                [replacementKey]: !isReplacement
            }));
        }
    };

    // Função para detectar referências duplicadas globalmente (entre todas as fábricas)
    const detectGlobalDuplicateReferences = () => {
        const allProducts = [];
        
        // Coletar todos os produtos de todas as fábricas
        factoryData.forEach((factoryDataItem) => {
            if (factoryDataItem.imports && Array.isArray(factoryDataItem.imports)) {
                factoryDataItem.imports.forEach((importData) => {
                    // Pular importações marcadas como reposição
                    const isReplacementKey = `${factoryDataItem.factory.id}-${importData.id}`;
                    if (replacementImports[isReplacementKey]) {
                        return;
                    }
                    
                    if (importData.selectedProducts && Array.isArray(importData.selectedProducts)) {
                        importData.selectedProducts.forEach((product) => {
                            if (product.ref && product.ref.trim() !== '') {
                                allProducts.push({
                                    ref: product.ref.trim(),
                                    factoryId: factoryDataItem.factory.id,
                                    factoryName: factoryDataItem.factory.name || factoryDataItem.factory.nomeFabrica,
                                    importId: importData.id,
                                    importName: importData.importName || `Importação ${importData.id}`,
                                    dataPedido: importData.dataPedido,
                                    lotePedido: importData.lotePedido,
                                    product: product
                                });
                            }
                        });
                    }
                });
            }
        });
        
        // Agrupar por REF
        const refGroups = {};
        allProducts.forEach(product => {
            if (!refGroups[product.ref]) {
                refGroups[product.ref] = [];
            }
            refGroups[product.ref].push(product);
        });
        
        // Encontrar duplicatas globais
        const globalDuplicates = [];
        Object.keys(refGroups).forEach(ref => {
            if (refGroups[ref].length > 1) {
                globalDuplicates.push({
                    reference: ref,
                    occurrences: refGroups[ref],
                    hasReplacementImport: false
                });
            }
        });
        
        return globalDuplicates;
    };

    // Função para detectar referências duplicadas em uma fábrica específica
    const detectDuplicateReferences = (factoryDataItem) => {
        if (!factoryDataItem.imports || factoryDataItem.imports.length <= 1) {
            return [];
        }
        
        const allProducts = [];
        
        // Coletar todos os produtos de todas as importações desta fábrica
        factoryDataItem.imports.forEach((importData) => {
            // Pular importações marcadas como reposição
            const isReplacementKey = `${factoryDataItem.factory.id}-${importData.id}`;
            if (replacementImports[isReplacementKey]) {
                return;
            }
            
            if (importData.selectedProducts && Array.isArray(importData.selectedProducts)) {
                importData.selectedProducts.forEach((product) => {
                    if (product.ref && product.ref.trim() !== '') {
                        allProducts.push({
                            ref: product.ref.trim(),
                            importId: importData.id,
                            importName: importData.importName || `Importação ${importData.id}`,
                            dataPedido: importData.dataPedido,
                            lotePedido: importData.lotePedido,
                            product: product
                        });
                    }
                });
            }
        });
        
        // Agrupar por REF
        const refGroups = {};
        allProducts.forEach(product => {
            if (!refGroups[product.ref]) {
                refGroups[product.ref] = [];
            }
            refGroups[product.ref].push(product);
        });
        
        // Encontrar duplicatas dentro da fábrica
        const duplicates = [];
        Object.keys(refGroups).forEach(ref => {
            if (refGroups[ref].length > 1) {
                duplicates.push({
                    reference: ref,
                    occurrences: refGroups[ref],
                    hasReplacementImport: false
                });
            }
        });
        
        return duplicates;
    };
    
    // Dados filtrados com useMemo para otimizar performance
    const filteredFactoryData = useMemo(() => {
        return applyFilters(factoryData);
    }, [factoryData, filters, sortByRecent, sortByDataPedido]);

    const calculateProductAmount = (quote) => {
        const ctns = quote.ctns || 0;
        const unitCtn = quote.unitCtn || 1;
        const unitPrice = quote.unitPrice || 0;
        return ctns * unitCtn * unitPrice;
    };

    const calculateImportTotal = (products) => {
        return products.reduce((total, product) => total + calculateProductAmount(product), 0);
    };

    const calculateImportCBM = (products) => {
        return products.reduce((total, product) => {
            // Priorizar cbmTotal se existir, senão calcular cbm * ctns
            const cbmTotal = product.cbmTotal || (product.cbm || 0) * (product.ctns || 0);
            return total + cbmTotal;
        }, 0);
    };

    if (loading) {
        return (
            <Container fluid className="py-4">
                <div className="text-center p-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Carregando...</span>
                    </div>
                    <p className="mt-2 text-primary">Carregando produtos selecionados...</p>
                </div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container fluid className="py-4">
                <Alert variant="danger">
                    <Alert.Heading>Erro!</Alert.Heading>
                    <p>{error}</p>
                    <Button variant="outline-danger" onClick={loadData}>
                        Tentar Novamente
                    </Button>
                </Alert>
            </Container>
        );
    }

    if (filteredFactoryData.length === 0) {
        return (
            <Container fluid className="py-4">
                <div className="text-center p-5">
                    <div className="mb-3">
                        <span className="material-icons" style={{fontSize: '4rem', color: '#6c757d'}}>shopping_cart</span>
                    </div>
                    <h4>{factoryData.length === 0 ? 'Nenhum produto selecionado' : 'Nenhum resultado encontrado'}</h4>
                    <p className="text-muted">
                        {factoryData.length === 0 
                            ? 'Não há produtos marcados para pedido no momento'
                            : 'Nenhum produto corresponde aos filtros aplicados. Tente ajustar os critérios de busca.'
                        }
                    </p>
                    <Button variant="primary" onClick={loadData}>
                        <span className="material-icons me-1" style={{fontSize: '18px'}}>refresh</span>
                        Atualizar
                    </Button>
                </div>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4">
            {/* Cabeçalho */}
            <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h2 className="mb-1">
                            <span className="material-icons me-2" style={{fontSize: '28px', verticalAlign: 'middle'}}>shopping_cart</span>
                            Produtos Selecionados para Pedido
                        </h2>
                        <p className="text-muted mb-0">
                            Resumo de todos os produtos marcados para pedido por fábrica e importação
                        </p>
                    </div>
                    <div className="d-flex gap-2">
                        <Button 
                            variant={sortByRecent ? "success" : "outline-primary"} 
                            onClick={() => {
                                console.log('🔄 Alterando ordenação por mais recentes:', !sortByRecent);
                                setSortByRecent(!sortByRecent);
                                // Limpar ordenação por Data Pedido quando ativar por Recentes
                                if (!sortByRecent && sortByDataPedido) {
                                    setSortByDataPedido(false);
                                    console.log('📅 Ordenação por Data Pedido desativada');
                                }
                            }} 
                            size="sm"
                            title={sortByRecent ? 'Desativar ordenação por mais recentes' : 'Ativar ordenação por mais recentes'}
                        >
                            <span className="material-icons me-1" style={{fontSize: '16px'}}>
                                {sortByRecent ? 'schedule' : 'schedule'}
                            </span>
                            {sortByRecent ? 'Mais Recentes ✓' : 'Ordenar'}
                        </Button>
                        <Button 
                            variant={sortByDataPedido ? "success" : "outline-primary"} 
                            onClick={() => {
                                console.log('🔄 Alterando ordenação por Data Pedido:', !sortByDataPedido);
                                setSortByDataPedido(!sortByDataPedido);
                                // Limpar ordenação por Recentes quando ativar por Data Pedido
                                if (!sortByDataPedido && sortByRecent) {
                                    setSortByRecent(false);
                                    console.log('⏰ Ordenação por mais recentes desativada');
                                }
                            }} 
                            size="sm"
                            title={sortByDataPedido ? 'Desativar ordenação por Data Pedido' : 'Ativar ordenação por Data Pedido'}
                        >
                            <span className="material-icons me-1" style={{fontSize: '16px'}}>
                                {sortByDataPedido ? 'event' : 'event'}
                            </span>
                            {sortByDataPedido ? 'Por Data Pedido ✓' : 'Por Data Pedido'}
                        </Button>
                        <Button variant="outline-primary" onClick={loadData} size="sm">
                            <span className="material-icons me-1" style={{fontSize: '16px'}}>refresh</span>
                            Atualizar
                        </Button>
                        
                        {/* Indicadores de ordenação ativa */}
                        {(sortByRecent || sortByDataPedido) && (
                            <div className="d-flex align-items-center ms-2">
                                <span className="small text-muted me-1">Ordenação:</span>
                                {sortByRecent && (
                                    <span className="badge bg-success me-1" style={{fontSize: '0.7rem'}}>
                                        📅 Mais Recentes
                                    </span>
                                )}
                                {sortByDataPedido && (
                                    <span className="badge bg-info me-1" style={{fontSize: '0.7rem'}}>
                                        📆 Por Data Pedido
                                    </span>
                                )}
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={clearSorting}
                                    style={{ fontSize: '0.6rem', padding: '0.2rem 0.4rem', height: 'auto' }}
                                    title="Limpar ordenação"
                                >
                                    <span className="material-icons" style={{fontSize: '10px'}}>close</span>
                                </Button>
                            </div>
                        )}
                        <Button 
                            variant="success" 
                            size="sm"
                            onClick={handleExportAll}
                            disabled={exporting || filteredFactoryData.length === 0}
                        >
                            <span className="material-icons me-1" style={{fontSize: '16px'}}>
                                {exporting ? 'hourglass_empty' : 'file_download'}
                            </span>
                            {exporting ? 'Exportando...' : 'Exportar Todos'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Seção de Filtros */}
            <Card className="mb-4 shadow-sm" style={{ borderRadius: '12px' }}>
                <Card.Header 
                    style={{ 
                        backgroundColor: '#6c757d',
                        color: 'white',
                        borderRadius: '12px 12px 0 0'
                    }}
                >
                    <h6 className="mb-0 fw-bold">
                        <span className="material-icons me-2" style={{fontSize: '18px'}}>filter_list</span>
                        Filtros e Busca
                    </h6>
                </Card.Header>
                <Card.Body className="p-3">
                    <Row className="g-3">
                        {/* Filtro Data Pedido */}
                        <Col xs={12} md={3}>
                            <div className="d-flex align-items-center gap-2">
                                <label className="form-label mb-0 fw-bold" style={{ fontSize: '0.9rem', minWidth: '100px' }}>
                                    Data Pedido:
                                </label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Pesquisar data..."
                                    value={filters.dataPedido}
                                    onChange={(e) => setFilters(prev => ({ ...prev, dataPedido: e.target.value }))}
                                    style={{ fontSize: '0.85rem' }}
                                />
                            </div>
                        </Col>
                        
                        {/* Filtro Lote Pedido */}
                        <Col xs={12} md={3}>
                            <div className="d-flex align-items-center gap-2">
                                <label className="form-label mb-0 fw-bold" style={{ fontSize: '0.9rem', minWidth: '100px' }}>
                                    Lote Pedido:
                                </label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Pesquisar lote..."
                                    value={filters.lotePedido}
                                    onChange={(e) => setFilters(prev => ({ ...prev, lotePedido: e.target.value }))}
                                    style={{ fontSize: '0.85rem' }}
                                />
                            </div>
                        </Col>
                        
                        {/* Busca Geral */}
                        <Col xs={12} md={4}>
                            <div className="d-flex align-items-center gap-2">
                                <label className="form-label mb-0 fw-bold" style={{ fontSize: '0.9rem', minWidth: '100px' }}>
                                    Busca Geral:
                                </label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Buscar qualquer dado..."
                                    value={filters.buscaGeral}
                                    onChange={(e) => setFilters(prev => ({ ...prev, buscaGeral: e.target.value }))}
                                    style={{ fontSize: '0.85rem' }}
                                />
                            </div>
                        </Col>
                        
                        {/* Botão Limpar Filtros */}
                        <Col xs={12} md={2}>
                            <div className="d-flex justify-content-end">
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={clearFilters}
                                    disabled={!filters.dataPedido && !filters.lotePedido && !filters.buscaGeral}
                                    style={{ fontSize: '0.8rem' }}
                                >
                                    <span className="material-icons me-1" style={{fontSize: '14px'}}>clear</span>
                                    Limpar
                                </Button>
                            </div>
                        </Col>
                    </Row>
                    
                    {/* Toggle de Detecção de Duplicatas */}
                    <Row className="mt-3">
                        <Col xs={12}>
                            <div className="d-flex align-items-center justify-content-center">
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={duplicateDetectionEnabled}
                                            onChange={(e) => setDuplicateDetectionEnabled(e.target.checked)}
                                            color="warning"
                                        />
                                    }
                                    label={
                                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                                            <span className="material-icons me-1" style={{fontSize: '16px', verticalAlign: 'middle'}}>
                                                {duplicateDetectionEnabled ? 'visibility' : 'visibility_off'}
                                            </span>
                                            Detecção de Referências Duplicadas
                                        </span>
                                    }
                                />
                                {!duplicateDetectionEnabled && (
                                    <span className="ms-3 small text-muted">
                                        <span className="material-icons me-1" style={{fontSize: '14px'}}>info</span>
                                        Alertas de duplicação estão desabilitados
                                    </span>
                                )}
                            </div>
                        </Col>
                    </Row>

                    
                    {/* Indicador de Resultados */}
                    {filteredFactoryData.length !== factoryData.length && (
                        <div className="mt-2">
                            <small className="text-muted">
                                <span className="material-icons me-1" style={{fontSize: '16px'}}>info</span>
                                Exibindo {filteredFactoryData.length} de {factoryData.length} fábricas com filtros aplicados
                            </small>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Alert Global de Referências Duplicadas entre Fábricas */}
            {duplicateDetectionEnabled && (() => {
                const globalDuplicates = detectGlobalDuplicateReferences();
                
                if (globalDuplicates.length > 0) {
                    return (
                        <Alert variant="danger" className="mb-4" style={{ borderRadius: '12px' }}>
                            <Alert.Heading className="d-flex align-items-center">
                                <span className="material-icons me-2" style={{fontSize: '24px'}}>warning</span>
                                Referências Duplicadas Entre Fábricas
                            </Alert.Heading>
                            <p className="mb-3">
                                <strong>Atenção!</strong> Foram encontradas referências de produtos duplicadas em diferentes fábricas:
                            </p>
                            {globalDuplicates.map((duplicate, index) => (
                                <div key={index} className="mb-3 p-3" style={{ backgroundColor: '#f8d7da', borderRadius: '8px', border: '1px solid #f5c6cb' }}>
                                    <div className="fw-bold text-danger mb-2">
                                        <span className="material-icons me-1" style={{fontSize: '18px'}}>label</span>
                                        REF: {duplicate.reference}
                                    </div>
                                    <div className="text-muted mb-2">
                                        Aparece em {duplicate.occurrences.length} fábrica(s):
                                    </div>
                                    {duplicate.occurrences.map((occurrence, occIndex) => (
                                        <div key={occIndex} className="ms-3 mb-1">
                                            <span className="badge bg-secondary me-2">{occurrence.factoryName}</span>
                                            <span className="text-muted">
                                                {occurrence.importName} 
                                                {occurrence.dataPedido && ` - Data: ${formatBrazilianDate(occurrence.dataPedido)}`}
                                                {occurrence.lotePedido && ` - Lote: ${occurrence.lotePedido}`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                            <div className="mt-3">
                                <small className="text-muted">
                                    <span className="material-icons me-1" style={{fontSize: '16px'}}>info</span>
                                    Verifique se essas duplicatas são intencionais ou se há algum erro nos dados.
                                </small>
                            </div>
                        </Alert>
                    );
                }
                return null;
            })()}

            {/* Cards das Fábricas */}
            <Row className="g-4">
                {filteredFactoryData.map((factoryDataItem, factoryIndex) => {
                    // Detectar referências duplicadas para esta fábrica
                    const duplicateReferences = detectDuplicateReferences(factoryDataItem);
                    
                    // Verificar se a fábrica foi marcada como exportada pelo usuário
                    const isFactoryMarkedAsExported = markedExportedFactories.has(factoryDataItem.factory.id);
                    
                    // Verificar se TODAS as cotações desta fábrica estão exportadas
                    const allQuotesExported = factoryDataItem.imports.every(importData => 
                        importData.selectedProducts.every(product => product.exported === true)
                    );
                    
                    // Verificar se há pelo menos uma cotação ativa (não exportada)
                    const hasActiveQuotes = factoryDataItem.imports.some(importData => 
                        importData.selectedProducts.some(product => product.exported !== true)
                    );
                    
                    // Aplicar transparência apenas se TODAS as cotações estão exportadas
                    const shouldApplyTransparency = allQuotesExported && !hasActiveQuotes;
                    
                    console.log(`🏭 Fábrica ${factoryDataItem.factory.name || factoryDataItem.factory.nomeFabrica}:`, {
                        allQuotesExported,
                        hasActiveQuotes,
                        shouldApplyTransparency,
                        totalImports: factoryDataItem.imports.length
                    });
                    
                    
                    return (
                    <Col key={factoryDataItem.factory.id} xs={12}>
                            {/* Alert de Referências Duplicadas */}
                            {duplicateDetectionEnabled && duplicateReferences.length > 0 && (
                                <Alert variant="warning" className="mb-3" style={{ borderRadius: '8px' }}                                >
                                    <Alert.Heading className="d-flex align-items-center">
                                        <span className="material-icons me-2" style={{fontSize: '20px'}}>warning</span>
                                        Referências Duplicadas Encontradas
                                    </Alert.Heading>
                                    <p className="mb-2">
                                        A fábrica <strong>{factoryDataItem.factory.name || factoryDataItem.factory.nomeFabrica}</strong> possui produtos 
                                        com referências duplicadas em diferentes importações:
                                    </p>
                                    {duplicateReferences.map((duplicate, index) => (
                                        <div key={index} className="mb-2 p-2 rounded" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
                                            <div className="fw-bold text-danger mb-1">
                                                <span className="material-icons me-1" style={{fontSize: '16px'}}>content_copy</span>
                                                {duplicate.reference}
                                            </div>
                                            <div className="small text-muted">
                                                Encontrada em {duplicate.occurrences.length} importação(ões):
                                                <ul className="mb-0 mt-1">
                                                    {duplicate.occurrences.map((occ, occIndex) => {
                                                        const replacementKey = `${factoryDataItem.factory.id}-${occ.importId}`;
                                                        const isReplacement = replacementImports[replacementKey];
                                                        return (
                                                            <li key={occIndex} className={isReplacement ? 'text-success' : ''}>
                                                                {occ.importName} {occ.dataPedido && `(Data: ${occ.dataPedido})`} {occ.lotePedido && `(Lote: ${occ.lotePedido})`}
                                                                {isReplacement && (
                                                                    <span className="ms-2 badge bg-success">REPOSIÇÃO</span>
                                                                )}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        </div>
                                    ))}
                                </Alert>
                            )}
                        <Card className="shadow-sm mb-4" style={{ 
                            borderRadius: '12px',
                            opacity: shouldApplyTransparency ? 0.3 : 1.0,
                            transition: 'opacity 0.3s ease'
                        }}>
                            <Card.Header 
                                style={{ 
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    borderRadius: '12px 12px 0 0',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s ease'
                                }}
                                onClick={() => toggleFactoryExpansion(factoryDataItem.factory.id)}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
                            >
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center">
                                        <h5 className="mb-1 fw-bold me-3">
                                            <span className="material-icons me-2" style={{fontSize: '20px'}}>factory</span>
                                            {factoryDataItem.factory.name || factoryDataItem.factory.nomeFabrica}
                                        </h5>
                                    </div>
                                    <div className="text-start">
                                        <small className="opacity-75">
                                            {factoryDataItem.factory.localizacao} • {factoryDataItem.factory.segmento}
                                        </small>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <Badge 
                                            bg="light" 
                                            text="dark" 
                                            className="px-3 py-2"
                                            style={{ fontSize: '0.9rem', fontWeight: '600' }}
                                        >
                                            {factoryDataItem.totalSelectedProducts} produtos selecionados
                                        </Badge>
                                        
                                        {/* Badge de status exportado */}
                                        {markedExportedFactories.has(factoryDataItem.factory.id) && (
                                            <Badge 
                                                bg="success" 
                                                className="px-3 py-2 ms-2"
                                                style={{ fontSize: '0.8rem', fontWeight: 'bold' }}
                                            >
                                                <span className="material-icons me-1" style={{fontSize: '14px'}}>download_done</span>
                                                EXPORTADA
                                            </Badge>
                                        )}
                                        
                                        {/* Botão para marcar fábrica como exportada */}
                                        <Button
                                            variant={markedExportedFactories.has(factoryDataItem.factory.id) ? "success" : "outline-light"}
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log('🔄 Botão clicado para fábrica:', factoryDataItem.factory.name || factoryDataItem.factory.nomeFabrica);
                                                toggleFactoryExportStatus(factoryDataItem);
                                            }}
                                            style={{ 
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                borderWidth: '2px',
                                                minWidth: '140px',
                                                color: 'white'
                                            }}
                                            disabled={loading}
                                        >
                                            <span className="material-icons me-1" style={{fontSize: '14px'}}>
                                                {markedExportedFactories.has(factoryDataItem.factory.id) 
                                                    ? 'download_done' 
                                                    : 'download'
                                                }
                                            </span>
                                            {markedExportedFactories.has(factoryDataItem.factory.id) 
                                                ? '✅ Exportada' 
                                                : 'Marcar Exportada'
                                            }
                                        </Button>
                                        <Button 
                                            variant="success" 
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleExportFactory(factoryDataItem);
                                            }}
                                            disabled={exportingFactory === factoryDataItem.factory.id}
                                            style={{ 
                                                fontSize: '0.8rem',
                                                backgroundColor: '#28a745',
                                                borderColor: '#28a745',
                                                color: 'white'
                                            }}
                                        >
                                            <span className="material-icons me-1" style={{fontSize: '14px', color: 'white'}}>
                                                {exportingFactory === factoryDataItem.factory.id ? 'hourglass_empty' : 'file_download'}
                                            </span>
                                            {exportingFactory === factoryDataItem.factory.id ? 'Exportando...' : 'Exportar'}
                                        </Button>
                                        <span 
                                            className="material-icons ml-2" 
                                            style={{fontSize: '20px', cursor: 'pointer'}}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFactoryExpansion(factoryDataItem.factory.id);
                                            }}
                                        >
                                            {expandedFactories[factoryDataItem.factory.id] ? 'expand_less' : 'expand_more'}
                                        </span>
                                    </div>
                                </div>
                            </Card.Header>
                            
                            <Card.Body className="p-4">
                                {!expandedFactories[factoryDataItem.factory.id] ? (
                                    /* Modo Recolhido - Informações Resumidas da Fábrica */
                                    <div>
                                        {(() => {
                                            const factorySummary = calculateFactorySummary(factoryDataItem);
                                            return (
                                                <>
                                                <Row className="g-2">
                                                    <Col xs={3}>
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ backgroundColor: '#e9ecef' }}>
                                                            <span className="fw-bold" style={{ fontSize: '0.8rem', color: 'black' }}>
                                                                Valor Total:
                                                            </span>
                                                            <span className="fw-bold" style={{ fontSize: '0.9rem', color: 'black' }}>
                                                                {formatCurrency(factorySummary.totalAmount)}
                                                            </span>
                                                        </div>
                                                    </Col>
                                                    <Col xs={3}>
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ backgroundColor: '#e9ecef' }}>
                                                            <span className="fw-bold" style={{ fontSize: '0.8rem', color: 'black' }}>
                                                                CBM Total:
                                                            </span>
                                                            <span className="fw-bold" style={{ fontSize: '0.9rem', color: 'black' }}>
                                                                {formatNumber(factorySummary.totalCBM, 3)} m³
                                                            </span>
                                                        </div>
                                                    </Col>
                                                    <Col xs={3}>
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ backgroundColor: '#e9ecef' }}>
                                                            <span className="fw-bold" style={{ fontSize: '0.8rem', color: 'black' }}>
                                                                Produtos:
                                                            </span>
                                                            <span className="fw-bold" style={{ fontSize: '0.9rem', color: 'black' }}>
                                                                {factorySummary.totalProducts}
                                                            </span>
                                                        </div>
                                                    </Col>
                                                    <Col xs={3}>
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ backgroundColor: '#e9ecef' }}>
                                                            <span className="fw-bold" style={{ fontSize: '0.8rem', color: 'black' }}>
                                                                Importações:
                                                            </span>
                                                            <span className="fw-bold" style={{ fontSize: '0.9rem', color: 'black' }}>
                                                                {factorySummary.importCount}
                                                            </span>
                                                        </div>
                                                    </Col>
                                                </Row>
                                                
                                                <Row className="g-2 mt-2">
                                                    <Col xs={6}>
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ backgroundColor: '#e9ecef' }}>
                                                            <span className="fw-bold" style={{ fontSize: '0.8rem', color: 'black' }}>
                                                                DATA PEDIDO:
                                                            </span>
                                                            <span className="fw-bold" style={{ fontSize: '0.9rem', color: 'black' }}>
                                                                {(function() {
                                                                    const imports = factoryDataItem.imports || [];
                                                                    const pedidoDates = imports.map(imp => formatBrazilianDate(imp.dataPedido)).filter(date => date !== 'Não informado');
                                                                    return pedidoDates.length > 0 ? pedidoDates.join(', ') : 'Não informado';
                                                                })()}
                                                            </span>
                                                        </div>
                                                    </Col>
                                                    <Col xs={6}>
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ backgroundColor: '#e9ecef' }}>
                                                            <span className="fw-bold" style={{ fontSize: '0.8rem', color: 'black' }}>
                                                                LOTE PEDIDO:
                                                            </span>
                                                            <span className="fw-bold" style={{ fontSize: '0.9rem', color: 'black' }}>
                                                                {(function() {
                                                                    const imports = factoryDataItem.imports || [];
                                                                    const loteList = imports.map(imp => imp.lotePedido).filter(Boolean);
                                                                    return loteList.length > 0 ? loteList.join(', ') : 'Não informado';
                                                                })()}
                                                            </span>
                                                        </div>
                                                    </Col>
                                                </Row>
                                                
                                                {/* Toggles de Reposição */}
                                                <Row className="g-2 mt-2">
                                                    <Col xs={12}>
                                                        <div className="p-2 rounded" style={{ backgroundColor: '#e9ecef' }}>
                                                            <div className="fw-bold mb-2" style={{ fontSize: '0.8rem', color: 'black' }}>
                                                                <span className="material-icons me-1" style={{fontSize: '16px'}}>refresh</span>
                                                                Marcar Importações como Reposição:
                                                            </div>
                                                            <div className="d-flex flex-wrap gap-3">
                                                                {factoryDataItem.imports.map((importData, idx) => {
                                                                    const replacementKey = `${factoryDataItem.factory.id}-${importData.id}`;
                                                                    const isReplacement = replacementImports[replacementKey];
                                                                    return (
                                                                        <div key={importData.id} className="d-flex align-items-center gap-2">
                                                                            <FormControlLabel
                                                                                control={
                                                                                    <Switch
                                                                                        checked={isReplacement || false}
                                                                                        onChange={(e) => updateReplacementStatus(factoryDataItem.factory.id, importData.id, e.target.checked)}
                                                                                        color="success"
                                                                                        size="small"
                                                                                    />
                                                                                }
                                                                                label={
                                                                                    <span style={{ fontSize: '0.75rem' }}>
                                                                                        {importData.importName || `Importação ${idx + 1}`}
                                                                                    </span>
                                                                                }
                                                                            />
                                                                            {isReplacement && (
                                                                                <Chip 
                                                                                    label="REPOSIÇÃO" 
                                                                                    color="success" 
                                                                                    variant="filled"
                                                                                    size="small"
                                                                                    style={{ fontSize: '0.6rem' }}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    /* Modo Expandido - Cards das Importações */
                                    <Row className="g-3">
                                        {factoryDataItem.imports.map((importData, importIndex) => {
                                            // Verificar se esta importação específica tem produtos exportados
                                            const hasExportedProducts = importData.selectedProducts.some(product => product.exported === true);
                                            
                                            return (
                                            <Col key={importData.id} xs={12} md={6} lg={4}>
                                                <Card 
                                                    className="h-100 shadow-sm"
                                                    style={{ 
                                                        borderRadius: '8px',
                                                        border: '1px solid #e9ecef',
                                                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                                                        opacity: hasExportedProducts ? 0.3 : 1.0,
                                                        transition: 'opacity 0.3s ease'
                                                    }}
                                            >
                                                <Card.Header 
                                                    className="py-3"
                                                    style={{ 
                                                        backgroundColor: '#6c757d',
                                                        color: 'white',
                                                        borderRadius: '8px 8px 0 0'
                                                    }}
                                                >
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div className="d-flex align-items-center">
                                                            <h6 className="mb-0 fw-bold me-2">
                                                                <span className="material-icons me-1" style={{fontSize: '16px'}}>inventory</span>
                                                                {importData.quoteName || importData.importName || `Importação #${importIndex + 1}`}
                                                            </h6>
                                                        </div>
                                                        <Badge 
                                                            bg="light" 
                                                            text="dark" 
                                                            style={{ fontSize: '0.75rem' }}
                                                        >
                                                            {importData.selectedProducts.length} produtos
                                                        </Badge>
                                                    </div>
                                                </Card.Header>
                                                
                                                <Card.Body className="p-3">
                                                    {/* Modo Recolhido - Informações Resumidas */}
                                                    {false ? (
                                                        <div>
                                                            {(() => {
                                                                const summary = calculateImportSummary(importData);
                                                                return (
                                                                    <>
                                                                    <Row className="g-2">
                                                                        <Col xs={4}>
                                                                                <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ backgroundColor: '#e9ecef' }}>
                                                                                <span className="fw-bold" style={{ fontSize: '0.8rem', color: 'black' }}>
                                                                                    Valor Total:
                                                                                </span>
                                                                                <span className="fw-bold" style={{ fontSize: '0.8rem', color: 'black' }}>
                                                                                    {formatCurrency(summary.totalAmount)}
                                                                                </span>
                                                                            </div>
                                                                        </Col>
                                                                        <Col xs={4}>
                                                                                <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ backgroundColor: '#e9ecef' }}>
                                                                                <span className="fw-bold" style={{ fontSize: '0.8rem', color: 'black' }}>
                                                                                    CBM Total:
                                                                                </span>
                                                                                <span className="fw-bold" style={{ fontSize: '0.8rem', color: 'black' }}>
                                                                                    {formatNumber(summary.totalCBM, 3)} m³
                                                                                </span>
                                                                            </div>
                                                                        </Col>
                                                                        <Col xs={4}>
                                                                                <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ backgroundColor: '#e9ecef' }}>
                                                                                <span className="fw-bold" style={{ fontSize: '0.8rem', color: 'black' }}>
                                                                                    Produtos:
                                                                                </span>
                                                                                <span className="fw-bold" style={{ fontSize: '0.8rem', color: 'black' }}>
                                                                                    {summary.productCount}
                                                                                </span>
                                                                            </div>
                                                                        </Col>
                                                                    </Row>
                                                                        
                                                                        <Row className="g-2 mt-1">
                                                                            <Col xs={6}>
                                                                                <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ backgroundColor: '#e9ecef' }}>
                                                                                    <span className="fw-bold" style={{ fontSize: '0.8rem', color: 'black' }}>
                                                                                        DATA PEDIDO:
                                                                                    </span>
                                                                                    <span className="fw-bold" style={{ fontSize: '0.8rem', color: 'black' }}>
                                                                                        {formatBrazilianDate(importData.dataPedido)}
                                                                                    </span>
                                                                                </div>
                                                                            </Col>
                                                                            <Col xs={6}>
                                                                                <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ backgroundColor: '#e9ecef' }}>
                                                                                    <span className="fw-bold" style={{ fontSize: '0.8rem', color: 'black' }}>
                                                                                        LOTE PEDIDO:
                                                                                    </span>
                                                                                    <span className="fw-bold" style={{ fontSize: '0.8rem', color: 'black' }}>
                                                                                        {importData.lotePedido || 'Não informado'}
                                                                                    </span>
                                                                                </div>
                                                                            </Col>
                                                                        </Row>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    ) : (
                                                        /* Modo Expandido - Informações Completas */
                                                        <div>
                                                            {/* Resumo da Importação */}
                                                            <div className="mb-3">
                                                                <Row className="g-2">
                                                                    <Col xs={6}>
                                                                        <div className="text-center p-2 rounded" style={{ backgroundColor: '#e9ecef' }}>
                                                                            <div className="fw-bold" style={{ fontSize: '0.9rem', color: 'black' }}>
                                                                                Valor Total
                                                                            </div>
                                                                            <div className="fw-bold" style={{ fontSize: '1rem', color: 'black' }}>
                                                                                {formatCurrency(calculateImportTotal(importData.selectedProducts))}
                                                                            </div>
                                                                        </div>
                                                                    </Col>
                                                                    <Col xs={6}>
                                                                        <div className="text-center p-2 rounded" style={{ backgroundColor: '#e9ecef' }}>
                                                                            <div className="fw-bold" style={{ fontSize: '0.9rem', color: 'black' }}>
                                                                                CBM Total
                                                                            </div>
                                                                            <div className="fw-bold" style={{ fontSize: '1rem', color: 'black' }}>
                                                                                {formatNumber(calculateImportCBM(importData.selectedProducts), 3)} m³
                                                                            </div>
                                                                        </div>
                                                                    </Col>
                                                                </Row>
                                                            </div>
                                                            
                                                            {/* Campos DATA PEDIDO e LOTE PEDIDO */}
                                                            <div className="mb-3">
                                                                <Row className="g-2">
                                                                    <Col xs={6}>
                                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ backgroundColor: '#e9ecef' }}>
                                                                            <span className="fw-bold" style={{ fontSize: '0.8rem', color: 'black' }}>
                                                                                DATA PEDIDO:
                                                                            </span>
                                                                            <span className="fw-bold" style={{ fontSize: '0.9rem', color: 'black' }}>
                                                                                {formatBrazilianDate(importData.dataPedido)}
                                                                            </span>
                                                                        </div>
                                                                    </Col>
                                                                    <Col xs={6}>
                                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ backgroundColor: '#e9ecef' }}>
                                                                            <span className="fw-bold" style={{ fontSize: '0.8rem', color: 'black' }}>
                                                                                LOTE PEDIDO:
                                                                            </span>
                                                                            <span className="fw-bold" style={{ fontSize: '0.9rem', color: 'black' }}>
                                                                                {importData.lotePedido || 'Não informado'}
                                                                            </span>
                                                                        </div>
                                                                    </Col>
                                                                </Row>
                                                            </div>

                                                            {/* Lista de Produtos */}
                                                            <div>
                                                        <Typography variant="subtitle2" className="mb-2 fw-bold" style={{ color: 'black' }}>
                                                            Produtos Selecionados:
                                                        </Typography>
                                                        <div className="d-flex flex-column gap-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                            {importData.selectedProducts.map((product, productIndex) => (
                                                                <div 
                                                                    key={product.id}
                                                                    className="p-2 rounded border"
                                                                    style={{ 
                                                                        backgroundColor: '#f8f9fa',
                                                                        border: '1px solid #e9ecef'
                                                                    }}
                                                                >
                                                                    <div className="d-flex justify-content-between align-items-start">
                                                                        <div className="flex-grow-1">
                                                                            <div className="fw-bold" style={{ fontSize: '0.85rem', color: 'black' }}>
                                                                                REF: {product.ref || 'N/A'}
                                                                            </div>
                                                                            <div style={{ fontSize: '0.75rem', color: 'black' }}>
                                                                                {product.description || 'Sem descrição'}
                                                                            </div>
                                                                            <div className="d-flex gap-2 mt-1">
                                                                                <Chip 
                                                                                    label={`CTNS: ${product.ctns || 0}`} 
                                                                                    size="small" 
                                                                                    color="primary" 
                                                                                    variant="outlined"
                                                                                    style={{ fontSize: '0.7rem' }}
                                                                                />
                                                                                <Chip 
                                                                                    label={`QTY: ${formatNumber((product.ctns || 0) * (product.unitCtn || 1), 0)}`} 
                                                                                    size="small" 
                                                                                    color="secondary" 
                                                                                    variant="outlined"
                                                                                    style={{ fontSize: '0.7rem' }}
                                                                                />
                                                                                <Chip 
                                                                                    label={`CBM: ${formatNumber(product.cbmTotal || (product.cbm || 0) * (product.ctns || 0), 3)}`} 
                                                                                    size="small" 
                                                                                    color="info" 
                                                                                    variant="outlined"
                                                                                    style={{ fontSize: '0.7rem' }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-end">
                                                                            <div className="fw-bold" style={{ fontSize: '0.8rem', color: 'black' }}>
                                                                                {formatCurrency(calculateProductAmount(product))}
                                                                            </div>
                                                                            <div style={{ fontSize: '0.7rem', color: 'black' }}>
                                                                                {formatCurrency(product.unitPrice)}/un
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        
                                                        {/* Seção de Comentários */}
                                                        <div className="mt-3">
                                                            <Typography variant="subtitle2" className="mb-2 fw-bold" style={{ color: 'black' }}>
                                                                <span className="material-icons me-1" style={{fontSize: '16px'}}>comment</span>
                                                                Comentários da Importação:
                                                            </Typography>
                                                            
                                                            {/* Lista de comentários existentes */}
                                                            <div className="mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                                {(() => {
                                                                    const commentKey = `${factoryDataItem.factory.id}-${importData.id}`;
                                                                    const comments = importComments[commentKey] || [];
                                                                    return comments.length > 0 ? (
                                                                        comments.map((comment, commentIndex) => (
                                                                            <div 
                                                                                key={comment.id || commentIndex}
                                                                                className="p-2 mb-2 rounded border"
                                                                                style={{ 
                                                                                    backgroundColor: '#f8f9fa',
                                                                                    border: '1px solid #e9ecef'
                                                                                }}
                                                                            >
                                                                                <div className="d-flex justify-content-between align-items-start">
                                                                                    <div className="flex-grow-1">
                                                                                        <div className="fw-bold" style={{ fontSize: '0.8rem', color: '#495057' }}>
                                                                                            {comment.userName || currentUser?.displayName || currentUser?.email || 'Usuário'}
                                                                                        </div>
                                                                                        <div style={{ fontSize: '0.9rem', color: 'black' }}>
                                                                                            {comment.comment}
                                                                                        </div>
                                                                                        {comment.imageUrl && (
                                                                                            <div className="mt-2">
                                                                                                <img 
                                                                                                    src={comment.imageUrl} 
                                                                                                    alt="Imagem do comentário"
                                                                                                    style={{ 
                                                                                                        maxWidth: '200px', 
                                                                                                        maxHeight: '200px',
                                                                                                        borderRadius: '8px',
                                                                                                        border: '1px solid #e9ecef',
                                                                                                        cursor: 'pointer',
                                                                                                        transition: 'transform 0.2s ease'
                                                                                                    }}
                                                                                                    onClick={() => handleImageClick(comment.imageUrl, `Imagem do comentário de ${comment.userName}`)}
                                                                                                    onMouseEnter={(e) => {
                                                                                                        e.target.style.transform = 'scale(1.05)';
                                                                                                        e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                                                                                    }}
                                                                                                    onMouseLeave={(e) => {
                                                                                                        e.target.style.transform = 'scale(1)';
                                                                                                        e.target.style.boxShadow = 'none';
                                                                                                    }}
                                                                />
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                                                        {formatDateTime(comment.createdAt?.toDate ? comment.createdAt.toDate() : comment.createdAt)}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="text-muted text-center p-3" style={{ fontSize: '0.9rem' }}>
                                                                            Nenhum comentário ainda
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                            
                                                            {/* Campo para adicionar novo comentário */}
                                                            {commentingImport === `${factoryDataItem.factory.id}-${importData.id}` ? (
                                                                <div className="p-3 rounded border" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                                                    <Form.Group className="mb-3">
                                                                        <Form.Label className="fw-bold" style={{ fontSize: '0.9rem' }}>
                                                                            Adicionar Comentário:
                                                                        </Form.Label>
                                                                        <Form.Control
                                                                            as="textarea"
                                                                            rows={3}
                                                                            value={newComment}
                                                                            onChange={(e) => setNewComment(e.target.value)}
                                                                            placeholder="Digite seu comentário aqui..."
                                                                            style={{ fontSize: '0.9rem' }}
                                                                        />
                                                                    </Form.Group>
                                                                    
                                                                    {/* Upload de Imagem */}
                                                                    <Form.Group className="mb-3">
                                                                        <Form.Label className="fw-bold" style={{ fontSize: '0.9rem' }}>
                                                                            Anexar Imagem (opcional):
                                                                        </Form.Label>
                                                                        <div className="d-flex align-items-center gap-2">
                                                                            <input
                                                                                type="file"
                                                                                id="comment-image-upload"
                                                                                accept="image/*"
                                                                                onChange={handleImageUpload}
                                                                                style={{ display: 'none' }}
                                                                            />
                                                                            <Button
                                                                                variant="outline-secondary"
                                                                                size="sm"
                                                                                onClick={() => document.getElementById('comment-image-upload').click()}
                                                                            >
                                                                                <CloudUpload style={{ fontSize: '16px', marginRight: '4px' }} />
                                                                                Escolher Imagem
                                                                            </Button>
                                                                            {commentImage && (
                                                                                <div className="d-flex align-items-center gap-2">
                                                                                    <ImageIcon style={{ fontSize: '16px', color: '#28a745' }} />
                                                                                    <span style={{ fontSize: '0.8rem', color: '#28a745' }}>
                                                                                        {commentImage.name}
                                                                                    </span>
                                                                                    <IconButton
                                                                                        size="small"
                                                                                        onClick={handleRemoveImage}
                                                                                        style={{ padding: '2px' }}
                                                                                    >
                                                                                        <Delete style={{ fontSize: '14px', color: '#dc3545' }} />
                                                                                    </IconButton>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </Form.Group>
                                                                    
                                                                    <div className="d-flex gap-2">
                                                                        <Button 
                                                                            variant="success" 
                                                                            size="sm"
                                                                            onClick={() => handleAddComment(factoryDataItem.factory.id, importData.id)}
                                                                            disabled={(!newComment.trim() && !commentImage) || uploadingImage}
                                                                        >
                                                                            {uploadingImage ? (
                                                                                <>
                                                                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                                                    Enviando...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <span className="material-icons me-1" style={{fontSize: '14px'}}>add</span>
                                                                                    Adicionar
                                                                                </>
                                                                            )}
                                                                        </Button>
                                                                        <Button 
                                                                            variant="secondary" 
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                setCommentingImport(null);
                                                                                setNewComment('');
                                                                                setCommentImage(null);
                                                                                handleRemoveImage();
                                                                            }}
                                                                        >
                                                                            <span className="material-icons me-1" style={{fontSize: '14px'}}>close</span>
                                                                            Cancelar
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <Button 
                                                                    variant="outline-primary" 
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setCommentingImport(`${factoryDataItem.factory.id}-${importData.id}`);
                                                                        loadImportComments(factoryDataItem.factory.id, importData.id);
                                                                    }}
                                                                >
                                                                    <span className="material-icons me-1" style={{fontSize: '14px'}}>add_comment</span>
                                                                    Adicionar Comentário
                                                                </Button>
                                                            )}
                                                        </div>
                                                        </div>
                                                        </div>                                                )}
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                            );
                                        })}
                                        </Row>
                                    )}
                            </Card.Body>
                        </Card>
                    </Col>
                    );
                })}
            </Row>


            {/* Resumo Geral */}
            <Card className="mt-4 shadow-sm" style={{ borderRadius: '12px' }}>
                <Card.Header 
                    style={{ 
                        background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
                        color: 'white',
                        borderRadius: '12px 12px 0 0'
                    }}
                >
                    <h5 className="mb-0 fw-bold">
                        <span className="material-icons me-2" style={{fontSize: '20px'}}>summarize</span>
                        Resumo Geral
                    </h5>
                </Card.Header>
                <Card.Body className="p-4">
                    <Row className="g-3">
                        <Col xs={12} md={3}>
                            <div className="text-center p-3 rounded" style={{ backgroundColor: '#e9ecef' }}>
                                <div className="fw-bold text-primary" style={{ fontSize: '1.2rem' }}>
                                    {filteredFactoryData.length}
                                </div>
                                <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                                    Fábricas com Produtos Selecionados
                                </div>
                            </div>
                        </Col>
                        <Col xs={12} md={3}>
                            <div className="text-center p-3 rounded" style={{ backgroundColor: '#e9ecef' }}>
                                <div className="fw-bold text-success" style={{ fontSize: '1.2rem' }}>
                                    {filteredFactoryData.reduce((total, factory) => total + factory.totalSelectedProducts, 0)}
                                </div>
                                <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                                    Total de Produtos Selecionados
                                </div>
                            </div>
                        </Col>
                        <Col xs={12} md={3}>
                            <div className="text-center p-3 rounded" style={{ backgroundColor: '#e9ecef' }}>
                                <div className="fw-bold text-warning" style={{ fontSize: '1.2rem' }}>
                                    {filteredFactoryData.reduce((total, factory) => total + factory.imports.length, 0)}
                                </div>
                                <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                                    Total de Importações
                                </div>
                            </div>
                        </Col>
                        <Col xs={12} md={3}>
                            <div className="text-center p-3 rounded" style={{ backgroundColor: '#e9ecef' }}>
                                <div className="fw-bold text-danger" style={{ fontSize: '1.2rem' }}>
                                    {formatCurrency(
                                        filteredFactoryData.reduce((total, factory) => 
                                            total + factory.imports.reduce((importTotal, importData) => 
                                                importTotal + calculateImportTotal(importData.selectedProducts), 0
                                            ), 0
                                        )
                                    )}
                                </div>
                                <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                                    Valor Total Geral
                                </div>
                            </div>
                        </Col>
                        
                        {/* Contador de Referências Duplicadas */}
                        {duplicateDetectionEnabled && (() => {
                            // Duplicatas dentro das fábricas
                            const factoryDuplicates = filteredFactoryData.reduce((total, factory) => {
                                const duplicates = detectDuplicateReferences(factory);
                                return total + duplicates.length;
                            }, 0);
                            
                            // Duplicatas globais entre fábricas
                            const globalDuplicates = detectGlobalDuplicateReferences();
                            const globalDuplicatesCount = globalDuplicates.length;
                            
                            const totalDuplicates = factoryDuplicates + globalDuplicatesCount;
                            
                            if (totalDuplicates > 0) {
                                return (
                                    <Col xs={12}>
                                        <div className="text-center p-3 rounded mb-3" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
                                            <div className="fw-bold text-warning d-flex align-items-center justify-content-center" style={{ fontSize: '1.1rem' }}>
                                                <span className="material-icons me-2" style={{fontSize: '20px'}}>warning</span>
                                                {totalDuplicates} referência(s) duplicada(s) encontrada(s)
                                            </div>
                                            <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                                                {factoryDuplicates > 0 && `${factoryDuplicates} dentro das fábricas`}
                                                {factoryDuplicates > 0 && globalDuplicatesCount > 0 && ' • '}
                                                {globalDuplicatesCount > 0 && `${globalDuplicatesCount} entre fábricas diferentes`}
                                            </div>
                                        </div>
                                    </Col>
                                );
                            }
                            return null;
                        })()}
                    </Row>
                </Card.Body>
            </Card>
            
            {/* Lightbox para visualizar imagens dos comentários */}
            <Lightbox
                isOpen={showLightbox}
                onClose={handleCloseLightbox}
                imageUrl={lightboxImageUrl}
                imageAlt={lightboxImageAlt}
            />
        </Container>
    );
};

export default SelectedProducts;

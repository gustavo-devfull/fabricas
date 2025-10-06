import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Modal } from 'react-bootstrap';
import { Box, Typography, TextField, IconButton, Tooltip, Fab } from '@mui/material';
import { Add, Edit, Delete, Save, Close, LocalShipping } from '@mui/icons-material';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

const ContainerManagement = () => {
    const [containers, setContainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    // Estados do formulário
    const [showForm, setShowForm] = useState(false);
    const [editingContainer, setEditingContainer] = useState(null);
    const [formData, setFormData] = useState({
        nome: '',
        numero: '',
        refContainer: '',
        capacidadeCBM: 0
    });
    const [saving, setSaving] = useState(false);
    
    // Estados para confirmação de exclusão
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [containerToDelete, setContainerToDelete] = useState(null);
    
    // Estados para cotações associadas
    const [quotesByContainer, setQuotesByContainer] = useState({});
    
    // Estados para modal de produtos da cotação
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [quoteProducts, setQuoteProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    
    // Estados para sistema de documentos
    const [containerDocuments, setContainerDocuments] = useState({});
    const [newDocument, setNewDocument] = useState('');
    const [documentImage, setDocumentImage] = useState(null);
    const [documentFile, setDocumentFile] = useState(null);
    const [uploadingDocumentImage, setUploadingDocumentImage] = useState(false);
    const [documentingContainer, setDocumentingContainer] = useState(null);
    const [showDocumentLightbox, setShowDocumentLightbox] = useState(false);
    const [lightboxImageUrl, setLightboxImageUrl] = useState('');
    const [lightboxImageAlt, setLightboxImageAlt] = useState('');

    // Estados para sistema de status
    const [statusFilter, setStatusFilter] = useState(''); // Filtro por status

    // Opções de status para os containers
    const statusOptions = [
        { value: '', label: 'Todos os Status' },
        { value: 'fabricacao', label: 'Fabricação' },
        { value: 'embarcado', label: 'Embarcado' },
        { value: 'em_liberacao', label: 'Em liberação' },
        { value: 'nacionalizado', label: 'Nacionalizado' }
    ];

    // Função para obter informações do status
    const getStatusInfo = (status) => {
        const statusMap = {
            'fabricacao': { label: 'Fabricação', color: '#ffffff', bgColor: '#808000' },
            'embarcado': { label: 'Embarcado', color: '#ffffff', bgColor: '#800000' },
            'em_liberacao': { label: 'Em liberação', color: '#ffffff', bgColor: '#800080' },
            'nacionalizado': { label: 'Nacionalizado', color: '#ffffff', bgColor: '#008000' }
        };
        
        return statusMap[status] || { label: 'Escolha o status', color: '#ff0000', bgColor: '#ffffff' };
    };

    // Função para obter cor do header baseada no status
    const getHeaderColor = (status) => {
        const statusMap = {
            'fabricacao': '#808000', // Verde oliva
            'embarcado': '#800000', // Vermelho escuro
            'em_liberacao': '#800080', // Roxo
            'nacionalizado': '#008000' // Verde
        };
        
        return statusMap[status] || '#3498db'; // Azul padrão
    };

    // Função para calcular o valor de um produto (mesma lógica da tela de produtos selecionados)
    const calculateProductAmount = (quote) => {
        const ctns = quote.ctns || 0;
        const unitCtn = quote.unitCtn || 1;
        const unitPrice = quote.unitPrice || 0;
        return ctns * unitCtn * unitPrice;
    };

    // Função para formatar números no padrão brasileiro (milhar com ponto, decimal com vírgula)
    const formatBrazilianNumber = (value, decimals = 2) => {
        if (value === null || value === undefined || isNaN(value)) return '0,00';
        
        const formatted = Number(value).toLocaleString('pt-BR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
        
        return formatted;
    };

    // Funções para sistema de documentos
    const compressImage = async (file, maxWidth = 600, quality = 0.7) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    };

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    // Função para adicionar documento no container
    const handleAddDocument = async (containerId) => {
        if (!newDocument.trim() && !documentImage && !documentFile) return;

        try {
            let imageUrl = null;
            let documentUrl = null;
            let documentType = null;
            let documentName = null;
            
            // Processar imagem se existir
            if (documentImage) {
                setUploadingDocumentImage(true);
                console.log('🔄 Comprimindo imagem...');
                
                // Comprimir imagem antes de converter para base64
                const compressedBlob = await compressImage(documentImage, 600, 0.7);
                console.log(`📊 Imagem comprimida: ${compressedBlob.size} bytes (original: ${documentImage.size} bytes)`);
                
                // Converter blob comprimido para base64
                const base64 = await fileToBase64(compressedBlob);
                imageUrl = base64;
                
                console.log('✅ Imagem comprimida e convertida para base64');
            }
            
            // Processar documento se existir
            if (documentFile) {
                console.log('🔄 Convertendo documento para base64...');
                
                // Para documentos, converter diretamente para base64
                const base64 = await fileToBase64(documentFile);
                documentUrl = base64;
                documentType = documentFile.type;
                documentName = documentFile.name;
                
                console.log(`✅ Documento ${documentName} convertido para base64`);
            }

            const documentData = {
                containerId,
                document: newDocument.trim(),
                userName: 'Usuário', // Você pode integrar com sistema de auth se necessário
                createdAt: serverTimestamp(),
                userId: 'unknown', // Você pode integrar com sistema de auth se necessário
                imageUrl: imageUrl,
                documentUrl: documentUrl,
                documentType: documentType,
                documentName: documentName
            };

            // Salvar no Firestore
            const docRef = await addDoc(collection(db, 'containerDocuments'), documentData);
            console.log('✅ Documento salvo com ID:', docRef.id);
            
            // Atualizar estado local com o ID real do documento
            setContainerDocuments(prev => ({
                ...prev,
                [containerId]: [
                    {
                        id: docRef.id, // ID real do Firestore
                        ...documentData,
                        createdAt: new Date() // Para exibição imediata
                    },
                    ...(prev[containerId] || [])
                ]
            }));
            
            // Recarregar documentos para garantir sincronização
            await loadAllContainerDocuments();

            setNewDocument('');
            setDocumentImage(null);
            setDocumentFile(null);
            setDocumentingContainer(null);
            setUploadingDocumentImage(false);
            console.log('✅ Documento adicionado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao adicionar documento:', error);
            setUploadingDocumentImage(false);
            
            if (error.message.includes('longer than 1048487 bytes')) {
                alert('A imagem é muito grande mesmo após compressão. Tente uma imagem menor ou com menor qualidade.');
            } else {
                alert('Erro ao salvar documento. Tente novamente.');
            }
        }
    };

    // Função para lidar com upload de imagem
    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validar tipo de arquivo (apenas imagens)
            const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            
            if (!allowedImageTypes.includes(file.type)) {
                alert('Por favor, selecione apenas arquivos de imagem (JPG, PNG, GIF, WEBP).');
                return;
            }
            
            // Validar tamanho (máximo 2MB antes da compressão)
            if (file.size > 2 * 1024 * 1024) {
                alert('A imagem deve ter no máximo 2MB. Será comprimida automaticamente.');
                return;
            }
            
            setDocumentImage(file);
            console.log('✅ Imagem selecionada:', file.name);
        }
    };

    // Função para lidar com upload de documento
    const handleDocumentUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Tipos de documento aceitos
            const allowedDocumentTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/zip',
                'application/x-zip-compressed'
            ];
            
            // Validar tipo de arquivo
            if (!allowedDocumentTypes.includes(file.type)) {
                alert('Tipo de documento não suportado. Aceitos: PDF, DOC, DOCX, XLS, XLSX, ZIP');
                return;
            }
            
            // Validar tamanho (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('O documento deve ter no máximo 5MB.');
                return;
            }
            
            setDocumentFile(file);
            console.log('✅ Documento selecionado:', file.name, 'Tipo:', file.type);
        }
    };

    // Função para remover imagem selecionada
    const handleRemoveImage = () => {
        setDocumentImage(null);
        // Limpar o input file
        const fileInput = document.getElementById('image-upload');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    // Função para remover documento selecionado
    const handleRemoveDocument = () => {
        setDocumentFile(null);
        // Limpar o input file
        const fileInput = document.getElementById('document-upload');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    // Função para obter ícone baseado no tipo de arquivo
    const getFileIcon = (fileType) => {
        if (!fileType) return 'description';
        
        if (fileType.startsWith('image/')) {
            return 'image';
        } else if (fileType.includes('pdf')) {
            return 'picture_as_pdf';
        } else if (fileType.includes('word') || fileType.includes('document')) {
            return 'description';
        } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
            return 'table_chart';
        } else if (fileType.includes('zip')) {
            return 'folder_zip';
        } else {
            return 'attach_file';
        }
    };

    // Função para obter cor baseada no tipo de arquivo
    const getFileColor = (fileType) => {
        if (!fileType) return '#6c757d';
        
        if (fileType.startsWith('image/')) {
            return '#28a745';
        } else if (fileType.includes('pdf')) {
            return '#dc3545';
        } else if (fileType.includes('word') || fileType.includes('document')) {
            return '#007bff';
        } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
            return '#28a745';
        } else if (fileType.includes('zip')) {
            return '#ffc107';
        } else {
            return '#6c757d';
        }
    };

    // Funções para controlar o lightbox de documentos
    const handleDocumentImageClick = (imageUrl, imageAlt) => {
        if (imageUrl) {
            setLightboxImageUrl(imageUrl);
            setLightboxImageAlt(imageAlt);
            setShowDocumentLightbox(true);
        }
    };

    const handleCloseDocumentLightbox = () => {
        setShowDocumentLightbox(false);
    };


    // Função para atualizar status do container
    const handleStatusChange = async (containerId, newStatus) => {
        try {
            console.log(`🔄 Atualizando status do container ${containerId} para: ${newStatus}`);
            
            const containerRef = doc(db, 'containers', containerId);
            await updateDoc(containerRef, {
                status: newStatus,
                updatedAt: new Date()
            });
            
            // Atualizar estado local
            setContainers(prev => prev.map(container => 
                container.id === containerId 
                    ? { ...container, status: newStatus }
                    : container
            ));
            
            console.log(`✅ Status do container ${containerId} atualizado para: ${newStatus}`);
        } catch (error) {
            console.error('❌ Erro ao atualizar status do container:', error);
            alert('Erro ao atualizar status do container. Tente novamente.');
        }
    };

    // Função para filtrar containers por status
    const filterContainersByStatus = (containers, statusFilter) => {
        if (!statusFilter) return containers;
        return containers.filter(container => container.status === statusFilter);
    };

    // Funções para modal de produtos da cotação
    const handleOpenQuoteModal = async (quote) => {
        setSelectedQuote(quote);
        setShowQuoteModal(true);
        setLoadingProducts(true);
        
        try {
            console.log('🔍 Abrindo modal para cotação:', {
                quoteId: quote.id,
                quoteName: quote.quoteName,
                importName: quote.importName,
                factoryId: quote.factoryId,
                factoryName: quote.factoryName,
                containerId: quote.containerId
            });
            
            // Buscar todos os produtos desta cotação usando múltiplas estratégias
            const quotesRef = collection(db, 'quotes');
            let products = [];
            
            // Estratégia 1: Buscar por quoteName (mais específico)
            if (quote.quoteName) {
                console.log(`🔍 Estratégia 1: Buscando por quoteName: "${quote.quoteName}"`);
                const q1 = query(quotesRef, where('quoteName', '==', quote.quoteName));
                const snapshot1 = await getDocs(q1);
                products = snapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log(`📦 Encontrados ${products.length} produtos por quoteName`);
            }
            
            // Estratégia 2: Se não encontrou por quoteName, buscar por importName
            if (products.length === 0 && quote.importName) {
                console.log(`🔍 Estratégia 2: Buscando por importName: "${quote.importName}"`);
                const q2 = query(quotesRef, where('importName', '==', quote.importName));
                const snapshot2 = await getDocs(q2);
                products = snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log(`📦 Encontrados ${products.length} produtos por importName`);
            }
            
            // Estratégia 3: Se ainda não encontrou, buscar por factoryId e containerId
            if (products.length === 0 && quote.factoryId && quote.containerId) {
                console.log(`🔍 Estratégia 3: Buscando por factoryId: "${quote.factoryId}" e containerId: "${quote.containerId}"`);
                const q3 = query(quotesRef, where('factoryId', '==', quote.factoryId), where('containerId', '==', quote.containerId));
                const snapshot3 = await getDocs(q3);
                products = snapshot3.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log(`📦 Encontrados ${products.length} produtos por factoryId + containerId`);
            }
            
            // Estratégia 4: Buscar apenas por factoryId (mais amplo)
            if (products.length === 0 && quote.factoryId) {
                console.log(`🔍 Estratégia 4: Buscando apenas por factoryId: "${quote.factoryId}"`);
                const q4 = query(quotesRef, where('factoryId', '==', quote.factoryId));
                const snapshot4 = await getDocs(q4);
                products = snapshot4.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log(`📦 Encontrados ${products.length} produtos por factoryId`);
            }
            
            // Estratégia 5: Buscar por createdAt similar (para cotações criadas no mesmo momento)
            if (products.length === 0 && quote.createdAt) {
                console.log(`🔍 Estratégia 5: Buscando por createdAt similar`);
                const quoteTime = quote.createdAt.toDate ? quote.createdAt.toDate() : new Date(quote.createdAt);
                const startTime = new Date(quoteTime.getTime() - 60000); // 1 minuto antes
                const endTime = new Date(quoteTime.getTime() + 60000); // 1 minuto depois
                
                const q5 = query(
                    quotesRef, 
                    where('createdAt', '>=', startTime),
                    where('createdAt', '<=', endTime)
                );
                const snapshot5 = await getDocs(q5);
                products = snapshot5.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log(`📦 Encontrados ${products.length} produtos por createdAt similar`);
            }
            
            // Se ainda não encontrou nada, buscar todos os produtos e filtrar manualmente
            if (products.length === 0) {
                console.log(`🔍 Estratégia 6: Buscando todos os produtos e filtrando manualmente`);
                const allQuotesSnapshot = await getDocs(quotesRef);
                const allProducts = allQuotesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                // Filtrar produtos que podem estar relacionados
                products = allProducts.filter(product => {
                    return (
                        (product.factoryId === quote.factoryId) ||
                        (product.quoteName === quote.quoteName) ||
                        (product.importName === quote.importName) ||
                        (product.containerId === quote.containerId)
                    );
                });
                console.log(`📦 Encontrados ${products.length} produtos por filtro manual`);
            }
            
            setQuoteProducts(products);
            console.log(`✅ Total de ${products.length} produtos carregados para a cotação:`, {
                quoteName: quote.quoteName,
                importName: quote.importName,
                factoryId: quote.factoryId,
                containerId: quote.containerId,
                products: products.map(p => ({ id: p.id, ref: p.ref || p.referencia, description: p.description }))
            });
            
        } catch (error) {
            console.error('❌ Erro ao carregar produtos da cotação:', error);
            setQuoteProducts([]);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleCloseQuoteModal = () => {
        setShowQuoteModal(false);
        setSelectedQuote(null);
        setQuoteProducts([]);
    };

    // Carregar containers do Firebase
    const loadContainers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('🔄 Carregando containers...');
            const containersRef = collection(db, 'containers');
            const snapshot = await getDocs(containersRef);
            
            const containersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Ordenar por nome
            containersData.sort((a, b) => a.nome.localeCompare(b.nome));
            
            setContainers(containersData);
            console.log(`✅ ${containersData.length} containers carregados`);
            
            // Carregar documentos de todos os containers automaticamente
            await loadAllContainerDocuments();
            
        } catch (error) {
            console.error('❌ Erro ao carregar containers:', error);
            setError('Erro ao carregar containers: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Função para carregar documentos de todos os containers
    const loadAllContainerDocuments = async () => {
        try {
            console.log('🔄 Carregando documentos de todos os containers...');
            
            // Carregar todos os documentos de uma vez
            const documentsRef = collection(db, 'containerDocuments');
            const documentsSnapshot = await getDocs(documentsRef);
            
            const allDocuments = {};
            documentsSnapshot.forEach(doc => {
                const documentData = doc.data();
                const containerId = documentData.containerId;
                
                if (!allDocuments[containerId]) {
                    allDocuments[containerId] = [];
                }
                
                allDocuments[containerId].push({
                    id: doc.id,
                    ...documentData
                });
            });
            
            // Ordenar documentos por data (mais recentes primeiro) para cada container
            Object.keys(allDocuments).forEach(containerId => {
                allDocuments[containerId].sort((a, b) => {
                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                    return dateB - dateA;
                });
            });
            
            setContainerDocuments(allDocuments);
            console.log(`✅ Documentos carregados para ${Object.keys(allDocuments).length} containers`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar documentos dos containers:', error);
        }
    };

    // Função para carregar cotações associadas aos containers
    const loadQuotesByContainer = async () => {
        try {
            console.log('🔄 Carregando cotações associadas aos containers...');
            
            // Primeiro, carregar todas as fábricas para criar um mapa
            const factoriesRef = collection(db, 'fabricas');
            const factoriesSnapshot = await getDocs(factoriesRef);
            const factoriesMap = {};
            factoriesSnapshot.forEach(doc => {
                const factoryData = doc.data();
                console.log(`🔍 Dados da fábrica ${doc.id}:`, factoryData);
                
                // Função para verificar se é um ID (padrão Firebase)
                const isFirebaseId = (str) => {
                    return str && typeof str === 'string' && str.length >= 20 && /^[a-zA-Z0-9]+$/.test(str);
                };
                
                // Buscar nome da fábrica em múltiplos campos possíveis
                const factoryName = factoryData.name || factoryData.nomeFabrica || factoryData.factoryName || factoryData.title;
                
                // Só usar o nome se não for vazio, não for igual ao ID e não for um ID Firebase
                if (factoryName && factoryName.trim() !== '' && factoryName !== doc.id && !isFirebaseId(factoryName)) {
                    factoriesMap[doc.id] = factoryName.trim();
                    console.log(`✅ Nome válido encontrado: ${factoryName.trim()}`);
                } else {
                    // Se não tem nome válido, tentar usar o primeiro campo disponível mesmo que seja ID
                    const fallbackName = factoryData.nome || factoryData.name || factoryData.factoryName || factoryData.title;
                    if (fallbackName && fallbackName.trim() !== '') {
                        factoriesMap[doc.id] = fallbackName.trim();
                        console.log(`⚠️ Usando nome mesmo sendo ID: ${fallbackName.trim()}`);
                    } else {
                        // Como último recurso, usar um nome genérico baseado no ID
                        factoriesMap[doc.id] = `Fábrica ${doc.id.substring(0, 8)}`;
                        console.log(`❌ Usando nome genérico: Fábrica ${doc.id.substring(0, 8)}`);
                    }
                }
                
                console.log(`🏭 Fábrica ID: ${doc.id}, Nome mapeado: ${factoriesMap[doc.id]}`);
            });
            console.log('🏭 Mapa de fábricas carregado:', factoriesMap);
            
            // Log específico para investigar problemas com factoryId específicos
            console.log('🔍 Verificação de factoryIds específicos no mapa:');
            Object.keys(factoriesMap).forEach(factoryId => {
                if (factoryId.includes('yWwDq7TG') || factoryId.includes('456')) {
                    console.log(`  🏭 FactoryId: ${factoryId} -> Nome: ${factoriesMap[factoryId]}`);
                }
            });
            
            const quotesRef = collection(db, 'quotes');
            const quotesSnapshot = await getDocs(quotesRef);
            
            const quotesData = quotesSnapshot.docs.map(doc => {
                const data = doc.data();
                
                // Log detalhado para verificar campos disponíveis
                console.log(`🔍 Cotação ID: ${doc.id}`);
                console.log(`  📋 Dados disponíveis:`, {
                    factoryId: data.factoryId,
                    factoryName: data.factoryName,
                    quoteName: data.quoteName,
                    importName: data.importName,
                    containerId: data.containerId,
                    ref: data.ref,
                    description: data.description
                });
                
                // Resolver nome da fábrica - USAR MESMO CAMPO DA PÁGINA PRODUTOS SELECIONADOS
                let factoryName = 'Fábrica não identificada';
                
                // Usar o mesmo campo que está sendo usado na página "Produtos Selecionados"
                // que é factoriesMap[data.factoryId] onde factoriesMap contém os dados carregados por getAllFactories()
                if (data.factoryId && factoriesMap[data.factoryId]) {
                    factoryName = factoriesMap[data.factoryId];
                    console.log(`  ✅ Nome da fábrica encontrado no mapa (mesmo campo da página Produtos Selecionados): ${factoryName}`);
                } else {
                    console.log(`  ❌ Fábrica não encontrada no mapa para factoryId: ${data.factoryId}`);
                    factoryName = `Fábrica ${data.factoryId ? data.factoryId.substring(0, 8) : 'Desconhecida'}`;
                }
                
                // Resolver nome da cotação - priorizar quoteName sobre importName
                const quoteName = data.quoteName || data.importName || `Cotação ${doc.id}`;
                
                console.log(`  🎯 Resultado final: FactoryName: ${factoryName}, QuoteName: ${quoteName}`);
                
                return {
                    id: doc.id,
                    ...data,
                    factoryName: factoryName, // Garantir que factoryName esteja sempre presente
                    quoteName: quoteName // Garantir que quoteName esteja sempre presente
                };
            });
            
            // Agrupar cotações por containerId
            const quotesGrouped = {};
            quotesData.forEach(quote => {
                if (quote.containerId) {
                    if (!quotesGrouped[quote.containerId]) {
                        quotesGrouped[quote.containerId] = [];
                    }
                    quotesGrouped[quote.containerId].push(quote);
                }
            });
            
            setQuotesByContainer(quotesGrouped);
            console.log(`✅ ${Object.keys(quotesGrouped).length} containers com cotações associadas`);
            
            // Estatísticas sobre factoryName
            const totalQuotes = quotesData.length;
            const quotesWithFactoryName = quotesData.filter(quote => quote.factoryName && quote.factoryName !== 'Fábrica não identificada').length;
            const quotesWithoutFactoryName = totalQuotes - quotesWithFactoryName;
            
            console.log(`📊 Estatísticas das cotações:`);
            console.log(`  📋 Total de cotações: ${totalQuotes}`);
            console.log(`  ✅ Cotações com factoryName: ${quotesWithFactoryName}`);
            console.log(`  ❌ Cotações sem factoryName: ${quotesWithoutFactoryName}`);
            console.log(`  📈 Percentual com factoryName: ${((quotesWithFactoryName / totalQuotes) * 100).toFixed(1)}%`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar cotações por container:', error);
        }
    };

    useEffect(() => {
        loadContainers();
        loadQuotesByContainer();
    }, [loadContainers]);

    // Função para recarregar dados (útil para debug)
    const reloadData = async () => {
        console.log('🔄 Recarregando dados...');
        await loadContainers();
        await loadQuotesByContainer();
    };

    // Função para limpar formulário
    const clearForm = () => {
        setFormData({
            nome: '',
            numero: '',
            refContainer: '',
            capacidadeCBM: 0
        });
        setEditingContainer(null);
        setError(null);
        setSuccess(null);
    };

    // Função para abrir formulário de criação
    const handleCreateContainer = () => {
        clearForm();
        setShowForm(true);
    };

    // Função para abrir formulário de edição
    const handleEditContainer = (container) => {
        setFormData({
            nome: container.nome || '',
            numero: container.numero || '',
            refContainer: container.refContainer || '',
            capacidadeCBM: container.capacidadeCBM || 0
        });
        setEditingContainer(container);
        setShowForm(true);
    };

    // Função para fechar formulário
    const handleCloseForm = () => {
        setShowForm(false);
        clearForm();
    };

    // Função para salvar container
    const handleSaveContainer = async () => {
        try {
            setSaving(true);
            setError(null);

            // Validações
            if (!formData.nome.trim()) {
                setError('Nome do container é obrigatório');
                return;
            }
            if (!formData.numero.trim()) {
                setError('Número do container é obrigatório');
                return;
            }
            if (!formData.refContainer.trim()) {
                setError('REF Container é obrigatório');
                return;
            }
            if (formData.capacidadeCBM <= 0) {
                setError('Capacidade em CBM deve ser maior que zero');
                return;
            }

            const containerData = {
                nome: formData.nome.trim(),
                numero: formData.numero.trim(),
                refContainer: formData.refContainer.trim(),
                capacidadeCBM: parseFloat(formData.capacidadeCBM),
                updatedAt: serverTimestamp()
            };

            if (editingContainer) {
                // Editar container existente
                const containerRef = doc(db, 'containers', editingContainer.id);
                await updateDoc(containerRef, containerData);
                console.log('✅ Container editado:', editingContainer.id);
                setSuccess('Container editado com sucesso!');
            } else {
                // Criar novo container
                containerData.createdAt = serverTimestamp();
                const docRef = await addDoc(collection(db, 'containers'), containerData);
                console.log('✅ Container criado:', docRef.id);
                setSuccess('Container criado com sucesso!');
            }

            // Recarregar lista e fechar formulário
            await loadContainers();
            await loadQuotesByContainer();
            setTimeout(() => {
                setShowForm(false);
                clearForm();
            }, 1500);

        } catch (error) {
            console.error('❌ Erro ao salvar container:', error);
            setError('Erro ao salvar container: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Função para confirmar exclusão
    const handleDeleteContainer = (container) => {
        setContainerToDelete(container);
        setShowDeleteModal(true);
    };

    // Função para executar exclusão
    const confirmDeleteContainer = async () => {
        try {
            setSaving(true);
            setError(null);

            const containerRef = doc(db, 'containers', containerToDelete.id);
            await deleteDoc(containerRef);
            
            console.log('✅ Container excluído:', containerToDelete.id);
            setSuccess('Container excluído com sucesso!');
            
            // Recarregar lista e fechar modal
            await loadContainers();
            await loadQuotesByContainer();
            setShowDeleteModal(false);
            setContainerToDelete(null);
            
            setTimeout(() => setSuccess(null), 3000);

        } catch (error) {
            console.error('❌ Erro ao excluir container:', error);
            setError('Erro ao excluir container: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Função para cancelar exclusão
    const cancelDeleteContainer = () => {
        setShowDeleteModal(false);
        setContainerToDelete(null);
    };

    return (
        <Container fluid className="py-4">
            {/* Header */}
            <Row className="mb-4">
                <Col xs={12}>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                                <LocalShipping sx={{ mr: 2, fontSize: '2rem', color: '#3498db' }} />
                                Gerenciamento de Containers
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: '#7f8c8d', mt: 1 }}>
                                Gerencie os containers disponíveis para exportação
                            </Typography>
                        </div>
                        <div className="d-flex gap-2">
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={reloadData}
                                sx={{ 
                                    borderRadius: '8px',
                                    px: 2,
                                    py: 1,
                                    fontSize: '0.8rem'
                                }}
                            >
                                🔄 Recarregar
                            </Button>
                            <Button
                                variant="success"
                                size="lg"
                                onClick={handleCreateContainer}
                                sx={{ 
                                    borderRadius: '12px',
                                    px: 3,
                                    py: 1.5,
                                    fontSize: '1rem',
                                    fontWeight: 'bold'
                                }}
                            >
                                <Add sx={{ mr: 1 }} />
                                Novo Container
                            </Button>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Alertas */}
            {error && (
                <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>
                    <Alert.Heading>Erro!</Alert.Heading>
                    {error}
                </Alert>
            )}
            
            {success && (
                <Alert variant="success" className="mb-4" onClose={() => setSuccess(null)} dismissible>
                    <Alert.Heading>Sucesso!</Alert.Heading>
                    {success}
                </Alert>
            )}

            {/* Filtro de Status */}
            <Row className="mb-4">
                <Col xs={12} md={4}>
                    <div className="d-flex align-items-center">
                        <Typography variant="body2" sx={{ fontWeight: 'bold', marginRight: 2, minWidth: '60px' }}>
                            Status:
                        </Typography>
                        <select 
                            className="form-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ maxWidth: '200px' }}
                        >
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </Col>
            </Row>

            {/* Loading */}
            {loading && (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" size="lg" />
                    <div className="mt-3">
                        <Typography variant="h6" sx={{ color: '#7f8c8d' }}>
                            Carregando containers...
                        </Typography>
                    </div>
                </div>
            )}

            {/* Lista de Containers */}
            {!loading && (
                <>
                    {containers.length === 0 ? (
                        <Card className="text-center py-5" style={{ borderRadius: '12px' }}>
                            <Card.Body>
                                <LocalShipping sx={{ fontSize: '4rem', color: '#bdc3c7', mb: 2 }} />
                                <Typography variant="h5" sx={{ color: '#7f8c8d', mb: 2 }}>
                                    Nenhum container cadastrado
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#95a5a6', mb: 3 }}>
                                    Clique em "Novo Container" para começar
                                </Typography>
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={handleCreateContainer}
                                >
                                    <Add sx={{ mr: 1 }} />
                                    Criar Primeiro Container
                                </Button>
                            </Card.Body>
                        </Card>
                    ) : (
                        <Row className="g-4">
                            {filterContainersByStatus(containers, statusFilter).map((container) => (
                                <Col key={container.id} xs={12} sm={6} md={4} lg={3}>
                                    <Card 
                                        className="h-100 shadow-sm"
                                        style={{ 
                                            borderRadius: '12px',
                                            border: '1px solid #e9ecef',
                                            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                                        }}
                                    >
                                        <Card.Header 
                                            style={{ 
                                                backgroundColor: getHeaderColor(container.status),
                                                color: 'white',
                                                borderRadius: '12px 12px 0 0',
                                                border: 'none'
                                            }}
                                        >
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center">
                                                    <LocalShipping sx={{ mr: 1, fontSize: '1.2rem' }} />
                                                    <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                                                        {container.refContainer}
                                                    </Typography>
                                                    {(() => {
                                                        const associatedQuotes = quotesByContainer[container.id] || [];
                                                        const totalValue = associatedQuotes.reduce((sum, quote) => sum + calculateProductAmount(quote), 0);
                                                        return totalValue > 0 ? (
                                                            <div style={{
                                                                backgroundColor: '#ffffff',
                                                                color: '#000000',
                                                                padding: '4px 8px',
                                                                borderRadius: '4px',
                                                                border: '1px solid #e0e0e0',
                                                                marginLeft: '8px',
                                                                fontSize: '0.9rem',
                                                                fontWeight: 'bold'
                                                            }}>
                                                                ¥ {formatBrazilianNumber(totalValue, 2)}
                                                            </div>
                                                        ) : null;
                                                    })()}
                                                </div>
                                                
                                                {/* Tag de Status */}
                                                <div className="d-flex justify-content-center mb-2">
                                                    {(() => {
                                                        const statusInfo = getStatusInfo(container.status);
                                                        return (
                                                            <span 
                                                                className="badge"
                                                                style={{ 
                                                                    backgroundColor: statusInfo.bgColor, 
                                                                    color: statusInfo.color,
                                                                    fontWeight: 'bold',
                                                                    borderRadius: '3px',
                                                                    border: `1px solid ${statusInfo.bgColor}`,
                                                                    fontSize: '0.75rem',
                                                                    padding: '4px 8px'
                                                                }}
                                                            >
                                                                {statusInfo.label}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                                
                                                <div className="d-flex gap-1">
                                                    <Tooltip title="Editar">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleEditContainer(container)}
                                                            sx={{ color: 'white' }}
                                                        >
                                                            <Edit fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Excluir">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDeleteContainer(container)}
                                                            sx={{ color: 'white' }}
                                                        >
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        </Card.Header>
                                        
                                        <Card.Body className="p-3">
                                            {(() => {
                                                const associatedQuotes = quotesByContainer[container.id] || [];
                                                const totalCBM = associatedQuotes.reduce((sum, quote) => sum + (quote.cbmTotal || (quote.cbm || 0) * (quote.ctns || 0)), 0);
                                                const remainingCapacity = container.capacidadeCBM - totalCBM;
                                                
                                                return (
                                                    <>
                                                        <div className="mb-3">
                                                            <div className="row">
                                                                <div className="col-6">
                                                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1 }}>
                                                                        Capacidade: {formatBrazilianNumber(container.capacidadeCBM, 3)} m³
                                                                    </Typography>
                                                                </div>
                                                                <div className="col-6">
                                                                    <Typography variant="subtitle2" sx={{ 
                                                                        fontWeight: 'bold', 
                                                                        color: remainingCapacity < 0 ? '#e74c3c' : '#27ae60', 
                                                                        mb: 1 
                                                                    }}>
                                                                        Restante: {formatBrazilianNumber(remainingCapacity, 3)} m³
                                                                    </Typography>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Alerta de Capacidade Excedida */}
                                                            {remainingCapacity < 0 && (
                                                                <div className="row mt-2">
                                                                    <div className="col-12">
                                                                        <Alert variant="danger" className="mb-2" style={{ 
                                                                            backgroundColor: '#f8d7da', 
                                                                            border: '1px solid #f5c6cb', 
                                                                            color: '#721c24',
                                                                            borderRadius: '6px',
                                                                            padding: '8px 12px',
                                                                            fontSize: '0.875rem',
                                                                            fontWeight: 'bold'
                                                                        }}>
                                                                            <span className="material-icons me-2" style={{fontSize: '18px', verticalAlign: 'middle'}}>warning</span>
                                                                            Capacidade excedida em {formatBrazilianNumber(Math.abs(remainingCapacity), 2)} m³
                                                                        </Alert>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                        </div>
                                                        
                                                        {/* Seletor de Status */}
                                                        <div className="mb-3">
                                                            <div className="d-flex align-items-center justify-content-center">
                                                                <Typography variant="body2" sx={{ fontWeight: 'bold', marginRight: 2, fontSize: '0.8rem' }}>
                                                                    Status:
                                                                </Typography>
                                                                <select 
                                                                    className="form-select form-select-sm"
                                                                    style={{ maxWidth: '150px', fontSize: '0.8rem' }}
                                                                    value={container.status || ''}
                                                                    onChange={(e) => handleStatusChange(container.id, e.target.value)}
                                                                >
                                                                    <option value="">Selecionar</option>
                                                                    {statusOptions.slice(1).map(option => (
                                                                        <option key={option.value} value={option.value}>
                                                                            {option.label}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Cotações Associadas */}
                                                        <div className="mb-3">
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 2 }}>
                                                                Cotações Associadas:
                                                            </Typography>
                                                            {associatedQuotes.length === 0 ? (
                                                                <Typography variant="body2" sx={{ color: '#7f8c8d', fontStyle: 'italic' }}>
                                                                    Nenhuma cotação associada
                                                                </Typography>
                                                            ) : (
                                                                <div>
                                                                    {associatedQuotes.map((quote, index) => (
                                                                        <div 
                                                                            key={quote.id} 
                                                                            className="mb-3 p-3" 
                                                                            style={{ 
                                                                                backgroundColor: '#f8f9fa', 
                                                                                borderRadius: '8px',
                                                                                border: '1px solid #e9ecef',
                                                                                cursor: 'pointer',
                                                                                transition: 'all 0.2s ease'
                                                                            }}
                                                                            onClick={() => handleOpenQuoteModal(quote)}
                                                                            onMouseEnter={(e) => {
                                                                                e.target.style.backgroundColor = '#e9ecef';
                                                                                e.target.style.transform = 'translateY(-1px)';
                                                                                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                                                            }}
                                                                            onMouseLeave={(e) => {
                                                                                e.target.style.backgroundColor = '#f8f9fa';
                                                                                e.target.style.transform = 'translateY(0)';
                                                                                e.target.style.boxShadow = 'none';
                                                                            }}
                                                                        >
                                                                            {/* Nome da Cotação */}
                                                                            <div className="mb-1">
                                                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '0.95rem' }}>
                                                                                    {quote.quoteName || quote.importName || `Cotação ${index + 1}`}
                                                                                </Typography>
                                                                            </div>
                                                                            
                                                                            {/* Nome da Fábrica */}
                                                                            <div className="mb-2">
                                                                                <Typography variant="body2" sx={{ color: '#34495e', fontSize: '0.8rem', fontWeight: '500' }}>
                                                                                    <span className="material-icons me-1" style={{fontSize: '12px', verticalAlign: 'middle', color: '#7f8c8d'}}>business</span>
                                                                                    {quote.factoryName || 'Fábrica não identificada'}
                                                                                </Typography>
                                                                            </div>
                                                                            
                                                                            {/* Valor Total e CBM Total - lado a lado */}
                                                                            <div className="row">
                                                                                <div className="col-6">
                                                                                    <div className="d-flex align-items-center">
                                                                                        <span className="material-icons me-1" style={{fontSize: '16px', color: '#e74c3c'}}>attach_money</span>
                                                                                        <Typography variant="body2" sx={{ color: '#e74c3c', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                                                            ¥ {formatBrazilianNumber(calculateProductAmount(quote), 2)}
                                                                                        </Typography>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="col-6">
                                                                                    <div className="d-flex align-items-center">
                                                                                        <span className="material-icons me-1" style={{fontSize: '16px', color: '#27ae60'}}>inventory</span>
                                                                                        <Typography variant="body2" sx={{ color: '#27ae60', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                                                            {formatBrazilianNumber((quote.cbm || 0) * (quote.ctns || 0), 3)} m³
                                                                                        </Typography>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Seção de Documentos */}
                                                        <div className="mt-3">
                                                            <Typography variant="subtitle2" className="mb-2 fw-bold" style={{ color: 'black' }}>
                                                                <span className="material-icons me-1" style={{fontSize: '16px'}}>description</span>
                                                                Documentos do Container:
                                                            </Typography>
                                                            
                                                            {/* Lista de documentos existentes */}
                                                            <div className="mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                                {(() => {
                                                                    const documents = containerDocuments[container.id] || [];
                                                                    return documents.length > 0 ? (
                                                                        documents.map((document, docIndex) => (
                                                                            <div 
                                                                                key={document.id || docIndex}
                                                                                className="p-2 mb-2 rounded border"
                                                                                style={{ 
                                                                                    backgroundColor: '#f8f9fa',
                                                                                    border: '1px solid #e9ecef'
                                                                                }}
                                                                            >
                                                                                <div className="d-flex justify-content-between align-items-start">
                                                                                    <div className="flex-grow-1">
                                                                                        <div className="d-flex align-items-center mb-1">
                                                                                            <span className="material-icons me-1" style={{fontSize: '14px', color: '#6c757d'}}>person</span>
                                                                                            <small className="text-muted fw-bold">{document.userName}</small>
                                                                                            <span className="mx-2 text-muted">•</span>
                                                                                            <small className="text-muted">
                                                                                                {document.createdAt?.toDate ? 
                                                                                                    document.createdAt.toDate().toLocaleDateString('pt-BR') + ' ' + document.createdAt.toDate().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) :
                                                                                                    new Date(document.createdAt).toLocaleDateString('pt-BR') + ' ' + new Date(document.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})
                                                                                                }
                                                                                            </small>
                                                                                        </div>
                                                                                        {document.document && (
                                                                                            <div className="mb-2">
                                                                                                <Typography variant="body2" style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                                                                                                    {document.document}
                                                                                                </Typography>
                                                                                            </div>
                                                                                        )}
                                                                                        {document.imageUrl && (
                                                                                            <div className="mt-2">
                                                                                                <img 
                                                                                                    src={document.imageUrl} 
                                                                                                    alt="Imagem anexada"
                                                                                                    style={{ 
                                                                                                        maxWidth: '200px', 
                                                                                                        maxHeight: '150px', 
                                                                                                        cursor: 'pointer',
                                                                                                        borderRadius: '4px',
                                                                                                        border: '1px solid #dee2e6'
                                                                                                    }}
                                                                                                    onClick={() => handleDocumentImageClick(document.imageUrl, 'Imagem anexada')}
                                                                                                    className="img-fluid"
                                                                                                />
                                                                                            </div>
                                                                                        )}
                                                                                        
                                                                                        {document.documentUrl && (
                                                                                            <div className="mt-2">
                                                                                                <div 
                                                                                                    className="d-flex align-items-center p-2 rounded border"
                                                                                                    style={{ 
                                                                                                        backgroundColor: '#ffffff',
                                                                                                        border: '1px solid #dee2e6',
                                                                                                        cursor: 'pointer',
                                                                                                        maxWidth: '200px'
                                                                                                    }}
                                                                                                    onClick={() => {
                                                                                                        // Para documentos, criar link de download
                                                                                                        const link = document.createElement('a');
                                                                                                        link.href = document.documentUrl;
                                                                                                        link.download = document.documentName || 'documento';
                                                                                                        link.click();
                                                                                                    }}
                                                                                                >
                                                                                                    <span 
                                                                                                        className="material-icons me-2" 
                                                                                                        style={{
                                                                                                            fontSize: '24px',
                                                                                                            color: getFileColor(document.documentType)
                                                                                                        }}
                                                                                                    >
                                                                                                        {getFileIcon(document.documentType)}
                                                                                                    </span>
                                                                                                    <div className="flex-grow-1">
                                                                                                        <div className="fw-bold" style={{ fontSize: '0.8rem', color: '#495057' }}>
                                                                                                            {document.documentName || 'Documento'}
                                                                                                        </div>
                                                                                                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                                                                            Clique para baixar
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="text-center text-muted py-3" style={{ fontSize: '0.9rem' }}>
                                                                            <span className="material-icons me-2" style={{fontSize: '18px', verticalAlign: 'middle'}}>description</span>
                                                                            Nenhum documento adicionado ainda
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                            
                                                            {/* Campo para adicionar novo documento */}
                                                            {documentingContainer === container.id ? (
                                                                <div className="p-3 rounded border" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                                                    <div className="mb-3">
                                                                        <label className="fw-bold" style={{ fontSize: '0.9rem' }}>
                                                                            Adicionar Documento:
                                                                        </label>
                                                                        <textarea
                                                                            className="form-control"
                                                                            rows={3}
                                                                            value={newDocument}
                                                                            onChange={(e) => setNewDocument(e.target.value)}
                                                                            placeholder="Digite o documento aqui..."
                                                                            style={{ fontSize: '0.9rem' }}
                                                                        />
                                                                    </div>
                                                                    
                                                                    {/* Upload de Imagem */}
                                                                    <div className="mb-3">
                                                                        <label className="fw-bold" style={{ fontSize: '0.9rem' }}>
                                                                            Anexar Imagem:
                                                                        </label>
                                                                        <div className="d-flex align-items-center gap-2">
                                                                            <input
                                                                                type="file"
                                                                                id="image-upload"
                                                                                accept="image/*"
                                                                                onChange={handleImageUpload}
                                                                                className="form-control form-control-sm"
                                                                                style={{ fontSize: '0.8rem' }}
                                                                            />
                                                                            {documentImage && (
                                                                                <Button
                                                                                    variant="outline-danger"
                                                                                    size="sm"
                                                                                    onClick={handleRemoveImage}
                                                                                    style={{ fontSize: '0.8rem' }}
                                                                                >
                                                                                    <span className="material-icons me-1" style={{fontSize: '14px'}}>delete</span>
                                                                                    Remover
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                        {documentImage && (
                                                                            <div className="mt-2">
                                                                                <small className="text-success d-flex align-items-center">
                                                                                    <span className="material-icons me-1" style={{fontSize: '14px'}}>check_circle</span>
                                                                                    <span className="material-icons me-1" style={{fontSize: '16px', color: '#28a745'}}>image</span>
                                                                                    {documentImage.name} selecionado
                                                                                </small>
                                                                            </div>
                                                                        )}
                                                                        <div className="form-text" style={{ fontSize: '0.75rem' }}>
                                                                            Tipos aceitos: JPG, PNG, GIF, WEBP (máx. 2MB)
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Upload de Documento */}
                                                                    <div className="mb-3">
                                                                        <label className="fw-bold" style={{ fontSize: '0.9rem' }}>
                                                                            Anexar Documento:
                                                                        </label>
                                                                        <div className="d-flex align-items-center gap-2">
                                                                            <input
                                                                                type="file"
                                                                                id="document-upload"
                                                                                accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                                                                                onChange={handleDocumentUpload}
                                                                                className="form-control form-control-sm"
                                                                                style={{ fontSize: '0.8rem' }}
                                                                            />
                                                                            {documentFile && (
                                                                                <Button
                                                                                    variant="outline-danger"
                                                                                    size="sm"
                                                                                    onClick={handleRemoveDocument}
                                                                                    style={{ fontSize: '0.8rem' }}
                                                                                >
                                                                                    <span className="material-icons me-1" style={{fontSize: '14px'}}>delete</span>
                                                                                    Remover
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                        {documentFile && (
                                                                            <div className="mt-2">
                                                                                <small className="text-success d-flex align-items-center">
                                                                                    <span className="material-icons me-1" style={{fontSize: '14px'}}>check_circle</span>
                                                                                    <span className="material-icons me-1" style={{fontSize: '16px', color: getFileColor(documentFile.type)}}>
                                                                                        {getFileIcon(documentFile.type)}
                                                                                    </span>
                                                                                    {documentFile.name} selecionado
                                                                                </small>
                                                                            </div>
                                                                        )}
                                                                        <div className="form-text" style={{ fontSize: '0.75rem' }}>
                                                                            Tipos aceitos: PDF, DOC, DOCX, XLS, XLSX, ZIP (máx. 5MB)
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="d-flex gap-2">
                                                                        <Button 
                                                                            variant="success" 
                                                                            size="sm"
                                                                            onClick={() => handleAddDocument(container.id)}
                                                                            disabled={uploadingDocumentImage || (!newDocument.trim() && !documentImage)}
                                                                            style={{ fontSize: '0.8rem' }}
                                                                        >
                                                                            {uploadingDocumentImage ? (
                                                                                <>
                                                                                    <Spinner size="sm" className="me-1" />
                                                                                    Salvando...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <span className="material-icons me-1" style={{fontSize: '14px'}}>save</span>
                                                                                    Salvar Documento
                                                                                </>
                                                                            )}
                                                                        </Button>
                                                                        <Button 
                                                                            variant="secondary" 
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                setDocumentingContainer(null);
                                                                                setNewDocument('');
                                                                                setDocumentImage(null);
                                                                                setDocumentFile(null);
                                                                            }}
                                                                            style={{ fontSize: '0.8rem' }}
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
                                                                        setDocumentingContainer(container.id);
                                                                    }}
                                                                >
                                                                    <span className="material-icons me-1" style={{fontSize: '14px'}}>add</span>
                                                                    Adicionar Documento
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}
                </>
            )}

            {/* Modal de Formulário */}
            <Modal show={showForm} onHide={handleCloseForm} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <LocalShipping sx={{ mr: 2, fontSize: '1.5rem', color: '#3498db' }} />
                        {editingContainer ? 'Editar Container' : 'Novo Container'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="g-3">
                        <Col xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Nome do Container"
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                variant="outlined"
                                required
                                helperText="Ex: Container 20ft, Container 40ft"
                            />
                        </Col>
                        <Col xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Número do Container"
                                value={formData.numero}
                                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                                variant="outlined"
                                required
                                helperText="Ex: CONT1234567"
                            />
                        </Col>
                        <Col xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="REF Container"
                                value={formData.refContainer}
                                onChange={(e) => setFormData({ ...formData, refContainer: e.target.value })}
                                variant="outlined"
                                required
                                helperText="Referência única do container"
                            />
                        </Col>
                        <Col xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Capacidade (CBM)"
                                type="number"
                                value={formData.capacidadeCBM}
                                onChange={(e) => setFormData({ ...formData, capacidadeCBM: parseFloat(e.target.value) || 0 })}
                                variant="outlined"
                                required
                                inputProps={{ min: 0, step: 0.001 }}
                                helperText="Capacidade em metros cúbicos"
                            />
                        </Col>
                        <Col xs={12} md={6}>
                            <div>
                                <label className="form-label fw-bold">Status do Container</label>
                                <select 
                                    className="form-select"
                                    value={formData.status || ''}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="">Selecionar Status</option>
                                    {statusOptions.slice(1).map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="form-text">Status atual do container</div>
                            </div>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseForm} disabled={saving}>
                        <Close sx={{ mr: 1 }} />
                        Cancelar
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleSaveContainer} 
                        disabled={saving}
                    >
                        <Save sx={{ mr: 1 }} />
                        {saving ? 'Salvando...' : (editingContainer ? 'Atualizar' : 'Criar')}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de Confirmação de Exclusão */}
            <Modal show={showDeleteModal} onHide={cancelDeleteContainer} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="text-danger">
                        <Delete sx={{ mr: 2 }} />
                        Confirmar Exclusão
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Typography variant="body1">
                        Tem certeza que deseja excluir o container <strong>"{containerToDelete?.nome}"</strong>?
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#e74c3c', mt: 2 }}>
                        ⚠️ Esta ação não pode ser desfeita.
                    </Typography>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={cancelDeleteContainer} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={confirmDeleteContainer} 
                        disabled={saving}
                    >
                        <Delete sx={{ mr: 1 }} />
                        {saving ? 'Excluindo...' : 'Excluir'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de Produtos da Cotação */}
            <Modal show={showQuoteModal} onHide={handleCloseQuoteModal} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <div className="d-flex align-items-center">
                            <span className="material-icons me-2" style={{fontSize: '20px', color: '#3498db'}}>inventory</span>
                            <div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                                    {selectedQuote?.quoteName || selectedQuote?.importName || 'Cotação'}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#7f8c8d', fontWeight: 'normal' }}>
                                    {selectedQuote?.factoryName || 'Fábrica não identificada'}
                                </div>
                            </div>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedQuote && (
                        <div>
                            {/* Informações da Cotação */}
                            <Card className="mb-3">
                                <Card.Header style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                                        <span className="material-icons me-2" style={{fontSize: '18px', verticalAlign: 'middle'}}>info</span>
                                        Resumo da Cotação
                                    </Typography>
                                </Card.Header>
                                <Card.Body className="py-2">
                                    <Row>
                                        <Col md={3}>
                                            <div className="text-center p-2" style={{ backgroundColor: '#e3f2fd', borderRadius: '6px' }}>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: '0.9rem' }}>
                                                    Total de Produtos
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: '1.2rem' }}>
                                                    {quoteProducts.length}
                                                </Typography>
                                            </div>
                                        </Col>
                                        <Col md={3}>
                                            <div className="text-center p-2" style={{ backgroundColor: '#fff3e0', borderRadius: '6px' }}>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#f57c00', fontSize: '0.9rem' }}>
                                                    CBM Total
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#f57c00', fontSize: '1.2rem' }}>
                                                    {formatBrazilianNumber(quoteProducts.reduce((sum, product) => sum + ((product.cbm || 0) * (product.ctns || 0)), 0), 3)} m³
                                                </Typography>
                                            </div>
                                        </Col>
                                        <Col md={3}>
                                            <div className="text-center p-2" style={{ backgroundColor: '#e8f5e8', borderRadius: '6px' }}>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2e7d32', fontSize: '0.9rem' }}>
                                                    QTY Total
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32', fontSize: '1.2rem' }}>
                                                    {formatBrazilianNumber(quoteProducts.reduce((sum, product) => sum + ((product.ctns || 0) * (product.unitCtn || 0)), 0), 0)}
                                                </Typography>
                                            </div>
                                        </Col>
                                        <Col md={3}>
                                            <div className="text-center p-2" style={{ backgroundColor: '#ffebee', borderRadius: '6px' }}>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#c62828', fontSize: '0.9rem' }}>
                                                    Valor Total
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#c62828', fontSize: '1.2rem' }}>
                                                    ¥ {formatBrazilianNumber(quoteProducts.reduce((sum, product) => sum + calculateProductAmount(product), 0), 2)}
                                                </Typography>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Lista de Produtos */}
                            <Card>
                                <Card.Header>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                        Produtos da Cotação ({quoteProducts.length})
                                    </Typography>
                                </Card.Header>
                                <Card.Body>
                                    {loadingProducts ? (
                                        <div className="text-center p-4">
                                            <Spinner animation="border" variant="primary" />
                                            <Typography variant="body2" sx={{ mt: 2 }}>
                                                Carregando produtos...
                                            </Typography>
                                        </div>
                                    ) : quoteProducts.length === 0 ? (
                                        <Typography variant="body2" sx={{ color: '#7f8c8d', fontStyle: 'italic', textAlign: 'center', p: 3 }}>
                                            Nenhum produto encontrado para esta cotação
                                        </Typography>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead className="table-dark">
                                                    <tr>
                                                        <th style={{ fontSize: '0.9rem' }}>REF</th>
                                                        <th style={{ fontSize: '0.9rem' }}>Descrição</th>
                                                        <th style={{ fontSize: '0.9rem', textAlign: 'center' }}>CTNS</th>
                                                        <th style={{ fontSize: '0.9rem', textAlign: 'center' }}>Unit/CTN</th>
                                                        <th style={{ fontSize: '0.9rem', textAlign: 'center' }}>QTY</th>
                                                        <th style={{ fontSize: '0.9rem', textAlign: 'center' }}>Preço Unit.</th>
                                                        <th style={{ fontSize: '0.9rem', textAlign: 'center' }}>CBM</th>
                                                        <th style={{ fontSize: '0.9rem', textAlign: 'center' }}>CBM Total</th>
                                                        <th style={{ fontSize: '0.9rem', textAlign: 'center' }}>Valor Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {quoteProducts.map((product, index) => (
                                                        <tr key={product.id || index}>
                                                            <td style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                                {product.referencia || product.ref || `REF-${index + 1}`}
                                                            </td>
                                                            <td style={{ fontSize: '0.85rem', maxWidth: '200px' }}>
                                                                <div style={{ 
                                                                    overflow: 'hidden', 
                                                                    textOverflow: 'ellipsis', 
                                                                    whiteSpace: 'nowrap',
                                                                    maxWidth: '200px'
                                                                }} title={product.description || product.descricao || 'N/A'}>
                                                                    {product.description || product.descricao || 'N/A'}
                                                                </div>
                                                            </td>
                                                            <td style={{ fontSize: '0.85rem', textAlign: 'center' }}>
                                                                {formatBrazilianNumber(product.ctns || 0, 0)}
                                                            </td>
                                                            <td style={{ fontSize: '0.85rem', textAlign: 'center' }}>
                                                                {formatBrazilianNumber(product.unitCtn || 0, 0)}
                                                            </td>
                                                            <td style={{ fontSize: '0.85rem', textAlign: 'center' }}>
                                                                {formatBrazilianNumber((product.ctns || 0) * (product.unitCtn || 0), 0)}
                                                            </td>
                                                            <td style={{ fontSize: '0.85rem', textAlign: 'center' }}>
                                                                ¥ {formatBrazilianNumber(product.unitPrice || 0, 2)}
                                                            </td>
                                                            <td style={{ fontSize: '0.85rem', textAlign: 'center' }}>
                                                                {formatBrazilianNumber(product.cbm || 0, 3)} m³
                                                            </td>
                                                            <td style={{ fontSize: '0.85rem', textAlign: 'center' }}>
                                                                {formatBrazilianNumber((product.cbm || 0) * (product.ctns || 0), 3)} m³
                                                            </td>
                                                            <td style={{ fontSize: '0.85rem', textAlign: 'center', fontWeight: 'bold', color: '#e74c3c' }}>
                                                                ¥ {formatBrazilianNumber(calculateProductAmount(product), 2)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="table-light">
                                                    <tr>
                                                        <td colSpan="7" style={{ fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'right' }}>
                                                            TOTAIS:
                                                        </td>
                                                        <td style={{ fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center', color: '#27ae60' }}>
                                                            {formatBrazilianNumber(quoteProducts.reduce((sum, product) => sum + ((product.cbm || 0) * (product.ctns || 0)), 0), 3)} m³
                                                        </td>
                                                        <td style={{ fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center', color: '#e74c3c' }}>
                                                            ¥ {formatBrazilianNumber(quoteProducts.reduce((sum, product) => sum + calculateProductAmount(product), 0), 2)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseQuoteModal}>
                        Fechar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal Lightbox para Documentos */}
            <Modal show={showDocumentLightbox} onHide={handleCloseDocumentLightbox} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <span className="material-icons me-2" style={{fontSize: '20px', verticalAlign: 'middle'}}>image</span>
                        Visualizar Documento
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    {lightboxImageUrl && (
                        <img 
                            src={lightboxImageUrl} 
                            alt={lightboxImageAlt}
                            style={{ 
                                maxWidth: '100%', 
                                maxHeight: '70vh', 
                                borderRadius: '8px',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                            }}
                            className="img-fluid"
                        />
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseDocumentLightbox}>
                        <span className="material-icons me-1" style={{fontSize: '16px'}}>close</span>
                        Fechar
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default ContainerManagement;

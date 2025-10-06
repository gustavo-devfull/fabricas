import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Modal } from 'react-bootstrap';
import { Box, Typography, Chip, IconButton, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { ArrowBack, Download, Visibility, Refresh, Delete } from '@mui/icons-material';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../utils/formatters';
import excelExportService from '../../services/excelExportService';

const ExportedOrders = () => {
    // Função para formatar data do pedido
    const formatPedidoDate = (dateString) => {
        if (!dateString || dateString.trim() === '') {
            return 'Não informado';
        }
        
        // Se já está no formato brasileiro DD/MM/AAAA, retorna como está
        if (dateString.includes('/')) {
            return dateString;
        }
        
        // Se é uma data ISO ou timestamp, converte para formato brasileiro
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString; // Retorna como está se não conseguir converter
            }
            return date.toLocaleDateString('pt-BR');
        } catch (err) {
            return dateString; // Retorna como está em caso de erro
        }
    };
    const navigate = useNavigate();
    const [exportedOrders, setExportedOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedFactory, setSelectedFactory] = useState(null);
    const [factories, setFactories] = useState([]);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [orderComments, setOrderComments] = useState([]);
    
    // Estados para containers
    const [containers, setContainers] = useState([]);
    const [loadingContainers, setLoadingContainers] = useState(false);
    
    // Estados para busca e filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('exportedAt'); // exportedAt, factoryName, totalAmount, totalItems
    const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
    const [statusFilter, setStatusFilter] = useState(''); // Filtro por status
    
    // Opções de status para as cotações
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

    // Função para filtrar e ordenar pedidos
    const filterAndSortOrders = (orders, search, sortField, sortDirection, status) => {
        let filtered = orders;
        
        // Aplicar filtro de busca
        if (search && search.trim() !== '') {
            const searchLower = search.toLowerCase();
            filtered = orders.filter(order => {
                // Buscar em todos os campos relevantes
                const searchableFields = [
                    order.factoryName,
                    order.importName,
                    order.dataPedido,
                    order.lotePedido,
                    order.totalAmount?.toString(),
                    order.totalItems?.toString(),
                    order.totalCBM?.toString(),
                    // Buscar também nos produtos das cotações
                    ...order.quotes.map(quote => [
                        quote.ref,
                        quote.description,
                        quote.name,
                        quote.remark,
                        quote.obs,
                        quote.unit,
                        quote.marca,
                        quote.nomeInvoiceEN,
                        quote.nomeDI,
                        quote.nomeRavi
                    ].filter(Boolean)).flat()
                ];
                
                return searchableFields.some(field => 
                    field && field.toString().toLowerCase().includes(searchLower)
                );
            });
        }
        
        // Aplicar filtro de status
        if (status && status.trim() !== '') {
            filtered = filtered.filter(order => {
                // Verificar se alguma cotação do pedido tem o status selecionado
                return order.quotes.some(quote => quote.status === status);
            });
        }
        
        // Aplicar ordenação
        filtered.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortField) {
                case 'exportedAt':
                    aValue = a.exportedAt instanceof Date ? a.exportedAt : new Date(a.exportedAt);
                    bValue = b.exportedAt instanceof Date ? b.exportedAt : new Date(b.exportedAt);
                    break;
                case 'factoryName':
                    aValue = a.factoryName || '';
                    bValue = b.factoryName || '';
                    break;
                case 'totalAmount':
                    aValue = a.totalAmount || 0;
                    bValue = b.totalAmount || 0;
                    break;
                case 'totalItems':
                    aValue = a.totalItems || 0;
                    bValue = b.totalItems || 0;
                    break;
                case 'totalCBM':
                    aValue = a.totalCBM || 0;
                    bValue = b.totalCBM || 0;
                    break;
                case 'dataPedido':
                    aValue = a.dataPedido || '';
                    bValue = b.dataPedido || '';
                    break;
                case 'lotePedido':
                    aValue = a.lotePedido || '';
                    bValue = b.lotePedido || '';
                    break;
                default:
                    aValue = a.exportedAt instanceof Date ? a.exportedAt : new Date(a.exportedAt);
                    bValue = b.exportedAt instanceof Date ? b.exportedAt : new Date(b.exportedAt);
            }
            
            if (sortDirection === 'asc') {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            } else {
                return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
            }
        });
        
        return filtered;
    };

    // Função para atualizar filtros
    const handleSearchChange = (value) => {
        setSearchTerm(value);
        const filtered = filterAndSortOrders(exportedOrders, value, sortBy, sortOrder);
        setFilteredOrders(filtered);
    };

    const handleSortChange = (field) => {
        const newSortOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
        setSortBy(field);
        setSortOrder(newSortOrder);
        const filtered = filterAndSortOrders(exportedOrders, searchTerm, field, newSortOrder, statusFilter);
        setFilteredOrders(filtered);
    };

    // Função para obter nome do campo de ordenação
    const getSortFieldName = (field) => {
        const fieldNames = {
            'exportedAt': 'Data de Exportação',
            'factoryName': 'Nome da Fábrica',
            'totalAmount': 'Valor Total',
            'totalItems': 'Total de Itens',
            'totalCBM': 'CBM Total',
            'dataPedido': 'Data do Pedido',
            'lotePedido': 'Lote do Pedido'
        };
        return fieldNames[field] || field;
    };

    // Função para limpar filtros
    const clearFilters = () => {
        setSearchTerm('');
        setSortBy('exportedAt');
        setSortOrder('desc');
        setFilteredOrders(exportedOrders);
    };

    // Função para carregar containers disponíveis
    const loadContainers = async () => {
        try {
            setLoadingContainers(true);
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
            
        } catch (err) {
            console.error('❌ Erro ao carregar containers:', err);
        } finally {
            setLoadingContainers(false);
        }
    };

    // Função para associar/desassociar container a uma cotação
    const handleContainerAssociation = async (quoteId, containerId) => {
        try {
            console.log(`🔄 Associando cotação ${quoteId} ao container ${containerId}`);
            
            const quoteRef = doc(db, 'quotes', quoteId);
            const updateData = {
                containerId: containerId || null,
                containerRef: containerId ? containers.find(c => c.id === containerId)?.refContainer || null : null,
                updatedAt: new Date()
            };
            
            await updateDoc(quoteRef, updateData);
            
            console.log(`✅ Cotação ${quoteId} ${containerId ? 'associada' : 'desassociada'} ao container`);
            
            // Recarregar pedidos exportados para refletir as mudanças
            await loadExportedOrders();
            
        } catch (error) {
            console.error('❌ Erro ao associar container:', error);
            setError('Erro ao associar container: ' + error.message);
        }
    };

    // Função para corrigir automaticamente os dados de pedido nas cotações exportadas
    const fixPedidoDataInExportedQuotes = async () => {
        try {
            console.log('🔧 [FIX PEDIDO] Iniciando correção automática de dados de pedido...');
            
            // Buscar todas as cotações exportadas
            const quotesRef = collection(db, 'quotes');
            const exportedQuery = query(quotesRef, where('exported', '==', true));
            const exportedSnapshot = await getDocs(exportedQuery);
            
            console.log(`📊 [FIX PEDIDO] Encontradas ${exportedSnapshot.size} cotações exportadas`);
            
            // Buscar todas as importações
            const importsRef = collection(db, 'quoteImports');
            const importsSnapshot = await getDocs(importsRef);
            
            console.log(`📊 [FIX PEDIDO] Encontradas ${importsSnapshot.size} importações`);
            
            // Criar mapa de importações por ID
            const importsMap = {};
            importsSnapshot.forEach(doc => {
                const data = doc.data();
                importsMap[doc.id] = data;
                console.log(`📦 [FIX PEDIDO] Importação ${doc.id}:`, {
                    dataPedido: data.dataPedido,
                    lotePedido: data.lotePedido,
                    factoryId: data.factoryId
                });
            });
            
            let fixedCount = 0;
            let skippedCount = 0;
            
            // Para cada cotação exportada, tentar encontrar dados de pedido na importação correspondente
            for (const quoteDoc of exportedSnapshot.docs) {
                const quoteData = quoteDoc.data();
                const quoteId = quoteDoc.id;
                
                // Log específico para cotação Mercadão
                const isMercadao = quoteData.quoteName === 'Mercadão' || 
                                 quoteData.factoryName === 'Mercadão' ||
                                 (quoteData.factoryId === 'b9lgbmnlVIesdodlse6C');
                
                if (isMercadao) {
                    console.log(`🚨 [FIX PEDIDO] PROCESSANDO COTAÇÃO MERCADÃO:`, {
                        quoteId,
                        factoryId: quoteData.factoryId,
                        factoryName: quoteData.factoryName,
                        quoteName: quoteData.quoteName,
                        dataPedido: quoteData.dataPedido,
                        lotePedido: quoteData.lotePedido,
                        createdAt: quoteData.createdAt,
                        allData: quoteData
                    });
                }
                
                // Verificar se já tem dados de pedido válidos
                const hasDataPedido = quoteData.dataPedido && 
                    typeof quoteData.dataPedido === 'string' && 
                    quoteData.dataPedido.trim() !== '';
                const hasLotePedido = quoteData.lotePedido && 
                    typeof quoteData.lotePedido === 'string' && 
                    quoteData.lotePedido.trim() !== '';
                
                if (hasDataPedido && hasLotePedido) {
                    console.log(`⏭️ [FIX PEDIDO] Cotação ${quoteId} já tem dados de pedido, pulando`);
                    if (isMercadao) {
                        console.log(`🚨 [FIX PEDIDO] MERCADÃO já tem dados:`, {
                            dataPedido: quoteData.dataPedido,
                            lotePedido: quoteData.lotePedido
                        });
                    }
                    skippedCount++;
                    continue;
                }
                
                // Tentar encontrar a importação correspondente
                const quoteCreatedAt = quoteData.createdAt?.toDate?.();
                if (!quoteCreatedAt) {
                    console.log(`⚠️ [FIX PEDIDO] Cotação ${quoteId} sem createdAt, pulando`);
                    if (isMercadao) {
                        console.log(`🚨 [FIX PEDIDO] MERCADÃO sem createdAt!`);
                    }
                    skippedCount++;
                    continue;
                }
                
                const importId = quoteCreatedAt.toISOString().substring(0, 16);
                const importData = importsMap[importId];
                
                if (isMercadao) {
                    console.log(`🚨 [FIX PEDIDO] MERCADÃO - Buscando importação:`, {
                        quoteCreatedAt: quoteCreatedAt.toISOString(),
                        importId,
                        importData: importData ? {
                            dataPedido: importData.dataPedido,
                            lotePedido: importData.lotePedido,
                            factoryId: importData.factoryId
                        } : 'NÃO ENCONTRADA'
                    });
                }
                
                if (!importData) {
                    console.log(`⚠️ [FIX PEDIDO] Importação ${importId} não encontrada para cotação ${quoteId}`);
                    if (isMercadao) {
                        console.log(`🚨 [FIX PEDIDO] MERCADÃO - Importação não encontrada! Tentando outras estratégias...`);
                        
                        // Tentar encontrar por factoryId
                        const factoryImports = Object.entries(importsMap).filter(([, data]) => 
                            data.factoryId === quoteData.factoryId
                        );
                        
                        console.log(`🚨 [FIX PEDIDO] MERCADÃO - Importações da mesma fábrica:`, factoryImports.map(([importId, data]) => ({
                            importId,
                            dataPedido: data.dataPedido,
                            lotePedido: data.lotePedido,
                            factoryId: data.factoryId
                        })));
                        
                        if (factoryImports.length > 0) {
                            // Usar a primeira importação da mesma fábrica que tenha dados de pedido
                            const validImport = factoryImports.find(([, data]) => 
                                (data.dataPedido && data.dataPedido.trim() !== '') ||
                                (data.lotePedido && data.lotePedido.trim() !== '')
                            );
                            
                            if (validImport) {
                                const [foundImportId, foundImportData] = validImport;
                                console.log(`🚨 [FIX PEDIDO] MERCADÃO - Usando importação alternativa:`, {
                                    importId: foundImportId,
                                    dataPedido: foundImportData.dataPedido,
                                    lotePedido: foundImportData.lotePedido
                                });
                                
                                // Atualizar a cotação com os dados da importação encontrada
                                const updateData = {};
                                if (foundImportData.dataPedido && foundImportData.dataPedido.trim() !== '') {
                                    updateData.dataPedido = foundImportData.dataPedido.trim();
                                }
                                if (foundImportData.lotePedido && foundImportData.lotePedido.trim() !== '') {
                                    updateData.lotePedido = foundImportData.lotePedido.trim();
                                }
                                
                                if (Object.keys(updateData).length > 0) {
                                    const quoteRef = doc(db, 'quotes', quoteId);
                                    await updateDoc(quoteRef, {
                                        ...updateData,
                                        updatedAt: new Date()
                                    });
                                    
                                    console.log(`✅ [FIX PEDIDO] MERCADÃO corrigida com dados alternativos:`, updateData);
                                    fixedCount++;
                                    continue;
                                }
                            }
                        }
                    }
                    skippedCount++;
                    continue;
                }
                
                // Verificar se a importação tem dados de pedido
                const importHasDataPedido = importData.dataPedido && 
                    typeof importData.dataPedido === 'string' && 
                    importData.dataPedido.trim() !== '';
                const importHasLotePedido = importData.lotePedido && 
                    typeof importData.lotePedido === 'string' && 
                    importData.lotePedido.trim() !== '';
                
                if (isMercadao) {
                    console.log(`🚨 [FIX PEDIDO] MERCADÃO - Dados da importação encontrada:`, {
                        importId,
                        dataPedido: importData.dataPedido,
                        lotePedido: importData.lotePedido,
                        importHasDataPedido,
                        importHasLotePedido
                    });
                }
                
                if (!importHasDataPedido && !importHasLotePedido) {
                    console.log(`⚠️ [FIX PEDIDO] Importação ${importId} não tem dados de pedido`);
                    if (isMercadao) {
                        console.log(`🚨 [FIX PEDIDO] MERCADÃO - Importação encontrada mas sem dados de pedido!`);
                    }
                    skippedCount++;
                    continue;
                }
                
                // Atualizar a cotação com os dados da importação
                const updateData = {};
                if (importHasDataPedido) {
                    updateData.dataPedido = importData.dataPedido.trim();
                }
                if (importHasLotePedido) {
                    updateData.lotePedido = importData.lotePedido.trim();
                }
                
                if (Object.keys(updateData).length > 0) {
                    const quoteRef = doc(db, 'quotes', quoteId);
                    await updateDoc(quoteRef, {
                        ...updateData,
                        updatedAt: new Date()
                    });
                    
                    console.log(`✅ [FIX PEDIDO] Cotação ${quoteId} corrigida:`, updateData);
                    if (isMercadao) {
                        console.log(`🚨 [FIX PEDIDO] MERCADÃO CORRIGIDA COM SUCESSO!`, updateData);
                    }
                    fixedCount++;
                }
            }
            
            console.log(`📊 [FIX PEDIDO] Correção concluída: ${fixedCount} cotações corrigidas, ${skippedCount} puladas`);
            
            // Recarregar dados após correção
            await loadExportedOrders();
            
            return { fixedCount, skippedCount };
            
        } catch (error) {
            console.error('❌ [FIX PEDIDO] Erro ao corrigir dados de pedido:', error);
            throw error;
        }
    };


    // Função para processar dados das cotações exportadas (usada tanto pelo listener quanto pelo carregamento manual)
    const processExportedOrders = async (snapshot) => {
        try {
            console.log(`📊 [EXPORTED ORDERS] Processando ${snapshot.size} documentos...`);
            
            // Buscar todas as fábricas para mapear factoryId -> factoryName
            const factoriesRef = collection(db, 'fabricas');
            const factoriesSnapshot = await getDocs(factoriesRef);
            const factoriesMap = new Map();
            
            console.log(`🏭 [EXPORTED ORDERS] Encontradas ${factoriesSnapshot.size} fábricas na coleção`);
            
            factoriesSnapshot.forEach(doc => {
                const factoryData = doc.data();
                console.log(`🏭 [EXPORTED ORDERS] Dados da fábrica ${doc.id}:`, factoryData);
                
                const factoryName = factoryData.name || doc.id;
                factoriesMap.set(doc.id, factoryName);
                console.log(`🏭 [EXPORTED ORDERS] Mapeando fábrica: ${doc.id} -> ${factoryName}`, {
                    docId: doc.id,
                    factoryData,
                    name: factoryData.name,
                    finalName: factoryName
                });
            });
            
            console.log(`🏭 [EXPORTED ORDERS] Mapeamento de fábricas carregado:`, Array.from(factoriesMap.entries()));
            
            const groupedOrders = {};
            
            snapshot.forEach(doc => {
                const data = doc.data();
                
                // Log específico para cotação "Mercadão"
                const isMercadao = data.quoteName === 'Mercadão' || data.importName === 'Mercadão' || 
                                 (data.description && data.description.includes('Mercadão')) ||
                                 (data.ref && data.ref.includes('Mercadão')) ||
                                 (data.factoryName && data.factoryName.includes('Mercadão'));
                
                if (isMercadao) {
                    console.log(`🚨 [EXPORTED ORDERS] INVESTIGAÇÃO ESPECÍFICA - Cotação Mercadão encontrada:`, {
                        docId: doc.id,
                        factoryId: data.factoryId,
                        importId: data.importId,
                        quoteName: data.quoteName,
                        importName: data.importName,
                        factoryName: data.factoryName,
                        dataPedido: data.dataPedido,
                        lotePedido: data.lotePedido,
                        dataPedidoType: typeof data.dataPedido,
                        lotePedidoType: typeof data.lotePedido,
                        exported: data.exported,
                        exportedAt: data.exportedAt,
                        allData: data
                    });
                }
                
                console.log(`📄 [EXPORTED ORDERS] Processando documento ${doc.id}:`, {
                    exported: data.exported,
                    exportedAt: data.exportedAt,
                    factoryId: data.factoryId,
                    factoryName: data.factoryName,
                    ref: data.ref,
                    dataPedido: data.dataPedido,
                    lotePedido: data.lotePedido
                });
                
                // Usar factoryId como identificador único
                const factoryId = data.factoryId || 'unknown';
                const importId = data.importId || data.createdAt?.toDate?.()?.toISOString().substring(0, 16);
                
                // Buscar o nome real da fábrica usando o factoryId
                const realFactoryName = factoriesMap.get(factoryId) || data.factoryName || factoryId;
                
                console.log(`🏭 [EXPORTED ORDERS] FactoryId: ${factoryId} -> FactoryName: ${realFactoryName}`, {
                    factoryId,
                    factoryNameFromMap: factoriesMap.get(factoryId),
                    factoryNameFromData: data.factoryName,
                    finalFactoryName: realFactoryName
                });
                
                if (!groupedOrders[factoryId]) {
                    groupedOrders[factoryId] = {};
                }
                
                if (!groupedOrders[factoryId][importId]) {
                    groupedOrders[factoryId][importId] = {
                        factoryId,
                        importId,
                        factoryName: realFactoryName,
                        importName: data.quoteName || data.importName || `Importação ${importId}`,
                        exportedAt: data.exportedAt?.toDate?.() || new Date(),
                        dataPedido: '', // Será preenchido com dados da primeira cotação
                        lotePedido: '', // Será preenchido com dados da primeira cotação
                        quotes: [],
                        totalAmount: 0,
                        totalCBM: 0,
                        totalItems: 0
                    };
                }
                
                groupedOrders[factoryId][importId].quotes.push({
                    id: doc.id,
                    ...data
                });
                
                // Capturar dataPedido e lotePedido - sempre sobrescrever com dados mais recentes
                // Verificar se os campos existem e não estão vazios
                const hasDataPedido = data.dataPedido && 
                    typeof data.dataPedido === 'string' && 
                    data.dataPedido.trim() !== '';
                    
                const hasLotePedido = data.lotePedido && 
                    typeof data.lotePedido === 'string' && 
                    data.lotePedido.trim() !== '';
                
                if (hasDataPedido || hasLotePedido) {
                    console.log(`📅 [EXPORTED ORDERS] Encontrados dados de pedido na cotação ${doc.id}:`, {
                        dataPedido: data.dataPedido,
                        lotePedido: data.lotePedido,
                        factoryId,
                        importId,
                        hasDataPedido,
                        hasLotePedido
                    });
                    
                    // Log específico para Mercadão
                    if (isMercadao) {
                        console.log(`🚨 [EXPORTED ORDERS] MERCADÃO - Atualizando dados de pedido:`, {
                            before: {
                                dataPedido: groupedOrders[factoryId][importId].dataPedido,
                                lotePedido: groupedOrders[factoryId][importId].lotePedido
                            },
                            new: {
                                dataPedido: data.dataPedido,
                                lotePedido: data.lotePedido
                            }
                        });
                    }
                    
                    // Sempre sobrescrever dataPedido se existir
                    if (hasDataPedido) {
                        groupedOrders[factoryId][importId].dataPedido = data.dataPedido.trim();
                        console.log(`✅ [EXPORTED ORDERS] Data Pedido atualizada: "${data.dataPedido.trim()}"`);
                        
                        if (isMercadao) {
                            console.log(`🚨 [EXPORTED ORDERS] MERCADÃO - Data Pedido definida como: "${data.dataPedido.trim()}"`);
                        }
                    }
                    
                    // Sempre sobrescrever lotePedido se existir
                    if (hasLotePedido) {
                        groupedOrders[factoryId][importId].lotePedido = data.lotePedido.trim();
                        console.log(`✅ [EXPORTED ORDERS] Lote Pedido atualizado: "${data.lotePedido.trim()}"`);
                        
                        if (isMercadao) {
                            console.log(`🚨 [EXPORTED ORDERS] MERCADÃO - Lote Pedido definido como: "${data.lotePedido.trim()}"`);
                        }
                    }
                } else {
                    console.log(`⚠️ [EXPORTED ORDERS] Cotação ${doc.id} sem dados de pedido:`, {
                        dataPedido: data.dataPedido,
                        lotePedido: data.lotePedido,
                        dataPedidoType: typeof data.dataPedido,
                        lotePedidoType: typeof data.lotePedido
                    });
                    
                    // Log específico para Mercadão sem dados
                    if (isMercadao) {
                        console.log(`🚨 [EXPORTED ORDERS] MERCADÃO - SEM DADOS DE PEDIDO!`, {
                            dataPedido: data.dataPedido,
                            lotePedido: data.lotePedido,
                            dataPedidoType: typeof data.dataPedido,
                            lotePedidoType: typeof data.lotePedido,
                            allData: data
                        });
                    }
                }
                
                // Calcular totais
                groupedOrders[factoryId][importId].totalAmount += data.amount || 0;
                // Priorizar cbmTotal se existir, senão calcular cbm * ctns
                const cbmTotal = data.cbmTotal || (data.cbm || 0) * (data.ctns || 0);
                groupedOrders[factoryId][importId].totalCBM += cbmTotal;
                groupedOrders[factoryId][importId].totalItems += 1;
            });

            // Converter para array e ordenar
            const ordersArray = [];
            Object.values(groupedOrders).forEach(factoryOrders => {
                Object.values(factoryOrders).forEach(order => {
                    ordersArray.push(order);
                });
            });

            // Ordenar por data de exportação (mais recentes primeiro)
            ordersArray.sort((a, b) => {
                const dateA = a.exportedAt instanceof Date ? a.exportedAt : new Date(a.exportedAt);
                const dateB = b.exportedAt instanceof Date ? b.exportedAt : new Date(b.exportedAt);
                return dateB - dateA;
            });

            console.log(`📊 [EXPORTED ORDERS] Total de pedidos agrupados: ${ordersArray.length}`);
            console.log('📋 [EXPORTED ORDERS] Pedidos encontrados:', ordersArray.map(order => ({
                factoryName: order.factoryName,
                importName: order.importName,
                totalItems: order.totalItems,
                exportedAt: order.exportedAt,
                dataPedido: order.dataPedido,
                lotePedido: order.lotePedido
            })));
            
            // Log específico para verificar o resultado final da cotação Mercadão
            const mercadaoOrder = ordersArray.find(order => 
                order.importName === 'Mercadão' || 
                order.factoryName === 'Mercadão' ||
                (order.importName && order.importName.includes('Mercadão'))
            );
            
            if (mercadaoOrder) {
                console.log(`🚨 [EXPORTED ORDERS] RESULTADO FINAL - Cotação Mercadão:`, {
                    factoryName: mercadaoOrder.factoryName,
                    importName: mercadaoOrder.importName,
                    dataPedido: mercadaoOrder.dataPedido,
                    lotePedido: mercadaoOrder.lotePedido,
                    totalItems: mercadaoOrder.totalItems,
                    exportedAt: mercadaoOrder.exportedAt,
                    quotes: mercadaoOrder.quotes?.length || 0
                });
            } else {
                console.log(`⚠️ [EXPORTED ORDERS] Cotação Mercadão NÃO ENCONTRADA nos pedidos finais!`);
                console.log(`📋 [EXPORTED ORDERS] Pedidos disponíveis:`, ordersArray.map(order => ({
                    factoryName: order.factoryName,
                    importName: order.importName
                })));
            }

            setExportedOrders(ordersArray);
            
            // Aplicar filtros atuais
            const filtered = filterAndSortOrders(ordersArray, searchTerm, sortBy, sortOrder, statusFilter);
            setFilteredOrders(filtered);
            
            // Extrair fábricas únicas
            const uniqueFactories = [...new Set(ordersArray.map(order => order.factoryName))];
            setFactories(uniqueFactories);
            
            setLoading(false);
            
        } catch (error) {
            console.error('❌ [EXPORTED ORDERS] Erro ao processar dados:', error);
            setError('Erro ao processar dados: ' + error.message);
            setLoading(false);
        }
    };

    const loadExportedOrders = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔍 [EXPORTED ORDERS] Iniciando busca por cotações exportadas...');
            
            // Carregar containers junto com os pedidos exportados
            await loadContainers();

            // Buscar todas as cotações marcadas como exportadas
            const quotesRef = collection(db, 'quotes');
            const exportedQuery = query(
                quotesRef,
                where('exported', '==', true)
            );

            console.log('🔍 [EXPORTED ORDERS] Query criada, executando...');
            const snapshot = await getDocs(exportedQuery);
            console.log(`📊 [EXPORTED ORDERS] Query executada. Documentos encontrados: ${snapshot.size}`);
            
            // Usar a função processExportedOrders para processar os dados
            await processExportedOrders(snapshot);
            
            // Remover correção automática para evitar atualizações constantes
            // Os dados serão corrigidos apenas quando necessário
            
        } catch (error) {
            console.error('❌ [EXPORTED ORDERS] Erro ao carregar pedidos exportados:', error);
            setError('Erro ao carregar pedidos exportados: ' + error.message);
            setLoading(false);
        }
    };

    const handleExportToExcel = async (order) => {
        try {
            setExporting(true);
            
            // Preparar dados para exportação
            const exportData = {
                factoryName: order.factoryName,
                importName: order.importName,
                exportedAt: order.exportedAt,
                quotes: order.quotes.map(quote => ({
                    ref: quote.ref,
                    description: quote.description,
                    name: quote.name,
                    unitPrice: quote.unitPrice,
                    quantity: quote.quantity,
                    amount: quote.amount,
                    cbm: quote.cbm,
                    cbmTotal: quote.cbmTotal,
                    moq: quote.moq,
                    moqLogo: quote.moqLogo,
                    comments: quote.comments,
                    pesoUnitario: quote.pesoUnitario,
                    ncm: quote.ncm,
                    marca: quote.marca,
                    codigoRavi: quote.codigoRavi,
                    ean: quote.ean,
                    dun: quote.dun,
                    nomeInvoiceEN: quote.nomeInvoiceEN,
                    nomeDI: quote.nomeDI,
                    nomeRavi: quote.nomeRavi,
                    observacaoPedido: quote.observacaoPedido,
                    remark: quote.remark,
                    observacao: quote.observacao,
                    foto: quote.foto
                }))
            };

            // Gerar nome do arquivo
            const fileName = `Pedido_Exportado_${order.factoryName.replace(/\s+/g, '_')}_${order.importName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

            // Exportar usando o serviço existente
            await excelExportService.exportQuotesToExcel(exportData.quotes, fileName, {
                factoryName: order.factoryName,
                importName: order.importName,
                exportedAt: order.exportedAt,
                totalAmount: order.totalAmount,
                totalCBM: order.totalCBM,
                totalItems: order.totalItems
            });

            // Mostrar sucesso
            setError(null);
            alert(`Pedido exportado com sucesso! Arquivo: ${fileName}`);
            
        } catch (error) {
            console.error('Erro ao exportar:', error);
            setError('Erro ao exportar pedido: ' + error.message);
        } finally {
            setExporting(false);
        }
    };

    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setShowDetailsModal(true);
        loadOrderComments(order);
    };

    // Função para carregar comentários do pedido
    const loadOrderComments = async (order) => {
        try {
            console.log('🔄 Carregando comentários para o pedido:', order.factoryId, order.importId);
            
            const q = query(
                collection(db, 'importComments'),
                where('factoryId', '==', order.factoryId),
                where('importId', '==', order.importId)
            );
            
            const querySnapshot = await getDocs(q);
            const comments = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                comments.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt)
                });
            });
            
            // Ordenar comentários por data (mais recentes primeiro)
            comments.sort((a, b) => b.createdAt - a.createdAt);
            
            console.log(`✅ Comentários carregados: ${comments.length} comentários`);
            setOrderComments(comments);
            
        } catch (error) {
            console.error('❌ Erro ao carregar comentários:', error);
            setOrderComments([]);
        }
    };

    const handleCloseDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedOrder(null);
        setOrderComments([]);
    };

    // Função para atualizar status de uma cotação
    const handleStatusChange = async (quoteId, newStatus) => {
        try {
            console.log(`🔄 Atualizando status da cotação ${quoteId} para: ${newStatus}`);
            
            const quoteRef = doc(db, 'quotes', quoteId);
            await updateDoc(quoteRef, {
                status: newStatus,
                statusUpdatedAt: new Date()
            });
            
            console.log(`✅ Status atualizado com sucesso para: ${newStatus}`);
            
            // Atualizar a lista de pedidos exportados
            await loadExportedOrders();
            
        } catch (error) {
            console.error('❌ Erro ao atualizar status:', error);
            setError('Erro ao atualizar status: ' + error.message);
        }
    };

    // Função para confirmar exclusão de pedido
    const handleDeleteOrder = (order) => {
        setOrderToDelete(order);
        setShowDeleteModal(true);
    };

    // Função para cancelar exclusão
    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setOrderToDelete(null);
    };

    // Função para executar exclusão
    const handleConfirmDelete = async () => {
        if (!orderToDelete) return;

        try {
            setDeleting(true);
            setError(null);

            console.log('🗑️ Iniciando exclusão do pedido:', orderToDelete);

            // Excluir todas as cotações do pedido
            const deletePromises = orderToDelete.quotes.map(async (quote) => {
                try {
                    const quoteRef = doc(db, 'quotes', quote.id);
                    await deleteDoc(quoteRef);
                    console.log(`✅ Cotação ${quote.id} excluída`);
                } catch (deleteError) {
                    console.error(`❌ Erro ao excluir cotação ${quote.id}:`, deleteError);
                    throw deleteError;
                }
            });

            await Promise.all(deletePromises);

            console.log(`✅ Pedido "${orderToDelete.factoryName} - ${orderToDelete.importName}" excluído com sucesso`);
            
            // Fechar modal e limpar estado
            setShowDeleteModal(false);
            setOrderToDelete(null);

            // Recarregar dados
            await loadExportedOrders();

        } catch (error) {
            console.error('❌ Erro ao excluir pedido:', error);
            setError('Erro ao excluir pedido: ' + error.message);
        } finally {
            setDeleting(false);
        }
    };

    // Carregar dados iniciais
    useEffect(() => {
        loadExportedOrders();
    }, []);

    if (loading) {
        return (
            <Container className="mt-4">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                    <Spinner animation="border" variant="primary" />
                    <Typography variant="h6" sx={{ ml: 2 }}>
                        Carregando pedidos exportados...
                    </Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            {/* Cabeçalho */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => navigate('/admin/dashboard')} sx={{ mr: 2 }}>
                    <ArrowBack />
                </IconButton>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    Pedidos Exportados
                </Typography>
                <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                    <Button
                        variant="outline-warning"
                        size="sm"
                        onClick={fixPedidoDataInExportedQuotes}
                        disabled={loading}
                    >
                        🔧 Corrigir Dados
                    </Button>
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={loadExportedOrders}
                        disabled={loading}
                    >
                        <Refresh sx={{ fontSize: '16px', mr: 1 }} />
                        Atualizar
                    </Button>
                </Box>
            </Box>

            {/* Barra de Busca e Filtros */}
            <Card className="mb-4">
                <Card.Body>
                    <Row className="g-3">
                        {/* Campo de Busca */}
                        <Col xs={12} md={6}>
                            <div className="position-relative">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Buscar em todos os campos (REF, descrição, fábrica, data, lote, etc.)"
                                    value={searchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    style={{ paddingLeft: '40px' }}
                                />
                                <span 
                                    className="material-icons position-absolute" 
                                    style={{ 
                                        left: '12px', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)', 
                                        color: '#6c757d',
                                        fontSize: '20px'
                                    }}
                                >
                                    search
                                </span>
                            </div>
                        </Col>
                        
                        {/* Filtros de Ordenação */}
                        <Col xs={12} md={6}>
                            <div className="d-flex gap-2 flex-wrap">
                                <Button
                                    variant={sortBy === 'exportedAt' ? 'primary' : 'outline-secondary'}
                                    size="sm"
                                    onClick={() => handleSortChange('exportedAt')}
                                >
                                    Data Exportação {sortBy === 'exportedAt' && (sortOrder === 'desc' ? '↓' : '↑')}
                                </Button>
                                <Button
                                    variant={sortBy === 'factoryName' ? 'primary' : 'outline-secondary'}
                                    size="sm"
                                    onClick={() => handleSortChange('factoryName')}
                                >
                                    Fábrica {sortBy === 'factoryName' && (sortOrder === 'desc' ? '↓' : '↑')}
                                </Button>
                                <Button
                                    variant={sortBy === 'totalAmount' ? 'primary' : 'outline-secondary'}
                                    size="sm"
                                    onClick={() => handleSortChange('totalAmount')}
                                >
                                    Valor {sortBy === 'totalAmount' && (sortOrder === 'desc' ? '↓' : '↑')}
                                </Button>
                                <Button
                                    variant={sortBy === 'totalItems' ? 'primary' : 'outline-secondary'}
                                    size="sm"
                                    onClick={() => handleSortChange('totalItems')}
                                >
                                    Itens {sortBy === 'totalItems' && (sortOrder === 'desc' ? '↓' : '↑')}
                                </Button>
                                <Button
                                    variant={sortBy === 'dataPedido' ? 'primary' : 'outline-secondary'}
                                    size="sm"
                                    onClick={() => handleSortChange('dataPedido')}
                                >
                                    Data Pedido {sortBy === 'dataPedido' && (sortOrder === 'desc' ? '↓' : '↑')}
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={clearFilters}
                                    disabled={!searchTerm && sortBy === 'exportedAt' && sortOrder === 'desc'}
                                >
                                    Limpar
                                </Button>
                            </div>
                        </Col>
                    </Row>
                    
                    {/* Informações dos Filtros */}
                    {(searchTerm || sortBy !== 'exportedAt' || sortOrder !== 'desc') && (
                        <div className="mt-3">
                            <small className="text-muted">
                                {searchTerm && `Busca: "${searchTerm}"`}
                                {searchTerm && (sortBy !== 'exportedAt' || sortOrder !== 'desc') && ' • '}
                                {(sortBy !== 'exportedAt' || sortOrder !== 'desc') && 
                                    `Ordenado por: ${getSortFieldName(sortBy)} ${sortOrder === 'desc' ? '(decrescente)' : '(crescente)'}`
                                }
                                {' • '}
                                {filteredOrders.length} de {exportedOrders.length} pedidos
                            </small>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Filtros */}
            <Card className="mb-4">
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={2}>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                Filtrar por Fábrica:
                            </Typography>
                            <select 
                                className="form-select"
                                value={selectedFactory || ''}
                                onChange={(e) => setSelectedFactory(e.target.value || null)}
                            >
                                <option value="">Todas as Fábricas</option>
                                {factories.map(factory => (
                                    <option key={factory} value={factory}>
                                        {factory}
                                    </option>
                                ))}
                            </select>
                        </Col>
                        <Col md={2}>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                Filtrar por Status:
                            </Typography>
                            <select 
                                className="form-select"
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    const filtered = filterAndSortOrders(exportedOrders, searchTerm, sortBy, sortOrder, e.target.value);
                                    setFilteredOrders(filtered);
                                }}
                            >
                                {statusOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </Col>
                        <Col md={2}>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                Total de Pedidos:
                            </Typography>
                            <Chip 
                                label={filteredOrders.length} 
                                color="primary" 
                                sx={{ fontSize: '1rem', fontWeight: 'bold' }}
                            />
                        </Col>
                        <Col md={6}>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                Valor Total Exportado:
                            </Typography>
                            <Typography variant="h5" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                {formatCurrency(filteredOrders.reduce((total, order) => total + order.totalAmount, 0))}
                            </Typography>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Lista de Pedidos Exportados */}
            {filteredOrders.length === 0 ? (
                <Card>
                    <Card.Body className="text-center py-5">
                        <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                            Nenhum pedido exportado encontrado
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {selectedFactory 
                                ? `Não há pedidos exportados para ${selectedFactory}`
                                : 'Não há pedidos marcados como exportados'
                            }
                        </Typography>
                    </Card.Body>
                </Card>
            ) : (
                <Row className="g-3">
                    {filteredOrders.map((order, index) => (
                        <Col key={index} md={6} lg={4}>
                            <Card className="shadow-sm">
                                <Card.Header className="bg-dark text-white">
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0 }}>
                                            {order.factoryName}
                                        </Typography>
                                        {(() => {
                                            const currentStatus = order.quotes[0]?.status || '';
                                            const statusInfo = getStatusInfo(currentStatus);
                                            return (
                                                <Chip 
                                                    label={statusInfo.label} 
                                                    size="small" 
                                                    sx={{ 
                                                        backgroundColor: statusInfo.bgColor, 
                                                        color: statusInfo.color,
                                                        fontWeight: 'bold',
                                                        borderRadius: '3px',
                                                        border: `1px solid ${statusInfo.bgColor}`
                                                    }}
                                                />
                                            );
                                        })()}
                                    </Box>
                                </Card.Header>
                                <Card.Body>
                                    {/* Nome da Importação */}
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#2c3e50' }}>
                                        {order.importName}
                                    </Typography>

                                    {/* Estatísticas */}
                                    <Row className="g-2 mb-3">
                                        <Col xs={4}>
                                            <Box sx={{ 
                                                p: 1, 
                                                backgroundColor: '#f8f9fa', 
                                                borderRadius: 1,
                                                textAlign: 'center',
                                                border: '1px solid #e9ecef'
                                            }}>
                                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'black' }}>
                                                    Valor Total:
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#495057' }}>
                                                    {formatCurrency(order.totalAmount)}
                                                </Typography>
                                            </Box>
                                        </Col>
                                        <Col xs={4}>
                                            <Box sx={{ 
                                                p: 1, 
                                                backgroundColor: '#f8f9fa', 
                                                borderRadius: 1,
                                                textAlign: 'center',
                                                border: '1px solid #e9ecef'
                                            }}>
                                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'black' }}>
                                                    Itens:
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#495057' }}>
                                                    {order.totalItems}
                                                </Typography>
                                            </Box>
                                        </Col>
                                        <Col xs={4}>
                                            <Box sx={{ 
                                                p: 1, 
                                                backgroundColor: '#f8f9fa', 
                                                borderRadius: 1,
                                                textAlign: 'center',
                                                border: '1px solid #e9ecef'
                                            }}>
                                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'black' }}>
                                                    CBM Total:
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#495057' }}>
                                                    {order.totalCBM.toFixed(3).replace('.', ',')} m³
                                                </Typography>
                                            </Box>
                                        </Col>
                                    </Row>


                                    {/* Exportado em e Data Pedido/Lote Pedido na mesma linha */}
                                    <Row className="g-2 mb-3">
                                        <Col xs={4}>
                                            <Box sx={{ 
                                                p: 1, 
                                                backgroundColor: '#e8f5e8', 
                                                borderRadius: 1,
                                                textAlign: 'center',
                                                border: '1px solid #4caf50'
                                            }}>
                                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                                    Exportado em:
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#2e7d32' }}>
                                                    {formatDate(order.exportedAt)}
                                                </Typography>
                                            </Box>
                                        </Col>
                                        <Col xs={4}>
                                            <Box sx={{ 
                                                p: 1, 
                                                backgroundColor: '#f8f9fa', 
                                                borderRadius: 1,
                                                textAlign: 'center',
                                                border: '1px solid #e9ecef'
                                            }}>
                                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'black' }}>
                                                    Data Pedido:
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#495057' }}>
                                                    {formatPedidoDate(order.dataPedido)}
                                                </Typography>
                                            </Box>
                                        </Col>
                                        <Col xs={4}>
                                            <Box sx={{ 
                                                p: 1, 
                                                backgroundColor: '#f8f9fa', 
                                                borderRadius: 1,
                                                textAlign: 'center',
                                                border: '1px solid #e9ecef'
                                            }}>
                                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'black' }}>
                                                    Lote Pedido:
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#495057' }}>
                                                    {order.lotePedido || 'Não informado'}
                                                </Typography>
                                            </Box>
                                        </Col>
                                    </Row>

                                    {/* Seletor de Status */}
                                    <Row className="mb-3">
                                        <Col xs={12}>
                                            <div className="d-flex align-items-center justify-content-center">
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', marginRight: 2 }}>
                                                    Status:
                                                </Typography>
                                                <select 
                                                    className="form-select"
                                                    style={{ maxWidth: '200px' }}
                                                    value={order.quotes[0]?.status || ''}
                                                    onChange={(e) => {
                                                        const quoteId = order.quotes[0]?.id;
                                                        if (quoteId) {
                                                            handleStatusChange(quoteId, e.target.value);
                                                        }
                                                    }}
                                                >
                                                    <option value="">Selecionar Status</option>
                                                    {statusOptions.slice(1).map(option => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </Col>
                                    </Row>

                                    {/* Seletor de Container */}
                                    <Row className="mb-3">
                                        <Col xs={12}>
                                            <div className="d-flex align-items-center justify-content-center">
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', marginRight: 2 }}>
                                                    Container:
                                                </Typography>
                                                <select 
                                                    className="form-select"
                                                    style={{ maxWidth: '200px' }}
                                                    value={order.quotes[0]?.containerId || ''}
                                                    onChange={(e) => {
                                                        const quoteId = order.quotes[0]?.id;
                                                        if (quoteId) {
                                                            handleContainerAssociation(quoteId, e.target.value);
                                                        }
                                                    }}
                                                    disabled={loadingContainers}
                                                >
                                                    <option value="">Selecionar Container</option>
                                                    {containers.map(container => (
                                                        <option key={container.id} value={container.id}>
                                                            {container.nome} - {container.refContainer}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {/* Exibir REF do container associado */}
                                            {order.quotes[0]?.containerRef && (
                                                <div className="text-center mt-2">
                                                    <Typography variant="caption" sx={{ 
                                                        color: '#27ae60', 
                                                        fontWeight: 'bold',
                                                        backgroundColor: '#e8f5e8',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        border: '1px solid #4caf50'
                                                    }}>
                                                        REF: {order.quotes[0].containerRef}
                                                    </Typography>
                                                </div>
                                            )}
                                        </Col>
                                    </Row>

                                    {/* Botões de Ação */}
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => handleViewDetails(order)}
                                            sx={{ minWidth: '80px' }}
                                        >
                                            Visualizar
                                        </Button>
                                        <Button
                                            variant="outline-success"
                                            size="sm"
                                            onClick={() => handleExportToExcel(order)}
                                            disabled={exporting}
                                            sx={{ minWidth: '80px' }}
                                        >
                                            {exporting ? 'Exportando...' : 'Exportar'}
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleDeleteOrder(order)}
                                            disabled={deleting}
                                            sx={{ minWidth: '80px' }}
                                        >
                                            Excluir
                                        </Button>
                                    </Box>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* Modal de Detalhes */}
            <Modal show={showDetailsModal} onHide={handleCloseDetailsModal} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Detalhes do Pedido Exportado - {selectedOrder?.factoryName}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedOrder && (
                        <div>
                            {/* Informações Gerais */}
                            <Card className="mb-3">
                                <Card.Header>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                        Informações Gerais
                                    </Typography>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                Fábrica:
                                            </Typography>
                                            <Typography variant="body1" sx={{ mb: 2 }}>
                                                {selectedOrder.factoryName}
                                            </Typography>
                                        </Col>
                                        <Col md={6}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                Importação:
                                            </Typography>
                                            <Typography variant="body1" sx={{ mb: 2 }}>
                                                {selectedOrder.importName}
                                            </Typography>
                                        </Col>
                                        <Col md={6}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                Data de Exportação:
                                            </Typography>
                                            <Typography variant="body1" sx={{ mb: 2 }}>
                                                {formatDate(selectedOrder.exportedAt)}
                                            </Typography>
                                        </Col>
                                        <Col md={6}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                Total de Itens:
                                            </Typography>
                                            <Typography variant="body1" sx={{ mb: 2 }}>
                                                {selectedOrder.totalItems}
                                            </Typography>
                                        </Col>
                                        <Col md={6}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                Data Pedido:
                                            </Typography>
                                            <Typography variant="body1" sx={{ mb: 2 }}>
                                                {formatPedidoDate(selectedOrder.dataPedido)}
                                            </Typography>
                                        </Col>
                                        <Col md={6}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                Lote Pedido:
                                            </Typography>
                                            <Typography variant="body1" sx={{ mb: 2 }}>
                                                {selectedOrder.lotePedido || 'Não informado'}
                                            </Typography>
                                        </Col>
                                        <Col md={6}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                Valor Total:
                                            </Typography>
                                            <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                                {formatCurrency(selectedOrder.totalAmount)}
                                            </Typography>
                                        </Col>
                                        <Col md={6}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                CBM Total:
                                            </Typography>
                                            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                                {selectedOrder.totalCBM.toFixed(3).replace('.', ',')} m³
                                            </Typography>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Tabela de Produtos */}
                            <Card>
                                <Card.Header>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                        Produtos do Pedido ({selectedOrder.quotes.length})
                                    </Typography>
                                </Card.Header>
                                <Card.Body>
                                    <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                                        <Table stickyHeader size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>REF</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Descrição</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Observação</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Remark</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>NCM</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Descrição EN</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>CTNS</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Unit/Ctn</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Qty</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Preço Unit.</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Valor</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Unidade</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>L</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>W</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>H</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>CBM</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>CBM Total</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Peso Bruto</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Peso Líquido</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Peso Unitário</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>MOQ</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>MOQ Logo</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Marca</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Código Ravi</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>EAN</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>DUN</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Nome Invoice EN</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Nome DI</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Nome Ravi</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Obs Pedido</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Foto</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Comentários</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {selectedOrder.quotes.map((quote, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                                            {quote.ref}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.description}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.name}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.obs || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.remark || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.ncm || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.englishDescription || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.ctns || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.unitCtn || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.qty || quote.quantity || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {formatCurrency(quote.unitPrice)}
                                                        </TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                                            {formatCurrency(quote.amount)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.unit || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.length || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.width || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.height || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.cbm || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.cbmTotal?.toFixed(3).replace('.', ',')} m³
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.grossWeight || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.netWeight || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.pesoUnitario || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.moq || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.moqLogo || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.marca || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.codigoRavi || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.ean || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.dun || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.nomeInvoiceEN || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.nomeDI || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.nomeRavi || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.observacaoPedido || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.foto || quote.photo ? (
                                                                <img 
                                                                    src={quote.foto || quote.photo} 
                                                                    alt={quote.ref}
                                                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                                />
                                                            ) : '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.comments || '-'}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Card.Body>
                            </Card>

                            {/* Card de Comentários */}
                            <Card className="mt-3">
                                <Card.Header>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                        Comentários do Pedido ({orderComments.length})
                                    </Typography>
                                </Card.Header>
                                <Card.Body>
                                    {orderComments.length > 0 ? (
                                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {orderComments.map((comment, index) => (
                                                <div 
                                                    key={comment.id || index}
                                                    className="p-3 mb-3 rounded border"
                                                    style={{ backgroundColor: '#f8f9fa' }}
                                                >
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <div className="d-flex align-items-center">
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#495057' }}>
                                                                {comment.userName || 'Usuário'}
                                                            </Typography>
                                                            <Typography variant="caption" className="ms-2" sx={{ color: '#6c757d' }}>
                                                                {comment.createdAt ? comment.createdAt.toLocaleString('pt-BR') : 'Data não disponível'}
                                                            </Typography>
                                                        </div>
                                                    </div>
                                                    
                                                    <Typography variant="body2" sx={{ color: '#212529', marginBottom: comment.imageUrl ? '10px' : '0' }}>
                                                        {comment.comment}
                                                    </Typography>
                                                    
                                                    {comment.imageUrl && (
                                                        <div className="mt-2">
                                                            <img
                                                                src={comment.imageUrl}
                                                                alt="Comentário"
                                                                style={{ 
                                                                    maxWidth: '200px', 
                                                                    maxHeight: '200px', 
                                                                    objectFit: 'cover',
                                                                    cursor: 'pointer',
                                                                    borderRadius: '4px'
                                                                }}
                                                                onClick={() => {
                                                                    // Aqui você pode implementar um lightbox se necessário
                                                                    window.open(comment.imageUrl, '_blank');
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <Typography variant="body2" sx={{ color: '#6c757d' }}>
                                                Nenhum comentário encontrado para este pedido.
                                            </Typography>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseDetailsModal}>
                        Fechar
                    </Button>
                    <Button 
                        variant="success" 
                        onClick={() => {
                            handleCloseDetailsModal();
                            handleExportToExcel(selectedOrder);
                        }}
                        disabled={exporting}
                    >
                        {exporting ? (
                            <>
                                <Spinner size="sm" className="me-2" />
                                Exportando...
                            </>
                        ) : (
                            <>
                                <Download className="me-2" />
                                Exportar para Excel
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de Confirmação de Exclusão */}
            <Modal show={showDeleteModal} onHide={handleCancelDelete} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="text-danger">
                        <Delete className="me-2" />
                        Confirmar Exclusão
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="danger" className="mb-3">
                        <Alert.Heading>⚠️ Atenção!</Alert.Heading>
                        <p className="mb-0">
                            Você está prestes a excluir permanentemente o pedido:
                        </p>
                    </Alert>
                    
                    {orderToDelete && (
                        <div className="bg-light p-3 rounded mb-3">
                            <h6 className="mb-2">
                                <strong>Fábrica:</strong> {orderToDelete.factoryName}
                            </h6>
                            <h6 className="mb-2">
                                <strong>Importação:</strong> {orderToDelete.importName}
                            </h6>
                            <h6 className="mb-2">
                                <strong>Data de Exportação:</strong> {formatDate(orderToDelete.exportedAt)}
                            </h6>
                            <h6 className="mb-2">
                                <strong>Total de Produtos:</strong> {orderToDelete.totalItems}
                            </h6>
                            <h6 className="mb-0">
                                <strong>Valor Total:</strong> {formatCurrency(orderToDelete.totalAmount)}
                            </h6>
                        </div>
                    )}
                    
                    <p className="text-danger fw-bold">
                        Esta ação não pode ser desfeita! Todas as cotações deste pedido serão excluídas permanentemente.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCancelDelete} disabled={deleting}>
                        Cancelar
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={handleConfirmDelete}
                        disabled={deleting}
                    >
                        {deleting ? (
                            <>
                                <Spinner size="sm" className="me-2" />
                                Excluindo...
                            </>
                        ) : (
                            <>
                                <Delete className="me-2" />
                                Confirmar Exclusão
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default ExportedOrders;

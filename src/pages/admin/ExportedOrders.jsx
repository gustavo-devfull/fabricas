import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Modal } from 'react-bootstrap';
import { Box, Typography, Chip, IconButton, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { ArrowBack, Download, Visibility, Refresh, Delete } from '@mui/icons-material';
import { collection, query, where, getDocs, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
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
        } catch (error) {
            return dateString; // Retorna como está em caso de erro
        }
    };
    const navigate = useNavigate();
    const [exportedOrders, setExportedOrders] = useState([]);
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

    useEffect(() => {
        loadExportedOrders();
        
        // Configurar listener em tempo real para mudanças nas cotações exportadas
        const quotesRef = collection(db, 'quotes');
        const exportedQuery = query(quotesRef, where('exported', '==', true));
        
        console.log('🔄 [EXPORTED ORDERS] Configurando listener em tempo real...');
        const unsubscribe = onSnapshot(exportedQuery, (snapshot) => {
            console.log('📡 [EXPORTED ORDERS] Mudança detectada no Firebase, atualizando dados...');
            processExportedOrders(snapshot);
        }, (error) => {
            console.error('❌ [EXPORTED ORDERS] Erro no listener:', error);
            setError('Erro ao conectar com o banco de dados: ' + error.message);
        });
        
        // Atualização automática a cada 30 segundos como fallback
        const interval = setInterval(() => {
            console.log('⏰ [EXPORTED ORDERS] Atualização automática...');
            loadExportedOrders();
        }, 30000);
        
        // Cleanup
        return () => {
            console.log('🧹 [EXPORTED ORDERS] Limpando listeners...');
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    // Função para processar dados das cotações exportadas (usada tanto pelo listener quanto pelo carregamento manual)
    const processExportedOrders = (snapshot) => {
        try {
            console.log(`📊 [EXPORTED ORDERS] Processando ${snapshot.size} documentos...`);
            
            const ordersData = [];
            const groupedOrders = {};
            
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log(`📄 [EXPORTED ORDERS] Processando documento ${doc.id}:`, {
                    exported: data.exported,
                    exportedAt: data.exportedAt,
                    factoryName: data.factoryName,
                    ref: data.ref,
                    dataPedido: data.dataPedido,
                    lotePedido: data.lotePedido
                });
                
                // Usar factoryId ou factoryName como identificador único
                const factoryId = data.factoryId || data.factoryName || 'unknown';
                const importId = data.importId || data.createdAt?.toDate?.()?.toISOString().substring(0, 16);
                
                // Garantir que temos um factoryName válido
                const factoryName = data.factoryName || data.factoryId || 'Fábrica Desconhecida';
                
                if (!groupedOrders[factoryId]) {
                    groupedOrders[factoryId] = {};
                }
                
                if (!groupedOrders[factoryId][importId]) {
                    groupedOrders[factoryId][importId] = {
                        factoryId,
                        importId,
                        factoryName: factoryName,
                        importName: data.importName || `Importação ${importId}`,
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
                
                // Capturar dataPedido e lotePedido da primeira cotação que tiver esses dados
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
                    
                    // Capturar dataPedido se não foi capturado ainda
                    if (hasDataPedido && !groupedOrders[factoryId][importId].dataPedido) {
                        groupedOrders[factoryId][importId].dataPedido = data.dataPedido.trim();
                        console.log(`✅ [EXPORTED ORDERS] Data Pedido capturada: "${data.dataPedido.trim()}"`);
                    }
                    
                    // Capturar lotePedido se não foi capturado ainda
                    if (hasLotePedido && !groupedOrders[factoryId][importId].lotePedido) {
                        groupedOrders[factoryId][importId].lotePedido = data.lotePedido.trim();
                        console.log(`✅ [EXPORTED ORDERS] Lote Pedido capturado: "${data.lotePedido.trim()}"`);
                    }
                } else {
                    console.log(`⚠️ [EXPORTED ORDERS] Cotação ${doc.id} sem dados de pedido:`, {
                        dataPedido: data.dataPedido,
                        lotePedido: data.lotePedido,
                        dataPedidoType: typeof data.dataPedido,
                        lotePedidoType: typeof data.lotePedido
                    });
                }
                
                // Calcular totais
                groupedOrders[factoryId][importId].totalAmount += data.amount || 0;
                groupedOrders[factoryId][importId].totalCBM += data.cbmTotal || 0;
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

            setExportedOrders(ordersArray);
            
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
            processExportedOrders(snapshot);

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
    };

    const handleCloseDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedOrder(null);
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

    // Função de debug para verificar cotações exportadas
    const debugExportedQuotes = async () => {
        try {
            console.log('🔍 [DEBUG] Verificando cotações exportadas...');
            
            // Buscar todas as cotações (sem filtro)
            const quotesRef = collection(db, 'quotes');
            const allQuotesQuery = query(quotesRef);
            const allSnapshot = await getDocs(allQuotesQuery);
            
            console.log(`📊 [DEBUG] Total de cotações no banco: ${allSnapshot.size}`);
            
            let exportedCount = 0;
            let exportedQuotes = [];
            
            allSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.exported === true) {
                    exportedCount++;
                    exportedQuotes.push({
                        id: doc.id,
                        ref: data.ref,
                        factoryName: data.factoryName,
                        exported: data.exported,
                        exportedAt: data.exportedAt,
                        orderStatus: data.orderStatus,
                        dataPedido: data.dataPedido,
                        lotePedido: data.lotePedido
                    });
                }
            });
            
            console.log(`📊 [DEBUG] Cotações exportadas encontradas: ${exportedCount}`);
            console.log('📋 [DEBUG] Detalhes das cotações exportadas:', exportedQuotes);
            
            // Buscar especificamente com filtro exported = true
            const exportedQuery = query(quotesRef, where('exported', '==', true));
            const exportedSnapshot = await getDocs(exportedQuery);
            
            console.log(`📊 [DEBUG] Query com filtro exported=true retornou: ${exportedSnapshot.size} documentos`);
            
            exportedSnapshot.forEach(doc => {
                const data = doc.data();
                console.log(`📄 [DEBUG] Documento exportado:`, {
                    id: doc.id,
                    ref: data.ref,
                    factoryName: data.factoryName,
                    exported: data.exported,
                    exportedAt: data.exportedAt,
                    dataPedido: data.dataPedido,
                    lotePedido: data.lotePedido,
                    factoryId: data.factoryId,
                    importId: data.importId,
                    importName: data.importName,
                    // Mostrar todos os campos para debug
                    allFields: Object.keys(data),
                    // Mostrar valores específicos dos campos que nos interessam
                    dataPedidoValue: data.dataPedido,
                    lotePedidoValue: data.lotePedido,
                    dataPedidoType: typeof data.dataPedido,
                    lotePedidoType: typeof data.lotePedido
                });
            });
            
        } catch (error) {
            console.error('❌ [DEBUG] Erro ao verificar cotações:', error);
        }
    };

    // Função de debug específica para testar processamento de dados
    const debugDataProcessing = async () => {
        try {
            console.log('🔍 [DEBUG PROCESSING] Testando processamento de dados...');
            
            const quotesRef = collection(db, 'quotes');
            const exportedQuery = query(quotesRef, where('exported', '==', true));
            const snapshot = await getDocs(exportedQuery);
            
            console.log(`📊 [DEBUG PROCESSING] Documentos encontrados: ${snapshot.size}`);
            
            const groupedOrders = {};
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const factoryId = data.factoryId;
                const importId = data.importId || data.createdAt?.toDate?.()?.toISOString().substring(0, 16);
                
                console.log(`📄 [DEBUG PROCESSING] Processando documento ${doc.id}:`, {
                    factoryId,
                    importId,
                    dataPedido: data.dataPedido,
                    lotePedido: data.lotePedido,
                    dataPedidoType: typeof data.dataPedido,
                    lotePedidoType: typeof data.lotePedido,
                    dataPedidoLength: data.dataPedido?.length,
                    lotePedidoLength: data.lotePedido?.length
                });
                
                if (!groupedOrders[factoryId]) {
                    groupedOrders[factoryId] = {};
                }
                
                if (!groupedOrders[factoryId][importId]) {
                    groupedOrders[factoryId][importId] = {
                        factoryId,
                        importId,
                        factoryName: data.factoryName || 'Fábrica Desconhecida',
                        importName: data.importName || `Importação ${importId}`,
                        exportedAt: data.exportedAt?.toDate?.() || new Date(),
                        dataPedido: '',
                        lotePedido: '',
                        quotes: [],
                        totalAmount: 0,
                        totalCBM: 0,
                        totalItems: 0
                    };
                }
                
                // Capturar dataPedido e lotePedido
                if (data.dataPedido && data.dataPedido.trim() !== '') {
                    if (!groupedOrders[factoryId][importId].dataPedido) {
                        groupedOrders[factoryId][importId].dataPedido = data.dataPedido;
                        console.log(`✅ [DEBUG PROCESSING] Data Pedido capturada: "${data.dataPedido}"`);
                    }
                }
                
                if (data.lotePedido && data.lotePedido.trim() !== '') {
                    if (!groupedOrders[factoryId][importId].lotePedido) {
                        groupedOrders[factoryId][importId].lotePedido = data.lotePedido;
                        console.log(`✅ [DEBUG PROCESSING] Lote Pedido capturado: "${data.lotePedido}"`);
                    }
                }
                
                groupedOrders[factoryId][importId].quotes.push({
                    id: doc.id,
                    ...data
                });
                
                groupedOrders[factoryId][importId].totalAmount += data.amount || 0;
                groupedOrders[factoryId][importId].totalCBM += data.cbmTotal || 0;
                groupedOrders[factoryId][importId].totalItems += 1;
            });
            
            // Mostrar resultado final
            console.log('📋 [DEBUG PROCESSING] Resultado do agrupamento:');
            Object.values(groupedOrders).forEach(factoryOrders => {
                Object.values(factoryOrders).forEach(order => {
                    console.log(`📦 [DEBUG PROCESSING] Pedido agrupado:`, {
                        factoryName: order.factoryName,
                        importName: order.importName,
                        dataPedido: order.dataPedido,
                        lotePedido: order.lotePedido,
                        totalItems: order.totalItems
                    });
                });
            });
            
        } catch (error) {
            console.error('❌ [DEBUG PROCESSING] Erro ao testar processamento:', error);
        }
    };

    const filteredOrders = selectedFactory 
        ? exportedOrders.filter(order => order.factoryName === selectedFactory)
        : exportedOrders;

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
                        variant="outline-primary"
                        size="sm"
                        onClick={loadExportedOrders}
                        disabled={loading}
                    >
                        <Refresh sx={{ fontSize: '16px', mr: 1 }} />
                        Atualizar
                    </Button>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={debugExportedQuotes}
                        >
                            🔍 Debug
                        </Button>
                        <Button
                            variant="outline-info"
                            size="sm"
                            onClick={debugDataProcessing}
                            className="ms-2"
                        >
                            🔧 Debug Processing
                        </Button>
                </Box>
            </Box>

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Filtros */}
            <Card className="mb-4">
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={3}>
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
                        <Col md={3}>
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
                                <Card.Header className="bg-success text-white">
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0 }}>
                                            {order.factoryName}
                                        </Typography>
                                        <Chip 
                                            label="EXPORTADO" 
                                            size="small" 
                                            sx={{ 
                                                backgroundColor: 'white', 
                                                color: 'success.main',
                                                fontWeight: 'bold'
                                            }} 
                                        />
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

                                    {/* Data de Exportação */}
                                    <Box sx={{ 
                                        p: 1, 
                                        backgroundColor: '#e8f5e8', 
                                        borderRadius: 1,
                                        mb: 2,
                                        border: '1px solid #4caf50'
                                    }}>
                                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                            Exportado em:
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#2e7d32' }}>
                                            {formatDate(order.exportedAt)}
                                        </Typography>
                                    </Box>

                                    {/* Data Pedido e Lote Pedido */}
                                    <Row className="g-2 mb-3">
                                        <Col xs={6}>
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
                                        <Col xs={6}>
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

                                    {/* Botões de Ação */}
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                        <Tooltip title="Visualizar Detalhes">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleViewDetails(order)}
                                                sx={{
                                                    backgroundColor: '#0dcaf0',
                                                    color: 'white',
                                                    '&:hover': {
                                                        backgroundColor: '#0bb5d6'
                                                    }
                                                }}
                                            >
                                                <Visibility fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Exportar para Excel">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleExportToExcel(order)}
                                                disabled={exporting}
                                                sx={{
                                                    backgroundColor: '#198754',
                                                    color: 'white',
                                                    '&:hover': {
                                                        backgroundColor: '#157347'
                                                    },
                                                    '&:disabled': {
                                                        backgroundColor: '#6c757d'
                                                    }
                                                }}
                                            >
                                                {exporting ? <Spinner size="sm" /> : <Download fontSize="small" />}
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Excluir Pedido">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteOrder(order)}
                                                disabled={deleting}
                                                sx={{
                                                    backgroundColor: '#dc3545',
                                                    color: 'white',
                                                    '&:hover': {
                                                        backgroundColor: '#c82333'
                                                    },
                                                    '&:disabled': {
                                                        backgroundColor: '#6c757d'
                                                    }
                                                }}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
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
                                    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                                        <Table stickyHeader size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>REF</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Descrição</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Preço Unit.</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Qtd</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Valor</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>CBM</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>MOQ</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>MOQ Logo</TableCell>
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
                                                            {formatCurrency(quote.unitPrice)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.quantity}
                                                        </TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                                            {formatCurrency(quote.amount)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.cbmTotal?.toFixed(3).replace('.', ',')} m³
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.moq}
                                                        </TableCell>
                                                        <TableCell>
                                                            {quote.moqLogo}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
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

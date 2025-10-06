import React, { useState, useEffect } from 'react';
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
            
            // Buscar todos os produtos desta cotação usando os campos corretos
            const quotesRef = collection(db, 'quotes');
            let q;
            
            // Tentar diferentes estratégias de busca
            if (quote.quoteName) {
                q = query(quotesRef, where('quoteName', '==', quote.quoteName));
            } else if (quote.importName) {
                q = query(quotesRef, where('importName', '==', quote.importName));
            } else {
                // Se não tem nome específico, buscar por factoryId e containerId
                q = query(quotesRef, where('factoryId', '==', quote.factoryId), where('containerId', '==', quote.containerId));
            }
            
            const querySnapshot = await getDocs(q);
            
            const products = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setQuoteProducts(products);
            console.log(`📦 Carregados ${products.length} produtos para a cotação:`, {
                quoteName: quote.quoteName,
                importName: quote.importName,
                factoryId: quote.factoryId,
                containerId: quote.containerId
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
    const loadContainers = async () => {
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
            
        } catch (error) {
            console.error('❌ Erro ao carregar containers:', error);
            setError('Erro ao carregar containers: ' + error.message);
        } finally {
            setLoading(false);
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
                const factoryName = factoryData.nome || factoryData.name || factoryData.factoryName || factoryData.title;
                
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
                
                // Resolver nome da fábrica - USAR factoryName original dos dados da cotação
                let factoryName = 'Fábrica não identificada';
                
                // Log específico para quote456 (ou qualquer cotação problemática)
                if (doc.id === 'quote456' || doc.id.includes('456')) {
                    console.log(`🚨 INVESTIGAÇÃO ESPECÍFICA para ${doc.id}:`);
                    console.log(`  🔍 data.factoryName:`, data.factoryName, `(tipo: ${typeof data.factoryName})`);
                    console.log(`  🔍 data.factoryId:`, data.factoryId, `(tipo: ${typeof data.factoryId})`);
                    console.log(`  🔍 factoriesMap[${data.factoryId}]:`, factoriesMap[data.factoryId]);
                    console.log(`  🔍 Verificação factoryName:`, {
                        exists: !!data.factoryName,
                        isString: typeof data.factoryName === 'string',
                        notEmpty: data.factoryName && data.factoryName.trim() !== '',
                        trimmed: data.factoryName ? data.factoryName.trim() : 'N/A'
                    });
                }
                
                // Estratégia: PRIORIZAR factoryName original dos dados da cotação
                if (data.factoryName && typeof data.factoryName === 'string' && data.factoryName.trim() !== '') {
                    // Usar o factoryName original dos dados da cotação (mesmo que seja ID)
                    factoryName = data.factoryName.trim();
                    console.log(`  ✅ Usando factoryName original: ${factoryName}`);
                } else if (data.factoryId && factoriesMap[data.factoryId]) {
                    // Se não tem factoryName, buscar no mapa de fábricas
                    factoryName = factoriesMap[data.factoryId];
                    console.log(`  ✅ Nome da fábrica encontrado no mapa: ${factoryName}`);
                } else {
                    // Como último recurso, usar um nome genérico
                    factoryName = 'Fábrica não identificada';
                    console.log(`  ❌ Nenhum nome válido encontrado para factoryId: ${data.factoryId}`);
                    
                    // Log adicional para debug
                    if (doc.id === 'quote456' || doc.id.includes('456')) {
                        console.log(`  🚨 DEBUG para ${doc.id}:`);
                        console.log(`    - data.factoryName existe?`, !!data.factoryName);
                        console.log(`    - data.factoryName é string?`, typeof data.factoryName === 'string');
                        console.log(`    - data.factoryName não vazio?`, data.factoryName && data.factoryName.trim() !== '');
                        console.log(`    - data.factoryId existe?`, !!data.factoryId);
                        console.log(`    - factoriesMap tem ${data.factoryId}?`, !!factoriesMap[data.factoryId]);
                        console.log(`    - factoriesMap completo:`, factoriesMap);
                    }
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
    }, []);

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
                            {containers.map((container) => (
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
                                                backgroundColor: '#3498db',
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
                                                                            className="mb-2 p-2" 
                                                                            style={{ 
                                                                                backgroundColor: '#f8f9fa', 
                                                                                borderRadius: '6px',
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
                                                                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1 }}>
                                                                                {quote.factoryName || 'Fábrica não identificada'}
                                                                            </Typography>
                                                                            <div className="row">
                                                                                <div className="col-12">
                                                                                    <Typography variant="caption" sx={{ color: '#7f8c8d', wordWrap: 'break-word' }}>
                                                                                        {quote.quoteName || quote.importName || `Cotação ${index + 1}`}
                                                                                    </Typography>
                                                                                </div>
                                                                            </div>
                                                                            <div className="row mt-1">
                                                                                <div className="col-6">
                                                                                    <Typography variant="caption" sx={{ color: '#e74c3c', fontWeight: 'bold' }}>
                                                                                        Valor: ¥ {formatBrazilianNumber(calculateProductAmount(quote), 2)}
                                                                                    </Typography>
                                                                                </div>
                                                                                <div className="col-6">
                                                                                    <Typography variant="caption" sx={{ color: '#27ae60', fontWeight: 'bold' }}>
                                                                                        CBM: {formatBrazilianNumber((quote.cbm || 0) * (quote.ctns || 0), 3)} m³
                                                                                    </Typography>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
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
            <Modal show={showQuoteModal} onHide={handleCloseQuoteModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Produtos da Cotação - {selectedQuote?.quoteName || selectedQuote?.importName || 'Cotação'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedQuote && (
                        <div>
                            {/* Informações da Cotação */}
                            <Card className="mb-3">
                                <Card.Header>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                        Informações da Cotação
                                    </Typography>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                Nome da Cotação:
                                            </Typography>
                                            <Typography variant="body1" sx={{ mb: 2 }}>
                                                {selectedQuote.quoteName || selectedQuote.importName || 'N/A'}
                                            </Typography>
                                        </Col>
                                        <Col md={6}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                Fábrica:
                                            </Typography>
                                            <Typography variant="body1" sx={{ mb: 2 }}>
                                                {selectedQuote.factoryName || 'N/A'}
                                            </Typography>
                                        </Col>
                                        <Col md={6}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                Total de Produtos:
                                            </Typography>
                                            <Typography variant="body1" sx={{ mb: 2 }}>
                                                {quoteProducts.length} produtos
                                            </Typography>
                                        </Col>
                                        <Col md={6}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                Valor Total da Cotação:
                                            </Typography>
                                            <Typography variant="body1" sx={{ mb: 2, color: '#e74c3c', fontWeight: 'bold' }}>
                                                ¥ {formatBrazilianNumber(quoteProducts.reduce((sum, product) => sum + calculateProductAmount(product), 0), 2)}
                                            </Typography>
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
                                        <div className="row g-3">
                                            {quoteProducts.map((product, index) => (
                                                <div key={product.id} className="col-md-6">
                                                    <Card className="h-100" style={{ border: '1px solid #e9ecef' }}>
                                                        <Card.Body className="p-3">
                                                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 2 }}>
                                                                {product.referencia || product.ref || `Produto ${index + 1}`}
                                                            </Typography>
                                                            
                                                            <div className="row g-2">
                                                                <div className="col-12">
                                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                                        Descrição:
                                                                    </Typography>
                                                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                                                        {product.description || product.descricao || 'N/A'}
                                                                    </Typography>
                                                                </div>
                                                                
                                                                <div className="col-6">
                                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                                        CTNS:
                                                                    </Typography>
                                                                    <Typography variant="body2">
                                                                        {formatBrazilianNumber(product.ctns || 0, 0)}
                                                                    </Typography>
                                                                </div>
                                                                
                                                                <div className="col-6">
                                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                                        Unit/CTN:
                                                                    </Typography>
                                                                    <Typography variant="body2">
                                                                        {formatBrazilianNumber(product.unitCtn || 0, 0)}
                                                                    </Typography>
                                                                </div>
                                                                
                                                                <div className="col-6">
                                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                                        Preço Unit.:
                                                                    </Typography>
                                                                    <Typography variant="body2">
                                                                        ¥ {formatBrazilianNumber(product.unitPrice || 0, 2)}
                                                                    </Typography>
                                                                </div>
                                                                
                                                                <div className="col-6">
                                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                                        CBM:
                                                                    </Typography>
                                                                    <Typography variant="body2">
                                                                        {formatBrazilianNumber(product.cbm || 0, 3)} m³
                                                                    </Typography>
                                                                </div>
                                                                
                                                                <div className="col-12 mt-2">
                                                                    <div style={{ 
                                                                        backgroundColor: '#f8f9fa', 
                                                                        padding: '8px', 
                                                                        borderRadius: '4px',
                                                                        border: '1px solid #e9ecef'
                                                                    }}>
                                                                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#e74c3c' }}>
                                                                            Valor Total: ¥ {formatBrazilianNumber(calculateProductAmount(product), 2)}
                                                                        </Typography>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Card.Body>
                                                    </Card>
                                                </div>
                                            ))}
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
        </Container>
    );
};

export default ContainerManagement;

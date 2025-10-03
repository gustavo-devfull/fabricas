import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert } from 'react-bootstrap';
import { Box, Typography, Chip, Divider } from '@mui/material';
import { 
    getAllFactories, 
    getQuotesByFactory,
    getQuoteImportsByFactory
} from '../../firebase/firestoreService';
import { formatCurrency } from '../../utils/formatters';
import excelExportService from '../../services/excelExportService';

const SelectedProducts = () => {
    const [factories, setFactories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [factoryData, setFactoryData] = useState([]);
    const [exporting, setExporting] = useState(false);
    const [exportingFactory, setExportingFactory] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

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
                    
                    // Filtrar apenas produtos selecionados para pedido
                    const selectedQuotes = quotes.filter(quote => quote.selectedForOrder === true);
                    
                    // Agrupar produtos selecionados por importação
                    const importsWithSelectedProducts = imports.map(importData => {
                        const importQuotes = selectedQuotes.filter(quote => {
                            const quoteCreatedAt = quote.createdAt?.toDate?.();
                            if (!quoteCreatedAt) return false;
                            const quoteKey = quoteCreatedAt.toISOString().substring(0, 16);
                            return quoteKey === importData.id;
                        });
                        
                        return {
                            ...importData,
                            selectedProducts: importQuotes
                        };
                    }).filter(importData => importData.selectedProducts.length > 0);
                    
                    return {
                        factory,
                        imports: importsWithSelectedProducts,
                        totalSelectedProducts: selectedQuotes.length
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
            setFactoryData(factoryDataResults.filter(data => data.totalSelectedProducts > 0));
            
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
        return products.reduce((total, product) => total + (product.cbmTotal || product.cbm || 0), 0);
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

    if (factoryData.length === 0) {
        return (
            <Container fluid className="py-4">
                <div className="text-center p-5">
                    <div className="mb-3">
                        <span className="material-icons" style={{fontSize: '4rem', color: '#6c757d'}}>shopping_cart</span>
                    </div>
                    <h4>Nenhum produto selecionado</h4>
                    <p className="text-muted">Não há produtos marcados para pedido no momento</p>
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
                        <Button variant="outline-primary" onClick={loadData} size="sm">
                            <span className="material-icons me-1" style={{fontSize: '16px'}}>refresh</span>
                            Atualizar
                        </Button>
                        <Button 
                            variant="success" 
                            size="sm"
                            onClick={handleExportAll}
                            disabled={exporting || factoryData.length === 0}
                        >
                            <span className="material-icons me-1" style={{fontSize: '16px'}}>
                                {exporting ? 'hourglass_empty' : 'file_download'}
                            </span>
                            {exporting ? 'Exportando...' : 'Exportar Todos'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Cards das Fábricas */}
            <Row className="g-4">
                {factoryData.map((factoryDataItem, factoryIndex) => (
                    <Col key={factoryDataItem.factory.id} xs={12}>
                        <Card className="shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                            <Card.Header 
                                style={{ 
                                    background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                                    color: 'white',
                                    borderRadius: '12px 12px 0 0'
                                }}
                            >
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h5 className="mb-1 fw-bold">
                                            <span className="material-icons me-2" style={{fontSize: '20px'}}>factory</span>
                                            {factoryDataItem.factory.nomeFabrica}
                                        </h5>
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
                                        <Button 
                                            variant="outline-success" 
                                            size="sm"
                                            onClick={() => handleExportFactory(factoryDataItem)}
                                            disabled={exportingFactory === factoryDataItem.factory.id}
                                            style={{ fontSize: '0.8rem' }}
                                        >
                                            <span className="material-icons me-1" style={{fontSize: '14px'}}>
                                                {exportingFactory === factoryDataItem.factory.id ? 'hourglass_empty' : 'file_download'}
                                            </span>
                                            {exportingFactory === factoryDataItem.factory.id ? 'Exportando...' : 'Exportar'}
                                        </Button>
                                    </div>
                                </div>
                            </Card.Header>
                            
                            <Card.Body className="p-4">
                                {/* Cards das Importações */}
                                <Row className="g-3">
                                    {factoryDataItem.imports.map((importData, importIndex) => (
                                        <Col key={importData.id} xs={12} md={6} lg={4}>
                                            <Card 
                                                className="h-100 shadow-sm"
                                                style={{ 
                                                    borderRadius: '8px',
                                                    border: '1px solid #e9ecef',
                                                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                                                }}
                                            >
                                                <Card.Header 
                                                    className="py-3"
                                                    style={{ 
                                                        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                                        color: 'white',
                                                        borderRadius: '8px 8px 0 0'
                                                    }}
                                                >
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <h6 className="mb-0 fw-bold">
                                                            <span className="material-icons me-1" style={{fontSize: '16px'}}>inventory</span>
                                                            {importData.importName || `Importação #${importIndex + 1}`}
                                                        </h6>
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
                                                    {/* Resumo da Importação */}
                                                    <div className="mb-3">
                                                        <Row className="g-2">
                                                            <Col xs={6}>
                                                                <div className="text-center p-2 rounded" style={{ backgroundColor: '#e7f3ff', border: '1px solid #b3d9ff' }}>
                                                                    <div className="fw-bold text-primary" style={{ fontSize: '0.9rem' }}>
                                                                        Valor Total
                                                                    </div>
                                                                    <div className="fw-bold text-success" style={{ fontSize: '1rem' }}>
                                                                        {formatCurrency(calculateImportTotal(importData.selectedProducts))}
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                            <Col xs={6}>
                                                                <div className="text-center p-2 rounded" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
                                                                    <div className="fw-bold text-warning" style={{ fontSize: '0.9rem' }}>
                                                                        CBM Total
                                                                    </div>
                                                                    <div className="fw-bold text-warning" style={{ fontSize: '1rem' }}>
                                                                        {formatNumber(calculateImportCBM(importData.selectedProducts), 3)} m³
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    </div>

                                                    {/* Lista de Produtos */}
                                                    <div>
                                                        <Typography variant="subtitle2" className="mb-2 fw-bold text-muted">
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
                                                                            <div className="fw-bold text-primary" style={{ fontSize: '0.85rem' }}>
                                                                                REF: {product.ref || 'N/A'}
                                                                            </div>
                                                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
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
                                                                                    label={`CBM: ${formatNumber(product.cbmTotal || product.cbm, 3)}`} 
                                                                                    size="small" 
                                                                                    color="info" 
                                                                                    variant="outlined"
                                                                                    style={{ fontSize: '0.7rem' }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-end">
                                                                            <div className="fw-bold text-success" style={{ fontSize: '0.8rem' }}>
                                                                                {formatCurrency(calculateProductAmount(product))}
                                                                            </div>
                                                                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                                                {formatCurrency(product.unitPrice)}/un
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
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
                            <div className="text-center p-3 rounded" style={{ backgroundColor: '#e7f3ff', border: '1px solid #b3d9ff' }}>
                                <div className="fw-bold text-primary" style={{ fontSize: '1.2rem' }}>
                                    {factoryData.length}
                                </div>
                                <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                                    Fábricas com Produtos Selecionados
                                </div>
                            </div>
                        </Col>
                        <Col xs={12} md={3}>
                            <div className="text-center p-3 rounded" style={{ backgroundColor: '#d4edda', border: '1px solid #c3e6cb' }}>
                                <div className="fw-bold text-success" style={{ fontSize: '1.2rem' }}>
                                    {factoryData.reduce((total, factory) => total + factory.totalSelectedProducts, 0)}
                                </div>
                                <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                                    Total de Produtos Selecionados
                                </div>
                            </div>
                        </Col>
                        <Col xs={12} md={3}>
                            <div className="text-center p-3 rounded" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
                                <div className="fw-bold text-warning" style={{ fontSize: '1.2rem' }}>
                                    {factoryData.reduce((total, factory) => total + factory.imports.length, 0)}
                                </div>
                                <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                                    Total de Importações
                                </div>
                            </div>
                        </Col>
                        <Col xs={12} md={3}>
                            <div className="text-center p-3 rounded" style={{ backgroundColor: '#f8d7da', border: '1px solid #f5c6cb' }}>
                                <div className="fw-bold text-danger" style={{ fontSize: '1.2rem' }}>
                                    {formatCurrency(
                                        factoryData.reduce((total, factory) => 
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
                    </Row>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default SelectedProducts;

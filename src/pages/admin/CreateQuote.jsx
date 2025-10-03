import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { Box, TextField, Typography, Button as MuiButton, Divider, IconButton } from '@mui/material';
import { Add, Delete, Save, ArrowBack } from '@mui/icons-material';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getAllFactories } from '../../firebase/firestoreService';
import { useNavigate } from 'react-router-dom';

const CreateQuote = () => {
    const navigate = useNavigate();
    const [factories, setFactories] = useState([]);
    const [selectedFactory, setSelectedFactory] = useState('');
    const [quoteData, setQuoteData] = useState({
        importNumber: '',
        importName: '',
        remark: '',
        obs: '',
        excelFile: null
    });
    const [products, setProducts] = useState([]);
    const [currentProduct, setCurrentProduct] = useState({
        ref: '',
        ncm: '',
        description: '',
        name: '',
        englishDescription: '',
        import: '',
        remark: '',
        obs: '',
        ctns: 0,
        unitCtn: 0,
        unit: '',
        unitPrice: 0,
        length: 0,
        width: 0,
        height: 0,
        cbm: 0,
        grossWeight: 0,
        netWeight: 0,
        pesoUnitario: 0
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadFactories();
    }, []);

    const loadFactories = async () => {
        try {
            const factoriesData = await getAllFactories();
            setFactories(factoriesData);
        } catch (error) {
            console.error('Erro ao carregar fábricas:', error);
            setError('Erro ao carregar lista de fábricas');
        }
    };

    const handleQuoteDataChange = (field, value) => {
        setQuoteData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleProductChange = (field, value) => {
        setCurrentProduct(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const addProduct = () => {
        if (!currentProduct.ref.trim()) {
            setError('REF é obrigatório');
            return;
        }

        // Verificar se REF já existe
        if (products.some(p => p.ref === currentProduct.ref.trim())) {
            setError('Este REF já foi adicionado');
            return;
        }

        setProducts(prev => [...prev, { ...currentProduct }]);
        setCurrentProduct({
            ref: '',
            ncm: '',
            description: '',
            name: '',
            englishDescription: '',
            import: '',
            remark: '',
            obs: '',
            ctns: 0,
            unitCtn: 0,
            unit: '',
            unitPrice: 0,
            length: 0,
            width: 0,
            height: 0,
            cbm: 0,
            grossWeight: 0,
            netWeight: 0,
            pesoUnitario: 0
        });
        setError(null);
    };

    const removeProduct = (index) => {
        setProducts(prev => prev.filter((_, i) => i !== index));
    };

    const calculateProductTotals = (product) => {
        const ctns = parseFloat(product.ctns) || 0;
        const unitCtn = parseFloat(product.unitCtn) || 0;
        const unitPrice = parseFloat(product.unitPrice) || 0;
        const cbm = parseFloat(product.cbm) || 0;
        const grossWeight = parseFloat(product.grossWeight) || 0;
        const netWeight = parseFloat(product.netWeight) || 0;

        return {
            qty: ctns * unitCtn,
            amount: ctns * unitCtn * unitPrice,
            cbmTotal: cbm * ctns,
            totalGrossWeight: grossWeight * ctns,
            totalNetWeight: netWeight * ctns
        };
    };

    const saveQuote = async () => {
        if (!selectedFactory) {
            setError('Selecione uma fábrica');
            return;
        }
        if (products.length === 0) {
            setError('Adicione pelo menos um produto');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            // Adicionar cada produto diretamente à coleção 'quotes'
            // Cada produto será um documento individual, como esperado pelo sistema
            const productPromises = products.map(product => {
                const totals = calculateProductTotals(product);
                console.log('💾 Salvando produto:', {
                    ref: product.ref,
                    totals: totals,
                    amount: totals.amount
                });
                return addDoc(collection(db, 'quotes'), {
                    factoryId: selectedFactory,
                    // Dados da cotação
                    importNumber: quoteData.importNumber,
                    importName: quoteData.importName || `Importação #${quoteData.importNumber}`,
                    // Dados do produto
                    ...product,
                    ...totals,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    selectedForOrder: false,
                    orderStatus: 'pending'
                });
            });

            await Promise.all(productPromises);

            console.log('✅ Cotação salva com sucesso!', {
                factoryId: selectedFactory,
                productsCount: products.length,
                importNumber: quoteData.importNumber
            });

            setSuccess(true);
            setTimeout(() => {
                navigate('/admin/dashboard');
            }, 2000);

        } catch (error) {
            console.error('❌ Erro ao salvar cotação:', error);
            setError('Erro ao salvar cotação: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const formatCurrency = (value) => {
        return `¥ ${(value || 0).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    if (success) {
        return (
            <Container className="mt-4">
                <Alert variant="success">
                    <Alert.Heading>Cotação Criada com Sucesso!</Alert.Heading>
                    <p>Redirecionando para o dashboard...</p>
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => navigate('/admin/dashboard')} sx={{ mr: 2 }}>
                    <ArrowBack />
                </IconButton>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    Criar Nova Cotação
                </Typography>
            </Box>

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Row>
                {/* Formulário de Dados da Cotação */}
                <Col md={4}>
                    <Card>
                        <Card.Header>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                Dados da Cotação
                            </Typography>
                        </Card.Header>
                        <Card.Body>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {/* Seleção de Fábrica */}
                                <TextField
                                    select
                                    label="Fábrica"
                                    value={selectedFactory}
                                    onChange={(e) => setSelectedFactory(e.target.value)}
                                    fullWidth
                                    SelectProps={{ native: true }}
                                >
                                    <option value="">Selecione uma fábrica</option>
                                    {factories.map((factory) => (
                                        <option key={factory.id} value={factory.id}>
                                            {factory.nomeFabrica}
                                        </option>
                                    ))}
                                </TextField>

                                {/* Número da Importação */}
                                <TextField
                                    label="Número da Importação"
                                    value={quoteData.importNumber}
                                    onChange={(e) => handleQuoteDataChange('importNumber', e.target.value)}
                                    fullWidth
                                    required
                                />

                                {/* Nome da Importação */}
                                <TextField
                                    label="Nome da Importação"
                                    value={quoteData.importName}
                                    onChange={(e) => handleQuoteDataChange('importName', e.target.value)}
                                    fullWidth
                                    placeholder="Deixe vazio para gerar automaticamente"
                                />

                                {/* Remark */}
                                <TextField
                                    label="Remark"
                                    value={quoteData.remark}
                                    onChange={(e) => handleQuoteDataChange('remark', e.target.value)}
                                    fullWidth
                                    multiline
                                    rows={2}
                                />

                                {/* OBS */}
                                <TextField
                                    label="Observações (OBS)"
                                    value={quoteData.obs}
                                    onChange={(e) => handleQuoteDataChange('obs', e.target.value)}
                                    fullWidth
                                    multiline
                                    rows={2}
                                />

                                <Divider />

                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Produtos adicionados: {products.length}
                                    </Typography>
                                </Box>
                            </Box>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Formulário de Produto */}
                <Col md={4}>
                    <Card>
                        <Card.Header>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                Adicionar Produto
                            </Typography>
                        </Card.Header>
                        <Card.Body>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {/* REF (obrigatório) */}
                                <TextField
                                    label="REF *"
                                    value={currentProduct.ref}
                                    onChange={(e) => handleProductChange('ref', e.target.value)}
                                    fullWidth
                                    required
                                    size="small"
                                />

                                {/* NCM */}
                                <TextField
                                    label="NCM"
                                    value={currentProduct.ncm}
                                    onChange={(e) => handleProductChange('ncm', e.target.value)}
                                    fullWidth
                                    size="small"
                                />

                                {/* Description */}
                                <TextField
                                    label="Description"
                                    value={currentProduct.description}
                                    onChange={(e) => handleProductChange('description', e.target.value)}
                                    fullWidth
                                    size="small"
                                />

                                {/* Name */}
                                <TextField
                                    label="Name"
                                    value={currentProduct.name}
                                    onChange={(e) => handleProductChange('name', e.target.value)}
                                    fullWidth
                                    size="small"
                                />

                                {/* English Description */}
                                <TextField
                                    label="English Description"
                                    value={currentProduct.englishDescription}
                                    onChange={(e) => handleProductChange('englishDescription', e.target.value)}
                                    fullWidth
                                    size="small"
                                />

                                {/* Import */}
                                <TextField
                                    label="Import"
                                    value={currentProduct.import}
                                    onChange={(e) => handleProductChange('import', e.target.value)}
                                    fullWidth
                                    size="small"
                                />

                                {/* Remark */}
                                <TextField
                                    label="Remark"
                                    value={currentProduct.remark}
                                    onChange={(e) => handleProductChange('remark', e.target.value)}
                                    fullWidth
                                    size="small"
                                />

                                {/* OBS */}
                                <TextField
                                    label="OBS"
                                    value={currentProduct.obs}
                                    onChange={(e) => handleProductChange('obs', e.target.value)}
                                    fullWidth
                                    size="small"
                                />

                                <Divider />

                                {/* Quantidades e Preços */}
                                <Row>
                                    <Col xs={6}>
                                        <TextField
                                            label="CTNS"
                                            type="number"
                                            value={currentProduct.ctns}
                                            onChange={(e) => handleProductChange('ctns', parseFloat(e.target.value) || 0)}
                                            fullWidth
                                            size="small"
                                            inputProps={{ min: 0, step: 1 }}
                                        />
                                    </Col>
                                    <Col xs={6}>
                                        <TextField
                                            label="UNIT/CTN"
                                            type="number"
                                            value={currentProduct.unitCtn}
                                            onChange={(e) => handleProductChange('unitCtn', parseFloat(e.target.value) || 0)}
                                            fullWidth
                                            size="small"
                                            inputProps={{ min: 0 }}
                                        />
                                    </Col>
                                </Row>

                                <Row>
                                    <Col xs={6}>
                                        <TextField
                                            label="UNIT"
                                            value={currentProduct.unit}
                                            onChange={(e) => handleProductChange('unit', e.target.value)}
                                            fullWidth
                                            size="small"
                                        />
                                    </Col>
                                    <Col xs={6}>
                                        <TextField
                                            label="Unit Price"
                                            type="number"
                                            value={currentProduct.unitPrice}
                                            onChange={(e) => handleProductChange('unitPrice', parseFloat(e.target.value) || 0)}
                                            fullWidth
                                            size="small"
                                            inputProps={{ min: 0, step: 0.01 }}
                                        />
                                    </Col>
                                </Row>

                                {/* Dimensões */}
                                <Row>
                                    <Col xs={4}>
                                        <TextField
                                            label="Length (cm)"
                                            type="number"
                                            value={currentProduct.length}
                                            onChange={(e) => handleProductChange('length', parseFloat(e.target.value) || 0)}
                                            fullWidth
                                            size="small"
                                            inputProps={{ min: 0, step: 0.01 }}
                                        />
                                    </Col>
                                    <Col xs={4}>
                                        <TextField
                                            label="Width (cm)"
                                            type="number"
                                            value={currentProduct.width}
                                            onChange={(e) => handleProductChange('width', parseFloat(e.target.value) || 0)}
                                            fullWidth
                                            size="small"
                                            inputProps={{ min: 0, step: 0.01 }}
                                        />
                                    </Col>
                                    <Col xs={4}>
                                        <TextField
                                            label="Height (cm)"
                                            type="number"
                                            value={currentProduct.height}
                                            onChange={(e) => handleProductChange('height', parseFloat(e.target.value) || 0)}
                                            fullWidth
                                            size="small"
                                            inputProps={{ min: 0, step: 0.01 }}
                                        />
                                    </Col>
                                </Row>

                                {/* CBM */}
                                <TextField
                                    label="CBM"
                                    type="number"
                                    value={currentProduct.cbm}
                                    onChange={(e) => handleProductChange('cbm', parseFloat(e.target.value) || 0)}
                                    fullWidth
                                    size="small"
                                    inputProps={{ min: 0, step: 0.001 }}
                                />

                                {/* Pesos */}
                                <Row>
                                    <Col xs={4}>
                                        <TextField
                                            label="Gross Weight (kg)"
                                            type="number"
                                            value={currentProduct.grossWeight}
                                            onChange={(e) => handleProductChange('grossWeight', parseFloat(e.target.value) || 0)}
                                            fullWidth
                                            size="small"
                                            inputProps={{ min: 0, step: 0.01 }}
                                        />
                                    </Col>
                                    <Col xs={4}>
                                        <TextField
                                            label="Net Weight (kg)"
                                            type="number"
                                            value={currentProduct.netWeight}
                                            onChange={(e) => handleProductChange('netWeight', parseFloat(e.target.value) || 0)}
                                            fullWidth
                                            size="small"
                                            inputProps={{ min: 0, step: 0.01 }}
                                        />
                                    </Col>
                                    <Col xs={4}>
                                        <TextField
                                            label="Peso Unitário (g)"
                                            type="number"
                                            value={currentProduct.pesoUnitario}
                                            onChange={(e) => handleProductChange('pesoUnitario', parseFloat(e.target.value) || 0)}
                                            fullWidth
                                            size="small"
                                            inputProps={{ min: 0, step: 0.01 }}
                                        />
                                    </Col>
                                </Row>

                                <MuiButton
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={addProduct}
                                    fullWidth
                                    sx={{ mt: 2 }}
                                >
                                    Adicionar Produto
                                </MuiButton>
                            </Box>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Lista de Produtos Adicionados */}
                <Col md={4}>
                    <Card>
                        <Card.Header>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Produtos ({products.length})
                                </Typography>
                                <MuiButton
                                    variant="contained"
                                    color="success"
                                    startIcon={<Save />}
                                    onClick={saveQuote}
                                    disabled={isSaving || !selectedFactory || products.length === 0}
                                    size="small"
                                >
                                    {isSaving ? 'Salvando...' : 'Salvar Cotação'}
                                </MuiButton>
                            </Box>
                        </Card.Header>
                        <Card.Body>
                            {products.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                                    Nenhum produto adicionado ainda
                                </Typography>
                            ) : (
                                <Box sx={{ maxHeight: '500px', overflowY: 'auto' }}>
                                    {products.map((product, index) => {
                                        const totals = calculateProductTotals(product);
                                        return (
                                            <Card key={index} sx={{ mb: 1, backgroundColor: '#f8f9fa' }}>
                                                <Card.Body sx={{ py: 1 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                            {product.ref}
                                                        </Typography>
                                                        <IconButton size="small" onClick={() => removeProduct(index)}>
                                                            <Delete />
                                                        </IconButton>
                                                    </Box>
                                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                        {product.description || product.name || 'Sem descrição'}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                                        <span>QTY: {totals.qty}</span>
                                                        <span>CBM: {totals.cbmTotal.toFixed(3)}</span>
                                                        <span>AMT: {formatCurrency(totals.amount)}</span>
                                                    </Box>
                                                </Card.Body>
                                            </Card>
                                        );
                                    })}
                                </Box>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default CreateQuote;

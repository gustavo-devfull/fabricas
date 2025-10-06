import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { Box, TextField, Typography, Button as MuiButton, Divider, IconButton } from '@mui/material';
import { Add, Delete, Save, ArrowBack } from '@mui/icons-material';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getAllFactories } from '../../firebase/firestoreService';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import productSearchService from '../../services/productSearchService';

const CreateQuote = () => {
    const navigate = useNavigate();
    const [factories, setFactories] = useState([]);
    const [selectedFactory, setSelectedFactory] = useState('');
    const [quoteData, setQuoteData] = useState({
        quoteName: '', // Nome da cotação para exibição no dashboard
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
    const [isSearchingProduct, setIsSearchingProduct] = useState(false);
    const [productSearchResult, setProductSearchResult] = useState(null);
    const searchTimeoutRef = useRef(null);
    const lastSearchRef = useRef('');

    useEffect(() => {
        loadFactories();
        
        // Limpeza do timeout quando o componente for desmontado
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
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

        // Se o campo alterado for REF, buscar automaticamente o produto
        if (field === 'ref' && value && value.trim().length >= 3) {
            const cleanValue = value.trim();
            
            // Cancelar busca anterior se existir
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            
            // Só buscar se o valor for diferente da última busca
            if (cleanValue !== lastSearchRef.current) {
                searchTimeoutRef.current = setTimeout(() => {
                    // Buscar diretamente sem verificar currentProduct.ref
                    console.log(`🔍 [TIMEOUT] Executando busca para: ${cleanValue}`);
                    lastSearchRef.current = cleanValue;
                    searchProductByRef(cleanValue);
                }, 800); // Aguardar 800ms antes de buscar
            }
        } else if (field === 'ref' && (!value || value.trim().length < 3)) {
            // Limpar resultado se REF for muito curta
            setProductSearchResult(null);
            lastSearchRef.current = '';
        }
    };

    const searchProductByRef = async (ref) => {
        console.log(`🔍 [SEARCH] Iniciando busca para REF: "${ref}"`);
        
        if (!ref || ref.length < 3) {
            console.log(`❌ [SEARCH] REF muito curta ou vazia: "${ref}"`);
            setProductSearchResult(null);
            return;
        }

        setIsSearchingProduct(true);
        console.log(`🔍 [SEARCH] Definindo isSearchingProduct = true`);

        try {
            console.log(`🔍 Buscando produto REF: ${ref}`);
            const productData = await productSearchService.searchProductByRef(ref);
            console.log(`🔍 [CREATEQUOTE] Resposta do productSearchService:`, productData);
            console.log(`🔍 [CREATEQUOTE] Tipo da resposta:`, typeof productData);
            console.log(`🔍 [CREATEQUOTE] Resposta válida:`, !!productData);
            
            if (productData) {
                console.log(`✅ Produto encontrado:`, productData);
                console.log(`✅ [CREATEQUOTE] Definindo productSearchResult...`);
                setProductSearchResult(productData);
                console.log(`✅ [CREATEQUOTE] ProductSearchResult definido!`);
                
                // Preencher automaticamente os campos com os dados encontrados
                setCurrentProduct(prev => ({
                    ...prev,
                    ncm: productData.ncm || prev.ncm,
                    description: productData.description || prev.description,
                    name: productData.name || prev.name,
                    englishDescription: productData.englishDescription || prev.englishDescription,
                    import: productData.import || prev.import,
                    remark: productData.remark || prev.remark,
                    obs: productData.obs || prev.obs,
                    unit: productData.unit || prev.unit,
                    unitPrice: productData.unitPrice || prev.unitPrice,
                    length: productData.length || prev.length,
                    width: productData.width || prev.width,
                    height: productData.height || prev.height,
                    cbm: productData.cbm || prev.cbm,
                    grossWeight: productData.grossWeight || prev.grossWeight,
                    netWeight: productData.netWeight || prev.netWeight,
                    pesoUnitario: productData.pesoUnitario || prev.pesoUnitario
                }));

                // Mostrar mensagem de sucesso
                setError(null);
            } else {
                console.log(`❌ Produto ${ref} não encontrado`);
                setProductSearchResult(null);
            }
        } catch (error) {
            console.error(`❌ Erro ao buscar produto ${ref}:`, error);
            setProductSearchResult(null);
        } finally {
            setIsSearchingProduct(false);
        }
    };

    const clearProductForm = () => {
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
        setProductSearchResult(null);
        setError(null);
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
        if (!quoteData.quoteName.trim()) {
            setError('Informe o nome da cotação');
            return;
        }
        if (products.length === 0) {
            setError('Adicione pelo menos um produto');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            // Calcular valor total da cotação (soma de todos os amounts)
            const valorTotal = products.reduce((total, product) => {
                const totals = calculateProductTotals(product);
                return total + totals.amount;
            }, 0);

            console.log('💰 Valor total da cotação:', valorTotal);

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
                    quoteName: quoteData.quoteName,
                    valorTotal: valorTotal, // Valor total da cotação
                    // Dados do produto
                    ...product,
                    ...totals,
                    // Campos de pedido (inicializados como vazios)
                    dataPedido: '',
                    lotePedido: '',
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
                quoteName: quoteData.quoteName
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
                                    value={selectedFactory}
                                    onChange={(e) => setSelectedFactory(e.target.value)}
                                    fullWidth
                                    SelectProps={{ native: true }}
                                >
                                    <option value="">Selecione uma fábrica</option>
                                    {factories.map((factory) => (
                                        <option key={factory.id} value={factory.id}>
                                            {factory.name}
                                        </option>
                                    ))}
                                </TextField>

                                {/* Nome da Cotação */}
                                <TextField
                                    value={quoteData.quoteName}
                                    onChange={(e) => handleQuoteDataChange('quoteName', e.target.value)}
                                    fullWidth
                                    placeholder="Nome da Cotação"
                                    required
                                    helperText="Nome que será exibido no dashboard"
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
                                <Box sx={{ position: 'relative' }}>
                                    <TextField
                                        value={currentProduct.ref}
                                        onChange={(e) => handleProductChange('ref', e.target.value)}
                                        fullWidth
                                        placeholder="REF *"
                                        required
                                        size="small"
                                        InputProps={{
                                            endAdornment: isSearchingProduct ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                                                    <Box sx={{ 
                                                        width: 16, 
                                                        height: 16, 
                                                        border: '2px solid #1976d2', 
                                                        borderTop: '2px solid transparent',
                                                        borderRadius: '50%',
                                                        animation: 'spin 1s linear infinite',
                                                        '@keyframes spin': {
                                                            '0%': { transform: 'rotate(0deg)' },
                                                            '100%': { transform: 'rotate(360deg)' }
                                                        }
                                                    }} />
                                                </Box>
                                            ) : productSearchResult ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                                                    <Box sx={{ 
                                                        width: 16, 
                                                        height: 16, 
                                                        borderRadius: '50%', 
                                                        backgroundColor: '#4caf50',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontSize: '10px',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        ✓
                                                    </Box>
                                                </Box>
                                            ) : null
                                        }}
                                    />
                                    {productSearchResult && (
                                        <Box sx={{ 
                                            mt: 1, 
                                            p: 1, 
                                            backgroundColor: '#e8f5e8', 
                                            borderRadius: 1,
                                            border: '1px solid #4caf50'
                                        }}>
                                            <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                                                ✅ Produto encontrado na base de dados
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#2e7d32', display: 'block', mt: 0.5 }}>
                                                Campos preenchidos automaticamente
                                            </Typography>
                                        </Box>
                                    )}
                                    {!isSearchingProduct && !productSearchResult && currentProduct.ref && currentProduct.ref.length >= 3 && (
                                        <Box sx={{ 
                                            mt: 1, 
                                            p: 1, 
                                            backgroundColor: '#fff3cd', 
                                            borderRadius: 1,
                                            border: '1px solid #ffc107'
                                        }}>
                                            <Typography variant="caption" sx={{ color: '#856404', fontWeight: 'bold' }}>
                                                ℹ️ Produto não encontrado na base de dados
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#856404', display: 'block', mt: 0.5 }}>
                                                Preencha os campos manualmente
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>

                                {/* NCM */}
                                <TextField
                                    placeholder="NCM"
                                    value={currentProduct.ncm}
                                    onChange={(e) => handleProductChange('ncm', e.target.value)}
                                    fullWidth
                                    size="small"
                                />

                                {/* Description */}
                                <TextField
                                    placeholder="Description"
                                    value={currentProduct.description}
                                    onChange={(e) => handleProductChange('description', e.target.value)}
                                    fullWidth
                                    size="small"
                                />

                                {/* Name */}
                                <TextField
                                    placeholder="Name"
                                    value={currentProduct.name}
                                    onChange={(e) => handleProductChange('name', e.target.value)}
                                    fullWidth
                                    size="small"
                                />

                                {/* English Description */}
                                <TextField
                                    placeholder="English Description"
                                    value={currentProduct.englishDescription}
                                    onChange={(e) => handleProductChange('englishDescription', e.target.value)}
                                    fullWidth
                                    size="small"
                                />

                                {/* Import */}
                                <TextField
                                    placeholder="Import"
                                    value={currentProduct.import}
                                    onChange={(e) => handleProductChange('import', e.target.value)}
                                    fullWidth
                                    size="small"
                                />

                                {/* Remark */}
                                <TextField
                                    placeholder="Remark"
                                    value={currentProduct.remark}
                                    onChange={(e) => handleProductChange('remark', e.target.value)}
                                    fullWidth
                                    size="small"
                                />

                                {/* OBS */}
                                <TextField
                                    placeholder="OBS"
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
                                            placeholder="UNIT"
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

                                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                    <MuiButton
                                        variant="contained"
                                        startIcon={<Add />}
                                        onClick={addProduct}
                                        sx={{ flex: 1 }}
                                    >
                                        Adicionar Produto
                                    </MuiButton>
                                    <MuiButton
                                        variant="outlined"
                                        onClick={clearProductForm}
                                        sx={{ minWidth: '100px' }}
                                    >
                                        Limpar
                                    </MuiButton>
                                </Box>

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
                                    disabled={isSaving || !selectedFactory || !quoteData.quoteName.trim() || products.length === 0}
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

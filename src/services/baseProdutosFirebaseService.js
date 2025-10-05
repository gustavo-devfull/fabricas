import { collection, query, where, getDocs, orderBy, limit, addDoc } from 'firebase/firestore';
import { baseProdutosDb } from '../firebase/baseProdutosConfig';

/**
 * Serviço para buscar produtos na base de produtos Firebase
 */
class BaseProdutosService {
    constructor() {
        this.collectionName = 'products'; // Nome da coleção na base de produtos (corrigido)
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
        
        console.log(`🏗️ BaseProdutosService inicializado`);
        console.log(`📦 Coleção: ${this.collectionName}`);
        console.log(`🔗 Firebase DB:`, baseProdutosDb);
    }

    /**
     * Testa a conexão Firebase e verifica se a coleção existe
     * @returns {Promise<Object>} Status da conexão e informações da coleção
     */
    async testConnection() {
        try {
            console.log(`🔗 [FIREBASE DIRECT] Testando conexão direta ao Firebase...`);
            console.log(`📋 [FIREBASE DIRECT] Project ID: cadastro-de-produtos-ccbd2`);
            console.log(`📦 [FIREBASE DIRECT] Coleção: ${this.collectionName}`);
            console.log(`🔗 [FIREBASE DIRECT] Firebase DB:`, baseProdutosDb);
            
            const produtosRef = collection(baseProdutosDb, this.collectionName);
            console.log(`✅ [FIREBASE DIRECT] Referência da coleção criada com sucesso`);
            
            // Tentar buscar alguns documentos para verificar se a coleção existe
            const testQuery = query(produtosRef, limit(10));
            console.log(`🔍 [FIREBASE DIRECT] Executando query de teste...`);
            const testSnapshot = await getDocs(testQuery);
            
            console.log(`📊 [FIREBASE DIRECT] Coleção "${this.collectionName}" existe e tem ${testSnapshot.size} documentos`);
            
            if (testSnapshot.size > 0) {
                console.log(`📋 [FIREBASE DIRECT] Primeiros documentos encontrados:`);
                testSnapshot.docs.forEach((doc, index) => {
                    console.log(`  ${index + 1}. ID: ${doc.id}`);
                    console.log(`     Campos disponíveis:`, Object.keys(doc.data()));
                    console.log(`     Dados completos:`, doc.data());
                });
                
                // Verificar se há produtos com campo 'referencia'
                const produtosComReferencia = testSnapshot.docs.filter(doc => 
                    doc.data().referencia || doc.data().REF || doc.data().ref
                );
                console.log(`🔍 [FIREBASE DIRECT] Produtos com campo 'referencia': ${produtosComReferencia.length}`);
                
                if (produtosComReferencia.length > 0) {
                    console.log(`📋 [FIREBASE DIRECT] Exemplos de produtos com referencia:`);
                    produtosComReferencia.slice(0, 3).forEach((doc, index) => {
                        const data = doc.data();
                        console.log(`  ${index + 1}. REF: ${data.referencia || data.REF || data.ref}`);
                        console.log(`     Nome: ${data.name || data.nome || data.description || 'N/A'}`);
                        console.log(`     Marca: ${data.marca || 'N/A'}`);
                    });
                }
            } else {
                console.log(`⚠️ [FIREBASE DIRECT] Coleção existe mas está vazia`);
                console.log(`💡 [FIREBASE DIRECT] Use o botão "➕ Adicionar Produtos de Teste" para popular a coleção`);
            }
            
            return {
                success: true,
                collectionExists: true,
                documentCount: testSnapshot.size,
                sampleDocuments: testSnapshot.docs.map(doc => ({
                    id: doc.id,
                    fields: Object.keys(doc.data()),
                    data: doc.data()
                }))
            };
            
        } catch (error) {
            console.error(`❌ Erro ao testar conexão Firebase:`, error);
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    }

    /**
     * Adiciona produtos de teste na base Firebase
     * @returns {Promise<Object>} Resultado da operação
     */
    async addTestProducts() {
        try {
            console.log(`🧪 Adicionando produtos de teste na base Firebase...`);
            
            const testProducts = [
                {
                    referencia: 'MR1149',
                    ncm: '11111111',
                    description: 'Produto MR1149 - Descrição do produto',
                    name: 'Produto MR1149',
                    englishDescription: 'MR1149 Product - Product description',
                    unit: 'PCS',
                    unitPriceRmb: 18.75,
                    unitCtn: 15,
                    l: 12.0,
                    w: 9.5,
                    h: 4.2,
                    cbm: 0.0479,
                    gw: 0.9,
                    nw: 0.7,
                    pesoUnitario: 0.7,
                    moq: 150,
                    moqLogo: 750,
                    marca: 'Marca Teste',
                    codigoRavi: 'RAV1149',
                    ean: '1111111111111',
                    dun: 'DUN1149',
                    nomeInvoiceEN: 'MR1149 Product',
                    nomeDI: 'Produto MR1149 DI',
                    nomeRavi: 'Produto MR1149 Ravi',
                    quantidadeMinimaVenda: 75,
                    cest: '1111111',
                    valorInvoiceUSD: 18.75,
                    observacaoPedido: 'Observação do pedido MR1149',
                    remark: 'Observação geral MR1149',
                    obs: 'Observação específica MR1149',
                    import: 'IMP1149',
                    category: 'Categoria C',
                    origin: 'China',
                    comments: 'Comentários do produto MR1149'
                },
                {
                    referencia: 'MR1165',
                    ncm: '12345678',
                    description: 'Produto MR1165 - Descrição do produto',
                    name: 'Produto MR1165',
                    englishDescription: 'MR1165 Product - Product description',
                    unit: 'PCS',
                    unitPriceRmb: 15.50,
                    unitCtn: 20,
                    l: 10.5,
                    w: 8.2,
                    h: 3.1,
                    cbm: 0.0267,
                    gw: 0.8,
                    nw: 0.6,
                    pesoUnitario: 0.6,
                    moq: 100,
                    moqLogo: 500,
                    marca: 'Marca Exemplo',
                    codigoRavi: 'RAV1165',
                    ean: '1234567890123',
                    dun: 'DUN1165',
                    nomeInvoiceEN: 'MR1165 Product',
                    nomeDI: 'Produto MR1165 DI',
                    nomeRavi: 'Produto MR1165 Ravi',
                    quantidadeMinimaVenda: 50,
                    cest: '1234567',
                    valorInvoiceUSD: 15.50,
                    observacaoPedido: 'Observação do pedido',
                    remark: 'Observação geral',
                    obs: 'Observação específica',
                    import: 'IMP1165',
                    category: 'Categoria A',
                    origin: 'China',
                    comments: 'Comentários do produto'
                }
            ];

            const produtosRef = collection(baseProdutosDb, this.collectionName);
            const results = [];

            for (const product of testProducts) {
                try {
                    // Verificar se já existe
                    const existingQuery = query(
                        produtosRef,
                        where('referencia', '==', product.referencia),
                        limit(1)
                    );
                    const existingSnapshot = await getDocs(existingQuery);
                    
                    if (existingSnapshot.empty) {
                        // Adicionar produto
                        const docRef = await addDoc(produtosRef, product);
                        console.log(`✅ Produto ${product.referencia} adicionado com ID: ${docRef.id}`);
                        results.push({
                            referencia: product.referencia,
                            success: true,
                            id: docRef.id
                        });
                    } else {
                        console.log(`⚠️ Produto ${product.referencia} já existe`);
                        results.push({
                            referencia: product.referencia,
                            success: false,
                            message: 'Já existe'
                        });
                    }
                } catch (error) {
                    console.error(`❌ Erro ao adicionar produto ${product.referencia}:`, error);
                    results.push({
                        referencia: product.referencia,
                        success: false,
                        error: error.message
                    });
                }
            }

            return {
                success: true,
                results: results,
                totalAdded: results.filter(r => r.success).length
            };

        } catch (error) {
            console.error(`❌ Erro ao adicionar produtos de teste:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Busca produto por referência na base de produtos Firebase
     * @param {string} ref - Referência do produto (campo "referencia")
     * @returns {Promise<Object|null>} Dados do produto ou null se não encontrado
     */
    async searchProductByRef(ref) {
        try {
            const cleanRef = ref.trim().toUpperCase();
            if (!cleanRef) return null;

            console.log(`🔍 [FIREBASE DIRECT] Buscando produto REF: ${cleanRef} diretamente no Firebase`);
            console.log(`📋 [FIREBASE DIRECT] MAPEAMENTO: REF do sistema = campo "referencia" na base de produtos`);
            console.log(`🔗 [FIREBASE DIRECT] Firebase DB disponível:`, !!baseProdutosDb);
            console.log(`📦 [FIREBASE DIRECT] Coleção: ${this.collectionName}`);
            console.log(`🔗 [FIREBASE DIRECT] Project ID: cadastro-de-produtos-ccbd2`);

            // Verificar cache primeiro
            const cached = this.cache.get(cleanRef);
            if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
                console.log(`✅ [FIREBASE] Produto ${cleanRef} encontrado no cache`);
                return cached.data;
            } else if (cached) {
                this.cache.delete(cleanRef);
            }

            // Buscar na base de produtos Firebase
            console.log(`🔥 [FIREBASE DIRECT] Iniciando busca no Firebase...`);
            console.log(`🔥 [FIREBASE DIRECT] Coleção: ${this.collectionName}`);
            console.log(`🔥 [FIREBASE DIRECT] REF buscada: ${cleanRef}`);
            const productData = await this.searchInFirebase(cleanRef);
            
            if (productData) {
                console.log(`✅ [FIREBASE] Produto ${cleanRef} encontrado na base de produtos Firebase`);
                this.cache.set(cleanRef, {
                    data: productData,
                    timestamp: Date.now()
                });
                return productData;
            }

            console.log(`❌ [FIREBASE] Produto ${cleanRef} não encontrado na base de produtos Firebase`);
            return null;

        } catch (error) {
            console.error(`❌ [FIREBASE] Erro ao buscar produto ${ref} na base de produtos Firebase:`, error);
            console.error(`❌ [FIREBASE] Detalhes do erro:`, {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            return null;
        }
    }

    /**
     * Busca produto na base de produtos Firebase
     * @param {string} ref - Referência do produto
     * @returns {Promise<Object|null>} Dados do produto ou null
     */
    async searchInFirebase(ref) {
        try {
            console.log(`🌐 [FIREBASE DIRECT] Buscando produto ${ref} na coleção "${this.collectionName}"...`);
            console.log(`🔗 [FIREBASE DIRECT] Firebase Project: cadastro-de-produtos-ccbd2`);
            console.log(`📋 [FIREBASE DIRECT] Campo principal: "referencia"`);
            console.log(`🔍 [FIREBASE DIRECT] REF específica: "${ref}"`);

            // Criar query para buscar por campo "referencia" (campo principal)
            const produtosRef = collection(baseProdutosDb, this.collectionName);
            console.log(`📦 [FIREBASE DIRECT] Referência da coleção criada:`, produtosRef);
            
            const q = query(
                produtosRef,
                where('referencia', '==', ref),
                limit(1)
            );
            console.log(`🔍 [FIREBASE] Query criada para buscar referencia="${ref}"`);

            const querySnapshot = await getDocs(q);
            console.log(`📊 [FIREBASE] Query executada. Documentos encontrados: ${querySnapshot.size}`);
            console.log(`📊 [FIREBASE] Query snapshot:`, querySnapshot);
            console.log(`📊 [FIREBASE] Query snapshot empty:`, querySnapshot.empty);

            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                const productData = {
                    id: doc.id,
                    ...doc.data()
                };
                
                console.log(`📦 [FIREBASE DIRECT] Produto encontrado pelo campo "referencia":`, productData);
                console.log(`📦 [FIREBASE DIRECT] Dados brutos do documento:`, doc.data());
                console.log(`📦 [FIREBASE DIRECT] ID do documento:`, doc.id);
                const normalizedData = this.normalizeProductData(productData);
                console.log(`🔄 [FIREBASE DIRECT] Dados normalizados:`, normalizedData);
                console.log(`✅ [FIREBASE DIRECT] Retornando dados normalizados para ${ref}`);
                console.log(`🛑 [FIREBASE DIRECT] PARANDO BUSCA - PRODUTO ENCONTRADO!`);
                return normalizedData;
            }

            // Se não encontrou por "referencia", tentar outros campos
            console.log(`⚠️ [FIREBASE DIRECT] Não encontrado por "referencia", tentando outros campos...`);
            
            const alternativeFields = ['REF', 'ref', 'reference', 'code', 'codigo', 'sku', 'id'];
            
            for (const field of alternativeFields) {
                try {
                    console.log(`🔍 [FIREBASE] Tentando campo "${field}"...`);
                    const altQuery = query(
                        produtosRef,
                        where(field, '==', ref),
                        limit(1)
                    );
                    
                    const altSnapshot = await getDocs(altQuery);
                    console.log(`📊 [FIREBASE] Campo "${field}": ${altSnapshot.size} documentos encontrados`);
                    
                    if (!altSnapshot.empty) {
                        const doc = altSnapshot.docs[0];
                        const productData = {
                            id: doc.id,
                            ...doc.data()
                        };
                        
                        console.log(`📦 [FIREBASE] Produto encontrado pelo campo "${field}":`, productData);
                        return this.normalizeProductData(productData);
                    }
                } catch (altError) {
                    console.log(`⚠️ [FIREBASE] Campo "${field}" não existe ou erro:`, altError.message);
                    continue;
                }
            }

            console.log(`❌ [FIREBASE] Produto ${ref} não encontrado em nenhum campo`);
            return null;

        } catch (error) {
            console.error(`❌ [FIREBASE] Erro ao buscar na Firebase:`, error);
            console.error(`❌ [FIREBASE] Detalhes do erro:`, {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            return null;
        }
    }

    /**
     * Normaliza dados do produto da base para o formato do sistema
     * @param {Object} data - Dados brutos do Firebase
     * @returns {Object} Dados normalizados
     */
    normalizeProductData(data) {
        if (!data) return null;

        console.log(`🔄 Normalizando dados do produto:`, data);

        // Função para obter valor de diferentes campos possíveis
        const getFieldValue = (fieldMappings, defaultValue = '') => {
            for (const mapping of fieldMappings) {
                if (data[mapping] !== undefined && data[mapping] !== null && data[mapping] !== '') {
                    return data[mapping];
                }
            }
            return defaultValue;
        };

        // Mapear campos da base de produtos para o sistema
        // EQUIVALÊNCIA ESPECÍFICA DOS CAMPOS
        const normalizedProduct = {
            // Campos básicos - REF = referencia
            ref: getFieldValue(['referencia', 'REF', 'ref', 'reference', 'code', 'codigo', 'sku', 'id']),
            ncm: getFieldValue(['ncm', 'codigoNCM', 'codigo_ncm', 'ncmCode']),
            description: getFieldValue(['description', 'DESCRIPTION', 'descricao', 'desc', 'name', 'nome', 'productName']),
            name: getFieldValue(['name', 'NAME', 'nome', 'productName', 'description', 'descricao']),
            englishDescription: getFieldValue(['englishDescription', 'descricaoIngles', 'descriptionEN', 'english_desc', 'en_description', 'nomeInvoiceEN', 'invoiceNameEN']),

            // Campos de unidade e preço - UNIT/CTN = unitCtn, U.PRICE = unitPriceRmb, UNIT = unit
            unit: getFieldValue(['unit', 'UNIT', 'unidade', 'unity', 'measurement'], 'PCS'),
            unitPrice: parseFloat(getFieldValue(['unitPriceRmb', 'unitPrice', 'precoUnitario', 'price', 'preco', 'unit_price', 'unitPriceRMB'], 0)),
            unitCtn: parseInt(getFieldValue(['unitCtn', 'UNIT/CTN', 'unitsPerCarton'], 0)),

            // Campos de dimensões - L = l, W = w, H = h, CBM = cbm
            length: parseFloat(getFieldValue(['l', 'L', 'length', 'comprimento', 'len', 'longitude'], 0)),
            width: parseFloat(getFieldValue(['w', 'W', 'width', 'largura', 'wide', 'largura'], 0)),
            height: parseFloat(getFieldValue(['h', 'H', 'height', 'altura', 'high', 'altura'], 0)),
            cbm: parseFloat(getFieldValue(['cbm', 'CBM', 'volume', 'vol', 'cubic_meter'], 0)),

            // Campos de peso - G.W = gw, T.G.W = nw, Peso Unitário(g) = pesoUnitario
            grossWeight: parseFloat(getFieldValue(['gw', 'G.W', 'grossWeight', 'pesoBruto', 'weight', 'peso_bruto', 'gross_weight'], 0)),
            netWeight: parseFloat(getFieldValue(['nw', 'T.G.W', 'netWeight', 'pesoLiquido', 'net_weight', 'peso_liquido'], 0)),
            pesoUnitario: parseFloat(getFieldValue(['pesoUnitario', 'Peso Unitário(g)', 'unitWeight', 'peso_unitario', 'unit_weight'], 0)),

            // Campos de quantidade mínima
            moq: parseFloat(getFieldValue(['moq', 'minimumOrderQuantity', 'minimo_pedido', 'min_order'], 0)),
            moqLogo: parseFloat(getFieldValue(['moqLogo', 'minimumOrderQuantityLogo', 'moq_logo', 'min_order_logo'], 0)),

            // Campos específicos da base de produtos
            marca: getFieldValue(['marca', 'brand', 'manufacturer', 'fabricante']),
            codigoRavi: getFieldValue(['codRavi', 'codigoRavi', 'raviCode']),
            ean: getFieldValue(['ean', 'eanCode']),
            dun: getFieldValue(['dun', 'dunCode']),
            nomeInvoiceEN: getFieldValue(['nomeInvoiceEn', 'nomeInvoiceEN', 'invoiceNameEN']),
            nomeDI: getFieldValue(['nomeDiNb', 'nomeDI', 'diName']),
            nomeRavi: getFieldValue(['nomeRaviProfit', 'nomeRavi', 'raviName']),
            quantidadeMinimaVenda: parseInt(getFieldValue(['qtMinVenda', 'quantidadeMinimaVenda', 'minSaleQuantity'], 0)),
            cest: getFieldValue(['cest']),
            valorInvoiceUSD: parseFloat(getFieldValue(['valorInvoiceUsd', 'valorInvoiceUSD', 'invoiceValueUSD'], 0)),
            observacaoPedido: getFieldValue(['obsPedido', 'observacaoPedido', 'orderObservation']),
            foto: getFieldValue(['foto', 'photo', 'image', 'imageUrl']),

            // Campos adicionais - REMARK = remark, OBS = obs
            remark: getFieldValue(['remark', 'REMARK', 'observacao', 'note', 'notes']),
            observacao: getFieldValue(['obs', 'OBS', 'observacao', 'observacoes', 'observations', 'comments']),
            import: getFieldValue(['import', 'importacao', 'importation', 'importCode']),
            category: getFieldValue(['category', 'categoria', 'cat', 'type', 'tipo']),
            origin: getFieldValue(['origin', 'origem', 'country', 'pais']),
            comments: getFieldValue(['comments', 'comentarios', 'comentarios', 'notes', 'observations']),

            // Campos de metadados
            firebaseId: data.id,
            lastUpdated: data.updatedAt || data.createdAt || new Date()
        };

        console.log(`✅ [FIREBASE DIRECT] Produto normalizado:`, normalizedProduct);
        console.log(`✅ [FIREBASE DIRECT] Produto normalizado válido:`, !!normalizedProduct);
        console.log(`✅ [FIREBASE DIRECT] REF do produto normalizado:`, normalizedProduct.ref);
        return normalizedProduct;
    }

    /**
     * Limpa o cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache da base de produtos limpo');
    }

    /**
     * Obtém estatísticas do cache
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Exportar instância singleton
export const baseProdutosService = new BaseProdutosService();
export default baseProdutosService;

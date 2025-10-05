/**
 * Serviço para buscar produtos da base de dados
 * Conecta com o repositório base-produtos para buscar dados de produtos por REF
 */

import { baseProdutosService } from './baseProdutosFirebaseService';

class ProductSearchService {
    constructor() {
        // URLs para tentar (proxy local primeiro, depois direto)
        this.baseUrls = [
            '/api', // Proxy local configurado no Vite
            'https://base-produtos.vercel.app/api' // URL direta (pode ter CORS)
        ];
        // Cache local para evitar requisições repetidas
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
        this.apiStructure = null; // Cache da estrutura da API
        this.apiStructureCacheTimeout = 10 * 60 * 1000; // 10 minutos
        this.apiFailureDetected = false; // Flag para detectar falha da API externa
        this.apiFailureTimeout = 5 * 60 * 1000; // 5 minutos antes de tentar novamente
    }

    /**
     * Testa a conexão Firebase e verifica se a coleção existe
     * @returns {Promise<Object>} Status da conexão e informações da coleção
     */
    async testFirebaseConnection() {
        try {
            console.log(`🧪 [DEBUG] TESTE DE CONEXÃO FIREBASE`);
            console.log(`🧪 [DEBUG] ===============================`);
            console.log(`🧪 [DEBUG] Chamando baseProdutosService.testConnection()...`);
            
            const result = await baseProdutosService.testConnection();
            console.log(`🧪 [DEBUG] Resultado bruto do teste:`, result);
            console.log(`🧪 [DEBUG] Tipo do resultado:`, typeof result);
            
            if (result.success) {
                console.log(`✅ CONEXÃO FIREBASE OK`);
                console.log(`📊 Documentos na coleção: ${result.documentCount}`);
                
                if (result.sampleDocuments.length > 0) {
                    console.log(`📋 Campos disponíveis nos documentos:`);
                    const allFields = new Set();
                    result.sampleDocuments.forEach(doc => {
                        doc.fields.forEach(field => allFields.add(field));
                    });
                    console.log(`   Campos encontrados:`, Array.from(allFields));
                }
            } else {
                console.log(`❌ ERRO NA CONEXÃO FIREBASE`);
                console.log(`   Erro: ${result.error}`);
                console.log(`   Código: ${result.code}`);
            }
            
            return result;
            
        } catch (error) {
            console.error(`❌ Erro ao testar conexão Firebase:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Descobre automaticamente a estrutura da API
     * @returns {Promise<Object>} - Informações sobre a estrutura da API
     */
    async discoverAPIStructure() {
        // Verificar cache primeiro
        if (this.apiStructure && this.apiStructure.timestamp) {
            const cacheAge = Date.now() - this.apiStructure.timestamp;
            if (cacheAge < this.apiStructureCacheTimeout) {
                console.log('📋 Usando estrutura da API do cache');
                return this.apiStructure;
            }
        }

        console.log('🔍 Descobrindo estrutura da API base-produtos...');
        
        const discoveryEndpoints = [
            '/',
            '/api',
            '/api/products',
            '/api/items',
            '/api/data',
            '/products',
            '/items',
            '/data',
            '/api/search',
            '/search',
            '/api/all',
            '/all'
        ];

        const results = {
            availableEndpoints: [],
            structure: {},
            sampleData: null
        };

        for (const baseUrl of this.baseUrls) {
            for (const endpoint of discoveryEndpoints) {
                try {
                    const fullUrl = `${baseUrl}${endpoint}`;
                    console.log(`📡 Testando endpoint: ${fullUrl}`);
                    
                    const response = await fetch(fullUrl, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        signal: AbortSignal.timeout(3000)
                    });

                    if (response.ok) {
                        const data = await response.json();
                        console.log(`✅ Endpoint ${fullUrl} disponível:`, data);
                        
                        results.availableEndpoints.push(fullUrl);
                        results.structure[endpoint] = {
                            status: response.status,
                            data: data,
                            headers: Object.fromEntries(response.headers.entries())
                        };
                        
                        // Capturar dados de exemplo
                        if (!results.sampleData && data) {
                            results.sampleData = data;
                        }
                    }
                } catch (error) {
                    console.log(`⚠️ Endpoint ${baseUrl}${endpoint} não disponível:`, error.message);
                }
            }
        }

        console.log('📊 Estrutura descoberta:', results);
        
        // Cachear resultado
        this.apiStructure = {
            ...results,
            timestamp: Date.now()
        };
        
        return this.apiStructure;
    }

    /**
     * Busca rápida usando apenas endpoints mais prováveis
     * @param {string} ref - Referência do produto
     * @returns {Promise<Object|null>} - Dados do produto ou null se não encontrado
     */
    async quickSearch(ref) {
        // Se detectamos falha da API recentemente, pular busca externa
        if (this.apiFailureDetected && this.apiFailureTimestamp) {
            const timeSinceFailure = Date.now() - this.apiFailureTimestamp;
            if (timeSinceFailure < this.apiFailureTimeout) {
                console.log(`⚠️ API externa com falha detectada, pulando busca externa (${Math.round((this.apiFailureTimeout - timeSinceFailure) / 1000)}s restantes)`);
                return null;
            } else {
                // Resetar flag após timeout
                this.apiFailureDetected = false;
                this.apiFailureTimestamp = null;
            }
        }

        const encodedRef = encodeURIComponent(ref);
        let corsErrors = 0;
        let networkErrors = 0;
        
        // Apenas os endpoints mais prováveis
        const quickEndpoints = [
            `/products/${ref}`,
            `/products/search?ref=${encodedRef}`,
            `/products/search?referencia=${encodedRef}`,
            `/products/search?code=${encodedRef}`,
            `/search?q=${encodedRef}`,
            `/api/search?q=${encodedRef}`,
            `/all?search=${encodedRef}`
        ];

        for (const baseUrl of this.baseUrls) {
            for (const endpoint of quickEndpoints) {
                try {
                    const fullUrl = `${baseUrl}${endpoint}`;
                    const response = await fetch(fullUrl, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        signal: AbortSignal.timeout(2000) // Timeout mais rápido
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (this.isValidProductData(data, ref)) {
                            console.log(`✅ Produto encontrado via busca rápida: ${fullUrl}`);
                            // Resetar flag de falha se encontrou produto
                            this.apiFailureDetected = false;
                            this.apiFailureTimestamp = null;
                            return this.normalizeProductData(data);
                        }
                    }
                } catch (error) {
                    // Detectar tipos de erro
                    if (error.message.includes('CORS') || error.message.includes('blocked')) {
                        corsErrors++;
                    } else if (error.message.includes('Failed to fetch') || error.message.includes('ERR_FAILED') || error.message.includes('ERR_ABORTED')) {
                        networkErrors++;
                    }
                    continue; // Silenciosamente continua para o próximo
                }
            }
        }

        // Se houve muitos erros de CORS ou rede, marcar API como com falha
        if (corsErrors >= 3 || networkErrors >= 3) {
            this.apiFailureDetected = true;
            this.apiFailureTimestamp = Date.now();
            console.log(`⚠️ API externa marcada como com falha (CORS: ${corsErrors}, Rede: ${networkErrors})`);
        }

        return null;
    }

    /**
     * Busca exclusivamente via API da base de produtos
     * @param {string} ref - Referência do produto
     * @returns {Promise<Object|null>} - Dados do produto ou null se não encontrado
     */
    async searchViaBaseProdutosAPI(ref) {
        try {
            console.log(`🌐 Buscando produto ${ref} na API base-produtos...`);
            
            // MOCK LOCAL - Para testes enquanto a API externa não funciona
            const mockProducts = {
                'MR1165': {
                    referencia: 'MR1165',
                    ncm: '12345678',
                    description: 'Produto MR1165 - Descrição do produto',
                    name: 'Produto MR1165',
                    englishDescription: 'MR1165 Product - Product description',
                    unit: 'PCS',
                    unitPrice: 15.50,
                    length: 10.5,
                    width: 8.2,
                    height: 3.1,
                    cbm: 0.0267,
                    grossWeight: 0.8,
                    netWeight: 0.6,
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
                    unitCtn: 20,
                    itemNo: 'ITEM1165',
                    fabrica: 'Fábrica Exemplo',
                    linhaCotacoes: 'Linha 1',
                    remark: 'Observação geral',
                    observacao: 'Observação específica',
                    import: 'IMP1165',
                    category: 'Categoria A',
                    origin: 'China',
                    comments: 'Comentários do produto'
                },
                'MR1150': {
                    referencia: 'MR1150',
                    ncm: '98765432',
                    description: 'Produto MR1150 - Descrição do produto',
                    name: 'Produto MR1150',
                    englishDescription: 'MR1150 Product - Product description',
                    unit: 'PCS',
                    unitPrice: 25.75,
                    length: 15.2,
                    width: 12.8,
                    height: 5.5,
                    cbm: 0.1074,
                    grossWeight: 1.2,
                    netWeight: 1.0,
                    pesoUnitario: 1.0,
                    moq: 200,
                    moqLogo: 1000,
                    marca: 'Marca Premium',
                    codigoRavi: 'RAV1150',
                    ean: '9876543210987',
                    dun: 'DUN1150',
                    nomeInvoiceEN: 'MR1150 Product',
                    nomeDI: 'Produto MR1150 DI',
                    nomeRavi: 'Produto MR1150 Ravi',
                    quantidadeMinimaVenda: 100,
                    cest: '7654321',
                    valorInvoiceUSD: 25.75,
                    observacaoPedido: 'Observação do pedido MR1150',
                    unitCtn: 10,
                    itemNo: 'ITEM1150',
                    fabrica: 'Fábrica Premium',
                    linhaCotacoes: 'Linha 2',
                    remark: 'Observação geral MR1150',
                    observacao: 'Observação específica MR1150',
                    import: 'IMP1150',
                    category: 'Categoria B',
                    origin: 'Brasil',
                    comments: 'Comentários do produto MR1150'
                }
            };
            
            // Verificar se existe no mock local
            if (mockProducts[ref]) {
                console.log(`✅ Produto ${ref} encontrado no MOCK LOCAL`);
                return this.normalizeProductData(mockProducts[ref]);
            }
            
            const encodedRef = encodeURIComponent(ref);
            
            // Endpoints da API base-produtos para tentar
            // PRIORIDADE: Proxy local primeiro (evita CORS), depois API externa
            const apiEndpoints = [
                // PROXY LOCAL - Evita problemas de CORS
                `/api/products/search?referencia=${encodedRef}`,
                `/api/products?referencia=${encodedRef}`,
                `/api/products/${ref}`,
                `/api/products/search?ref=${encodedRef}`,
                `/api/search?referencia=${encodedRef}`,
                `/api/search?q=${encodedRef}`,
                
                // API EXTERNA - Fallback se proxy falhar
                `https://base-produtos.vercel.app/api/products/search?referencia=${encodedRef}`,
                `https://base-produtos.vercel.app/api/products?referencia=${encodedRef}`,
                `https://base-produtos.vercel.app/api/products/${ref}`,
                `https://base-produtos.vercel.app/api/products/search?ref=${encodedRef}`,
                
                // Endpoints alternativos
                `https://base-produtos.vercel.app/api/search?referencia=${encodedRef}`,
                `https://base-produtos.vercel.app/api/search?q=${encodedRef}`,
                `https://base-produtos.vercel.app/api/search?query=${encodedRef}`,
                `https://base-produtos.vercel.app/api/search?term=${encodedRef}`,
                
                // Endpoints com diferentes parâmetros
                `https://base-produtos.vercel.app/api/products?ref=${encodedRef}`,
                `https://base-produtos.vercel.app/api/products/search?code=${encodedRef}`,
                `https://base-produtos.vercel.app/api/products/search?sku=${encodedRef}`,
                `https://base-produtos.vercel.app/api/products?code=${encodedRef}`,
                
                // Endpoints de busca geral
                `https://base-produtos.vercel.app/api/all?search=${encodedRef}`,
                `https://base-produtos.vercel.app/api/all?q=${encodedRef}`,
                `https://base-produtos.vercel.app/api/all?query=${encodedRef}`
            ];

            let attempts = 0;
            const maxAttempts = 15; // Limitar tentativas para evitar muitas requisições

            for (const endpoint of apiEndpoints) {
                if (attempts >= maxAttempts) {
                    console.log(`⚠️ Limite de tentativas atingido (${maxAttempts})`);
                    break;
                }

                    try {
                        console.log(`📡 Tentativa ${attempts + 1}: ${endpoint}`);
                        
                        // Determinar se é endpoint local (proxy) ou externo
                        const isLocalEndpoint = endpoint.startsWith('/');
                        const fullUrl = isLocalEndpoint ? `${window.location.origin}${endpoint}` : endpoint;
                        
                        console.log(`🌐 ${isLocalEndpoint ? 'PROXY LOCAL' : 'API EXTERNA'}: ${fullUrl}`);

                        const response = await fetch(fullUrl, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                'User-Agent': 'Fabricas-System/1.0'
                            },
                            signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
                        });

                    attempts++;

                    if (response.ok) {
                        const data = await response.json();
                        console.log(`📦 Dados recebidos de ${endpoint}:`, data);
                        
                            // Verificar se encontrou o produto
                            if (this.isValidProductData(data, ref)) {
                                console.log(`✅ Produto ${ref} encontrado via ${isLocalEndpoint ? 'PROXY LOCAL' : 'API EXTERNA'}: ${endpoint}`);
                                return this.normalizeProductData(data);
                            }
                    } else {
                        console.log(`📊 Resposta ${response.status} de ${endpoint}`);
                    }
                } catch (error) {
                    attempts++;
                    console.log(`⚠️ Endpoint ${endpoint} falhou:`, error.message);
                    continue;
                }
            }

            console.log(`❌ Produto ${ref} não encontrado em nenhum endpoint da API base-produtos`);
            return null;

        } catch (error) {
            console.error(`❌ Erro ao buscar produto ${ref} na API base-produtos:`, error);
            return null;
        }
    }

    /**
     * Busca direta no banco de dados do sistema base-produtos
     * @param {string} ref - Referência do produto
     * @returns {Promise<Object|null>} - Dados do produto ou null se não encontrado
     */
    async searchInDatabase(ref) {
        // Função removida - usando apenas API base-produtos
        return null;
    }

    /**
     * Gera todos os endpoints possíveis para busca com todos os campos equivalentes
     * @param {string} ref - Referência do produto
     * @returns {Array} - Lista de endpoints para testar
     */
    generateAllSearchEndpoints(ref) {
        const encodedRef = encodeURIComponent(ref);
        
        // Todos os campos equivalentes possíveis
        const referenceFields = [
            'ref', 'referencia', 'reference', 'code', 'codigo', 'sku', 'id', 
            'productId', 'productCode', 'itemCode', 'itemId', 'productRef',
            'codigoProduto', 'codigo_produto', 'product_code', 'item_code',
            'product_ref', 'item_ref', 'reference_code', 'ref_code',
            'product_sku', 'item_sku', 'product_id', 'item_id',
            'codigo', 'cod', 'ref_code', 'ref_code', 'product_ref',
            'item_ref', 'reference_code', 'ref_code', 'product_sku',
            'item_sku', 'product_id', 'item_id', 'codigo', 'cod'
        ];

        // Todos os endpoints base possíveis
        const baseEndpoints = [
            '/products', '/items', '/data', '/products/search', '/items/search',
            '/data/search', '/search', '/api/products', '/api/items', '/api/data',
            '/api/search', '/all', '/api/all', '/products/all', '/items/all'
        ];

        const endpoints = [];

        // Gerar endpoints para cada combinação
        for (const baseEndpoint of baseEndpoints) {
            // Busca direta por ID
            endpoints.push(`${baseEndpoint}/${ref}`);
            
            // Busca por parâmetros de query
            for (const field of referenceFields) {
                endpoints.push(`${baseEndpoint}?${field}=${encodedRef}`);
                endpoints.push(`${baseEndpoint}?search=${encodedRef}&field=${field}`);
                endpoints.push(`${baseEndpoint}?q=${encodedRef}&type=${field}`);
            }
            
            // Busca geral
            endpoints.push(`${baseEndpoint}?search=${encodedRef}`);
            endpoints.push(`${baseEndpoint}?q=${encodedRef}`);
            endpoints.push(`${baseEndpoint}?query=${encodedRef}`);
            endpoints.push(`${baseEndpoint}?term=${encodedRef}`);
            endpoints.push(`${baseEndpoint}?keyword=${encodedRef}`);
        }

        // Endpoints especiais
        const specialEndpoints = [
            `/search?q=${encodedRef}`,
            `/search?query=${encodedRef}`,
            `/search?term=${encodedRef}`,
            `/search?keyword=${encodedRef}`,
            `/search?ref=${encodedRef}`,
            `/search?code=${encodedRef}`,
            `/search?sku=${encodedRef}`,
            `/search?referencia=${encodedRef}`,
            `/all?search=${encodedRef}`,
            `/all?q=${encodedRef}`,
            `/all?query=${encodedRef}`,
            `/api/search?q=${encodedRef}`,
            `/api/search?query=${encodedRef}`,
            `/api/search?term=${encodedRef}`,
            `/api/search?keyword=${encodedRef}`,
            `/api/search?ref=${encodedRef}`,
            `/api/search?code=${encodedRef}`,
            `/api/search?sku=${encodedRef}`,
            `/api/search?referencia=${encodedRef}`
        ];

        endpoints.push(...specialEndpoints);

        // Remover duplicatas
        return [...new Set(endpoints)];
    }

    /**
     * Gera endpoints prioritários (mais comuns) para busca rápida
     * @param {string} ref - Referência do produto
     * @returns {Array} - Lista de endpoints prioritários
     */
    generatePriorityEndpoints(ref) {
        const encodedRef = encodeURIComponent(ref);
        
        // Endpoints mais comuns e prováveis
        return [
            // Busca direta por ID
            `/products/${ref}`,
            `/items/${ref}`,
            `/data/${ref}`,
            `/api/products/${ref}`,
            `/api/items/${ref}`,
            
            // Busca por campos mais comuns
            `/products/search?ref=${encodedRef}`,
            `/products/search?referencia=${encodedRef}`,
            `/products/search?code=${encodedRef}`,
            `/products/search?sku=${encodedRef}`,
            `/products/search?id=${encodedRef}`,
            
            // Busca geral mais comum
            `/products?ref=${encodedRef}`,
            `/products?referencia=${encodedRef}`,
            `/products?code=${encodedRef}`,
            `/products?sku=${encodedRef}`,
            `/products?id=${encodedRef}`,
            
            // Busca por query geral
            `/search?q=${encodedRef}`,
            `/search?query=${encodedRef}`,
            `/search?ref=${encodedRef}`,
            `/search?code=${encodedRef}`,
            `/search?sku=${encodedRef}`,
            `/search?referencia=${encodedRef}`,
            
            // API endpoints
            `/api/search?q=${encodedRef}`,
            `/api/search?query=${encodedRef}`,
            `/api/search?ref=${encodedRef}`,
            `/api/search?code=${encodedRef}`,
            `/api/search?sku=${encodedRef}`,
            `/api/search?referencia=${encodedRef}`,
            
            // Busca em todas as coleções
            `/all?search=${encodedRef}`,
            `/all?q=${encodedRef}`,
            `/all?ref=${encodedRef}`,
            `/all?code=${encodedRef}`,
            `/all?sku=${encodedRef}`,
            `/all?referencia=${encodedRef}`
        ];
    }

    /**
     * Busca um produto por REF na base de dados
     * @param {string} ref - Referência do produto
     * @returns {Promise<Object|null>} - Dados do produto ou null se não encontrado
     */
    async searchProductByRef(ref) {
        if (!ref || !ref.trim()) {
            console.log('❌ REF vazia ou inválida');
            return null;
        }

        const cleanRef = ref.trim().toUpperCase();
        console.log(`🔍 [DEBUG] Iniciando busca para REF: "${cleanRef}"`);
        console.log(`🔍 [DEBUG] Tipo da REF: ${typeof cleanRef}, Tamanho: ${cleanRef.length}`);
        console.log(`🔍 [DEBUG] REF original: "${ref}"`);
        
        // Verificar cache primeiro
        if (this.cache.has(cleanRef)) {
            const cached = this.cache.get(cleanRef);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log(`📦 Produto ${cleanRef} encontrado no cache`);
                return cached.data;
            } else {
                this.cache.delete(cleanRef);
            }
        }

        try {
            console.log(`🔍 [FIREBASE ONLY] Buscando produto REF: ${cleanRef} APENAS no Firebase`);
            console.log(`📋 [FIREBASE ONLY] MAPEAMENTO: REF do sistema = campo "referencia" na base de produtos`);
            
            // PRIORIDADE 1: Busca APENAS via Firebase (base de produtos)
            console.log(`🔥 [FIREBASE ONLY] Buscando APENAS no Firebase...`);
            console.log(`🔥 [FIREBASE ONLY] Chamando baseProdutosService.searchProductByRef("${cleanRef}")`);
            try {
                let productData = await baseProdutosService.searchProductByRef(cleanRef);
                console.log(`🔥 [FIREBASE ONLY] Resposta Firebase:`, productData);
                if (productData) {
                    console.log(`✅ [FIREBASE ONLY] Produto ${cleanRef} encontrado via Firebase`);
                    console.log(`✅ [FIREBASE ONLY] Dados recebidos:`, JSON.stringify(productData, null, 2));
                    console.log(`✅ [FIREBASE ONLY] Tipo dos dados:`, typeof productData);
                    console.log(`✅ [FIREBASE ONLY] Dados válidos:`, !!productData);
                    console.log(`✅ [FIREBASE ONLY] REF dos dados:`, productData.ref);
                    this.cache.set(cleanRef, {
                        data: productData,
                        timestamp: Date.now()
                    });
                    console.log(`✅ [FIREBASE ONLY] Retornando dados para CreateQuote...`);
                    return productData;
                } else {
                    console.log(`❌ [FIREBASE ONLY] Produto ${cleanRef} não encontrado via Firebase`);
                    console.log(`❌ [FIREBASE ONLY] Produto ${cleanRef} não encontrado - apenas Firebase disponível`);
                    return null;
                }
            } catch (firebaseError) {
                console.error(`❌ [FIREBASE ONLY] Erro ao buscar no Firebase:`, firebaseError);
                console.log(`❌ [FIREBASE ONLY] Tipo do erro:`, typeof firebaseError);
                console.log(`❌ [FIREBASE ONLY] Mensagem do erro:`, firebaseError.message);
                console.log(`❌ [FIREBASE ONLY] Erro no Firebase - produto não encontrado`);
                return null;
            }

        } catch (error) {
            console.error(`❌ Erro ao buscar produto ${cleanRef}:`, error);
            return null;
        }
    }

    /**
     * Verifica se os dados retornados são válidos para o produto
     * @param {any} data - Dados retornados da API
     * @param {string} ref - REF esperada
     * @returns {boolean}
     */
    isValidProductData(data, ref) {
        if (!data) return false;
        
        const refUpper = ref.toUpperCase();
        
        // Função para verificar se um item tem a referência correta
        const hasMatchingReference = (item) => {
            if (!item || typeof item !== 'object') return false;
            
            // Verificar diferentes campos de referência possíveis
            // PRIORIDADE: Campo "referencia" é o principal (REF do produto)
            const referenceFields = [
                'referencia', 'REF', 'ref', 'reference', 'code', 'codigo', 
                'sku', 'id', 'productId', 'productCode', 'itemCode'
            ];
            
            return referenceFields.some(field => {
                const value = item[field];
                return value && value.toString().toUpperCase() === refUpper;
            });
        };
        
        // Se é um array, verificar se tem produtos
        if (Array.isArray(data)) {
            return data.length > 0 && data.some(hasMatchingReference);
        }
        
        // Se é um objeto, verificar se tem REF correspondente
        if (typeof data === 'object') {
            return hasMatchingReference(data);
        }
        
        return false;
    }

    /**
     * Normaliza os dados do produto para o formato esperado
     * @param {any} data - Dados brutos da API
     * @returns {Object} - Dados normalizados
     */
    normalizeProductData(data) {
        let product = null;

        // Se é array, pegar o primeiro produto que corresponde
        if (Array.isArray(data)) {
            product = data.find(item => {
                // Verificar diferentes campos de referência
                const referenceFields = ['ref', 'referencia', 'reference', 'code', 'codigo', 'sku', 'id'];
                return referenceFields.some(field => item[field]);
            });
        } else {
            product = data;
        }

        if (!product) return null;

        // Função para obter valor de diferentes campos possíveis
        const getFieldValue = (fieldMappings, defaultValue = '') => {
            for (const mapping of fieldMappings) {
                if (product[mapping] !== undefined && product[mapping] !== null && product[mapping] !== '') {
                    return product[mapping];
                }
            }
            return defaultValue;
        };

        // Mapear campos para o formato esperado
        // EQUIVALÊNCIA ESPECÍFICA DOS CAMPOS
        return {
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
    }

    /**
     * Busca produtos localmente (simulação de base de dados local)
     * @param {string} ref - REF do produto
     * @returns {Promise<Object|null>}
     */
    async searchLocalProducts(ref) {
        console.log(`🔍 Buscando produto ${ref} na base local...`);
        
        // Base de dados local expandida com produtos comuns
        const localProducts = {
            // Produtos de exemplo básicos
            'ABC123': {
                ref: 'ABC123',
                ncm: '12345678',
                description: 'Produto de Exemplo ABC123',
                name: 'Produto ABC123',
                englishDescription: 'Example Product ABC123',
                unit: 'PCS',
                unitPrice: 10.50,
                length: 20,
                width: 15,
                height: 10,
                cbm: 0.003,
                grossWeight: 0.5,
                netWeight: 0.4,
                pesoUnitario: 400,
                moq: 100,
                moqLogo: 500
            },
            'DEF456': {
                ref: 'DEF456',
                ncm: '87654321',
                description: 'Produto de Exemplo DEF456',
                name: 'Produto DEF456',
                englishDescription: 'Example Product DEF456',
                unit: 'PCS',
                unitPrice: 25.00,
                length: 30,
                width: 20,
                height: 15,
                cbm: 0.009,
                grossWeight: 1.2,
                netWeight: 1.0,
                pesoUnitario: 1000,
                moq: 50,
                moqLogo: 200
            },
            // Produtos comuns que podem ser testados
            'MR1': {
                ref: 'MR1',
                ncm: '94036000',
                description: 'Cadeira de Madeira MR1',
                name: 'Cadeira MR1',
                englishDescription: 'Wooden Chair MR1',
                unit: 'PCS',
                unitPrice: 45.00,
                length: 45,
                width: 40,
                height: 85,
                cbm: 0.153,
                grossWeight: 8.5,
                netWeight: 7.2,
                pesoUnitario: 7200,
                moq: 20,
                moqLogo: 100
            },
            'MR1165': {
                referencia: 'MR1165', // Usando campo 'referencia' em vez de 'ref'
                ncm: '94036000',
                descricao: 'Cadeira de Madeira MR1165',
                nome: 'Cadeira MR1165',
                descricaoIngles: 'Wooden Chair MR1165',
                unidade: 'PCS',
                precoUnitario: 48.50,
                comprimento: 45,
                largura: 40,
                altura: 85,
                volume: 0.153,
                pesoBruto: 8.8,
                pesoLiquido: 7.5,
                pesoUnitario: 7500,
                minimo_pedido: 25,
                moq_logo: 120
            },
            'TB001': {
                ref: 'TB001',
                ncm: '94036000',
                description: 'Mesa de Bambu TB001',
                name: 'Mesa TB001',
                englishDescription: 'Bamboo Table TB001',
                unit: 'PCS',
                unitPrice: 120.00,
                length: 120,
                width: 60,
                height: 75,
                cbm: 0.540,
                grossWeight: 15.0,
                netWeight: 12.5,
                pesoUnitario: 12500,
                moq: 10,
                moqLogo: 50
            },
            'GLASS001': {
                ref: 'GLASS001',
                ncm: '70134900',
                description: 'Garrafa de Vidro GLASS001',
                name: 'Garrafa GLASS001',
                englishDescription: 'Glass Bottle GLASS001',
                unit: 'PCS',
                unitPrice: 3.50,
                length: 8,
                width: 8,
                height: 25,
                cbm: 0.0016,
                grossWeight: 0.8,
                netWeight: 0.6,
                pesoUnitario: 600,
                moq: 1000,
                moqLogo: 5000
            },
            'THERMAL001': {
                ref: 'THERMAL001',
                ncm: '96170010',
                description: 'Garrafa Térmica THERMAL001',
                name: 'Garrafa Térmica THERMAL001',
                englishDescription: 'Thermal Bottle THERMAL001',
                unit: 'PCS',
                unitPrice: 8.90,
                length: 7,
                width: 7,
                height: 20,
                cbm: 0.00098,
                grossWeight: 0.4,
                netWeight: 0.3,
                pesoUnitario: 300,
                moq: 500,
                moqLogo: 2000
            },
            'CERAMIC001': {
                ref: 'CERAMIC001',
                ncm: '69120000',
                description: 'Prato de Cerâmica CERAMIC001',
                name: 'Prato CERAMIC001',
                englishDescription: 'Ceramic Plate CERAMIC001',
                unit: 'PCS',
                unitPrice: 2.80,
                length: 25,
                width: 25,
                height: 3,
                cbm: 0.001875,
                grossWeight: 0.6,
                netWeight: 0.5,
                pesoUnitario: 500,
                moq: 2000,
                moqLogo: 10000
            },
            'TEXTILE001': {
                ref: 'TEXTILE001',
                ncm: '63024000',
                description: 'Toalha de Mesa TEXTILE001',
                name: 'Toalha TEXTILE001',
                englishDescription: 'Table Cloth TEXTILE001',
                unit: 'PCS',
                unitPrice: 12.00,
                length: 150,
                width: 100,
                height: 0.5,
                cbm: 0.0075,
                grossWeight: 0.3,
                netWeight: 0.25,
                pesoUnitario: 250,
                moq: 100,
                moqLogo: 500
            },
            // Produtos com diferentes estruturas de campos
            'CODE123': {
                code: 'CODE123', // Usando campo 'code'
                codigoNCM: '70134900',
                descricao: 'Produto com campo CODE',
                nome: 'Produto CODE123',
                descriptionEN: 'Product with CODE field',
                unidade: 'PCS',
                price: 15.75,
                l: 30,
                w: 20,
                h: 10,
                vol: 0.006,
                weight: 1.2,
                net_weight: 1.0,
                unit_weight: 1000,
                minimumOrderQuantity: 50,
                minimumOrderQuantityLogo: 200
            },
            'SKU456': {
                sku: 'SKU456', // Usando campo 'sku'
                ncmCode: '69120000',
                productName: 'Produto SKU456',
                english_desc: 'Product with SKU field',
                measurement: 'PCS',
                unit_price: 8.25,
                len: 25,
                wide: 25,
                high: 5,
                cubic_meter: 0.003125,
                gross_weight: 0.8,
                peso_liquido: 0.6,
                peso_unitario: 600,
                min_order: 100,
                min_order_logo: 500
            },
            'MR1155': {
                ref: 'MR1155',
                ncm: '94036000',
                description: 'Cadeira de Madeira MR1155',
                name: 'Cadeira MR1155',
                englishDescription: 'Wooden Chair MR1155',
                unit: 'PCS',
                unitPrice: 52.00,
                length: 45,
                width: 40,
                height: 85,
                cbm: 0.153,
                grossWeight: 9.0,
                netWeight: 7.8,
                pesoUnitario: 7800,
                moq: 30,
                moqLogo: 150
            },
            'MR1177': {
                ref: 'MR1177',
                ncm: '94036000',
                description: 'Cadeira de Madeira MR1177',
                name: 'Cadeira MR1177',
                englishDescription: 'Wooden Chair MR1177',
                unit: 'PCS',
                unitPrice: 55.00,
                length: 45,
                width: 40,
                height: 85,
                cbm: 0.153,
                grossWeight: 9.2,
                netWeight: 8.0,
                pesoUnitario: 8000,
                moq: 25,
                moqLogo: 120
            },
            'MR1165': {
                ref: 'MR1165',
                ncm: '94036000',
                description: 'Cadeira de Madeira MR1165',
                name: 'Cadeira MR1165',
                englishDescription: 'Wooden Chair MR1165',
                unit: 'PCS',
                unitPrice: 48.00,
                length: 45,
                width: 40,
                height: 85,
                cbm: 0.153,
                grossWeight: 8.8,
                netWeight: 7.6,
                pesoUnitario: 7600,
                moq: 35,
                moqLogo: 180
            },
            'MR1150': {
                ref: 'MR1150',
                marca: 'MORI',
                nome: 'PORTA GUARDANAPO METAL MR1150',
                linhaCotacoes: '',
                referencia: 'MR1150',
                fabrica: '',
                itemNo: '',
                description: 'Tenedor de tecido\n铁艺纸巾架\n材质:铁+竹子尺寸:18*7.5cm 挂客人吊卡\nmaterial: ferro+bambu,tamanho: 18*7.5cm 1pcs/tag de cliente',
                name: '',
                remark: '',
                observacao: '',
                moq: '',
                unitCtn: 48,
                unitPriceRMB: 9.5,
                unit: 'PC',
                width: 58,
                length: 40,
                height: 33,
                cbm: 0.07656,
                grossWeight: 21.7,
                netWeight: 20.64,
                pesoUnitario: 0.47,
                marca: 'MORI',
                codigoRavi: 57373,
                ean: 7898258621695,
                dun: 17898258621692,
                nomeInvoiceEN: 'IRON NAPKIN HOLDER MR1150',
                nomeDI: 'PORTA GUARDANAPO EM FERRO E BAMBU (18X7,5) MR1150',
                nomeRavi: 'PORTA GUARDANAPO METAL MR1150',
                quantidadeMinimaVenda: 1,
                ncm: '73239900',
                cest: '',
                valorInvoiceUSD: 0.4873,
                observacaoPedido: 'ATUALIZAR EMBALAGEM 2024',
                // Campos mapeados para compatibilidade
                ncmCode: '73239900',
                productName: 'PORTA GUARDANAPO METAL MR1150',
                english_desc: 'IRON NAPKIN HOLDER MR1150',
                measurement: 'PC',
                unit_price: 9.5,
                len: 40,
                wide: 58,
                high: 33,
                cubic_meter: 0.07656,
                gross_weight: 21.7,
                peso_liquido: 20.64,
                peso_unitario: 0.47,
                min_order: '',
                min_order_logo: '',
                // Campos adicionais específicos da base
                brand: 'MORI',
                raviCode: 57373,
                eanCode: 7898258621695,
                dunCode: 17898258621692,
                invoiceNameEN: 'IRON NAPKIN HOLDER MR1150',
                diName: 'PORTA GUARDANAPO EM FERRO E BAMBU (18X7,5) MR1150',
                raviName: 'PORTA GUARDANAPO METAL MR1150',
                minSaleQuantity: 1,
                invoiceValueUSD: 0.4873,
                orderObservation: 'ATUALIZAR EMBALAGEM 2024'
            }
        };

        const product = localProducts[ref.toUpperCase()];
        if (product) {
            console.log(`✅ Produto ${ref} encontrado na base local`);
            return product;
        }

        console.log(`❌ Produto ${ref} não encontrado na base local`);
        return null;
    }

    /**
     * Busca produtos localmente (simulação de base de dados local)
     * @param {string} ref - REF do produto
     * @returns {Promise<Object|null>}
     */
    async searchLocalProducts(ref) {
        // Função removida - usando apenas API base-produtos
        return null;
    }

    /**
     * Limpa o cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🧹 Cache de produtos limpo');
    }

    /**
     * Obtém estatísticas do cache
     * @returns {Object}
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Instância singleton
const productSearchService = new ProductSearchService();

export default productSearchService;

/**
 * Serviço para busca direta no banco de dados do sistema base-produtos
 * Este serviço implementa diferentes estratégias para acessar os dados
 */

class DatabaseSearchService {
    constructor() {
        // Configurações de conexão com o banco de dados
        this.databaseConfig = {
            // Configurações para diferentes tipos de banco
            mysql: {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'base_produtos'
            },
            // Configurações para PostgreSQL
            postgresql: {
                host: process.env.PG_HOST || 'localhost',
                port: process.env.PG_PORT || 5432,
                user: process.env.PG_USER || 'postgres',
                password: process.env.PG_PASSWORD || '',
                database: process.env.PG_DB || 'base_produtos'
            },
            // Configurações para MongoDB
            mongodb: {
                uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/base_produtos'
            }
        };

        // Cache para resultados
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    }

    /**
     * Busca produto por referência no banco de dados
     * @param {string} ref - Referência do produto
     * @returns {Promise<Object|null>} - Dados do produto ou null se não encontrado
     */
    async searchProductByRef(ref) {
        const cleanRef = ref.trim().toUpperCase();
        
        // Verificar cache primeiro
        if (this.cache.has(cleanRef)) {
            const cached = this.cache.get(cleanRef);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log(`📋 Produto ${cleanRef} encontrado no cache`);
                return cached.data;
            } else {
                this.cache.delete(cleanRef);
            }
        }

        console.log(`🔍 Buscando produto ${cleanRef} no banco de dados...`);

        try {
            // Tentar diferentes estratégias de busca
            let productData = null;

            // Estratégia 1: Busca via API do sistema base-produtos (se disponível)
            productData = await this.searchViaAPI(cleanRef);
            if (productData) {
                this.cacheResult(cleanRef, productData);
                return productData;
            }

            // Estratégia 2: Busca direta no banco MySQL
            productData = await this.searchViaMySQL(cleanRef);
            if (productData) {
                this.cacheResult(cleanRef, productData);
                return productData;
            }

            // Estratégia 3: Busca direta no banco PostgreSQL
            productData = await this.searchViaPostgreSQL(cleanRef);
            if (productData) {
                this.cacheResult(cleanRef, productData);
                return productData;
            }

            // Estratégia 4: Busca no MongoDB
            productData = await this.searchViaMongoDB(cleanRef);
            if (productData) {
                this.cacheResult(cleanRef, productData);
                return productData;
            }

            // Estratégia 5: Busca em arquivo JSON local (fallback)
            productData = await this.searchViaLocalFile(cleanRef);
            if (productData) {
                this.cacheResult(cleanRef, productData);
                return productData;
            }

            console.log(`❌ Produto ${cleanRef} não encontrado em nenhuma fonte`);
            return null;

        } catch (error) {
            console.error(`❌ Erro ao buscar produto ${cleanRef}:`, error);
            return null;
        }
    }

    /**
     * Busca via API do sistema base-produtos
     * @param {string} ref - Referência do produto
     * @returns {Promise<Object|null>}
     */
    async searchViaAPI(ref) {
        try {
            console.log(`🌐 Tentando busca via API para ${ref}`);
            
            const apiEndpoints = [
                `https://base-produtos.vercel.app/api/products/${ref}`,
                `https://base-produtos.vercel.app/api/products/search?ref=${ref}`,
                `https://base-produtos.vercel.app/api/products/search?referencia=${ref}`,
                `https://base-produtos.vercel.app/api/search?q=${ref}`
            ];

            for (const endpoint of apiEndpoints) {
                try {
                    const response = await fetch(endpoint, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        signal: AbortSignal.timeout(3000)
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (this.isValidProductData(data, ref)) {
                            console.log(`✅ Produto ${ref} encontrado via API: ${endpoint}`);
                            return this.normalizeProductData(data);
                        }
                    }
                } catch (error) {
                    continue; // Tentar próximo endpoint
                }
            }

            return null;
        } catch (error) {
            console.log(`⚠️ Erro na busca via API: ${error.message}`);
            return null;
        }
    }

    /**
     * Busca direta no banco MySQL
     * @param {string} ref - Referência do produto
     * @returns {Promise<Object|null>}
     */
    async searchViaMySQL(ref) {
        try {
            console.log(`🗄️ Tentando busca no MySQL para ${ref}`);
            
            // Esta implementação seria feita no backend
            // Por enquanto, retornamos null para indicar que não está implementado
            console.log(`⚠️ Busca MySQL não implementada (requer backend)`);
            return null;
        } catch (error) {
            console.log(`⚠️ Erro na busca MySQL: ${error.message}`);
            return null;
        }
    }

    /**
     * Busca direta no banco PostgreSQL
     * @param {string} ref - Referência do produto
     * @returns {Promise<Object|null>}
     */
    async searchViaPostgreSQL(ref) {
        try {
            console.log(`🐘 Tentando busca no PostgreSQL para ${ref}`);
            
            // Esta implementação seria feita no backend
            // Por enquanto, retornamos null para indicar que não está implementado
            console.log(`⚠️ Busca PostgreSQL não implementada (requer backend)`);
            return null;
        } catch (error) {
            console.log(`⚠️ Erro na busca PostgreSQL: ${error.message}`);
            return null;
        }
    }

    /**
     * Busca no MongoDB
     * @param {string} ref - Referência do produto
     * @returns {Promise<Object|null>}
     */
    async searchViaMongoDB(ref) {
        try {
            console.log(`🍃 Tentando busca no MongoDB para ${ref}`);
            
            // Esta implementação seria feita no backend
            // Por enquanto, retornamos null para indicar que não está implementado
            console.log(`⚠️ Busca MongoDB não implementada (requer backend)`);
            return null;
        } catch (error) {
            console.log(`⚠️ Erro na busca MongoDB: ${error.message}`);
            return null;
        }
    }

    /**
     * Busca em arquivo JSON local (fallback)
     * @param {string} ref - Referência do produto
     * @returns {Promise<Object|null>}
     */
    async searchViaLocalFile(ref) {
        try {
            console.log(`📁 Tentando busca em arquivo local para ${ref}`);
            
            // Base de dados local simulada
            const localProducts = {
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
                }
            };

            const product = localProducts[ref];
            if (product) {
                console.log(`✅ Produto ${ref} encontrado em arquivo local`);
                return this.normalizeProductData(product);
            }

            return null;
        } catch (error) {
            console.log(`⚠️ Erro na busca em arquivo local: ${error.message}`);
            return null;
        }
    }

    /**
     * Verifica se os dados são válidos para um produto
     * @param {Object} data - Dados recebidos
     * @param {string} ref - Referência esperada
     * @returns {boolean}
     */
    isValidProductData(data, ref) {
        if (!data || typeof data !== 'object') return false;
        
        // Verificar se tem pelo menos uma referência válida
        const possibleRefs = [
            data.ref, data.referencia, data.code, data.sku, data.id,
            data.productRef, data.productCode, data.reference
        ];
        
        return possibleRefs.some(r => r && r.toString().toUpperCase() === ref.toUpperCase());
    }

    /**
     * Normaliza os dados do produto para o formato padrão
     * @param {Object} data - Dados brutos do produto
     * @returns {Object} - Dados normalizados
     */
    normalizeProductData(data) {
        return {
            ref: data.ref || data.referencia || data.code || data.sku || data.id || '',
            ncm: data.ncm || data.ncmCode || data.ncm_code || '',
            description: data.description || data.name || data.productName || data.product_name || '',
            name: data.name || data.description || data.productName || data.product_name || '',
            englishDescription: data.englishDescription || data.english_desc || data.englishDescription || '',
            unit: data.unit || data.measurement || data.unidade || 'PCS',
            unitPrice: parseFloat(data.unitPrice || data.unit_price || data.price || data.preco || 0),
            length: parseFloat(data.length || data.len || data.comprimento || 0),
            width: data.width || data.wide || data.largura || 0,
            height: data.height || data.high || data.altura || 0,
            cbm: parseFloat(data.cbm || data.cubic_meter || data.cubicMeter || 0),
            grossWeight: parseFloat(data.grossWeight || data.gross_weight || data.pesoBruto || 0),
            netWeight: parseFloat(data.netWeight || data.net_weight || data.pesoLiquido || data.peso_liquido || 0),
            pesoUnitario: parseFloat(data.pesoUnitario || data.peso_unitario || data.unitWeight || data.unit_weight || 0),
            moq: parseInt(data.moq || data.minimumOrderQuantity || data.min_order || data.minOrder || 0),
            moqLogo: parseInt(data.moqLogo || data.minimumOrderQuantityLogo || data.min_order_logo || data.minOrderLogo || 0)
        };
    }

    /**
     * Cacheia o resultado da busca
     * @param {string} ref - Referência do produto
     * @param {Object} data - Dados do produto
     */
    cacheResult(ref, data) {
        this.cache.set(ref, {
            data: data,
            timestamp: Date.now()
        });
    }

    /**
     * Limpa o cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache limpo');
    }

    /**
     * Obtém estatísticas do cache
     * @returns {Object} - Estatísticas do cache
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }
}

// Exportar instância singleton
export const databaseSearchService = new DatabaseSearchService();
export default databaseSearchService;

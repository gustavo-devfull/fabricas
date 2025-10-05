/**
 * Endpoint local para busca no banco de dados do sistema base-produtos
 * Este arquivo seria executado no backend (Node.js/Express)
 */

import express from 'express';
import mysql from 'mysql2/promise';
import pg from 'pg';
import { MongoClient } from 'mongodb';

const app = express();
app.use(express.json());

// Configurações de conexão com diferentes bancos
const dbConfigs = {
    mysql: {
        host: process.env.MYSQL_HOST || 'localhost',
        port: process.env.MYSQL_PORT || 3306,
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DB || 'base_produtos'
    },
    postgresql: {
        host: process.env.PG_HOST || 'localhost',
        port: process.env.PG_PORT || 5432,
        user: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASSWORD || '',
        database: process.env.PG_DB || 'base_produtos'
    },
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/base_produtos'
    }
};

/**
 * Busca produto no MySQL
 * @param {string} ref - Referência do produto
 * @returns {Promise<Object|null>}
 */
async function searchInMySQL(ref) {
    try {
        const connection = await mysql.createConnection(dbConfigs.mysql);
        
        // Tentar diferentes campos de referência
        const queries = [
            `SELECT * FROM produtos WHERE ref = ?`,
            `SELECT * FROM produtos WHERE referencia = ?`,
            `SELECT * FROM produtos WHERE code = ?`,
            `SELECT * FROM produtos WHERE sku = ?`,
            `SELECT * FROM products WHERE ref = ?`,
            `SELECT * FROM products WHERE referencia = ?`,
            `SELECT * FROM products WHERE code = ?`,
            `SELECT * FROM products WHERE sku = ?`
        ];

        for (const query of queries) {
            try {
                const [rows] = await connection.execute(query, [ref]);
                if (rows.length > 0) {
                    await connection.end();
                    return rows[0];
                }
            } catch (error) {
                // Tabela pode não existir, continuar para próxima query
                continue;
            }
        }

        await connection.end();
        return null;
    } catch (error) {
        console.error('Erro MySQL:', error);
        return null;
    }
}

/**
 * Busca produto no PostgreSQL
 * @param {string} ref - Referência do produto
 * @returns {Promise<Object|null>}
 */
async function searchInPostgreSQL(ref) {
    try {
        const client = new pg.Client(dbConfigs.postgresql);
        await client.connect();

        const queries = [
            `SELECT * FROM produtos WHERE ref = $1`,
            `SELECT * FROM produtos WHERE referencia = $1`,
            `SELECT * FROM produtos WHERE code = $1`,
            `SELECT * FROM produtos WHERE sku = $1`,
            `SELECT * FROM products WHERE ref = $1`,
            `SELECT * FROM products WHERE referencia = $1`,
            `SELECT * FROM products WHERE code = $1`,
            `SELECT * FROM products WHERE sku = $1`
        ];

        for (const query of queries) {
            try {
                const result = await client.query(query, [ref]);
                if (result.rows.length > 0) {
                    await client.end();
                    return result.rows[0];
                }
            } catch (error) {
                // Tabela pode não existir, continuar para próxima query
                continue;
            }
        }

        await client.end();
        return null;
    } catch (error) {
        console.error('Erro PostgreSQL:', error);
        return null;
    }
}

/**
 * Busca produto no MongoDB
 * @param {string} ref - Referência do produto
 * @returns {Promise<Object|null>}
 */
async function searchInMongoDB(ref) {
    try {
        const client = new MongoClient(dbConfigs.mongodb.uri);
        await client.connect();

        const db = client.db();
        const collections = ['produtos', 'products', 'items'];

        for (const collectionName of collections) {
            try {
                const collection = db.collection(collectionName);
                
                // Tentar diferentes campos de referência
                const queries = [
                    { ref: ref },
                    { referencia: ref },
                    { code: ref },
                    { sku: ref },
                    { productRef: ref },
                    { productCode: ref }
                ];

                for (const query of queries) {
                    const result = await collection.findOne(query);
                    if (result) {
                        await client.close();
                        return result;
                    }
                }
            } catch (error) {
                // Collection pode não existir, continuar para próxima
                continue;
            }
        }

        await client.close();
        return null;
    } catch (error) {
        console.error('Erro MongoDB:', error);
        return null;
    }
}

/**
 * Endpoint para buscar produto por referência
 */
app.get('/api/database/products/:ref', async (req, res) => {
    try {
        const { ref } = req.params;
        const cleanRef = ref.trim().toUpperCase();

        console.log(`🔍 Buscando produto ${cleanRef} no banco de dados...`);

        let productData = null;

        // Tentar diferentes bancos de dados
        const searchMethods = [
            { name: 'MySQL', method: searchInMySQL },
            { name: 'PostgreSQL', method: searchInPostgreSQL },
            { name: 'MongoDB', method: searchInMongoDB }
        ];

        for (const { name, method } of searchMethods) {
            try {
                console.log(`🗄️ Tentando busca no ${name}...`);
                productData = await method(cleanRef);
                
                if (productData) {
                    console.log(`✅ Produto ${cleanRef} encontrado no ${name}`);
                    break;
                }
            } catch (error) {
                console.log(`⚠️ Erro no ${name}: ${error.message}`);
                continue;
            }
        }

        if (productData) {
            // Normalizar dados do produto
            const normalizedData = {
                ref: productData.ref || productData.referencia || productData.code || productData.sku || '',
                ncm: productData.ncm || productData.ncmCode || productData.ncm_code || '',
                description: productData.description || productData.name || productData.productName || '',
                name: productData.name || productData.description || productData.productName || '',
                englishDescription: productData.englishDescription || productData.english_desc || '',
                unit: productData.unit || productData.measurement || productData.unidade || 'PCS',
                unitPrice: parseFloat(productData.unitPrice || productData.unit_price || productData.price || 0),
                length: parseFloat(productData.length || productData.len || productData.comprimento || 0),
                width: parseFloat(productData.width || productData.wide || productData.largura || 0),
                height: parseFloat(productData.height || productData.high || productData.altura || 0),
                cbm: parseFloat(productData.cbm || productData.cubic_meter || productData.cubicMeter || 0),
                grossWeight: parseFloat(productData.grossWeight || productData.gross_weight || productData.pesoBruto || 0),
                netWeight: parseFloat(productData.netWeight || productData.net_weight || productData.pesoLiquido || 0),
                pesoUnitario: parseFloat(productData.pesoUnitario || productData.peso_unitario || productData.unitWeight || 0),
                moq: parseInt(productData.moq || productData.minimumOrderQuantity || productData.min_order || 0),
                moqLogo: parseInt(productData.moqLogo || productData.minimumOrderQuantityLogo || productData.min_order_logo || 0)
            };

            res.json({
                success: true,
                data: normalizedData,
                source: 'database'
            });
        } else {
            res.status(404).json({
                success: false,
                message: `Produto ${cleanRef} não encontrado no banco de dados`,
                data: null
            });
        }

    } catch (error) {
        console.error('Erro no endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

/**
 * Endpoint para buscar múltiplos produtos
 */
app.post('/api/database/products/search', async (req, res) => {
    try {
        const { refs } = req.body;
        
        if (!Array.isArray(refs)) {
            return res.status(400).json({
                success: false,
                message: 'refs deve ser um array'
            });
        }

        const results = [];
        
        for (const ref of refs) {
            try {
                const productData = await searchInMySQL(ref) || 
                                  await searchInPostgreSQL(ref) || 
                                  await searchInMongoDB(ref);
                
                if (productData) {
                    results.push({
                        ref: ref,
                        found: true,
                        data: productData
                    });
                } else {
                    results.push({
                        ref: ref,
                        found: false,
                        data: null
                    });
                }
            } catch (error) {
                results.push({
                    ref: ref,
                    found: false,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            results: results
        });

    } catch (error) {
        console.error('Erro no endpoint de busca múltipla:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

/**
 * Endpoint para obter estatísticas do banco
 */
app.get('/api/database/stats', async (req, res) => {
    try {
        const stats = {
            mysql: { connected: false, tables: [] },
            postgresql: { connected: false, tables: [] },
            mongodb: { connected: false, collections: [] }
        };

        // Testar conexão MySQL
        try {
            const mysqlConn = await mysql.createConnection(dbConfigs.mysql);
            const [tables] = await mysqlConn.execute('SHOW TABLES');
            stats.mysql.connected = true;
            stats.mysql.tables = tables.map(t => Object.values(t)[0]);
            await mysqlConn.end();
        } catch (error) {
            stats.mysql.error = error.message;
        }

        // Testar conexão PostgreSQL
        try {
            const pgClient = new pg.Client(dbConfigs.postgresql);
            await pgClient.connect();
            const result = await pgClient.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            `);
            stats.postgresql.connected = true;
            stats.postgresql.tables = result.rows.map(r => r.table_name);
            await pgClient.end();
        } catch (error) {
            stats.postgresql.error = error.message;
        }

        // Testar conexão MongoDB
        try {
            const mongoClient = new MongoClient(dbConfigs.mongodb.uri);
            await mongoClient.connect();
            const db = mongoClient.db();
            const collections = await db.listCollections().toArray();
            stats.mongodb.connected = true;
            stats.mongodb.collections = collections.map(c => c.name);
            await mongoClient.close();
        } catch (error) {
            stats.mongodb.error = error.message;
        }

        res.json({
            success: true,
            stats: stats
        });

    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao obter estatísticas',
            error: error.message
        });
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Servidor de busca no banco de dados rodando na porta ${PORT}`);
    console.log(`📊 Endpoints disponíveis:`);
    console.log(`   GET /api/database/products/:ref - Buscar produto por referência`);
    console.log(`   POST /api/database/products/search - Buscar múltiplos produtos`);
    console.log(`   GET /api/database/stats - Estatísticas do banco`);
});

export default app;

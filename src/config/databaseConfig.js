/**
 * Configuração do servidor de banco de dados
 * Este arquivo contém as configurações para conectar ao banco de dados do sistema base-produtos
 */

// Configurações de ambiente para diferentes bancos de dados
export const databaseConfig = {
    // MySQL Configuration
    mysql: {
        host: process.env.MYSQL_HOST || 'localhost',
        port: process.env.MYSQL_PORT || 3306,
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DB || 'base_produtos',
        connectionLimit: 10,
        acquireTimeout: 60000,
        timeout: 60000
    },

    // PostgreSQL Configuration
    postgresql: {
        host: process.env.PG_HOST || 'localhost',
        port: process.env.PG_PORT || 5432,
        user: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASSWORD || '',
        database: process.env.PG_DB || 'base_produtos',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
    },

    // MongoDB Configuration
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/base_produtos',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        }
    },

    // SQLite Configuration (para desenvolvimento local)
    sqlite: {
        filename: process.env.SQLITE_DB || './database/base_produtos.db',
        options: {
            verbose: console.log
        }
    }
};

// Configurações específicas para o sistema base-produtos
export const baseProdutosConfig = {
    // URLs da API do sistema base-produtos
    apiUrls: {
        production: 'https://base-produtos.vercel.app/api',
        development: 'http://localhost:3000/api',
        local: 'http://localhost:3001/api'
    },

    // Endpoints disponíveis
    endpoints: {
        products: '/products',
        search: '/products/search',
        database: '/database/products'
    },

    // Configurações de timeout
    timeouts: {
        api: 5000,      // 5 segundos para API
        database: 10000, // 10 segundos para banco de dados
        cache: 300000   // 5 minutos para cache
    },

    // Configurações de retry
    retry: {
        maxAttempts: 3,
        delay: 1000,    // 1 segundo entre tentativas
        backoff: 2      // Multiplicador de delay
    }
};

// Configurações de cache
export const cacheConfig = {
    // Cache em memória
    memory: {
        maxSize: 1000,     // Máximo 1000 itens
        ttl: 300000,       // 5 minutos
        checkPeriod: 60000 // Verificar a cada minuto
    },

    // Cache em Redis (se disponível)
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || '',
        db: process.env.REDIS_DB || 0,
        ttl: 300000
    }
};

// Configurações de logging
export const loggingConfig = {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    destinations: {
        console: true,
        file: process.env.LOG_FILE || './logs/database-search.log'
    }
};

// Configurações de segurança
export const securityConfig = {
    // Rate limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 100,                 // Máximo 100 requests por IP
        message: 'Muitas tentativas, tente novamente mais tarde'
    },

    // CORS
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
    },

    // Autenticação (se necessário)
    auth: {
        enabled: process.env.AUTH_ENABLED === 'true',
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: '1h'
    }
};

export default {
    database: databaseConfig,
    baseProdutos: baseProdutosConfig,
    cache: cacheConfig,
    logging: loggingConfig,
    security: securityConfig
};

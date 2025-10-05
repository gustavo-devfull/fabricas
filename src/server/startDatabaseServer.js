#!/usr/bin/env node

/**
 * Script para iniciar o servidor de banco de dados
 * Este script inicia o servidor que conecta diretamente ao banco de dados do sistema base-produtos
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { databaseConfig, baseProdutosConfig, securityConfig } from '../config/databaseConfig.js';

const app = express();

// Middleware de segurança
app.use(helmet());
app.use(cors(securityConfig.cors));

// Rate limiting
const limiter = rateLimit(securityConfig.rateLimit);
app.use('/api/', limiter);

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

/**
 * Endpoint de saúde do servidor
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

/**
 * Endpoint para buscar produto por referência no banco de dados
 */
app.get('/api/database/products/:ref', async (req, res) => {
    try {
        const { ref } = req.params;
        const cleanRef = ref.trim().toUpperCase();

        console.log(`🔍 Buscando produto ${cleanRef} no banco de dados...`);

        // Simular busca no banco de dados
        // Em produção, aqui seria feita a conexão real com o banco
        const productData = await simulateDatabaseSearch(cleanRef);

        if (productData) {
            res.json({
                success: true,
                data: productData,
                source: 'database',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                message: `Produto ${cleanRef} não encontrado no banco de dados`,
                data: null,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.error('Erro no endpoint de busca:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message,
            timestamp: new Date().toISOString()
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
                message: 'refs deve ser um array',
                timestamp: new Date().toISOString()
            });
        }

        const results = [];
        
        for (const ref of refs) {
            try {
                const productData = await simulateDatabaseSearch(ref.trim().toUpperCase());
                
                results.push({
                    ref: ref,
                    found: !!productData,
                    data: productData,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                results.push({
                    ref: ref,
                    found: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        res.json({
            success: true,
            results: results,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Erro no endpoint de busca múltipla:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Endpoint para obter estatísticas do banco de dados
 */
app.get('/api/database/stats', async (req, res) => {
    try {
        const stats = {
            server: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.version,
                platform: process.platform
            },
            database: {
                mysql: { status: 'configured', connected: false },
                postgresql: { status: 'configured', connected: false },
                mongodb: { status: 'configured', connected: false },
                sqlite: { status: 'configured', connected: false }
            },
            cache: {
                size: 0,
                hits: 0,
                misses: 0
            },
            requests: {
                total: 0,
                successful: 0,
                failed: 0
            }
        };

        res.json({
            success: true,
            stats: stats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao obter estatísticas',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Simula busca no banco de dados
 * Em produção, aqui seria feita a conexão real com o banco
 */
async function simulateDatabaseSearch(ref) {
    // Simular delay de banco de dados
    await new Promise(resolve => setTimeout(resolve, 100));

    // Base de dados simulada
    const products = {
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
            observacaoPedido: 'ATUALIZAR EMBALAGEM 2024'
        }
    };

    return products[ref] || null;
}

/**
 * Middleware de tratamento de erros
 */
app.use((error, req, res, next) => {
    console.error('Erro não tratado:', error);
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
        timestamp: new Date().toISOString()
    });
});

/**
 * Middleware para rotas não encontradas
 */
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint não encontrado',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor de banco de dados iniciado`);
    console.log(`📊 URL: http://${HOST}:${PORT}`);
    console.log(`📋 Endpoints disponíveis:`);
    console.log(`   GET  /health - Status do servidor`);
    console.log(`   GET  /api/database/products/:ref - Buscar produto por referência`);
    console.log(`   POST /api/database/products/search - Buscar múltiplos produtos`);
    console.log(`   GET  /api/database/stats - Estatísticas do banco`);
    console.log(`🔧 Configurações:`);
    console.log(`   Rate Limit: ${securityConfig.rateLimit.max} requests/${securityConfig.rateLimit.windowMs/1000}s`);
    console.log(`   CORS: ${securityConfig.cors.origin}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

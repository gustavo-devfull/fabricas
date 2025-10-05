# Sistema de Busca no Banco de Dados

Este sistema implementa busca direta no banco de dados do sistema base-produtos quando você digita uma REF.

## 🚀 Funcionalidades

### Estratégias de Busca (em ordem de prioridade):

1. **🗄️ Busca Direta no Banco de Dados** (PRIORIDADE MÁXIMA)
   - Conecta diretamente ao banco de dados do sistema base-produtos
   - Suporta MySQL, PostgreSQL, MongoDB e SQLite
   - Busca em múltiplas tabelas e campos de referência

2. **🌐 Busca via API Externa**
   - Tenta endpoints do sistema base-produtos
   - Fallback para API pública se disponível

3. **📁 Busca Local (Fallback)**
   - Base de dados local simulada
   - Produtos pré-cadastrados para testes

## 📋 Como Usar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Configurações do Banco de Dados
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=sua_senha
MYSQL_DB=base_produtos

PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=sua_senha
PG_DB=base_produtos

MONGODB_URI=mongodb://localhost:27017/base_produtos

# Configurações do Servidor
PORT=3001
HOST=localhost
NODE_ENV=development

# Configurações de Segurança
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=seu_jwt_secret
```

### 3. Iniciar o Servidor de Banco de Dados

```bash
# Desenvolvimento (com auto-reload)
npm run db-server:dev

# Produção
npm run db-server
```

### 4. Iniciar o Sistema Completo

```bash
# Inicia servidor de banco + frontend
npm start
```

## 🔧 Endpoints Disponíveis

### Buscar Produto por Referência
```http
GET /api/database/products/{ref}
```

**Exemplo:**
```bash
curl http://localhost:3001/api/database/products/MR1155
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "ref": "MR1155",
    "ncm": "94036000",
    "description": "Cadeira de Madeira MR1155",
    "name": "Cadeira MR1155",
    "englishDescription": "Wooden Chair MR1155",
    "unit": "PCS",
    "unitPrice": 52.00,
    "length": 45,
    "width": 40,
    "height": 85,
    "cbm": 0.153,
    "grossWeight": 9.0,
    "netWeight": 7.8,
    "pesoUnitario": 7800,
    "moq": 30,
    "moqLogo": 150
  },
  "source": "database",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Buscar Múltiplos Produtos
```http
POST /api/database/products/search
```

**Exemplo:**
```bash
curl -X POST http://localhost:3001/api/database/products/search \
  -H "Content-Type: application/json" \
  -d '{"refs": ["MR1155", "MR1165", "MR1177"]}'
```

### Estatísticas do Banco
```http
GET /api/database/stats
```

### Status do Servidor
```http
GET /health
```

## 🗄️ Configuração do Banco de Dados

### MySQL
```sql
CREATE DATABASE base_produtos;
USE base_produtos;

CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ref VARCHAR(50) UNIQUE NOT NULL,
    referencia VARCHAR(50),
    code VARCHAR(50),
    sku VARCHAR(50),
    ncm VARCHAR(20),
    description TEXT,
    name VARCHAR(255),
    englishDescription TEXT,
    unit VARCHAR(10),
    unitPrice DECIMAL(10,2),
    length DECIMAL(8,2),
    width DECIMAL(8,2),
    height DECIMAL(8,2),
    cbm DECIMAL(8,4),
    grossWeight DECIMAL(8,2),
    netWeight DECIMAL(8,2),
    pesoUnitario DECIMAL(8,2),
    moq INT,
    moqLogo INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### PostgreSQL
```sql
CREATE DATABASE base_produtos;

CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    ref VARCHAR(50) UNIQUE NOT NULL,
    referencia VARCHAR(50),
    code VARCHAR(50),
    sku VARCHAR(50),
    ncm VARCHAR(20),
    description TEXT,
    name VARCHAR(255),
    englishDescription TEXT,
    unit VARCHAR(10),
    unitPrice DECIMAL(10,2),
    length DECIMAL(8,2),
    width DECIMAL(8,2),
    height DECIMAL(8,2),
    cbm DECIMAL(8,4),
    grossWeight DECIMAL(8,2),
    netWeight DECIMAL(8,2),
    pesoUnitario DECIMAL(8,2),
    moq INTEGER,
    moqLogo INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### MongoDB
```javascript
use base_produtos;

db.produtos.createIndex({ "ref": 1 }, { unique: true });
db.produtos.createIndex({ "referencia": 1 });
db.produtos.createIndex({ "code": 1 });
db.produtos.createIndex({ "sku": 1 });

// Exemplo de documento
db.produtos.insertOne({
    ref: "MR1155",
    referencia: "MR1155",
    ncm: "94036000",
    description: "Cadeira de Madeira MR1155",
    name: "Cadeira MR1155",
    englishDescription: "Wooden Chair MR1155",
    unit: "PCS",
    unitPrice: 52.00,
    length: 45,
    width: 40,
    height: 85,
    cbm: 0.153,
    grossWeight: 9.0,
    netWeight: 7.8,
    pesoUnitario: 7800,
    moq: 30,
    moqLogo: 150,
    createdAt: new Date(),
    updatedAt: new Date()
});
```

## 🔍 Como Funciona a Busca

### 1. Frontend (CreateQuote.jsx)
```javascript
// Quando usuário digita REF
const handleProductChange = async (field, value) => {
    if (field === 'ref' && value.length >= 3) {
        const productData = await productSearchService.searchProductByRef(value);
        if (productData) {
            // Preenche campos automaticamente
            setCurrentProduct(productData);
        }
    }
};
```

### 2. Serviço de Busca (productSearchService.js)
```javascript
async searchProductByRef(ref) {
    // ESTRATÉGIA 1: Busca direta no banco de dados
    let productData = await this.searchInDatabase(ref);
    if (productData) return productData;
    
    // ESTRATÉGIA 2: Busca via API
    productData = await this.quickSearch(ref);
    if (productData) return productData;
    
    // ESTRATÉGIA 3: Busca local
    return await this.searchLocalProducts(ref);
}
```

### 3. Servidor de Banco (startDatabaseServer.js)
```javascript
app.get('/api/database/products/:ref', async (req, res) => {
    const productData = await searchInMySQL(ref) || 
                       await searchInPostgreSQL(ref) || 
                       await searchInMongoDB(ref);
    
    if (productData) {
        res.json({ success: true, data: productData });
    } else {
        res.status(404).json({ success: false, message: 'Produto não encontrado' });
    }
});
```

## 🛡️ Segurança

- **Rate Limiting**: 100 requests por 15 minutos por IP
- **CORS**: Configurável via variáveis de ambiente
- **Helmet**: Headers de segurança
- **Validação**: Validação de entrada em todos os endpoints
- **Logs**: Logs detalhados de todas as operações

## 📊 Monitoramento

### Logs do Servidor
```bash
2024-01-15T10:30:00.000Z - GET /api/database/products/MR1155
🔍 Buscando produto MR1155 no banco de dados...
✅ Produto MR1155 encontrado no banco de dados local
```

### Estatísticas
```bash
curl http://localhost:3001/api/database/stats
```

## 🚨 Troubleshooting

### Servidor não inicia
```bash
# Verificar se a porta está livre
lsof -i :3001

# Verificar logs
npm run db-server:dev
```

### Banco de dados não conecta
```bash
# Verificar configurações no .env
# Testar conexão manual
mysql -h localhost -u root -p base_produtos
```

### CORS errors
```bash
# Verificar CORS_ORIGIN no .env
# Deve incluir http://localhost:5173
```

## 📝 Exemplos de Uso

### Buscar produto no frontend
```javascript
// No componente CreateQuote
const searchProduct = async (ref) => {
    try {
        const response = await fetch(`http://localhost:3001/api/database/products/${ref}`);
        const result = await response.json();
        
        if (result.success) {
            console.log('Produto encontrado:', result.data);
            // Preencher campos do formulário
        } else {
            console.log('Produto não encontrado');
        }
    } catch (error) {
        console.error('Erro na busca:', error);
    }
};
```

### Buscar múltiplos produtos
```javascript
const searchMultipleProducts = async (refs) => {
    try {
        const response = await fetch('http://localhost:3001/api/database/products/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refs })
        });
        
        const result = await response.json();
        console.log('Resultados:', result.results);
    } catch (error) {
        console.error('Erro na busca múltipla:', error);
    }
};
```

## 🎯 Próximos Passos

1. **Configurar banco de dados real** do sistema base-produtos
2. **Implementar autenticação** se necessário
3. **Adicionar cache Redis** para melhor performance
4. **Implementar logs estruturados** com Winston
5. **Adicionar testes automatizados**
6. **Configurar CI/CD** para deploy automático

---

**🎉 Agora quando você digitar uma REF, o sistema buscará diretamente no banco de dados do sistema base-produtos!**

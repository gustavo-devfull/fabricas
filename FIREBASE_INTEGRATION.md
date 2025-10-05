# 🔥 Sistema de Busca de Produtos - Firebase Integration

## 📋 Visão Geral

O sistema agora está integrado com a **Base de Produtos Firebase** para buscar dados de produtos automaticamente quando uma REF é digitada na página "Criar Nova Cotação".

## 🔗 Configuração Firebase

### Base de Produtos Firebase
- **Project ID**: `cadastro-de-produtos-ccbd2`
- **Coleção**: `produtos`
- **Campo Principal**: `referencia` (corresponde ao REF do sistema)

### Arquivos de Configuração
- `src/firebase/baseProdutosConfig.js` - Configuração específica da base de produtos
- `src/services/baseProdutosFirebaseService.js` - Serviço de busca Firebase
- `src/services/productSearchService.js` - Serviço principal integrado

## 🎯 Estratégia de Busca (Por Prioridade)

### 1. 🔥 Firebase (Base de Produtos) - PRIORIDADE MÁXIMA
```javascript
// Busca na coleção "produtos" por campo "referencia"
const q = query(
    collection(baseProdutosDb, 'produtos'),
    where('referencia', '==', ref),
    limit(1)
);
```

### 2. 📦 Mock Local (Para Testes)
```javascript
// Produtos de teste: MR1165, MR1150
const mockProducts = {
    'MR1165': { referencia: 'MR1165', ... },
    'MR1150': { referencia: 'MR1150', ... }
};
```

### 3. 🌐 API Externa (Fallback)
```javascript
// Endpoints da API base-produtos.vercel.app
// (caso Firebase não tenha o produto)
```

## 📊 Mapeamento de Campos

### Sistema → Base de Produtos
| Campo Sistema | Campo Base | Descrição | Exemplo |
|---------------|------------|-----------|---------|
| `REF` | `referencia` | **REF do Produto** | `"MR1223"` |
| `DESCRIPTION` | `description` | Descrição do produto | `""` |
| `NAME` | `name` | Nome do produto | `""` |
| `REMARK` | `remark` | Observação geral | `""` |
| `OBS` | `obs` | Observação específica | `""` |
| `UNIT/CTN` | `unitCtn` | Unidades por cartão | `24` |
| `U.PRICE` | `unitPriceRmb` | Preço unitário RMB | `13` |
| `UNIT` | `unit` | Unidade de medida | `""` |
| `L` | `l` | Largura (cm) | `""` |
| `W` | `w` | Comprimento (cm) | `""` |
| `H` | `h` | Altura (cm) | `""` |
| `CBM` | `cbm` | Volume cúbico | `0.065` |
| `G.W` | `gw` | Peso bruto | `""` |
| `T.G.W` | `nw` | Peso líquido | `""` |
| `Peso Unitário(g)` | `pesoUnitario` | Peso unitário | `0.82` |
| `NCM` | `ncm` | Código NCM | `70134290` |
| `MARCA` | `marca` | Marca do produto | `"MORI"` |
| `EAN` | `ean` | Código de barras | `7898258622425` |
| `DUN` | `dun` | Código DUN | `17898258622422` |
| `CODIGO RAVI` | `codRavi` | Código interno Ravi | `60284` |
| `NOME INVOICE EN` | `nomeInvoiceEn` | Nome em inglês | `"HOUSEHOLD GLASS CONTAINER 990ML MR1223"` |
| `NOME DI` | `nomeDiNb` | Nome para DI | `"POTE DE VIDRO PARA USO DOMÉSTICO 990ML MR1223"` |
| `NOME RAVI` | `nomeRaviProfit` | Nome Ravi | `"POTE HERMÉTICO DE VIDRO RETANGULAR 990ML MR1223"` |
| `CEST` | `cest` | Código CEST | `"14.003.00"` |
| `VALOR INVOICE USD` | `valorInvoiceUsd` | Valor em USD | `0.7056` |
| `QUANTIDADE MÍNIMA VENDA` | `qtMinVenda` | Quantidade mínima | `1` |
| `FOTO` | `foto` | URL da foto | `"https://nyc3.digitaloceanspaces.com/moribr/base-fotos/MR1223.jpg"` |

## 🔄 Fluxo de Funcionamento

### 1. Usuário digita REF
```
🔍 Buscando produto REF: MR1165 via Firebase + API base-produtos
📋 MAPEAMENTO: REF do sistema = campo "referencia" na base de produtos
```

### 2. Busca no Firebase
```
🔥 Tentando busca via Firebase primeiro...
🌐 Buscando produto MR1165 na coleção "produtos"...
📦 Produto encontrado pelo campo "referencia": { referencia: 'MR1165', ... }
✅ Produto MR1165 encontrado via Firebase
```

### 3. Normalização dos Dados
```
🔄 Normalizando dados do produto: { referencia: 'MR1165', ... }
✅ Produto normalizado: { ref: 'MR1165', ncm: '12345678', ... }
```

### 4. Preenchimento Automático
- ✅ Todos os campos são preenchidos automaticamente
- ✅ Cache é atualizado para próximas buscas
- ✅ Logs detalhados para debugging

## 🚀 Logs Esperados

### Busca Bem-Sucedida
```
🔍 Buscando produto REF: MR1165 via Firebase + API base-produtos
📋 MAPEAMENTO: REF do sistema = campo "referencia" na base de produtos
🔥 Tentando busca via Firebase primeiro...
🌐 Buscando produto MR1165 na coleção "produtos"...
📦 Produto encontrado pelo campo "referencia": { referencia: 'MR1165', ncm: '12345678', ... }
🔄 Normalizando dados do produto: { referencia: 'MR1165', ... }
✅ Produto normalizado: { ref: 'MR1165', ncm: '12345678', ... }
✅ Produto MR1165 encontrado via Firebase
```

### Produto Não Encontrado
```
🔍 Buscando produto REF: MR9999 via Firebase + API base-produtos
📋 MAPEAMENTO: REF do sistema = campo "referencia" na base de produtos
🔥 Tentando busca via Firebase primeiro...
🌐 Buscando produto MR9999 na coleção "produtos"...
❌ Produto MR9999 não encontrado em nenhum campo
✅ Produto MR9999 encontrado no MOCK LOCAL (se existir)
❌ Produto MR9999 não encontrado em nenhuma fonte
```

## 🛠️ Funcionalidades Avançadas

### Cache Inteligente
- ✅ **Cache de 5 minutos** para produtos encontrados
- ✅ **Cache automático** para melhor performance
- ✅ **Limpeza automática** de cache expirado

### Busca Alternativa
- ✅ **Múltiplos campos**: Se não encontrar por `referencia`, tenta `REF`, `ref`, `code`, `sku`, etc.
- ✅ **Fallback inteligente**: Mock local → API externa
- ✅ **Logs detalhados**: Para debugging e monitoramento

### Normalização Robusta
- ✅ **Mapeamento flexível**: Suporta diferentes nomes de campos
- ✅ **Validação de dados**: Converte tipos automaticamente
- ✅ **Campos opcionais**: Funciona mesmo com dados incompletos

## 📝 Como Adicionar Novos Produtos

### No Firebase (Base de Produtos)
1. Acesse o projeto `cadastro-de-produtos-ccbd2`
2. Vá para a coleção `produtos`
3. Adicione documento com campo `referencia` = REF do produto
4. Preencha todos os campos disponíveis

### No Mock Local (Para Testes)
```javascript
// Adicione no objeto mockProducts em productSearchService.js
'MR1177': {
    referencia: 'MR1177',
    ncm: '11111111',
    description: 'Produto MR1177 - Descrição',
    // ... outros campos
}
```

## 🔧 Troubleshooting

### Problemas Comuns

1. **Produto não encontrado**
   - Verifique se existe na coleção `produtos` do Firebase
   - Confirme se o campo `referencia` está correto
   - Teste com produtos do mock local (MR1165, MR1150)

2. **Erro de conexão Firebase**
   - Verifique as credenciais em `baseProdutosConfig.js`
   - Confirme se o projeto Firebase está ativo
   - Teste a conexão no console do Firebase

3. **Campos não preenchidos**
   - Verifique o mapeamento em `normalizeProductData`
   - Confirme se os campos existem na base de produtos
   - Teste com produtos do mock local

### Logs de Debug
- ✅ **Console detalhado**: Todos os passos são logados
- ✅ **Timestamps**: Para análise de performance
- ✅ **Dados brutos**: Para verificar estrutura dos dados

## 🎉 Benefícios da Integração

1. **⚡ Performance**: Firebase é mais rápido que APIs externas
2. **🔒 Confiabilidade**: Sem problemas de CORS
3. **📊 Dados Completos**: Acesso a todos os campos da base
4. **🔄 Atualização**: Dados sempre atualizados no Firebase
5. **📋 Mapeamento Correto**: REF = campo "referencia"
6. **🛡️ Fallback**: Sistema robusto com múltiplas fontes

---

**🚀 O sistema está pronto para uso! Digite qualquer REF na página "Criar Nova Cotação" e veja a magia acontecer! ✨**

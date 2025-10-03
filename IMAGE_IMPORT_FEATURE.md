# Funcionalidade de Importação de Imagens do Excel

## Visão Geral

Esta funcionalidade permite importar imagens automaticamente de planilhas Excel (.xlsx, .xls) para os produtos do sistema. O sistema identifica a coluna REF na planilha, busca as imagens correspondentes e as associa aos produtos.

## Como Funciona

### 1. Processo de Importação

1. **Leitura da Planilha**: O sistema lê o arquivo Excel e identifica automaticamente a coluna REF
2. **Extração de Dados**: Para cada linha com REF válida, o sistema busca a imagem correspondente
3. **Upload para FTP**: As imagens são enviadas para o servidor FTP com nome baseado na REF
4. **Associação aos Produtos**: As imagens são automaticamente associadas aos produtos correspondentes

### 2. Estrutura da Planilha

A planilha deve conter:
- **Coluna REF**: Contendo as referências dos produtos
- **Imagens**: Incorporadas na planilha (na linha abaixo do REF)

### 3. Nomenclatura dos Arquivos

As imagens são salvas com o seguinte padrão:
- Nome: `{REF}.jpg`
- Exemplo: `ABC123.jpg`

## Componentes Criados

### 1. Serviços

#### `ftpService.js`
- Gerencia upload de imagens para servidor FTP
- Simula conexão FTP (pode ser substituído por implementação real)
- Armazena imagens localmente como fallback

#### `excelImageImportService.js`
- Lê arquivos Excel usando a biblioteca `xlsx`
- Identifica automaticamente a coluna REF
- Extrai imagens da planilha
- Processa e organiza os dados

### 2. Componentes

#### `ImageImportModal.jsx`
- Modal para seleção e processamento do arquivo Excel
- Exibe progresso da importação
- Mostra resultados detalhados
- Permite exportar relatório em CSV

#### Atualizações nos Componentes Existentes

- **QuoteCard**: Adicionado botão de importação de imagens
- **QuotesTable**: Integração com funcionalidade de importação
- **QuotesSection**: Passagem de props para importação
- **AdminDashboard**: Lógica principal de importação

## Como Usar

### 1. Acessar a Funcionalidade

1. Navegue até o Dashboard Administrativo
2. Selecione uma fábrica
3. Visualize os produtos
4. Clique no botão azul de upload (CloudUpload) em qualquer produto

### 2. Importar Imagens

1. **Selecionar Arquivo**: Escolha um arquivo Excel (.xlsx ou .xls)
2. **Processar**: Clique em "Importar Imagens"
3. **Acompanhar Progresso**: A barra de progresso mostra o status
4. **Ver Resultados**: Após conclusão, veja estatísticas e detalhes
5. **Exportar Relatório**: Opcionalmente, exporte os resultados em CSV

### 3. Resultados

O sistema exibe:
- **Total Processado**: Número total de REFs processadas
- **Sucessos**: Imagens importadas com sucesso
- **Erros**: REFs que não puderam ser processadas
- **Taxa de Sucesso**: Percentual de sucesso
- **Tabela Detalhada**: Lista de todos os produtos processados
- **Preview das Imagens**: Visualização das imagens importadas

## Configurações

### FTP Service

Para configurar o servidor FTP real, edite `src/services/ftpService.js`:

```javascript
this.config = {
    host: 'seu-servidor-ftp.com',
    port: 21,
    user: 'seu-usuario',
    password: 'sua-senha',
    secure: false, // true para FTPS
    basePath: '/images/'
};
```

### Validação de Arquivos

O sistema valida:
- **Formato**: Apenas .xlsx e .xls
- **Tamanho**: Máximo 10MB
- **Estrutura**: Deve conter coluna REF

## Limitações Atuais

### 1. Extração de Imagens

A extração de imagens do Excel é simulada. Para implementação real, considere:

- Usar bibliotecas como `exceljs` para extrair imagens incorporadas
- Implementar parser específico para diferentes formatos de imagem
- Adicionar suporte a URLs de imagens externas

### 2. Armazenamento

Atualmente usa localStorage como fallback. Para produção:

- Implementar servidor FTP real
- Usar serviços de nuvem (AWS S3, Cloudinary, etc.)
- Configurar CDN para distribuição

### 3. Processamento

- Processamento sequencial (pode ser otimizado com paralelização)
- Sem retry automático em caso de falha
- Limitação de tamanho de arquivo

## Melhorias Futuras

### 1. Funcionalidades Adicionais

- [ ] Suporte a múltiplos formatos de imagem
- [ ] Compressão automática de imagens
- [ ] Validação de qualidade de imagem
- [ ] Processamento em lote de múltiplos arquivos
- [ ] Agendamento de importações

### 2. Interface

- [ ] Drag & drop para arquivos
- [ ] Preview da planilha antes da importação
- [ ] Configurações avançadas de importação
- [ ] Histórico de importações

### 3. Performance

- [ ] Processamento paralelo
- [ ] Cache de imagens
- [ ] Otimização de upload
- [ ] Compressão inteligente

## Dependências

```json
{
  "xlsx": "^0.18.5"
}
```

## Estrutura de Arquivos

```
src/
├── services/
│   ├── ftpService.js
│   └── excelImageImportService.js
├── components/
│   └── dashboard/
│       └── ImageImportModal.jsx
└── pages/
    └── admin/
        └── AdminDashboard.jsx (atualizado)
```

## Troubleshooting

### Problemas Comuns

1. **"Coluna REF não encontrada"**
   - Verifique se a planilha tem uma coluna com cabeçalho "REF"
   - Certifique-se de que não há espaços extras no cabeçalho

2. **"Nenhuma imagem encontrada"**
   - Verifique se as imagens estão incorporadas na planilha
   - Confirme se estão na linha abaixo do REF

3. **"Arquivo muito grande"**
   - Reduza o tamanho da planilha
   - Comprima as imagens antes de incorporar

4. **"Erro de upload"**
   - Verifique a conexão com o servidor FTP
   - Confirme as credenciais FTP

### Logs de Debug

O sistema inclui logs detalhados no console do navegador:
- Processo de leitura da planilha
- Identificação da coluna REF
- Processamento de cada linha
- Resultados da importação

## Suporte

Para problemas ou dúvidas sobre esta funcionalidade, consulte:
- Logs do console do navegador
- Arquivo de configuração do FTP
- Documentação da biblioteca `xlsx`


# Deploy no Vercel - Guia de Configuração

## 📋 Pré-requisitos

1. **Conta no GitHub** com o repositório do projeto
2. **Conta no Vercel** conectada ao GitHub
3. **Configuração do Firebase** para produção

## 🚀 Passos para Deploy

### 1. Preparar o Repositório GitHub

```bash
# Navegar para o diretório do projeto
cd /Users/gustavo/Desktop/Fabricas/fabricas-system

# Verificar status do git
git status

# Adicionar todos os arquivos
git add .

# Fazer commit das mudanças
git commit -m "Preparar para deploy no Vercel"

# Enviar para o GitHub
git push origin main
```

### 2. Configurar Variáveis de Ambiente no Vercel

No painel do Vercel, adicionar as seguintes variáveis de ambiente:

#### Firebase Principal:
```
VITE_FIREBASE_API_KEY=sua_api_key_do_firebase
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
VITE_FIREBASE_MEASUREMENT_ID=seu_measurement_id
```

#### Base Produtos Firebase:
```
VITE_BASE_PRODUTOS_API_KEY=sua_api_key_base_produtos
VITE_BASE_PRODUTOS_AUTH_DOMAIN=seu_dominio_base_produtos
VITE_BASE_PRODUTOS_PROJECT_ID=seu_projeto_base_produtos
VITE_BASE_PRODUTOS_STORAGE_BUCKET=seu_storage_base_produtos
VITE_BASE_PRODUTOS_MESSAGING_SENDER_ID=seu_sender_base_produtos
VITE_BASE_PRODUTOS_APP_ID=seu_app_base_produtos
```

#### Ambiente:
```
NODE_ENV=production
```

### 3. Configurações do Vercel

O arquivo `vercel.json` já está configurado com:

- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Rewrites**: SPA routing
- **Headers**: CORS para APIs
- **Environment**: Production

### 4. Deploy Automático

Após conectar o repositório GitHub ao Vercel:

1. **Push automático**: Cada push na branch `main` fará deploy automático
2. **Preview deployments**: Branches de feature criam previews automáticos
3. **Rollback**: Possibilidade de voltar para versões anteriores

## 🔧 Configurações Específicas

### Firebase Security Rules

Certifique-se de que as regras do Firebase estão configuradas para produção:

```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura/escrita para usuários autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### CORS Configuration

O arquivo `vercel.json` já inclui headers CORS para APIs.

## 📊 Monitoramento

Após o deploy, você pode:

1. **Acessar o dashboard** do Vercel para ver métricas
2. **Configurar domínio customizado** se necessário
3. **Monitorar logs** em tempo real
4. **Configurar alertas** para erros

## 🚨 Troubleshooting

### Problemas Comuns:

1. **Build falha**: Verificar se todas as dependências estão no `package.json`
2. **Firebase não conecta**: Verificar variáveis de ambiente
3. **Roteamento não funciona**: Verificar configuração de rewrites no `vercel.json`
4. **CORS errors**: Verificar headers no `vercel.json`

### Logs de Debug:

```bash
# Instalar Vercel CLI para debug local
npm i -g vercel

# Deploy local para teste
vercel dev
```

## 📝 Checklist Final

- [ ] Repositório GitHub atualizado
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Firebase configurado para produção
- [ ] Build local funcionando (`npm run build`)
- [ ] Deploy inicial realizado
- [ ] Testes em produção realizados
- [ ] Domínio customizado configurado (opcional)

## 🎯 URLs Importantes

- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Repository**: https://github.com/seu-usuario/seu-repositorio
- **Aplicação Deployada**: https://seu-projeto.vercel.app

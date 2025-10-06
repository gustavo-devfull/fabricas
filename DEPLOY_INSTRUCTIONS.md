# 🚀 Deploy no Vercel - Instruções Rápidas

## ✅ Sistema Preparado

O sistema está completamente preparado para deploy no Vercel com:

- ✅ `vercel.json` configurado
- ✅ `vite.config.js` otimizado para produção
- ✅ Build funcionando (`npm run build`)
- ✅ Chunks otimizados (vendor, firebase, mui, bootstrap)
- ✅ SPA routing configurado
- ✅ CORS headers para APIs

## 🎯 Próximos Passos

### 1. Push para GitHub
```bash
cd /Users/gustavo/Desktop/Fabricas/fabricas-system
git add .
git commit -m "Preparar sistema para deploy no Vercel"
git push origin main
```

### 2. Conectar ao Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Conecte seu repositório GitHub
4. Selecione o projeto `fabricas-system`

### 3. Configurar Variáveis de Ambiente
No painel do Vercel, adicione:

#### Firebase Principal:
```
VITE_FIREBASE_API_KEY=sua_api_key
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

### 4. Deploy Automático
- ✅ Deploy automático a cada push na `main`
- ✅ Preview deployments para branches de feature
- ✅ Rollback para versões anteriores

## 📊 Estatísticas do Build

```
dist/index.html                        1.22 kB │ gzip:   0.53 kB
dist/assets/index-B1gLjaXo.css       232.45 kB │ gzip:  31.36 kB
dist/assets/bootstrap-BwpQdmk0.js     62.93 kB │ gzip:  21.10 kB
dist/assets/vendor-DgTrhVr3.js       141.72 kB │ gzip:  45.48 kB
dist/assets/mui-CIfeOFCH.js          275.64 kB │ gzip:  87.10 kB
dist/assets/firebase-CfvjBkmS.js     472.15 kB │ gzip: 111.74 kB
dist/assets/index-0VFV7nES.js        762.31 kB │ gzip: 227.84 kB
dist/assets/exceljs.min-8WpVSDhs.js  940.07 kB │ gzip: 271.14 kB
```

## 🔧 Configurações Aplicadas

### Vercel.json
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- SPA Routing: Configurado
- CORS Headers: Para APIs externas

### Vite.config.js
- Minificação: esbuild (mais rápido)
- Chunks manuais: vendor, firebase, mui, bootstrap
- Sourcemap: Desabilitado para produção
- Global: Configurado para compatibilidade

## 🚨 Troubleshooting

### Build Falha
- Verificar se todas as dependências estão no `package.json`
- Executar `npm install` localmente
- Verificar logs no Vercel

### Firebase não Conecta
- Verificar variáveis de ambiente
- Confirmar configuração do Firebase
- Verificar regras de segurança do Firestore

### Roteamento não Funciona
- Verificar configuração de rewrites no `vercel.json`
- Confirmar que todas as rotas estão configuradas no React Router

## 📝 Checklist Final

- [ ] Repositório GitHub atualizado
- [ ] Projeto conectado ao Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy inicial realizado
- [ ] Testes em produção realizados
- [ ] Domínio customizado configurado (opcional)

## 🎉 Resultado

Após o deploy, você terá:
- ✅ Aplicação rodando em produção
- ✅ Deploy automático a cada push
- ✅ Preview deployments para features
- ✅ Monitoramento e logs em tempo real
- ✅ Possibilidade de rollback
- ✅ Domínio personalizado (opcional)

**URL da aplicação**: `https://seu-projeto.vercel.app`

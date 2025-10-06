# Ravi Import

Sistema web para gestão de importações, cotações e produtos com upload de imagens.

## 🚀 Funcionalidades

### Administração
- **Dashboard Administrativo**: Visão geral das fábricas e cotações
- **Gestão de Fábricas**: Cadastro e configuração de fábricas
- **Gestão de Usuários**: Controle de acesso e permissões
- **Importação de Dados**: Upload de planilhas com produtos e cotações

### Produtos e Cotações
- **Visualização em Cards**: Interface moderna com cards de produtos
- **Upload de Imagens**: Sistema inteligente de upload com compressão automática
- **Edição em Lote**: Modificação múltipla de produtos
- **Histórico de Importações**: Controle de todas as importações realizadas

### Sistema de Imagens
- **Compressão Automática**: Redimensionamento para 1024x1024px
- **Armazenamento Local**: Sistema robusto com localStorage
- **Gestão de Espaço**: Limpeza automática e manual de imagens antigas
- **Fallback Inteligente**: Múltiplas estratégias para evitar erros de quota

## 🛠️ Tecnologias

- **Frontend**: React 18 + Vite
- **UI Framework**: Bootstrap 5 + React Bootstrap
- **Backend**: Firebase (Firestore + Authentication)
- **Ícones**: Material Icons
- **Estilização**: Tailwind CSS

## 📦 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/ravi-import.git
cd ravi-import
```

2. Instale as dependências:
```bash
cd ravi-import
npm install
```

3. Configure o Firebase:
   - Copie o arquivo de configuração do Firebase
   - Configure as variáveis de ambiente

4. Execute o projeto:
```bash
npm run dev
```

## 🔧 Configuração

### Firebase
Configure as credenciais do Firebase no arquivo `src/firebase/config.js`:

```javascript
const firebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "seu-app-id"
};
```

### Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
VITE_FIREBASE_API_KEY=sua-api-key
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
```

## 📱 Funcionalidades Principais

### Upload de Imagens
- **Compressão Inteligente**: Redimensionamento automático para 1024x1024px
- **Múltiplos Formatos**: Suporte a JPG, PNG, WebP
- **Gestão de Espaço**: Monitoramento em tempo real do armazenamento
- **Limpeza Automática**: Remoção de imagens antigas quando necessário

### Dashboard
- **Visão Geral**: Estatísticas de fábricas e produtos
- **Navegação Intuitiva**: Interface limpa e responsiva
- **Ações em Lote**: Operações múltiplas em produtos
- **Filtros Avançados**: Busca e filtragem de dados

## 🚀 Deploy

### Vercel (Recomendado)

#### Configuração Automática
1. **Conecte o repositório GitHub** à Vercel
2. **Configure as variáveis de ambiente** no painel do Vercel:

```env
# Firebase Principal
VITE_FIREBASE_API_KEY=sua_api_key_do_firebase
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
VITE_FIREBASE_MEASUREMENT_ID=seu_measurement_id

# Base Produtos Firebase
VITE_BASE_PRODUTOS_API_KEY=sua_api_key_base_produtos
VITE_BASE_PRODUTOS_AUTH_DOMAIN=seu_dominio_base_produtos
VITE_BASE_PRODUTOS_PROJECT_ID=seu_projeto_base_produtos
VITE_BASE_PRODUTOS_STORAGE_BUCKET=seu_storage_base_produtos
VITE_BASE_PRODUTOS_MESSAGING_SENDER_ID=seu_sender_base_produtos
VITE_BASE_PRODUTOS_APP_ID=seu_app_base_produtos

# Ambiente
NODE_ENV=production
```

3. **Deploy automático** a cada push na branch `main`

#### Configuração Manual
O arquivo `vercel.json` já está configurado com:
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- SPA Routing: Configurado para React Router
- CORS Headers: Para APIs externas

#### Comandos para Deploy
```bash
# Preparar para deploy
git add .
git commit -m "Preparar para deploy no Vercel"
git push origin main

# Deploy local (opcional)
npm i -g vercel
vercel dev
```

### Netlify
1. Conecte o repositório
2. Configure o build command: `npm run build`
3. Configure o publish directory: `dist`

## 📄 Estrutura do Projeto

```
ravi-import/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── dashboard/       # Componentes do dashboard
│   │   └── MultiSelectProducts.jsx
│   ├── contexts/           # Contextos React
│   ├── firebase/           # Configuração Firebase
│   ├── hooks/              # Custom hooks
│   ├── pages/              # Páginas da aplicação
│   │   └── admin/          # Páginas administrativas
│   ├── services/           # Serviços (upload, etc.)
│   └── assets/             # Recursos estáticos
├── public/                 # Arquivos públicos
└── package.json           # Dependências e scripts
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato através de:
- Email: seu-email@exemplo.com
- GitHub Issues: [Abrir uma issue](https://github.com/seu-usuário/ravi-import/issues)

---

Desenvolvido com ❤️ para gestão eficiente de importações e produtos.

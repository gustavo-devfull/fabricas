# Sistema de Gestão de Fábricas

Sistema web para gestão de fábricas, cotações e produtos com upload de imagens.

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
git clone https://github.com/seu-usuario/fabricas-system.git
cd fabricas-system
```

2. Instale as dependências:
```bash
cd fabricas-system
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
1. Conecte seu repositório GitHub à Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Netlify
1. Conecte o repositório
2. Configure o build command: `npm run build`
3. Configure o publish directory: `dist`

## 📄 Estrutura do Projeto

```
fabricas-system/
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
- GitHub Issues: [Abrir uma issue](https://github.com/seu-usuario/fabricas-system/issues)

---

Desenvolvido com ❤️ para gestão eficiente de fábricas e produtos.

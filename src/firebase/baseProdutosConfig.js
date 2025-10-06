import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuração específica para a base de produtos usando variáveis de ambiente
const baseProdutosConfig = {
    apiKey: import.meta.env.VITE_BASE_PRODUTOS_API_KEY || "AIzaSyASFobDpd3X7gyNiyGCapQqsWPAsFoMkJU",
    authDomain: import.meta.env.VITE_BASE_PRODUTOS_AUTH_DOMAIN || "cadastro-de-produtos-ccbd2.firebaseapp.com",
    projectId: import.meta.env.VITE_BASE_PRODUTOS_PROJECT_ID || "cadastro-de-produtos-ccbd2",
    storageBucket: import.meta.env.VITE_BASE_PRODUTOS_STORAGE_BUCKET || "cadastro-de-produtos-ccbd2.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_BASE_PRODUTOS_MESSAGING_SENDER_ID || "104291829825",
    appId: import.meta.env.VITE_BASE_PRODUTOS_APP_ID || "1:104291829825:web:27a5d60dfcb63c56df9ec0"
};

// Inicializar app específico para base de produtos
const baseProdutosApp = initializeApp(baseProdutosConfig, 'baseProdutosApp');

// Exportar Firestore da base de produtos
export const baseProdutosDb = getFirestore(baseProdutosApp);

console.log('🔗 Conectado à base de produtos Firebase:', baseProdutosConfig.projectId);

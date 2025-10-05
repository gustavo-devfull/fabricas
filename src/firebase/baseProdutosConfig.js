import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuração específica para a base de produtos
const baseProdutosConfig = {
    apiKey: "AIzaSyASFobDpd3X7gyNiyGCapQqsWPAsFoMkJU",
    authDomain: "cadastro-de-produtos-ccbd2.firebaseapp.com",
    projectId: "cadastro-de-produtos-ccbd2",
    storageBucket: "cadastro-de-produtos-ccbd2.firebasestorage.app",
    messagingSenderId: "104291829825",
    appId: "1:104291829825:web:27a5d60dfcb63c56df9ec0"
};

// Inicializar app específico para base de produtos
const baseProdutosApp = initializeApp(baseProdutosConfig, 'baseProdutosApp');

// Exportar Firestore da base de produtos
export const baseProdutosDb = getFirestore(baseProdutosApp);

console.log('🔗 Conectado à base de produtos Firebase:', baseProdutosConfig.projectId);

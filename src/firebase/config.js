import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuração do Firebase usando variáveis de ambiente
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAbCQn7cp5srJDVM2MoaPdjuNwv1cq1DsE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "portfolio-presence-fe9d3.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "portfolio-presence-fe9d3",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "portfolio-presence-fe9d3.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "848611580636",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:848611580636:web:4102638212c7d64166b219",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços que vamos usar
export const auth = getAuth(app);
export const db = getFirestore(app);
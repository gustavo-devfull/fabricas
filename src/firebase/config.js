import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// **ATENÇÃO:** Substitua estes valores pela sua própria configuração do Firebase!
const firebaseConfig = {
  apiKey: "AIzaSyAbCQn7cp5srJDVM2MoaPdjuNwv1cq1DsE",
  authDomain: "portfolio-presence-fe9d3.firebaseapp.com",
  projectId: "portfolio-presence-fe9d3",
  storageBucket: "portfolio-presence-fe9d3.firebasestorage.app",
  messagingSenderId: "848611580636",
  appId: "1:848611580636:web:4102638212c7d64166b219"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços que vamos usar
export const auth = getAuth(app);
export const db = getFirestore(app);
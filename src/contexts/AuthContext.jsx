import React, { createContext, useContext, useEffect, useState } from 'react';
// Certifique-se de que os caminhos para o firebase/config estão corretos
import { 
    auth, 
    db 
} from '../firebase/config'; 
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// 1. Criação e exportação do Contexto
export const AuthContext = createContext(); // <-- CORRIGIDO AQUI!

// 2. EXPORT: Hook para facilitar o uso do contexto em outros componentes
export const useAuth = () => {
    return useContext(AuthContext);
};

// 3. EXPORT: Componente Provider que gerencia o estado e as funções de Auth
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Funções de Autenticação
    
    // Função para registro (usada para criar o primeiro admin)
    const signup = async (email, password) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Salva o papel do usuário no Firestore
        await setDoc(doc(db, "usuarios", user.uid), {
            uid: user.uid,
            email: user.email,
            role: 'admin', 
            createdAt: new Date()
        });
        return user;
    };

    // Função de Login
    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    // Função de Logout
    const logout = () => {
        return signOut(auth);
    };

    // Efeito para monitorar o estado da autenticação do Firebase
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Objeto de valor a ser fornecido
    const value = {
        currentUser,
        login,
        signup,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {/* Renderiza os filhos sempre, permitindo que componentes individuais lidem com loading */}
            {children}
        </AuthContext.Provider>
    );
};
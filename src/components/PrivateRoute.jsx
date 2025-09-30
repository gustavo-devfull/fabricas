import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Este componente verifica se o usuário está logado antes de renderizar o conteúdo
const PrivateRoute = ({ children, redirectTo = "/login" }) => {
    const { currentUser, loading } = useAuth();
    
    // Mostra um estado de carregamento enquanto o Firebase verifica o Auth
    if (loading) {
        // Você pode colocar um spinner/tela de carregamento aqui
        return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
    }

    // Se o usuário estiver logado, renderiza o conteúdo filho
    // Se não estiver logado, redireciona para a tela de Login
    return currentUser ? children : <Navigate to={redirectTo} replace />;
};

export default PrivateRoute;
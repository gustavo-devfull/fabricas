import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

// Hook para facilitar o uso do contexto em outros componentes
export const useAuth = () => {
    return useContext(AuthContext);
};

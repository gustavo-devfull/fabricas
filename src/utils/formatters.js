// Função para formatar moeda
export const formatCurrency = (value) => {
    return `¥ ${(value || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};

// Função para formatar números
export const formatNumber = (value, decimals = 2) => {
    return (value || 0).toFixed(decimals);
};

// Função para formatar data no formato brasileiro DD/MM/AAAA
export const formatDate = (date) => {
    if (!date) return 'N/A';
    
    try {
        let dateObj;
        
        // Se é um objeto Firestore Timestamp
        if (date.toDate && typeof date.toDate === 'function') {
            dateObj = date.toDate();
        }
        // Se é um objeto Date
        else if (date instanceof Date) {
            dateObj = date;
        }
        // Se é uma string de data
        else if (typeof date === 'string') {
            dateObj = new Date(date);
        }
        // Se é um timestamp numérico
        else if (typeof date === 'number') {
            dateObj = new Date(date);
        }
        else {
            return 'N/A';
        }
        
        if (isNaN(dateObj.getTime())) {
            return 'N/A';
        }
        
        return dateObj.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        console.warn('Erro ao formatar data:', error);
        return 'N/A';
    }
};

// Função para formatar data e hora no formato brasileiro DD/MM/AAAA HH:MM
export const formatDateTime = (date) => {
    if (!date) return new Date().toLocaleString('pt-BR');
    
    try {
        let dateObj;
        
        // Se é um objeto Firestore Timestamp
        if (date.toDate && typeof date.toDate === 'function') {
            dateObj = date.toDate();
        }
        // Se é um objeto Date
        else if (date instanceof Date) {
            dateObj = date;
        }
        // Se é uma string de data
        else if (typeof date === 'string') {
            dateObj = new Date(date);
        }
        // Se é um timestamp numérico
        else if (typeof date === 'number') {
            dateObj = new Date(date);
        }
        else {
            return new Date().toLocaleString('pt-BR');
        }
        
        if (isNaN(dateObj.getTime())) {
            return new Date().toLocaleString('pt-BR');
        }
        
        return dateObj.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.warn('Erro ao formatar data e hora:', error);
        return new Date().toLocaleString('pt-BR');
    }
};

// Função para formatar apenas a hora no formato brasileiro HH:MM
export const formatTime = (date) => {
    if (!date) return 'N/A';
    
    try {
        let dateObj;
        
        // Se é um objeto Firestore Timestamp
        if (date.toDate && typeof date.toDate === 'function') {
            dateObj = date.toDate();
        }
        // Se é um objeto Date
        else if (date instanceof Date) {
            dateObj = date;
        }
        // Se é uma string de data
        else if (typeof date === 'string') {
            dateObj = new Date(date);
        }
        // Se é um timestamp numérico
        else if (typeof date === 'number') {
            dateObj = new Date(date);
        }
        else {
            return 'N/A';
        }
        
        if (isNaN(dateObj.getTime())) {
            return 'N/A';
        }
        
        return dateObj.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.warn('Erro ao formatar hora:', error);
        return 'N/A';
    }
};


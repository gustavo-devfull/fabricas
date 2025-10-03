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

// Função para formatar data
export const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR');
};

// Função para formatar data e hora
export const formatDateTime = (date) => {
    if (!date) return new Date().toLocaleString('pt-BR');
};

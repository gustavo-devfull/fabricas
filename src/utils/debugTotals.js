// Utilitário para testar cálculo de totais das cotações
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export const debugQuoteTotals = async (factoryId) => {
    try {
        console.log(`🔍 Debugando totais para factory ${factoryId}...`);
        
        const q = query(collection(db, "quotes"), where("factoryId", "==", factoryId));
        const querySnapshot = await getDocs(q);
        
        const quotes = [];
        querySnapshot.forEach((doc) => {
            const data = { id: doc.id, ...doc.data() };
            quotes.push(data);
        });
        
        // Agrupar por importação (data de criação)
        const importsMap = new Map();
        
        quotes.forEach(quote => {
            const createdAt = quote.createdAt?.toDate?.();
            if (!createdAt) return;
            
            const importKey = createdAt.toISOString().substring(0, 16);
            
            if (!importsMap.has(importKey)) {
                importsMap.set(importKey, {
                    id: importKey,
                    quotes: [],
                    selectedQuotes: []
                });
            }
            
            const importData = importsMap.get(importKey);
            importData.quotes.push(quote);
            
            if (quote.selectedForOrder === true) {
                importData.selectedQuotes.push(quote);
            }
        });
        
        // Calcular totais para cada importação
        importsMap.forEach((importData, key) => {
            const selectedAmount = importData.selectedQuotes.reduce((total, quote) => {
                const amount = quote.amount || ((quote.ctns || 0) * (quote.unitCtn || 1) * (quote.unitPrice || 0));
                return total + amount;
            }, 0);
            
            const totalAmount = importData.quotes.reduce((total, quote) => {
                const amount = quote.amount || ((quote.ctns || 0) * (quote.unitCtn || 1) * (quote.unitPrice || 0));
                return total + amount;
            }, 0);
            
            console.log(`📊 Importação ${key}:`, {
                totalQuotes: importData.quotes.length,
                selectedQuotes: importData.selectedQuotes.length,
                totalAmount: totalAmount,
                selectedAmount: selectedAmount,
                selectedQuotesDetails: importData.selectedQuotes.map(q => ({
                    ref: q.ref,
                    amount: q.amount,
                    calculatedAmount: (q.ctns || 0) * (q.unitCtn || 1) * (q.unitPrice || 0)
                }))
            });
        });
        
        return Array.from(importsMap.values());
    } catch (error) {
        console.error('❌ Erro no debug:', error);
        throw error;
    }
};

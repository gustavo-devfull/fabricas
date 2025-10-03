// Utilitário para debug de cotações
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export const debugQuotesByFactory = async (factoryId) => {
    try {
        console.log(`🔍 Debugando cotações para factory ${factoryId}...`);
        
        const q = query(collection(db, "quotes"), where("factoryId", "==", factoryId));
        const querySnapshot = await getDocs(q);
        
        console.log(`📊 Total de cotações encontradas: ${querySnapshot.size}`);
        
        const quotes = [];
        querySnapshot.forEach((doc) => {
            const data = { id: doc.id, ...doc.data() };
            quotes.push(data);
            console.log(`📄 Cotação ${doc.id}:`, {
                ref: data.ref,
                createdAt: data.createdAt?.toDate?.()?.toISOString(),
                importNumber: data.importNumber,
                importName: data.importName
            });
        });
        
        return quotes;
    } catch (error) {
        console.error('❌ Erro no debug:', error);
        throw error;
    }
};

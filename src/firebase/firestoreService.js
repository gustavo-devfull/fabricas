import { db, auth } from './config';
import { 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    query, 
    getDocs,
    deleteDoc,
    updateDoc,
    where,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const FABRICA_ID = 'config';

// -----------------------------------------------------------------
// FUNÇÕES DE CADASTRO DA FÁBRICA
// -----------------------------------------------------------------

export const saveFactoryConfig = async (data) => {
    const fabricaRef = doc(db, 'fabricas', FABRICA_ID);
    await setDoc(fabricaRef, { 
        ...data, 
        createdAt: new Date() 
    });
};

export const getFactoryConfig = async () => {
    const fabricaRef = doc(db, 'fabricas', FABRICA_ID);
    const docSnap = await getDoc(fabricaRef);
    
    return docSnap.exists() ? docSnap.data() : null;
};

// -----------------------------------------------------------------
// FUNÇÕES DE ADMINISTRAÇÃO DE USUÁRIOS
// -----------------------------------------------------------------

export const getUsersData = async () => {
    const q = query(collection(db, "usuarios"));
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
    });
    return users;
};

export const addUser = async (email, password, role = 'user') => {
    // 1. Cria o usuário no Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Salva os detalhes e o papel (role) no Firestore
    const userRef = doc(db, "usuarios", user.uid);
    await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        role: role,
        createdAt: new Date()
    });
    
    return { ...user.toJSON(), role: role };
};

export const deleteUserByUid = async (uid) => {
    // Remove o registro do Firestore (Desativa o acesso em nossa lógica)
    const userRef = doc(db, "usuarios", uid);
    await deleteDoc(userRef);
};

// NOVA FUNÇÃO: Atualiza o papel do utilizador no Firestore
export const updateUserRole = async (uid, newRole) => {
    const userRef = doc(db, "usuarios", uid);
    await updateDoc(userRef, {
        role: newRole
    });
};

// -----------------------------------------------------------------
// FUNÇÕES PARA MÚLTIPLAS FÁBRICAS (CARDS NO DASHBOARD)
// -----------------------------------------------------------------

// Função para buscar todas as fábricas
export const getAllFactories = async () => {
    const q = query(collection(db, "fabricas"));
    const querySnapshot = await getDocs(q);
    const factories = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Garantir que o campo 'name' esteja sempre presente
        const factoryName = data.name || data.nomeFabrica || data.factoryName || data.title || `Fábrica ${doc.id.substring(0, 8)}`;
        
        factories.push({ 
            id: doc.id, 
            ...data,
            name: factoryName // Garantir que 'name' esteja sempre definido
        });
    });
    return factories;
};

// Função para adicionar uma nova fábrica
export const addFactory = async (factoryData) => {
    const factoryRef = doc(collection(db, "fabricas"));
    await setDoc(factoryRef, { 
        ...factoryData, 
        createdAt: new Date() 
    });
    return factoryRef.id;
};

// Função para atualizar uma fábrica existente
export const updateFactory = async (factoryId, factoryData) => {
    const factoryRef = doc(db, "fabricas", factoryId);
    await updateDoc(factoryRef, {
        ...factoryData,
        updatedAt: new Date()
    });
};

// Função para deletar uma fábrica
export const deleteFactory = async (factoryId) => {
    const factoryRef = doc(db, "fabricas", factoryId);
    await deleteDoc(factoryRef);
};

// -----------------------------------------------------------------
// FUNÇÕES PARA COTAÇÕES
// -----------------------------------------------------------------

// Função para buscar todas as cotações
export const getAllQuotes = async () => {
    const q = query(collection(db, "quotes"));
    const querySnapshot = await getDocs(q);
    const quotes = [];
    querySnapshot.forEach((doc) => {
        quotes.push({ id: doc.id, ...doc.data() });
    });
    return quotes;
};

// Função para buscar cotações de uma fábrica específica
export const getQuotesByFactory = async (factoryId) => {
    const q = query(collection(db, "quotes"), where("factoryId", "==", factoryId));
    const querySnapshot = await getDocs(q);
    const quotes = [];
    querySnapshot.forEach((doc) => {
        quotes.push({ id: doc.id, ...doc.data() });
    });
    return quotes;
};

// Função para adicionar uma nova cotação
export const addQuote = async (quoteData) => {
    const quoteRef = doc(collection(db, "quotes"));
    await setDoc(quoteRef, { 
        ...quoteData, 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return quoteRef.id;
};

// Função para adicionar múltiplas cotações (importação em lote)
export const addMultipleQuotes = async (quotesData) => {
    const batch = [];
    const quoteIds = [];
    
    quotesData.forEach((quoteData) => {
        const quoteRef = doc(collection(db, "quotes"));
        batch.push(setDoc(quoteRef, { 
            ...quoteData, 
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }));
        quoteIds.push(quoteRef.id);
    });
    
    await Promise.all(batch);
    return quoteIds;
};

// Função para atualizar uma cotação existente
export const updateQuote = async (quoteId, quoteData) => {
    const quoteRef = doc(db, "quotes", quoteId);
    await updateDoc(quoteRef, {
        ...quoteData,
        updatedAt: serverTimestamp()
    });
};

// Função para deletar uma cotação
export const deleteQuote = async (quoteId) => {
    const quoteRef = doc(db, "quotes", quoteId);
    await deleteDoc(quoteRef);
};

// Função para deletar todas as cotações de uma fábrica
export const deleteQuotesByFactory = async (factoryId) => {
    const quotes = await getQuotesByFactory(factoryId);
    const deletePromises = quotes.map(quote => deleteQuote(quote.id));
    await Promise.all(deletePromises);
};

// -----------------------------------------------------------------
// FUNÇÕES PARA IMPORTAÇÕES DE COTAÇÕES
// -----------------------------------------------------------------

// Função para buscar importações de cotações por fábrica
export const getQuoteImportsByFactory = async (factoryId) => {
    const quotes = await getQuotesByFactory(factoryId);
    
    // Buscar dados salvos da coleção quoteImports
    const quoteImportsQuery = query(
        collection(db, 'quoteImports'),
        where('factoryId', '==', factoryId)
    );
    const quoteImportsSnapshot = await getDocs(quoteImportsQuery);
    const savedImports = new Map();
    
    quoteImportsSnapshot.forEach((doc) => {
        const data = doc.data();
        savedImports.set(data.updateDate, {
            importName: data.importName,
            quoteName: data.quoteName,
            dataPedido: data.dataPedido,
            lotePedido: data.lotePedido
        });
    });
    
    // Agrupar cotações por data e hora de criação (importação)
    const importsMap = new Map();
    
    quotes.forEach(quote => {
        const createdAt = quote.createdAt?.toDate?.();
        if (!createdAt) return;
        
        // Criar chave única baseada em data e hora (agrupando por minuto)
        const importKey = createdAt.toISOString().substring(0, 16); // YYYY-MM-DDTHH:MM
        const importDate = createdAt.toDateString();
        const importTime = createdAt.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        if (!importsMap.has(importKey)) {
            const savedData = savedImports.get(importKey) || {};
            importsMap.set(importKey, {
                id: importKey,
                date: importDate,
                time: importTime,
                datetime: createdAt,
                count: 0,
                totalValue: 0,
                quotes: [],
                factoryId: factoryId,
                editable: true,
                isEditing: false,
                importName: savedData.importName || '',
                quoteName: savedData.quoteName || '',
                dataPedido: savedData.dataPedido || '',
                lotePedido: savedData.lotePedido || ''
            });
        }
        
        const importData = importsMap.get(importKey);
        importData.count += 1;
        importData.totalValue += quote.amount || 0;
        importData.quotes.push(quote);
        
        // Se não há quoteName salvo e esta cotação tem quoteName, usar o da cotação
        if (!importData.quoteName && quote.quoteName) {
            importData.quoteName = quote.quoteName;
        }
    });
    
    // Converter para array e ordenar por data/hora (mais recente primeiro)
    return Array.from(importsMap.values()).sort((a, b) => 
        b.datetime - a.datetime
    );
};

// Função para atualizar múltiplas cotações de uma importação
export const updateQuotesFromImport = async (quotesToUpdate) => {
    try {
        const updatePromises = quotesToUpdate.map(async (quote) => {
            const { id, ...updateData } = quote;
            
            // Verificar se o ID existe
            if (!id) {
                console.warn('Cotações sem ID encontrada. Criando nova cotação.');
                return addDoc(collection(db, 'quotes'), {
                    ...updateData,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }
            
            // Verificar se o documento existe antes de tentar atualizar
            const quoteRef = doc(db, 'quotes', id);
            const quoteDoc = await getDoc(quoteRef);
            
            if (quoteDoc.exists()) {
                return updateDoc(quoteRef, {
                    ...updateData,
                    imageUrl: updateData.imageUrl || null,
                    updatedAt: serverTimestamp()
                });
            } else {
                console.warn(`Documento com ID ${id} não encontrado. Criando novo documento.`);
                // Se o documento não existe, criar um novo
                return setDoc(quoteRef, {
                    ...updateData,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }
        });
        
        await Promise.all(updatePromises);
        return { success: true, message: 'Cotações atualizadas com sucesso!' };
    } catch (error) {
        console.error('Erro ao atualizar cotações:', error);
        throw error;
    }
};
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { getAllFactories, getQuotesByFactory, getQuoteImportsByFactory } from '../firebase/firestoreService';

const FactoryDebug = () => {
    const authData = useAuth();
    const currentUser = authData?.currentUser || null;
    const loading = authData?.loading || false;
    
    const [factories, setFactories] = useState([]);
    const [selectedFactory, setSelectedFactory] = useState('');
    const [quotesData, setQuotesData] = useState([]);
    const [importsData, setImportsData] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [errorLog, setErrorLog] = useState([]);

    // Botão específico para testar a fábrica problemática
    const testProblematicFactory = async () => {
        setLoadingData(true);
        setErrorLog([]);
        
        try {
            console.log('🔍 Testando fábrica específica...');
            setErrorLog(prev => [...prev, `${new Date().toISOString()}: Iniciando teste da fábrica`]);
            
            // Carregar lista de fábricas primeiro
            const factoriesData = await getAllFactories();
            console.log('📋 Fábricas encontradas:', factoriesData);
            setErrorLog(prev => [...prev, `${new Date().toISOString()}: Fábricas carregadas: ${factoriesData.length} itens`]);
            
            // Procurar pela fábrica "Garrafas Térmicas"
            const problematicFactory = factoriesData.find(f => 
                f.nomeFabrica && f.nomeFabrica.toLowerCase().includes('garrafas')
            );
            
            if (!problematicFactory) {
                throw new Error('Fábrica "Garrafas Térmicas" não encontrada');
            }
            
            console.log('✅ Fábrica encontrada:', problematicFactory);
            setErrorLog(prev => [...prev, `${new Date().toISOString()}: Fábrica encontrada: ${JSON.stringify(problematicFactory)}`]);
            
            // Tentar carregar cotações
            console.log('🔄 Tentando carregar cotações...');
            setErrorLog(prev => [...prev, `${new Date().toISOString()}: Tentando carregar cotações para factoryId: ${problematicFactory.id}`]);
            
            const quotes = await getQuotesByFactory(problematicFactory.id);
            console.log('✅ Cotações carregadas:', quotes);
            setErrorLog(prev => [...prev, `${new Date().toISOString()}: Cotações carregadas: ${quotes.length} itens`]);
            
            // Tentar carregar importações
            console.log('🔄 Tentando carregar importações...');
            setErrorLog(prev => [...prev, `${new Date().toISOString()}: Tentando carregar importações`]);
            
            const imports = await getQuoteImportsByFactory(problematicFactory.id);
            console.log('✅ Importações carregadas:', imports);
            setErrorLog(prev => [...prev, `${new Date().toISOString()}: Importações carregadas: ${imports.length} itens`]);
            
            setQuotesData(quotes);
            setImportsData(imports);
            setErrorLog(prev => [...prev, `${new Date().toISOString()}: ✅ Teste finalizado com sucesso!`]);
            
        } catch (error) {
            console.error('❌ Erro no teste:', error);
            setErrorLog(prev => [...prev, `${new Date().toISOString()}: ❌ ERRO: ${error.message}`]);
            setErrorLog(prev => [...prev, `${new Date().toISOString()}: Stack: ${error.stack}`]);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        // Carregar fábricas automaticamente
        const loadFactories = async () => {
            try {
                const data = await getAllFactories();
                setFactories(data);
            } catch (error) {
                console.error('Erro ao carregar fábricas:', error);
                setErrorLog(prev => [...prev, `${new Date().toISOString()}: Erro ao carregar fábricas: ${error.message}`]);
            }
        };
        
        loadFactories();
    }, []);

    const loadQuotesForSelectedFactory = async () => {
        if (!selectedFactory) return;
        
        setLoadingData(true);
        setErrorLog([]);
        
        try {
            setErrorLog(prev => [...prev, `${new Date().toISOString()}: Testando fábrica selecionada: ${selectedFactory}`]);
            
            const quotes = await getQuotesByFactory(selectedFactory);
            const imports = await getQuoteImportsByFactory(selectedFactory);
            
            setQuotesData(quotes);
            setImportsData(imports);
            setErrorLog(prev => [...prev, `${new Date().toISOString()}: ✅ Sucesso! Cotações: ${quotes.length}, Importações: ${imports.length}`]);
            
        } catch (error) {
            console.error('Erro:', error);
            setErrorLog(prev => [...prev, `${new Date().toISOString()}: ❌ ERRO: ${error.message}`]);
        } finally {
            setLoadingData(false);
        }
    };

    return (
        <div style={{ 
            backgroundColor: '#f8f9fa', 
            minHeight: '100vh', 
            padding: '2rem',
            fontFamily: 'monospace'
        }}>
            <h1>🐛 Debug - Fábrica de Garrafas Térmicas</h1>
            
            <div style={{ backgroundColor: 'white', padding: '1rem', margin: '1rem 0', borderRadius: '8px' }}>
                <h3>🔐 Authentication Status</h3>
                <p><strong>Logged in:</strong> {currentUser ? `Sim - ${currentUser.email}` : 'Não'}</p>
                <p><strong>Firebase Auth:</strong> {auth?.app?.options?.authDomain || 'Não disponível'}</p>
                <p><strong>Firestore:</strong> {db?.app?.options?.projectId || 'Não disponível'}</p>
            </div>

            <div style={{ backgroundColor: 'white', padding: '1rem', margin: '1rem 0', borderRadius: '8px' }}>
                <h3>🧪 Teste da Fábrica Problemática</h3>
                <button 
                    onClick={testProblematicFactory}
                    disabled={loadingData}
                    style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '1rem 2rem',
                        borderRadius: '8px',
                        fontSize: '1.1rem',
                        cursor: loadingData ? 'not-allowed' : 'pointer',
                        marginBottom: '1rem'
                    }}
                >
                    {loadingData ? '🔄 Testando...' : '🚀 Testar Fábrica Garrafas Térmicas'}
                </button>
                
                <div>
                    {factories.length > 0 && (
                        <div>
                            <h4>📋 Fábricas Disponíveis ({factories.length}):</h4>
                            <ul style={{ fontSize: '0.9rem' }}>
                                {factories.map(factory => (
                                    <li key={factory.id}>
                                        {factory.nomeFabrica} (ID: {factory.id})
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '1rem', margin: '1rem 0', borderRadius: '8px' }}>
                <h3>🔬 Teste Personalizado</h3>
                <select 
                    onChange={(e) => setSelectedFactory(e.target.value)}
                    value={selectedFactory}
                    style={{ marginBottom: '1rem', padding: '0.5rem' }}
                >
                    <option value="">Selecione uma fábrica...</option>
                    {factories.map(factory => (
                        <option key={factory.id} value={factory.id}>
                            {factory.nomeFabrica}
                        </option>
                    ))}
                </select>
                <br />
                <button 
                    onClick={loadQuotesForSelectedFactory}
                    disabled={!selectedFactory || loadingData}
                    style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        cursor: (!selectedFactory || loadingData) ? 'not-allowed' : 'pointer'
                    }}
                >
                    Testar Fábrica Selecionada
                </button>
            </div>

            <div style={{ backgroundColor: 'white', padding: '1rem', margin: '1rem 0', borderRadius: '8px' }}>
                <h3>📊 Resultados</h3>
                <p><strong>Cotações:</strong> {quotesData.length} itens</p>
                <p><strong>Importações:</strong> {importsData.length} itens</p>
                
                {quotesData.length > 0 && (
                    <div>
                        <h4>Primeiras 3 Cotações:</h4>
                        <pre style={{ fontSize: '0.8rem', backgroundColor: '#f9f9f9', padding: '1rem', borderRadius: '4px' }}>
                            {JSON.stringify(quotesData.slice(0, 3), null, 2)}
                        </pre>
                    </div>
                )}
                
                {importsData.length > 0 && (
                    <div>
                        <h4>Importações:</h4>
                        <pre style={{ fontSize: '0.8rem', backgroundColor: '#f9f9f9', padding: '1rem', borderRadius: '4px' }}>
                            {JSON.stringify(importsData.slice(0, 2), null, 2)}
                        </pre>
                    </div>
                )}
            </div>

            <div style={{ backgroundColor: 'white', padding: '1rem', margin: '1rem 0', borderRadius: '8px' }}>
                <h3>📝 Log de Testes</h3>
                {errorLog.length === 0 ? (
                    <p style={{ color: '#6c757d' }}>Nenhum teste executado ainda.</p>
                ) : (
                    <div style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: '#f9f9f9', padding: '1rem', borderRadius: '4px' }}>
                        {errorLog.map((log, index) => (
                            <div key={index} style={{ 
                                fontSize: '0.8rem', 
                                marginBottom: '0.5rem',
                                color: log.includes('❌') ? '#dc3545' : log.includes('✅') ? '#28a745' : '#495057',
                                fontFamily: 'monospace'
                            }}>
                                {log}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ backgroundColor: '#d4edda', padding: '1rem', borderRadius: '8px', marginTop: '2rem' }}>
                <h3 style={{ color: '#155724', marginTop: 0 }}>💡 Instruções</h3>
                <ol style={{ color: '#155724' }}>
                    <li>Clique em "Testar Fábrica Garrafas Térmicas" para debug específico</li>
                    <li>Verifique os logs para identificar onde exatamente está o erro</li>
                    <li>Teste outras fábricas para ver se o problema é específico desta</li>
                    <li>Compare os IDs das fábricas para verificar se há inconsistência</li>
                </ol>
            </div>
        </div>
    );
};

export default FactoryDebug;

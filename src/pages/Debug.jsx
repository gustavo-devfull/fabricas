import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, limit } from 'firebase/firestore';

const Debug = () => {
    const { currentUser, loading } = useAuth();
    const [firebaseStatus, setFirebaseStatus] = useState('checking...');
    const [errorLog, setErrorLog] = useState([]);

    useEffect(() => {
        checkFirebaseConnection();
    }, []);

    const checkFirebaseConnection = async () => {
        try {
            // Teste básico de conexão Firestore
            const q = query(collection(db, "factories"), limit(1));
            await getDocs(q);
            setFirebaseStatus('Connected ✅');
        } catch (error) {
            setErrorLog(prev => [...prev, `${new Date().toISOString()}: ${error.message}`]);
            setFirebaseStatus(`Error: ${error.message}`);
        }
    };

    const addLogMessage = (message) => {
        setErrorLog(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
    };

    return (
        <div style={{ 
            backgroundColor: '#f8f9fa', 
            minHeight: '100vh', 
            padding: '2rem',
            fontFamily: 'monospace'
        }}>
            <h1>🐛 Debug - Ravi Import System</h1>
            
            <div style={{ backgroundColor: 'white', padding: '1rem', margin: '1rem 0', borderRadius: '8px' }}>
                <h3>🔐 Authentication Status</h3>
                <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
                <p><strong>Current User:</strong> {currentUser ? currentUser.email : 'Not logged in'}</p>
                <p><strong>User ID:</strong> {currentUser ? currentUser.uid : 'N/A'}</p>
            </div>

            <div style={{ backgroundColor: 'white', padding: '1rem', margin: '1rem 0', borderRadius: '8px' }}>
                <h3>🔥 Firebase Status</h3>
                <p><strong>Connection:</strong> {firebaseStatus}</p>
                <p><strong>Auth Domain:</strong> {auth.app.options.authDomain}</p>
                <p><strong>Project ID:</strong> {db.app.options.projectId}</p>
            </div>

            <div style={{ backgroundColor: 'white', padding: '1rem', margin: '1rem 0', borderRadius: '8px' }}>
                <h3>🚦 System Info</h3>
                <p><strong>Current Time:</strong> {new Date().toISOString()}</p>
                <p><strong>User Agent:</strong> {navigator.userAgent}</p>
                <p><strong>URL:</strong> {window.location.href}</p>
                <p><strong>Pathname:</strong> {window.location.pathname}</p>
                <p><strong>Search:</strong> {window.location.search}</p>
            </div>

            <div style={{ backgroundColor: 'white', padding: '1rem', margin: '1rem 0', borderRadius: '8px' }}>
                <h3>📝 Error Logs</h3>
                {errorLog.length === 0 ? (
                    <p style={{ color: 'green' }}>No errors detected ✅</p>
                ) : (
                    <div>
                        {errorLog.map((error, index) => (
                            <p key={index} style={{ color: 'red', fontSize: '0.8rem' }}>{error}</p>
                        ))}
                    </div>
                )}
                <button 
                    onClick={() => addLogMessage('Manual test log entry')}
                    style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Add Test Log
                </button>
            </div>

            <div style={{ backgroundColor: 'white', padding: '1rem', margin: '1rem 0', borderRadius: '8px' }}>
                <h3>🔗 Quick Navigation</h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <a href="/login" style={{ color: '#28a745' }}>Login</a>
                    <a href="/admin/dashboard" style={{ color: '#007bff' }}>Dashboard</a>
                    <a href="/admin/create-quote" style={{ color: '#007bff' }}>Create Quote</a>
                    <a href="/admin/selected-products" style={{ color: '#6f42c1' }}>Selected Products</a>
                    <a href="/debug" style={{ color: '#ffc107' }}>Debug (This Page)</a>
                </div>
            </div>

            <div style={{ 
                backgroundColor: '#d4edda', 
                border: '1px solid #c3e6cb', 
                padding: '1rem', 
                borderRadius: '8px',
                marginTop: '2rem'
            }}>
                <h3 style={{ color: '#155724', marginTop: 0 }}>💡 Troubleshooting Tips</h3>
                <ul style={{ color: '#155724' }}>
                    <li>Make sure you're logged in before accessing admin pages</li>
                    <li>Check browser console for JavaScript errors</li>
                    <li>Verify Firebase configuration is correct</li>
                    <li>Clear browser cache if experiencing issues</li>
                    <li>Check network tab for failed HTTP requests</li>
                </ul>
            </div>
        </div>
    );
};

export default Debug;

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
// Importe o CSS principal do Bootstrap aqui
import 'bootstrap/dist/css/bootstrap.min.css'; 
import './index.css'; 
import { AuthProvider } from './contexts/AuthContext.jsx'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
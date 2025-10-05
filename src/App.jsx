import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import PrivateRoute from './components/PrivateRoute';
import AdminLayout from './components/AdminLayout';

// Importação dos Componentes de Página
import AdminDashboard from './pages/admin/AdminDashboard';
import FactorySetup from './pages/admin/FactorySetup';
import ImportData from './pages/admin/ImportData';
import UserManagement from './pages/admin/UserManagement';
import SelectedProducts from './pages/admin/SelectedProducts';
import CreateQuote from './pages/admin/CreateQuote';
import UserProfile from './pages/admin/UserProfile';
import ExportedOrders from './pages/admin/ExportedOrders';
import Debug from './pages/Debug';
import FactoryDebug from './pages/FactoryDebug';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Rota Pública: Login */}
        <Route path="/login" element={<Login />} />
        
        {/* Rota Pública: Debug */}
        <Route path="/debug" element={<Debug />} />
        
        {/* Rota Pública: Factory Debug */}
        <Route path="/factory-debug" element={<FactoryDebug />} />
        
        {/* Agrupamento de Rotas Protegidas com o Layout */}
        <Route element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
            {/* Rota Raiz: Redireciona para o Dashboard */}
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            
            {/* Rotas de Administração Filhas */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/setup" element={<FactorySetup />} />
            <Route path="/admin/import" element={<ImportData />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/profile" element={<UserProfile />} />
            <Route path="/admin/selected-products" element={<SelectedProducts />} />
            <Route path="/admin/create-quote" element={<CreateQuote />} />
            <Route path="/admin/exported-orders" element={<ExportedOrders />} />
        </Route>
        
        {/* Rota para página não encontrada (404) */}
        <Route path="*" element={
          <div className="p-8 text-center" style={{backgroundColor: '#f8f9fa', minHeight: '100vh'}}>
            <img src="/RAVI-LOGO-COLOR.svg" alt="Ravi Logo" style={{width: '200px', marginBottom: '2rem'}} />
            <h2 style={{color: '#dc3545'}}>404 - Página Não Encontrada</h2>
            <p>O link que você está tentando acessar não existe.</p>
            <p>Clique <a href="/admin/dashboard" style={{color: '#007bff', textDecoration: 'none'}}>aqui</a> para voltar ao dashboard.</p>
            <p style={{color: '#6c757d', fontSize: '0.8rem'}}>ID: {Date.now()}</p>
            <div style={{marginTop: '2rem'}}>
              <a href="/login" style={{color: '#28a745', marginRight: '1rem'}}>Login</a>
              <a href="/admin/create-quote" style={{color: '#007bff', marginRight: '1rem'}}>Criar Cotação</a>
              <a href="/admin/selected-products" style={{color: '#6f42c1'}}>Produtos Selecionados</a>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
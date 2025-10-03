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

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Rota Pública: Login */}
        <Route path="/login" element={<Login />} />
        
        {/* Agrupamento de Rotas Protegidas com o Layout */}
        <Route element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
            {/* Rota Raiz: Redireciona para o Dashboard */}
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            
            {/* Rotas de Administração Filhas */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/setup" element={<FactorySetup />} />
            <Route path="/admin/import" element={<ImportData />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/selected-products" element={<SelectedProducts />} />
            <Route path="/admin/create-quote" element={<CreateQuote />} />
        </Route>
        
        {/* Rota para página não encontrada (404) */}
        <Route path="*" element={<div className="p-8">404 - Página Não Encontrada</div>} />
      </Routes>
    </Router>
  );
}

export default App;
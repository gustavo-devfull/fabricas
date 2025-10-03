import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import logoRavi from '../assets/RAVI-LOGO-COLOR.svg';

// Componente do Logo RAVI
const LogoComponent = () => {
    return (
        <img 
            src={logoRavi} 
            alt="RAVI Logo" 
            style={{ 
                height: '24px', 
                width: 'auto' 
            }}
            className="me-2"
        />
    );
};

const AdminLayout = () => {
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    const navItems = [
        { to: '/admin/dashboard', label: 'Dashboard' },
        { to: '/admin/setup', label: 'Cadastro Fábrica' },
        { to: '/admin/create-quote', label: 'Criar Cotação' },
        { to: '/admin/import', label: 'Importar Dados' },
        { to: '/admin/selected-products', label: 'Produtos Selecionados' },
        { to: '/admin/users', label: 'Gerenciar Usuários' },
    ];

    return (
        <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
            {/* Navbar Topo */}
            <Navbar bg="dark" variant="dark" expand="lg">
                <Container fluid>
                    <Navbar.Brand href="/admin/dashboard" className="d-flex align-items-center">
                        <LogoComponent />
                        <span className="ms-2">Import</span>
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            {navItems.map(item => (
                                <Nav.Link 
                                    key={item.to}
                                    as={NavLink} // Usa NavLink do router para navegação
                                    to={item.to}
                                    className={({ isActive }) => (isActive ? 'active' : '')}
                                >
                                    {item.label}
                                </Nav.Link>
                            ))}
                        </Nav>
                        <Button variant="danger" onClick={handleLogout}>
                            <span className="material-icons me-1" style={{fontSize: '18px'}}>logout</span>
                            Sair
                        </Button>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* Conteúdo Principal */}
            <Container fluid className="mt-4 flex-grow-1">
                <Outlet />
            </Container>
        </div>
    );
};

export default AdminLayout;
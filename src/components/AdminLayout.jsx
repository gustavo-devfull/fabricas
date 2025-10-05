import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar, Nav, Container, Button, Dropdown } from 'react-bootstrap';
import { Person, Logout } from '@mui/icons-material';
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
    const { logout, currentUser } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    const navItems = [
        { to: '/admin/dashboard', label: 'Dashboard' },
        { to: '/admin/setup', label: '' },
        { to: '/admin/create-quote', label: 'Criar Cotação' },
        { to: '/admin/import', label: 'Importar Dados' },
        { to: '/admin/selected-products', label: 'Produtos Selecionados' },
        { to: '/admin/exported-orders', label: 'Pedidos Exportados' },
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
                        <Nav>
                            <Dropdown align="end">
                                <Dropdown.Toggle variant="outline-light" id="user-dropdown">
                                    <Person className="me-2" />
                                    {currentUser?.displayName || currentUser?.email || 'Usuário'}
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item as={NavLink} to="/admin/profile">
                                        <Person className="me-2" />
                                        Meu Perfil
                                    </Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item onClick={handleLogout} className="text-danger">
                                        <Logout className="me-2" />
                                        Sair
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Nav>
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
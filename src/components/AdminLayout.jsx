import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';

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
        { to: '/admin/import', label: 'Importar Dados' },
        { to: '/admin/users', label: 'Gerenciar Usuários' },
    ];

    return (
        <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
            {/* Navbar Topo */}
            <Navbar bg="dark" variant="dark" expand="lg">
                <Container fluid>
                    <Navbar.Brand href="/admin/dashboard">
                        <span className="material-icons me-2" style={{fontSize: '24px', verticalAlign: 'middle'}}>factory</span>
                        Fabricas Manager
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
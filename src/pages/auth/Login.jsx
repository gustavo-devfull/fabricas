import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Container, Alert } from 'react-bootstrap';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!email || !password) {
            setError('Preencha e-mail e senha.');
            return;
        }

        try {
            setLoading(true);
            await login(email, password);
            navigate('/admin/dashboard'); 
            
        } catch (err) {
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('E-mail ou senha inválidos.');
            } else {
                setError('Falha ao entrar. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <div className="w-100" style={{ maxWidth: '400px' }}>
                <Card className="shadow">
                    <Card.Body>
                        <h2 className="text-center mb-4">
                            <span className="material-icons me-2" style={{fontSize: '32px', verticalAlign: 'middle'}}>login</span>
                            Acesso ao Sistema
                        </h2>
                        
                        {error && <Alert variant="danger">{error}</Alert>}

                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3" controlId="email">
                                <Form.Label>E-mail</Form.Label>
                                <Form.Control
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu.email@empresa.com"
                                />
                            </Form.Group>

                            <Form.Group className="mb-4" controlId="password">
                                <Form.Label>Senha</Form.Label>
                                <Form.Control
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="********"
                                />
                            </Form.Group>

                            <Button 
                                disabled={loading} 
                                className="w-100" 
                                type="submit" 
                                variant="primary"
                            >
                                <span className="material-icons me-1" style={{fontSize: '18px'}}>
                                    {loading ? 'hourglass_empty' : 'login'}
                                </span>
                                {loading ? 'Acessando...' : 'Entrar'}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </div>
        </Container>
    );
};

export default Login;
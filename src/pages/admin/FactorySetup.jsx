import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { 
    saveFactoryConfig, 
    getFactoryConfig 
} from '../../firebase/firestoreService';

const FactorySetup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nomeFabrica: '',
        localizacao: '',
        segmento: '',
        nomeContato: '',
        emailContato: '',
        telefoneContato: '',
        wechatContato: '',
    });
    const [loading, setLoading] = useState(true);
    const [isConfigured, setIsConfigured] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const checkConfig = async () => {
            try {
                const config = await getFactoryConfig();
                if (config) {
                    setIsConfigured(true);
                    setFormData(config);
                }
            } catch (err) {
                console.error("Erro ao verificar configuração:", err);
            } finally {
                setLoading(false);
            }
        };
        checkConfig();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (isConfigured && !window.confirm("A fábrica já está cadastrada. Deseja realmente atualizar os dados?")) {
            return;
        }

        try {
            setLoading(true);
            await saveFactoryConfig(formData);
            
            setSuccess(isConfigured ? 'Configuração da Fábrica atualizada com sucesso!' : 'Fábrica cadastrada com sucesso!');
            setIsConfigured(true);
            
            if (!isConfigured) {
                setTimeout(() => navigate('/admin/dashboard'), 2000);
            }
        } catch (err) {
            console.error("Erro ao salvar a fábrica:", err);
            setError('Falha ao salvar. Verifique sua conexão e permissões do Firestore.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center p-5"><div className="spinner-border text-primary" role="status"></div></div>;
    }

    return (
        <Container className="my-5">
            <h1 className="mb-4 text-primary">
                <span className="material-icons me-2" style={{fontSize: '32px', verticalAlign: 'middle'}}>settings</span>
                {isConfigured ? 'Editar Configuração da Fábrica' : '1. Cadastro Inicial da Fábrica'}
            </h1>
            
            <Card className="shadow-sm">
                <Card.Body>
                    
                    {success && <Alert variant="success">{success}</Alert>}
                    {error && <Alert variant="danger">{error}</Alert>}
                    {isConfigured && !success && (
                        <Alert variant="info">
                            A fábrica já está cadastrada. Você está no modo de edição.
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                        
                        <h4 className="mb-3 text-secondary border-bottom pb-2">Detalhes da Fábrica</h4>
                        <Row className="mb-3 g-3">
                            <FormGroup 
                                label="Nome da Fábrica" 
                                name="nomeFabrica" 
                                value={formData.nomeFabrica} 
                                onChange={handleChange} 
                                required 
                            />
                            <FormGroup 
                                label="Localização" 
                                name="localizacao" 
                                value={formData.localizacao} 
                                onChange={handleChange} 
                                required 
                            />
                            <FormGroup 
                                label="Segmento" 
                                name="segmento" 
                                value={formData.segmento} 
                                onChange={handleChange} 
                                required 
                            />
                        </Row>

                        <h4 className="mb-3 mt-4 text-secondary border-bottom pb-2">Dados de Contato</h4>
                        <Row className="mb-4 g-3">
                            <FormGroup 
                                label="Nome do Contato" 
                                name="nomeContato" 
                                value={formData.nomeContato} 
                                onChange={handleChange} 
                                required 
                            />
                            <FormGroup 
                                label="E-mail do Contato" 
                                name="emailContato" 
                                type="email" 
                                value={formData.emailContato} 
                                onChange={handleChange} 
                                required 
                            />
                            <FormGroup 
                                label="Telefone" 
                                name="telefoneContato" 
                                value={formData.telefoneContato} 
                                onChange={handleChange} 
                            />
                            <FormGroup 
                                label="WeChat ID" 
                                name="wechatContato" 
                                value={formData.wechatContato} 
                                onChange={handleChange} 
                            />
                        </Row>
                        
                        <Button
                            type="submit"
                            disabled={loading}
                            variant="success"
                            className="me-3"
                        >
                            <span className="material-icons me-1" style={{fontSize: '18px'}}>
                                {loading ? 'hourglass_empty' : (isConfigured ? 'save' : 'add')}
                            </span>
                            {loading ? 'Salvando...' : (isConfigured ? 'Atualizar Dados' : 'Cadastrar Fábrica')}
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/admin/dashboard')}
                        >
                            <span className="material-icons me-1" style={{fontSize: '18px'}}>cancel</span>
                            Cancelar
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

// Componente auxiliar para os campos do formulário
const FormGroup = ({ label, name, value, onChange, type = 'text', required = false }) => (
    <Col md={6}>
        <Form.Group controlId={name}>
            <Form.Label>
                {label} {required && <span className="text-danger">*</span>}
            </Form.Label>
            <Form.Control
                type={type}
                name={name}
                required={required}
                value={value}
                onChange={onChange}
            />
        </Form.Group>
    </Col>
);

export default FactorySetup;
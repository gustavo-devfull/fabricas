import React from 'react';
import { Card, Button, Row, Col } from 'react-bootstrap';

const FactoryForm = ({ 
    show, 
    editingFactory, 
    factoryForm, 
    setFactoryForm, 
    onSubmit, 
    onCancel, 
    onDelete,
    loading = false 
}) => {
    if (!show) return null;

    return (
        <Card id="factory-form-card" className="mb-4 shadow-sm">
            <Card.Header className="bg-info text-white">
                <h5 className="mb-0">
                    {editingFactory ? 'Editar Fábrica' : 'Adicionar Nova Fábrica'}
                </h5>
            </Card.Header>
            <Card.Body>
                <form onSubmit={onSubmit}>
                    <Row className="mb-3 g-3">
                        <Col md={6}>
                            <label className="form-label">Nome da Fábrica *</label>
                            <input
                                type="text"
                                className="form-control"
                                value={factoryForm.name}
                                onChange={(e) => setFactoryForm({...factoryForm, name: e.target.value})}
                                required
                            />
                        </Col>
                        <Col md={6}>
                            <label className="form-label">Localização *</label>
                            <input
                                type="text"
                                className="form-control"
                                value={factoryForm.localizacao}
                                onChange={(e) => setFactoryForm({...factoryForm, localizacao: e.target.value})}
                                required
                            />
                        </Col>
                        <Col md={6}>
                            <label className="form-label">Segmento *</label>
                            <input
                                type="text"
                                className="form-control"
                                value={factoryForm.segmento}
                                onChange={(e) => setFactoryForm({...factoryForm, segmento: e.target.value})}
                                required
                            />
                        </Col>
                        <Col md={6}>
                            <label className="form-label">Status</label>
                            <select
                                className="form-control"
                                value={factoryForm.status}
                                onChange={(e) => setFactoryForm({...factoryForm, status: e.target.value})}
                            >
                                <option value="ativa">Ativa</option>
                                <option value="inativa">Inativa</option>
                                <option value="manutencao">Manutenção</option>
                            </select>
                        </Col>
                        <Col md={6}>
                            <label className="form-label">Nome do Contato *</label>
                            <input
                                type="text"
                                className="form-control"
                                value={factoryForm.nomeContato}
                                onChange={(e) => setFactoryForm({...factoryForm, nomeContato: e.target.value})}
                                required
                            />
                        </Col>
                        <Col md={6}>
                            <label className="form-label">E-mail do Contato *</label>
                            <input
                                type="email"
                                className="form-control"
                                value={factoryForm.emailContato}
                                onChange={(e) => setFactoryForm({...factoryForm, emailContato: e.target.value})}
                                required
                            />
                        </Col>
                        <Col md={6}>
                            <label className="form-label">Telefone</label>
                            <input
                                type="text"
                                className="form-control"
                                value={factoryForm.telefoneContato}
                                onChange={(e) => setFactoryForm({...factoryForm, telefoneContato: e.target.value})}
                            />
                        </Col>
                        <Col md={6}>
                            <label className="form-label">WeChat ID</label>
                            <input
                                type="text"
                                className="form-control"
                                value={factoryForm.wechatContato}
                                onChange={(e) => setFactoryForm({...factoryForm, wechatContato: e.target.value})}
                            />
                        </Col>
                    </Row>
                    <div className="d-flex gap-2">
                        <Button 
                            type="submit" 
                            variant="success"
                            disabled={loading}
                        >
                            <span className="material-icons me-1" style={{fontSize: '18px'}}>
                                {editingFactory ? 'save' : 'add'}
                            </span>
                            {loading ? 'Salvando...' : (editingFactory ? 'Atualizar' : 'Adicionar')}
                        </Button>
                        <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={onCancel}
                            disabled={loading}
                        >
                            <span className="material-icons me-1" style={{fontSize: '18px'}}>cancel</span>
                            Cancelar
                        </Button>
                        {editingFactory && (
                            <Button 
                                type="button" 
                                variant="danger" 
                                onClick={() => onDelete(editingFactory.id)}
                                disabled={loading}
                            >
                                <span className="material-icons me-1" style={{fontSize: '18px'}}>delete</span>
                                Excluir
                            </Button>
                        )}
                    </div>
                </form>
            </Card.Body>
        </Card>
    );
};

export default FactoryForm;

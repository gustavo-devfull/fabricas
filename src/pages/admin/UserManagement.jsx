import React, { useState, useEffect } from 'react';
import { getUsersData, addUser, deleteUserByUid, updateUserRole } from '../../firebase/firestoreService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { Container, Card, Alert, Button, Table, Form, Modal, Row, Col } from 'react-bootstrap';

const UserManagement = () => {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    
    // Gerencia o modal (true/false)
    const [showModal, setShowModal] = useState(false); 
    // Gerencia o modo do modal ('add' ou 'edit')
    const [modalMode, setModalMode] = useState('add'); 

    // Estado para Adicionar Novo Utilizador
    const [newUser, setNewUser] = useState({ email: '', password: '', role: 'user' });
    
    // Estado para Editar Utilizador Existente
    const [editingUser, setEditingUser] = useState(null); 

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsersData();
            // Filtra o utilizador atual para que ele não possa remover a si mesmo
            setUsers(data.filter(u => u.uid !== currentUser.uid)); 
        } catch (err) {
            setError("Falha ao carregar a lista de utilizadores.");
        } finally {
            setLoading(false);
        }
    };

    // --- LÓGICA DE ABRIR MODAL ---
    const handleOpenAddModal = () => {
        setModalMode('add');
        setNewUser({ email: '', password: '', role: 'user' });
        setError('');
        setShowModal(true);
    };

    const handleOpenEditModal = (user) => {
        setModalMode('edit');
        setEditingUser(user);
        setError('');
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setNewUser({ email: '', password: '', role: 'user' });
        setError('');
    };
    // ----------------------------

    // --- LÓGICA DE SALVAR/EDITAR ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (modalMode === 'add') {
            if (newUser.password.length < 6) {
                setError("A palavra-passe deve ter pelo menos 6 caracteres.");
                return;
            }

            try {
                await addUser(newUser.email, newUser.password, newUser.role);
                setMessage(`Utilizador ${newUser.email} adicionado com sucesso!`);
                handleCloseModal();
                fetchUsers();
            } catch (err) {
                if (err.code === 'auth/email-already-in-use') {
                    setError('Este e-mail já está em uso.');
                } else {
                    setError('Falha ao adicionar utilizador.');
                }
            }
        } else if (modalMode === 'edit') {
            if (editingUser.role !== 'admin' && editingUser.role !== 'user') {
                setError("Papel inválido. Deve ser 'admin' ou 'user'.");
                return;
            }

            try {
                await updateUserRole(editingUser.uid, editingUser.role);
                setMessage(`Utilizador ${editingUser.email} atualizado para o papel: ${editingUser.role}.`);
                handleCloseModal();
                fetchUsers();
            } catch (err) {
                setError('Falha ao atualizar o utilizador.');
            }
        }
    };
    // ----------------------------
    
    // --- LÓGICA DE REMOÇÃO ---
    const handleDeleteUser = async (uid, email) => {
        if (!window.confirm(`Tem certeza que deseja remover o utilizador ${email}? Esta ação não pode ser desfeita.`)) {
            return;
        }

        try {
            await deleteUserByUid(uid);
            setMessage(`Utilizador ${email} removido do Firestore.`);
            fetchUsers();
        } catch (err) {
            setError("Falha ao remover o registo do utilizador.");
        }
    };
    // ----------------------------

    return (
        <Container className="my-5">
            <h1 className="mb-4 text-primary">
                3. Administração de Utilizadores
            </h1>
            
            {message && (<Alert variant="success">{message}</Alert>)}
            {error && (<Alert variant="danger">{error}</Alert>)}

            {/* Cartão de Utilizadores Existentes */}
            <Card className="shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                    <Card.Title className="mb-0">Utilizadores do Sistema ({users.length + 1})</Card.Title>
                    <Button variant="primary" onClick={handleOpenAddModal}>
                        Adicionar Novo Utilizador
                    </Button>
                </Card.Header>
                <Card.Body>
                    {loading ? (
                        <div className="text-center p-3"><div className="spinner-border text-primary"></div></div>
                    ) : (
                        <Table responsive striped bordered hover className="mb-0">
                            <thead>
                                <tr>
                                    <th>E-mail</th>
                                    <th>Papel</th>
                                    <th>Data Criação</th>
                                    <th className="text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Utilizador atual (Admin) */}
                                <tr>
                                    <td>{currentUser.email}</td>
                                    <td><span className="badge bg-danger">Admin (Você)</span></td>
                                    <td>-</td>
                                    <td>-</td>
                                </tr>
                                {users.map((user) => (
                                    <tr key={user.uid}>
                                        <td>{user.email}</td>
                                        <td><span className={`badge ${user.role === 'admin' ? 'bg-info' : 'bg-secondary'}`}>{user.role}</span></td>
                                        <td>{formatDate(user.createdAt?.toDate?.()) || 'N/A'}</td>
                                        <td className="text-center">
                                            <Button
                                                onClick={() => handleOpenEditModal(user)}
                                                variant="outline-secondary"
                                                size="sm"
                                                className="me-2"
                                            >
                                                Editar
                                            </Button>
                                            <Button
                                                onClick={() => handleDeleteUser(user.uid, user.email)}
                                                variant="outline-danger"
                                                size="sm"
                                            >
                                                Remover
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
            
            {/* Modal ÚNICO para Adicionar e Editar Utilizador */}
            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {modalMode === 'add' ? 'Adicionar Novo Utilizador' : `Editar Utilizador: ${editingUser?.email}`}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        {modalMode === 'edit' && error && (<Alert variant="danger">{error}</Alert>)}
                        
                        <Row className="g-3">
                            <Col xs={12}>
                                <Form.Group controlId="email">
                                    <Form.Label>E-mail</Form.Label>
                                    <Form.Control
                                        type="email"
                                        required
                                        value={modalMode === 'add' ? newUser.email : editingUser?.email}
                                        onChange={(e) => modalMode === 'add' && setNewUser({ ...newUser, email: e.target.value })}
                                        disabled={modalMode === 'edit'} // Não permite mudar o e-mail na edição
                                    />
                                </Form.Group>
                            </Col>
                            
                            {modalMode === 'add' && (
                                <Col xs={12}>
                                    <Form.Group controlId="password">
                                        <Form.Label>Palavra-passe</Form.Label>
                                        <Form.Control
                                            type="password"
                                            required
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            placeholder="Mínimo 6 caracteres"
                                        />
                                    </Form.Group>
                                </Col>
                            )}

                            <Col xs={12}>
                                <Form.Group controlId="role">
                                    <Form.Label>Papel</Form.Label>
                                    <Form.Control
                                        as="select"
                                        value={modalMode === 'add' ? newUser.role : editingUser?.role}
                                        onChange={(e) => {
                                            if (modalMode === 'add') {
                                                setNewUser({ ...newUser, role: e.target.value });
                                            } else {
                                                setEditingUser({ ...editingUser, role: e.target.value });
                                            }
                                        }}
                                    >
                                        <option value="user">Utilizador</option>
                                        <option value="admin">Administrador</option>
                                    </Form.Control>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant={modalMode === 'add' ? 'primary' : 'success'}>
                            {modalMode === 'add' ? 'Criar Utilizador' : 'Salvar Alterações'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default UserManagement;
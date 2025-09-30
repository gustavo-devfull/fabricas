import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { 
    getAllFactories, 
    addFactory, 
    updateFactory, 
    deleteFactory,
    getQuotesByFactory,
    deleteQuote,
    getQuoteImportsByFactory,
    updateQuotesFromImport
} from '../../firebase/firestoreService';
import Alert from '../../components/Alert';
import FactoryForm from '../../components/dashboard/FactoryForm';
import FactoryCard from '../../components/dashboard/FactoryCard';
import QuotesSection from '../../components/dashboard/QuotesSection';

const AdminDashboard = () => {
    const { currentUser } = useAuth();
    const [factories, setFactories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingFactory, setEditingFactory] = useState(null);
    const [factoryForm, setFactoryForm] = useState({
        nomeFabrica: '',
        localizacao: '',
        segmento: '',
        nomeContato: '',
        emailContato: '',
        telefoneContato: '',
        wechatContato: '',
        status: 'ativa'
    });
    const [quotes, setQuotes] = useState([]);
    const [selectedFactoryForQuotes, setSelectedFactoryForQuotes] = useState('');
    const [showQuotes, setShowQuotes] = useState(false);
    const [quoteImports, setQuoteImports] = useState([]);
    const [editingImport, setEditingImport] = useState(null);
    const [editingQuotes, setEditingQuotes] = useState([]);
    const [selectedQuotes, setSelectedQuotes] = useState([]);
    const [showMultiSelect, setShowMultiSelect] = useState(false);
    const [alert, setAlert] = useState({ show: false, variant: 'info', message: '', title: '' });

    const showAlert = useCallback((variant, title, message, actions = []) => {
        setAlert({ show: true, variant, title, message, actions });
    }, []);

    const loadFactories = useCallback(async () => {
        try {
            setLoading(true);
            const factoriesData = await getAllFactories();
            setFactories(factoriesData);
        } catch (err) {
            console.error('Erro ao carregar fábricas:', err);
            showAlert('error', 'Erro!', 'Erro ao carregar fábricas');
        } finally {
            setLoading(false);
        }
    }, [showAlert]);

    useEffect(() => {
        loadFactories();
    }, [loadFactories]);

    const handleAddFactory = async (e) => {
        e.preventDefault();
        try {
            await addFactory(factoryForm);
            setFactoryForm({
                nomeFabrica: '',
                localizacao: '',
                segmento: '',
                nomeContato: '',
                emailContato: '',
                telefoneContato: '',
                wechatContato: '',
                status: 'ativa'
            });
            setShowAddForm(false);
            loadFactories();
            showAlert('success', 'Sucesso!', 'Fábrica adicionada com sucesso!');
        } catch (err) {
            console.error('Erro ao adicionar fábrica:', err);
            showAlert('error', 'Erro!', 'Erro ao adicionar fábrica');
        }
    };

    const handleEditFactory = (factory) => {
        setEditingFactory(factory);
        setFactoryForm(factory);
        setShowAddForm(true);
    };

    const handleUpdateFactory = async (e) => {
        e.preventDefault();
        try {
            await updateFactory(editingFactory.id, factoryForm);
            setEditingFactory(null);
            setFactoryForm({
                nomeFabrica: '',
                localizacao: '',
                segmento: '',
                nomeContato: '',
                emailContato: '',
                telefoneContato: '',
                wechatContato: '',
                status: 'ativa'
            });
            setShowAddForm(false);
            loadFactories();
            showAlert('success', 'Sucesso!', 'Fábrica atualizada com sucesso!');
        } catch (err) {
            console.error('Erro ao atualizar fábrica:', err);
            showAlert('error', 'Erro!', 'Erro ao atualizar fábrica');
        }
    };

    const handleDeleteFactory = async (factoryId) => {
        if (window.confirm('Tem certeza que deseja excluir esta fábrica?')) {
            try {
                await deleteFactory(factoryId);
                loadFactories();
                showAlert('success', 'Sucesso!', 'Fábrica excluída com sucesso!');
            } catch (err) {
                console.error('Erro ao excluir fábrica:', err);
                showAlert('error', 'Erro!', 'Erro ao excluir fábrica');
            }
        }
    };

    const handleCancel = () => {
        setShowAddForm(false);
        setEditingFactory(null);
        setFactoryForm({
            nomeFabrica: '',
            localizacao: '',
            segmento: '',
            nomeContato: '',
            emailContato: '',
            telefoneContato: '',
            wechatContato: '',
            status: 'ativa'
        });
    };

    const loadQuotes = async (factoryId) => {
        try {
            const quotesData = await getQuotesByFactory(factoryId);
            const importsData = await getQuoteImportsByFactory(factoryId);
            setQuotes(quotesData);
            setQuoteImports(importsData);
            setSelectedFactoryForQuotes(factoryId);
            setShowQuotes(true);
        } catch (err) {
            console.error('Erro ao carregar cotações:', err);
            showAlert('error', 'Erro!', 'Erro ao carregar cotações');
        }
    };

    const handleDeleteQuote = async (quoteId) => {
        if (window.confirm('Tem certeza que deseja excluir esta cotação?')) {
            try {
                await deleteQuote(quoteId);
                loadQuotes(selectedFactoryForQuotes);
                showAlert('success', 'Sucesso!', 'Cotação excluída com sucesso!');
            } catch (err) {
                console.error('Erro ao excluir cotação:', err);
                showAlert('error', 'Erro!', 'Erro ao excluir cotação');
            }
        }
    };

    const handleCloseQuotes = () => {
        setShowQuotes(false);
        setQuotes([]);
        setQuoteImports([]);
        setSelectedFactoryForQuotes('');
        setEditingImport(null);
        setEditingQuotes([]);
        setSelectedQuotes([]);
        setShowMultiSelect(false);
    };

    const handleEditImport = (importData) => {
        setEditingImport(importData);
        setEditingQuotes([...importData.quotes]);
    };

    const handleUpdateQuote = (quoteIndex, field, value) => {
        const updatedQuotes = [...editingQuotes];
        updatedQuotes[quoteIndex] = {
            ...updatedQuotes[quoteIndex],
            [field]: value
        };
        
        // Recalcular preço total se quantidade ou preço unitário mudou
        if (field === 'qty' || field === 'unitPrice') {
            const quantidade = field === 'qty' ? value : updatedQuotes[quoteIndex].qty;
            const precoUnitario = field === 'unitPrice' ? value : updatedQuotes[quoteIndex].unitPrice;
            updatedQuotes[quoteIndex].amount = quantidade * precoUnitario;
        }
        
        setEditingQuotes(updatedQuotes);
    };

    const handleSaveImport = async () => {
        try {
            setLoading(true);
            
            const quotesWithId = editingQuotes.filter(quote => quote.id);
            
            if (quotesWithId.length === 0) {
                showAlert('error', 'Erro!', 'Nenhuma cotação válida para atualizar. Todas as cotações precisam ter um ID.');
                return;
            }
            
            await updateQuotesFromImport(quotesWithId);
            
            await loadQuotes(selectedFactoryForQuotes);
            
            setEditingImport(null);
            setEditingQuotes([]);
            showAlert('success', 'Sucesso!', 'Importação atualizada com sucesso!');
        } catch (err) {
            console.error('Erro ao salvar importação:', err);
            showAlert('error', 'Erro!', 'Erro ao salvar importação: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingImport(null);
        setEditingQuotes([]);
    };

    const hideAlert = () => {
        setAlert({ show: false, variant: 'info', message: '', title: '' });
    };

    const handleBulkAction = async (action, selectedIds) => {
        try {
            setLoading(true);
            
            switch (action) {
                case 'delete': {
                    const deletePromises = selectedIds.map(id => deleteQuote(id));
                    await Promise.all(deletePromises);
                    showAlert('success', 'Sucesso!', `${selectedIds.length} cotações excluídas com sucesso.`);
                    await loadQuotes(selectedFactoryForQuotes);
                    break;
                }
                    
                case 'export':
                    showAlert('info', 'Exportação', 'Funcionalidade de exportação será implementada em breve.');
                    break;
                    
                case 'duplicate':
                    showAlert('info', 'Duplicação', 'Funcionalidade de duplicação será implementada em breve.');
                    break;
                    
                default:
                    showAlert('warning', 'Ação não implementada', 'Esta ação ainda não foi implementada.');
            }
            
            setSelectedQuotes([]);
            setShowMultiSelect(false);
            
        } catch (err) {
            console.error('Erro na ação em lote:', err);
            showAlert('error', 'Erro!', `Erro ao executar ação: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleViewImport = (importData, allQuotes) => {
        const importQuotes = allQuotes.filter(quote => {
            const quoteCreatedAt = quote.createdAt?.toDate?.();
            if (!quoteCreatedAt) return false;
            const quoteKey = quoteCreatedAt.toISOString().substring(0, 16);
            return quoteKey === importData.id;
        });
        setQuotes(importQuotes);
    };

    const handleImport = (factoryId) => {
        window.location.href = `/admin/import?factory=${factoryId}`;
    };

    const handleImageUpdate = (quoteId, imageUrl) => {
        // Atualizar a cotação na lista local
        setQuotes(prevQuotes => 
            prevQuotes.map(quote => 
                quote.id === quoteId 
                    ? { ...quote, imageUrl } 
                    : quote
            )
        );
    };

    const handleRefreshQuotes = async () => {
        if (selectedFactoryForQuotes) {
            await loadQuotes(selectedFactoryForQuotes);
        }
    };

    if (loading) {
        return (
            <Container fluid>
                <div className="text-center p-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Carregando...</span>
                    </div>
                    <p className="mt-2 text-primary">Carregando fábricas...</p>
                </div>
            </Container>
        );
    }

    return (
        <Container fluid>
            {/* Alert Component */}
            <Alert
                show={alert.show}
                variant={alert.variant}
                title={alert.title}
                message={alert.message}
                actions={alert.actions}
                onClose={hideAlert}
                autoClose={true}
                duration={5000}
            />

            <h1 className="mb-4 text-primary">
                Dashboard - Sistema de Fábricas
            </h1>
            <p className="lead text-muted mb-5">
                Bem-vindo(a), {currentUser?.email}. Gerencie suas fábricas aqui.
            </p>

            {/* Botões de Ação */}
            <div className="mb-4">
                <Button 
                    variant="success" 
                    onClick={() => setShowAddForm(true)}
                    className="me-2"
                >
                    <span className="material-icons me-1" style={{fontSize: '18px'}}>add</span>
                    Adicionar Nova Fábrica
                </Button>
                <Button 
                    variant="outline-primary" 
                    onClick={loadFactories}
                >
                    <span className="material-icons me-1" style={{fontSize: '18px'}}>refresh</span>
                    Atualizar Lista
                </Button>
            </div>

            {/* Formulário de Fábrica */}
            <FactoryForm
                show={showAddForm}
                editingFactory={editingFactory}
                factoryForm={factoryForm}
                setFactoryForm={setFactoryForm}
                onSubmit={editingFactory ? handleUpdateFactory : handleAddFactory}
                onCancel={handleCancel}
                loading={loading}
            />

            {/* Cards das Fábricas */}
            <div className="mb-4">
                <h2 className="mb-3">
                    <span className="material-icons me-2" style={{fontSize: '28px', verticalAlign: 'middle'}}>factory</span>
                    Fábricas Cadastradas
                </h2>
                
                {factories.length === 0 ? (
                    <Card className="text-center p-5">
                        <Card.Body>
                            <div className="mb-3">
                                <span className="material-icons" style={{fontSize: '4rem', color: '#6c757d'}}>factory</span>
                            </div>
                            <h4>Nenhuma fábrica cadastrada ainda</h4>
                            <p className="text-muted">Comece cadastrando sua primeira fábrica</p>
                            <Button variant="success" onClick={() => setShowAddForm(true)}>
                                <span className="material-icons me-1" style={{fontSize: '18px'}}>add</span>
                                Cadastrar Primeira Fábrica
                            </Button>
                        </Card.Body>
                    </Card>
                ) : (
                    <Row className="g-4">
                        {factories.map((factory) => (
                            <Col key={factory.id} xs={12} sm={6} md={4} lg={3} xl={2}>
                                <FactoryCard
                                    factory={factory}
                                    onEdit={handleEditFactory}
                                    onViewQuotes={loadQuotes}
                                    onImport={handleImport}
                                    onDelete={handleDeleteFactory}
                                />
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            {/* Seção de Cotações */}
            <QuotesSection
                show={showQuotes}
                selectedFactoryForQuotes={selectedFactoryForQuotes}
                factoryName={factories.find(f => f.id === selectedFactoryForQuotes)?.nomeFabrica}
                quotes={quotes}
                quoteImports={quoteImports}
                editingImport={editingImport}
                editingQuotes={editingQuotes}
                selectedQuotes={selectedQuotes}
                showMultiSelect={showMultiSelect}
                onClose={handleCloseQuotes}
                onViewImport={handleViewImport}
                onEditImport={handleEditImport}
                onUpdateQuote={handleUpdateQuote}
                onSaveImport={handleSaveImport}
                onCancelEdit={handleCancelEdit}
                onDeleteQuote={handleDeleteQuote}
                onToggleMultiSelect={() => setShowMultiSelect(!showMultiSelect)}
                onSelectionChange={setSelectedQuotes}
                onBulkAction={handleBulkAction}
                onImageUpdate={handleImageUpdate}
                onRefresh={handleRefreshQuotes}
                loading={loading}
            />
        </Container>
    );
};

export default AdminDashboard;
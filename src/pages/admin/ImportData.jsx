import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Container, Card, Alert, Form, Button, Row, Col, Table } from 'react-bootstrap';
import { 
    getAllFactories, 
    addMultipleQuotes 
} from '../../firebase/firestoreService';
import { useSearchParams, useNavigate } from 'react-router-dom';

const ImportData = () => {
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [factories, setFactories] = useState([]);
    const [selectedFactory, setSelectedFactory] = useState('');
    const [importPreview, setImportPreview] = useState([]);
    const [showPreview, setShowPreview] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        loadFactories();
        
        // Verificar se há uma fábrica pré-selecionada na URL
        const factoryId = searchParams.get('factory');
        if (factoryId) {
            setSelectedFactory(factoryId);
        }
    }, [searchParams]);

    const loadFactories = async () => {
        try {
            const factoriesData = await getAllFactories();
            setFactories(factoriesData);
        } catch (err) {
            console.error('Erro ao carregar fábricas:', err);
            setError('Erro ao carregar fábricas');
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileName(file.name);
            processFile(file);
        }
    };

    const processFile = (file) => {
        setLoading(true);
        setError('');
        setSuccess('');
        setShowPreview(false);

        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                // Começar a ler a partir da terceira linha (linha 3)
                const jsonArray = XLSX.utils.sheet_to_json(worksheet, { range: 2 });

                if (jsonArray.length === 0) {
                    setError("O arquivo não contém dados.");
                    return;
                }

                // Processar dados para cotações
                const quotesData = jsonArray.map((item, index) => ({
                    ref: String(item['REF'] || item['ref'] || `REF-${index}`).trim(),
                    description: String(item['DESCRIPTION'] || item['description'] || item['Descrição'] || 'N/A').trim(),
                    name: String(item['NAME'] || item['name'] || item['Nome'] || '').trim(),
                    remark: String(item['REMARK'] || item['remark'] || item['Observação'] || '').trim(),
                    obs: String(item['OBS'] || item['obs'] || item['Observações'] || '').trim(),
                    ncm: String(item['NCM'] || item['ncm'] || '').trim(),
                    englishDescription: String(item['English Description'] || item['englishDescription'] || item['Descrição Inglesa'] || '').trim(),
                    photo: String(item['PHOTO'] || item['photo'] || item['Foto'] || '').trim(),
                    ctns: Number(item['CTNS'] || item['ctns'] || item['Caixas'] || 0),
                    unitPerCtn: Number(item['UNIT/CTN'] || item['unitPerCtn'] || item['Unidade/Caixa'] || 0),
                    qty: Number(item['QTY'] || item['qty'] || item['Quantidade'] || 0),
                    unitPrice: Number(item['U.PRICE'] || item['unitPrice'] || item['Preço Unitário'] || 0),
                    unit: String(item['UNIT'] || item['unit'] || item['Unidade'] || 'UN').trim(),
                    amount: Number(item['AMOUNT'] || item['amount'] || item['Valor Total'] || 0),
                    length: Number(item['L'] || item['length'] || item['Comprimento'] || 0),
                    width: Number(item['W'] || item['width'] || item['Largura'] || 0),
                    height: Number(item['H'] || item['height'] || item['Altura'] || 0),
                    cbm: Number(item['CBM'] || item['cbm'] || item['Volume'] || 0),
                    cbmTotal: Number(item['CBM TOTAL'] || item['cbmTotal'] || item['Volume Total'] || 0),
                    grossWeight: Number(item['G.W'] || item['grossWeight'] || item['Peso Bruto'] || 0),
                    totalGrossWeight: Number(item['T.G.W'] || item['totalGrossWeight'] || item['Peso Bruto Total'] || 0),
                    netWeight: Number(item['N.W'] || item['netWeight'] || item['Peso Líquido'] || 0),
                    totalNetWeight: Number(item['T.N.W'] || item['totalNetWeight'] || item['Peso Líquido Total'] || 0),
                    unitWeight: Number(item['Peso Unitário(g)'] || item['unitWeight'] || item['Peso Unitário'] || 0),
                    factoryId: selectedFactory,
                    factoryName: factories.find(f => f.id === selectedFactory)?.nomeFabrica || 'N/A'
                }));

                setImportPreview(quotesData);
                setShowPreview(true);
                setSuccess(`Arquivo processado com sucesso! ${quotesData.length} cotações encontradas.`);

            } catch (err) {
                console.error("Erro ao processar arquivo:", err);
                setError("Erro ao ler ou processar o arquivo. Verifique se o formato está correto.");
            } finally {
                setLoading(false);
            }
        };

        reader.readAsArrayBuffer(file);
    };

    const handleImportQuotes = async () => {
        if (!selectedFactory) {
            setError('Por favor, selecione uma fábrica antes de importar.');
            return;
        }

        if (importPreview.length === 0) {
            setError('Nenhuma cotação para importar.');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            // Adicionar factoryId a todas as cotações
            const quotesWithFactory = importPreview.map(quote => ({
                ...quote,
                factoryId: selectedFactory,
                factoryName: factories.find(f => f.id === selectedFactory)?.nomeFabrica || 'N/A'
            }));

            await addMultipleQuotes(quotesWithFactory);
            
            // Mostrar mensagem de sucesso
            setSuccess(`✅ Sucesso! ${quotesWithFactory.length} cotações importadas para "${factories.find(f => f.id === selectedFactory)?.nomeFabrica}". Redirecionando para o dashboard...`);
            
            // Redirecionar para o dashboard após importação bem-sucedida
            setTimeout(() => {
                navigate('/admin/dashboard');
            }, 2000);

        } catch (err) {
            console.error('Erro ao importar cotações:', err);
            setError('Erro ao importar cotações. Verifique sua conexão e permissões.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelImport = () => {
        setShowPreview(false);
        setImportPreview([]);
        setSelectedFactory('');
        setFileName('');
        setError('');
        setSuccess('');
    };

    return (
        <Container className="my-5">
            <h1 className="mb-4 text-primary">
                <span className="material-icons me-2" style={{fontSize: '32px', verticalAlign: 'middle'}}>upload</span>
                Importação de Cotações
            </h1>

            <Card className="shadow-sm">
                <Card.Header className="bg-info text-white">
                    <h5 className="mb-0">
                        <span className="material-icons me-2" style={{fontSize: '24px', verticalAlign: 'middle'}}>file_upload</span>
                        Importar Cotações e Associar à Fábrica
                    </h5>
                </Card.Header>
                <Card.Body>
                    <Alert variant="info" className="mb-4">
                        <h6 className="mb-2">
                            <span className="material-icons me-1" style={{fontSize: '20px', verticalAlign: 'middle'}}>info</span>
                            Estrutura do Arquivo Esperada:
                        </h6>
                        <p className="mb-1"><strong>Importante:</strong> A leitura da planilha começa na terceira linha (linha 3)</p>
                        <p className="mb-1"><strong>Colunas principais:</strong> REF, DESCRIPTION, NAME, QTY, U.PRICE, AMOUNT, UNIT</p>
                        <p className="mb-1"><strong>Colunas adicionais:</strong> REMARK, OBS, NCM, English Description, PHOTO, CTNS, UNIT/CTN</p>
                        <p className="mb-0"><strong>Dimensões e pesos:</strong> L, W, H, CBM, CBM TOTAL, G.W, T.G.W, N.W, T.N.W, Peso Unitário(g)</p>
                    </Alert>
                    
                    {success && <Alert variant="success">{success}</Alert>}
                    {error && <Alert variant="danger">{error}</Alert>}

                    {selectedFactory && (
                        <Alert variant="info" className="mb-4">
                            <span className="material-icons me-2" style={{fontSize: '20px', verticalAlign: 'middle'}}>info</span>
                            <strong>Fábrica pré-selecionada:</strong> {factories.find(f => f.id === selectedFactory)?.nomeFabrica}
                        </Alert>
                    )}

                    <Row className="mb-4">
                        <Col md={6}>
                            <Form.Group controlId="factorySelect">
                                <Form.Label>Selecione a Fábrica *</Form.Label>
                                <Form.Select
                                    value={selectedFactory}
                                    onChange={(e) => setSelectedFactory(e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="">Escolha uma fábrica...</option>
                                    {factories.map(factory => (
                                        <option key={factory.id} value={factory.id}>
                                            {factory.nomeFabrica} - {factory.localizacao}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="formFile">
                                <Form.Label>Selecione o arquivo de cotações</Form.Label>
                                <Form.Control
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleFileUpload}
                                    disabled={loading || !selectedFactory}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    
                    {fileName && (
                        <div className="mb-3">
                            <p className="text-muted">
                                <strong>Arquivo selecionado:</strong> {fileName}
                            </p>
                        </div>
                    )}

                    {showPreview && (
                        <div className="mb-4">
                            <h5 className="mb-3">
                                <span className="material-icons me-2" style={{fontSize: '24px', verticalAlign: 'middle'}}>preview</span>
                                Pré-visualização das Cotações
                            </h5>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                <Table striped bordered hover size="sm">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>REF</th>
                                            <th>Description</th>
                                            <th>Name</th>
                                            <th>QTY</th>
                                            <th>U.PRICE</th>
                                            <th>AMOUNT</th>
                                            <th>UNIT</th>
                                            <th>CBM</th>
                                            <th>G.W</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {importPreview.slice(0, 10).map((quote, index) => (
                                            <tr key={index}>
                                                <td>{quote.ref}</td>
                                                <td>{quote.description}</td>
                                                <td>{quote.name}</td>
                                                <td>{quote.qty}</td>
                                                <td>R$ {quote.unitPrice.toFixed(2)}</td>
                                                <td>R$ {quote.amount.toFixed(2)}</td>
                                                <td>{quote.unit}</td>
                                                <td>{quote.cbm}</td>
                                                <td>{quote.grossWeight}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                                {importPreview.length > 10 && (
                                    <p className="text-muted text-center">
                                        ... e mais {importPreview.length - 10} cotações
                                    </p>
                                )}
                            </div>
                            
                            <div className="d-flex gap-2 mt-3">
                                <Button 
                                    variant="success" 
                                    onClick={handleImportQuotes}
                                    disabled={loading}
                                >
                                    <span className="material-icons me-1" style={{fontSize: '18px'}}>check</span>
                                    {loading ? 'Importando...' : `Importar ${importPreview.length} Cotações`}
                                </Button>
                                <Button 
                                    variant="secondary" 
                                    onClick={handleCancelImport}
                                    disabled={loading}
                                >
                                    <span className="material-icons me-1" style={{fontSize: '18px'}}>cancel</span>
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    )}

                    {!showPreview && (
                        <div className="text-center">
                            <Button 
                                variant="primary" 
                                disabled={loading || !fileName || !selectedFactory}
                                onClick={() => processFile(document.getElementById('formFile').files[0])}
                                className="w-100"
                            >
                                <span className="material-icons me-1" style={{fontSize: '18px'}}>analytics</span>
                                {loading ? 'Processando Arquivo...' : 'Analisar Arquivo'}
                            </Button>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ImportData;
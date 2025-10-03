import React, { useState, useRef } from 'react';
import { Modal, Button, ProgressBar, Alert, Table, Badge } from 'react-bootstrap';
import { CloudUpload, Description, CheckCircle, Cancel, Download } from '@mui/icons-material';
import excelImageImportService from '../../services/excelImageImportService';

const ImageImportModal = ({ show, onHide, onImportComplete }) => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            try {
                excelImageImportService.validateFile(selectedFile);
                setFile(selectedFile);
                setError(null);
            } catch (err) {
                setError(err.message);
                setFile(null);
            }
        }
    };

    const handleImport = async () => {
        if (!file) {
            setError('Selecione um arquivo Excel');
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setError(null);
        setResults(null);

        try {
            // Simular progresso
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 200);

            const importResults = await excelImageImportService.importImagesFromExcel(file, {
                overwrite: false
            });

            clearInterval(progressInterval);
            setProgress(100);
            setResults(importResults);

            // Chamar callback se fornecido
            if (onImportComplete) {
                onImportComplete(importResults);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setResults(null);
        setError(null);
        setProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onHide();
    };

    const handleExportResults = () => {
        if (results) {
            excelImageImportService.exportResultsToCSV(results);
        }
    };

    const getStatusBadge = (item) => {
        if (item.skipped) {
            return <Badge bg="warning">Pulado</Badge>;
        }
        return <Badge bg="success">Processado</Badge>;
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    <CloudUpload className="me-2" />
                    Importar Imagens do Excel
                </Modal.Title>
            </Modal.Header>
            
            <Modal.Body>
                {!results ? (
                    <div>
                        {/* Seleção de Arquivo */}
                        <div className="mb-4">
                            <label className="form-label">
                                <Description className="me-2" />
                                Selecione o arquivo Excel (.xlsx, .xls)
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="form-control"
                                accept=".xlsx,.xls"
                                onChange={handleFileSelect}
                                disabled={isProcessing}
                            />
                            {file && (
                                <div className="mt-2">
                                    <small className="text-muted">
                                        Arquivo selecionado: <strong>{file.name}</strong> 
                                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                    </small>
                                </div>
                            )}
                        </div>

                        {/* Barra de Progresso */}
                        {isProcessing && (
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span>Processando arquivo...</span>
                                    <span>{progress}%</span>
                                </div>
                                <ProgressBar now={progress} animated />
                            </div>
                        )}

                        {/* Botão de Importação */}
                        <div className="d-flex justify-content-end">
                            <Button
                                variant="primary"
                                onClick={handleImport}
                                disabled={!file || isProcessing}
                                className="d-flex align-items-center"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="spinner-border spinner-border-sm me-2" role="status">
                                            <span className="visually-hidden">Carregando...</span>
                                        </div>
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <CloudUpload className="me-2" />
                                        Importar Imagens
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* Resultados da Importação */}
                        <div className="mb-4">
                            <h5>Resultados da Importação</h5>
                            <div className="row">
                                <div className="col-md-3">
                                    <div className="card text-center">
                                        <div className="card-body">
                                            <h6 className="card-title text-primary">
                                                {results.success + results.errors}
                                            </h6>
                                            <small className="text-muted">Total Processado</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="card text-center">
                                        <div className="card-body">
                                            <h6 className="card-title text-success">
                                                <CheckCircle className="me-1" />
                                                {results.success}
                                            </h6>
                                            <small className="text-muted">Sucessos</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="card text-center">
                                        <div className="card-body">
                                            <h6 className="card-title text-danger">
                                                <Cancel className="me-1" />
                                                {results.errors}
                                            </h6>
                                            <small className="text-muted">Erros</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="card text-center">
                                        <div className="card-body">
                                            <h6 className="card-title text-info">
                                                {excelImageImportService.getImportStats(results).successRate.toFixed(1)}%
                                            </h6>
                                            <small className="text-muted">Taxa de Sucesso</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabela de Resultados */}
                        {results.processed.length > 0 && (
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6>Produtos Processados</h6>
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={handleExportResults}
                                        className="d-flex align-items-center"
                                    >
                                        <Download className="me-1" />
                                        Exportar CSV
                                    </Button>
                                </div>
                                
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    <Table striped bordered hover size="sm">
                                        <thead>
                                            <tr>
                                                <th>REF</th>
                                                <th>Nome do Arquivo</th>
                                                <th>Status</th>
                                                <th>Preview</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.processed.map((item, index) => (
                                                <tr key={index}>
                                                    <td>{item.ref}</td>
                                                    <td>{item.fileName}</td>
                                                    <td>{getStatusBadge(item)}</td>
                                                    <td>
                                                        {item.imageUrl && (
                                                            <img
                                                                src={item.imageUrl}
                                                                alt={item.ref}
                                                                style={{
                                                                    width: '40px',
                                                                    height: '40px',
                                                                    objectFit: 'cover',
                                                                    borderRadius: '4px'
                                                                }}
                                                            />
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        {/* Lista de Erros */}
                        {results.errorsList.length > 0 && (
                            <div className="mb-4">
                                <h6 className="text-danger">Erros Encontrados</h6>
                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {results.errorsList.map((error, index) => (
                                        <Alert key={index} variant="danger" className="py-2">
                                            <strong>REF {error.ref}:</strong> {error.error}
                                        </Alert>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Mensagens de Erro */}
                {error && (
                    <Alert variant="danger" className="mt-3">
                        <Cancel className="me-2" />
                        {error}
                    </Alert>
                )}
            </Modal.Body>
            
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    {results ? 'Fechar' : 'Cancelar'}
                </Button>
                {results && (
                    <Button variant="primary" onClick={handleClose}>
                        Concluir
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default ImageImportModal;

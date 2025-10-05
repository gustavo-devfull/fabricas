import React, { useState } from 'react';
import { Modal, Button, Alert, Spinner, Form, Row, Col } from 'react-bootstrap';
import { Box, Typography, Chip } from '@mui/material';
import { FileUpload, CloudUpload, Image, CheckCircle, Error } from '@mui/icons-material';
import excelImageImportService from '../../services/excelImageImportService';

const ImageImportModal = ({ show, onHide, onImportComplete }) => {
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(null);
    const [result, setResult] = useState(null);
    const [fileName, setFileName] = useState('');

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        
        if (selectedFile) {
            // Validar extensão do arquivo
            const fileName = selectedFile.name.toLowerCase();
            const isValidFormat = excelImageImportService.supportedFormats.some(format => 
                fileName.endsWith(format)
            );
            
            if (!isValidFormat) {
                alert('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
                event.target.value = '';
                return;
            }
            
            setFile(selectedFile);
            setFileName(selectedFile.name);
            setResult(null);
        }
    };

    const handleImport = async () => {
        if (!file) {
            alert('Por favor, selecione um arquivo Excel');
            return;
        }

        setImporting(true);
        setResult(null);
        setProgress({ processed: 0, total: 0, currentStep: 'Iniciando...' });

        try {
            console.log('🚀 Iniciando importação de imagens do Excel:', fileName);

            // Configurar callback para atualizar progresso
            const onProgress = (processed, total, currentStep) => {
                setProgress({
                    processed,
                    total,
                    currentStep,
                    percentage: total > 0 ? Math.round((processed / total) * 100) : 0
                });
            };

            // Executar importação
            const importResult = await excelImageImportService.importImagesFromExcel(file, { 
                onProgress 
            });

            console.log('✅ Importação concluída:', importResult);

            setResult(importResult);
            
            // Notificar componente pai sobre o resultado
            if (onImportComplete) {
                onImportComplete(importResult);
            }

        } catch (error) {
            console.error('❌ Erro na importação:', error);
            
            setResult({
                success: 0,
                errors: 1,
                processed: [],
                message: error.message
            });
        } finally {
            setImporting(false);
            setProgress(null);
        }
    };

    const handleClose = () => {
        setFile(null);
        setFileName('');
        setImporting(false);
        setProgress(null);
        setResult(null);
        
        // Limpar input
        const fileInput = document.querySelector('#imageImportFile');
        if (fileInput) {
            fileInput.value = '';
        }
        
        onHide();
    };

    const handleDownloadLog = () => {
        if (!result) return;

        const logData = {
            timestamp: new Date().toISOString(),
            fileName: fileName,
            result: result
        };

        const blob = new Blob([JSON.stringify(logData, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `importacao_log_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const getFileIcon = () => {
        if (!fileName) return <CloudUpload />;
        
        const fileNameLower = fileName.toLowerCase();
        if (fileNameLower.includes('image') || fileNameLower.includes('photo')) {
            return <Image />;
        }
        return <FileUpload />;
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CloudUpload color="primary" />
                    <Typography variant="h6" component="span">
                        Importação de Imagens do Excel
                    </Typography>
                </Box>
            </Modal.Header>

            <Modal.Body>
                {/* Instruções */}
                <Alert variant="info" className="mb-3">
                    <strong>Como funciona:</strong>
                    <br />
                    • Faça upload de uma planilha Excel (.xlsx/.xls)
                    <br />
                    • A planilha deve ter uma coluna "REF" com as referências dos produtos
                    <br />
                    • As imagens devem estar incorporadas na planilha (não como links)
                    <br />
                    • As imagens serão extraídas e associadas aos produtos correspondentes
                </Alert>

                {/* Upload Section */}
                {!importing && (
                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="imageImportFile">
                            <strong>Selecionar Arquivo Excel</strong>
                        </Form.Label>
                        <div className="d-flex align-items-center gap-3">
                            <input
                                id="imageImportFile"
                                type="file"
                                className="form-control"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                                disabled={importing}
                            />
                            {fileName && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {getFileIcon()}
                                    <Typography variant="body2" color="text.secondary">
                                        {fileName}
                                    </Typography>
                                    <Chip label="Pronto" color="success" size="small" />
                                </Box>
                            )}
                        </div>
                    </Form.Group>
                )}

                {/* Progress Section */}
                {importing && progress && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" className="mb-2">
                            {progress.currentStep}
                        </Typography>
                        
                        <div className="progress mb-2">
                            <div 
                                className="progress-bar progress-bar-striped progress-bar-animated"
                                role="progressbar"
                                style={{ width: `${progress.percentage}%` }}
                            >
                                {progress.percentage}%
                            </div>
                        </div>
                        
                        <Typography variant="body2" color="text.secondary">
                            Processados: {progress.processed} de {progress.total}
                        </Typography>
                    </Box>
                )}

                {/* Loading Spinner */}
                {importing && !progress && (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Spinner size="lg" color="primary" />
                        <Typography variant="body2" className="mt-2">
                            Iniciando importação...
                        </Typography>
                    </Box>
                )}

                {/* Result Section */}
                {result && !importing && (
                    <Box sx={{ mt: 3 }}>
                        <Alert 
                            variant={result.success > 0 ? 'success' : 'danger'}
                            className="mb-3"
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {result.success > 0 ? <CheckCircle /> : <Error />}
                                <strong>
                                    {result.success > 0 ? 'Importação Concluída!' : 'Importação Falhou'}
                                </strong>
                            </Box>
                            
                            {result.message && (
                                <div className="mt-2">
                                    <strong>Detalhes:</strong> {result.message}
                                </div>
                            )}
                        </Alert>

                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            {result.success > 0 && (
                                <Chip 
                                    icon={<CheckCircle />}
                                    label={`${result.success} imagens processadas`}
                                    color="success"
                                />
                            )}
                            
                            {result.errors > 0 && (
                                <Chip 
                                    icon={<Error />}
                                    label={`${result.errors} erros`}
                                    color="error"
                                />
                            )}
                        </Box>

                        {/* Detalhes dos Processados */}
                        {result.processed && result.processed.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" className="mb-1">
                                    <strong>Imagens Processadas:</strong>
                                </Typography>
                                <Box sx={{ maxHeight: '200px', overflow: 'auto', p: 1, backgroundColor: '#f8f9fa' }}>
                                    {result.processed.slice(0, 10).map((item, index) => (
                                        <Typography key={index} variant="caption" display="block">
                                            {item.skipped ? (
                                                <span style={{ color: '#ff9800' }}>
                                                    ⚠️ {item.ref}: {item.skipped ? 'Ignorado - ' : ''}{item.error}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#4caf50' }}>
                                                    ✅ {item.ref}: Processado{' '}
                                                    {item.imageUrl ? '(nova imagem)' : '(imagem atual)'}
                                                </span>
                                            )}
                                        </Typography>
                                    ))}
                                    {result.processed.length > 10 && (
                                        <Typography variant="caption" color="text.secondary">
                                            ... e mais {result.processed.length - 10} itens
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        )}
                    </Box>
                )}
            </Modal.Body>

            <Modal.Footer>
                {!importing ? (
                    <>
                        <Button variant="secondary" onClick={handleClose}>
                            Cancelar
                        </Button>
                        
                        {file && (
                            <Button variant="primary" onClick={handleImport}>
                                <CloudUpload className="me-2" />
                                Importar Imagens
                            </Button>
                        )}
                    </>
                ) : (
                    <Button variant="secondary" disabled>
                        <Spinner size="sm" className=" me-2" />
                        Importando...
                    </Button>
                )}
                
                {result && result.processed && result.processed.length > 5 && (
                    <Button variant="success" onClick={handleDownloadLog}>
                        📥 Baixar Log
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default ImageImportModal;

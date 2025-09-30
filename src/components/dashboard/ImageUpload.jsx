import React, { useState, useRef, useEffect } from 'react';
import { Button, Spinner, Alert, Badge } from 'react-bootstrap';
import imageUploadService from '../../services/imageUploadService';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const ImageUpload = ({ quote, onImageUpdate }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [storageInfo, setStorageInfo] = useState(null);
    const fileInputRef = useRef(null);

    // Atualizar informações de armazenamento
    useEffect(() => {
        const updateStorageInfo = () => {
            const info = imageUploadService.getStorageInfo();
            setStorageInfo(info);
        };
        
        updateStorageInfo();
        // Atualizar a cada 30 segundos
        const interval = setInterval(updateStorageInfo, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
            setError('Por favor, selecione apenas arquivos de imagem.');
            return;
        }

        // Validar tamanho (máximo 20MB, será comprimido para 1024x1024 se necessário)
        if (file.size > 20 * 1024 * 1024) {
            setError('A imagem deve ter no máximo 20MB.');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            // Gerar nome único para o arquivo
            const fileName = imageUploadService.generateFileName(file.name, quote.id);
            
            // Upload da imagem
            const imageUrl = await imageUploadService.uploadImage(file, fileName);
            
            // Atualizar no Firestore
            const quoteRef = doc(db, 'quotes', quote.id);
            await updateDoc(quoteRef, {
                imageUrl: imageUrl,
                updatedAt: new Date()
            });

            // Notificar componente pai
            onImageUpdate(imageUrl);
            
            // Atualizar informações de armazenamento
            const info = imageUploadService.getStorageInfo();
            setStorageInfo(info);
            
        } catch (err) {
            console.error('Erro no upload:', err);
            if (err.message.includes('quota')) {
                setError('Armazenamento local cheio. Tente usar uma imagem menor ou limpe imagens antigas.');
            } else {
                setError('Erro ao fazer upload da imagem. Verifique se o arquivo é válido e tente novamente.');
            }
        } finally {
            setUploading(false);
            // Limpar input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveImage = async () => {
        if (!quote.imageUrl) return;

        setUploading(true);
        setError(null);

        try {
            // Verificar se é uma URL externa ou local
            if (quote.imageUrl.includes('data:')) {
                // É uma imagem do localStorage
                const fileName = `quote_${quote.id}_${Date.now()}.jpg`;
                await imageUploadService.deleteImageFromLocalStorage(fileName);
            } else {
                // É uma URL externa (ImgBB)
                await imageUploadService.deleteImage(quote.imageUrl);
            }
            
            // Atualizar no Firestore
            const quoteRef = doc(db, 'quotes', quote.id);
            await updateDoc(quoteRef, {
                imageUrl: null,
                updatedAt: new Date()
            });

            // Notificar componente pai
            onImageUpdate(null);
            
        } catch (err) {
            console.error('Erro ao remover imagem:', err);
            setError('Erro ao remover imagem. Tente novamente.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="image-upload-container">
            {error && (
                <Alert variant="danger" className="mb-2" style={{fontSize: '0.7rem', padding: '4px 8px'}}>
                    {error}
                </Alert>
            )}

            {/* Informações de armazenamento */}
            {storageInfo && (
                <div className="mb-2">
                    <Badge 
                        bg={storageInfo.usagePercent > 80 ? 'warning' : 'info'} 
                        className="px-2 py-1" 
                        style={{fontSize: '0.6rem'}}
                    >
                        <span className="material-icons me-1" style={{fontSize: '10px'}}>storage</span>
                        {storageInfo.imageCount} imagens • {(storageInfo.totalSize / 1024 / 1024).toFixed(1)}MB
                        {storageInfo.usagePercent > 80 && ' (Quase cheio!)'}
                    </Badge>
                </div>
            )}
            
            <div className="d-flex gap-1">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />
                
                <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                        fontSize: '0.7rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        borderWidth: '1px'
                    }}
                >
                    {uploading ? (
                        <Spinner size="sm" />
                    ) : (
                        <span className="material-icons" style={{fontSize: '12px'}}>upload</span>
                    )}
                </Button>

                {quote.imageUrl && (
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={handleRemoveImage}
                        disabled={uploading}
                        style={{
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            borderWidth: '1px'
                        }}
                    >
                        <span className="material-icons" style={{fontSize: '12px'}}>delete</span>
                    </Button>
                )}

                {/* Botão para limpar imagens antigas */}
                {storageInfo && storageInfo.usagePercent > 70 && (
                    <Button
                        variant="outline-warning"
                        size="sm"
                        onClick={() => {
                            const cleaned = imageUploadService.cleanupOldImages(7);
                            const info = imageUploadService.getStorageInfo();
                            setStorageInfo(info);
                            if (cleaned > 0) {
                                setError(null);
                            }
                        }}
                        style={{
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            borderWidth: '1px'
                        }}
                        title="Limpar imagens antigas"
                    >
                        <span className="material-icons" style={{fontSize: '12px'}}>cleaning_services</span>
                    </Button>
                )}

                {/* Botão de limpeza de emergência */}
                {storageInfo && storageInfo.usagePercent > 90 && (
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => {
                            if (window.confirm('Limpar TODAS as imagens? Isso liberará espaço mas removerá todas as imagens armazenadas.')) {
                                const cleaned = imageUploadService.emergencyCleanup();
                                const info = imageUploadService.getStorageInfo();
                                setStorageInfo(info);
                                setError(null);
                            }
                        }}
                        style={{
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            borderWidth: '1px'
                        }}
                        title="Limpeza de emergência - Remove TODAS as imagens"
                    >
                        <span className="material-icons" style={{fontSize: '12px'}}>warning</span>
                    </Button>
                )}
            </div>
        </div>
    );
};

export default ImageUpload;

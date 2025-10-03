import React, { useState, useRef } from 'react';
import { IconButton } from '@mui/material';
import { CloudUpload, Delete } from '@mui/icons-material';
import imageUploadService from '../../services/imageUploadService';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const ImageUpload = ({ quote, onImageUpdate }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {error && (
                <div style={{
                    fontSize: '0.7rem',
                    color: 'red',
                    backgroundColor: '#ffebee',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    marginBottom: '4px'
                }}>
                    {error}
                </div>
            )}
            
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />
            
            <IconButton
                size="small"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                sx={{
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                        backgroundColor: 'primary.dark'
                    },
                    '&:disabled': {
                        backgroundColor: 'grey.300'
                    }
                }}
                title="Upload de imagem"
            >
                <CloudUpload fontSize="small" />
            </IconButton>

            {quote.imageUrl && (
                <IconButton
                    size="small"
                    onClick={handleRemoveImage}
                    disabled={uploading}
                    sx={{
                        backgroundColor: 'error.main',
                        color: 'white',
                        '&:hover': {
                            backgroundColor: 'error.dark'
                        },
                        '&:disabled': {
                            backgroundColor: 'grey.300'
                        }
                    }}
                    title="Remover imagem"
                >
                    <Delete fontSize="small" />
                </IconButton>
            )}
        </div>
    );
};

export default ImageUpload;

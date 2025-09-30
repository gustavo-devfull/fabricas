class ImageUploadService {
    constructor() {
        // Usando localStorage como método principal para simplicidade
        // Você pode implementar um backend próprio ou usar serviços como Cloudinary, AWS S3, etc.
        this.useExternalService = false; // Desabilitado por enquanto
    }

    async uploadImage(file, fileName) {
        try {
            // Por enquanto, usar apenas localStorage para evitar problemas de API
            return await this.uploadImageToLocalStorage(file, fileName);
            
            // Código comentado para uso futuro com serviços externos:
            /*
            if (this.useExternalService) {
                // Implementar upload para serviço externo aqui
                const base64 = await this.fileToBase64(file);
                const formData = new FormData();
                formData.append('image', base64);
                formData.append('name', fileName);
                
                const response = await fetch('SEU_ENDPOINT_AQUI', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    const data = await response.json();
                    return data.url;
                }
            }
            */
        } catch (error) {
            console.error('Erro no upload:', error);
            throw error;
        }
    }

    async deleteImage(imageUrl) {
        // Para serviços como ImgBB, não há API de delete pública
        // As imagens são mantidas no serviço
        return true;
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Remover o prefixo "data:image/...;base64,"
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }

    generateFileName(originalName, quoteId) {
        const timestamp = Date.now();
        const extension = originalName.split('.').pop();
        return `quote_${quoteId}_${timestamp}.${extension}`;
    }

    // Método usando localStorage para armazenamento local
    async uploadImageToLocalStorage(file, fileName) {
        try {
            // Verificar se o arquivo é muito grande (> 500KB) ou se o storage está quase cheio
            const storageInfo = this.getStorageInfo();
            const shouldCompress = file.size > 500 * 1024 || storageInfo.usagePercent > 60;
            
            if (shouldCompress) {
                console.warn('Arquivo grande ou storage quase cheio, comprimindo para 1024x1024...');
                const compressedFile = await this.compressImage(file);
                return await this.uploadCompressedImage(compressedFile, fileName);
            }

            const base64 = await this.fileToBase64(file);
            const imageData = {
                fileName,
                data: base64,
                uploadedAt: new Date().toISOString(),
                fileSize: file.size,
                fileType: file.type,
                originalName: file.name
            };
            
            // Tentar armazenar no localStorage
            try {
                const storageKey = `image_${fileName}`;
                localStorage.setItem(storageKey, JSON.stringify(imageData));
                
                // Retornar URL de dados
                const dataUrl = `data:${file.type};base64,${base64}`;
                return dataUrl;
            } catch (quotaError) {
                console.warn('localStorage cheio, tentando limpeza...');
                // Tentar limpar imagens antigas
                this.cleanupOldImages(7); // Limpar imagens de mais de 7 dias
                
                // Tentar novamente
                try {
                    const storageKey = `image_${fileName}`;
                    localStorage.setItem(storageKey, JSON.stringify(imageData));
                    const dataUrl = `data:${file.type};base64,${base64}`;
                    return dataUrl;
                } catch (retryError) {
                    console.error('localStorage ainda cheio após limpeza, comprimindo...');
                    // Como último recurso, comprimir a imagem
                    const compressedFile = await this.compressImage(file);
                    return await this.uploadCompressedImage(compressedFile, fileName);
                }
            }
        } catch (error) {
            console.error('Erro no upload local:', error);
            throw error;
        }
    }

    async deleteImageFromLocalStorage(fileName) {
        try {
            const storageKey = `image_${fileName}`;
            localStorage.removeItem(storageKey);
            return true;
        } catch (error) {
            console.error('Erro ao remover imagem local:', error);
            throw error;
        }
    }

    // Método para listar todas as imagens armazenadas localmente
    listLocalImages() {
        const images = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('image_')) {
                try {
                    const imageData = JSON.parse(localStorage.getItem(key));
                    images.push({
                        key,
                        fileName: imageData.fileName,
                        uploadedAt: imageData.uploadedAt,
                        fileSize: imageData.fileSize,
                        fileType: imageData.fileType
                    });
                } catch (e) {
                    console.warn(`Erro ao processar imagem ${key}:`, e);
                }
            }
        }
        return images;
    }

    // Método para comprimir imagem com múltiplas tentativas
    async compressImage(file, maxWidth = 1024, quality = 0.7) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Redimensionar para 1024x1024 (quadrado)
                const targetSize = 1024;
                canvas.width = targetSize;
                canvas.height = targetSize;
                
                // Calcular posição para centralizar a imagem
                const scale = Math.min(targetSize / img.width, targetSize / img.height);
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;
                const x = (targetSize - scaledWidth) / 2;
                const y = (targetSize - scaledHeight) / 2;
                
                // Desenhar imagem centralizada e redimensionada
                ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
                
                // Converter para blob com qualidade
                canvas.toBlob((blob) => {
                    // Se ainda for muito grande (> 1MB), tentar compressão mais agressiva
                    if (blob && blob.size > 1024 * 1024) {
                        this.compressImageAggressive(file, 1024, 0.5).then(resolve);
                    } else {
                        resolve(blob);
                    }
                }, file.type, quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    // Compressão mais agressiva para imagens muito grandes
    async compressImageAggressive(file, maxWidth = 1024, quality = 0.5) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Redimensionar para 1024x1024 (quadrado)
                const targetSize = 1024;
                canvas.width = targetSize;
                canvas.height = targetSize;
                
                // Calcular posição para centralizar a imagem
                const scale = Math.min(targetSize / img.width, targetSize / img.height);
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;
                const x = (targetSize - scaledWidth) / 2;
                const y = (targetSize - scaledHeight) / 2;
                
                ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
                
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', quality); // Forçar JPEG para melhor compressão
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    // Método para fazer upload de imagem comprimida
    async uploadCompressedImage(compressedFile, fileName) {
        try {
            const base64 = await this.fileToBase64(compressedFile);
            const imageData = {
                fileName,
                data: base64,
                uploadedAt: new Date().toISOString(),
                fileSize: compressedFile.size,
                fileType: compressedFile.type,
                originalName: fileName,
                compressed: true
            };
            
            const storageKey = `image_${fileName}`;
            
            // Tentar armazenar com tratamento de erro
            try {
                localStorage.setItem(storageKey, JSON.stringify(imageData));
                const dataUrl = `data:${compressedFile.type};base64,${base64}`;
                return dataUrl;
            } catch (quotaError) {
                console.warn('localStorage cheio mesmo após compressão, tentando limpeza...');
                
                // Limpeza mais agressiva
                this.cleanupOldImages(3); // Limpar imagens de mais de 3 dias
                
                // Tentar novamente
                try {
                    localStorage.setItem(storageKey, JSON.stringify(imageData));
                    const dataUrl = `data:${compressedFile.type};base64,${base64}`;
                    return dataUrl;
                } catch (retryError) {
                    // Se ainda não conseguir, tentar compressão ainda mais agressiva
                    console.warn('Tentando compressão ultra-agressiva...');
                    const ultraCompressed = await this.compressImageUltraAggressive(compressedFile);
                    return await this.uploadCompressedImage(ultraCompressed, fileName);
                }
            }
        } catch (error) {
            console.error('Erro no upload comprimido:', error);
            throw error;
        }
    }

    // Compressão ultra-agressiva como último recurso
    async compressImageUltraAggressive(file) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Redimensionar para 1024x1024 (quadrado) mesmo na compressão ultra-agressiva
                const targetSize = 1024;
                canvas.width = targetSize;
                canvas.height = targetSize;
                
                // Calcular posição para centralizar a imagem
                const scale = Math.min(targetSize / img.width, targetSize / img.height);
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;
                const x = (targetSize - scaledWidth) / 2;
                const y = (targetSize - scaledHeight) / 2;
                
                ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
                
                // Qualidade muito baixa mas mantendo 1024x1024
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.2);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    // Método para verificar espaço disponível no localStorage
    getStorageInfo() {
        let totalSize = 0;
        let imageCount = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('image_')) {
                const value = localStorage.getItem(key);
                totalSize += value.length;
                imageCount++;
            }
        }
        
        // Estimativa do limite do localStorage (geralmente 5-10MB)
        const estimatedLimit = 5 * 1024 * 1024; // 5MB
        const usagePercent = (totalSize / estimatedLimit) * 100;
        
        return {
            totalSize,
            imageCount,
            usagePercent,
            estimatedLimit
        };
    }

    // Método para limpar imagens antigas (opcional)
    cleanupOldImages(daysOld = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        const images = this.listLocalImages();
        let cleaned = 0;
        
        images.forEach(image => {
            const uploadDate = new Date(image.uploadedAt);
            if (uploadDate < cutoffDate) {
                localStorage.removeItem(image.key);
                cleaned++;
            }
        });
        
        return cleaned;
    }

    // Método para limpeza de emergência (remove todas as imagens)
    emergencyCleanup() {
        const images = this.listLocalImages();
        let cleaned = 0;
        
        images.forEach(image => {
            localStorage.removeItem(image.key);
            cleaned++;
        });
        
        console.log(`Limpeza de emergência: ${cleaned} imagens removidas`);
        return cleaned;
    }
}

export default new ImageUploadService();

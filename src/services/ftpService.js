class ImageUploadService {
    constructor() {
        // Usando um serviço de hospedagem de imagens gratuito como alternativa
        // Você pode substituir por seu próprio endpoint backend
        this.baseUrl = 'https://api.imgbb.com/1/upload';
        this.apiKey = 'YOUR_IMGBB_API_KEY'; // Substitua pela sua chave da API
    }

    async uploadImage(file, fileName) {
        try {
            // Converter arquivo para base64
            const base64 = await this.fileToBase64(file);
            
            // Criar FormData para upload
            const formData = new FormData();
            formData.append('image', base64);
            formData.append('name', fileName);
            formData.append('key', this.apiKey);

            // Fazer upload para o serviço
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Erro no upload da imagem');
            }

            const data = await response.json();
            
            if (data.success) {
                return data.data.url;
            } else {
                throw new Error(data.error?.message || 'Erro no upload');
            }
        } catch (error) {
            console.error('Erro no upload:', error);
            throw error;
        }
    }

    async deleteImage(imageUrl) {
        // Para serviços como ImgBB, não há API de delete pública
        // As imagens são mantidas no serviço
        console.log('Imagem mantida no serviço:', imageUrl);
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

    // Método alternativo usando localStorage para demonstração
    async uploadImageToLocalStorage(file, fileName) {
        try {
            const base64 = await this.fileToBase64(file);
            const imageData = {
                fileName,
                data: base64,
                uploadedAt: new Date().toISOString()
            };
            
            // Armazenar no localStorage
            localStorage.setItem(`image_${fileName}`, JSON.stringify(imageData));
            
            // Retornar URL de dados
            return `data:image/${file.type.split('/')[1]};base64,${base64}`;
        } catch (error) {
            console.error('Erro no upload local:', error);
            throw error;
        }
    }

    async deleteImageFromLocalStorage(fileName) {
        try {
            localStorage.removeItem(`image_${fileName}`);
            return true;
        } catch (error) {
            console.error('Erro ao remover imagem local:', error);
            throw error;
        }
    }
}

export default new ImageUploadService();

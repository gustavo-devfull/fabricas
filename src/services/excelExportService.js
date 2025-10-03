import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

class ExcelExportService {
    constructor() {
        this.defaultFileName = 'produtos_selecionados';
    }

    // Função auxiliar para formatar datas
    formatDate(date) {
        if (!date) return '';
        
        try {
            // Se é um objeto Firestore Timestamp
            if (date.toDate && typeof date.toDate === 'function') {
                return date.toDate().toLocaleDateString('pt-BR');
            }
            // Se é um objeto Date
            else if (date instanceof Date) {
                return date.toLocaleDateString('pt-BR');
            }
            // Se é uma string de data
            else if (typeof date === 'string') {
                const dateObj = new Date(date);
                if (!isNaN(dateObj.getTime())) {
                    return dateObj.toLocaleDateString('pt-BR');
                }
            }
            // Se é um timestamp numérico
            else if (typeof date === 'number') {
                const dateObj = new Date(date);
                if (!isNaN(dateObj.getTime())) {
                    return dateObj.toLocaleDateString('pt-BR');
                }
            }
            
            return '';
        } catch (error) {
            console.warn('Erro ao formatar data:', error);
            return '';
        }
    }

    // Função para gerar uma nova imagem JPG com informações do produto e fazer upload para FTP
    async generateProductImage(product) {
        try {
            console.log(`Iniciando geração de imagem para produto: ${product.ref}`);
            // Criar canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Configurar tamanho da imagem
            const width = 250;
            const height = 200;
            canvas.width = width;
            canvas.height = height;
            
            // Fundo branco
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            
            // Borda
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, width - 2, height - 2);
            
            // Título
            ctx.fillStyle = '#2c3e50';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PRODUTO', width / 2, 25);
            
            // Linha separadora
            ctx.strokeStyle = '#34495e';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(20, 35);
            ctx.lineTo(width - 20, 35);
            ctx.stroke();
            
            // Informações do produto
            ctx.fillStyle = '#34495e';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            
            const info = [
                `REF: ${product.ref || 'N/A'}`,
                `Nome: ${product.name || 'N/A'}`,
                `CTNS: ${product.ctns || 0}`,
                `QTY: ${(product.ctns || 0) * (product.unitCtn || 1)}`,
                `Preço: $${product.unitPrice || 0}`,
                `CBM: ${product.cbm || 0}`,
                `Peso: ${product.grossWeight || 0}kg`
            ];
            
            // Desenhar informações
            let y = 55;
            info.forEach((line, index) => {
                if (y < height - 20) {
                    ctx.fillText(line, 15, y);
                    y += 18;
                }
            });
            
            // Rodapé com data
            ctx.fillStyle = '#7f8c8d';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, width / 2, height - 10);
            
            // Converter para blob
            return new Promise((resolve) => {
                console.log(`Convertendo canvas para blob para produto: ${product.ref}`);
                canvas.toBlob((blob) => {
                    if (blob) {
                        console.log(`Blob gerado com sucesso, tamanho: ${blob.size} bytes`);
                        // Simular upload para FTP e retornar URL
                        const fileName = `${product.ref || 'produto'}_${Date.now()}.jpg`;
                        const ftpUrl = `https://ftp.exemplo.com/images/${fileName}`;
                        
                        // Simular upload (em produção, aqui seria o upload real para FTP)
                        console.log(`Simulando upload para FTP: ${fileName}`);
                        
                        resolve({
                            url: ftpUrl,
                            fileName: fileName,
                            blob: blob
                        });
                    } else {
                        console.error(`Falha ao gerar blob para produto: ${product.ref}`);
                        resolve(null);
                    }
                }, 'image/jpeg', 0.8);
            });
            
        } catch (error) {
            console.error('Erro ao gerar imagem do produto:', error);
            return null;
        }
    }

    // Função para visualizar base64 no navegador (para teste)
    visualizeBase64(base64String, title = 'Imagem Base64') {
        if (!base64String) return;
        
        // Criar modal para visualizar
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        const img = document.createElement('img');
        img.src = base64String;
        img.style.cssText = `
            max-width: 80%;
            max-height: 80%;
            border: 2px solid white;
            border-radius: 8px;
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Fechar';
        closeBtn.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: red;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
        `;
        
        closeBtn.onclick = () => document.body.removeChild(modal);
        
        modal.appendChild(img);
        modal.appendChild(closeBtn);
        document.body.appendChild(modal);
        
        console.log('Base64 String:', base64String);
        console.log('Tamanho:', base64String.length, 'caracteres');
    }

    // Função para redimensionar e converter imagem para base64
    async imageToBase64(imageUrl, maxWidth = 250, maxHeight = 250, quality = 0.7) {
        try {
            if (!imageUrl) return null;
            
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            
            return new Promise((resolve, reject) => {
                const img = new Image();
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                img.onload = () => {
                    // Calcular novas dimensões mantendo proporção
                    let { width, height } = img;
                    
                    if (width > height) {
                        if (width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = (width * maxHeight) / height;
                            height = maxHeight;
                        }
                    }
                    
                    // Configurar canvas
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Desenhar imagem redimensionada
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Converter para base64 com qualidade reduzida
                    const base64 = canvas.toDataURL('image/jpeg', quality);
                    
                    // Verificar se o tamanho está dentro do limite
                    if (base64.length > 32000) {
                        // Se ainda estiver muito grande, reduzir mais a qualidade
                        const reducedQuality = Math.max(0.1, quality * 0.5);
                        const reducedBase64 = canvas.toDataURL('image/jpeg', reducedQuality);
                        resolve(reducedBase64);
                    } else {
                        resolve(base64);
                    }
                };
                
                img.onerror = () => {
                    console.warn('Erro ao carregar imagem:', imageUrl);
                    resolve(null);
                };
                
                img.src = URL.createObjectURL(blob);
            });
        } catch (error) {
            console.error('Erro ao converter imagem para base64:', error);
            return null;
        }
    }

    // Função para exportar produtos selecionados para Excel com imagens VISÍVEIS nas células
    async exportSelectedProductsWithImages(factoryData, fileName = null) {
        try {
            console.log('Iniciando exportação de produtos selecionados com imagens VISÍVEIS...');
            
            // Criar workbook com ExcelJS para inserir imagens nas células
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Produtos Selecionados');
            
            // Definir cabeçalhos
            const headers = [
                'FOTO', 'REF', 'NCM', 'DESCRIPTION', 'NAME', 'EN', 'IMPORT', 'REMARK', 'OBS',
                'CTNS', 'UNIT/CTN', 'QTY', 'UNIT', 'U.PRICE', 'AMOUNT', 'L', 'W', 'H', 'CBM',
                'CBM TOTAL', 'G.W', 'T.G.W', 'N.W', 'T.N.W', 'PESO UNITÁRIO(g)', 'FÁBRICA',
                'IMPORTAÇÃO', 'DATA IMPORTAÇÃO', 'STATUS PEDIDO', 'DATA SELEÇÃO'
            ];
            
            // Adicionar cabeçalhos
            worksheet.addRow(headers);
            
            // Estilizar cabeçalhos
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE6E6FA' }
            };
            
            // Configurar larguras das colunas
            const columnWidths = [
                20, 12, 15, 25, 20, 25, 15, 20, 20, 8, 10, 10, 8, 12, 15, 8, 8, 8, 10,
                12, 10, 12, 10, 12, 15, 20, 20, 15, 15, 15
            ];
            
            columnWidths.forEach((width, index) => {
                worksheet.getColumn(index + 1).width = width;
            });
            
            // Configurar altura das linhas para acomodar imagens
            worksheet.properties.defaultRowHeight = 150;
            
            let rowIndex = 2;
            
            for (const factory of factoryData) {
                for (const importData of factory.imports) {
                    for (const product of importData.selectedProducts) {
                        // Adicionar linha com dados
                        const row = worksheet.addRow([
                            '', // FOTO - será preenchida com imagem
                            product.ref || '',
                            product.ncm || '',
                            product.description || '',
                            product.name || '',
                            product.englishDescription || '',
                            product.import || '',
                            product.remark || '',
                            product.obs || '',
                            product.ctns || 0,
                            product.unitCtn || 0,
                            (product.ctns || 0) * (product.unitCtn || 1),
                            product.unit || '',
                            product.unitPrice || 0,
                            ((product.ctns || 0) * (product.unitCtn || 1)) * (product.unitPrice || 0),
                            product.length || 0,
                            product.width || 0,
                            product.height || 0,
                            product.cbm || 0,
                            product.cbmTotal || 0,
                            product.grossWeight || 0,
                            product.totalGrossWeight || 0,
                            product.netWeight || 0,
                            product.totalNetWeight || 0,
                            product.pesoUnitario || 0,
                            factory.factory.nomeFabrica || '',
                            importData.importName || `Importação #${importData.id}`,
                            this.formatDate(importData.datetime),
                            product.orderStatus || '',
                            this.formatDate(product.orderDate)
                        ]);
                        
                        // Configurar altura da linha para acomodar imagem
                        row.height = 150;
                        
                        // Processar imagem e inserir na célula
                        let imageBuffer = null;
                        
                        if (product.imageUrl) {
                            try {
                                console.log(`Carregando imagem original: ${product.imageUrl}`);
                                const response = await fetch(product.imageUrl);
                                const blob = await response.blob();
                                imageBuffer = await blob.arrayBuffer();
                                console.log(`Imagem original carregada: ${blob.size} bytes`);
                            } catch (error) {
                                console.warn('Erro ao carregar imagem original:', error);
                                // Gerar nova imagem
                                const generatedImage = await this.generateProductImage(product);
                                if (generatedImage && generatedImage.blob) {
                                    imageBuffer = await generatedImage.blob.arrayBuffer();
                                    console.log(`Imagem gerada carregada: ${generatedImage.blob.size} bytes`);
                                }
                            }
                        } else {
                            // Gerar nova imagem
                            console.log(`Gerando nova imagem para produto: ${product.ref}`);
                            const generatedImage = await this.generateProductImage(product);
                            if (generatedImage && generatedImage.blob) {
                                imageBuffer = await generatedImage.blob.arrayBuffer();
                                console.log(`Imagem gerada carregada: ${generatedImage.blob.size} bytes`);
                            }
                        }
                        
                        // Inserir imagem na célula FOTO (coluna A)
                        if (imageBuffer) {
                            try {
                                console.log(`Inserindo imagem na célula A${rowIndex}`);
                                const imageId = await workbook.addImage({
                                    buffer: imageBuffer,
                                    extension: 'jpeg'
                                });
                                
                                worksheet.addImage(imageId, {
                                    tl: { col: 0, row: rowIndex - 1 },
                                    br: { col: 0, row: rowIndex - 1 },
                                    editAs: 'oneCell'
                                });
                                
                                console.log(`Imagem inserida com sucesso na célula A${rowIndex}`);
                            } catch (error) {
                                console.error(`Erro ao inserir imagem na célula A${rowIndex}:`, error);
                            }
                        } else {
                            console.warn(`Nenhuma imagem para inserir na célula A${rowIndex}`);
                        }
                        
                        rowIndex++;
                    }
                }
            }
            
            // Gerar nome do arquivo
            const finalFileName = fileName || `produtos_selecionados_com_imagens_visiveis_${new Date().toISOString().split('T')[0]}.xlsx`;
            
            // Baixar arquivo
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = finalFileName;
            link.click();
            window.URL.revokeObjectURL(url);
            
            console.log(`Exportação com imagens visíveis concluída: ${rowIndex - 2} produtos exportados`);
            return {
                success: true,
                count: rowIndex - 2,
                fileName: finalFileName
            };
            
        } catch (error) {
            console.error('Erro ao exportar produtos com imagens:', error);
            throw error;
        }
    }

    // Função para exportar produtos selecionados para Excel
    async exportSelectedProducts(factoryData, fileName = null) {
        try {
            console.log('Iniciando exportação de produtos selecionados...');
            
            // Preparar dados para exportação
            const exportData = [];
            
            for (const factory of factoryData) {
                for (const importData of factory.imports) {
                    for (const product of importData.selectedProducts) {
                        // Converter imagem para base64 se existir, senão gerar nova imagem
                        let imageData = '';
                        if (product.imageUrl) {
                            const imageBase64 = await this.imageToBase64(product.imageUrl);
                            if (imageBase64) {
                                // Se a imagem foi convertida com sucesso, usar base64
                                imageData = imageBase64;
                                
                                // Visualizar a imagem base64 (para teste)
                                console.log(`Visualizando imagem original para produto: ${product.ref}`);
                                this.visualizeBase64(imageBase64, `Produto Original: ${product.ref}`);
                            } else {
                                // Se falhou, gerar nova imagem
                                console.log(`Gerando nova imagem para produto: ${product.ref}`);
                                const generatedImage = await this.generateProductImage(product);
                                if (generatedImage) {
                                    imageData = generatedImage;
                                    this.visualizeBase64(generatedImage, `Produto Gerado: ${product.ref}`);
                                }
                            }
                        } else {
                            // Se não tem imagem, gerar nova imagem
                            console.log(`Gerando nova imagem para produto sem imagem: ${product.ref}`);
                            const generatedImage = await this.generateProductImage(product);
                            if (generatedImage) {
                                imageData = generatedImage;
                                this.visualizeBase64(generatedImage, `Produto Gerado: ${product.ref}`);
                            }
                        }
                        
                        // Criar linha de dados seguindo a ordem especificada
                        const rowData = {
                            'FOTO': imageData, // Campo de imagem (nome do arquivo)
                            'REF': product.ref || '',
                            'NCM': product.ncm || '',
                            'DESCRIPTION': product.description || '',
                            'NAME': product.name || '',
                            'EN': product.englishDescription || '',
                            'IMPORT': product.import || '',
                            'REMARK': product.remark || '',
                            'OBS': product.obs || '',
                            'CTNS': product.ctns || 0,
                            'UNIT/CTN': product.unitCtn || 0,
                            'QTY': (product.ctns || 0) * (product.unitCtn || 1),
                            'UNIT': product.unit || '',
                            'U.PRICE': product.unitPrice || 0,
                            'AMOUNT': ((product.ctns || 0) * (product.unitCtn || 1)) * (product.unitPrice || 0),
                            'L': product.length || 0,
                            'W': product.width || 0,
                            'H': product.height || 0,
                            'CBM': product.cbm || 0,
                            'CBM TOTAL': product.cbmTotal || 0,
                            'G.W': product.grossWeight || 0,
                            'T.G.W': product.totalGrossWeight || 0,
                            'N.W': product.netWeight || 0,
                            'T.N.W': product.totalNetWeight || 0,
                            'PESO UNITÁRIO(g)': product.pesoUnitario || 0,
                            'FÁBRICA': factory.factory.nomeFabrica || '',
                            'IMPORTAÇÃO': importData.importName || `Importação #${importData.id}`,
                            'DATA IMPORTAÇÃO': this.formatDate(importData.datetime),
                            'STATUS PEDIDO': product.selectedForOrder ? 'SELECIONADO' : 'PENDENTE',
                            'DATA SELEÇÃO': this.formatDate(product.orderDate)
                        };
                        
                        exportData.push(rowData);
                    }
                }
            }
            
            if (exportData.length === 0) {
                throw new Error('Nenhum produto selecionado para exportar');
            }
            
            // Criar workbook
            const workbook = XLSX.utils.book_new();
            
            // Criar worksheet
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            
            // Configurar larguras das colunas
            const columnWidths = [
                { wch: 20 }, // FOTO (250px)
                { wch: 12 }, // REF
                { wch: 15 }, // NCM
                { wch: 25 }, // DESCRIPTION
                { wch: 20 }, // NAME
                { wch: 25 }, // EN
                { wch: 15 }, // IMPORT
                { wch: 20 }, // REMARK
                { wch: 20 }, // OBS
                { wch: 8 },  // CTNS
                { wch: 10 }, // UNIT/CTN
                { wch: 10 }, // QTY
                { wch: 8 },  // UNIT
                { wch: 12 }, // U.PRICE
                { wch: 15 }, // AMOUNT
                { wch: 8 },  // L
                { wch: 8 },  // W
                { wch: 8 },  // H
                { wch: 10 }, // CBM
                { wch: 12 }, // CBM TOTAL
                { wch: 10 }, // G.W
                { wch: 12 }, // T.G.W
                { wch: 10 }, // N.W
                { wch: 12 }, // T.N.W
                { wch: 15 }, // PESO UNITÁRIO
                { wch: 20 }, // FÁBRICA
                { wch: 20 }, // IMPORTAÇÃO
                { wch: 15 }, // DATA IMPORTAÇÃO
                { wch: 15 }, // STATUS PEDIDO
                { wch: 15 }  // DATA SELEÇÃO
            ];
            
            worksheet['!cols'] = columnWidths;
            
            // Adicionar worksheet ao workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos Selecionados');
            
            // Gerar nome do arquivo
            const finalFileName = fileName || `${this.defaultFileName}_${new Date().toISOString().split('T')[0]}.xlsx`;
            
            // Baixar arquivo
            XLSX.writeFile(workbook, finalFileName);
            
            console.log(`Exportação concluída: ${exportData.length} produtos exportados`);
            return {
                success: true,
                count: exportData.length,
                fileName: finalFileName
            };
            
        } catch (error) {
            console.error('Erro na exportação:', error);
            throw error;
        }
    }

    // Função para exportar apenas uma fábrica específica
    async exportFactoryProducts(factoryData, fileName = null) {
        try {
            console.log(`Iniciando exportação da fábrica: ${factoryData.factory.nomeFabrica}`);
            
            const exportData = [];
            
            for (const importData of factoryData.imports) {
                for (const product of importData.selectedProducts) {
                    // Converter imagem para base64 se existir, senão gerar nova imagem
                    let imageData = '';
                    if (product.imageUrl) {
                        const imageBase64 = await this.imageToBase64(product.imageUrl);
                        if (imageBase64) {
                            // Se a imagem foi convertida com sucesso, usar base64
                            imageData = imageBase64;
                            
                            // Visualizar a imagem base64 (para teste)
                            console.log(`Visualizando imagem original para produto: ${product.ref}`);
                            this.visualizeBase64(imageBase64, `Produto Original: ${product.ref}`);
                        } else {
                            // Se falhou, gerar nova imagem
                            console.log(`Gerando nova imagem para produto: ${product.ref}`);
                            const generatedImage = await this.generateProductImage(product);
                            if (generatedImage) {
                                imageData = generatedImage;
                                this.visualizeBase64(generatedImage, `Produto Gerado: ${product.ref}`);
                            }
                        }
                    } else {
                        // Se não tem imagem, gerar nova imagem
                        console.log(`Gerando nova imagem para produto sem imagem: ${product.ref}`);
                        const generatedImage = await this.generateProductImage(product);
                        if (generatedImage) {
                            imageData = generatedImage;
                            this.visualizeBase64(generatedImage, `Produto Gerado: ${product.ref}`);
                        }
                    }
                    
                    // Criar linha de dados seguindo a ordem especificada
                    const rowData = {
                        'FOTO': imageData, // Campo de imagem (base64 ou nome do arquivo)
                        'REF': product.ref || '',
                        'NCM': product.ncm || '',
                        'DESCRIPTION': product.description || '',
                        'NAME': product.name || '',
                        'EN': product.englishDescription || '',
                        'IMPORT': product.import || '',
                        'REMARK': product.remark || '',
                        'OBS': product.obs || '',
                        'CTNS': product.ctns || 0,
                        'UNIT/CTN': product.unitCtn || 0,
                        'QTY': (product.ctns || 0) * (product.unitCtn || 1),
                        'UNIT': product.unit || '',
                        'U.PRICE': product.unitPrice || 0,
                        'AMOUNT': ((product.ctns || 0) * (product.unitCtn || 1)) * (product.unitPrice || 0),
                        'L': product.length || 0,
                        'W': product.width || 0,
                        'H': product.height || 0,
                        'CBM': product.cbm || 0,
                        'CBM TOTAL': product.cbmTotal || 0,
                        'G.W': product.grossWeight || 0,
                        'T.G.W': product.totalGrossWeight || 0,
                        'N.W': product.netWeight || 0,
                        'T.N.W': product.totalNetWeight || 0,
                        'PESO UNITÁRIO(g)': product.pesoUnitario || 0,
                        'IMPORTAÇÃO': importData.importName || `Importação #${importData.id}`,
                        'DATA IMPORTAÇÃO': importData.datetime ? importData.datetime.toLocaleDateString('pt-BR') : '',
                        'STATUS PEDIDO': product.selectedForOrder ? 'SELECIONADO' : 'PENDENTE',
                        'DATA SELEÇÃO': product.orderDate ? new Date(product.orderDate).toLocaleDateString('pt-BR') : ''
                    };
                    
                    exportData.push(rowData);
                }
            }
            
            if (exportData.length === 0) {
                throw new Error('Nenhum produto selecionado nesta fábrica para exportar');
            }
            
            // Criar workbook
            const workbook = XLSX.utils.book_new();
            
            // Criar worksheet
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            
            // Configurar larguras das colunas
            const columnWidths = [
                { wch: 20 }, // FOTO (250px)
                { wch: 12 }, // REF
                { wch: 15 }, // NCM
                { wch: 25 }, // DESCRIPTION
                { wch: 20 }, // NAME
                { wch: 25 }, // EN
                { wch: 15 }, // IMPORT
                { wch: 20 }, // REMARK
                { wch: 20 }, // OBS
                { wch: 8 },  // CTNS
                { wch: 10 }, // UNIT/CTN
                { wch: 10 }, // QTY
                { wch: 8 },  // UNIT
                { wch: 12 }, // U.PRICE
                { wch: 15 }, // AMOUNT
                { wch: 8 },  // L
                { wch: 8 },  // W
                { wch: 8 },  // H
                { wch: 10 }, // CBM
                { wch: 12 }, // CBM TOTAL
                { wch: 10 }, // G.W
                { wch: 12 }, // T.G.W
                { wch: 10 }, // N.W
                { wch: 12 }, // T.N.W
                { wch: 15 }, // PESO UNITÁRIO
                { wch: 20 }, // IMPORTAÇÃO
                { wch: 15 }, // DATA IMPORTAÇÃO
                { wch: 15 }, // STATUS PEDIDO
                { wch: 15 }  // DATA SELEÇÃO
            ];
            
            worksheet['!cols'] = columnWidths;
            
            // Adicionar worksheet ao workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos Selecionados');
            
            // Gerar nome do arquivo
            const factoryName = factoryData.factory.nomeFabrica.replace(/[^a-zA-Z0-9]/g, '_');
            const finalFileName = fileName || `${factoryName}_produtos_selecionados_${new Date().toISOString().split('T')[0]}.xlsx`;
            
            // Baixar arquivo
            XLSX.writeFile(workbook, finalFileName);
            
            console.log(`Exportação da fábrica concluída: ${exportData.length} produtos exportados`);
            return {
                success: true,
                count: exportData.length,
                fileName: finalFileName
            };
            
        } catch (error) {
            console.error('Erro na exportação da fábrica:', error);
            throw error;
        }
    }

    // Função para exportar produtos selecionados para Excel (versão com URLs das imagens)
    async exportSelectedProductsWithUrls(factoryData, fileName = null) {
        try {
            console.log('Iniciando exportação de produtos selecionados (com URLs)...');
            
            // Preparar dados para exportação
            const exportData = [];
            
            for (const factory of factoryData) {
                for (const importData of factory.imports) {
                    for (const product of importData.selectedProducts) {
                        // Usar apenas URL da imagem em vez de base64
                        const imageUrl = product.imageUrl || '';
                        
                        // Criar linha de dados seguindo a ordem especificada
                        const rowData = {
                            'FOTO': imageUrl, // Campo de imagem (URL)
                            'REF': product.ref || '',
                            'NCM': product.ncm || '',
                            'DESCRIPTION': product.description || '',
                            'NAME': product.name || '',
                            'EN': product.englishDescription || '',
                            'IMPORT': product.import || '',
                            'REMARK': product.remark || '',
                            'OBS': product.obs || '',
                            'CTNS': product.ctns || 0,
                            'UNIT/CTN': product.unitCtn || 0,
                            'QTY': (product.ctns || 0) * (product.unitCtn || 1),
                            'UNIT': product.unit || '',
                            'U.PRICE': product.unitPrice || 0,
                            'AMOUNT': ((product.ctns || 0) * (product.unitCtn || 1)) * (product.unitPrice || 0),
                            'L': product.length || 0,
                            'W': product.width || 0,
                            'H': product.height || 0,
                            'CBM': product.cbm || 0,
                            'CBM TOTAL': product.cbmTotal || 0,
                            'G.W': product.grossWeight || 0,
                            'T.G.W': product.totalGrossWeight || 0,
                            'N.W': product.netWeight || 0,
                            'T.N.W': product.totalNetWeight || 0,
                            'PESO UNITÁRIO(g)': product.pesoUnitario || 0,
                            'FÁBRICA': factory.factory.nomeFabrica || '',
                            'IMPORTAÇÃO': importData.importName || `Importação #${importData.id}`,
                            'DATA IMPORTAÇÃO': this.formatDate(importData.datetime),
                            'STATUS PEDIDO': product.selectedForOrder ? 'SELECIONADO' : 'PENDENTE',
                            'DATA SELEÇÃO': this.formatDate(product.orderDate)
                        };
                        
                        exportData.push(rowData);
                    }
                }
            }
            
            if (exportData.length === 0) {
                throw new Error('Nenhum produto selecionado para exportar');
            }
            
            // Criar workbook
            const workbook = XLSX.utils.book_new();
            
            // Criar worksheet
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            
            // Configurar larguras das colunas
            const columnWidths = [
                { wch: 30 }, // FOTO (URL)
                { wch: 12 }, // REF
                { wch: 15 }, // NCM
                { wch: 25 }, // DESCRIPTION
                { wch: 20 }, // NAME
                { wch: 25 }, // EN
                { wch: 15 }, // IMPORT
                { wch: 20 }, // REMARK
                { wch: 20 }, // OBS
                { wch: 8 },  // CTNS
                { wch: 10 }, // UNIT/CTN
                { wch: 10 }, // QTY
                { wch: 8 },  // UNIT
                { wch: 12 }, // U.PRICE
                { wch: 15 }, // AMOUNT
                { wch: 8 },  // L
                { wch: 8 },  // W
                { wch: 8 },  // H
                { wch: 10 }, // CBM
                { wch: 12 }, // CBM TOTAL
                { wch: 10 }, // G.W
                { wch: 12 }, // T.G.W
                { wch: 10 }, // N.W
                { wch: 12 }, // T.N.W
                { wch: 15 }, // PESO UNITÁRIO
                { wch: 20 }, // FÁBRICA
                { wch: 20 }, // IMPORTAÇÃO
                { wch: 15 }, // DATA IMPORTAÇÃO
                { wch: 15 }, // STATUS PEDIDO
                { wch: 15 }  // DATA SELEÇÃO
            ];
            
            worksheet['!cols'] = columnWidths;
            
            // Adicionar worksheet ao workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos Selecionados');
            
            // Gerar nome do arquivo
            const finalFileName = fileName || `${this.defaultFileName}_urls_${new Date().toISOString().split('T')[0]}.xlsx`;
            
            // Baixar arquivo
            XLSX.writeFile(workbook, finalFileName);
            
            console.log(`Exportação concluída: ${exportData.length} produtos exportados`);
            return {
                success: true,
                count: exportData.length,
                fileName: finalFileName
            };
            
        } catch (error) {
            console.error('Erro na exportação:', error);
            throw error;
        }
    }
}

export default new ExcelExportService();
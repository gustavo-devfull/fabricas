import * as XLSX from 'xlsx';
import ftpService from './ftpService';

class ExcelImageImportService {
    constructor() {
        this.supportedFormats = ['.xlsx', '.xls'];
        this.imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
    }

    // Método principal para importar imagens de uma planilha Excel
    async importImagesFromExcel(file, options = {}) {
        try {
            console.log('Iniciando importação de imagens do Excel...');
            
            // Ler a planilha Excel
            const workbook = await this.readExcelFile(file);
            
            // Encontrar a coluna REF
            const refColumn = this.findRefColumn(workbook);
            if (!refColumn) {
                throw new Error('Coluna REF não encontrada na planilha');
            }
            
            console.log(`Coluna REF encontrada: ${refColumn}`);
            
            // Extrair dados da planilha
            const sheetData = this.extractSheetData(workbook, refColumn);
            
            // Processar cada linha e extrair imagens
            const results = await this.processRows(sheetData, options);
            
            console.log(`Importação concluída: ${results.success} sucessos, ${results.errors} erros`);
            return results;
            
        } catch (error) {
            console.error('Erro na importação de imagens:', error);
            throw error;
        }
    }

    // Ler arquivo Excel
    async readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    resolve(workbook);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }

    // Encontrar a coluna REF na planilha
    findRefColumn(workbook) {
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Converter para JSON para facilitar a busca
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Procurar pela palavra "REF" nas primeiras 3 linhas (caso não esteja na primeira)
        for (let rowIndex = 0; rowIndex < Math.min(3, jsonData.length); rowIndex++) {
            const headerRow = jsonData[rowIndex];
            if (!headerRow) continue;
            
            for (let i = 0; i < headerRow.length; i++) {
                const cellValue = String(headerRow[i] || '').toUpperCase().trim();
                
                // Buscar por diferentes variações de REF
                if (cellValue === 'REF' || 
                    cellValue === 'REFERÊNCIA' || 
                    cellValue === 'REFERENCIA' ||
                    cellValue === 'CÓDIGO' ||
                    cellValue === 'CODIGO' ||
                    cellValue === 'SKU' ||
                    cellValue === 'PRODUTO' ||
                    cellValue.includes('REF') ||
                    cellValue.includes('REFERÊNCIA') ||
                    cellValue.includes('REFERENCIA')) {
                    console.log(`Coluna REF encontrada na linha ${rowIndex + 1}, coluna ${i + 1}: "${cellValue}"`);
                    return i; // Retorna o índice da coluna
                }
            }
        }
        
        // Se não encontrou, listar todas as colunas disponíveis para debug
        console.log('Colunas disponíveis na planilha:');
        for (let rowIndex = 0; rowIndex < Math.min(3, jsonData.length); rowIndex++) {
            const headerRow = jsonData[rowIndex];
            if (headerRow) {
                console.log(`Linha ${rowIndex + 1}:`, headerRow.map((cell, index) => `${index + 1}: "${cell}"`).join(', '));
            }
        }
        
        return null;
    }

    // Extrair dados da planilha
    extractSheetData(workbook, refColumnIndex) {
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const data = [];
        
        // Pular as primeiras linhas (cabeçalhos) e processar as demais
        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            
            // Verificar se a linha tem dados suficientes
            if (!row || row.length <= refColumnIndex) continue;
            
            const ref = row[refColumnIndex];
            
            // Verificar se a REF é válida (não vazia e não é cabeçalho)
            if (ref && String(ref).trim() && !String(ref).toUpperCase().includes('REF')) {
                const refValue = String(ref).trim();
                
                // Verificar se não é um valor numérico muito pequeno (provavelmente índice)
                if (!isNaN(refValue) && parseFloat(refValue) < 10) continue;
                
                data.push({
                    rowIndex: i,
                    ref: refValue,
                    rowData: row
                });
            }
        }
        
        console.log(`Extraídos ${data.length} registros com REF válida`);
        return data;
    }

    // Processar cada linha da planilha
    async processRows(sheetData, options) {
        const results = {
            success: 0,
            errors: 0,
            processed: [],
            errorsList: []
        };

        for (const rowData of sheetData) {
            try {
                console.log(`Processando REF: ${rowData.ref}`);
                
                // Buscar imagem na linha abaixo do REF
                const imageData = await this.findImageInRow(rowData);
                
                if (imageData) {
                    // Gerar nome do arquivo baseado na REF
                    const fileName = ftpService.generateImageFileName(rowData.ref);
                    
                    // Verificar se a imagem já existe
                    const exists = await ftpService.checkImageExists(fileName);
                    
                    if (!exists || options.overwrite) {
                        // Upload da imagem para FTP
                        const ftpUrl = await ftpService.uploadImage(imageData.blob, fileName);
                        
                        results.processed.push({
                            ref: rowData.ref,
                            fileName: fileName,
                            ftpUrl: ftpUrl,
                            imageUrl: ftpService.getImageUrl(fileName)
                        });
                        
                        results.success++;
                        console.log(`Imagem processada com sucesso: ${fileName}`);
                    } else {
                        console.log(`Imagem já existe: ${fileName}`);
                        results.processed.push({
                            ref: rowData.ref,
                            fileName: fileName,
                            ftpUrl: ftpService.getImageUrl(fileName),
                            imageUrl: ftpService.getImageUrl(fileName),
                            skipped: true
                        });
                    }
                } else {
                    console.log(`Nenhuma imagem encontrada para REF: ${rowData.ref}`);
                    results.errorsList.push({
                        ref: rowData.ref,
                        error: 'Nenhuma imagem encontrada'
                    });
                    results.errors++;
                }
                
            } catch (error) {
                console.error(`Erro ao processar REF ${rowData.ref}:`, error);
                results.errorsList.push({
                    ref: rowData.ref,
                    error: error.message
                });
                results.errors++;
            }
        }

        return results;
    }

    // Buscar imagem na linha (simulação - em uma implementação real, você precisaria de uma biblioteca específica)
    async findImageInRow(rowData) {
        try {
            // Esta é uma simulação - em uma implementação real, você precisaria
            // de uma biblioteca que possa extrair imagens incorporadas do Excel
            // como 'exceljs' ou similar
            
            console.log(`Buscando imagem para REF: ${rowData.ref}`);
            
            // Simular busca de imagem (substitua por implementação real)
            const hasImage = Math.random() > 0.5; // 50% de chance de ter imagem
            
            if (hasImage) {
                // Criar uma imagem simulada baseada na REF
                const canvas = document.createElement('canvas');
                canvas.width = 200;
                canvas.height = 200;
                const ctx = canvas.getContext('2d');
                
                // Desenhar uma imagem simulada
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(0, 0, 200, 200);
                ctx.fillStyle = '#333';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`REF: ${rowData.ref}`, 100, 100);
                
                // Converter para blob
                return new Promise((resolve) => {
                    canvas.toBlob((blob) => {
                        resolve({ blob, type: 'image/png' });
                    }, 'image/png');
                });
            }
            
            return null;
            
        } catch (error) {
            console.error('Erro ao buscar imagem:', error);
            return null;
        }
    }

    // Método para validar arquivo Excel
    validateFile(file) {
        if (!file) {
            throw new Error('Nenhum arquivo selecionado');
        }

        const fileName = file.name.toLowerCase();
        const isValidFormat = this.supportedFormats.some(format => 
            fileName.endsWith(format)
        );

        if (!isValidFormat) {
            throw new Error(`Formato não suportado. Use: ${this.supportedFormats.join(', ')}`);
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB
            throw new Error('Arquivo muito grande. Máximo 10MB');
        }

        return true;
    }

    // Método para obter estatísticas da importação
    getImportStats(results) {
        return {
            total: results.success + results.errors,
            success: results.success,
            errors: results.errors,
            successRate: results.success + results.errors > 0 
                ? (results.success / (results.success + results.errors)) * 100 
                : 0
        };
    }

    // Método para exportar resultados para CSV
    exportResultsToCSV(results) {
        const csvData = results.processed.map(item => ({
            REF: item.ref,
            'Nome do Arquivo': item.fileName,
            'URL FTP': item.ftpUrl,
            'Status': item.skipped ? 'Pulado' : 'Processado'
        }));

        const csvContent = this.convertToCSV(csvData);
        this.downloadCSV(csvContent, 'resultado_importacao_imagens.csv');
    }

    // Converter dados para CSV
    convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                return typeof value === 'string' && value.includes(',') 
                    ? `"${value}"` 
                    : value;
            });
            csvRows.push(values.join(','));
        });
        
        return csvRows.join('\n');
    }

    // Download CSV
    downloadCSV(csvContent, fileName) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

export default new ExcelImageImportService();

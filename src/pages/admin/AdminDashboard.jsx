import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Box, TextField, MenuItem, Chip, Typography, Button as MuiButton } from '@mui/material';
import { FilterList, Clear } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { 
    getAllFactories, 
    addFactory, 
    updateFactory, 
    deleteFactory,
    getQuotesByFactory,
    deleteQuote,
    addQuote,
    getQuoteImportsByFactory,
    updateQuotesFromImport,
    addMultipleQuotes
} from '../../firebase/firestoreService';
import { updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import Alert from '../../components/Alert';
import FactoryForm from '../../components/dashboard/FactoryForm';
import FactoryCard from '../../components/dashboard/FactoryCard';
import QuotesSection from '../../components/dashboard/QuotesSection';
import ImageImportModal from '../../components/dashboard/ImageImportModal';
import excelExportService from '../../services/excelExportService';

const AdminDashboard = () => {
    const [searchParams] = useSearchParams();
    const [factories, setFactories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingFactory, setEditingFactory] = useState(null);
    const [factoryForm, setFactoryForm] = useState({
        name: '',
        localizacao: '',
        segmento: '',
        nomeContato: '',
        emailContato: '',
        telefoneContato: '',
        wechatContato: '',
        status: 'ativa'
    });
    const [quotes, setQuotes] = useState([]);
    const [allQuotes, setAllQuotes] = useState([]); // Array com todas as cotações da fábrica
    const [selectedFactoryForQuotes, setSelectedFactoryForQuotes] = useState('');
    const [showQuotes, setShowQuotes] = useState(false);
    const [quoteImports, setQuoteImports] = useState([]);
    const [editingImport, setEditingImport] = useState(null);
    const [editingQuotes, setEditingQuotes] = useState([]);
    const [selectedQuotes, setSelectedQuotes] = useState([]);
    const [showMultiSelect, setShowMultiSelect] = useState(false);
    const [selectedForOrder, setSelectedForOrder] = useState([]);
    const [selectedImportId, setSelectedImportId] = useState(null);
    const [alert, setAlert] = useState({ show: false, variant: 'info', message: '', title: '' });
    
    // Estados para importação de imagens
    const [showImageImportModal, setShowImageImportModal] = useState(false);
    
    // Estados para controlar exibição de cotações exportadas
    const [showExportedQuotes, setShowExportedQuotes] = useState(false);
    const [exportedQuotesVisible, setExportedQuotesVisible] = useState(false);
    
    // Estados para filtros
    const [filterCity, setFilterCity] = useState('');
    const [filterSegment, setFilterSegment] = useState('');
    const [filteredFactories, setFilteredFactories] = useState([]);

    const showAlert = useCallback((variant, title, message, actions = []) => {
        setAlert({ show: true, variant, title, message, actions });
    }, []);

    // Função para aplicar filtros
    const applyFilters = useCallback(() => {
        let filtered = factories;
        
        if (filterCity) {
            filtered = filtered.filter(factory => 
                factory.localizacao?.toLowerCase().includes(filterCity.toLowerCase())
            );
        }
        
        if (filterSegment) {
            filtered = filtered.filter(factory => 
                factory.segmento?.toLowerCase().includes(filterSegment.toLowerCase())
            );
        }
        
        setFilteredFactories(filtered);
    }, [factories, filterCity, filterSegment]);

    // Aplicar filtros quando factories ou filtros mudarem
    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    // Função para limpar filtros
    const clearFilters = () => {
        setFilterCity('');
        setFilterSegment('');
    };

    // Obter opções únicas para os filtros
    const getUniqueCities = () => {
        const cities = factories.map(factory => factory.localizacao).filter(Boolean);
        return [...new Set(cities)].sort();
    };

    const getUniqueSegments = () => {
        const segments = factories.map(factory => factory.segmento).filter(Boolean);
        return [...new Set(segments)].sort();
    };

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
        
        // Verificar se há uma fábrica pré-selecionada na URL
        const factoryId = searchParams.get('factory');
        if (factoryId) {
            console.log('🏭 Fábrica detectada na URL:', factoryId);
            // Aguardar um pouco para garantir que as fábricas foram carregadas
            setTimeout(() => {
                loadQuotes(factoryId);
            }, 500);
        }
    }, [loadFactories, searchParams]);

    // Função para alternar a exibição de cotações exportadas
    const toggleExportedQuotes = () => {
        setShowExportedQuotes(!showExportedQuotes);
        setExportedQuotesVisible(!exportedQuotesVisible);
    };

    // Recarregar cotações quando o toggle de cotações exportadas mudar
    useEffect(() => {
        if (selectedFactoryForQuotes && allQuotes.length > 0) {
            // Recarregar apenas os dados filtrados, não fazer nova busca
            const filteredQuotes = showExportedQuotes ? allQuotes : allQuotes.filter(quote => !quote.exported);
            setQuotes(filteredQuotes);
        }
    }, [showExportedQuotes, allQuotes]);

    const handleAddFactory = async (e) => {
        e.preventDefault();
        try {
            await addFactory(factoryForm);
            setFactoryForm({
                name: '',
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
        
        // Scroll automático para o formulário de edição após um pequeno delay
        setTimeout(() => {
            const factoryFormCard = document.getElementById('factory-form-card');
            if (factoryFormCard) {
                console.log('✅ Scroll automático para formulário de edição de fábrica');
                factoryFormCard.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start',
                    inline: 'nearest'
                });
            } else {
                console.log('❌ Formulário de fábrica não encontrado para scroll');
            }
        }, 100); // Pequeno delay para garantir que o componente foi renderizado
    };

    const handleUpdateFactory = async (e) => {
        e.preventDefault();
        try {
            await updateFactory(editingFactory.id, factoryForm);
            setEditingFactory(null);
            setFactoryForm({
                name: '',
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
            name: '',
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
            console.log('📥 Carregando cotações para factoryId:', factoryId, typeof factoryId);
            
            // Validar se o factoryId é válido
            if (!factoryId) {
                throw new Error('Factory ID é obrigatório');
            }
            
            // Verificar se o Firebase está conectado
            if (!db) {
                throw new Error('Firebase não está inicializado');
            }
            
            console.log('🔄 Iniciando busca Firebase para factoryId:', factoryId);
            const quotesData = await getQuotesByFactory(factoryId);
            console.log('✅ Cotações Firebase carregadas:', quotesData?.length || 0, 'itens');
            
            const importsData = await getQuoteImportsByFactory(factoryId);
            console.log('✅ Importações Firebase carregadas:', importsData?.length || 0, 'items');
            
            console.log('📊 Dados brutos das cotações:', quotesData);
            console.log('📊 Dados das importações:', importsData);
            
            // Verificar quais cotações já estão selecionadas para pedido
            const selectedQuotesForOrder = quotesData
                .filter(quote => quote.selectedForOrder === true)
                .map(quote => quote.id);
            
            // Log detalhado dos produtos selecionados e seus valores
            const selectedQuotesDetailed = quotesData.filter(quote => quote.selectedForOrder === true);
            console.log('💰 Produtos selecionados para pedido:', selectedQuotesDetailed.map(q => ({
                ref: q.ref,
                amount: q.amount,
                ctns: q.ctns,
                unitPrice: q.unitPrice,
                calculatedAmount: (q.ctns || 0) * (q.unitCtn || 1) * (q.unitPrice || 0)
            })));
            
            const totalSelectedAmount = selectedQuotesDetailed.reduce((sum, q) => {
                const amount = q.amount || ((q.ctns || 0) * (q.unitCtn || 1) * (q.unitPrice || 0));
                return sum + amount;
            }, 0);
            console.log('💵 Valor total dos produtos selecionados:', totalSelectedAmount);
            
            console.log('🎯 Cotações carregadas:', quotesData.length);
            console.log('✅ Cotações já selecionadas para pedido:', selectedQuotesForOrder);
            
            // Filtrar cotações exportadas se necessário
            const filteredQuotes = showExportedQuotes ? quotesData : quotesData.filter(quote => !quote.exported);
            
            setQuotes(filteredQuotes);
            setAllQuotes(quotesData); // Armazenar todas as cotações
            setQuoteImports(importsData);
            setSelectedFactoryForQuotes(factoryId);
            setSelectedForOrder(selectedQuotesForOrder); // Inicializar com cotações já selecionadas
            setShowQuotes(true);
            
            // Resetar estados relacionados quando carregar novas cotações
            setSelectedImportId(null);
            setSelectedQuotes([]);
            setShowMultiSelect(false);
            setEditingImport(null);
            setEditingQuotes([]);
            
            console.log('🎉 Estados atualizados com sucesso');
            
            // Scroll automático para a seção de cotações após um pequeno delay
            setTimeout(() => {
                // Tentar encontrar o título "Cotações" na página
                const quotesHeader = document.querySelector('h5');
                if (quotesHeader && quotesHeader.textContent.includes('Cotações')) {
                    quotesHeader.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                } else {
                    // Fallback: procurar por um elemento que contenha "Cotações"
                    const quotesElements = document.querySelectorAll('*');
                    for (let element of quotesElements) {
                        if (element.textContent && element.textContent.includes('Cotações') && element.tagName === 'H5') {
                            element.scrollIntoView({ 
                                behavior: 'smooth',
                                block: 'start'
                            });
                            break;
                        }
                    }
                }
            }, 150);
        } catch (err) {
            console.error('❌ Erro detalhado ao carregar cotações:', {
                factoryId: factoryId,
                error: err,
                message: err.message,
                stack: err.stack,
                name: err.name
            });
            
            // Exibir erro mais específico
            let errorMessage = 'Erro ao carregar cotações';
            if (err.message) {
                errorMessage = `Erro: ${err.message}`;
            } else if (err.code) {
                errorMessage = `Erro Firebase ${err.code}: ${err.message}`;
            }
            
            showAlert('error', 'Erro ao carregar cotações', errorMessage);
            
            // Resetar estados em caso de erro
            setQuotes([]);
            setAllQuotes([]);
            setQuoteImports([]);
            setSelectedFactoryForQuotes('');
            setShowQuotes(false);
            setSelectedForOrder([]);
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

    const handleDuplicateQuote = async (quoteToDuplicate) => {
        try {
            console.log('🔄 Duplicando cotação:', quoteToDuplicate.ref || quoteToDuplicate.description);
            
            // Criar cópia da cotação removendo campos únicos
            const duplicateQuoteData = {
                ...quoteToDuplicate,
                ref: (quoteToDuplicate.ref || '') + ' - CÓPIA',
                description: (quoteToDuplicate.description || '') + ' (Cópia)',
                selectedForOrder: false, // Nova cotação não deve estar selecionada
                orderStatus: 'pending', // Status padrão
                orderDate: null, // Sem data de pedido
                createdAt: new Date(), // Nova data de criação
                updatedAt: new Date()
            };
            
            // Remover campos que não devem ser duplicados
            delete duplicateQuoteData.id;
            
            console.log('📋 Dados da cotação duplicada:', duplicateQuoteData);
            
            // Adicionar nova cotação ao Firebase
            const quoteId = await addQuote(duplicateQuoteData);
            console.log('✅ Nova cotação criada com ID:', quoteId);
            
            // Recarregar cotações para mostrar a nova
            loadQuotes(selectedFactoryForQuotes);
            
            showAlert('success', 'Sucesso!', 'Cotação duplicada com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao duplicar cotação:', error);
            showAlert('error', 'Erro!', 'Erro ao duplicar cotação: ' + error.message);
        }
    };

    const handleCloseQuotes = () => {
        console.log('🚪 Fechando seção de cotações...');
        setShowQuotes(false);
        setQuotes([]);
        setAllQuotes([]);
        setQuoteImports([]);
        setSelectedFactoryForQuotes('');
        setEditingImport(null);
        setEditingQuotes([]);
        setSelectedQuotes([]);
        setShowMultiSelect(false);
        setSelectedImportId(null);
        setSelectedForOrder([]); // Resetar lista de produtos selecionados para pedido
        console.log('✅ Estados resetados');
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
        
        // Recalcular quantidade se CTNS ou UNIT/CTN mudou
        if (field === 'ctns' || field === 'unitCtn') {
            const ctns = field === 'ctns' ? value : updatedQuotes[quoteIndex].ctns;
            const unitCtn = field === 'unitCtn' ? value : updatedQuotes[quoteIndex].unitCtn;
            const qty = (ctns || 0) * (unitCtn || 1);
            updatedQuotes[quoteIndex].qty = qty;
            
            // Recalcular amount se preço unitário existe
            const unitPrice = updatedQuotes[quoteIndex].unitPrice || 0;
            updatedQuotes[quoteIndex].amount = qty * unitPrice;
        }
        
        // Recalcular preço total se quantidade ou preço unitário mudou
        if (field === 'qty' || field === 'unitPrice') {
            const quantidade = field === 'qty' ? value : updatedQuotes[quoteIndex].qty;
            const precoUnitario = field === 'unitPrice' ? value : updatedQuotes[quoteIndex].unitPrice;
            updatedQuotes[quoteIndex].amount = quantidade * precoUnitario;
        }
        
        // Recalcular CBM Total se CBM mudou
        if (field === 'cbm') {
            const cbm = value || 0;
            const ctns = updatedQuotes[quoteIndex].ctns || 0;
            updatedQuotes[quoteIndex].cbmTotal = cbm * ctns;
        }
        
        // Recalcular Total Gross Weight se Gross Weight mudou
        if (field === 'grossWeight') {
            const grossWeight = value || 0;
            const ctns = updatedQuotes[quoteIndex].ctns || 0;
            updatedQuotes[quoteIndex].totalGrossWeight = grossWeight * ctns;
        }
        
        // Recalcular Total Net Weight se Net Weight mudou
        if (field === 'netWeight') {
            const netWeight = value || 0;
            const ctns = updatedQuotes[quoteIndex].ctns || 0;
            updatedQuotes[quoteIndex].totalNetWeight = netWeight * ctns;
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

    // Função para exportar cotações selecionadas
    const handleExportQuotes = async (selectedIds) => {
        try {
            console.log('🚀 Iniciando exportação de cotações:', selectedIds);
            
            // Filtrar cotações selecionadas
            const selectedQuotesData = allQuotes.filter(quote => selectedIds.includes(quote.id));
            
            if (selectedQuotesData.length === 0) {
                showAlert('warning', 'Exportação', 'Nenhuma cotação selecionada para exportar.');
                return;
            }
            
            console.log('📊 Cotações selecionadas para exportação:', selectedQuotesData.length);
            
            // Encontrar informações da fábrica atual
            const currentFactory = factories.find(f => f.id === selectedFactoryForQuotes);
            if (!currentFactory) {
                showAlert('error', 'Erro!', 'Fábrica não encontrada para exportação.');
                return;
            }
            
            // Preparar dados para exportação seguindo o formato esperado pelo serviço
            const factoryExportData = {
                factory: currentFactory,
                imports: [{
                    id: selectedImportId || 'Exportacao_' + Date.now(),
                    importName: selectedImportId ? `Importação ${selectedImportId}` : 'Exportação',
                    datetime: new Date(),
                    selectedProducts: selectedQuotesData.map(quote => ({
                        ...quote,
                        selectedForOrder: selectedForOrder.includes(quote.id)
                    }))
                }]
            };
            
            console.log('📝 Dados preparados para exportação:', {
                factory: factoryExportData.factory.name,
                productsCount: factoryExportData.imports[0].selectedProducts.length
            });
            
            // Gerar nome do arquivo baseado na fábrica e data
            const factoryName = currentFactory.name.replace(/[^a-zA-Z0-9]/g, '_');
            const fileName = `${factoryName}_cotações_exportadas_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`;
            
            // Executar exportação usando o serviço existente
            const result = await excelExportService.exportFactoryProducts(factoryExportData, fileName);
            
            console.log('✅ Exportação concluída:', result);
            
            // Marcar cotações como exportadas
            console.log('🔄 Iniciando marcação de cotações como exportadas...');
            await markQuotesAsExported(selectedIds);
            console.log('✅ Marcação de exportação concluída');
            
            showAlert('success', 'Exportação Concluída!', 
                `${result.count} cotações exportadas com sucesso para o arquivo: ${result.fileName}. As cotações foram marcadas como exportadas.`);
            
        } catch (error) {
            console.error('❌ Erro na exportação:', error);
            showAlert('error', 'Erro na Exportação!', `Erro ao exportar cotações: ${error.message}`);
        }
    };

    // Função para marcar cotações como exportadas


    const markQuotesAsExported = async (quoteIds) => {
        try {
            console.log('🏷️ Marcando cotações como exportadas:', quoteIds);
            
            if (!quoteIds || quoteIds.length === 0) {
                console.log('⚠️ Nenhuma cotação para marcar como exportada');
                return;
            }
            
            const updatePromises = quoteIds.map(async (quoteId) => {
                try {
                    console.log(`🔄 Atualizando cotação ${quoteId}...`);
                    const quoteRef = doc(db, 'quotes', quoteId);
                    
                    // Buscar dados atuais da cotação DIRETAMENTE do Firebase para preservar campos importantes
                    const quoteSnapshot = await getDoc(quoteRef);
                    const currentQuoteData = quoteSnapshot.exists() ? quoteSnapshot.data() : null;
                    
                    console.log(`📊 Dados atuais da cotação ${quoteId} no Firebase:`, {
                        dataPedido: currentQuoteData?.dataPedido,
                        lotePedido: currentQuoteData?.lotePedido,
                        ref: currentQuoteData?.ref
                    });
                    
                    const updateData = {
                        exported: true,
                        exportedAt: new Date(),
                        orderStatus: 'exported',
                        selectedForOrder: false, // Remove da seleção atual
                        updatedAt: new Date(),
                        // Preservar campos importantes do Firebase
                        dataPedido: currentQuoteData?.dataPedido || '',
                        lotePedido: currentQuoteData?.lotePedido || ''
                    };
                    
                    console.log(`📝 Dados para atualização:`, updateData);
                    await updateDoc(quoteRef, updateData);
                    console.log(`✅ Cotação ${quoteId} marcada como exportada (DATA PEDIDO: ${currentQuoteData?.dataPedido}, LOTE PEDIDO: ${currentQuoteData?.lotePedido})`);
                } catch (updateError) {
                    console.error(`❌ Erro ao atualizar cotação ${quoteId}:`, updateError);
                    throw updateError;
                }
            });

            console.log(`🔄 Aguardando atualização de ${updatePromises.length} cotações...`);
            await Promise.all(updatePromises);
            
            // Remover das seleções atuais
            console.log('🔄 Removendo das seleções atuais...');
            setSelectedForOrder(prev => prev.filter(id => !quoteIds.includes(id)));
            setSelectedQuotes(prev => prev.filter(id => !quoteIds.includes(id)));
            
            // Recarregar cotações para mostrar as mudanças
            console.log('🔄 Recarregando lista de cotações...');
            await loadQuotes(selectedFactoryForQuotes);
            
            console.log(`✅ ${updatePromises.length} cotações marcadas como exportadas com sucesso`);
        } catch (error) {
            console.error('❌ Erro ao marcar cotações como exportadas:', error);
            throw error;
        }
    };

    // Função para duplicar cotações selecionadas
    const handleDuplicateQuotes = async (selectedIds) => {
        try {
            console.log('🚀 Iniciando duplicação de cotações:', selectedIds);
            
            // Filtrar cotações selecionadas
            const selectedQuotesData = allQuotes.filter(quote => selectedIds.includes(quote.id));
            
            if (selectedQuotesData.length === 0) {
                showAlert('warning', 'Duplicação', 'Nenhuma cotação selecionada para duplicar.');
                return;
            }
            
            console.log('📊 Cotações selecionadas para duplicação:', selectedQuotesData.length);
            
            // Preparar dados para duplicação (remover ID e resetar campos específicos)
            const quotesToDuplicate = selectedQuotesData.map(quote => {
                const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, selectedForOrder: _selectedForOrder, orderStatus: _orderStatus, orderDate: _orderDate, ...quoteData } = quote;
                
                return {
                    ...quoteData,
                    factoryId: selectedFactoryForQuotes,
                    selectedForOrder: false,
                    orderStatus: 'pending',
                    orderDate: null,
                    // Adicionar sufixo na referência para identificar como duplicata
                    ref: `${quoteData.ref}_COPY_${Date.now()}`,
                    remark: `DUPLICATA - ${quoteData.remark || ''}`,
                    import: `Duplicação de ${quoteData.import || ''}`
                };
            });
            
            console.log('📝 Dados preparados para duplicação:', quotesToDuplicate.length, 'cotações');
            
            // Salvar cotações duplicadas usando o serviço do Firebase
            const duplicateIds = await addMultipleQuotes(quotesToDuplicate);
            
            console.log('✅ Duplicação concluída:', duplicateIds.length, 'novas cotações criadas');
            showAlert('success', 'Duplicação Concluída!', 
                `${duplicateIds.length} cotações duplicadas com sucesso!`);
            
        } catch (error) {
            console.error('❌ Erro na duplicação:', error);
            showAlert('error', 'Erro na Duplicação!', `Erro ao duplicar cotações: ${error.message}`);
        }
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
                    await handleExportQuotes(selectedIds);
                    break;
                    
                case 'duplicate':
                    await handleDuplicateQuotes(selectedIds);
                    await loadQuotes(selectedFactoryForQuotes);
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

    const handleViewImport = (importData) => {
        try {
            console.log('handleViewImport chamado com:', { 
                importDataId: importData.id, 
                allQuotesLength: allQuotes.length,
                importData: importData
            });
            
            // Resetar estados relacionados antes de filtrar
            setSelectedQuotes([]);
            setShowMultiSelect(false);
            setEditingImport(null);
            setEditingQuotes([]);
            
            const importQuotes = allQuotes.filter(quote => {
                const quoteCreatedAt = quote.createdAt?.toDate?.();
                if (!quoteCreatedAt) {
                    console.log('Quote sem createdAt:', quote.id);
                    return false;
                }
                
                const quoteKey = quoteCreatedAt.toISOString().substring(0, 16);
                const matches = quoteKey === importData.id;
                
                if (matches) {
                    console.log('Quote encontrado:', quote.id, 'com data:', quoteKey);
                }
                
                return matches;
            });
            
            console.log('Produtos filtrados:', importQuotes.length, 'de', allQuotes.length);
            console.log('ImportData ID:', importData.id);
            console.log('Primeiras datas das quotes:', allQuotes.slice(0, 3).map(q => ({
                id: q.id,
                createdAt: q.createdAt?.toDate?.()?.toISOString().substring(0, 16)
            })));
            
            setQuotes(importQuotes);
            setSelectedImportId(importData.id);
        } catch (error) {
            console.error('Erro ao visualizar importação:', error);
            showAlert('error', 'Erro!', 'Erro ao visualizar produtos da importação');
        }
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
        console.log('handleRefreshQuotes chamado');
        if (selectedFactoryForQuotes) {
            await loadQuotes(selectedFactoryForQuotes);
        }
    };

    const handleToggleOrderSelect = async (quoteId) => {
        console.log('🚀 handleToggleOrderSelect iniciado para quoteId:', quoteId);
        console.log('📊 Estado atual selectedForOrder:', selectedForOrder);
        
        const isSelected = selectedForOrder.includes(quoteId);
        console.log(`🎯 Produto ${isSelected ? 'está' : 'não está'} selecionado para pedido`);
        
        try {
            // Preparar dados para salvar
            const updateData = {
                selectedForOrder: !isSelected,
                orderStatus: !isSelected ? 'selected' : 'pending',
                updatedAt: new Date()
            };
            
            if (!isSelected) {
                updateData.orderDate = new Date();
            } else {
                updateData.orderDate = null;
            }
            
            console.log('💰 Dados para salvar no Firebase:', updateData);
            
            // Atualizar no Firebase primeiro
            const quoteRef = doc(db, 'quotes', quoteId);
            console.log('🔥 Executando updateDoc no Firebase...');
            await updateDoc(quoteRef, updateData);
            console.log('✅ Firebase atualizado com sucesso!');
            
            // Atualizar estados locais APÓS sucesso no Firebase
            if (isSelected) {
                // Remover da seleção
                setSelectedForOrder(prev => {
                    const newSelection = prev.filter(id => id !== quoteId);
                    console.log('➖ Produto removido da seleção:', newSelection);
                    return newSelection;
                });
                console.log('✅ Produto removido da seleção para pedido:', quoteId);
            } else {
                // Adicionar à seleção
                setSelectedForOrder(prev => {
                    const newSelection = [...prev, quoteId];
                    console.log('➕ Produto adicionado à seleção:', newSelection);
                    return newSelection;
                });
                console.log('✅ Produto adicionado à seleção para pedido:', quoteId);
            }
            
            // Atualizar cotações locais
            const updateQuote = (quote) => (
                quote.id === quoteId 
                    ? { 
                        ...quote, 
                        selectedForOrder: !isSelected,
                        orderStatus: !isSelected ? 'selected' : 'pending',
                        orderDate: !isSelected ? new Date() : null,
                        updatedAt: new Date()
                    } 
                    : quote
            );
            
            setQuotes(updatedQuotes => {
                const newQuotes = updatedQuotes.map(updateQuote);
                console.log('📝 Cotações locais atualizadas:', newQuotes.length);
                return newQuotes;
            });
            
            setAllQuotes(updatedAllQuotes => {
                const newAllQuotes = updatedAllQuotes.map(updateQuote);
                console.log('🗂️ Todas as cotações locais atualizadas:', newAllQuotes.length);
                return newAllQuotes;
            });
            
            console.log('🎉 Operação concluída com sucesso!');
            
        } catch (error) {
            console.error('❌ ERRO ao atualizar seleção para pedido:');
            console.error('📊 Tipo do erro:', error.constructor.name);
            console.error('💬 Mensagem:', error.message);
            console.error('📋 Stack trace:', error.stack);
            
            if (error.code) {
                console.error('🔗 Código do erro Firebase:', error.code);
            }
            
            showAlert('error', 'Erro ao Salvar!', 
                `Erro ao ${isSelected ? 'remover' : 'adicionar'} produto da seleção: ${error.message}`
            );
        }
    };

    // Função para lidar com atualização do campo Importação
    const handleUpdateImport = (quoteId, newImport) => {
        // Atualizar a cotação na lista local
        setQuotes(prevQuotes => 
            prevQuotes.map(quote => 
                quote.id === quoteId 
                    ? { ...quote, import: newImport } 
                    : quote
            )
        );
        
        // Atualizar também no allQuotes
        setAllQuotes(prevAllQuotes => 
            prevAllQuotes.map(quote => 
                quote.id === quoteId 
                    ? { ...quote, import: newImport } 
                    : quote
            )
        );
    };

    // Função para lidar com importação de imagens
    const handleImportImages = () => {
        setShowImageImportModal(true);
    };

    // Função para lidar com conclusão da importação de imagens
    const handleImageImportComplete = async (results) => {
        try {
            console.log('Resultados da importação de imagens:', results);
            
            // Atualizar as cotações com as novas imagens
            for (const item of results.processed) {
                if (item.imageUrl && !item.skipped) {
                    // Encontrar a cotação correspondente pela REF
                    const quoteToUpdate = quotes.find(q => q.ref === item.ref);
                    if (quoteToUpdate) {
                        // Atualizar a imagem da cotação
                        await handleImageUpdate(quoteToUpdate.id, item.imageUrl);
                    }
                }
            }
            
            showAlert('success', 'Sucesso!', `Importação de imagens concluída: ${results.success} imagens processadas com sucesso.`);
            
            // Atualizar a lista de cotações
            if (selectedFactoryForQuotes) {
                await loadQuotes(selectedFactoryForQuotes);
            }
            
        } catch (error) {
            console.error('Erro ao processar resultados da importação:', error);
            showAlert('error', 'Erro!', 'Erro ao processar resultados da importação de imagens');
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


            {/* Formulário de Fábrica */}
            <FactoryForm
                show={showAddForm}
                editingFactory={editingFactory}
                factoryForm={ factoryForm}
                setFactoryForm={setFactoryForm}
                onSubmit={editingFactory ? handleUpdateFactory : handleAddFactory}
                onCancel={handleCancel}
                onDelete={handleDeleteFactory}
                loading={loading}
            />

            {/* Cards das Fábricas */}
            <div className="mb-4">
                {/* Título - sempre visível */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="mb-0">
                        <span className="material-icons me-2" style={{fontSize: '28px', verticalAlign: 'middle'}}>factory</span>
                        Fábricas Cadastradas
                    </h2>
                    
                    {/* Botões de Ação - apenas quando não mobile */}
                    <div className="d-none d-md-flex gap-2">
                        <Button 
                            variant="success" 
                            onClick={() => setShowAddForm(true)}
                            size="sm"
                        >
                            <span className="material-icons me-1" style={{fontSize: '16px'}}>add</span>
                            Adicionar Nova Fábrica
                        </Button>
                        <Button 
                            variant="warning" 
                            onClick={() => {
                                const selectedFactoryId = selectedFactoryForQuotes;
                                if (selectedFactoryId) {
                                    window.location.href = `/admin/import?factory=${selectedFactoryId}`;
                                } else {
                                    showAlert('warning', 'Aviso', 'Selecione uma fábrica primeiro clicando em "Cotações"');
                                }
                            }}
                            size="sm"
                        >
                            <span className="material-icons me-1" style={{fontSize: '16px'}}>upload</span>
                            Importar
                        </Button>
                        <Button 
                            variant="outline-primary" 
                            onClick={loadFactories}
                            size="sm"
                        >
                            <span className="material-icons me-1" style={{fontSize: '16px'}}>refresh</span>
                            Atualizar Lista
                        </Button>
                    </div>
                </div>
                
                {/* Filtros - abaixo do título */}
                {factories.length > 0 && (
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        flexWrap: 'wrap',
                        backgroundColor: '#f8f9fa', 
                        padding: '8px 12px',
                        borderRadius: 2,
                        border: '1px solid #e9ecef',
                        marginBottom: '16px'
                    }}>
                                <FilterList sx={{ color: 'primary.main', fontSize: '18px' }} />
                                
                                {/* Filtro por Cidade */}
                                <TextField
                                    select
                                    label="Cidade"
                                    value={filterCity}
                                    onChange={(e) => setFilterCity(e.target.value)}
                                    size="small"
                                    sx={{ minWidth: 120 }}
                                >
                                    <MenuItem value="">
                                        <em>Todas</em>
                                    </MenuItem>
                                    {getUniqueCities().map((city) => (
                                        <MenuItem key={city} value={city}>
                                            {city}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                
                                {/* Filtro por Segmento */}
                                <TextField
                                    select
                                    label="Segmento"
                                    value={filterSegment}
                                    onChange={(e) => setFilterSegment(e.target.value)}
                                    size="small"
                                    sx={{ minWidth: 120 }}
                                >
                                    <MenuItem value="">
                                        <em>Todos</em>
                                    </MenuItem>
                                    {getUniqueSegments().map((segment) => (
                                        <MenuItem key={segment} value={segment}>
                                            {segment}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                
                                {/* Botão Limpar Filtros */}
                                {(filterCity || filterSegment) && (
                                    <MuiButton
                                        variant="outlined"
                                        size="small"
                                        onClick={clearFilters}
                                        startIcon={<Clear />}
                                        sx={{
                                            fontSize: '0.75rem',
                                            textTransform: 'none',
                                            minWidth: 'auto'
                                        }}
                                    >
                                        Limpar
                                    </MuiButton>
                                )}
                                
                                {/* Contador de resultados */}
                                <Chip
                                    label={`${filteredFactories.length}/${factories.length}`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem' }}
                                />
                            </Box>
                )}
                
                {/* Botões de Ação Mobile - linha própria em mobile */}
                <div className="d-md-none mb-3">
                    <div className="d-flex gap-2 flex-wrap">
                        <Button 
                            variant="success" 
                            onClick={() => setShowAddForm(true)}
                            size="sm"
                            className="flex-fill"
                        >
                            <span className="material-icons me-1" style={{fontSize: '16px'}}>add</span>
                            Adicionar
                        </Button>
                        <Button 
                            variant="warning" 
                            onClick={() => {
                                const selectedFactoryId = selectedFactoryForQuotes;
                                if (selectedFactoryId) {
                                    window.location.href = `/admin/import?factory=${selectedFactoryId}`;
                                } else {
                                    showAlert('warning', 'Aviso', 'Selecione uma fábrica primeiro clicando em "Cotações"');
                                }
                            }}
                            size="sm"
                            className="flex-fill"
                        >
                            <span className="material-icons me-1" style={{fontSize: '16px'}}>upload</span>
                            Importar
                        </Button>
                        <Button 
             variant="outline-primary" 
                            onClick={loadFactories}
                            size="sm"
                            className="flex-fill"
                        >
                            <span className="material-icons me-1" style={{fontSize: '16px'}}>refresh</span>
                            Atualizar
                        </Button>
                    </div>
                </div>
                
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
                        {filteredFactories.map((factory) => (
                            <Col key={factory.id} xs={12} sm={6} md={4} lg={3} xl={2}>
                                <FactoryCard
                                    factory={factory}
                                    onEdit={handleEditFactory}
                                    onViewQuotes={loadQuotes}
                                    isSelected={selectedFactoryForQuotes === factory.id}
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
                factoryName={factories.find(f => f.id === selectedFactoryForQuotes)?.name}
                quotes={quotes}
                allQuotes={allQuotes}
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
                onDuplicateQuote={handleDuplicateQuote}
                onToggleMultiSelect={() => setShowMultiSelect(!showMultiSelect)}
                onSelectionChange={setSelectedQuotes}
                onBulkAction={handleBulkAction}
                onImageUpdate={handleImageUpdate}
                onRefresh={handleRefreshQuotes}
                selectedForOrder={selectedForOrder}
                onToggleOrderSelect={handleToggleOrderSelect}
                selectedImportId={selectedImportId}
                loading={loading}
                onImportImages={handleImportImages}
                onUpdateImport={handleUpdateImport}
            />

            {/* Modal de Importação de Imagens */}
            <ImageImportModal
                show={showImageImportModal}
                onHide={() => {
                    setShowImageImportModal(false);
                }}
                onImportComplete={handleImageImportComplete}
            />
        </Container>
    );
};

export default AdminDashboard;
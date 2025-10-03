import React from 'react';
import { Card, CardContent, Typography, Button, Chip, Box, IconButton } from '@mui/material';
import { Edit, Assessment, Upload, Delete, LocationOn, Category } from '@mui/icons-material';

const FactoryCard = ({ 
    factory, 
    onEdit, 
    onViewQuotes, 
    onImport, 
    onDelete,
    isSelected = false
}) => {

    return (
        <Card 
            sx={{ 
                height: '100%',
                border: isSelected ? '2px solid #007bff' : 'none',
                background: isSelected 
                    ? 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' 
                    : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                '&:hover': !isSelected ? {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                } : {}
            }}
        >
            <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {/* Cabeçalho com nome */}
                <Box>
                    <Box sx={{ mb: 1 }}>
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                fontWeight: 'bold',
                                color: isSelected ? '#007bff' : '#2c3e50',
                                fontSize: '0.95rem',
                                lineHeight: 1.2,
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                                hyphens: 'auto'
                            }}
                        >
                            {factory.nomeFabrica}
                        </Typography>
                        {isSelected && (
                            <Chip 
                                label="Selecionada"
                                color="primary"
                                size="small"
                                sx={{
                                    fontSize: '0.6rem',
                                    fontWeight: '600',
                                    height: '20px',
                                    mt: 0.5
                                }}
                            />
                        )}
                    </Box>
                    
                    {/* Informações adicionais compactas */}
                    <Box sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationOn sx={{ fontSize: '12px' }} />
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    fontSize: '0.75rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    flex: 1
                                }}
                                title={factory.localizacao}
                            >
                                {factory.localizacao}
                            </Typography>
                            <Category sx={{ fontSize: '12px', ml: 1 }} />
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    fontSize: '0.75rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    flex: 1
                                }}
                                title={factory.segmento}
                            >
                                {factory.segmento}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
                
                {/* Botões de ação */}
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }}>
                    <IconButton 
                        color="primary"
                        onClick={() => onEdit(factory)}
                        title="Editar Fábrica"
                        sx={{
                            backgroundColor: 'rgba(13, 110, 253, 0.1)',
                            '&:hover': {
                                backgroundColor: '#0d6efd',
                                color: 'white'
                            }
                        }}
                    >
                        <Edit />
                    </IconButton>
                    
                    <IconButton 
                        color="info"
                        onClick={() => onViewQuotes(factory.id)}
                        title="Ver Cotações"
                        sx={{
                            backgroundColor: 'rgba(13, 202, 240, 0.1)',
                            '&:hover': {
                                backgroundColor: '#0dcaf0',
                                color: 'white'
                            }
                        }}
                    >
                        <Assessment />
                    </IconButton>
                    
                    <IconButton 
                        color="success"
                        onClick={() => onImport(factory.id)}
                        title="Importar Cotações"
                        sx={{
                            backgroundColor: 'rgba(25, 135, 84, 0.1)',
                            '&:hover': {
                                backgroundColor: '#198754',
                                color: 'white'
                            }
                        }}
                    >
                        <Upload />
                    </IconButton>
                    
                    <IconButton 
                        color="error"
                        onClick={() => onDelete(factory.id)}
                        title="Excluir Fábrica"
                        sx={{
                            backgroundColor: 'rgba(220, 53, 69, 0.1)',
                            '&:hover': {
                                backgroundColor: '#dc3545',
                                color: 'white'
                            }
                        }}
                    >
                        <Delete />
                    </IconButton>
                </Box>
            </CardContent>
        </Card>
    );
};

export default FactoryCard;
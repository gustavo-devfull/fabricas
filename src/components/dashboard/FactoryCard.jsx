import React from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';
import { LocationOn, Category } from '@mui/icons-material';

const FactoryCard = ({ 
    factory, 
    onEdit, 
    onViewQuotes, 
    isSelected = false
}) => {

    return (
        <Card 
            sx={{ 
                height: '100%',
                borderRadius: 3,
                border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
                background: isSelected 
                    ? 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' 
                    : 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                boxShadow: isSelected 
                    ? '0 8px 32px rgba(25, 118, 210, 0.15)' 
                    : '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': !isSelected ? {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                    borderColor: '#1976d2'
                } : {},
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Header com avatar e status */}
            <Box sx={{ 
                p: 2, 
                pb: 1,
                background: 'linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%)',
                position: 'relative'
            }}>
                <Box sx={{ mb: 1 }}>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            fontWeight: 'bold',
                            color: isSelected ? '#1976d2' : '#2c3e50',
                            fontSize: '1rem',
                            lineHeight: 1.3,
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            hyphens: 'auto'
                        }}
                    >
                        {factory.name}
                    </Typography>
                </Box>
            </Box>

            <CardContent sx={{ p: 2, pt: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Informações principais */}
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LocationOn sx={{ fontSize: '16px', color: '#666' }} />
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                fontSize: '0.8rem',
                                color: '#666',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1
                            }}
                            title={factory.localizacao}
                        >
                            {factory.localizacao || 'Localização não informada'}
                        </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Category sx={{ fontSize: '16px', color: '#666' }} />
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                fontSize: '0.8rem',
                                color: '#666',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1
                            }}
                            title={factory.segmento}
                        >
                            {factory.segmento || 'Segmento não informado'}
                        </Typography>
                    </Box>
                </Box>


                {/* Botões de ação */}
                <Box sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    mt: 'auto',
                    pt: 1
                }}>
                    <Button 
                        variant="contained"
                        size="small"
                        onClick={() => onEdit(factory)}
                        sx={{
                            fontSize: '0.75rem',
                            padding: '8px 12px',
                            height: '36px',
                            backgroundColor: '#4caf50',
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: '600',
                            flex: 1,
                            '&:hover': {
                                backgroundColor: '#45a049',
                                transform: 'translateY(-1px)'
                            }
                        }}
                    >
                        Editar
                    </Button>
                    
                    <Button 
                        variant="outlined"
                        size="small"
                        onClick={() => onViewQuotes(factory.id)}
                        sx={{
                            fontSize: '0.75rem',
                            padding: '8px 12px',
                            height: '36px',
                            color: '#1976d2',
                            borderColor: '#1976d2',
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: '600',
                            flex: 1,
                            '&:hover': {
                                backgroundColor: '#1976d2',
                                color: 'white',
                                transform: 'translateY(-1px)'
                            }
                        }}
                    >
                        Cotações
                    </Button>
                </Box>
            </CardContent>

            {/* Indicador de status */}
            <Box sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 4,
                height: '100%',
                bgcolor: isSelected ? '#1976d2' : '#4caf50',
                borderRadius: '0 3px 3px 0'
            }} />
        </Card>
    );
};

export default FactoryCard;
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Tab, Tabs } from 'react-bootstrap';
import { 
    Box, 
    TextField, 
    Typography, 
    Avatar, 
    IconButton, 
    Divider,
    Switch,
    FormControlLabel,
    Chip,
    Paper
} from '@mui/material';
import { 
    Person, 
    Email, 
    Lock, 
    Phone, 
    LocationOn, 
    Business, 
    Save, 
    Edit, 
    Cancel,
    Visibility,
    VisibilityOff,
    Security,
    Settings,
    Notifications,
    Language
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

const UserProfile = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('personal');

    // Estados para dados pessoais
    const [personalData, setPersonalData] = useState({
        displayName: '',
        email: '',
        phone: '',
        company: '',
        position: '',
        address: '',
        city: '',
        state: '',
        zipCode: ''
    });

    // Estados para edição
    const [isEditingPersonal, setIsEditingPersonal] = useState(false);
    const [isEditingPassword, setIsEditingPassword] = useState(false);

    // Estados para alteração de senha
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    // Estados para configurações
    const [settings, setSettings] = useState({
        emailNotifications: true,
        smsNotifications: false,
        language: 'pt-BR',
        theme: 'light',
        autoSave: true
    });

    // Carregar dados do usuário
    useEffect(() => {
        if (currentUser) {
            loadUserData();
        }
    }, [currentUser]);

    const loadUserData = async () => {
        try {
            setLoading(true);
            
            if (!currentUser) {
                setError('Usuário não autenticado');
                return;
            }
            
            // Carregar dados básicos do Firebase Auth
            setPersonalData(prev => ({
                ...prev,
                displayName: currentUser.displayName || '',
                email: currentUser.email || ''
            }));

            // Carregar dados adicionais do Firestore
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setPersonalData(prev => ({
                    ...prev,
                    phone: userData.phone || '',
                    company: userData.company || '',
                    position: userData.position || '',
                    address: userData.address || '',
                    city: userData.city || '',
                    state: userData.state || '',
                    zipCode: userData.zipCode || ''
                }));
                setSettings(prev => ({
                    ...prev,
                    emailNotifications: userData.emailNotifications ?? true,
                    smsNotifications: userData.smsNotifications ?? false,
                    language: userData.language || 'pt-BR',
                    theme: userData.theme || 'light',
                    autoSave: userData.autoSave ?? true
                }));
            } else {
                // Criar documento do usuário se não existir
                console.log('📝 Criando documento do usuário no Firestore...');
                await setDoc(userDocRef, {
                    phone: '',
                    company: '',
                    position: '',
                    address: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    emailNotifications: true,
                    smsNotifications: false,
                    language: 'pt-BR',
                    theme: 'light',
                    autoSave: true,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                console.log('✅ Documento do usuário criado com sucesso');
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            setError('Erro ao carregar dados do usuário');
        } finally {
            setLoading(false);
        }
    };

    const handlePersonalDataChange = (field, value) => {
        setPersonalData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handlePasswordChange = (field, value) => {
        setPasswordData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSettingsChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const savePersonalData = async () => {
        try {
            setSaving(true);
            setError('');
            setSuccess('');

            if (!currentUser) {
                setError('Usuário não autenticado');
                return;
            }

            // Atualizar dados no Firebase Auth
            await updateProfile(currentUser, {
                displayName: personalData.displayName
            });

            // Atualizar dados adicionais no Firestore
            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, {
                phone: personalData.phone,
                company: personalData.company,
                position: personalData.position,
                address: personalData.address,
                city: personalData.city,
                state: personalData.state,
                zipCode: personalData.zipCode,
                emailNotifications: settings.emailNotifications,
                smsNotifications: settings.smsNotifications,
                language: settings.language,
                theme: settings.theme,
                autoSave: settings.autoSave,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }, { merge: true });

            setSuccess('Dados pessoais atualizados com sucesso!');
            setIsEditingPersonal(false);
        } catch (error) {
            console.error('Erro ao salvar dados pessoais:', error);
            setError('Erro ao salvar dados pessoais: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const savePassword = async () => {
        try {
            setSaving(true);
            setError('');
            setSuccess('');

            if (!currentUser) {
                setError('Usuário não autenticado');
                return;
            }

            // Validar senhas
            if (passwordData.newPassword !== passwordData.confirmPassword) {
                setError('As senhas não coincidem');
                return;
            }

            if (passwordData.newPassword.length < 6) {
                setError('A nova senha deve ter pelo menos 6 caracteres');
                return;
            }

            // Reautenticar usuário
            const credential = EmailAuthProvider.credential(currentUser.email, passwordData.currentPassword);
            await reauthenticateWithCredential(currentUser, credential);

            // Atualizar senha
            await updatePassword(currentUser, passwordData.newPassword);

            setSuccess('Senha alterada com sucesso!');
            setIsEditingPassword(false);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            if (error.code === 'auth/wrong-password') {
                setError('Senha atual incorreta');
            } else if (error.code === 'auth/weak-password') {
                setError('A nova senha é muito fraca');
            } else {
                setError('Erro ao alterar senha: ' + error.message);
            }
        } finally {
            setSaving(false);
        }
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            setError('');
            setSuccess('');

            if (!currentUser) {
                setError('Usuário não autenticado');
                return;
            }

            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, {
                emailNotifications: settings.emailNotifications,
                smsNotifications: settings.smsNotifications,
                language: settings.language,
                theme: settings.theme,
                autoSave: settings.autoSave,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }, { merge: true });

            setSuccess('Configurações salvas com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            setError('Erro ao salvar configurações: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const cancelEdit = () => {
        setIsEditingPersonal(false);
        setIsEditingPassword(false);
        setError('');
        setSuccess('');
        loadUserData(); // Recarregar dados originais
    };

    if (loading) {
        return (
            <Container className="py-5">
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <Spinner animation="border" variant="primary" />
                    <Typography variant="h6" className="ms-3">Carregando perfil...</Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <Row>
                <Col xs={12}>
                    <Typography variant="h4" className="mb-4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                        <Person className="me-2" />
                        Gerenciar Perfil
                    </Typography>
                </Col>
            </Row>

            {/* Alertas */}
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            <Row>
                <Col xs={12} md={4}>
                    {/* Card de Informações do Usuário */}
                    <Card className="mb-4">
                        <Card.Body className="text-center">
                            <Avatar
                                sx={{ 
                                    width: 100, 
                                    height: 100, 
                                    mx: 'auto', 
                                    mb: 2,
                                    bgcolor: '#1976d2',
                                    fontSize: '2rem'
                                }}
                            >
                                {personalData.displayName ? personalData.displayName.charAt(0).toUpperCase() : 'U'}
                            </Avatar>
                            <Typography variant="h5" className="mb-2">
                                {personalData.displayName || 'Usuário'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" className="mb-3">
                                {personalData.email}
                            </Typography>
                            {personalData.company && (
                                <Chip 
                                    icon={<Business />} 
                                    label={personalData.company} 
                                    variant="outlined" 
                                    className="mb-2"
                                />
                            )}
                            {personalData.position && (
                                <Typography variant="body2" color="text.secondary">
                                    {personalData.position}
                                </Typography>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col xs={12} md={8}>
                    {/* Tabs de Configuração */}
                    <Card>
                        <Card.Body>
                            <Tabs
                                activeKey={activeTab}
                                onSelect={(k) => setActiveTab(k)}
                                className="mb-4"
                            >
                                <Tab eventKey="personal" title="Dados Pessoais">
                                    <PersonalDataTab
                                        personalData={personalData}
                                        isEditing={isEditingPersonal}
                                        onDataChange={handlePersonalDataChange}
                                        onEdit={() => setIsEditingPersonal(true)}
                                        onSave={savePersonalData}
                                        onCancel={cancelEdit}
                                        saving={saving}
                                    />
                                </Tab>
                                <Tab eventKey="security" title="Segurança">
                                    <SecurityTab
                                        passwordData={passwordData}
                                        isEditing={isEditingPassword}
                                        showPasswords={showPasswords}
                                        onPasswordChange={handlePasswordChange}
                                        onToggleVisibility={togglePasswordVisibility}
                                        onEdit={() => setIsEditingPassword(true)}
                                        onSave={savePassword}
                                        onCancel={cancelEdit}
                                        saving={saving}
                                    />
                                </Tab>
                                <Tab eventKey="settings" title="Configurações">
                                    <SettingsTab
                                        settings={settings}
                                        onSettingsChange={handleSettingsChange}
                                        onSave={saveSettings}
                                        saving={saving}
                                    />
                                </Tab>
                            </Tabs>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

// Componente para Dados Pessoais
const PersonalDataTab = ({ 
    personalData, 
    isEditing, 
    onDataChange, 
    onEdit, 
    onSave, 
    onCancel, 
    saving 
}) => {
    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" className="mb-4">
                <Typography variant="h6">Informações Pessoais</Typography>
                {!isEditing ? (
                    <Button variant="outlined" startIcon={<Edit />} onClick={onEdit}>
                        Editar
                    </Button>
                ) : (
                    <Box>
                        <Button 
                            variant="contained" 
                            startIcon={<Save />} 
                            onClick={onSave}
                            disabled={saving}
                            className="me-2"
                        >
                            {saving ? 'Salvando...' : 'Salvar'}
                        </Button>
                        <Button 
                            variant="outlined" 
                            startIcon={<Cancel />} 
                            onClick={onCancel}
                            disabled={saving}
                        >
                            Cancelar
                        </Button>
                    </Box>
                )}
            </Box>

            <Row>
                <Col xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Nome Completo"
                        value={personalData.displayName}
                        onChange={(e) => onDataChange('displayName', e.target.value)}
                        disabled={!isEditing}
                        className="mb-3"
                        InputProps={{
                            startAdornment: <Person className="me-2" color="action" />
                        }}
                    />
                </Col>
                <Col xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Email"
                        value={personalData.email}
                        disabled
                        className="mb-3"
                        InputProps={{
                            startAdornment: <Email className="me-2" color="action" />
                        }}
                        helperText="O email não pode ser alterado"
                    />
                </Col>
                <Col xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Telefone"
                        value={personalData.phone}
                        onChange={(e) => onDataChange('phone', e.target.value)}
                        disabled={!isEditing}
                        className="mb-3"
                        InputProps={{
                            startAdornment: <Phone className="me-2" color="action" />
                        }}
                    />
                </Col>
                <Col xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Empresa"
                        value={personalData.company}
                        onChange={(e) => onDataChange('company', e.target.value)}
                        disabled={!isEditing}
                        className="mb-3"
                        InputProps={{
                            startAdornment: <Business className="me-2" color="action" />
                        }}
                    />
                </Col>
                <Col xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Cargo"
                        value={personalData.position}
                        onChange={(e) => onDataChange('position', e.target.value)}
                        disabled={!isEditing}
                        className="mb-3"
                    />
                </Col>
                <Col xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="CEP"
                        value={personalData.zipCode}
                        onChange={(e) => onDataChange('zipCode', e.target.value)}
                        disabled={!isEditing}
                        className="mb-3"
                    />
                </Col>
                <Col xs={12}>
                    <TextField
                        fullWidth
                        label="Endereço"
                        value={personalData.address}
                        onChange={(e) => onDataChange('address', e.target.value)}
                        disabled={!isEditing}
                        className="mb-3"
                        InputProps={{
                            startAdornment: <LocationOn className="me-2" color="action" />
                        }}
                    />
                </Col>
                <Col xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Cidade"
                        value={personalData.city}
                        onChange={(e) => onDataChange('city', e.target.value)}
                        disabled={!isEditing}
                        className="mb-3"
                    />
                </Col>
                <Col xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Estado"
                        value={personalData.state}
                        onChange={(e) => onDataChange('state', e.target.value)}
                        disabled={!isEditing}
                        className="mb-3"
                    />
                </Col>
            </Row>
        </Box>
    );
};

// Componente para Segurança
const SecurityTab = ({ 
    passwordData, 
    isEditing, 
    showPasswords, 
    onPasswordChange, 
    onToggleVisibility, 
    onEdit, 
    onSave, 
    onCancel, 
    saving 
}) => {
    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" className="mb-4">
                <Typography variant="h6">Alterar Senha</Typography>
                {!isEditing ? (
                    <Button variant="outlined" startIcon={<Lock />} onClick={onEdit}>
                        Alterar Senha
                    </Button>
                ) : (
                    <Box>
                        <Button 
                            variant="contained" 
                            startIcon={<Save />} 
                            onClick={onSave}
                            disabled={saving}
                            className="me-2"
                        >
                            {saving ? 'Salvando...' : 'Salvar'}
                        </Button>
                        <Button 
                            variant="outlined" 
                            startIcon={<Cancel />} 
                            onClick={onCancel}
                            disabled={saving}
                        >
                            Cancelar
                        </Button>
                    </Box>
                )}
            </Box>

            {isEditing && (
                <Row>
                    <Col xs={12}>
                        <TextField
                            fullWidth
                            label="Senha Atual"
                            type={showPasswords.current ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={(e) => onPasswordChange('currentPassword', e.target.value)}
                            className="mb-3"
                            InputProps={{
                                startAdornment: <Lock className="me-2" color="action" />,
                                endAdornment: (
                                    <IconButton
                                        onClick={() => onToggleVisibility('current')}
                                        edge="end"
                                    >
                                        {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                )
                            }}
                        />
                    </Col>
                    <Col xs={12}>
                        <TextField
                            fullWidth
                            label="Nova Senha"
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) => onPasswordChange('newPassword', e.target.value)}
                            className="mb-3"
                            InputProps={{
                                startAdornment: <Lock className="me-2" color="action" />,
                                endAdornment: (
                                    <IconButton
                                        onClick={() => onToggleVisibility('new')}
                                        edge="end"
                                    >
                                        {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                )
                            }}
                        />
                    </Col>
                    <Col xs={12}>
                        <TextField
                            fullWidth
                            label="Confirmar Nova Senha"
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={(e) => onPasswordChange('confirmPassword', e.target.value)}
                            className="mb-3"
                            InputProps={{
                                startAdornment: <Lock className="me-2" color="action" />,
                                endAdornment: (
                                    <IconButton
                                        onClick={() => onToggleVisibility('confirm')}
                                        edge="end"
                                    >
                                        {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                )
                            }}
                        />
                    </Col>
                </Row>
            )}

            {!isEditing && (
                <Paper className="p-3" sx={{ bgcolor: '#f5f5f5' }}>
                    <Typography variant="body2" color="text.secondary">
                        <Security className="me-2" />
                        Para alterar sua senha, clique no botão "Alterar Senha" acima.
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};

// Componente para Configurações
const SettingsTab = ({ settings, onSettingsChange, onSave, saving }) => {
    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" className="mb-4">
                <Typography variant="h6">Configurações da Conta</Typography>
                <Button 
                    variant="contained" 
                    startIcon={<Save />} 
                    onClick={onSave}
                    disabled={saving}
                >
                    {saving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
            </Box>

            <Row>
                <Col xs={12}>
                    <Typography variant="subtitle1" className="mb-3">
                        <Notifications className="me-2" />
                        Notificações
                    </Typography>
                </Col>
                <Col xs={12} md={6}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.emailNotifications}
                                onChange={(e) => onSettingsChange('emailNotifications', e.target.checked)}
                            />
                        }
                        label="Notificações por Email"
                    />
                </Col>
                <Col xs={12} md={6}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.smsNotifications}
                                onChange={(e) => onSettingsChange('smsNotifications', e.target.checked)}
                            />
                        }
                        label="Notificações por SMS"
                    />
                </Col>
            </Row>

            <Divider className="my-4" />

            <Row>
                <Col xs={12}>
                    <Typography variant="subtitle1" className="mb-3">
                        <Language className="me-2" />
                        Preferências
                    </Typography>
                </Col>
                <Col xs={12} md={6}>
                    <TextField
                        fullWidth
                        select
                        label="Idioma"
                        value={settings.language}
                        onChange={(e) => onSettingsChange('language', e.target.value)}
                        className="mb-3"
                    >
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en-US">English (US)</option>
                        <option value="es-ES">Español</option>
                    </TextField>
                </Col>
                <Col xs={12} md={6}>
                    <TextField
                        fullWidth
                        select
                        label="Tema"
                        value={settings.theme}
                        onChange={(e) => onSettingsChange('theme', e.target.value)}
                        className="mb-3"
                    >
                        <option value="light">Claro</option>
                        <option value="dark">Escuro</option>
                        <option value="auto">Automático</option>
                    </TextField>
                </Col>
                <Col xs={12}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.autoSave}
                                onChange={(e) => onSettingsChange('autoSave', e.target.checked)}
                            />
                        }
                        label="Salvamento Automático"
                    />
                </Col>
            </Row>
        </Box>
    );
};

export default UserProfile;

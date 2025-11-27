import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, useWindowDimensions, Image, Platform, Modal, ActivityIndicator, TextInput } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { parseSapConfig } from '../services/SapConfigParser';
import { useCredentials } from '../context/CredentialContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useProjects } from '../context/ProjectContext';
import { Project } from '../types';
import { colors, spacing, typography, shadows, layout } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

type ProjectListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProjectList'>;

const ProjectListScreen = () => {
    const navigation = useNavigation<ProjectListScreenNavigationProp>();
    const { projects, deleteProject, addProject, deleteAllProjects, refreshProjects } = useProjects();
    const { addCredential, deleteCredential, getCredentialsByProject, deleteAllCredentials, refreshCredentials } = useCredentials();
    const { user, signOut } = useAuth();
    const { width } = useWindowDimensions();

    const [isImporting, setIsImporting] = useState(false);
    const [importMessage, setImportMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        visible: boolean;
        type: 'single' | 'all';
        id: string;
    }>({ visible: false, type: 'single', id: '' });
    const [importConfirmation, setImportConfirmation] = useState<{
        visible: boolean;
        projectCount: number;
        systemCount: number;
        parsedProjects: any[];
    }>({ visible: false, projectCount: 0, systemCount: 0, parsedProjects: [] });

    // Filter projects based on search query and sort alphabetically
    const filteredProjects = projects
        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name));

    // Responsive grid: 2 columns on tablet/desktop, 1 on mobile
    const numColumns = width > 600 ? 2 : 1;
    const cardWidth = width > 600 ? (width - spacing.m * 3) / 2 : width - spacing.m * 2;

    const performDeleteProject = async (id: string) => {
        try {
            // Cascade delete credentials first
            const projectCredentials = getCredentialsByProject(id);
            for (const cred of projectCredentials) {
                await deleteCredential(cred.id);
            }
            // Then delete project
            await deleteProject(id);
            setDeleteConfirmation({ visible: false, type: 'single', id: '' });
        } catch (error) {
            console.error('Error deleting project:', error);
            Alert.alert('Error', 'Failed to delete project.');
        }
    };

    const performDeleteAll = async () => {
        try {
            await deleteAllCredentials();
            await deleteAllProjects();
            setDeleteConfirmation({ visible: false, type: 'single', id: '' });
        } catch (error) {
            console.error('Error deleting all:', error);
            Alert.alert('Error', 'Failed to delete all data.');
        }
    };

    const confirmDelete = () => {
        if (deleteConfirmation.type === 'all') {
            performDeleteAll();
        } else {
            performDeleteProject(deleteConfirmation.id);
        }
    };

    const handleDelete = (id: string) => {
        setDeleteConfirmation({ visible: true, type: 'single', id });
    };

    const handleDeleteAll = () => {
        if (projects.length === 0) return;
        setDeleteConfirmation({ visible: true, type: 'all', id: '' });
    };

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
            Alert.alert('Error', 'Failed to sign out');
        }
    };

    const handleImportSapConfig = async () => {
        try {
            console.log('[SAP IMPORT] Starting import...');
            const result = await DocumentPicker.getDocumentAsync({
                type: ['text/xml', 'application/xml'],
                copyToCacheDirectory: true,
            });

            console.log('[SAP IMPORT] Picker result:', result);

            if (result.canceled) {
                console.log('[SAP IMPORT] User cancelled picker');
                return;
            }

            setIsImporting(true);
            setImportMessage('Leyendo archivo...');

            const file = result.assets[0];
            console.log('[SAP IMPORT] Selected file:', file);
            let xmlContent = '';

            // Handle Web vs Native file reading
            if (Platform.OS === 'web') {
                const response = await fetch(file.uri);
                xmlContent = await response.text();
            } else {
                const response = await fetch(file.uri);
                xmlContent = await response.text();
            }

            console.log('[SAP IMPORT] XML content length:', xmlContent.length);
            console.log('[SAP IMPORT] XML preview:', xmlContent.substring(0, 200));

            setImportMessage('Analizando configuración SAP...');
            // Small delay to let UI update
            await new Promise(resolve => setTimeout(resolve, 100));

            const parsedProjects = parseSapConfig(xmlContent);
            console.log('[SAP IMPORT] Parsed projects:', parsedProjects);

            if (parsedProjects.length === 0) {
                setIsImporting(false);
                Alert.alert('Error', 'No se encontraron sistemas SAP válidos en el archivo.');
                return;
            }

            // Ask for confirmation using custom modal
            setIsImporting(false);

            const totalSystems = parsedProjects.reduce((acc, p) => acc + p.systems.length, 0);

            // Show custom confirmation modal and wait for user response
            const proceed = await new Promise<boolean>(resolve => {
                setImportConfirmation({
                    visible: true,
                    projectCount: parsedProjects.length,
                    systemCount: totalSystems,
                    parsedProjects,
                });

                // Store the resolve function so we can call it from button handlers
                (window as any)._importResolve = resolve;
            });

            console.log('[SAP IMPORT] User confirmation:', proceed);

            if (!proceed) return;

            setIsImporting(true);
            let importedCount = 0;
            let credentialCount = 0;
            const totalProjects = parsedProjects.length;

            for (let i = 0; i < totalProjects; i++) {
                const p = parsedProjects[i];
                console.log(`[SAP IMPORT] Processing project ${i + 1}/${totalProjects}:`, p.name);
                setImportMessage(`Importando proyecto ${i + 1} de ${totalProjects}: ${p.name}`);

                try {
                    // Create Project
                    console.log('[SAP IMPORT] Creating project:', p.name);
                    const createdProject = await addProject({
                        name: p.name,
                    });

                    console.log('[SAP IMPORT] Created project:', createdProject);

                    if (createdProject) {
                        // Create Credentials for each system
                        for (const sys of p.systems) {
                            const envType = sys.name.toUpperCase().includes('PROD') || sys.name.toUpperCase().includes('PRD')
                                ? 'PRD'
                                : sys.name.toUpperCase().includes('QAS') || sys.name.toUpperCase().includes('QA') || sys.name.toUpperCase().includes('QUALITY')
                                    ? 'QAS'
                                    : 'DEV';

                            console.log(`[SAP IMPORT] Creating credential for ${sys.name} (${envType})`);

                            const noteContent = `SID: ${sys.systemid}\n\n${p.memo ? 'Project Note:\n' + p.memo + '\n\n' : ''}${sys.memo || ''}`;
                            console.log('[SAP IMPORT] Note Content:', noteContent);

                            try {
                                await addCredential({
                                    project_id: createdProject.id,
                                    tab_category: 'APP',
                                    environment: envType,
                                    title: sys.name,
                                    username: '',
                                    password_encrypted: '',
                                    note_content: noteContent,
                                    host_address: sys.server,
                                    instance_number: sys.instance,
                                    saprouter_string: sys.routerid,
                                });
                                console.log(`[SAP IMPORT] ✓ Credential created for ${sys.name}`);
                                credentialCount++;
                            } catch (credError: any) {
                                console.error(`[SAP IMPORT] ✗ Failed to create credential for ${sys.name}:`, credError);
                                Alert.alert('Error de Credencial', `No se pudo crear la credencial ${sys.name}: ${credError.message || JSON.stringify(credError)}`);
                            }
                        }
                        importedCount++;
                    } else {
                        console.error('[SAP IMPORT] addProject returned null/undefined');
                    }
                } catch (projectError: any) {
                    console.error(`[SAP IMPORT] ✗ Failed to create project ${p.name}:`, projectError);
                    Alert.alert('Error de Proyecto', `No se pudo crear el proyecto ${p.name}: ${projectError.message || JSON.stringify(projectError)}`);
                }
            }

            // Ensure we have the latest data
            await refreshProjects();
            await refreshCredentials();

            setIsImporting(false);
            console.log(`[SAP IMPORT] ✓ Import complete: ${importedCount}/${totalProjects} projects, ${credentialCount} credentials`);
            Alert.alert(
                '✅ Importación Exitosa',
                `Se importaron ${importedCount} proyectos con ${credentialCount} credenciales.\n\nLos proyectos ya están disponibles en la lista.`,
                [{ text: 'OK' }]
            );

        } catch (error: any) {
            setIsImporting(false);
            console.error('[SAP IMPORT] ✗ Top-level error:', error);
            Alert.alert('Error', `No se pudo importar la configuración SAP: ${error.message || JSON.stringify(error)}`);
        }
    };

    const renderHeader = () => (
        <>
            <View style={styles.header}>
                <View style={styles.headerUserInfo}>
                    {user?.user_metadata?.avatar_url ? (
                        <Image
                            source={{ uri: user.user_metadata.avatar_url }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarPlaceholderText}>
                                {user?.email?.substring(0, 1).toUpperCase() || 'G'}
                            </Text>
                        </View>
                    )}
                    <View>
                        <Text style={styles.headerTitle}>Projects</Text>
                        {user?.user_metadata?.full_name && (
                            <Text style={styles.headerUserName}>
                                {user.user_metadata.full_name}
                            </Text>
                        )}
                        <Text style={styles.headerSubtitle}>
                            {user?.email || 'Guest'}
                        </Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity onPress={handleImportSapConfig} style={[styles.logoutButton, { marginRight: 8 }]}>
                        <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    {projects.length > 0 && (
                        <TouchableOpacity onPress={handleDeleteAll} style={[styles.logoutButton, { marginRight: 8 }]}>
                            <Ionicons name="trash-outline" size={24} color={colors.danger} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <Ionicons name="log-out-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar */}
            {projects.length > 0 && (
                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar proyectos..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </>
    );

    const renderItem = ({ item }: { item: Project }) => (
        <View style={[styles.card, { width: cardWidth }]}>
            <TouchableOpacity
                style={styles.cardContent}
                onPress={() => navigation.navigate('ProjectDetail', { project: item })}
            >
                <View style={styles.iconPlaceholder}>
                    <Text style={styles.iconText}>{item.name.substring(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.textContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.title}>{item.name}</Text>
                        <Ionicons
                            name={item.is_synced ? "checkmark-circle" : "cloud-upload-outline"}
                            size={18}
                            color={item.is_synced ? colors.success : colors.warning}
                        />
                    </View>
                    <Text style={styles.subtitle}>Created: {new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => navigation.navigate('ProjectForm', { project: item })}
                >
                    <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(item.id)}
                >
                    <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {renderHeader()}
            <FlatList
                data={filteredProjects}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                numColumns={numColumns}
                key={numColumns} // Force re-render on orientation change
            />
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('ProjectForm')}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            {/* Import Progress Modal */}
            <Modal
                transparent={true}
                animationType="fade"
                visible={isImporting}
                onRequestClose={() => { }} // Prevent closing by back button
            >
                <View style={styles.modalBackground}>
                    <View style={styles.activityIndicatorWrapper}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingText}>{importMessage}</Text>
                    </View>
                </View>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                transparent={true}
                animationType="fade"
                visible={deleteConfirmation.visible}
                onRequestClose={() => setDeleteConfirmation({ visible: false, type: 'single', id: '' })}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.confirmModalContainer}>
                        <Ionicons name="warning-outline" size={48} color={colors.danger} />
                        <Text style={styles.confirmTitle}>
                            {deleteConfirmation.type === 'all' ? 'Delete All Data?' : 'Delete Project?'}
                        </Text>
                        <Text style={styles.confirmMessage}>
                            {deleteConfirmation.type === 'all'
                                ? '⚠️ This will permanently delete ALL projects and credentials. This action cannot be undone.'
                                : 'This will delete the project and all its credentials.'}
                        </Text>
                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                style={[styles.confirmButton, styles.cancelButton]}
                                onPress={() => setDeleteConfirmation({ visible: false, type: 'single', id: '' })}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, styles.deleteConfirmButton]}
                                onPress={confirmDelete}
                            >
                                <Text style={styles.deleteButtonText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Import Confirmation Modal */}
            <Modal
                visible={importConfirmation.visible}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    setImportConfirmation({ ...importConfirmation, visible: false });
                    (window as any)._importResolve?.(false);
                }}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.confirmModalContainer}>
                        <Ionicons name="cloud-upload-outline" size={48} color={colors.primary} />
                        <Text style={styles.confirmTitle}>Importar Configuración SAP</Text>
                        <Text style={styles.confirmMessage}>
                            Se encontraron {importConfirmation.projectCount} proyectos con {importConfirmation.systemCount} sistemas.{'\n\n'}
                            ¿Desea importarlos?
                        </Text>
                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                style={[styles.confirmButton, styles.cancelButton]}
                                onPress={() => {
                                    setImportConfirmation({ ...importConfirmation, visible: false });
                                    (window as any)._importResolve?.(false);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                                onPress={async () => {
                                    setImportConfirmation({ ...importConfirmation, visible: false });
                                    (window as any)._importResolve?.(true);
                                }}
                            >
                                <Text style={styles.deleteButtonText}>Importar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.m,
        paddingTop: spacing.m,
        paddingBottom: spacing.s,
        backgroundColor: colors.background,
    },
    headerUserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: spacing.m,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.m,
    },
    avatarPlaceholderText: {
        color: colors.primary,
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerTitle: {
        ...typography.h1,
        color: colors.textPrimary,
    },
    headerUserName: {
        ...typography.h2,
        fontSize: 18, // Slightly smaller than standard h2
        color: colors.textPrimary,
        marginTop: spacing.xs,
    },
    headerSubtitle: {
        ...typography.body,
        color: colors.textSecondary,
        fontSize: 14,
    },
    logoutButton: {
        padding: spacing.s,
    },
    list: {
        padding: spacing.m,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: layout.borderRadius,
        marginBottom: spacing.m,
        marginRight: spacing.m, // Grid spacing
        ...shadows.card,
        overflow: 'hidden',
    },
    cardContent: {
        padding: spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.m,
    },
    iconText: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 18,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        ...typography.h2,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.label,
    },
    actions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editButton: {
        borderRightWidth: 1,
        borderRightColor: colors.border,
    },
    deleteButton: {},
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    deleteText: {
        color: colors.danger,
    },
    fab: {
        position: 'absolute',
        bottom: spacing.l,
        right: spacing.l,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.fab,
    },
    fabText: {
        fontSize: 32,
        color: '#fff',
        marginTop: -4,
    },
    modalBackground: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    activityIndicatorWrapper: {
        backgroundColor: '#FFFFFF',
        height: 120,
        width: 200,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        textAlign: 'center',
        color: colors.textPrimary,
        fontWeight: '600',
    },
    confirmModalContainer: {
        backgroundColor: colors.surface,
        width: '80%',
        maxWidth: 400,
        borderRadius: layout.borderRadius,
        padding: spacing.l,
        alignItems: 'center',
        ...shadows.card,
    },
    confirmTitle: {
        ...typography.h2,
        marginTop: spacing.m,
        marginBottom: spacing.s,
        textAlign: 'center',
    },
    confirmMessage: {
        ...typography.body,
        textAlign: 'center',
        marginBottom: spacing.l,
        color: colors.textSecondary,
    },
    confirmButtons: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: layout.borderRadius,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: colors.background,
        marginRight: spacing.m,
        borderWidth: 1,
        borderColor: colors.border,
    },
    deleteConfirmButton: {
        backgroundColor: colors.danger,
    },
    cancelButtonText: {
        color: colors.textPrimary,
        fontWeight: '600',
    },
    deleteButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        marginHorizontal: spacing.m,
        marginTop: spacing.s,
        marginBottom: spacing.m,
        paddingHorizontal: spacing.m,
        borderRadius: layout.borderRadius,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchIcon: {
        marginRight: spacing.s,
    },
    searchInput: {
        flex: 1,
        paddingVertical: spacing.s,
        fontSize: 16,
        color: colors.textPrimary,
    },
    clearButton: {
        padding: 4,
    },
});

export default ProjectListScreen;

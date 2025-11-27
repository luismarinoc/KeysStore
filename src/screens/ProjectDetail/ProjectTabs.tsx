import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { TabCategory, Environment, Credential } from '../../types';
import { useCredentials } from '../../context/CredentialContext';
import { RootStackParamList } from '../../../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, shadows, layout } from '../../theme';

type ProjectDetailRouteProp = RouteProp<RootStackParamList, 'ProjectDetail'>;
type ProjectDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProjectDetail'>;

const CredentialList = ({ category, environment, projectId }: { category: TabCategory; environment?: Environment; projectId: string }) => {
    const navigation = useNavigation<ProjectDetailNavigationProp>();
    const { getCredentialsByProject, deleteCredential } = useCredentials();
    const [deleteConfirmation, setDeleteConfirmation] = React.useState<{
        visible: boolean;
        id: string;
    }>({ visible: false, id: '' });

    const credentials = getCredentialsByProject(projectId).filter(c =>
        c.tab_category === category && (!environment || c.environment === environment)
    );

    const handleDelete = (id: string) => {
        setDeleteConfirmation({ visible: true, id });
    };

    const confirmDelete = async () => {
        try {
            await deleteCredential(deleteConfirmation.id);
            setDeleteConfirmation({ visible: false, id: '' });
        } catch (error) {
            console.error('Error deleting credential:', error);
            Alert.alert('Error', 'Failed to delete credential.');
        }
    };

    const copyToClipboard = async (text: string, label: string) => {
        await Clipboard.setStringAsync(text);
        // Optional: Toast or small feedback
    };

    const renderItem = ({ item }: { item: Credential }) => (
        <View style={styles.card}>
            <TouchableOpacity
                style={styles.cardContent}
                onPress={() => navigation.navigate('CredentialForm', { credential: item })}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {item.instance_number && <Text style={styles.badge}>Inst: {item.instance_number}</Text>}
                    {item.mandt && <Text style={[styles.badge, { marginLeft: 4 }]}>Mandt: {item.mandt}</Text>}
                    <View style={{ flex: 1 }} />
                    <Ionicons
                        name={item.is_synced ? "checkmark-circle" : "cloud-upload-outline"}
                        size={16}
                        color={item.is_synced ? colors.success : colors.warning}
                        style={{ marginLeft: 8 }}
                    />
                </View>

                {item.username && (
                    <View style={styles.row}>
                        <Text style={styles.label}>User:</Text>
                        <Text style={styles.value}>{item.username}</Text>
                        <TouchableOpacity onPress={() => copyToClipboard(item.username!, 'Username')} style={styles.iconButton}>
                            <Ionicons name="copy-outline" size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                )}

                {item.password_encrypted && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Pass:</Text>
                        <Text style={styles.value}>********</Text>
                        <TouchableOpacity onPress={() => copyToClipboard(item.password_encrypted!, 'Password')} style={styles.iconButton}>
                            <Ionicons name="copy-outline" size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                )}

                {item.psk_encrypted && (
                    <View style={styles.row}>
                        <Text style={styles.label}>PSK:</Text>
                        <Text style={styles.value}>********</Text>
                        <TouchableOpacity onPress={() => copyToClipboard(item.psk_encrypted!, 'PSK')} style={styles.iconButton}>
                            <Ionicons name="copy-outline" size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                )}

                {item.host_address && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Host:</Text>
                        <Text style={styles.value}>{item.host_address}</Text>
                        <TouchableOpacity onPress={() => copyToClipboard(item.host_address!, 'Host')} style={styles.iconButton}>
                            <Ionicons name="copy-outline" size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                )}

                {item.ssid && (
                    <View style={styles.row}>
                        <Text style={styles.label}>SSID:</Text>
                        <Text style={styles.value}>{item.ssid}</Text>
                        <TouchableOpacity onPress={() => copyToClipboard(item.ssid!, 'SSID')} style={styles.iconButton}>
                            <Ionicons name="copy-outline" size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={credentials}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No credentials found</Text>
                        <Text style={styles.emptySubText}>Tap + to add a new one</Text>
                    </View>
                }
            />
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CredentialForm', { projectId, category, environment })}
            >
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>

            {/* Delete Confirmation Modal */}
            <Modal
                transparent={true}
                animationType="fade"
                visible={deleteConfirmation.visible}
                onRequestClose={() => setDeleteConfirmation({ visible: false, id: '' })}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.confirmModalContainer}>
                        <Ionicons name="warning-outline" size={48} color={colors.danger} />
                        <Text style={styles.confirmTitle}>Delete Credential?</Text>
                        <Text style={styles.confirmMessage}>
                            This will permanently delete this credential. This action cannot be undone.
                        </Text>
                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                style={[styles.confirmButton, styles.cancelButton]}
                                onPress={() => setDeleteConfirmation({ visible: false, id: '' })}
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
        </View>
    );
};

const Tab = createMaterialTopTabNavigator();

const ProjectTabs = () => {
    const route = useRoute<ProjectDetailRouteProp>();
    const { project } = route.params;

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarLabelStyle: { fontSize: 13, fontWeight: '600', textTransform: 'none' },
                tabBarItemStyle: { width: 'auto', paddingHorizontal: 20 },
                tabBarScrollEnabled: true,
                tabBarStyle: { backgroundColor: colors.surface, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: colors.border },
                tabBarIndicatorStyle: { backgroundColor: colors.primary, height: 3, borderRadius: 1.5 },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
            }}
        >
            <Tab.Screen name="DEV">
                {() => <CredentialList category="APP" environment="DEV" projectId={project.id} />}
            </Tab.Screen>
            <Tab.Screen name="QAS">
                {() => <CredentialList category="APP" environment="QAS" projectId={project.id} />}
            </Tab.Screen>
            <Tab.Screen name="PRD">
                {() => <CredentialList category="APP" environment="PRD" projectId={project.id} />}
            </Tab.Screen>
            <Tab.Screen name="WIFI">
                {() => <CredentialList category="WIFI" projectId={project.id} />}
            </Tab.Screen>
            <Tab.Screen name="VPN">
                {() => <CredentialList category="VPN" projectId={project.id} />}
            </Tab.Screen>
            <Tab.Screen name="NOTAS">
                {() => <CredentialList category="NOTE" projectId={project.id} />}
            </Tab.Screen>
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    list: {
        padding: spacing.m,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: layout.borderRadius,
        marginBottom: spacing.s,
        padding: spacing.m,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.card,
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
        flexWrap: 'wrap',
    },
    cardTitle: {
        ...typography.h2,
        fontSize: 16,
        marginRight: spacing.s,
    },
    badge: {
        backgroundColor: colors.primaryLight,
        color: colors.primary,
        fontSize: 12,
        fontWeight: '600',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    label: {
        ...typography.label,
        fontSize: 13,
        marginRight: 4,
        width: 40,
    },
    value: {
        fontSize: 13,
        color: colors.textPrimary,
    },
    iconButton: {
        padding: 4,
        marginLeft: 4,
    },
    deleteButton: {
        padding: spacing.s,
        marginLeft: spacing.s,
        opacity: 0.6,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: spacing.xl * 2,
    },
    emptyText: {
        ...typography.h2,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    emptySubText: {
        ...typography.body,
        color: colors.textSecondary,
        opacity: 0.7,
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
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
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
});

export default ProjectTabs;

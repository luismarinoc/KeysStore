import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { TabCategory, Environment, Credential } from '../../types';
import { useCredentials } from '../../context/CredentialContext';
import { RootStackParamList } from '../../../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Layout } from '../../components/Layout';
import { colors, spacing, typography, shadows, layout } from '../../theme';

type ProjectDetailRouteProp = RouteProp<RootStackParamList, 'ProjectDetail'>;
type ProjectDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProjectDetail'>;

const CredentialItem = ({
    item,
    onDelete,
    navigation,
    copyToClipboard
}: {
    item: Credential;
    onDelete: (id: string) => void;
    navigation: any;
    copyToClipboard: (text: string, label: string) => void;
}) => {
    const [showPassword, setShowPassword] = React.useState(false);

    // Determine icon based on category/type
    let iconName: keyof typeof Ionicons.glyphMap = 'key-outline';
    if (item.tab_category === 'WIFI') iconName = 'wifi';
    else if (item.tab_category === 'VPN') iconName = 'shield-checkmark-outline';
    else if (item.tab_category === 'NOTE') iconName = 'document-text-outline';
    else if (item.tab_category === 'APP') iconName = 'server-outline';

    // Determine environment color
    const envColor = item.environment && item.environment !== 'NONE'
        ? colors.env[item.environment]
        : colors.env.NONE;

    return (
        <View style={[styles.card, { borderColor: envColor.border }]}>
            <TouchableOpacity
                style={styles.cardContent}
                onPress={() => navigation.navigate('CredentialForm', { credential: item })}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: envColor.bg }]}>
                        <Ionicons name={iconName} size={20} color={envColor.text} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <View style={styles.badgesContainer}>
                            {item.environment && item.environment !== 'NONE' && (
                                <View style={[styles.pill, { backgroundColor: envColor.bg, borderColor: envColor.border }]}>
                                    <Text style={[styles.pillText, { color: envColor.text }]}>{item.environment}</Text>
                                </View>
                            )}
                            {item.instance_number && (
                                <View style={styles.pill}>
                                    <Text style={styles.pillText}>Inst: {item.instance_number}</Text>
                                </View>
                            )}
                            {item.mandt && (
                                <View style={styles.pill}>
                                    <Text style={styles.pillText}>Mandt: {item.mandt}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <Ionicons
                        name={item.is_synced ? "checkmark-circle" : "cloud-upload-outline"}
                        size={18}
                        color={item.is_synced ? colors.success : colors.warning}
                        style={{ marginLeft: 8 }}
                    />
                </View>

                {item.note_content && item.tab_category === 'NOTE' ? (
                    <Text style={styles.notePreview} numberOfLines={3}>
                        {item.note_content}
                    </Text>
                ) : (
                    <View style={styles.detailsContainer}>
                        {item.username && (
                            <View style={styles.detailRow}>
                                <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                                <Text style={styles.detailText}>{item.username}</Text>
                                <TouchableOpacity onPress={() => copyToClipboard(item.username!, 'Username')} style={styles.copyButton}>
                                    <Ionicons name="copy-outline" size={14} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Password Field */}
                        {item.password_encrypted && (
                            <View style={styles.detailRow}>
                                <Ionicons name="lock-closed-outline" size={14} color={colors.textSecondary} />
                                <Text style={[styles.detailText, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
                                    {showPassword ? item.password_encrypted : '••••••••'}
                                </Text>
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.copyButton}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={14} color={colors.textSecondary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => copyToClipboard(item.password_encrypted!, 'Password')} style={styles.copyButton}>
                                    <Ionicons name="copy-outline" size={14} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                        )}

                        {item.host_address && (
                            <View style={styles.detailRow}>
                                <Ionicons name="desktop-outline" size={14} color={colors.textSecondary} />
                                <Text style={styles.detailText}>{item.host_address}</Text>
                                <TouchableOpacity onPress={() => copyToClipboard(item.host_address!, 'Host')} style={styles.copyButton}>
                                    <Ionicons name="copy-outline" size={14} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(item.id)}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
        </View>
    );
};

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

    const renderItem = ({ item }: { item: Credential }) => {
        return (
            <CredentialItem
                item={item}
                onDelete={handleDelete}
                navigation={navigation}
                copyToClipboard={copyToClipboard}
            />
        );
    };

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
                <Ionicons name="add" size={32} color="#fff" />
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
    const navigation = useNavigation();
    const route = useRoute<ProjectDetailRouteProp>();
    const { project } = route.params;

    return (
        <Layout title={project.name} showBack onBack={() => navigation.goBack()}>
            <View style={{ flex: 1, width: '100%' }}>
                <Tab.Navigator
                    sceneContainerStyle={{ backgroundColor: colors.background }}
                    screenOptions={{
                        tabBarLabelStyle: {
                            fontFamily: 'Inter_600SemiBold',
                            fontSize: 13,
                            textTransform: 'none'
                        },
                        tabBarItemStyle: { width: 'auto', paddingHorizontal: 16 },
                        tabBarScrollEnabled: true,
                        tabBarStyle: {
                            backgroundColor: colors.background,
                            elevation: 0,
                            shadowOpacity: 0,
                            borderBottomWidth: 0,
                            marginBottom: spacing.s
                        },
                        tabBarIndicatorStyle: {
                            backgroundColor: colors.primary,
                            height: 3,
                            borderRadius: 1.5,
                            bottom: -1
                        },
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
            </View>
        </Layout>
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
        marginBottom: spacing.m,
        padding: spacing.m,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.soft,
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.s,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.m,
    },
    cardTitle: {
        ...typography.h3,
        fontSize: 16,
        marginBottom: 4,
    },
    badgesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    pill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
    },
    pillText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    detailsContainer: {
        marginLeft: 36 + spacing.m, // Align with title (icon width + margin)
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    detailText: {
        ...typography.body,
        fontSize: 13,
        color: colors.textSecondary,
        marginLeft: 6,
        marginRight: 8,
    },
    copyButton: {
        padding: 4,
    },
    notePreview: {
        ...typography.body,
        fontSize: 13,
        color: colors.textSecondary,
        marginLeft: 36 + spacing.m,
        marginTop: 4,
        fontStyle: 'italic',
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
        bottom: spacing.xl,
        right: spacing.xl,
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

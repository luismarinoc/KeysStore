import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, typography, layout, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';

interface LayoutProps {
    children: React.ReactNode;
    title?: string;
    showBack?: boolean;
    onBack?: () => void;
    actions?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
    children,
    title,
    showBack,
    onBack,
    actions
}) => {
    const insets = useSafeAreaInsets();
    const { user, signOut } = useAuth();
    const { isReadOnlyMode, isSupabaseAvailable, lastSyncTime, syncStatus, refresh } = useOffline();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Modern Topbar */}
            <View style={styles.topbar}>
                <View style={styles.leftSection}>
                    {showBack && (
                        <TouchableOpacity onPress={onBack} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                    )}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoIcon}>
                            <Ionicons name="key" size={18} color="#FFF" />
                        </View>
                        <Text style={styles.logoText}>KeyStore</Text>
                    </View>
                    {title && (
                        <>
                            <View style={styles.divider} />
                            <Text style={styles.pageTitle}>{title}</Text>
                        </>
                    )}
                </View>

                <View style={styles.rightSection}>
                    {actions}

                    {/* Persistent Status Indicator */}
                    <View style={[styles.statusIndicator, isReadOnlyMode ? styles.statusOffline : styles.statusOnline]}>
                        <View style={[styles.statusDot, { backgroundColor: isReadOnlyMode ? colors.danger : colors.success }]} />
                        <Text style={[styles.statusText, { color: isReadOnlyMode ? colors.danger : colors.success }]}>
                            {isReadOnlyMode ? 'Offline' : 'Online'}
                        </Text>
                    </View>

                    {user && (
                        <View style={styles.userProfile}>
                            {user.user_metadata?.avatar_url ? (
                                <Image
                                    source={{ uri: user.user_metadata.avatar_url }}
                                    style={styles.avatarImage}
                                />
                            ) : (
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {user.email?.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                            <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
                                <Ionicons name="log-out-outline" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

            {/* Connection Status Banner */}
            {isReadOnlyMode && (
                <View style={styles.offlineBanner}>
                    <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
                    <Text style={styles.offlineText}>
                        Offline Mode - Viewing cached data only
                    </Text>
                    {lastSyncTime && (
                        <Text style={styles.offlineSubtext}>
                            Last synced: {new Date(lastSyncTime).toLocaleTimeString()}
                        </Text>
                    )}
                    <TouchableOpacity onPress={refresh} style={styles.retryButton}>
                        <Ionicons name="refresh-outline" size={14} color={colors.primary} />
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            {syncStatus === 'syncing' && (
                <View style={[styles.offlineBanner, styles.syncingBanner]}>
                    <Ionicons name="sync-outline" size={16} color={colors.primary} />
                    <Text style={styles.syncingText}>Syncing...</Text>
                </View>
            )}

            {/* Main Content */}
            <View style={styles.content}>
                <View style={styles.contentContainer}>
                    {children}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    topbar: {
        height: layout.headerHeight,
        backgroundColor: colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.l,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        ...shadows.soft,
        zIndex: 10,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.m,
    },
    backButton: {
        padding: spacing.xs,
        marginRight: spacing.xs,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
    },
    logoIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoText: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: colors.border,
        marginHorizontal: spacing.s,
    },
    pageTitle: {
        ...typography.body,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.m,
    },
    userProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
        paddingLeft: spacing.m,
        borderLeftWidth: 1,
        borderLeftColor: colors.border,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.primary,
    },
    avatarImage: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    avatarText: {
        ...typography.label,
        color: colors.primary,
        fontWeight: '600',
    },
    logoutButton: {
        padding: spacing.xs,
    },
    offlineBanner: {
        backgroundColor: '#FFF4E5',
        borderBottomWidth: 1,
        borderBottomColor: colors.warning,
        paddingVertical: spacing.s,
        paddingHorizontal: spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
    },
    syncingBanner: {
        backgroundColor: '#E5F2FF',
        borderBottomColor: colors.primary,
    },
    offlineText: {
        ...typography.label,
        color: colors.textPrimary,
        flex: 1,
    },
    offlineSubtext: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    syncingText: {
        ...typography.label,
        color: colors.textPrimary,
        flex: 1,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.s,
        paddingVertical: 4,
        backgroundColor: colors.primaryLight,
        borderRadius: 4,
    },
    retryText: {
        ...typography.caption,
        color: colors.primary,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        alignItems: 'center', // Center content for large screens
    },
    contentContainer: {
        flex: 1,
        width: '100%',
        maxWidth: layout.maxWidth,
        padding: spacing.l,
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    statusOnline: {
        backgroundColor: '#ECFDF5', // Emerald 50
        borderColor: '#A7F3D0', // Emerald 200
    },
    statusOffline: {
        backgroundColor: '#FEF2F2', // Red 50
        borderColor: '#FECACA', // Red 200
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        fontFamily: typography.fontFamily,
    },
});

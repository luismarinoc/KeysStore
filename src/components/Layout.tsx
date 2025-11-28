import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, typography, layout, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';

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

                    {user && (
                        <View style={styles.userProfile}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {user.email?.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
                                <Ionicons name="log-out-outline" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

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
    avatarText: {
        ...typography.label,
        color: colors.primary,
        fontWeight: '600',
    },
    logoutButton: {
        padding: spacing.xs,
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
});

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, typography, layout, shadows } from '../theme';

export default function LoginScreen() {
    const { signInWithGoogle } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        try {
            console.log('Button pressed');
            // Alert.alert('Debug', 'Button pressed'); // Uncomment if needed for mobile
            setLoading(true);
            await signInWithGoogle();
        } catch (error: any) {
            console.error('Login error:', error);
            Alert.alert('Error', error.message || 'Failed to sign in with Google');
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Ionicons name="key" size={80} color={colors.primary} style={styles.icon} />

                <Text style={styles.title}>KeyStore</Text>
                <Text style={styles.subtitle}>Secure Credential Management</Text>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleGoogleSignIn}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="logo-google" size={24} color="#fff" style={styles.buttonIcon} />
                            <Text style={styles.buttonText}>Sign in with Google</Text>
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.footer}>
                    Your credentials are encrypted and stored securely
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.l,
    },
    content: {
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    icon: {
        marginBottom: spacing.l,
    },
    title: {
        ...typography.h1,
        fontSize: 32,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.xl * 2,
        textAlign: 'center',
    },
    button: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.m,
        borderRadius: layout.borderRadius,
        width: '100%',
        ...shadows.card,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonIcon: {
        marginRight: spacing.s,
    },
    buttonText: {
        ...typography.button,
        color: '#fff',
        fontSize: 16,
    },
    footer: {
        ...typography.label,
        color: colors.textSecondary,
        marginTop: spacing.xl,
        textAlign: 'center',
    },
});

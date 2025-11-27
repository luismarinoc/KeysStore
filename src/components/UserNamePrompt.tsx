import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { getUserName, setUserName, isUserNameConfigured } from '../services/userSettings';
import { colors, spacing, typography, layout } from '../theme';

interface UserNamePromptProps {
    onComplete: () => void;
}

export const UserNamePrompt: React.FC<UserNamePromptProps> = ({ onComplete }) => {
    const [visible, setVisible] = useState(false);
    const [name, setName] = useState('');

    useEffect(() => {
        checkUserName();
    }, []);

    const checkUserName = async () => {
        const configured = await isUserNameConfigured();
        if (!configured) {
            setVisible(true);
        } else {
            onComplete();
        }
    };

    const handleSave = async () => {
        if (name.trim()) {
            await setUserName(name.trim());
            setVisible(false);
            onComplete();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={() => { }}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Configuración Inicial</Text>
                    <Text style={styles.subtitle}>
                        Por favor, ingresa tu nombre para identificar tus registros
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Tu nombre"
                        value={name}
                        onChangeText={setName}
                        autoFocus
                        onSubmitEditing={handleSave}
                    />

                    <TouchableOpacity
                        style={[styles.button, !name.trim() && styles.buttonDisabled]}
                        onPress={handleSave}
                        disabled={!name.trim()}
                    >
                        <Text style={styles.buttonText}>Guardar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.l,
    },
    container: {
        backgroundColor: colors.surface,
        borderRadius: layout.borderRadius,
        padding: spacing.l,
        width: '100%',
        maxWidth: 400,
    },
    title: {
        ...typography.h1,
        marginBottom: spacing.s,
        textAlign: 'center',
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.l,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: layout.borderRadius,
        padding: spacing.m,
        fontSize: 16,
        marginBottom: spacing.l,
    },
    button: {
        backgroundColor: colors.primary,
        padding: spacing.m,
        borderRadius: layout.borderRadius,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        ...typography.button,
        color: '#fff',
    },
});

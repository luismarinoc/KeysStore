import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useCredentials } from '../../context/CredentialContext';
import { RootStackParamList } from '../../../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TabCategory, Environment } from '../../types';
import { colors, spacing, typography, layout } from '../../theme';

type CredentialFormScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CredentialForm'>;
type CredentialFormScreenRouteProp = RouteProp<RootStackParamList, 'CredentialForm'>;

const CredentialFormScreen = () => {
    const navigation = useNavigation<CredentialFormScreenNavigationProp>();
    const route = useRoute<CredentialFormScreenRouteProp>();
    const { addCredential, updateCredential } = useCredentials();

    const { projectId, category, environment, credential } = route.params || {};

    // Determine the effective category and environment
    const effectiveCategory = category || credential?.tab_category;
    const effectiveEnvironment = environment || credential?.environment;

    const [title, setTitle] = useState(credential?.title || '');
    const [username, setUsername] = useState(credential?.username || '');
    const [password, setPassword] = useState(credential?.password_encrypted || '');
    const [host, setHost] = useState(credential?.host_address || '');
    const [saprouter, setSaprouter] = useState(credential?.saprouter_string || '');
    const [ssid, setSsid] = useState(credential?.ssid || '');
    const [psk, setPsk] = useState(credential?.psk_encrypted || '');
    const [note, setNote] = useState(credential?.note_content || '');
    const [selectedEnv, setSelectedEnv] = useState<Environment>(credential?.environment || effectiveEnvironment || 'NONE');

    useEffect(() => {
        navigation.setOptions({
            title: credential ? 'Edit Credential' : `New ${effectiveCategory}`,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.primary,
            headerTitleStyle: { fontWeight: 'bold' },
        });
    }, [navigation, credential, effectiveCategory]);

    const [instance, setInstance] = useState(credential?.instance_number || '');
    const [mandt, setMandt] = useState(credential?.mandt || '');

    const handleSave = () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Title is required');
            return;
        }

        const data: any = {
            project_id: projectId || credential?.project_id,
            tab_category: effectiveCategory,
            environment: selectedEnv,
            title,
        };

        if (effectiveCategory === 'APP') {
            data.host_address = host;
            data.username = username;
            data.password_encrypted = password;
            data.saprouter_string = saprouter;
            data.instance_number = instance;
            data.mandt = mandt;
        } else if (effectiveCategory === 'WIFI') {
            data.ssid = ssid;
            data.psk_encrypted = psk;
            data.environment = 'NONE';
        } else if (effectiveCategory === 'VPN') {
            data.host_address = host;
            data.username = username;
            data.psk_encrypted = psk;
            data.environment = 'NONE';
        } else if (effectiveCategory === 'NOTE') {
            data.note_content = note;
            data.environment = 'NONE';
        }

        if (credential) {
            updateCredential(credential.id, data);
        } else {
            addCredential(data);
        }
        navigation.goBack();
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.formGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Main Server, Office WiFi"
                    placeholderTextColor={colors.textSecondary}
                />
            </View>

            {effectiveCategory === 'APP' && (
                <>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Environment *</Text>
                        <View style={styles.envContainer}>
                            {(['DEV', 'QAS', 'PRD'] as Environment[]).map((env) => (
                                <TouchableOpacity
                                    key={env}
                                    style={[styles.envButton, selectedEnv === env && styles.envButtonSelected]}
                                    onPress={() => setSelectedEnv(env)}
                                >
                                    <Text style={[styles.envText, selectedEnv === env && styles.envTextSelected]}>{env}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Username" placeholderTextColor={colors.textSecondary} />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry placeholderTextColor={colors.textSecondary} />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Host / URL</Text>
                        <TextInput style={styles.input} value={host} onChangeText={setHost} placeholder="192.168.1.1 or app.domain.com" placeholderTextColor={colors.textSecondary} />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>SAP Router (Optional)</Text>
                        <TextInput style={styles.input} value={saprouter} onChangeText={setSaprouter} placeholder="/H/..." placeholderTextColor={colors.textSecondary} />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: spacing.m }]}>
                            <Text style={styles.label}>Instance (00)</Text>
                            <TextInput
                                style={styles.input}
                                value={instance}
                                onChangeText={setInstance}
                                placeholder="00"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="numeric"
                                maxLength={2}
                            />
                        </View>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Mandt (000)</Text>
                            <TextInput
                                style={styles.input}
                                value={mandt}
                                onChangeText={setMandt}
                                placeholder="100"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="numeric"
                                maxLength={3}
                            />
                        </View>
                    </View>
                </>
            )}

            {effectiveCategory === 'WIFI' && (
                <>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>SSID</Text>
                        <TextInput style={styles.input} value={ssid} onChangeText={setSsid} placeholder="WiFi Name" placeholderTextColor={colors.textSecondary} />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Password (PSK)</Text>
                        <TextInput style={styles.input} value={psk} onChangeText={setPsk} placeholder="WiFi Password" secureTextEntry placeholderTextColor={colors.textSecondary} />
                    </View>
                </>
            )}

            {effectiveCategory === 'VPN' && (
                <>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Host / Gateway</Text>
                        <TextInput style={styles.input} value={host} onChangeText={setHost} placeholder="vpn.domain.com" placeholderTextColor={colors.textSecondary} />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Username" placeholderTextColor={colors.textSecondary} />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Pre-Shared Key (PSK)</Text>
                        <TextInput style={styles.input} value={psk} onChangeText={setPsk} placeholder="Secret Key" secureTextEntry placeholderTextColor={colors.textSecondary} />
                    </View>
                </>
            )}

            {effectiveCategory === 'NOTE' && (
                <>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Content</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={note}
                            onChangeText={setNote}
                            placeholder="Write your note here..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            numberOfLines={4}
                        />
                    </View>
                </>
            )}

            <TouchableOpacity style={styles.button} onPress={handleSave}>
                <Text style={styles.buttonText}>{credential ? 'Update Credential' : 'Create Credential'}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.l,
    },
    formGroup: {
        marginBottom: spacing.m,
    },
    label: {
        ...typography.label,
        marginBottom: spacing.xs,
        color: colors.textPrimary,
    },
    input: {
        height: layout.inputHeight,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: layout.borderRadius,
        paddingHorizontal: spacing.m,
        fontSize: 16,
        backgroundColor: colors.surface,
        color: colors.textPrimary,
    },
    textArea: {
        height: 120,
        paddingTop: spacing.m,
        textAlignVertical: 'top',
    },
    button: {
        backgroundColor: colors.primary,
        height: layout.inputHeight,
        borderRadius: layout.borderRadius,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.l,
        marginBottom: spacing.xl,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        ...typography.button,
    },
    envContainer: {
        flexDirection: 'row',
    },
    envButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.primary,
        marginRight: spacing.s,
        backgroundColor: colors.surface,
    },
    envButtonSelected: {
        backgroundColor: colors.primary,
    },
    envText: {
        color: colors.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    envTextSelected: {
        color: '#fff',
    },
    row: {
        flexDirection: 'row',
    },
});

export default CredentialFormScreen;

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useCredentials } from '../../context/CredentialContext';
import { RootStackParamList } from '../../../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TabCategory, Environment } from '../../types';
import { Layout } from '../../components/Layout';
import { colors, spacing, typography, shadows, layout } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';

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

    // Removed useEffect for navigation options as Layout handles the header

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
        <Layout
            title={credential ? 'Editar Credencial' : `Nuevo ${effectiveCategory}`}
            showBack
            onBack={() => navigation.goBack()}
        >
            <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
                                {(['DEV', 'QAS', 'PRD'] as Environment[]).map((env) => {
                                    const isSelected = selectedEnv === env;
                                    const envColor = colors.env[env];
                                    return (
                                        <TouchableOpacity
                                            key={env}
                                            style={[
                                                styles.envButton,
                                                isSelected && { backgroundColor: envColor.bg, borderColor: envColor.border },
                                                !isSelected && { borderColor: colors.border }
                                            ]}
                                            onPress={() => setSelectedEnv(env)}
                                        >
                                            <Text style={[
                                                styles.envText,
                                                isSelected && { color: envColor.text },
                                                !isSelected && { color: colors.textSecondary }
                                            ]}>{env}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
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

                {
                    effectiveCategory === 'NOTE' && (
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
                    )
                }

                <TouchableOpacity onPress={handleSave}>
                    <LinearGradient
                        colors={colors.gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.button}
                    >
                        <Text style={styles.buttonText}>{credential ? 'Update Credential' : 'Create Credential'}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </Layout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        ...shadows.soft,
    },
    textArea: {
        height: 120,
        paddingTop: spacing.m,
        textAlignVertical: 'top',
    },
    button: {
        height: layout.inputHeight,
        borderRadius: layout.borderRadius,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.l,
        marginBottom: spacing.xl,
        ...shadows.medium,
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
        marginRight: spacing.s,
        backgroundColor: colors.surface,
        ...shadows.soft,
    },
    envText: {
        fontWeight: '600',
        fontSize: 14,
    },
    row: {
        flexDirection: 'row',
    },
});

export default CredentialFormScreen;

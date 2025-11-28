import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useProjects } from '../context/ProjectContext';
import { RootStackParamList } from '../../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Layout } from '../components/Layout';
import { colors, spacing, typography, shadows, layout } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

type ProjectFormScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProjectForm'>;
type ProjectFormScreenRouteProp = RouteProp<RootStackParamList, 'ProjectForm'>;

const ProjectFormScreen = () => {
    const navigation = useNavigation<ProjectFormScreenNavigationProp>();
    const route = useRoute<ProjectFormScreenRouteProp>();
    const { addProject, updateProject } = useProjects();
    const projectToEdit = route.params?.project;

    const [name, setName] = useState(projectToEdit?.name || '');
    const [logoUrl, setLogoUrl] = useState(projectToEdit?.logo_url || '');

    // Removed useEffect for navigation options as Layout handles the header

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Project name is required');
            return;
        }

        if (projectToEdit) {
            updateProject(projectToEdit.id, { name, logo_url: logoUrl });
        } else {
            addProject({ name, logo_url: logoUrl });
        }
        navigation.goBack();
    };

    return (
        <Layout
            title={projectToEdit ? 'Edit Project' : 'New Project'}
            showBack
            onBack={() => navigation.goBack()}
        >
            <View style={styles.container}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Project Name *</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Ex: SAP ERP"
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Logo URL (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={logoUrl}
                        onChangeText={setLogoUrl}
                        placeholder="https://example.com/logo.png"
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                <TouchableOpacity onPress={handleSave}>
                    <LinearGradient
                        colors={colors.gradients.primary as [string, string, ...string[]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.button}
                    >
                        <Text style={styles.buttonText}>{projectToEdit ? 'Update' : 'Create'}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </Layout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
});

export default ProjectFormScreen;

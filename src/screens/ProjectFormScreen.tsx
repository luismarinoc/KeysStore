import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useProjects } from '../context/ProjectContext';
import { RootStackParamList } from '../../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ProjectFormScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProjectForm'>;
type ProjectFormScreenRouteProp = RouteProp<RootStackParamList, 'ProjectForm'>;

const ProjectFormScreen = () => {
    const navigation = useNavigation<ProjectFormScreenNavigationProp>();
    const route = useRoute<ProjectFormScreenRouteProp>();
    const { addProject, updateProject } = useProjects();
    const projectToEdit = route.params?.project;

    const [name, setName] = useState(projectToEdit?.name || '');
    const [logoUrl, setLogoUrl] = useState(projectToEdit?.logo_url || '');

    useEffect(() => {
        navigation.setOptions({
            title: projectToEdit ? 'Edit Project' : 'New Project',
        });
    }, [navigation, projectToEdit]);

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
        <View style={styles.container}>
            <Text style={styles.label}>Project Name *</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: SAP ERP"
            />

            <Text style={styles.label}>Logo URL (Optional)</Text>
            <TextInput
                style={styles.input}
                value={logoUrl}
                onChangeText={setLogoUrl}
                placeholder="https://example.com/logo.png"
            />

            <TouchableOpacity style={styles.button} onPress={handleSave}>
                <Text style={styles.buttonText}>{projectToEdit ? 'Update' : 'Create'}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: '#f9f9f9',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ProjectFormScreen;

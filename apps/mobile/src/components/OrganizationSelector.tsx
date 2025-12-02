import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { getOrganizationService, getDataStore } from '@keysstore/sdk-client';
import type { Organization } from '@keysstore/shared-types';

interface OrganizationSelectorProps {
    onSelect: (org: Organization) => void;
}

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({ onSelect }) => {
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [newOrgName, setNewOrgName] = useState('');
    const [creating, setCreating] = useState(false);

    const orgService = getOrganizationService();

    useEffect(() => {
        loadOrganizations();
    }, []);

    const loadOrganizations = async () => {
        setLoading(true);
        try {
            const organizations = await orgService.listOrganizations();
            setOrgs(organizations);

            // Auto-select if only one exists or if one is already stored
            const storedOrgId = await getDataStore().getCurrentOrganizationId();
            if (storedOrgId) {
                const storedOrg = organizations.find(o => o.id === storedOrgId);
                if (storedOrg) {
                    onSelect(storedOrg);
                }
            } else if (organizations.length === 1) {
                handleSelect(organizations[0]);
            }
        } catch (err: any) {
            console.error('Failed to load organizations', err);
            Alert.alert('Error', 'Failed to load organizations');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newOrgName.trim()) return;

        setCreating(true);
        try {
            // Simple slug generation
            const slug = newOrgName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const newOrg = await orgService.createOrganization(newOrgName, slug);
            setOrgs([...orgs, newOrg]);
            setNewOrgName('');
            handleSelect(newOrg);
        } catch (err: any) {
            console.error('Failed to create organization', err);
            Alert.alert('Error', 'Failed to create organization: ' + (err.message || ''));
        } finally {
            setCreating(false);
        }
    };

    const handleSelect = async (org: Organization) => {
        try {
            await orgService.switchOrganization(org.id);
            onSelect(org);
        } catch (err) {
            console.error('Failed to switch organization', err);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Loading organizations...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Select Organization</Text>

            <FlatList
                data={orgs}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.orgItem} onPress={() => handleSelect(item)}>
                        <Text style={styles.orgName}>{item.name}</Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No organizations found. Create one below.</Text>}
                style={styles.list}
            />

            <View style={styles.createContainer}>
                <Text style={styles.subtitle}>Create New Organization</Text>
                <TextInput
                    style={styles.input}
                    value={newOrgName}
                    onChangeText={setNewOrgName}
                    placeholder="Organization Name"
                    editable={!creating}
                />
                <TouchableOpacity
                    style={[styles.button, (!newOrgName.trim() || creating) && styles.buttonDisabled]}
                    onPress={handleCreate}
                    disabled={!newOrgName.trim() || creating}
                >
                    <Text style={styles.buttonText}>{creating ? 'Creating...' : 'Create'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
    },
    list: {
        flex: 1,
        marginBottom: 20,
    },
    orgItem: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    orgName: {
        fontSize: 16,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#666',
    },
    createContainer: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        padding: 10,
        marginBottom: 10,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 4,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

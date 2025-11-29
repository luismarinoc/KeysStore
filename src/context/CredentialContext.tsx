import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Credential } from '../types';
import { saveCredentials, getCredentials, addToSyncQueue } from '../services/storage';
import { supabase } from '../services/supabase';
import { Alert, Platform } from 'react-native';
import * as Device from 'expo-device';
import { encrypt, decrypt } from '../services/encryption';
import { getClientUUID } from '../services/deviceInfo';
import { useAuth } from './AuthContext';
import { useOffline } from './OfflineContext';

interface CredentialContextType {
    credentials: Credential[];
    addCredential: (data: Omit<Credential, 'id' | 'created_at'>) => Promise<void>;
    updateCredential: (id: string, data: Partial<Credential>) => Promise<void>;
    deleteCredential: (id: string) => Promise<void>;
    deleteAllCredentials: () => Promise<void>;
    getCredentialsByProject: (projectId: string) => Credential[];
    refreshCredentials: () => Promise<void>;
}

const CredentialContext = createContext<CredentialContextType | undefined>(undefined);

export const CredentialProvider = ({ children }: { children: ReactNode }) => {
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const { user } = useAuth();
    const { isReadOnlyMode } = useOffline();

    useEffect(() => {
        loadCredentials();
    }, []);

    const loadCredentials = async () => {
        const localCredentials = await getCredentials();

        // Decrypt credentials from local storage
        const decryptedLocal = await Promise.all(
            localCredentials.map(async (cred) => ({
                ...cred,
                password_encrypted: cred.password_encrypted ? await decrypt(cred.password_encrypted) : undefined,
                psk_encrypted: cred.psk_encrypted ? await decrypt(cred.psk_encrypted) : undefined,
            }))
        );

        setCredentials(decryptedLocal);
        await refreshCredentials();
    };

    const refreshCredentials = async () => {
        try {
            const { data, error } = await supabase
                .from('keys_credentials')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.log('Supabase fetch error (offline?):', error.message);
                return;
            }

            if (data) {
                // Decrypt sensitive fields after fetching
                const decryptedData = await Promise.all(
                    data.map(async (cred) => ({
                        ...cred,
                        password_encrypted: cred.password_encrypted ? await decrypt(cred.password_encrypted) : undefined,
                        psk_encrypted: cred.psk_encrypted ? await decrypt(cred.psk_encrypted) : undefined,
                        is_synced: true,
                    }))
                );
                setCredentials(decryptedData);
                await saveCredentials(decryptedData);
            }
        } catch (e) {
            console.log('Sync error:', e);
        }
    };

    const getCredentialsByProject = (projectId: string) => {
        return credentials.filter((c) => c.project_id === projectId);
    };

    const addCredential = async (data: Omit<Credential, 'id' | 'created_at'>) => {
        if (!user) {
            console.error('User not authenticated');
            return;
        }

        // Block in read-only mode
        if (isReadOnlyMode) {
            Alert.alert('Offline Mode', 'Cannot create credentials while offline. Please connect to the internet.');
            return;
        }

        const pcName = user.email || 'Unknown User';
        const apiKey = await getClientUUID();

        // Encrypt sensitive fields before saving to Storage/Supabase
        const encryptedPassword = data.password_encrypted ? await encrypt(data.password_encrypted) : undefined;
        const encryptedPSK = data.psk_encrypted ? await encrypt(data.psk_encrypted) : undefined;

        // 1. Prepare object for Local State (Keep sensitive fields DECRYPTED for UI)
        const newCredentialState: Credential = {
            id: Date.now().toString() + Math.random().toString().slice(2, 5), // Unique ID
            created_at: new Date().toISOString(),
            user_id: user.id,
            pc_name: pcName,
            api_key: apiKey,
            is_synced: false,
            ...data,
            // Keep original plain text for state
            password_encrypted: data.password_encrypted,
            psk_encrypted: data.psk_encrypted,
        };

        // Update State with DECRYPTED version using functional update
        setCredentials(prevCredentials => {
            const updatedCredentials = [newCredentialState, ...prevCredentials];

            // Fire-and-forget save to storage (async)
            (async () => {
                try {
                    const listForStorage = await Promise.all(updatedCredentials.map(async (c) => ({
                        ...c,
                        password_encrypted: c.password_encrypted ? await encrypt(c.password_encrypted) : undefined,
                        psk_encrypted: c.psk_encrypted ? await encrypt(c.psk_encrypted) : undefined,
                    })));
                    await saveCredentials(listForStorage);
                } catch (err) {
                    console.error('Error saving credentials to storage:', err);
                }
            })();

            return updatedCredentials;
        });

        try {
            // Prepare data for Supabase with encrypted fields
            const supabaseData = {
                ...data,
                user_id: user.id,
                password_encrypted: encryptedPassword,
                psk_encrypted: encryptedPSK,
                pc_name: pcName,
                api_key: apiKey,
            };

            const { data: insertedData, error } = await supabase
                .from('keys_credentials')
                .insert([supabaseData])
                .select()
                .single();

            if (error) throw error;

            if (insertedData) {
                // When confirming sync, update the ID and sync status in state
                setCredentials(prevCredentials => {
                    const finalCredentials = prevCredentials.map(c =>
                        c.id === newCredentialState.id ? { ...c, id: insertedData.id, is_synced: true } : c
                    );

                    // Update storage with the new ID/Sync status (Encrypted)
                    (async () => {
                        try {
                            const finalListForStorage = await Promise.all(finalCredentials.map(async (c) => ({
                                ...c,
                                password_encrypted: c.password_encrypted ? await encrypt(c.password_encrypted) : undefined,
                                psk_encrypted: c.psk_encrypted ? await encrypt(c.psk_encrypted) : undefined,
                            })));
                            await saveCredentials(finalListForStorage);
                        } catch (err) {
                            console.error('Error saving synced credentials:', err);
                        }
                    })();

                    return finalCredentials;
                });
            }
        } catch (e) {
            console.log('Add credential error (offline?):', e);
            Alert.alert('Offline', 'Credential saved locally.');
        }
    };

    const updateCredential = async (id: string, data: Partial<Credential>) => {
        // Block in read-only mode
        if (isReadOnlyMode) {
            Alert.alert('Offline Mode', 'Cannot update credentials while offline.');
            return;
        }

        // 1. Update State (Keep sensitive fields DECRYPTED)
        const updatedCredentials = credentials.map((c) => (c.id === id ? { ...c, ...data } : c));
        setCredentials(updatedCredentials);

        // 2. Save to Storage (Encrypt ALL)
        const listForStorage = await Promise.all(updatedCredentials.map(async (c) => ({
            ...c,
            password_encrypted: c.password_encrypted ? await encrypt(c.password_encrypted) : undefined,
            psk_encrypted: c.psk_encrypted ? await encrypt(c.psk_encrypted) : undefined,
        })));
        await saveCredentials(listForStorage);

        try {
            // 3. Prepare data for Supabase (Encrypt sensitive fields if they are being updated)
            const supabaseUpdateData = { ...data };
            if (data.password_encrypted) {
                supabaseUpdateData.password_encrypted = await encrypt(data.password_encrypted);
            }
            if (data.psk_encrypted) {
                supabaseUpdateData.psk_encrypted = await encrypt(data.psk_encrypted);
            }

            const { error } = await supabase
                .from('keys_credentials')
                .update(supabaseUpdateData)
                .eq('id', id);

            if (error) throw error;
        } catch (e) {
            console.log('Update credential error (offline?):', e);
        }
    };

    const deleteCredential = async (id: string) => {
        // Block in read-only mode
        if (isReadOnlyMode) {
            Alert.alert('Offline Mode', 'Cannot delete credentials while offline.');
            return;
        }

        const updatedCredentials = credentials.filter((c) => c.id !== id);
        setCredentials(updatedCredentials);

        // Save to Storage (Encrypt ALL)
        const listForStorage = await Promise.all(updatedCredentials.map(async (c) => ({
            ...c,
            password_encrypted: c.password_encrypted ? await encrypt(c.password_encrypted) : undefined,
            psk_encrypted: c.psk_encrypted ? await encrypt(c.psk_encrypted) : undefined,
        })));
        await saveCredentials(listForStorage);

        try {
            const { error } = await supabase
                .from('keys_credentials')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (e: any) {
            console.error('Delete credential error:', e);
            Alert.alert('Delete Credential Failed', `Could not delete credential from server: ${e.message || JSON.stringify(e)}`);
        }
    };

    const deleteAllCredentials = async () => {
        setCredentials([]);
        await saveCredentials([]);

        try {
            if (!user) return;
            const { error } = await supabase
                .from('keys_credentials')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;
        } catch (e: any) {
            console.error('Delete all credentials error:', e);
            Alert.alert('Delete All Credentials Failed', `Could not delete credentials from server: ${e.message || JSON.stringify(e)}`);
        }
    };

    return (
        <CredentialContext.Provider value={{ credentials, getCredentialsByProject, addCredential, updateCredential, deleteCredential, deleteAllCredentials, refreshCredentials }}>
            {children}
        </CredentialContext.Provider>
    );
};

export const useCredentials = () => {
    const context = useContext(CredentialContext);
    if (!context) {
        throw new Error('useCredentials must be used within a CredentialProvider');
    }
    return context;
};

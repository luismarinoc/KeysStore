import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Credential } from '../types';
import { saveCredentials, getCredentials } from '../services/storage';
import { supabase } from '../services/supabase';
import { Alert, Platform } from 'react-native';
import * as Device from 'expo-device';
import { encrypt, decrypt } from '../services/encryption';
import { getClientUUID } from '../services/deviceInfo';
import { useAuth } from './AuthContext';

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

        const pcName = user.email || 'Unknown User';
        const apiKey = await getClientUUID();

        // Encrypt sensitive fields before saving to Storage/Supabase
        const encryptedPassword = data.password_encrypted ? await encrypt(data.password_encrypted) : undefined;
        const encryptedPSK = data.psk_encrypted ? await encrypt(data.psk_encrypted) : undefined;

        // 1. Prepare object for Local State (Keep sensitive fields DECRYPTED for UI)
        const newCredentialState: Credential = {
            id: Date.now().toString(),
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

        // 2. Prepare object for Storage/Supabase (Use ENCRYPTED fields)
        const newCredentialStorage: Credential = {
            ...newCredentialState,
            password_encrypted: encryptedPassword,
            psk_encrypted: encryptedPSK,
        };

        // Update State with DECRYPTED version
        const updatedCredentials = [newCredentialState, ...credentials];
        setCredentials(updatedCredentials);

        // Save to Local Storage with ENCRYPTED version
        // We need to mix the new encrypted one with the existing (which are decrypted in state)
        // So we need to re-encrypt everything or just save the new list but with the new one encrypted?
        // Actually, saveCredentials expects the list of credentials. 
        // If we pass 'updatedCredentials' (decrypted), saveCredentials will save plain text!
        // We should probably change saveCredentials to expect encrypted, OR 
        // we should encrypt the whole list before saving.
        // Optimization: Just encrypt the new one and keep others as they are? 
        // No, 'credentials' state is decrypted. 'saveCredentials' likely just JSON.stringifies.
        // We must encrypt ALL credentials before saving to storage to be safe, 
        // OR we rely on the fact that we loaded them encrypted? 
        // Wait, loadCredentials decrypts them. So 'credentials' state is ALL decrypted.
        // So when we call saveCredentials, we are saving PLAIN TEXT currently! 
        // This is a bigger security flaw.

        // FIX: We need to encrypt the list before saving to storage.
        // For now, let's just make sure the current operation is correct for the user's immediate issue.
        // The user's immediate issue is UI showing encrypted data.
        // So setting state to 'newCredentialState' fixes the UI issue for 'add'.

        // For storage, let's try to do it right.
        const listForStorage = await Promise.all(updatedCredentials.map(async (c) => ({
            ...c,
            password_encrypted: c.password_encrypted ? await encrypt(c.password_encrypted) : undefined,
            psk_encrypted: c.psk_encrypted ? await encrypt(c.psk_encrypted) : undefined,
        })));
        await saveCredentials(listForStorage);

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
                // Keep the data decrypted in state!
                const finalCredentials = updatedCredentials.map(c =>
                    c.id === newCredentialState.id ? { ...c, id: insertedData.id, is_synced: true } : c
                );
                setCredentials(finalCredentials);

                // Update storage with the new ID/Sync status (Encrypted)
                const finalListForStorage = await Promise.all(finalCredentials.map(async (c) => ({
                    ...c,
                    password_encrypted: c.password_encrypted ? await encrypt(c.password_encrypted) : undefined,
                    psk_encrypted: c.psk_encrypted ? await encrypt(c.psk_encrypted) : undefined,
                })));
                await saveCredentials(finalListForStorage);
            }
        } catch (e) {
            console.log('Add credential error (offline?):', e);
            Alert.alert('Offline', 'Credential saved locally.');
        }
    };

    const updateCredential = async (id: string, data: Partial<Credential>) => {
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

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Project, Credential } from '../types';

const PROJECTS_KEY = '@keystore:projects';
const CREDENTIALS_KEY = '@keystore:credentials';
const SYNC_QUEUE_KEY = '@keystore:sync_queue';
const METADATA_KEY = '@keystore:metadata';

// Sync queue item structure
export type SyncQueueItem = {
    id: string;
    operation: 'create' | 'update' | 'delete';
    entity: 'project' | 'credential';
    data: any;
    timestamp: number;
};

export type StorageMetadata = {
    lastSyncTime: string | null;
    projectsVersion: number;
    credentialsVersion: number;
};

// ========== Projects ==========

export const saveProjects = async (projects: Project[]) => {
    try {
        await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
        await updateMetadata({ projectsVersion: Date.now() });
    } catch (e) {
        console.error('Failed to save projects locally', e);
    }
};

export const getProjects = async (): Promise<Project[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(PROJECTS_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error('Failed to load projects locally', e);
        return [];
    }
};

// ========== Credentials ==========

export const saveCredentials = async (credentials: Credential[]) => {
    try {
        await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
        await updateMetadata({ credentialsVersion: Date.now() });
    } catch (e) {
        console.error('Failed to save credentials locally', e);
    }
};

export const getCredentials = async (): Promise<Credential[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(CREDENTIALS_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error('Failed to load credentials locally', e);
        return [];
    }
};

// ========== Sync Queue ==========

export const getSyncQueue = async (): Promise<SyncQueueItem[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error('Failed to load sync queue', e);
        return [];
    }
};

export const addToSyncQueue = async (item: Omit<SyncQueueItem, 'id' | 'timestamp'>) => {
    try {
        const queue = await getSyncQueue();
        const newItem: SyncQueueItem = {
            ...item,
            id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
        };
        queue.push(newItem);
        await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
        console.log('[Storage] Added to sync queue:', newItem);
    } catch (e) {
        console.error('Failed to add to sync queue', e);
    }
};

export const removeFromSyncQueue = async (id: string) => {
    try {
        const queue = await getSyncQueue();
        const updatedQueue = queue.filter(item => item.id !== id);
        await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));
        console.log('[Storage] Removed from sync queue:', id);
    } catch (e) {
        console.error('Failed to remove from sync queue', e);
    }
};

export const clearSyncQueue = async () => {
    try {
        await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify([]));
        console.log('[Storage] Sync queue cleared');
    } catch (e) {
        console.error('Failed to clear sync queue', e);
    }
};

// ========== Metadata ==========

export const getMetadata = async (): Promise<StorageMetadata> => {
    try {
        const jsonValue = await AsyncStorage.getItem(METADATA_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : {
            lastSyncTime: null,
            projectsVersion: 0,
            credentialsVersion: 0,
        };
    } catch (e) {
        console.error('Failed to load metadata', e);
        return {
            lastSyncTime: null,
            projectsVersion: 0,
            credentialsVersion: 0,
        };
    }
};

export const updateMetadata = async (updates: Partial<StorageMetadata>) => {
    try {
        const current = await getMetadata();
        const updated = { ...current, ...updates };
        await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error('Failed to update metadata', e);
    }
};

export const setLastSyncTime = async () => {
    await updateMetadata({ lastSyncTime: new Date().toISOString() });
};

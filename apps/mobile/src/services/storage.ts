import { getDataStore, SyncQueueItem, StorageMetadata } from '@keysstore/sdk-client';
import { Project, Credential } from '@keysstore/shared-types';

export type { SyncQueueItem, StorageMetadata };

// ========== Projects ==========

export const saveProjects = async (projects: Project[]) => {
    return getDataStore().saveProjects(projects);
};

export const getProjects = async (): Promise<Project[]> => {
    return getDataStore().getProjects();
};

// ========== Credentials ==========

export const saveCredentials = async (credentials: Credential[]) => {
    return getDataStore().saveCredentials(credentials);
};

export const getCredentials = async (): Promise<Credential[]> => {
    return getDataStore().getCredentials();
};

// ========== Sync Queue ==========

export const getSyncQueue = async (): Promise<SyncQueueItem[]> => {
    return getDataStore().getSyncQueue();
};

export const addToSyncQueue = async (item: Omit<SyncQueueItem, 'id' | 'timestamp'>) => {
    return getDataStore().addToSyncQueue(item);
};

export const removeFromSyncQueue = async (id: string) => {
    return getDataStore().removeFromSyncQueue(id);
};

export const clearSyncQueue = async () => {
    return getDataStore().clearSyncQueue();
};

// ========== Metadata ==========

export const getMetadata = async (): Promise<StorageMetadata> => {
    return getDataStore().getMetadata();
};

export const updateMetadata = async (updates: Partial<StorageMetadata>) => {
    return getDataStore().updateMetadata(updates);
};

export const setLastSyncTime = async () => {
    return getDataStore().setLastSyncTime();
};

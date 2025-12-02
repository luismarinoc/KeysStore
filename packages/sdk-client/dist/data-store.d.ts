import { StorageAdapter } from './storage-adapter';
import { Project, Credential } from '@keysstore/shared-types';
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
export declare class DataStore {
    private storage;
    constructor(storage: StorageAdapter);
    saveProjects(projects: Project[]): Promise<void>;
    getProjects(): Promise<Project[]>;
    saveCredentials(credentials: Credential[]): Promise<void>;
    getCredentials(): Promise<Credential[]>;
    getSyncQueue(): Promise<SyncQueueItem[]>;
    addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp'>): Promise<void>;
    removeFromSyncQueue(id: string): Promise<void>;
    clearSyncQueue(): Promise<void>;
    getMetadata(): Promise<StorageMetadata>;
    updateMetadata(updates: Partial<StorageMetadata>): Promise<void>;
    setLastSyncTime(): Promise<void>;
    getUserName(): Promise<string | null>;
    setUserName(name: string): Promise<void>;
    getClientUUID(): Promise<string>;
    getCurrentOrganizationId(): Promise<string | null>;
    setCurrentOrganizationId(orgId: string): Promise<void>;
}

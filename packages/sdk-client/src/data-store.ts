import { StorageAdapter } from './storage-adapter';
import { Project, Credential } from '@keysstore/shared-types';

const PROJECTS_KEY = '@keystore:projects';
const CREDENTIALS_KEY = '@keystore:credentials';
const SYNC_QUEUE_KEY = '@keystore:sync_queue';
const METADATA_KEY = '@keystore:metadata';

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

export class DataStore {
    constructor(private storage: StorageAdapter) { }

    // ========== Projects ==========

    async saveProjects(projects: Project[]): Promise<void> {
        try {
            await this.storage.setItem(PROJECTS_KEY, JSON.stringify(projects));
            await this.updateMetadata({ projectsVersion: Date.now() });
        } catch (e) {
            console.error('Failed to save projects locally', e);
        }
    }

    async getProjects(): Promise<Project[]> {
        try {
            const jsonValue = await this.storage.getItem(PROJECTS_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Failed to load projects locally', e);
            return [];
        }
    }

    // ========== Credentials ==========

    async saveCredentials(credentials: Credential[]): Promise<void> {
        try {
            await this.storage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
            await this.updateMetadata({ credentialsVersion: Date.now() });
        } catch (e) {
            console.error('Failed to save credentials locally', e);
        }
    }

    async getCredentials(): Promise<Credential[]> {
        try {
            const jsonValue = await this.storage.getItem(CREDENTIALS_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Failed to load credentials locally', e);
            return [];
        }
    }

    // ========== Sync Queue ==========

    async getSyncQueue(): Promise<SyncQueueItem[]> {
        try {
            const jsonValue = await this.storage.getItem(SYNC_QUEUE_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Failed to load sync queue', e);
            return [];
        }
    }

    async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp'>): Promise<void> {
        try {
            const queue = await this.getSyncQueue();
            const newItem: SyncQueueItem = {
                ...item,
                id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
            };
            queue.push(newItem);
            await this.storage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
            console.log('[SDK] Added to sync queue:', newItem);
        } catch (e) {
            console.error('Failed to add to sync queue', e);
        }
    }

    async removeFromSyncQueue(id: string): Promise<void> {
        try {
            const queue = await this.getSyncQueue();
            const updatedQueue = queue.filter(item => item.id !== id);
            await this.storage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));
            console.log('[SDK] Removed from sync queue:', id);
        } catch (e) {
            console.error('Failed to remove from sync queue', e);
        }
    }

    async clearSyncQueue(): Promise<void> {
        try {
            await this.storage.setItem(SYNC_QUEUE_KEY, JSON.stringify([]));
            console.log('[SDK] Sync queue cleared');
        } catch (e) {
            console.error('Failed to clear sync queue', e);
        }
    }

    // ========== Metadata ==========

    async getMetadata(): Promise<StorageMetadata> {
        try {
            const jsonValue = await this.storage.getItem(METADATA_KEY);
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
    }

    async updateMetadata(updates: Partial<StorageMetadata>): Promise<void> {
        try {
            const current = await this.getMetadata();
            const updated = { ...current, ...updates };
            await this.storage.setItem(METADATA_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to update metadata', e);
        }
    }

    async setLastSyncTime(): Promise<void> {
        await this.updateMetadata({ lastSyncTime: new Date().toISOString() });
    }

    // ========== User Settings ==========

    async getUserName(): Promise<string | null> {
        try {
            return await this.storage.getItem('@keystore_user_name');
        } catch (e) {
            console.error('Failed to get user name', e);
            return null;
        }
    }

    async setUserName(name: string): Promise<void> {
        try {
            await this.storage.setItem('@keystore_user_name', name);
        } catch (e) {
            console.error('Failed to set user name', e);
        }
    }

    // ========== Client UUID ==========

    async getClientUUID(): Promise<string> {
        try {
            let uuid = await this.storage.getItem('@keystore_client_uuid');
            if (!uuid) {
                uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
                await this.storage.setItem('@keystore_client_uuid', uuid);
            }
            return uuid;
        } catch (e) {
            console.error('Failed to get client UUID', e);
            return 'temp-uuid-' + Date.now();
        }
    }

    // ========== Organization Context ==========

    async getCurrentOrganizationId(): Promise<string | null> {
        try {
            return await this.storage.getItem('@keystore_current_org_id');
        } catch (e) {
            console.error('Failed to get current org ID', e);
            return null;
        }
    }

    async setCurrentOrganizationId(orgId: string): Promise<void> {
        try {
            await this.storage.setItem('@keystore_current_org_id', orgId);
        } catch (e) {
            console.error('Failed to set current org ID', e);
        }
    }
}

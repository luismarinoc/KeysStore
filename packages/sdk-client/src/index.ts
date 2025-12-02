export * from './encryption';
export * from './supabase';
export * from './storage-adapter';
export * from './data-store';
export * from './organization-service';

import { StorageAdapter } from './storage-adapter';
import { initSupabase, getSupabase } from './supabase';
import { DataStore } from './data-store';
import { OrganizationService } from './organization-service';

let dataStoreInstance: DataStore | null = null;
let organizationServiceInstance: OrganizationService | null = null;

export const initSDK = (storage: StorageAdapter) => {
    const supabase = initSupabase(storage);
    dataStoreInstance = new DataStore(storage);
    organizationServiceInstance = new OrganizationService(supabase, dataStoreInstance);

    return {
        dataStore: dataStoreInstance,
        organizationService: organizationServiceInstance
    };
};

export const getDataStore = (): DataStore => {
    if (!dataStoreInstance) {
        throw new Error('SDK not initialized. Call initSDK first.');
    }
    return dataStoreInstance;
};

export const getOrganizationService = (): OrganizationService => {
    if (!organizationServiceInstance) {
        throw new Error('SDK not initialized. Call initSDK first.');
    }
    return organizationServiceInstance;
};



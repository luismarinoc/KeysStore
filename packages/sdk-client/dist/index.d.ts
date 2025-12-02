export * from './encryption';
export * from './supabase';
export * from './storage-adapter';
export * from './data-store';
export * from './organization-service';
import { StorageAdapter } from './storage-adapter';
import { DataStore } from './data-store';
import { OrganizationService } from './organization-service';
export declare const initSDK: (storage: StorageAdapter) => {
    dataStore: DataStore;
    organizationService: OrganizationService;
};
export declare const getDataStore: () => DataStore;
export declare const getOrganizationService: () => OrganizationService;

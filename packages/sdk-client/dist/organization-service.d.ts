import { SupabaseClient } from '@supabase/supabase-js';
import { DataStore } from './data-store';
import { Organization } from '@keysstore/shared-types';
export declare class OrganizationService {
    private supabase;
    private dataStore;
    constructor(supabase: SupabaseClient, dataStore: DataStore);
    listOrganizations(): Promise<Organization[]>;
    createOrganization(name: string, slug: string): Promise<Organization>;
    switchOrganization(orgId: string): Promise<void>;
    getCurrentOrganizationId(): Promise<string | null>;
}

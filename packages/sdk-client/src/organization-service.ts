import { SupabaseClient } from '@supabase/supabase-js';
import { DataStore } from './data-store';
import { Organization } from '@keysstore/shared-types';

export class OrganizationService {
    constructor(
        private supabase: SupabaseClient,
        private dataStore: DataStore
    ) { }

    async listOrganizations(): Promise<Organization[]> {
        const { data, error } = await this.supabase
            .from('organizations')
            .select('*')
            .order('name');

        if (error) throw error;
        return data || [];
    }

    async createOrganization(name: string, slug: string): Promise<Organization> {
        const { data, error } = await this.supabase
            .from('organizations')
            .insert([{ name, slug }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async switchOrganization(orgId: string): Promise<void> {
        await this.dataStore.setCurrentOrganizationId(orgId);
    }

    async getCurrentOrganizationId(): Promise<string | null> {
        return this.dataStore.getCurrentOrganizationId();
    }
}

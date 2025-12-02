"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationService = void 0;
class OrganizationService {
    constructor(supabase, dataStore) {
        this.supabase = supabase;
        this.dataStore = dataStore;
    }
    async listOrganizations() {
        const { data, error } = await this.supabase
            .from('organizations')
            .select('*')
            .order('name');
        if (error)
            throw error;
        return data || [];
    }
    async createOrganization(name, slug) {
        const { data, error } = await this.supabase
            .from('organizations')
            .insert([{ name, slug }])
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async switchOrganization(orgId) {
        await this.dataStore.setCurrentOrganizationId(orgId);
    }
    async getCurrentOrganizationId() {
        return this.dataStore.getCurrentOrganizationId();
    }
}
exports.OrganizationService = OrganizationService;

import React, { useEffect, useState } from 'react';
import { getOrganizationService, getDataStore } from '@keysstore/sdk-client';
import type { Organization } from '@keysstore/shared-types';

interface OrganizationSelectorProps {
    onSelect: (org: Organization) => void;
}

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({ onSelect }) => {
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [newOrgName, setNewOrgName] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const orgService = getOrganizationService();

    useEffect(() => {
        loadOrganizations();
    }, []);

    const loadOrganizations = async () => {
        setLoading(true);
        try {
            const organizations = await orgService.listOrganizations();
            setOrgs(organizations);

            // Auto-select if only one exists or if one is already stored
            const storedOrgId = await getDataStore().getCurrentOrganizationId();
            if (storedOrgId) {
                const storedOrg = organizations.find(o => o.id === storedOrgId);
                if (storedOrg) {
                    onSelect(storedOrg);
                }
            } else if (organizations.length === 1) {
                handleSelect(organizations[0]);
            }
        } catch (err: any) {
            console.error('Failed to load organizations', err);
            setError('Failed to load organizations. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newOrgName.trim()) return;

        setCreating(true);
        setError(null);
        try {
            // Simple slug generation
            const slug = newOrgName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const newOrg = await orgService.createOrganization(newOrgName, slug);
            setOrgs([...orgs, newOrg]);
            setNewOrgName('');
            handleSelect(newOrg);
        } catch (err: any) {
            console.error('Failed to create organization', err);
            setError('Failed to create organization. ' + (err.message || ''));
        } finally {
            setCreating(false);
        }
    };

    const handleSelect = async (org: Organization) => {
        try {
            await orgService.switchOrganization(org.id);
            onSelect(org);
        } catch (err) {
            console.error('Failed to switch organization', err);
        }
    };

    if (loading) {
        return <div>Loading organizations...</div>;
    }

    return (
        <div className="org-selector-container">
            <h2>Select Organization</h2>

            {error && <div className="error-message" style={{ color: 'red' }}>{error}</div>}

            <div className="org-list">
                {orgs.length === 0 ? (
                    <p>No organizations found. Create one to get started.</p>
                ) : (
                    <ul>
                        {orgs.map(org => (
                            <li key={org.id}>
                                <button onClick={() => handleSelect(org)}>
                                    {org.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="create-org">
                <h3>Create New Organization</h3>
                <form onSubmit={handleCreate}>
                    <input
                        type="text"
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                        placeholder="Organization Name"
                        disabled={creating}
                    />
                    <button type="submit" disabled={creating || !newOrgName.trim()}>
                        {creating ? 'Creating...' : 'Create'}
                    </button>
                </form>
            </div>
        </div>
    );
};

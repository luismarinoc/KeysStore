import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import type { Project, Organization } from '@keysstore/shared-types';
import { supabase } from '../services/supabase';
import { getProjects, saveProjects, addToSyncQueue } from '../services/storage';
import { Alert, Platform } from 'react-native';
import * as Device from 'expo-device';
import { getClientUUID } from '../services/deviceInfo';
import { useAuth } from './AuthContext';
import { useOffline } from './OfflineContext';
import { getOrganizationService, getDataStore } from '@keysstore/sdk-client';

interface ProjectContextType {
    projects: Project[];
    currentOrg: Organization | null;
    addProject: (data: Omit<Project, 'id' | 'created_at' | 'user_id'>) => Promise<Project | undefined>;
    updateProject: (id: string, data: Partial<Project>) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    deleteAllProjects: () => Promise<void>;
    refreshProjects: () => Promise<void>;
    setCurrentOrg: (org: Organization | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
    const { user } = useAuth();
    const { isReadOnlyMode, isSupabaseAvailable } = useOffline();

    useEffect(() => {
        loadProjects();
    }, [currentOrg]); // Reload projects when org changes

    const loadProjects = async () => {
        // If no org selected, we might want to clear projects or show all (depending on design)
        // For now, let's clear if no org
        if (!currentOrg) {
            setProjects([]);
            return;
        }

        const localProjects = await getProjects();
        // Filter local projects by org
        const orgProjects = localProjects.filter((p: Project) => p.organization_id === currentOrg.id);
        setProjects(orgProjects);
        await refreshProjects();
    };

    const refreshProjects = async () => {
        if (!currentOrg) return;

        try {
            const { data, error } = await supabase
                .from('keys_projects')
                .select('*')
                .eq('organization_id', currentOrg.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.log('Supabase fetch error (offline?):', error.message);
                return;
            }

            if (data) {
                const syncedData = data.map((p: any) => ({ ...p, is_synced: true }));
                setProjects(syncedData);
                // We should probably merge with other org projects in storage, but for now simple overwrite of memory
                // Ideally storage should be org-aware or we filter on load.
                // For simplicity in this migration, we'll just save what we see (which might overwrite other orgs' data in local storage if not careful)
                // TODO: Improve local storage to handle multiple orgs better (e.g. key by org_id)
                await saveProjects(syncedData);
            }
        } catch (e) {
            console.log('Sync error:', e);
        }
    };

    const addProject = async (data: Omit<Project, 'id' | 'created_at' | 'user_id'>): Promise<Project | undefined> => {
        if (!user) {
            console.error('User not authenticated');
            return undefined;
        }

        if (!currentOrg) {
            Alert.alert('Error', 'No organization selected');
            return undefined;
        }

        // Block in read-only mode
        if (isReadOnlyMode) {
            Alert.alert('Modo sin conexión', 'No se pueden crear proyectos sin conexión. Por favor conecta a internet.');
            return undefined;
        }

        const pcName = user.email || 'Unknown User';
        const apiKey = await getClientUUID();

        const newProject: Project = {
            id: Date.now().toString() + Math.random().toString().slice(2, 5),
            created_at: new Date().toISOString(),
            user_id: user.id,
            organization_id: currentOrg.id,
            pc_name: pcName,
            api_key: apiKey,
            is_synced: false,
            ...data,
        };

        // Optimistic update
        setProjects(prevProjects => {
            const updatedProjects = [newProject, ...prevProjects];
            saveProjects(updatedProjects);
            return updatedProjects;
        });

        try {
            // Exclude user_id from data if present to avoid duplicate key
            const { user_id: _, ...restData } = data as any;

            const supabaseData = {
                ...restData,
                user_id: user.id,
                organization_id: currentOrg.id,
                pc_name: pcName,
                api_key: apiKey,
            };

            const { data: insertedData, error } = await supabase
                .from('keys_projects')
                .insert([supabaseData])
                .select()
                .single();

            if (error) throw error;

            if (insertedData) {
                // Replace temp ID with real ID and mark as synced
                setProjects(prevProjects => {
                    const finalProjects = prevProjects.map(p =>
                        p.id === newProject.id ? { ...insertedData, is_synced: true } : p
                    );
                    saveProjects(finalProjects);
                    return finalProjects;
                });
                return { ...insertedData, is_synced: true };
            }
        } catch (e: any) {
            console.log('[ProjectContext] Create failed, queuing for sync:', e.message);
            // Queue for sync when online
            await addToSyncQueue({
                operation: 'create',
                entity: 'project',
                data: newProject,
            });
            Alert.alert('Sin conexión', 'Proyecto guardado localmente. Se sincronizará cuando se restablezca la conexión.');
        }

        return newProject;
    };

    const updateProject = async (id: string, data: Partial<Project>) => {
        // Block in read-only mode
        if (isReadOnlyMode) {
            Alert.alert('Modo sin conexión', 'No se pueden actualizar proyectos sin conexión.');
            return;
        }

        // Optimistic update
        const updatedProjects = projects.map((p) => (p.id === id ? { ...p, ...data, is_synced: false } : p));
        setProjects(updatedProjects);
        await saveProjects(updatedProjects);

        try {
            const { error } = await supabase
                .from('keys_projects')
                .update(data)
                .eq('id', id);

            if (error) throw error;

            // Mark as synced
            const syncedProjects = projects.map((p) => (p.id === id ? { ...p, ...data, is_synced: true } : p));
            setProjects(syncedProjects);
            await saveProjects(syncedProjects);
        } catch (e: any) {
            console.log('[ProjectContext] Update failed, queuing for sync:', e.message);
            await addToSyncQueue({
                operation: 'update',
                entity: 'project',
                data: { id, ...data },
            });
        }
    };

    const deleteProject = async (id: string) => {
        // Block in read-only mode
        if (isReadOnlyMode) {
            Alert.alert('Modo sin conexión', 'No se pueden eliminar proyectos sin conexión.');
            return;
        }

        // Optimistic update
        const updatedProjects = projects.filter((p) => p.id !== id);
        setProjects(updatedProjects);
        await saveProjects(updatedProjects);

        try {
            const { error } = await supabase
                .from('keys_projects')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (e: any) {
            console.log('[ProjectContext] Delete failed, queuing for sync:', e.message);
            await addToSyncQueue({
                operation: 'delete',
                entity: 'project',
                data: { id },
            });
            Alert.alert('Offline', 'Delete queued. Will sync when connection is restored.');
        }
    };

    const deleteAllProjects = async () => {
        // Optimistic update
        setProjects([]);
        await saveProjects([]);

        try {
            // Delete all projects for the current user
            if (!user) return;

            const { error } = await supabase
                .from('keys_projects')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;
        } catch (e: any) {
            console.error('Delete all projects error:', e);
            Alert.alert('Delete All Failed', `Could not delete projects from server: ${e.message || JSON.stringify(e)}`);
        }
    };

    return (
        <ProjectContext.Provider value={{ projects, currentOrg, setCurrentOrg, addProject, updateProject, deleteProject, deleteAllProjects, refreshProjects }}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProjects = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProjects must be used within a ProjectProvider');
    }
    return context;
};


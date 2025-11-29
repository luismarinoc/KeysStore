import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Project } from '../types';
import { supabase } from '../services/supabase';
import { getProjects, saveProjects, addToSyncQueue } from '../services/storage';
import { Alert, Platform } from 'react-native';
import * as Device from 'expo-device';
import { getClientUUID } from '../services/deviceInfo';
import { useAuth } from './AuthContext';
import { useOffline } from './OfflineContext';

interface ProjectContextType {
    projects: Project[];
    addProject: (data: Omit<Project, 'id' | 'created_at'>) => Promise<Project | undefined>;
    updateProject: (id: string, data: Partial<Project>) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    deleteAllProjects: () => Promise<void>;
    refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const { user } = useAuth();
    const { isReadOnlyMode, isSupabaseAvailable } = useOffline();

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        const localProjects = await getProjects();
        setProjects(localProjects);
        await refreshProjects();
    };

    const refreshProjects = async () => {
        try {
            const { data, error } = await supabase
                .from('keys_projects')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.log('Supabase fetch error (offline?):', error.message);
                return;
            }

            if (data) {
                const syncedData = data.map(p => ({ ...p, is_synced: true }));
                setProjects(syncedData);
                await saveProjects(syncedData);
            }
        } catch (e) {
            console.log('Sync error:', e);
        }
    };

    const addProject = async (data: Omit<Project, 'id' | 'created_at'>): Promise<Project | undefined> => {
        if (!user) {
            console.error('User not authenticated');
            return undefined;
        }

        // Block in read-only mode
        if (isReadOnlyMode) {
            Alert.alert('Offline Mode', 'Cannot create projects while offline. Please connect to the internet.');
            return undefined;
        }

        const pcName = user.email || 'Unknown User';
        const apiKey = await getClientUUID();

        const newProject: Project = {
            id: Date.now().toString() + Math.random().toString().slice(2, 5),
            created_at: new Date().toISOString(),
            user_id: user.id,
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
            const supabaseData = {
                ...data,
                user_id: user.id,
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
            Alert.alert('Offline', 'Project saved locally. Will sync when connection is restored.');
        }

        return newProject;
    };

    const updateProject = async (id: string, data: Partial<Project>) => {
        // Block in read-only mode
        if (isReadOnlyMode) {
            Alert.alert('Offline Mode', 'Cannot update projects while offline.');
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
            Alert.alert('Offline Mode', 'Cannot delete projects while offline.');
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
        <ProjectContext.Provider value={{ projects, addProject, updateProject, deleteProject, deleteAllProjects, refreshProjects }}>
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

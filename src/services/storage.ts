import AsyncStorage from '@react-native-async-storage/async-storage';
import { Project, Credential } from '../types';

const PROJECTS_KEY = '@keystore:projects';
const CREDENTIALS_KEY = '@keystore:credentials';

export const saveProjects = async (projects: Project[]) => {
    try {
        await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    } catch (e) {
        console.error('Failed to save projects locally', e);
    }
};

export const getProjects = async (): Promise<Project[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(PROJECTS_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error('Failed to load projects locally', e);
        return [];
    }
};

export const saveCredentials = async (credentials: Credential[]) => {
    try {
        await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
    } catch (e) {
        console.error('Failed to save credentials locally', e);
    }
};

export const getCredentials = async (): Promise<Credential[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(CREDENTIALS_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error('Failed to load credentials locally', e);
        return [];
    }
};

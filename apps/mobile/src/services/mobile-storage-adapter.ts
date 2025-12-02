import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageAdapter } from '@keysstore/sdk-client';

export const mobileStorageAdapter: StorageAdapter = {
    getItem: async (key: string) => {
        return await AsyncStorage.getItem(key);
    },
    setItem: async (key: string, value: string) => {
        await AsyncStorage.setItem(key, value);
    },
    removeItem: async (key: string) => {
        await AsyncStorage.removeItem(key);
    }
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { getUserName } from './userSettings';

const CLIENT_UUID_KEY = '@keystore_client_uuid';

/**
 * Gets or generates a unique client UUID
 * This UUID is persistent across app sessions
 */
export async function getClientUUID(): Promise<string> {
    try {
        // Try to get existing UUID from storage
        let uuid = await AsyncStorage.getItem(CLIENT_UUID_KEY);

        if (!uuid) {
            // Generate new UUID
            uuid = generateUUID();
            await AsyncStorage.setItem(CLIENT_UUID_KEY, uuid);
        }

        return uuid;
    } catch (error) {
        console.error('Error getting client UUID:', error);
        return generateUUID(); // Fallback to temporary UUID
    }
}

/**
 * Gets a user identifier (name + device info)
 * This will be stored in pc_name field
 */
export async function getUserIdentifier(): Promise<string> {
    try {
        const userName = await getUserName();

        if (userName) {
            // If user name is configured, use it with device info
            const deviceInfo = await getDeviceInfo();
            return `${userName} (${deviceInfo})`;
        }

        // Fallback to device info only
        return await getDeviceInfo();
    } catch (error) {
        console.error('Error getting user identifier:', error);
        return 'unknown-user';
    }
}

/**
 * Gets device information
 */
async function getDeviceInfo(): Promise<string> {
    if (Platform.OS === 'web') {
        const userAgent = window.navigator.userAgent;
        let os = 'Web';

        if (userAgent.includes('Macintosh')) os = 'Mac';
        else if (userAgent.includes('Windows')) os = 'Windows';
        else if (userAgent.includes('Linux')) os = 'Linux';

        const browser = getBrowserName(userAgent);
        return `${os}-${browser}`;
    } else {
        return Device.deviceName || Device.modelName || 'Mobile';
    }
}

/**
 * Extract browser name from user agent
 */
function getBrowserName(userAgent: string): string {
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Edg')) return 'Edge';
    return 'Browser';
}

/**
 * Simple UUID v4 generator
 */
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

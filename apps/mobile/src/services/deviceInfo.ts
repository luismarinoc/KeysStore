import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getUserName } from './userSettings';
import { getDataStore } from '@keysstore/sdk-client';

/**
 * Gets or generates a unique client UUID
 * This UUID is persistent across app sessions
 */
export async function getClientUUID(): Promise<string> {
    return getDataStore().getClientUUID();
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

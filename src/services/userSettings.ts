import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_NAME_KEY = '@keystore_user_name';

/**
 * Gets the stored user name
 */
export async function getUserName(): Promise<string | null> {
    try {
        return await AsyncStorage.getItem(USER_NAME_KEY);
    } catch (error) {
        console.error('Error getting user name:', error);
        return null;
    }
}

/**
 * Sets the user name
 */
export async function setUserName(name: string): Promise<void> {
    try {
        await AsyncStorage.setItem(USER_NAME_KEY, name);
    } catch (error) {
        console.error('Error setting user name:', error);
    }
}

/**
 * Checks if user name is configured
 */
export async function isUserNameConfigured(): Promise<boolean> {
    const name = await getUserName();
    return name !== null && name.trim() !== '';
}

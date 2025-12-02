import { getDataStore } from '@keysstore/sdk-client';

/**
 * Gets the stored user name
 */
export async function getUserName(): Promise<string | null> {
    return getDataStore().getUserName();
}

/**
 * Sets the user name
 */
export async function setUserName(name: string): Promise<void> {
    return getDataStore().setUserName(name);
}

/**
 * Checks if user name is configured
 */
export async function isUserNameConfigured(): Promise<boolean> {
    const name = await getUserName();
    return name !== null && name.trim() !== '';
}

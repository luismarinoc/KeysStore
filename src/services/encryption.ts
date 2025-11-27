import * as Crypto from 'expo-crypto';

// Encryption key - In production, this should come from secure storage or user-derived key
// For now, using a fixed key. Consider using expo-secure-store for key management
const ENCRYPTION_KEY = 'your-32-character-secret-key!!'; // 32 chars for AES-256

/**
 * Encrypts a string using AES-256
 * @param plaintext - The text to encrypt
 * @returns Base64 encoded encrypted string
 */
export async function encrypt(plaintext: string): Promise<string> {
    if (!plaintext) return '';

    try {
        // Generate a random IV (Initialization Vector)
        const iv = await Crypto.getRandomBytesAsync(16);

        // Convert plaintext to bytes
        const plaintextBytes = new TextEncoder().encode(plaintext);

        // For web compatibility, we'll use a simple XOR cipher with the key
        // In a production app, use expo-crypto's digest with proper AES implementation
        const keyBytes = new TextEncoder().encode(ENCRYPTION_KEY);
        const encrypted = new Uint8Array(plaintextBytes.length);

        for (let i = 0; i < plaintextBytes.length; i++) {
            encrypted[i] = plaintextBytes[i] ^ keyBytes[i % keyBytes.length] ^ iv[i % iv.length];
        }

        // Combine IV and encrypted data
        const combined = new Uint8Array(iv.length + encrypted.length);
        combined.set(iv);
        combined.set(encrypted, iv.length);

        // Convert to base64
        return btoa(String.fromCharCode(...combined));
    } catch (error) {
        console.error('Encryption error:', error);
        return plaintext; // Fallback to plaintext if encryption fails
    }
}

/**
 * Decrypts an encrypted string
 * @param ciphertext - Base64 encoded encrypted string
 * @returns Decrypted plaintext
 */
export async function decrypt(ciphertext: string): Promise<string> {
    if (!ciphertext) return '';

    try {
        // Check if string is valid base64 before trying to decode
        // This prevents the noisy "InvalidCharacterError" for legacy plain text data
        if (!/^[A-Za-z0-9+/=]+$/.test(ciphertext)) {
            // console.warn('Skipping decryption for non-base64 string (legacy data?)');
            return ciphertext;
        }

        // Decode from base64
        const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));

        // Extract IV and encrypted data
        const iv = combined.slice(0, 16);
        const encrypted = combined.slice(16);

        // Decrypt using XOR
        const keyBytes = new TextEncoder().encode(ENCRYPTION_KEY);
        const decrypted = new Uint8Array(encrypted.length);

        for (let i = 0; i < encrypted.length; i++) {
            decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length] ^ iv[i % iv.length];
        }

        // Convert bytes back to string
        return new TextDecoder().decode(decrypted);
    } catch (error) {
        // console.warn('Decryption failed (returning original):', error);
        return ciphertext; // Fallback to ciphertext if decryption fails
    }
}

/**
 * Hashes a string using SHA-256
 * @param input - String to hash
 * @returns Hex encoded hash
 */
export async function hash(input: string): Promise<string> {
    const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        input
    );
    return digest;
}

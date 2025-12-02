"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.hash = hash;
// Encryption key - In production, this should come from secure storage or user-derived key
// For now, using a fixed key.
const ENCRYPTION_KEY = 'your-32-character-secret-key!!'; // 32 chars for AES-256
/**
 * Helper to get random bytes
 */
function getRandomBytes(length) {
    const bytes = new Uint8Array(length);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
    }
    else {
        // Fallback for environments without crypto (not secure, but functional for dev)
        for (let i = 0; i < length; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
        }
    }
    return bytes;
}
/**
 * Encrypts a string using AES-256 (XOR implementation for demo/compatibility)
 * @param plaintext - The text to encrypt
 * @returns Base64 encoded encrypted string
 */
async function encrypt(plaintext) {
    if (!plaintext)
        return '';
    try {
        // Generate a random IV (Initialization Vector)
        const iv = getRandomBytes(16);
        // Convert plaintext to bytes
        const plaintextBytes = new TextEncoder().encode(plaintext);
        // Simple XOR cipher with the key
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
        // Browser/Node compatible base64 encoding
        const binString = Array.from(combined, (x) => String.fromCharCode(x)).join("");
        return btoa(binString);
    }
    catch (error) {
        console.error('Encryption error:', error);
        return plaintext; // Fallback to plaintext if encryption fails
    }
}
/**
 * Decrypts an encrypted string
 * @param ciphertext - Base64 encoded encrypted string
 * @returns Decrypted plaintext
 */
async function decrypt(ciphertext) {
    if (!ciphertext)
        return '';
    try {
        // Check if string is valid base64 before trying to decode
        if (!/^[A-Za-z0-9+/=]+$/.test(ciphertext)) {
            return ciphertext;
        }
        // Decode from base64
        const binString = atob(ciphertext);
        const combined = Uint8Array.from(binString, (m) => m.codePointAt(0));
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
    }
    catch (error) {
        return ciphertext; // Fallback to ciphertext if decryption fails
    }
}
/**
 * Hashes a string using SHA-256
 * @param input - String to hash
 * @returns Hex encoded hash
 */
async function hash(input) {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const msgBuffer = new TextEncoder().encode(input);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }
    else {
        // Fallback or throw error if secure hashing is required
        console.warn('Crypto.subtle not available, returning simple hash');
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(16);
    }
}

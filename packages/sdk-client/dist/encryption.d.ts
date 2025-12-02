/**
 * Encrypts a string using AES-256 (XOR implementation for demo/compatibility)
 * @param plaintext - The text to encrypt
 * @returns Base64 encoded encrypted string
 */
export declare function encrypt(plaintext: string): Promise<string>;
/**
 * Decrypts an encrypted string
 * @param ciphertext - Base64 encoded encrypted string
 * @returns Decrypted plaintext
 */
export declare function decrypt(ciphertext: string): Promise<string>;
/**
 * Hashes a string using SHA-256
 * @param input - String to hash
 * @returns Hex encoded hash
 */
export declare function hash(input: string): Promise<string>;

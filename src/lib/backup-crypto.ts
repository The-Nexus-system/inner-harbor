/**
 * Mosaic — Backup Encryption/Decryption
 * 
 * Uses Web Crypto API with AES-256-GCM and PBKDF2 key derivation
 * from a user-provided password. All operations run client-side.
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const ITERATIONS = 600_000; // OWASP recommended minimum for PBKDF2-SHA256
const SALT_BYTES = 16;
const IV_BYTES = 12;
const MAGIC = 'MOSAIC_ENCRYPTED_BACKUP_V1';

interface EncryptedBackup {
  magic: string;
  salt: string;   // base64
  iv: string;     // base64
  data: string;   // base64 ciphertext
  createdAt: string;
}

function toBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromBase64(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a JSON-serializable object with a user password.
 * Returns a JSON string containing the encrypted backup envelope.
 */
export async function encryptBackup(data: unknown, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));

  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    plaintext
  );

  const envelope: EncryptedBackup = {
    magic: MAGIC,
    salt: toBase64(salt.buffer),
    iv: toBase64(iv.buffer),
    data: toBase64(ciphertext),
    createdAt: new Date().toISOString(),
  };

  return JSON.stringify(envelope, null, 2);
}

/**
 * Decrypt an encrypted backup string with the user password.
 * Returns the parsed JSON data.
 */
export async function decryptBackup(encryptedJson: string, password: string): Promise<unknown> {
  const envelope: EncryptedBackup = JSON.parse(encryptedJson);

  if (envelope.magic !== MAGIC) {
    throw new Error('This file does not appear to be an encrypted Mosaic backup.');
  }

  const salt = new Uint8Array(fromBase64(envelope.salt));
  const iv = new Uint8Array(fromBase64(envelope.iv));
  const ciphertext = fromBase64(envelope.data);
  const key = await deriveKey(password, salt);

  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    );
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(plaintext));
  } catch {
    throw new Error('Incorrect password or corrupted backup file.');
  }
}

/**
 * Check if a JSON string is an encrypted Mosaic backup.
 */
export function isEncryptedBackup(content: string): boolean {
  try {
    const parsed = JSON.parse(content);
    return parsed?.magic === MAGIC;
  } catch {
    return false;
  }
}

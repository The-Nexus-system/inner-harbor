/**
 * Mosaic — Field-Level Encryption Stubs
 * 
 * These functions are pass-through stubs that document where field-level
 * encryption should be integrated. When implementing real encryption:
 * 
 * 1. Use AES-256-GCM for symmetric encryption
 * 2. Store the encryption key in environment secrets (never in code)
 * 3. Use a unique IV/nonce per field value
 * 4. Consider using a KMS (AWS KMS, DO Vault) for key management
 * 
 * SENSITIVE FIELDS that should be encrypted:
 * - alters.triggers_to_avoid
 * - alters.notes (when visibility = private or emergency-only)
 * - safety_plans.steps
 * - safety_plans.trusted_contacts
 * - safety_plans.notes
 * - journal_entries.content (types: flashback, medical, seizure, memory-reconstruction)
 * - internal_messages.content (when visibility = private)
 */

/**
 * Encrypt a field value before storing in the database.
 * Currently a pass-through — implement real encryption when ready.
 */
export function encryptField(value: string): string {
  // TODO: Implement AES-256-GCM encryption
  // const key = getEncryptionKey();
  // const iv = crypto.getRandomValues(new Uint8Array(12));
  // const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encode(value));
  // return `enc:${base64(iv)}:${base64(encrypted)}`;
  return value;
}

/**
 * Decrypt a field value after reading from the database.
 * Currently a pass-through — implement real decryption when ready.
 */
export function decryptField(value: string): string {
  // TODO: Implement AES-256-GCM decryption
  // if (!value.startsWith('enc:')) return value; // not encrypted
  // const [, ivB64, dataB64] = value.split(':');
  // const key = getEncryptionKey();
  // const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(ivB64) }, key, decode(dataB64));
  // return decode(decrypted);
  return value;
}

/**
 * Check if a field value is encrypted.
 */
export function isEncrypted(value: string): boolean {
  return value.startsWith('enc:');
}

/**
 * List of sensitive fields by table, for documentation and future automation.
 */
export const SENSITIVE_FIELDS = {
  alters: ['triggers_to_avoid', 'notes'],
  safety_plans: ['steps', 'trusted_contacts', 'notes'],
  journal_entries: ['content'], // when type is flashback, medical, seizure, memory-reconstruction
  internal_messages: ['content'], // when visibility is private
} as const;

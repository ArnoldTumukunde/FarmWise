/**
 * Content protection for offline video downloads.
 *
 * Strategy:
 * - Generate a random AES-256-GCM key per lecture on download
 * - Encrypt each HLS segment before storing in IndexedDB
 * - Store the key in a separate IDB store (tied to the app origin)
 * - On playback, decrypt segments on-the-fly
 *
 * This prevents raw video extraction from IndexedDB/DevTools.
 * The key is origin-bound (same-origin policy) and not exportable
 * from the CryptoKey object.
 */

const ALGO = 'AES-GCM';
const KEY_LENGTH = 256;

/** Generate a non-extractable AES-GCM key for a lecture */
export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: ALGO, length: KEY_LENGTH },
    false, // non-extractable — can't be read from DevTools
    ['encrypt', 'decrypt'],
  );
}

/** Encrypt a segment (ArrayBuffer) with AES-GCM */
export async function encryptSegment(
  key: CryptoKey,
  plaintext: ArrayBuffer,
): Promise<ArrayBuffer> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    plaintext,
  );
  // Prepend IV (12 bytes) to ciphertext for storage
  const result = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(ciphertext), iv.byteLength);
  return result.buffer;
}

/** Decrypt a segment — extracts IV from first 12 bytes */
export async function decryptSegment(
  key: CryptoKey,
  encrypted: ArrayBuffer,
): Promise<ArrayBuffer> {
  const data = new Uint8Array(encrypted);
  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);
  return crypto.subtle.decrypt(
    { name: ALGO, iv },
    key,
    ciphertext,
  );
}

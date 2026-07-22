/**
 * End-to-End Encryption (E2EE) Utility using native Web Crypto API
 * Uses AES-256-GCM with PBKDF2 Key Derivation (100,000 iterations)
 *
 * The encryption key is derived from the shared room key (a deterministic
 * combination of both passcodes), so both users can encrypt/decrypt
 * the same messages regardless of which passcode they entered.
 */

interface EncryptedPayload {
  v: number; // schema version
  salt: string; // Hex salt for PBKDF2
  iv: string; // Hex IV for AES-GCM
  ciphertext: string; // Hex ciphertext
  timestamp: number;
}

// Convert ArrayBuffer to Hex string
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex string to Uint8Array
function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Get the Web Crypto subtle interface.
 * Works in both browser and Node.js (Next.js SSR) environments.
 */
function getCrypto(): SubtleCrypto {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error('Web Crypto API is not available in this environment');
}

/**
 * Generate cryptographically secure random bytes.
 * Works in both browser and Node.js environments.
 */
function getRandomValues(length: number): Uint8Array {
  const array = new Uint8Array(length);
  if (typeof globalThis.crypto !== 'undefined') {
    globalThis.crypto.getRandomValues(array);
  } else {
    throw new Error('Crypto API not available for random value generation');
  }
  return array;
}

/**
 * Derive an AES-GCM key from a secret key string and salt using PBKDF2
 */
async function deriveKey(secretKey: string, salt: Uint8Array): Promise<CryptoKey> {
  const subtle = getCrypto();
  const enc = new TextEncoder();
  const keyMaterial = await subtle.importKey(
    'raw',
    enc.encode(secretKey),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a plaintext message string with a secret key.
 * @param plaintext - The message to encrypt
 * @param secretKey - The shared room key (derived from both passcodes)
 */
export async function encryptMessage(plaintext: string, secretKey: string): Promise<string> {
  const subtle = getCrypto();
  const enc = new TextEncoder();
  const salt = getRandomValues(16);
  const iv = getRandomValues(12);
  const key = await deriveKey(secretKey, salt);

  const ciphertextBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv.buffer as ArrayBuffer,
    },
    key,
    enc.encode(plaintext)
  );

  const payload: EncryptedPayload = {
    v: 1,
    salt: bufferToHex(salt.buffer as ArrayBuffer),
    iv: bufferToHex(iv.buffer as ArrayBuffer),
    ciphertext: bufferToHex(ciphertextBuffer),
    timestamp: Date.now(),
  };

  return JSON.stringify(payload);
}

/**
 * Decrypt an encrypted payload string with a secret key (or list of candidate room keys).
 * @param encryptedPayloadStr - The JSON string from encryptMessage()
 * @param secretKey - The room key (or array of candidate keys for fallback)
 * @throws Error if decryption fails (wrong key or corrupted data)
 */
export async function decryptMessage(
  encryptedPayloadStr: string,
  secretKey: string | string[]
): Promise<string> {
  let payload: EncryptedPayload;
  try {
    payload = JSON.parse(encryptedPayloadStr);
  } catch {
    throw new Error('Invalid encrypted payload format');
  }

  const subtle = getCrypto();
  const salt = hexToBuffer(payload.salt);
  const iv = hexToBuffer(payload.iv);
  const ciphertext = hexToBuffer(payload.ciphertext);

  const keysToTry = Array.isArray(secretKey) ? secretKey : [secretKey];

  for (const keyCandidate of keysToTry) {
    try {
      const derived = await deriveKey(keyCandidate, salt);
      const decryptedBuffer = await subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv.buffer as ArrayBuffer,
        },
        derived,
        ciphertext.buffer as ArrayBuffer
      );

      const dec = new TextDecoder();
      return dec.decode(decryptedBuffer);
    } catch {
      // Candidate key didn't match AES-GCM auth tag, try next candidate key
    }
  }

  throw new Error('Incorrect key or corrupted message');
}

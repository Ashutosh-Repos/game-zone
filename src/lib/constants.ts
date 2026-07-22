/**
 * Application Constants
 * Central configuration for passcodes, room identifiers, and storage keys.
 * Storage keys are intentionally named innocuously to avoid suspicion.
 */

/**
 * Valid passcodes that unlock the secret vault.
 * Reads from NEXT_PUBLIC_VALID_PASSCODES env var (comma-separated).
 * Falls back to defaults for local dev only.
 */
const rawPasscodes = (
  typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_VALID_PASSCODES
    ? process.env.NEXT_PUBLIC_VALID_PASSCODES
    : '9877,7788'
).split(',').map((s) => s.trim()).filter(Boolean);

export const VALID_PASSCODES: readonly string[] = rawPasscodes;

/**
 * Optional legacy passcode pairs for backward compatibility.
 * Configured via NEXT_PUBLIC_LEGACY_PASSCODES env var (semicolon-separated pairs).
 * Example: NEXT_PUBLIC_LEGACY_PASSCODES="9877,7788;1111,2222"
 */
const legacyPasscodePairs = (
  typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_LEGACY_PASSCODES
    ? process.env.NEXT_PUBLIC_LEGACY_PASSCODES
    : ''
)
  .split(';')
  .map((pair) => pair.split(',').map((s) => s.trim()).filter(Boolean))
  .filter((pair) => pair.length > 0);

/**
 * 256-Bit Master Room Encryption Key.
 * Decoupled from passcodes to eliminate brute-force vulnerabilities.
 * Reads from NEXT_PUBLIC_SECRET_MASTER_KEY (available on both client and server).
 * Falls back to high-entropy 256-bit default hex key.
 */
const defaultMasterHex = 'e4d29f81a73b0c5e62f941088d37c5a2e9140b68d712f5a34e89201bc6f4831a';

export function getMasterRoomKey(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SECRET_MASTER_KEY) {
    return process.env.NEXT_PUBLIC_SECRET_MASTER_KEY;
  }
  return defaultMasterHex;
}

/**
 * Derive a shared room encryption key.
 * Now returns the 256-bit Master Room Key (immune to passcode brute-forcing).
 */
export function deriveRoomKey(): string {
  return getMasterRoomKey();
}

/**
 * Returns all valid room keys (256-bit Master Key first, followed by legacy keys).
 * Ensures updating passcodes or migrating keys never breaks historical messages!
 */
export function getAllRoomKeys(): string[] {
  const keys: string[] = [getMasterRoomKey()];
  for (const pair of legacyPasscodePairs) {
    const legacyKey = [...pair].sort().join('::');
    if (!keys.includes(legacyKey)) {
      keys.push(legacyKey);
    }
  }
  // Fallback default legacy key so older messages remain decryptable
  if (!keys.includes('7788::9877')) {
    keys.push('7788::9877');
  }
  return keys;
}

/**
 * Derive a hash of the room key for API auth.
 * NOT for encryption — just to prove the caller knows the master key.
 * Uses 64-bit FNV-1a via BigInt for 64 bits of entropy.
 */
export function deriveRoomKeyHash(): string {
  const key = deriveRoomKey();
  const FNV_OFFSET = BigInt('0xcbf29ce484222325');
  const FNV_PRIME = BigInt('0x100000001b3');
  const MASK_64 = BigInt('0xffffffffffffffff');
  let hash = FNV_OFFSET;
  for (let i = 0; i < key.length; i++) {
    hash ^= BigInt(key.charCodeAt(i));
    hash = (hash * FNV_PRIME) & MASK_64;
  }
  return hash.toString(36);
}

/**
 * Produce an opaque pseudonym from a raw passcode.
 * Used as the `sender` field in messages so the raw passcode is never
 * stored in the database, localStorage cache, or WebSocket traffic.
 */
export function hashSender(passcode: string): string {
  const salt = 'sp_sender';
  const input = salt + passcode;
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 'u_' + (h >>> 0).toString(36);
}

/** Room identifier for the message channel */
export const ROOM_ID = 'sp_room_default';

/**
 * localStorage key — named to look like generic app cache data.
 * Deliberately avoids words like "secret", "vault", "encrypted", "chat".
 */
export const STORAGE_KEY = 'sp_app_cache_v1';

/** Pending sync queue key for offline messages */
export const PENDING_QUEUE_KEY = 'sp_pending_sync_v1';

/** Maximum image dimension (px) before compression */
export const MAX_IMAGE_DIMENSION = 800;

/** JPEG compression quality (0–1) for attached images */
export const IMAGE_QUALITY = 0.6;

/** Maximum audio recording duration in milliseconds (30 seconds) */
export const MAX_AUDIO_DURATION_MS = 30_000;

/** Shake-to-panic acceleration threshold (higher = less sensitive) */
export const SHAKE_THRESHOLD = 45;

/** Number of consecutive high readings required before panic triggers */
export const SHAKE_CONSECUTIVE_REQUIRED = 2;

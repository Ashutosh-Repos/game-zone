import { describe, it, expect } from 'vitest';
import {
  getMasterRoomKey,
  deriveRoomKey,
  getAllRoomKeys,
  deriveRoomKeyHash,
  hashSender,
  VALID_PASSCODES,
  ROOM_ID,
  STORAGE_KEY,
  PENDING_QUEUE_KEY,
} from '../src/lib/constants';

describe('Application Constants & Key Derivation', () => {
  it('should return valid default passcodes', () => {
    expect(VALID_PASSCODES).toContain('9877');
    expect(VALID_PASSCODES).toContain('7788');
  });

  it('should return 256-bit Master Room Key', () => {
    const key = getMasterRoomKey();
    expect(key).toBeDefined();
    expect(typeof key).toBe('string');
    expect(key.length).toBeGreaterThanOrEqual(32);
    expect(deriveRoomKey()).toBe(key);
  });

  it('should include master key first in getAllRoomKeys()', () => {
    const keys = getAllRoomKeys();
    expect(keys[0]).toBe(getMasterRoomKey());
    expect(keys.length).toBeGreaterThanOrEqual(1);
  });

  it('should generate a deterministic 64-bit FNV-1a room auth hash', () => {
    const hash1 = deriveRoomKeyHash();
    const hash2 = deriveRoomKeyHash();
    expect(hash1).toBe(hash2);
    expect(typeof hash1).toBe('string');
    expect(hash1.length).toBeGreaterThan(0);
  });

  it('should produce opaque sender pseudonyms with hashSender()', () => {
    const hashA = hashSender('9877');
    const hashB = hashSender('7788');

    expect(hashA.startsWith('u_')).toBe(true);
    expect(hashB.startsWith('u_')).toBe(true);
    expect(hashA).not.toBe('9877');
    expect(hashB).not.toBe('7788');
    expect(hashA).not.toBe(hashB);

    // Deterministic test
    expect(hashSender('9877')).toBe(hashA);
  });

  it('should define non-sensitive storage key names', () => {
    expect(ROOM_ID).toBe('sp_room_default');
    expect(STORAGE_KEY).not.toContain('secret');
    expect(STORAGE_KEY).not.toContain('vault');
    expect(PENDING_QUEUE_KEY).not.toContain('secret');
  });
});

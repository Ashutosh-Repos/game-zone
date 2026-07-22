import { describe, it, expect } from 'vitest';
import { encryptMessage, decryptMessage } from '../src/lib/crypto';
import { deriveRoomKey, getAllRoomKeys } from '../src/lib/constants';

describe('Web Crypto E2EE Engine', () => {
  const masterKey = deriveRoomKey();

  it('should encrypt plaintext into valid JSON payload structure', async () => {
    const plainText = 'Hello Secret Vault!';
    const encryptedStr = await encryptMessage(plainText, masterKey);

    expect(typeof encryptedStr).toBe('string');
    const parsed = JSON.parse(encryptedStr);
    expect(parsed.v).toBe(1);
    expect(parsed.salt).toBeDefined();
    expect(parsed.iv).toBeDefined();
    expect(parsed.ciphertext).toBeDefined();
    expect(parsed.timestamp).toBeTypeOf('number');
  });

  it('should encrypt and decrypt plaintext accurately', async () => {
    const originalText = 'Top Secret Communication payload 12345! 🔐';
    const encryptedStr = await encryptMessage(originalText, masterKey);
    const decrypted = await decryptMessage(encryptedStr, masterKey);

    expect(decrypted).toBe(originalText);
  });

  it('should decrypt using candidate keys array in getAllRoomKeys()', async () => {
    const originalText = 'Candidate keys fallback verification';
    const encryptedStr = await encryptMessage(originalText, masterKey);
    const candidateKeys = getAllRoomKeys();

    const decrypted = await decryptMessage(encryptedStr, candidateKeys);
    expect(decrypted).toBe(originalText);
  });

  it('should produce unique ciphertexts (different salt/IV) for identical plaintext', async () => {
    const text = 'Same message twice';
    const enc1 = await encryptMessage(text, masterKey);
    const enc2 = await encryptMessage(text, masterKey);

    expect(enc1).not.toBe(enc2);
    expect(await decryptMessage(enc1, masterKey)).toBe(text);
    expect(await decryptMessage(enc2, masterKey)).toBe(text);
  });

  it('should throw an error when decrypting with an incorrect key', async () => {
    const originalText = 'Confidential content';
    const encryptedStr = await encryptMessage(originalText, masterKey);
    const wrongKey = 'wrong_master_key_1234567890abcdef1234567890abcdef';

    await expect(decryptMessage(encryptedStr, wrongKey)).rejects.toThrow();
  });

  it('should throw an error on corrupted payload string', async () => {
    await expect(decryptMessage('invalid_json_string', masterKey)).rejects.toThrow(
      'Invalid encrypted payload format'
    );
  });
});

import { describe, it, expect } from 'vitest';
import { generateUUID, saveEncryptedRecord, fetchRoomEncryptedRecords } from '../src/lib/db';
import { ROOM_ID } from '../src/lib/constants';

describe('Database & In-Memory Storage Engine', () => {
  const testUUID = '12345678-1234-4123-8123-1234567890ab';

  it('should generate valid UUID v4 format', () => {
    const uuid = generateUUID();
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(UUID_REGEX.test(uuid)).toBe(true);
  });

  it('should save an encrypted record with valid UUID and timestamp', async () => {
    const record = await saveEncryptedRecord(ROOM_ID, 'u_user1', 'payload_hex_123', testUUID, 1000);

    expect(record.id).toBe(testUUID);
    expect(record.roomId).toBe(ROOM_ID);
    expect(record.sender).toBe('u_user1');
    expect(record.encryptedPayload).toBe('payload_hex_123');
    expect(record.timestamp).toBe(1000);
  });

  it('should regenerate UUID if an invalid string is provided', async () => {
    const record = await saveEncryptedRecord(ROOM_ID, 'u_user1', 'payload_hex_123', 'invalid-uuid');

    expect(record.id).not.toBe('invalid-uuid');
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(UUID_REGEX.test(record.id)).toBe(true);
  });

  it('should fetch records sorted ascending by timestamp', async () => {
    await saveEncryptedRecord(ROOM_ID, 'u_user1', 'payload_1', undefined, 2000);
    await saveEncryptedRecord(ROOM_ID, 'u_user2', 'payload_2', undefined, 3000);
    await saveEncryptedRecord(ROOM_ID, 'u_user1', 'payload_3', undefined, 1000);

    const records = await fetchRoomEncryptedRecords(ROOM_ID);
    expect(records.length).toBeGreaterThanOrEqual(3);

    // Verify oldest first sorting
    for (let i = 1; i < records.length; i++) {
      expect(records[i].timestamp).toBeGreaterThanOrEqual(records[i - 1].timestamp);
    }
  });

  it('should support cursor pagination with `limit` and `before` filters', async () => {
    const roomId = 'test_room_pagination';
    await saveEncryptedRecord(roomId, 'u_1', 'p1', undefined, 100);
    await saveEncryptedRecord(roomId, 'u_1', 'p2', undefined, 200);
    await saveEncryptedRecord(roomId, 'u_1', 'p3', undefined, 300);
    await saveEncryptedRecord(roomId, 'u_1', 'p4', undefined, 400);

    // Fetch before 350 (should return records at 100, 200, 300)
    const page = await fetchRoomEncryptedRecords(roomId, { limit: 2, before: 350 });
    expect(page.length).toBe(2);
    expect(page[0].timestamp).toBe(200);
    expect(page[1].timestamp).toBe(300);
  });
});

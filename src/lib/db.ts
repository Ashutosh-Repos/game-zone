/**
 * Server-side Database & Storage Engine
 *
 * Uses Supabase PostgreSQL when configured via environment variables.
 * Falls back to an in-memory store for development/testing.
 */

import { ROOM_ID } from './constants';

export interface DBEncryptedRecord {
  id: string;
  roomId: string;
  sender: string; // Passcode of the sender
  encryptedPayload: string;
  timestamp: number;
}

const globalStore = globalThis as unknown as {
  __sp_db_records?: DBEncryptedRecord[];
};

if (!globalStore.__sp_db_records) {
  globalStore.__sp_db_records = [];
}

/**
 * Generate a valid UUID v4
 */
export function generateUUID(): string {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  // Fallback valid UUID v4 string
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Save an encrypted message record
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function saveEncryptedRecord(
  roomId: string,
  sender: string,
  encryptedPayload: string,
  id?: string,
  timestamp?: number
): Promise<DBEncryptedRecord> {
  const recordId = id && UUID_REGEX.test(id) ? id : generateUUID();
  const recordTimestamp = timestamp || Date.now();

  const record: DBEncryptedRecord = {
    id: recordId,
    roomId,
    sender,
    encryptedPayload,
    timestamp: recordTimestamp,
  };

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/encrypted_messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          id: record.id,
          room_id: roomId,
          sender_id: sender,
          encrypted_payload: encryptedPayload,
          created_at: new Date(record.timestamp).toISOString(),
        }),
      });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const returnedRow = rows[0];
          record.id = returnedRow.id || record.id;
        }
      } else {
        const errText = await res.text();
        console.error('Supabase save error:', res.status, errText);
        throw new Error(`Failed to save record to Supabase database (${res.status}): ${errText}`);
      }
    } catch (e) {
      console.error('Supabase save error:', e);
      throw e;
    }
  }

  // Deduplicate in memory store
  if (!globalStore.__sp_db_records!.some((r) => r.id === record.id)) {
    globalStore.__sp_db_records!.push(record);
  }
  return record;
}

/**
 * Fetch encrypted records for a room with cursor pagination (limit & before timestamp)
 */
export async function fetchRoomEncryptedRecords(
  roomId: string = ROOM_ID,
  options?: { limit?: number; before?: number }
): Promise<DBEncryptedRecord[]> {
  const limit = options?.limit || 30;
  const before = options?.before;

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      let queryUrl = `${process.env.SUPABASE_URL}/rest/v1/encrypted_messages?room_id=eq.${roomId}`;
      if (before) {
        const beforeIso = new Date(before).toISOString();
        queryUrl += `&created_at=lt.${beforeIso}`;
      }
      queryUrl += `&order=created_at.desc&limit=${limit}`;

      const res = await fetch(queryUrl, {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      });
      if (res.ok) {
        const rows = await res.json();
        const mapped = rows.map((r: Record<string, unknown>) => ({
          id: (r.id as string) || generateUUID(),
          roomId: r.room_id as string,
          sender: r.sender_id as string,
          encryptedPayload: r.encrypted_payload as string,
          timestamp: new Date(r.created_at as string).getTime(),
        }));
        return mapped.sort((a: DBEncryptedRecord, b: DBEncryptedRecord) => a.timestamp - b.timestamp);
      }
    } catch (e) {
      console.error('Supabase query error:', e);
    }
  }

  let filtered = (globalStore.__sp_db_records || []).filter((r) => r.roomId === roomId);
  if (before) {
    filtered = filtered.filter((r) => r.timestamp < before);
  }
  filtered.sort((a, b) => b.timestamp - a.timestamp);
  const sliced = filtered.slice(0, limit);
  return sliced.sort((a, b) => a.timestamp - b.timestamp);
}

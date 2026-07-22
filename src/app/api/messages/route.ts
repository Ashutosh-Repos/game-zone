import { NextRequest, NextResponse } from 'next/server';
import { saveEncryptedRecord, fetchRoomEncryptedRecords } from '@/lib/db';
import { ROOM_ID, deriveRoomKeyHash } from '@/lib/constants';

const ipRateMap = new Map<string, { count: number; resetTime: number }>();

function checkIpRateLimit(req: NextRequest): boolean {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const now = Date.now();

  // Prune stale entries when map gets large to prevent memory leak
  if (ipRateMap.size > 1000) {
    for (const [key, val] of ipRateMap) {
      if (now > val.resetTime) ipRateMap.delete(key);
    }
  }

  const entry = ipRateMap.get(ip);

  if (!entry || now > entry.resetTime) {
    ipRateMap.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (entry.count >= 60) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Validate the room-key-hash auth header.
 * The client must send x-room-auth with deriveRoomKeyHash() output.
 * This proves the caller knows the valid passcodes without exposing them.
 */
function validateRoomAuth(req: NextRequest): boolean {
  if (!checkIpRateLimit(req)) return false;

  const clientHash = req.headers.get('x-room-auth');
  if (!clientHash) return false;

  const expectedHash = deriveRoomKeyHash();
  return clientHash === expectedHash;
}

export async function GET(req: NextRequest) {
  if (!validateRoomAuth(req)) {
    return NextResponse.json({ error: '404 Not Found' }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId') || ROOM_ID;
    const rawLimit = parseInt(searchParams.get('limit') || '30', 10);
    const limit = isNaN(rawLimit) || rawLimit <= 0 ? 30 : Math.min(rawLimit, 100);

    const rawBefore = parseInt(searchParams.get('before') || '', 10);
    const before = !isNaN(rawBefore) && rawBefore > 0 ? rawBefore : undefined;

    const records = await fetchRoomEncryptedRecords(roomId, { limit, before });
    return NextResponse.json({ success: true, records });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!validateRoomAuth(req)) {
    return NextResponse.json({ error: '404 Not Found' }, { status: 404 });
  }

  try {
    const body = await req.json();

    // Support batch array of messages
    if (Array.isArray(body.batch)) {
      const saved = [];
      for (const item of body.batch) {
        if (item.roomId && item.sender && item.encryptedPayload) {
          const record = await saveEncryptedRecord(
            item.roomId,
            item.sender,
            item.encryptedPayload,
            item.id,
            item.timestamp
          );
          saved.push(record);
        }
      }
      return NextResponse.json({ success: true, saved: saved.length });
    }

    // Single message
    const { roomId, sender, encryptedPayload, id, timestamp } = body;
    if (!roomId || !sender || !encryptedPayload) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const savedRecord = await saveEncryptedRecord(roomId, sender, encryptedPayload, id, timestamp);
    return NextResponse.json({ success: true, record: savedRecord });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

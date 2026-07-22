import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../src/app/api/messages/route';
import { deriveRoomKeyHash, ROOM_ID } from '../src/lib/constants';

describe('Messages API Route Endpoints', () => {
  const validAuthHash = deriveRoomKeyHash();

  it('should reject GET requests without valid x-room-auth header (404 status)', async () => {
    const req = new NextRequest('http://localhost:3000/api/messages');
    const res = await GET(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('404 Not Found');
  });

  it('should reject POST requests without valid x-room-auth header (404 status)', async () => {
    const req = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      body: JSON.stringify({ roomId: ROOM_ID, sender: 'u_user', encryptedPayload: 'enc_data' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('should accept GET requests with valid x-room-auth header', async () => {
    const req = new NextRequest(`http://localhost:3000/api/messages?roomId=${ROOM_ID}&limit=10`, {
      headers: { 'x-room-auth': validAuthHash },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.records)).toBe(true);
  });

  it('should save single message via POST endpoint', async () => {
    const postBody = {
      roomId: ROOM_ID,
      sender: 'u_test_user',
      encryptedPayload: 'test_encrypted_payload_hex',
      id: '98765432-1234-4123-8123-1234567890ab',
      timestamp: Date.now(),
    };

    const req = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-room-auth': validAuthHash,
      },
      body: JSON.stringify(postBody),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.record).toBeDefined();
    expect(body.record.id).toBe(postBody.id);
  });

  it('should support offline batch sync via POST endpoint', async () => {
    const batch = [
      { roomId: ROOM_ID, sender: 'u_test_user', encryptedPayload: 'batch_1', timestamp: 1000 },
      { roomId: ROOM_ID, sender: 'u_test_user', encryptedPayload: 'batch_2', timestamp: 2000 },
    ];

    const req = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-room-auth': validAuthHash,
      },
      body: JSON.stringify({ batch }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.saved).toBe(2);
  });
});

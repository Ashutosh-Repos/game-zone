import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { io as socketClient } from 'socket.io-client';
import { encryptMessage, decryptMessage } from '../src/lib/crypto';
import { deriveRoomKey, deriveRoomKeyHash, hashSender, ROOM_ID } from '../src/lib/constants';
import { saveEncryptedRecord, fetchRoomEncryptedRecords } from '../src/lib/db';

describe('Full E2E Integration Flow: User A <-> User B Chat Loop', () => {
  let httpServer: ReturnType<typeof createServer>;
  let ioServer: SocketIOServer;
  let port: number;

  const userAPasscode = '9877';
  const userBPasscode = '7788';
  const userASenderHash = hashSender(userAPasscode);
  const userBSenderHash = hashSender(userBPasscode);

  const roomKey = deriveRoomKey();
  const roomAuthHash = deriveRoomKeyHash();

  beforeAll(async () => {
    return new Promise<void>((resolve) => {
      httpServer = createServer();
      ioServer = new SocketIOServer(httpServer, { path: '/api/socketio' });

      // Match server.mjs handshake auth middleware
      ioServer.use((socket, next) => {
        const clientHash = socket.handshake.auth?.roomAuthHash;
        if (!clientHash || clientHash !== roomAuthHash) {
          return next(new Error('Unauthorized room access'));
        }
        next();
      });

      const socketRooms = new Map();

      ioServer.on('connection', (socket) => {
        socket.on('join_room', (data) => {
          const roomId = typeof data === 'string' ? data : data?.roomId;
          const sender = typeof data === 'object' ? data?.sender : null;
          socket.join(roomId);
          socketRooms.set(socket.id, { roomId, sender });
          if (sender) {
            socket.to(roomId).emit('user_presence', { sender, status: 'online' });
          }
        });

        socket.on('send_message', (data) => {
          socket.to(data.roomId).emit('receive_message', data);
        });

        socket.on('read_receipt', (data) => {
          socket.to(data.roomId).emit('message_read', { messageId: data.messageId });
        });
      });

      httpServer.listen(0, () => {
        const addr = httpServer.address();
        port = typeof addr === 'object' && addr ? addr.port : 0;
        resolve();
      });
    });
  });

  afterAll(async () => {
    return new Promise<void>((resolve) => {
      if (ioServer) ioServer.close();
      if (httpServer) httpServer.close(() => resolve());
      else resolve();
    });
  });

  it('should complete full E2E flow: encrypt -> store -> socket relay -> decrypt -> read receipt -> historical fetch', async () => {
    return new Promise<void>((resolve, reject) => {
      const clientA = socketClient(`http://localhost:${port}`, {
        path: '/api/socketio',
        transports: ['websocket'],
        auth: { roomAuthHash },
      });

      const clientB = socketClient(`http://localhost:${port}`, {
        path: '/api/socketio',
        transports: ['websocket'],
        auth: { roomAuthHash },
      });

      const testMsgId = '98765432-1234-4123-8123-1234567890ab';
      const plainMessageText = 'Hello User B! This is an E2E encrypted message. 🚀';

      let clientAConnected = false;
      let clientBConnected = false;

      const triggerUserASend = async () => {
        if (!clientAConnected || !clientBConnected) return;

        try {
          // 1. User A encrypts payload locally using Web Crypto master key
          const encryptedPayload = await encryptMessage(JSON.stringify({ text: plainMessageText }), roomKey);

          // 2. User A saves payload to server DB
          const savedRecord = await saveEncryptedRecord(
            ROOM_ID,
            userASenderHash,
            encryptedPayload,
            testMsgId,
            Date.now()
          );

          // 3. User A broadcasts record to User B over WebSockets
          clientA.emit('send_message', {
            roomId: ROOM_ID,
            record: savedRecord,
          });
        } catch (e) {
          reject(e);
        }
      };

      // User A connects and joins room
      clientA.on('connect', () => {
        clientA.emit('join_room', { roomId: ROOM_ID, sender: userASenderHash });
        clientAConnected = true;
        triggerUserASend();
      });

      // User B connects and joins room
      clientB.on('connect', () => {
        clientB.emit('join_room', { roomId: ROOM_ID, sender: userBSenderHash });
        clientBConnected = true;
        triggerUserASend();
      });

      // 4. User B receives real-time socket message from User A
      clientB.on('receive_message', async (data) => {
        try {
          expect(data.record.id).toBe(testMsgId);
          expect(data.record.sender).toBe(userASenderHash);

          // User B decrypts the received encrypted payload using master key
          const decryptedJsonStr = await decryptMessage(data.record.encryptedPayload, roomKey);
          const parsed = JSON.parse(decryptedJsonStr);
          expect(parsed.text).toBe(plainMessageText);

          // 5. User B acknowledges receipt by emitting read_receipt to User A
          clientB.emit('read_receipt', {
            roomId: ROOM_ID,
            messageId: testMsgId,
            reader: userBSenderHash,
          });
        } catch (e) {
          clientA.close();
          clientB.close();
          reject(e);
        }
      });

      // 6. User A receives read receipt confirmation over WebSockets
      clientA.on('message_read', async (data) => {
        try {
          expect(data.messageId).toBe(testMsgId);

          // 7. Verification: User B reloads and fetches history from DB
          const historicalRecords = await fetchRoomEncryptedRecords(ROOM_ID, { limit: 10 });
          const found = historicalRecords.find((r) => r.id === testMsgId);
          expect(found).toBeDefined();

          if (found) {
            const historicalDecryptedStr = await decryptMessage(found.encryptedPayload, roomKey);
            const historicalParsed = JSON.parse(historicalDecryptedStr);
            expect(historicalParsed.text).toBe(plainMessageText);
          }

          clientA.close();
          clientB.close();
          resolve();
        } catch (e) {
          clientA.close();
          clientB.close();
          reject(e);
        }
      });
    });
  });
});

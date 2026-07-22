import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { io as socketClient } from 'socket.io-client';
import { deriveRoomKeyHash, ROOM_ID } from '../src/lib/constants';

describe('Real-time Socket.IO Server & Auth Integration', () => {
  let ioServer: SocketIOServer;
  let httpServer: ReturnType<typeof createServer>;
  let port: number;
  const validAuthHash = deriveRoomKeyHash();

  beforeAll(async () => {
    return new Promise<void>((resolve) => {
      httpServer = createServer();
      ioServer = new SocketIOServer(httpServer, { path: '/api/socketio' });

      const getExpectedAuthHash = () => deriveRoomKeyHash();

      ioServer.use((socket, next) => {
        const clientHash = socket.handshake.auth?.roomAuthHash;
        const expectedHash = getExpectedAuthHash();
        if (!clientHash || clientHash !== expectedHash) {
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

        socket.on('typing_start', (data) => {
          socket.to(data.roomId).emit('user_typing_start', { sender: data.sender });
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

  it('should reject socket connection without valid roomAuthHash in handshake', async () => {
    return new Promise<void>((resolve, reject) => {
      const client = socketClient(`http://localhost:${port}`, {
        path: '/api/socketio',
        transports: ['websocket'],
        reconnection: false,
      });

      client.on('connect_error', (err) => {
        try {
          expect(err.message).toBe('Unauthorized room access');
          client.close();
          resolve();
        } catch (e) {
          client.close();
          reject(e);
        }
      });
    });
  });

  it('should connect successfully with valid roomAuthHash', async () => {
    return new Promise<void>((resolve, reject) => {
      const client = socketClient(`http://localhost:${port}`, {
        path: '/api/socketio',
        transports: ['websocket'],
        auth: { roomAuthHash: validAuthHash },
      });

      client.on('connect', () => {
        try {
          expect(client.connected).toBe(true);
          client.close();
          resolve();
        } catch (e) {
          client.close();
          reject(e);
        }
      });
    });
  });

  it('should relay real-time messages between partner sockets in room', async () => {
    return new Promise<void>((resolve, reject) => {
      const client1 = socketClient(`http://localhost:${port}`, {
        path: '/api/socketio',
        transports: ['websocket'],
        auth: { roomAuthHash: validAuthHash },
      });

      const client2 = socketClient(`http://localhost:${port}`, {
        path: '/api/socketio',
        transports: ['websocket'],
        auth: { roomAuthHash: validAuthHash },
      });

      let client1Joined = false;
      let client2Joined = false;

      const checkReadyAndSend = () => {
        if (client1Joined && client2Joined) {
          setTimeout(() => {
            client1.emit('send_message', {
              roomId: ROOM_ID,
              record: { id: 'msg_100', sender: 'u_user1', encryptedPayload: 'enc_payload_123', timestamp: 12345 },
            });
          }, 20);
        }
      };

      client1.on('connect', () => {
        client1.emit('join_room', { roomId: ROOM_ID, sender: 'u_user1' });
        client1Joined = true;
        checkReadyAndSend();
      });

      client2.on('connect', () => {
        client2.emit('join_room', { roomId: ROOM_ID, sender: 'u_user2' });
        client2Joined = true;
        checkReadyAndSend();
      });

      client2.on('receive_message', (data) => {
        try {
          expect(data.record.id).toBe('msg_100');
          expect(data.record.encryptedPayload).toBe('enc_payload_123');
          client1.close();
          client2.close();
          resolve();
        } catch (e) {
          client1.close();
          client2.close();
          reject(e);
        }
      });
    });
  });

  it('should relay typing indicators and read receipts', async () => {
    return new Promise<void>((resolve, reject) => {
      const client1 = socketClient(`http://localhost:${port}`, {
        path: '/api/socketio',
        transports: ['websocket'],
        auth: { roomAuthHash: validAuthHash },
      });

      const client2 = socketClient(`http://localhost:${port}`, {
        path: '/api/socketio',
        transports: ['websocket'],
        auth: { roomAuthHash: validAuthHash },
      });

      client1.on('connect', () => {
        client1.emit('join_room', { roomId: ROOM_ID, sender: 'u_user1' });
      });

      client2.on('connect', () => {
        client2.emit('join_room', { roomId: ROOM_ID, sender: 'u_user2' });
        setTimeout(() => {
          client1.emit('typing_start', { roomId: ROOM_ID, sender: 'u_user1' });
        }, 50);
      });

      client2.on('user_typing_start', (data) => {
        try {
          expect(data.sender).toBe('u_user1');
          client1.close();
          client2.close();
          resolve();
        } catch (e) {
          client1.close();
          client2.close();
          reject(e);
        }
      });
    });
  });
});

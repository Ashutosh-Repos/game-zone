import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import next from 'next';
import { Server } from 'socket.io';

// Load .env.local into process.env before server initializes
if (existsSync('.env.local')) {
  try {
    const envFile = readFileSync('.env.local', 'utf8');
    envFile.split('\n').forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (!process.env[key]) process.env[key] = value.trim();
      }
    });
  } catch {
    // Ignore .env.local parse errors
  }
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// In production, restrict CORS to your deployed domain
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  : '*';

const app = next({ dev, hostname: 'localhost', port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
    },
    path: '/api/socketio',
  });

  // Simple inline 64-bit FNV-1a hash generator matching constants.ts
  const getExpectedAuthHash = () => {
    const key = process.env.NEXT_PUBLIC_SECRET_MASTER_KEY || 'e4d29f81a73b0c5e62f941088d37c5a2e9140b68d712f5a34e89201bc6f4831a';
    const FNV_OFFSET = BigInt('0xcbf29ce484222325');
    const FNV_PRIME = BigInt('0x100000001b3');
    const MASK_64 = BigInt('0xffffffffffffffff');
    let hash = FNV_OFFSET;
    for (let i = 0; i < key.length; i++) {
      hash ^= BigInt(key.charCodeAt(i));
      hash = (hash * FNV_PRIME) & MASK_64;
    }
    return hash.toString(36);
  };

  io.use((socket, next) => {
    const clientHash = socket.handshake.auth?.roomAuthHash || socket.handshake.query?.roomAuthHash;
    const expectedHash = getExpectedAuthHash();
    if (!clientHash || clientHash !== expectedHash) {
      console.warn(`[Socket Auth Warning] Rejecting connection: client sent "${clientHash}", expected "${expectedHash}"`);
      return next(new Error('Unauthorized room access'));
    }
    next();
  });

  // Track which rooms each socket is in (for disconnect cleanup)
  const socketRooms = new Map();

  io.on('connection', (socket) => {
    // Join secret chat room and handle presence
    socket.on('join_room', (data) => {
      const roomId = typeof data === 'string' ? data : data?.roomId;
      const sender = typeof data === 'object' ? data?.sender : null;
      socket.join(roomId);
      socketRooms.set(socket.id, { roomId, sender });

      // Notify other partners in room that a user joined
      if (sender) {
        socket.to(roomId).emit('user_presence', { sender, status: 'online' });
      }

      // Check current room members and inform joining user of online members
      const clientsInRoom = io.sockets.adapter.rooms.get(roomId);
      if (clientsInRoom && clientsInRoom.size > 1) {
        clientsInRoom.forEach((clientId) => {
          if (clientId !== socket.id) {
            const memberInfo = socketRooms.get(clientId);
            if (memberInfo && memberInfo.sender) {
              socket.emit('user_presence', { sender: memberInfo.sender, status: 'online' });
            } else {
              socket.emit('user_presence', { sender: 'partner', status: 'online' });
            }
          }
        });
      }
    });

    // Real-time message relay (<5ms WebSocket latency)
    socket.on('send_message', (data) => {
      if (data && data.roomId) {
        socket.to(data.roomId).emit('receive_message', data);
      }
    });

    socket.on('send_encrypted_record', (data) => {
      if (data && data.roomId && data.record) {
        socket.to(data.roomId).emit('receive_encrypted_record', data.record);
      }
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
      if (!data || !data.roomId) return;
      const info = socketRooms.get(socket.id);
      if (info) info.sender = data.sender;
      socket.to(data.roomId).emit('user_typing_start', { sender: data.sender });
    });

    socket.on('typing_stop', (data) => {
      if (!data || !data.roomId) return;
      socket.to(data.roomId).emit('user_typing_stop', { sender: data.sender });
    });

    // Read receipt relay — notify sender that partner read their message
    socket.on('read_receipt', (data) => {
      if (!data || !data.roomId) return;
      socket.to(data.roomId).emit('message_read', { messageId: data.messageId });
    });

    // Clean up typing indicator and presence status on disconnect
    socket.on('disconnect', () => {
      const info = socketRooms.get(socket.id);
      if (info && info.roomId) {
        const sender = info.sender || 'partner';
        socket.to(info.roomId).emit('user_presence', { sender, status: 'offline' });
        socket.to(info.roomId).emit('user_typing_stop', { sender });
      }
      socketRooms.delete(socket.id);
    });
  });

  const bindHost = process.env.PORT || process.env.NODE_ENV === 'production' ? '0.0.0.0' : hostname;
  httpServer.listen(port, bindHost, () => {
    console.log(`> Ready on http://${bindHost}:${port}`);
    console.log(`> Real-time Socket.IO Server active on /api/socketio`);
  });
});



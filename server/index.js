import express from 'express';
import http from 'node:http';
import cors from 'cors';
import { Server } from 'socket.io';
import { authenticate, createAccount, getLeaderboard, syncAccount } from './store.js';

const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// ================= REST API =================
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'carrom-pool-server', rooms: rooms.size });
});

app.post('/api/auth/register', (req, res) => {
  const { username, email, password, account } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }
  const result = createAccount({ username, email, password, account });
  res.status(result.ok ? 200 : 400).json(result);
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Missing credentials' });
  }
  const result = authenticate({ email, password });
  res.status(result.ok ? 200 : 401).json(result);
});

app.post('/api/auth/sync', (req, res) => {
  const { account } = req.body || {};
  res.json(syncAccount(account));
});

app.get('/api/leaderboard', (_req, res) => {
  res.json({ ok: true, entries: getLeaderboard() });
});

// ================= REALTIME PRIVATE ROOMS & MATCH SYNC =================
const rooms = new Map();

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

io.on('connection', (socket) => {
  socket.on('room:create', ({ format, mode, user }, ack) => {
    let code = generateCode();
    while (rooms.has(code)) code = generateCode();

    const slots =
      format === '2v2'
        ? [
            { team: 0, seatIndex: 0, player: { ...user, socketId: socket.id, isBot: false, isLocalHuman: false, isHost: true } },
            { team: 1, seatIndex: 1, player: null },
            { team: 0, seatIndex: 2, player: null },
            { team: 1, seatIndex: 3, player: null },
          ]
        : [
            { team: 0, seatIndex: 0, player: { ...user, socketId: socket.id, isBot: false, isLocalHuman: false, isHost: true } },
            { team: 1, seatIndex: 1, player: null },
          ];

    const room = {
      code,
      format,
      mode,
      isOnline: true,
      hostId: user.id,
      slots,
      chat: [],
    };
    rooms.set(code, room);
    socket.join(code);
    ack?.(room);
  });

  socket.on('room:join', ({ code, user }, ack) => {
    const clean = String(code || '').trim().toUpperCase();
    const room = rooms.get(clean);
    if (!room) {
      return ack?.({ ok: false, error: 'Room code not found' });
    }
    const emptySlot = room.slots.find((s) => !s.player);
    if (!emptySlot) {
      return ack?.({ ok: false, error: 'Room is full' });
    }
    emptySlot.player = { ...user, socketId: socket.id, isBot: false, isLocalHuman: false, isHost: false };
    socket.join(clean);
    io.to(clean).emit('room:updated', room);
    ack?.({ ok: true, room });
  });

  socket.on('room:chat', ({ code, sender, text }) => {
    const room = rooms.get(code);
    if (!room) return;
    const msg = { id: `${Date.now()}`, sender, text: String(text).slice(0, 120), ts: Date.now() };
    room.chat.push(msg);
    io.to(code).emit('room:updated', room);
  });

  socket.on('room:start', ({ code, matchConfig }) => {
    const room = rooms.get(code);
    if (!room) return;
    io.to(code).emit('match:started', matchConfig);
  });

  socket.on('match:slider', (payload) => {
    socket.to(payload.roomCode).emit('match:slider', payload);
  });

  socket.on('match:shoot', (payload) => {
    socket.to(payload.roomCode).emit('match:shoot', payload);
  });

  socket.on('match:chat', (payload) => {
    socket.to(payload.roomCode).emit('match:chat', payload);
  });

  socket.on('disconnect', () => {
    for (const [code, room] of rooms.entries()) {
      let changed = false;
      for (const slot of room.slots) {
        if (slot.player && slot.player.socketId === socket.id) {
          slot.player = null;
          changed = true;
        }
      }
      if (changed) {
        const remaining = room.slots.filter((s) => s.player && !s.player.isBot).length;
        if (remaining === 0) {
          rooms.delete(code);
        } else {
          io.to(code).emit('room:updated', room);
        }
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`[Carrom Pool Server] Running on http://localhost:${PORT}`);
});
